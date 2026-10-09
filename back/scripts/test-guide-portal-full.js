import prisma from '../config/db.js';
import bookingsService from '../modules/bookings/bookings.service.js';

async function runGuidePortalFullTest() {
  console.log('\n======================================================');
  console.log('🚀 BƏLƏDÇİ PORTALI (GUIDE PORTAL) TAM İNTEQRASİYA TESTİ');
  console.log('======================================================\n');

  try {
    // 1. Şirkət və Tur seçimi və ya təyin edilməsi
    const company = await prisma.company.findFirst({
      where: { deletedAt: null }
    });
    if (!company) {
      throw new Error('Heç bir şirkət tapılmadı!');
    }
    console.log(`[Suite 1] Şirkət: "${company.name}" (ID: ${company.id})`);

    // Şirkət üçün Bələdçi/İşçi heyətinin siyahısını yoxlayırıq
    const guides = await bookingsService.getCompanyGuides(company.id);
    console.log(`[Suite 2] getCompanyGuides: ${guides.length} bələdçi/əməkdaş tapıldı`);
    if (guides.length > 0) {
      console.log(`          Bələdçi nümunəsi: ${guides[0].name} (${guides[0].email})`);
    }

    // Mövcud tur və ya test üçün tur tapırıq
    let tour = await prisma.tour.findFirst({
      where: { companyId: company.id, deletedAt: null },
      include: { bookings: true }
    });

    if (!tour) {
      tour = await prisma.tour.create({
        data: {
          id: `T-${Math.floor(100000 + Math.random() * 900000)}`,
          companyId: company.id,
          title: 'Şahdağ Qış Əyləncəsi & Xizək Turu',
          type: 'DOMESTIC',
          price: 50.0,
          startDate: new Date(Date.now() + 86400000),
          busCapacity: 20,
          busPlateNumber: '10-AA-001',
          driverName: 'Rəşad Əliyev',
          driverPhone: '+994503332211',
          meetingPointAddress: '28 May m/s, Dəmiryol Vağzalı qarşısı',
          departureNotes: 'Toplanış saat 06:30-da'
        },
        include: { bookings: true }
      });
    }
    console.log(`[Suite 3] Tur: "${tour.title}" (ID: ${tour.id})`);

    // 2. Bələdçi və Avtobus təyinatını yoxlayırıq (assignGuideToTour)
    const testGuideId = guides.length > 0 ? guides[0].id : null;
    const assignResult = await bookingsService.assignGuideToTour(
      tour.id,
      {
        guideId: testGuideId,
        driverName: 'Kamran Məmmədov',
        driverPhone: '+994507778899',
        busPlateNumber: '99-BK-999',
        meetingPointAddress: 'Gənclik m/s, Caspian Shopping qarşısı',
        departureNotes: 'Zəhmət olmasa sənədlərinizi hazır saxlayın'
      },
      company.id
    );

    if (assignResult.busPlateNumber !== '99-BK-999' || assignResult.driverName !== 'Kamran Məmmədov') {
      throw new Error('assignGuideToTour avtobus və ya sürücü məlumatlarını düzgün yeniləmədi!');
    }
    console.log(`[Suite 4] ✅ assignGuideToTour uğurla icra olundu: Avtobus=${assignResult.busPlateNumber}, Sürücü=${assignResult.driverName}`);

    // 3. Ən azı 2 sərnişin bronu olsun: biri tam ödənilmiş, biri isə qalıq borclu
    let bookings = await prisma.booking.findMany({
      where: { tourId: tour.id, deletedAt: null }
    });

    if (bookings.length < 2) {
      // Bron 1: Borclu sərnişin (totalAmount: 100, paidAmount: 40, remainingBalance: 60)
      const b1 = await prisma.booking.create({
        data: {
          id: `TR-${Math.floor(100000 + Math.random() * 900000)}`,
          userId: company.ownerId || (await prisma.user.findFirst()).id,
          tourId: tour.id,
          companyId: company.id,
          type: 'TOUR',
          status: 'CONFIRMED',
          paymentStatus: 'PARTIAL',
          totalAmount: 100.0,
          paidAmount: 40.0,
          currency: 'AZN',
          guestName: 'Elvin Qasımov (Borclu)',
          guestPhone: '+994501112233',
          qrToken: `QR-DEBT-${Math.floor(100000 + Math.random() * 900000)}`,
          items: {
            create: [
              {
                seatNumber: 1,
                seatType: 'STANDARD',
                price: 100.0,
                guestName: 'Elvin Qasımov (Borclu)',
                guestPhone: '+994501112233'
              }
            ]
          }
        }
      });

      // Bron 2: Tam ödənilmiş sərnişin (totalAmount: 50, paidAmount: 50, remainingBalance: 0)
      const b2 = await prisma.booking.create({
        data: {
          id: `TR-${Math.floor(100000 + Math.random() * 900000)}`,
          userId: company.ownerId || (await prisma.user.findFirst()).id,
          tourId: tour.id,
          companyId: company.id,
          type: 'TOUR',
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          totalAmount: 50.0,
          paidAmount: 50.0,
          currency: 'AZN',
          guestName: 'Aytən Məmmədova (Ödənilib)',
          guestPhone: '+994509998877',
          qrToken: `QR-PAID-${Math.floor(100000 + Math.random() * 900000)}`,
          items: {
            create: [
              {
                seatNumber: 2,
                seatType: 'STANDARD',
                price: 50.0,
                guestName: 'Aytən Məmmədova (Ödənilib)',
                guestPhone: '+994509998877'
              }
            ]
          }
        }
      });
    }

    // 4. Manifesti yükləyirik və maliyyə/borc hesablamalarını yoxlayırıq
    const manifest = await bookingsService.getGuideManifest(tour.id, company.id);
    console.log(`[Suite 5] ✅ getGuideManifest uğurla alındı:`);
    console.log(`          Cəmi Sərnişin: ${manifest.stats.totalBookedSeats}`);
    console.log(`          Mindirilib: ${manifest.stats.checkedInCount}`);
    console.log(`          Gözlənilir: ${manifest.stats.pendingCount}`);
    console.log(`          Toplam Gəlir: ${manifest.stats.totalRevenue} AZN`);
    console.log(`          Qalıq Borc Məbləği: ${manifest.stats.totalDebtAmount} AZN`);
    console.log(`          Borclu Sərnişin Sayı: ${manifest.stats.debtorCount}`);

    if (manifest.stats.totalDebtAmount === undefined || manifest.stats.debtorCount === undefined) {
      throw new Error('Manifest statistikasında totalDebtAmount və ya debtorCount sahələri mövcud deyil!');
    }

    // Sərnişinlərdə borc sahələrini yoxlayırıq
    const debtor = manifest.passengers.find((p) => p.hasRemainingDebt);
    if (debtor) {
      console.log(`          Borclu sərnişin detayı: ${debtor.fullName} -> Qalıq: ${debtor.remainingBalance} AZN (${debtor.paidAmount}/${debtor.totalAmount} AZN)`);
    }

    // 5. Kütləvi Minik (bulkCheckIn) Testi
    const bulkRes = await bookingsService.bulkCheckIn(tour.id, null, { id: 'TEST-USER' }, company.id);
    console.log(`[Suite 6] ✅ bulkCheckIn uğurla icra olundu: ${bulkRes.checkedInCount} sərnişin minik qeydiyyatından keçirildi`);

    // Yenidən manifesti yoxlayırıq: pendingCount 0 olmalıdır
    const manifestAfterBulk = await bookingsService.getGuideManifest(tour.id, company.id);
    if (manifestAfterBulk.stats.pendingCount !== 0) {
      throw new Error(`bulkCheckIn sonra pendingCount 0 olmalı idi, amma ${manifestAfterBulk.stats.pendingCount} qaldı!`);
    }
    console.log(`          Yoxlanış: Mindirildi = ${manifestAfterBulk.stats.checkedInCount}, Gözlənilir = ${manifestAfterBulk.stats.pendingCount} (100% minik)`);

    // 6. Təkrar Minik Statusu Dəyişməsi (toggleGuideCheckIn)
    const targetPassenger = manifestAfterBulk.passengers[0];
    const toggleRes = await bookingsService.toggleGuideCheckIn(
      targetPassenger.bookingId,
      targetPassenger.seatNumber,
      { id: 'TEST-USER' }
    );
    console.log(`[Suite 7] ✅ toggleGuideCheckIn: Sərnişin ${targetPassenger.fullName} statusu dəyişdirildi -> isCheckedIn=${toggleRes.isCheckedIn}`);

    // 7. QR Kod ilə Minik Skanı (scanQrCheckIn)
    if (targetPassenger.qrToken) {
      const qrScanRes = await bookingsService.scanQrCheckIn(
        targetPassenger.qrToken,
        tour.id,
        { id: 'TEST-USER' }
      );
      console.log(`[Suite 8] ✅ scanQrCheckIn: verified=${qrScanRes.verified}, isDuplicate=${qrScanRes.isDuplicate}`);
    }

    // 8. Excel Eksport (exportGuideManifest)
    const excelBuffer = await bookingsService.exportGuideManifest(tour.id, company.id);
    if (!excelBuffer || excelBuffer.length < 500) {
      throw new Error('exportGuideManifest etibarlı Excel buffer yaratmadı!');
    }
    console.log(`[Suite 9] ✅ exportGuideManifest: Uğurlu Excel faylı yaradıldı (Ölçü: ${excelBuffer.length} bayt)`);

    console.log('\n======================================================');
    console.log('🎉 BÜTÜN 9 YOX LAMA SUİTİ UĞURLA TAMAMLANDI! (100% PASS)');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST XƏTASI:', err);
    process.exit(1);
  }
}

runGuidePortalFullTest();
