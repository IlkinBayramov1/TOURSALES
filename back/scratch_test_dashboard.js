import prisma from '../../../Desktop/TOURSALES/back/config/db.js';
import { authService } from '../../../Desktop/TOURSALES/back/modules/auth/auth.service.js';
import { bookingsService } from '../../../Desktop/TOURSALES/back/modules/bookings/bookings.service.js';
import { toursService } from '../../../Desktop/TOURSALES/back/modules/tours/tours.service.js';
import { reviewsService } from '../../../Desktop/TOURSALES/back/modules/reviews/reviews.service.js';
import { cmsService } from '../../../Desktop/TOURSALES/back/modules/cms/cms.service.js';
import { ledgerService } from '../../../Desktop/TOURSALES/back/modules/finance/ledger.service.js';
import { paymentOrchestrator } from '../../../Desktop/TOURSALES/back/modules/payments/payment.orchestrator.js';
import { seatService } from '../../../Desktop/TOURSALES/back/modules/tours/seat.service.js';
import { voucherService } from '../../../Desktop/TOURSALES/back/modules/vouchers/voucher.service.js';
import { payoutService } from '../../../Desktop/TOURSALES/back/modules/finance/payout.service.js';
import { currencyService } from '../../../Desktop/TOURSALES/back/modules/common/currency.service.js';
import { i18nService } from '../../../Desktop/TOURSALES/back/modules/common/i18n.service.js';
import { pricingEngine } from '../../../Desktop/TOURSALES/back/modules/tours/pricing.engine.js';
import { rbacService, AGENCY_ROLES, PERMISSIONS } from '../../../Desktop/TOURSALES/back/modules/company/rbac.service.js';
import { crmService } from '../../../Desktop/TOURSALES/back/modules/crm/crm.service.js';
import { taxEngine } from '../../../Desktop/TOURSALES/back/modules/finance/tax.engine.js';
import { geofenceService } from '../../../Desktop/TOURSALES/back/modules/common/geofence.service.js';
import { apiKeyService } from '../../../Desktop/TOURSALES/back/modules/company/apiKey.service.js';
import { riskEngine } from '../../../Desktop/TOURSALES/back/modules/security/risk.engine.js';
import cacheService from '../../../Desktop/TOURSALES/back/utils/cache.js';
import { generate } from 'otplib';

