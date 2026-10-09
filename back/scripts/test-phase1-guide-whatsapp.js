import prisma from '../config/db.js';
import bookingsService from '../modules/bookings/bookings.service.js';
import whatsappProvider from '../modules/notifications/whatsapp.provider.js';

async function runPhase1Tests() {
  console.log('\n======================================================');
  console.log('🚀 FAZA 1: BƏLƏDÇİ MANİFEST & WHATSAPP İNTEQRASİYA TESTİ');
  console.log('======================================================\n');

  try {
    // 1. Mövcud və ya test turunu tapırıq
    let tour = await prisma.tour.findFirst({
      where: { deletedAt: null },
      include: {
        bookings: { where: { deletedAt: null } },
        company: true
      }
    });

    if (!tour) {
      console.log('Tur tapılmadı, yeni test turu yaradılır...');
      const company = await prisma.company.findFirst() || await prisma.company.create({
        data: {
          id: `C-${Math.floor(100000 + Math.random() * 900000)}`,
          name: 'AzTour Test Agentliyi'
        }
      });

      tour = await prisma.tour.create({
        data: {
          id: `T-${Math.floor(100000 + Math.random() * 900000)}`,
          companyId: company.id,
          type: 'DOMESTIC',
          title: 'Quba-Qusar Payız Bələdçi Sınaq Turu',
          description: 'Faza 1 bələdçi manifest testi',
          price: 35.0,
          startDate: new Date(Date.now() + 86400000), // sabah
          busCapacity: 48,
          busPlateNumber: '99-JH-777',
          driverName: 'Səxavət Quliyev',
          driverPhone: '+994501234567',
          departureNotes: 'Gənclik m/s çıxışı, Caspian Shopping qarşısı'
        },
        include: { company: true, bookings: true }
      });
    }

    console.log(`[1/7] Test Turu: "${tour.title}" (ID: ${tour.id})`);
    console.log(`     Avtobus: ${tour.busPlateNumber || '99-XX-000'} | Sürücü: ${tour.driverName || 'Təyin olunub'}`);

    // 2. Test sərnişin bronu yaradırıq (əgər yoxdursa və ya qrToken boşdursa)
    let booking = await prisma.booking.findFirst({
      where: { tourId: tour.id, deletedAt: null, qrToken: { not: null } }
    });

    if (!booking) {
      const bId = `TR-${Math.floor(100000 + Math.random() * 900000)}`;
      const qrToken = `QR-TEST-${Math.floor(100000 + Math.random() * 900000)}`;
      booking = await prisma.booking.create({
        data: {
          id: bId,
          tourId: tour.id,
          companyId: tour.companyId,
          passengerName: 'Kənan',
          passengerSurname: 'Rəhimov',
          contactNumber: '+994509998877',
          contactEmail: 'kenan.test@toursales.az',
          seats: 2,
          busSeatNumber: '14',
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paidAmount: 70.0,
          remainingAmount: 0.0,
          totalAmount: 70.0,
          qrToken,
          isCheckedIn: false,
          passengersData: JSON.stringify([
            { seatNumber: 14, fullName: 'Kənan Rəhimov', phone: '+994509998877', finCode: '5XYZ123', isCheckedIn: false },
            { seatNumber: 15, fullName: 'Aynur Rəhimova', phone: '+994509998877', finCode: '6ABC456', isCheckedIn: false }
          ])
        }
      });
    }

    console.log(`\n[2/7] Test Bilet: ${booking.id} | QR Token: ${booking.qrToken}`);
    console.log(`     Sərnişinlər: ${booking.passengerName} ${booking.passengerSurname} (Oturacaqlar: ${booking.busSeatNumber})`);

    // 3. Bələdçi turlarının siyahısını yoxlayırıq
    const guideTours = await bookingsService.getGuideTours('guide_user_1', tour.companyId, 'GUIDE');
    console.log(`\n[3/7] Bələdçi Turları Gətirildi: ${guideTours.length} tur tapıldı.`);
    const matchedTour = guideTours.find(t => t.id === tour.id);
    if (!matchedTour) throw new Error('Bələdçi turlarında test turu tapılmadı!');
    console.log(`     ✓ Tur başlığı: ${matchedTour.title}`);
    console.log(`     ✓ Tutum: ${matchedTour.busCapacity} yer | Dolu yerlər: ${matchedTour.totalBookedSeats} | Minik: ${matchedTour.checkedInCount}`);

    // 4. Bələdçi sərnişin manifestini və avtobus sxemini yoxlayırıq
    const manifest = await bookingsService.getGuideManifest(tour.id, tour.companyId);
    console.log(`\n[4/7] Sərnişin Manifesti Gətirildi:`);
    console.log(`     ✓ Ümumi sərnişin sayı: ${manifest.passengers.length}`);
    console.log(`     ✓ Avtobus oturacaq sayı: ${manifest.seatMap.length}`);
    console.log(`     ✓ Tərəqqi: ${manifest.stats.checkedInCount} / ${manifest.stats.totalBookedSeats} (${manifest.stats.progressPercentage}%)`);

    const seat14 = manifest.seatMap.find(s => s.seatNumber === 14);
    console.log(`     ✓ Oturacaq #14 statusu: ${seat14?.status} (${seat14?.passenger?.fullName})`);

    // 5. Kamera ilə QR Skan Minik Qeydiyyatı
    console.log(`\n[5/7] QR Kod Skan Təsdiqi Yoxlanılır...`);
    // Əvvəlcə sıfırlayırıq ki təmiz test olsun
    let resetPassData = null;
    if (booking.passengersData) {
      try {
        const parsed = JSON.parse(booking.passengersData);
        resetPassData = JSON.stringify(parsed.map(p => ({ ...p, isCheckedIn: false })));
      } catch (e) {}
    }
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        isCheckedIn: false,
        checkedInAt: null,
        checkedInBy: null,
        passengersData: resetPassData || booking.passengersData
      }
    });

    const scanRes = await bookingsService.scanQrCheckIn(
      { qrToken: booking.qrToken, tourId: tour.id },
      'guide_123',
      'Elmir Bələdçi',
      tour.companyId
    );
    console.log(`     ✓ Skan Nəticəsi: ${scanRes.success ? 'UĞURLU' : 'UĞURSUZ'}`);
    console.log(`     ✓ Təsdiqlənən sərnişinlər: ${scanRes.passengerNames.join(', ')}`);
    console.log(`     ✓ Minik vaxtı: ${scanRes.checkedInAt} (Bələdçi: ${scanRes.checkedInBy})`);

    if (!scanRes.success) throw new Error('QR kod skan edilmədi!');

    // Təkrar skan yoxlanışı (Duplicate Protection)
    const duplicateRes = await bookingsService.scanQrCheckIn(
      { qrToken: booking.qrToken, tourId: tour.id },
      'guide_123',
      'Elmir Bələdçi',
      tour.companyId
    );
    console.log(`     ✓ Təkrar Skan Qorunması: ${duplicateRes.isDuplicate ? 'İŞLƏDİ (Bloklandı)' : 'XƏTA'}`);
    console.log(`     ✓ Mesaj: "${duplicateRes.message}"`);
    if (!duplicateRes.isDuplicate) throw new Error('Təkrar skan bloklanmadı!');

    // 6. Əl ilə minik statusunun dəyişdirilməsi (Toggle)
    console.log(`\n[6/7] Əl ilə Minik Statusunun Dəyişdirilməsi (Toggle) Yoxlanılır...`);
    const toggleRes = await bookingsService.toggleGuideCheckIn(
      booking.id,
      14,
      'guide_123',
      'Elmir Bələdçi',
      tour.companyId
    );
    console.log(`     ✓ Oturacaq #14 yeni statusu: isCheckedIn = ${toggleRes.isCheckedIn}`);

    // 7. WhatsApp Bildiriş Şablonları və Delivery Log
    console.log(`\n[7/7] WhatsApp Bildiriş Mühərriki Sınaqdan Keçirilir...`);
    const waRes = await whatsappProvider.sendBookingConfirmation(booking, tour);
    console.log(`     ✓ WhatsApp Bilet Təsdiqi Göndərildi (Simulyasiya): logId = ${waRes.logId}`);

    const waRemind24 = await whatsappProvider.sendDepartureReminder24h(booking, tour);
    console.log(`     ✓ WhatsApp 24 Saat Xatırlatması Göndərildi: logId = ${waRemind24.logId}`);

    const waRemind2h = await whatsappProvider.sendDepartureReminder2h(booking, tour);
    console.log(`     ✓ WhatsApp 2 Saat Avtobus Anonsu Göndərildi: logId = ${waRemind2h.logId}`);

    // Logların bazada qeydə alınmasını yoxlayırıq
    const logs = await prisma.notificationDeliveryLog.findMany({
      where: { bookingId: booking.id },
      orderBy: { sentAt: 'desc' },
      take: 3
    });
    console.log(`     ✓ Bazada saxlanılmış bildiriş sayı: ${logs.length}`);
    logs.forEach(l => {
      console.log(`       - [${l.channel}] ${l.templateName} -> ${l.recipient} (Status: ${l.status})`);
    });

    if (logs.length < 3) throw new Error('NotificationDeliveryLog-da qeydlər tam deyil!');

    console.log('\n======================================================');
    console.log('🎉 FAZA 1 BÜTÜN BACKEND VƏ WHATSAPP TESTLƏRİ 100% UĞURLA KEÇDİ!');
    console.log('======================================================\n');

  } catch (error) {
    console.error('\n❌ SINAQ ZAMANI XƏTA BAŞ VERDİ:', error);
    process.exit(1);
  }
}

runPhase1Tests().then(() => {
  process.exit(0);
});
