/**
 * FAZA 2 İNTEQRASİYA TESTİ
 * FinTech Taksitləri (Birkart, Tamkart, Bolkart) + 30/70 Depozit və Qalıq Ödəniş Gateway-i
 */

import prisma from '../config/db.js';
import { detectCardBin, calculateInstallmentSchedule } from '../utils/bin-detector.js';
import bookingsService from '../modules/bookings/bookings.service.js';
import paymentOrchestrator from '../modules/payments/payment.orchestrator.js';

async function runPhase2Tests() {
  console.log('====================================================');
  console.log('  TOURSALES FAZA 2: FINTECH & DEPOZİT İNTEQRASİYA TESTİ');
  console.log('====================================================\n');

  let passedTests = 0;
  const totalTests = 7;

  try {
    // ----------------------------------------------------
    // TEST 1: BIN Detektor Aşkarlaması (Birkart, Tamkart, Bolkart, Standart)
    // ----------------------------------------------------
    console.log('--- TEST 1: Kart BIN Detektoru və Taksit Şəbəkələri ---');
    const birkartRes = detectCardBin('4169730012345678');
    const tamkartRes = detectCardBin('4028601122334455');
    const bolkartRes = detectCardBin('4183429988776655');
    const standardRes = detectCardBin('4000001234567890');

    if (
      birkartRes.bankCode === 'KAPITAL' &&
      birkartRes.isInstallment &&
      tamkartRes.bankCode === 'ABB' &&
      tamkartRes.isInstallment &&
      bolkartRes.bankCode === 'BANK_OF_BAKU' &&
      !standardRes.isInstallment
    ) {
      console.log('✔ UĞURLU: Bütün yerli bank kartları (Birkart, Tamkart, Bolkart) və standart kartlar dəqiq aşkarlandı.');
      passedTests++;
    } else {
      throw new Error('BIN aşkarlama testi uğursuz oldu.');
    }

    // ----------------------------------------------------
    // TEST 2: Taksit Cədvəli və Aylıq Məbləğ Kalkulyatoru
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Faizsiz Taksit Kalkulyasiyası ---');
    const schedule = calculateInstallmentSchedule(600, [2, 3, 6, 12]);
    const m3 = schedule.find(s => s.months === 3);
    const m6 = schedule.find(s => s.months === 6);

    if (m3.monthlyPayment === 200 && m6.monthlyPayment === 100 && schedule.length === 4) {
      console.log(`✔ UĞURLU: 600 AZN üçün taksit cədvəli dəqiq bölündü (3 ay: ${m3.formattedMonthly}, 6 ay: ${m6.formattedMonthly}).`);
      passedTests++;
    } else {
      throw new Error('Taksit kalkulyatoru səhv hesabladı.');
    }

    // ----------------------------------------------------
    // TEST 3: Mövcud Aktiv Tur Tapılması və ya Yaradılması
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Test üçün Tur və FinTech Konfiqurasiyası ---');
    let testTour = await prisma.tour.findFirst({
      where: { status: 'Active', deletedAt: null },
      include: { company: true }
    });

    if (!testTour) {
      throw new Error('Test üçün aktiv tur tapılmadı.');
    }

    // Turu FinTech və depozit aktiv olaraq yeniləyirik
    testTour = await prisma.tour.update({
      where: { id: testTour.id },
      data: {
        allowInstallments: true,
        maxInstallmentMonths: 12,
        allowDeposit: true,
        depositPercentage: 30.0,
        depositDueDaysBefore: 5,
        price: 150.0000
      },
      include: { company: true }
    });

    console.log(`✔ UĞURLU: Tur ${testTour.id} ("${testTour.title}") FinTech (30% Depozit, 5 gün əvvəl) ilə konfiqurasiya edildi.`);
    passedTests++;

    // ----------------------------------------------------
    // TEST 4: 30/70 Depozitli Rezervasiyanın Yaradılması
    // ----------------------------------------------------
    console.log('\n--- TEST 4: 30% Depozit Rezervasiyasının Yaradılması ---');
    const uniqueEmail = `fintech_tester_${Date.now()}@toursales.az`;
    const createdBooking = await bookingsService.create({
      tourId: testTour.id,
      seats: 2,
      passengerName: 'Kamran',
      passengerSurname: 'Məmmədov',
      contactNumber: '+994509998877',
      contactEmail: uniqueEmail,
      paymentStatus: 'PENDING',
      paymentType: 'DEPOSIT',
      installmentMonths: 1,
      installmentCardType: 'BIRKART',
      seatNumbers: [15, 16],
      passengers: [
        { seatNumber: 15, fullName: 'Kamran Məmmədov', phone: '+994509998877' },
        { seatNumber: 16, fullName: 'Nigar Məmmədova', phone: '+994509998878' }
      ]
    });

    const expectedTotal = Number(testTour.price) * 2; // 300 AZN
    const expectedRemaining = expectedTotal; // PENDING olduğu üçün hələ 300 AZN

    if (
      createdBooking.paymentType === 'DEPOSIT' &&
      createdBooking.balanceToken &&
      createdBooking.depositDueDate &&
      Number(createdBooking.totalAmount) === expectedTotal
    ) {
      console.log(`✔ UĞURLU: Depozit rezervasiyası TR ID: ${createdBooking.id} yaradıldı.`);
      console.log(`   - Ümumi: ${createdBooking.totalAmount} AZN, Token: ${createdBooking.balanceToken.substring(0, 10)}...`);
      console.log(`   - Son Ödəniş Tarixi: ${new Date(createdBooking.depositDueDate).toLocaleDateString('az-AZ')}`);
      passedTests++;
    } else {
      throw new Error('Depozit rezervasiyası yaradıla bilmədi.');
    }

    // ----------------------------------------------------
    // TEST 5: İlkin 30% Depozitin Ödənilməsi Simulyasiyası
    // ----------------------------------------------------
    console.log('\n--- TEST 5: 30% Depozit Ödənişi Simulyasiyası ---');
    const depositAmount = (expectedTotal * 30) / 100; // 90 AZN
    await paymentOrchestrator.simulatePaymentSuccess({
      bookingId: createdBooking.id,
      paymentType: 'DEPOSIT',
      amount: depositAmount
    });

    const partiallyPaidBooking = await prisma.booking.findUnique({
      where: { id: createdBooking.id }
    });

    if (
      partiallyPaidBooking.paymentStatus === 'PARTIALLY_PAID' &&
      Number(partiallyPaidBooking.paidAmount) === depositAmount &&
      Number(partiallyPaidBooking.remainingAmount) === (expectedTotal - depositAmount) &&
      partiallyPaidBooking.depositPaidAt !== null
    ) {
      console.log(`✔ UĞURLU: 30% Depozit (${depositAmount} AZN) ödənildi!`);
      console.log(`   - Status: ${partiallyPaidBooking.paymentStatus}`);
      console.log(`   - Qalıq Məbləğ: ${partiallyPaidBooking.remainingAmount} AZN (70%)`);
      passedTests++;
    } else {
      throw new Error('Depozit ödənişi statusu PARTIALLY_PAID olmadı.');
    }

    // ----------------------------------------------------
    // TEST 6: Qalıq Ödənişin Tamamlanması (70% Balance Payment)
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Qalıq 70% Ödənişin Tamamlanması ---');
    const remainingAmountToPay = Number(partiallyPaidBooking.remainingAmount);
    await paymentOrchestrator.simulatePaymentSuccess({
      bookingId: createdBooking.id,
      paymentType: 'BALANCE',
      amount: remainingAmountToPay
    });

    const fullyPaidBooking = await prisma.booking.findUnique({
      where: { id: createdBooking.id }
    });

    if (
      fullyPaidBooking.paymentStatus === 'PAID' &&
      Number(fullyPaidBooking.paidAmount) === expectedTotal &&
      Number(fullyPaidBooking.remainingAmount) === 0 &&
      fullyPaidBooking.balancePaidAt !== null
    ) {
      console.log(`✔ UĞURLU: Qalıq 70% (${remainingAmountToPay} AZN) ödənildi və rezervasiya tam təsdiqləndi!`);
      console.log(`   - Status: ${fullyPaidBooking.paymentStatus}`);
      console.log(`   - Ödənilən Məbləğ: ${fullyPaidBooking.paidAmount} AZN, Qalıq: ${fullyPaidBooking.remainingAmount} AZN`);
      passedTests++;
    } else {
      throw new Error('Qalıq ödəniş tamamlanmadı və ya status PAID olmadı.');
    }

    // ----------------------------------------------------
    // TEST 7: Manual və Avtomatik WhatsApp Xatırlatması
    // ----------------------------------------------------
    console.log('\n--- TEST 7: WhatsApp Xatırlatma Mexanizmi ---');
    // Test məqsədilə statusu müvəqqəti qalıq borclu edib yoxlayaq
    await prisma.booking.update({
      where: { id: createdBooking.id },
      data: { paymentStatus: 'PARTIALLY_PAID', remainingAmount: 90.0 }
    });

    const notifResult = await bookingsService.sendBalanceReminderWhatsApp(createdBooking.id);
    if (notifResult && (notifResult.success || notifResult.status === 'SENT')) {
      console.log(`✔ UĞURLU: Qalıq ödəniş linki müştəriyə WhatsApp ilə göndərildi (Log ID: ${notifResult.logId})`);
      passedTests++;
    } else {
      throw new Error('WhatsApp xatırlatması göndərilə bilmədi.');
    }

    // Təmizlik
    await prisma.booking.update({
      where: { id: createdBooking.id },
      data: { paymentStatus: 'PAID', remainingAmount: 0.0 }
    });

    console.log('\n====================================================');
    console.log(`  BÜTÜN TESTLƏR TAMAMLANDI: ${passedTests}/${totalTests} UĞURLU`);
    console.log('====================================================');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST XƏTASI:', err.message);
    process.exit(1);
  }
}

runPhase2Tests();
