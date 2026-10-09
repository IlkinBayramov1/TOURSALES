import prisma from '../config/db.js';
import { customToursService } from '../modules/custom-tours/custom-tours.service.js';

async function runPhase5Tests() {
  console.log('====================================================');
  console.log('  TOURSALES FAZA 5: FƏRDİ TURLAR VƏ B2B TENDER TESTİ');
  console.log('====================================================\n');

  try {
    // 0. Ensure base companies and user exist
    let company1 = await prisma.company.findFirst({ where: { status: 'Active' } });
    if (!company1) {
      company1 = await prisma.company.create({
        data: {
          id: 'C-' + Math.floor(100000 + Math.random() * 900000),
          name: 'Caspian VIP Tours LLC',
          status: 'Active',
          phoneNumber: '+994125554433',
          rating: 4.9,
        },
      });
    }

    let company2 = await prisma.company.findFirst({
      where: { status: 'Active', id: { not: company1.id } },
    });
    if (!company2) {
      company2 = await prisma.company.create({
        data: {
          id: 'C-' + Math.floor(100000 + Math.random() * 900000),
          name: 'Silk Way Travel Agency',
          status: 'Active',
          phoneNumber: '+994124443322',
          rating: 4.7,
        },
      });
    }

    let user = await prisma.user.findFirst({ where: { role: 'User' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'U-' + Math.floor(100000 + Math.random() * 900000),
          email: `tender_tester_${Date.now()}@example.com`,
          password: 'hashed_password',
          name: 'Elvin Məmmədov',
          phoneNumber: '+994508887766',
          role: 'User',
        },
      });
    }

    // --- TEST 1: Canlı Qiymət Təxmini Kalkulyatoru ---
    console.log('--- TEST 1: Canlı Qiymət Təxmini Kalkulyatoru ---');
    const estimate = await customToursService.calculateEstimate({
      startDate: new Date(),
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 3 gün
      adultsCount: 4,
      childrenCount: 2,
      vehicleType: 'MINIVAN_MERCEDES_VITO_7',
      hotelPreference: 'HOTEL_4_STAR',
      mealPreference: 'HALF_BOARD',
      guideRequired: true,
      guideLanguage: 'AZ',
      attractions: ['Tufandağ Kanat', 'Şəki Xan Sarayı'],
    });

    console.log(`✔ UĞURLU: Qiymət hesablandı: ${estimate.estimatedMin} - ${estimate.estimatedMax} AZN`);
    console.log(`   - Müddət: ${estimate.durationDays} gün / ${estimate.nights} gecə`);
    console.log(`   - Nəqliyyat: ${estimate.breakdown.vehicle} AZN | Otel: ${estimate.breakdown.hotel} AZN | Yemək: ${estimate.breakdown.meal} AZN\n`);

    if (estimate.estimatedMin <= 0 || estimate.durationDays < 2) {
      throw new Error('Kalkulyator hesablama xətası!');
    }

    // --- TEST 2: Yeni Fərdi Tur Sorğusunun Yaradılması ---
    console.log('--- TEST 2: Yeni Fərdi Tur Sorğusunun Yaradılması ---');
    const customRequest = await customToursService.createCustomRequest(user.id, {
      type: 'FAMILY',
      title: 'Qəbələ & Şəki 3 Günlük Ailəvi VIP İstirahət',
      destinations: ['Qəbələ', 'Şəki'],
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      adultsCount: 4,
      childrenCount: 2,
      vehicleType: 'MINIVAN_MERCEDES_VITO_7',
      hotelPreference: 'HOTEL_4_STAR',
      mealPreference: 'HALF_BOARD',
      guideRequired: true,
      guideLanguage: 'AZ',
      attractions: ['Tufandağ Kanat', 'Şəki Xan Sarayı'],
      budgetMin: 800,
      budgetMax: 1400,
      specialNotes: 'Uşaqlar üçün avtomobildə uşaq oturacağı vacibdir.',
    });

    console.log(`✔ UĞURLU: Fərdi tur sorğusu yaradıldı: ${customRequest.requestNumber} (ID: ${customRequest.id})`);
    console.log(`   - Status: ${customRequest.status}`);
    console.log(`   - Sərnişin sayı: ${customRequest.totalPassengers} nəfər\n`);

    // --- TEST 3: Tender Masasında Sorğunun Görünməsi ---
    console.log('--- TEST 3: Tender Masasında Sorğunun Görünməsi ---');
    const board = await customToursService.getTenderBoard(company1.id, {
      destination: 'Qəbələ',
    });
    const foundInBoard = board.find((r) => r.id === customRequest.id);
    if (!foundInBoard) {
      throw new Error('Yeni sorğu agentlik tender masasında tapılmadı!');
    }
    console.log(`✔ UĞURLU: Tender agentlik masasında aşkarlandı: "${foundInBoard.title}"`);
    console.log(`   - Hələlik təklif sayı: ${foundInBoard.bidsCount}\n`);

    // --- TEST 4: Birinci Agentlik Tərəfindən Təklif Verilməsi ---
    console.log('--- TEST 4: Birinci Agentlik Tərəfindən Təklif Verilməsi (Company 1) ---');
    const bid1 = await customToursService.submitBid(company1.id, customRequest.id, {
      offeredPrice: 1150,
      itineraryProgram: '1-ci gün: Bakı-Qəbələ transfer, Nohurgöl gəzintisi. 2-ci gün: Tufandağ və Şəki Xan Sarayı. 3-cü gün: Dönüş.',
      includedServices: ['Mercedes Vito 2023 VIP', '4* Qafqaz Riverside Hotel (2 otaq)', 'Səhər və Şam yeməyi', 'Peşəkar Bələdçi'],
      excludedServices: ['Spirtli içkilər', 'Şəxsi xərclər'],
      vehicleDetails: '2023 Mercedes Vito VIP, dəri salon, Wi-Fi, kondisioner, uşaq oturacağı',
      hotelDetails: 'Qafqaz Riverside Resort Hotel 4*, 2 ədəd Superior otaq',
      vendorNotes: 'Ailə üçün ən yüksək komfort təmin ediləcək.',
      validDays: 3,
    });

    console.log(`✔ UĞURLU: Təklif 1 qəbul edildi: ${bid1.bidNumber} (${bid1.offeredPrice} AZN)`);
    console.log(`   - Şirkət: ${bid1.company?.name}`);
    console.log(`   - Adambaşı: ${bid1.pricePerPerson.toFixed(1)} AZN\n`);

    // --- TEST 5: İkinci Agentlik Tərəfindən Alternativ Təklif Verilməsi ---
    console.log('--- TEST 5: İkinci Agentlik Tərəfindən Alternativ Təklif (Company 2) ---');
    const bid2 = await customToursService.submitBid(company2.id, customRequest.id, {
      offeredPrice: 1020,
      itineraryProgram: '1-ci gün: Qəbələ kanat və atçılıq. 2-ci gün: Şəki Karvansaray və Halva dequstasiyası. 3-cü gün: İsmayıllı Lahıc.',
      includedServices: ['Mercedes Vito Extra Long', 'Marxal Resort 4* otel', 'Səhər yeməyi', 'Bələdçi'],
      excludedServices: ['Nahar və şam yeməyi'],
      vehicleDetails: '2022 Mercedes Vito Extra Long, qara rəng',
      hotelDetails: 'Marxal Resort & Spa 4*',
      vendorNotes: 'Bütün attraksion növbələrində VIP keçid.',
      validDays: 2,
    });

    console.log(`✔ UĞURLU: Təklif 2 qəbul edildi: ${bid2.bidNumber} (${bid2.offeredPrice} AZN)`);
    console.log(`   - Şirkət: ${bid2.company?.name}\n`);

    // --- TEST 6: Müştərinin Təklifləri İcmalı və Qalib Təklifin Seçilməsi ---
    console.log('--- TEST 6: Müştərinin Qalib Təklifi Seçməsi (Accept Winning Bid) ---');
    const acceptedRequest = await customToursService.acceptBid(customRequest.id, bid1.id, user.id);

    console.log(`✔ UĞURLU: Qalib təklif seçildi!`);
    console.log(`   - Qalib Bid ID: ${acceptedRequest.acceptedBidId}`);
    console.log(`   - Yeni Sorğu Statusu: ${acceptedRequest.status}\n`);

    // --- TEST 7: Digər Təkliflərin Avtomatik Rədd Edilməsinin Yoxlanışı ---
    console.log('--- TEST 7: Digər Təkliflərin Avtomatik Rədd Edilməsinin Yoxlanışı ---');
    const refreshedBid2 = await prisma.customTourBid.findUnique({ where: { id: bid2.id } });
    const refreshedBid1 = await prisma.customTourBid.findUnique({ where: { id: bid1.id } });

    console.log(`✔ UĞURLU: Təklif 1 statusu: ${refreshedBid1.status} (Gözlənən: ACCEPTED)`);
    console.log(`✔ UĞURLU: Təklif 2 statusu: ${refreshedBid2.status} (Gözlənən: REJECTED)\n`);

    if (refreshedBid1.status !== 'ACCEPTED' || refreshedBid2.status !== 'REJECTED') {
      throw new Error('Təklif statuslarının avtomatik tənzimlənməsində xəta!');
    }

    // --- TEST 8: 30% Depozit Ödənişi və Fərdi Tur Vauçerinin Generasiyası ---
    console.log('--- TEST 8: 30% Depozit Ödənişi və Fərdi Tur Vauçerinin Generasiyası ---');
    const booking = await customToursService.checkoutBooking(customRequest.id, bid1.id, user.id, {
      paymentType: 'DEPOSIT_30',
    });

    console.log(`✔ UĞURLU: Fərdi tur bronu yaradıldı: ${booking.bookingNumber} (ID: ${booking.id})`);
    console.log(`   - Ümumi Məbləğ: ${booking.totalAmount} AZN`);
    console.log(`   - Ödənilən İlkin 30%: ${booking.paidAmount} AZN`);
    console.log(`   - Qalıq Məbləğ: ${booking.balanceAmount} AZN`);
    console.log(`   - QR Vauçer Kodu: ${booking.voucherCode}`);
    console.log(`   - Ödəniş Statusu: ${booking.paymentStatus}\n`);

    console.log('====================================================');
    console.log('  BÜTÜN TESTLƏR TAMAMLANDI: 8/8 UĞURLU (100% KEÇDİ)');
    console.log('====================================================');
  } catch (error) {
    console.error('❌ TEST XƏTASI:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase5Tests();