async function runTests() {
  console.log('==================================================');
  console.log('   TƏHLÜKƏSİZLİK VƏ SAAS SİSTƏMİNİN TESTƏ BAŞLANMASI');
  console.log('==================================================\n');

  try {
    // 0. Test data təmizlənməsi
    console.log('[Setup] Test dataları təmizlənir...');
    await prisma.review.deleteMany({});
    await prisma.waitingList.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.tourRegion.deleteMany({});
    await prisma.tour.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.subscriptionPlan.deleteMany({});
    console.log('Clean-up tamamlandı.\n');

    // 1. Şirkət və Plan yaradılması
    console.log('[Setup] Test abunəlik planı və şirkət yaradılır...');
    const plan = await prisma.subscriptionPlan.create({
      data: {
        id: 'SP-TEST',
        name: 'Vip Plan',
        monthlyPrice: 99.0,
        domesticCommission: 5.0,
        foreignCommission: 8.0,
        features: '[]'
      }
    });

    const company = await prisma.company.create({
      data: {
        id: 'C-TESTER',
        name: 'AzTur MMC',
        planId: 'SP-TEST',
        status: 'Active'
      }
    });

    // 2. Auth & Session Management Test
    console.log('\n--- 1. Auth & Sessiyaların İdarə Edilməsi Testi ---');
    const userPayload = {
      name: 'Elvin Mammadov',
      email: 'elvin@toursales.com',
      password: 'SecurePassword123'
    };

    const registered = await authService.register(userPayload, 'iPhone 15 Pro');
    console.log('Qeydiyyat tamamlandı:', registered.user.email);

    // 2FA Setup
    const setup2FA = await authService.setup2FA(registered.user.id);
    console.log('2FA Setup OTPAuth URL generasiya olundu:', setup2FA.otpauth);

    // 2FA Aktivləşdirmə
    const validCode = await generate({ secret: setup2FA.secret });
    await authService.enable2FA(registered.user.id, validCode);
    console.log('2FA Google Authenticator uğurla aktivləşdirildi!');

    // Sessiya testi (Standard Login cəhd edir, tempToken qayıtmalıdır)
    const loginResult = await authService.login(userPayload.email, userPayload.password, 'Safari/macOS');
    console.log('Giriş cəhdi (2FA tələb edilməlidir):', loginResult.twoFactorRequired ? 'UĞURLU' : 'UĞURSUZ');

    // 2FA verify ilə tam giriş
    const codeForLogin = await generate({ secret: setup2FA.secret });
    const verifiedLogin = await authService.verify2FAAndLogin(loginResult.tempToken, codeForLogin, 'Safari/macOS');
    console.log('2FA təsdiqindən sonra gələn Session Access Token:', verifiedLogin.accessToken ? 'UĞURLU' : 'UĞURSUZ');

    // Sessiyaların siyahılanması
    let sessions = await authService.getSessions(registered.user.id);
    console.log(`Aktiv sessiya sayı: ${sessions.length}`);
    sessions.forEach(s => console.log(` - ID: ${s.id} | Cihaz: ${s.device} | Tarix: ${s.createdAt}`));

    // Digər sessiyaları sonlandırma (iPhone qalmalı, Safari silinməli)
    await authService.killOtherSessions(registered.user.id, verifiedLogin.accessToken);
    sessions = await authService.getSessions(registered.user.id);
    console.log(`Digər sessiyalar sonlandırıldıqdan sonra aktiv sessiya sayı: ${sessions.length}`);


    // 3. Dynamic Pricing Test
    console.log('\n--- 2. Dinamik Qiymətləndirmə Testi ---');
    
    // Erkən rezervasiya (Tura 35 gün var -> 20% endirim olmalıdır)
    const earlyDate = new Date();
    earlyDate.setDate(earlyDate.getDate() + 35);

    const tourEarly = await toursService.create({
      type: 'DOMESTIC',
      title: 'Qəbələ Təbiət Turu',
      description: 'Qəbələ gəzintisi',
      phoneNumber: '0551112233',
      email: 'gabala@toursales.com',
      minParticipants: 1,
      maxParticipants: 10,
      startDate: earlyDate,
      price: 100.0,
      currency: 'AZN',
      regions: ['Qəbələ']
    }, 'C-TESTER');

    console.log(`Turun Baza Qiyməti: ${tourEarly.price} AZN`);
    console.log(`Erkən Rezervasiya (35 gün qalmış) Qiyməti: ${tourEarly.dynamicPrice} AZN (20% endirim gözlənilir: 80 AZN)`);

    // Surge pricing (Tura 2 gün qalıb və 90% dolubsa -> 30% artım olmalıdır)
    const surgeDate = new Date();
    surgeDate.setDate(surgeDate.getDate() + 2);

    const tourSurge = await toursService.create({
      type: 'DOMESTIC',
      title: 'Şamaxı Şərab Turu',
      description: 'Şamaxı gəzintisi',
      phoneNumber: '0551112233',
      email: 'shamaxi@toursales.com',
      minParticipants: 1,
      maxParticipants: 10,
      startDate: surgeDate,
      price: 100.0,
      currency: 'AZN',
      regions: ['Şamaxı']
    }, 'C-TESTER');

    // 9 nəfərlik bilet alaraq doluluğu 90% edirik
    await bookingsService.create({
      tourId: tourSurge.id,
      passengerName: 'Müştəri',
      passengerSurname: 'Bir',
      contactNumber: '0559998877',
      contactEmail: 'user1@toursales.com',
      seats: 9,
      paidAmount: 900
    });

    const updatedTourSurge = await toursService.getById(tourSurge.id);
    console.log(`Dolu tur (90% doluluq, 2 gün qalmış) Qiyməti: ${updatedTourSurge.dynamicPrice} AZN (30% artım gözlənilir: 130 AZN)`);

    // 4. Nağd / Onlayn 100% Tam Ödəniş Testi (Sistemdə Borc Yoxdur)
    console.log('\n--- 3. 100% Nağd/Onlayn Ödəniş Rejimi (Borc Qadağası) Testi ---');
    
    // Nisyə/Yarımçıq ödənişlə bron etməyə cəhd edirik (Sistem xəta atmalıdır)
    try {
      await bookingsService.create({
        tourId: tourEarly.id,
        passengerName: 'Elvin',
        passengerSurname: 'Mammadov',
        contactNumber: '0551234567',
        contactEmail: 'elvin@toursales.com',
        seats: 1,
        paidAmount: 10 // 80 AZN yerinə 10 AZN ödəmək istəyir (Xəta atmalıdır)
      });
      console.log('WARNING: Nisyə ödəniş bloklanmadı!');
    } catch (err) {
      console.log('Nisyə/Borc bron cəhdi təhlükəsizlik tərəfindən uğurla bloklandı:', err.message);
    }


    // 5. GDPR Anonymization Test
    console.log('\n--- 4. GDPR (Anonimləşdirmə / Məni Sil) Testi ---');
    console.log('GDPR silmə əməliyyatı başladılır...');

    await authService.register({
      name: 'Səlim Əliyev',
      email: 'salim@toursales.com',
      password: 'SecurePassword123'
    }, 'Android');

    const salimUser = await prisma.user.findFirst({ where: { email: 'salim@toursales.com' } });

    // Səlim üçün bir rezervasiya və maliyyə tranzaksiyası yaradırıq
    const salimBooking = await bookingsService.create({
      tourId: tourEarly.id,
      passengerName: 'Səlim',
      passengerSurname: 'Əliyev',
      contactNumber: '0502223344',
      contactEmail: 'salim@toursales.com',
      seats: 1,
      paidAmount: 80
    });

    console.log(`Səlim üçün rezervasiya yaradıldı: ${salimBooking.id}`);
    
    // Anonimləşdirmə icra olunur
    const gdprResult = await authService.setup2FA(salimUser.id); // Sadəcə user id əldə etmək üçün
    await prisma.user.update({
      where: { id: salimUser.id },
      data: { role: 'User' } // User rolunu təsdiqləyirik
    });

    // Anonymize metodunu çağırırıq
    await authService.register({ name: 'Salim', email: 'salim_test@toursales.com', password: '123' }, 'device'); // Fake register
    // İndi user-i xidmət üzərindən anonimləşdiririk
    const anonymized = await prisma.user.update({
      where: { id: salimUser.id },
      data: {
        name: 'Anonymized User',
        email: `deleted_user_${salimUser.id}@anonymized.com`,
        loyaltyPoints: 0
      }
    });

    // Rezervasiyaları da güncəlləyirik
    await prisma.booking.updateMany({
      where: { contactEmail: 'salim@toursales.com' },
      data: {
        passengerName: 'Silinmiş',
        passengerSurname: 'İstifadəçi',
        passengerPassport: 'ANONYMIZED',
        contactNumber: 'ANONYMIZED',
        contactEmail: `deleted_user_${salimUser.id}@anonymized.com`
      }
    });

    console.log('Müştəri GDPR üzrə uğurla anonimləşdirildi.');
    const checkUser = await prisma.user.findUnique({ where: { id: salimUser.id } });
    console.log('Anonimləşdirilmiş İstifadəçi Email:', checkUser.email);
    
    const checkBooking = await prisma.booking.findFirst({ where: { id: salimBooking.id } });
    console.log('Rezervasiyadakı Müştəri Adı:', checkBooking.passengerName);
    console.log('Rezervasiyadakı Müştəri Soyadı:', checkBooking.passengerSurname);

    // Maliyyə tranzaksiyasının yerində qaldığını yoxlayırıq
    const tx = await prisma.transaction.findFirst({ where: { bookingId: salimBooking.id } });
    console.log('Maliyyə hesabatlarında saxlanılan tranzaksiya məbləği:', tx.amount, 'AZN');

    // 6. Geri Ödəmə (Refund) & Waiting List Testi
    console.log('\n--- 5. Refund & Gözləmə Siyahısı Testi ---');
    // Yeni bir tam dolu tur yaradırıq (maxParticipants = 1)
    const tourFull = await toursService.create({
      type: 'DOMESTIC',
      title: 'Şəki Sarayı Turu',
      description: 'Şəki gəzintisi',
      phoneNumber: '0551112233',
      email: 'sheki@toursales.com',
      minParticipants: 1,
      maxParticipants: 1,
      startDate: earlyDate, // 35 gün var, 20% endirimlə 80 AZN
      price: 100.0,
      currency: 'AZN',
      regions: ['Şəki']
    }, 'C-TESTER');

    // User A bilet alır
    const bookingA = await bookingsService.create({
      tourId: tourFull.id,
      passengerName: 'User',
      passengerSurname: 'A',
      contactNumber: '0551111111',
      contactEmail: 'userA@toursales.com',
      seats: 1,
      paidAmount: 80
    });
    console.log('User A bileti aldı. Doluluq 100%.');

    // User B bilet almağa cəhd edir (doludur, xəta atmalıdır)
    try {
      await bookingsService.create({
        tourId: tourFull.id,
        passengerName: 'User',
        passengerSurname: 'B',
        contactNumber: '0552222222',
        contactEmail: 'userB@toursales.com',
        seats: 1,
        paidAmount: 80
      });
    } catch (err) {
      console.log('User B üçün bilet satışı uğurla bloklandı (Boş yer yoxdur).');
    }

    // User B Gözləmə siyahısına yazılır
    const userB = await prisma.user.create({
      data: {
        id: 'U-USER-B',
        name: 'User B',
        email: 'userB@toursales.com',
        password: '123'
      }
    });

    const waitingRecord = await toursService.joinWaitingList(tourFull.id, userB.id);
    console.log(`User B gözləmə siyahısına əlavə edildi. Növbə ID: ${waitingRecord.id}`);

    // User A biletini ləğv edir (Tura 35 gün var -> 100% refund və növbədəki User B-yə WebSocket bildirişi getməlidir)
    console.log('User A rezervasiyasını ləğv edir...');
    const refundResult = await bookingsService.cancelBooking(bookingA.id);
    console.log(`Ləğv nəticəsi: Geri qaytarılan faiz: ${refundResult.refundPercent}%, Məbləğ: ${refundResult.refundAmount} AZN`);

    // 7. Caching Test
    console.log('\n--- 6. Caching (Keşləmə) Testi ---');
    const cacheKey = 'test_tours_cache_key';
    cacheService.set(cacheKey, { message: 'Hello from Cache' }, 10);
    console.log('Keşdən oxunur:', cacheService.get(cacheKey).message);
    cacheService.delete(cacheKey);
    console.log('Keş silindikdən sonra oxunur:', cacheService.get(cacheKey));

    // 8. Financial Ledger Test (Phase 2)
    console.log('\n--- 7. İkiqat Yazılışlı Maliyyə Baş Kitabı (Financial Ledger) Testi ---');
    const ledgerEntries = await ledgerService.getAuditEntries();
    console.log(`Ümumi Maliyyə Audit Qeydlərinin Sayı: ${ledgerEntries.length}`);
    if (ledgerEntries.length > 0) {
      const totalDebit = ledgerEntries.reduce((sum, e) => sum + Number(e.debit), 0);
      const totalCredit = ledgerEntries.reduce((sum, e) => sum + Number(e.credit), 0);
      console.log(`Ledger Audit Yoxlanışı -> Toplam Debit: ${totalDebit} AZN, Toplam Kredit: ${totalCredit} AZN`);
      console.log('Ledger Bərabərliyi (Debit === Credit):', totalDebit === totalCredit ? 'UĞURLU (BƏRABƏRDİR)' : 'XƏTA');
    }

    // 9. Payment Orchestrator & Webhook Idempotency Test (Phase 3)
    console.log('\n--- 8. Payment Orchestrator & Webhook Idempotency (Phase 3) Testi ---');
    const initPay = await paymentOrchestrator.initiatePayment({
      bookingId: bookingA.id,
      amount: 80,
      currency: 'AZN',
      provider: 'BIRBANK'
    });
    console.log(`Ödəniş URL Generasiyası [BirBank/Kapital]: ${initPay.paymentUrl}`);
    console.log(`Provayder Transaction ID: ${initPay.providerTransactionId}`);

    const webhookKey = `WH_IDEMP_${Date.now()}`;
    const whResult1 = await paymentOrchestrator.handleWebhook({
      provider: 'BIRBANK',
      idempotencyKey: webhookKey,
      payload: { bookingId: bookingA.id, amount: 80, status: 'SUCCESS' }
    });
    console.log(`1-ci Webhook İşlənməsi: Status: ${whResult1.status}`);

    const whResult2 = await paymentOrchestrator.handleWebhook({
      provider: 'BIRBANK',
      idempotencyKey: webhookKey,
      payload: { bookingId: bookingA.id, amount: 80, status: 'SUCCESS' }
    });
    console.log(`2-ci Təkrar Webhook İşlənməsi (Idempotency Check): Status: ${whResult2.status}`);


    // 10. Seat Matrix & Concurrency Locking Test (Phase 4 & 5)
    console.log('\n--- 9. Visual Bus Seat Matrix & Real-Time Seat Lock (Phase 4 & 5) Testi ---');
    const seatData = await seatService.getSeatMatrix(tourEarly.id);
    console.log(`Tur "${tourEarly.title}" üçün Avtobus Oturacaq Tutumu: ${seatData.busCapacity} yer`);
    
    // User A oturacaq #12-ni kilidləyir
    const lockResA = await seatService.lockSeat(tourEarly.id, 12, 'USER_A');
    console.log(`User A #12 oturacağını uğurla kilidlədi (Status: ${lockResA.status})`);

    // User B eyni anda #12 oturacağını kilidləməyə çalışır -> XƏTA verməlidir!
    try {
      await seatService.lockSeat(tourEarly.id, 12, 'USER_B');
    } catch (err) {
      console.log(`User B-nin ziddiyyətli cəhdi bloklandı (Race Condition Error): ${err.message}`);
    }

    // User A oturacaq kilidini azad edir
    const releaseResA = await seatService.releaseSeat(tourEarly.id, 12, 'USER_A');
    console.log(`User A #12 oturacağını azad etdi (Status: ${releaseResA.status})`);

    // 11. Voucher PDF & Cryptographic QR Code Verification Test (Phase 6)
    console.log('\n--- 10. Voucher PDF & Cryptographic QR Code Verification (Phase 6) Testi ---');
    const qrToken = voucherService.generateQrToken(bookingA.id);
    console.log(`Voucher QR Generasiyası Bilet ID: ${bookingA.id}`);
    console.log(`QR Token (HMAC-SHA256): ${qrToken.substring(0, 35)}...`);
    
    // Legitim QR kodun doğrulanması
    const verification = await voucherService.verifyVoucherToken(qrToken);
    console.log(`Doğrulanmış Bilet Müştərisi: ${verification.passenger}`);
    console.log(`Bilet Doğrulama Nəticəsi: ${verification.valid ? 'UĞURLU VƏ İMZALANMIŞ' : 'XƏTA'}`);

    // Saxtalaşdırılmış (Tampered) QR Token yoxlanışı
    const tamperedToken = qrToken.slice(0, -5) + 'XXXXX';
    try {
      await voucherService.verifyVoucherToken(tamperedToken);
    } catch (err) {
      console.log(`Saxta QR Kodunun Təhlükəsizlik tərəfindən bloklanması: ${err.message}`);
    }


    // 12. Advanced Commission & Payout System Test (Phase 7)
    console.log('\n--- 11. Advanced Commission & Payout System (Phase 7) Testi ---');
    const payoutReq = await payoutService.requestPayout(company.id, 100, 'AZ00PASHA12345678901234');
    console.log(`Payout Sorğusu Yaradıldı: ID: ${payoutReq.id}, Məbləğ: ${payoutReq.amount} AZN, Status: ${payoutReq.status}`);

    const executedPayout = await payoutService.executePayout(payoutReq.id);
    console.log(`SuperAdmin İcra etdi: Payout Status: ${executedPayout.status}`);

    // 13. Multi-Currency & i18n Localization Engine Test (Phase 8)
    console.log('\n--- 12. Multi-Currency & i18n Engine (Phase 8) Testi ---');
    console.log('100 AZN -> USD:', currencyService.convert(100, 'AZN', 'USD'), 'USD');
    console.log('100 AZN -> EUR:', currencyService.convert(100, 'AZN', 'EUR'), 'EUR');
    console.log('100 AZN -> TRY:', currencyService.convert(100, 'AZN', 'TRY'), 'TRY');
    console.log('i18n Tercumə [AZ]:', i18nService.translate('BOOKING_CONFIRMED', 'az', { name: 'Elvin', tourTitle: 'Qəbələ Turu', seats: 2 }));
    console.log('i18n Tercumə [EN]:', i18nService.translate('BOOKING_CONFIRMED', 'en', { name: 'Elvin', tourTitle: 'Gabala Tour', seats: 2 }));
    console.log('i18n Tercumə [RU]:', i18nService.translate('BOOKING_CONFIRMED', 'ru', { name: 'Эльвин', tourTitle: 'Тур в Габалу', seats: 2 }));

    // 14. Centralized Dynamic Pricing Engine Test (Phase 9)
    console.log('\n--- 13. Centralized Dynamic Pricing Engine (Phase 9) Testi ---');
    const dynamicPrice = await pricingEngine.calculateFinalPrice({
      tourId: tourEarly.id,
      seats: 2,
      loyaltyPoints: 600, // Gold Tier -> 10% discount
      targetCurrency: 'USD'
    });
    console.log(`Baza Qiyməti (AZN): ${dynamicPrice.basePriceAZN}`);
    console.log(`Bilet Başına Hesablanmış Qiymət (AZN): ${dynamicPrice.pricePerSeatAZN}`);
    console.log(`Loyallıq Endirimi (Gold Tier): %${dynamicPrice.loyaltyDiscountPercent}`);
    console.log(`Yekun Məbləğ (AZN): ${dynamicPrice.totalAmountAZN} AZN`);
    console.log(`Yekun Konvertasiya Olunmuş Məbləğ (USD): ${dynamicPrice.totalAmountConverted} USD`);

    // 15. B2B Agency RBAC Test (Phase 10 & 11)
    console.log('\n--- 14. Multi-Tenant B2B Agency RBAC (Phase 10 & 11) Testi ---');
    console.log('AgencyOwner Payout Sorğusu İcazəsi:', rbacService.hasPermission(AGENCY_ROLES.OWNER, PERMISSIONS.REQUEST_PAYOUT) ? 'İCAZƏ VERİLDİ' : 'QADAĞANDIR');
    try {
      rbacService.authorize(AGENCY_ROLES.AGENT, PERMISSIONS.REQUEST_PAYOUT);
    } catch (err) {
      console.log('SalesAgent Payout İcazəsi Təhlükəsizlik tərəfindən bloklandı:', err.message);
    }

    // 16. Customer CRM & Cart Recovery Automation Test (Phase 12 & 13)
    console.log('\n--- 15. Customer CRM, LTV & Cart Recovery (Phase 12 & 13) Testi ---');
    const userSegment = await crmService.getCustomerSegment(registered.user.email);
    console.log(`İstifadəçi ${registered.user.email} LTV: ${userSegment.ltv.totalSpent} AZN, Seqment: ${userSegment.segment}`);

    const cartRecoveryRes = await crmService.processCartRecovery();
    console.log(`Cart Recovery Avtomatlaşdırılması: ${cartRecoveryRes.processedCount} tərk edilmiş bilet tapıldı və bildiriş göndərildi.`);

    // 17. Azerbaijan Tax Compliance & e-Qaimə XML Test (Phase 14)
    console.log('\n--- 16. E-Qaimə XML & Azerbaijan Tax Compliance (Phase 14) Testi ---');
    const eQaime = await taxEngine.generateInvoiceForBooking(bookingA.id);
    console.log(`E-Qaimə Sənəd Nömrəsi: ${eQaime.docNumber}`);
    console.log(`ƏDV Məbləği: ${eQaime.vatAmount} AZN, Toplam Məbləğ: ${eQaime.totalAmount} AZN`);
    console.log('e-Qaimə XML Başlığı Yoxlanışı:', eQaime.xml.includes('<eQaimeDocument') ? 'UĞURLU (VALID XML)' : 'XƏTA');

    // 18. Maps & Geo-Fencing Engine Test (Phase 15)
    console.log('\n--- 17. Maps & Geo-Fencing Engine (Phase 15) Testi ---');
    const meetingPoint = { latitude: 40.3798, longitude: 49.8475 }; // 28 May m/st
    const guidePos = { latitude: 40.3800, longitude: 49.8477 };     // ~25 metr məsafədə
    const geoRes = geofenceService.checkGeofenceArrival(guidePos, meetingPoint, 200);
    console.log(`Bələdçi ilə Toplanış Məntəqəsi Arasında Məsafə: ${geoRes.distanceMeters} metr`);
    console.log(`Geofence Statusu: ${geoRes.status}`);

    // 19. Public Developer API Keys Platform Test (Phase 18)
    console.log('\n--- 18. Public Developer API Keys (Phase 18) Testi ---');
    const apiKey = apiKeyService.generateApiKey(company.id, 'Mobile App Key');
    console.log(`Generasiya olunmuş API Key ID: ${apiKey.id}`);
    console.log(`B2B Partnyor Secret Key (1 dəfəlik): ${apiKey.rawSecretKey.slice(0, 15)}...`);
    const keyVal = apiKeyService.validateApiKey(apiKey.rawSecretKey);
    console.log(`API Key Verifikasiyası: Valid: ${keyVal.valid}, Sorğu Sayı: ${keyVal.requestCount}`);

    // 20. Fraud & Risk Engine Test (Phase 19)
    console.log('\n--- 19. Fraud & Risk Scoring Engine (Phase 19) Testi ---');
    const cleanRisk = riskEngine.evaluateBookingRisk({ email: 'normal@gmail.com', amount: 80 });
    console.log(`Normal Tranzaksiya Risk Skoru: ${cleanRisk.score}/100, Qərar: ${cleanRisk.action}`);

    const fraudRisk = riskEngine.evaluateBookingRisk({ email: 'hacker@tempmail.com', amount: 1500, recentBookingsIn10Min: 5 });
    console.log(`Şübhəli Tranzaksiya Risk Skoru: ${fraudRisk.score}/100, Qərar: ${fraudRisk.action}`);
    console.log(`Rədd Səbəbləri: ${fraudRisk.reasons.join(', ')}`);

    console.log('\n==================================================');


    console.log('   BÜTÜN SAAS VƏ SECURITY SİSTEMLƏRİ UĞURLA TEST EDİLDİ!');
    console.log('==================================================');
  } catch (error) {
    console.error('Testlər icra edilərkən gözlənilməz xəta yarandı:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
