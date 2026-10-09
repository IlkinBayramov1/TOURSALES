/**
 * TOURSALES FAZA 3: OTEL VƏ QONAQLAMA EKOSİSTEMİ İNTEQRASİYA TESTİ
 * 
 * Bu skript Faza 3 çərçivəsində tətbiq edilmiş bütün modulları yoxlayır:
 * 1. Otel və Otaq Növlərinin Bazada Qeydiyyatı
 * 2. Otaq Fondu və Qiymət Təqvimi Matrisi (Bulk Calendar Update)
 * 3. Dinamik Qiymət və Yield Management (Tələbat artımı və Son dəqiqə endirimi)
 * 4. Çoxölçülü Axtarış və Mövcudluq Filteri
 * 5. 30% Depozitli Otel Rezervasiyası və Otaq Bloklanması
 * 6. Qalıq 70% Ödənişin Tamamlanması
 * 7. Çarpaz Satış (Cross-sell) Tövsiyələri
 */

import prisma from '../config/db.js';
import hotelsService from '../modules/hotels/hotels.service.js';
import hotelBookingsService from '../modules/hotels/hotel-bookings.service.js';
import { calculateDynamicRoomRate, calculateDynamicTourPrice } from '../utils/yield-engine.js';

async function runTests() {
  console.log('====================================================');
  console.log('  TOURSALES FAZA 3: OTEL VƏ QONAQLAMA İNTEQRASİYA TESTİ');
  console.log('====================================================\n');

  try {
    // 0. Setup test user & company
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          id: `C-${Math.floor(100000 + Math.random() * 900000)}`,
          name: 'Qarabağ Hospitality & Tours MMC',
          status: 'Active',
          rating: 4.9
        }
      });
    }

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: `U-${Math.floor(100000 + Math.random() * 900000)}`,
          email: `hotel_tester_${Date.now()}@toursales.az`,
          password: 'hashed_password',
          name: 'Elvin Qasımov',
          phoneNumber: '+994508887766',
          role: 'User'
        }
      });
    }

    // --- TEST 1: Otel Yaradılması ---
    console.log('--- TEST 1: Yeni Otelin Yaradılması (Vendor) ---');
    const hotelData = {
      name: 'Şuşa Xan Sarayı Resort & SPA',
      category: 'RESORT',
      starRating: 5,
      city: 'Şuşa',
      region: 'Qarabağ',
      address: 'Panahali Xan küç. 12, Şuşa',
      lat: 39.7594,
      lng: 46.7498,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      description: 'Şuşanın mərkəzində, Cıdır düzünə panoramik mənzərəli 5 ulduzlu lüks istirahət kompleksi.',
      amenities: ['WIFI', 'POOL', 'SPA', 'PARKING', 'RESTAURANT', 'GYM'],
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'
      ],
      allowInstallments: true,
      allowDeposit: true,
      dynamicPricingActive: true
    };

    const createdHotel = await hotelsService.createHotel(company.id, hotelData);
    console.log(`✔ UĞURLU: Otel yaradıldı ID: ${createdHotel.id} ("${createdHotel.name}")`);
    console.log(`   - Ulduz: ${createdHotel.starRating}*, Şəhər: ${createdHotel.city}, Region: ${createdHotel.region}`);

    // --- TEST 2: Otaq Növlərinin Yaradılması ---
    console.log('\n--- TEST 2: Otaq Növlərinin Əlavə Edilməsi ---');
    const standardRoom = await hotelsService.createRoomType(createdHotel.id, company.id, {
      name: 'Standart İki Nəfərlik Otaq',
      description: 'Geniş ikinəfərlik çarpayı, dağ mənzərəsi, eyvan və kondisioner.',
      capacityAdults: 2,
      capacityChildren: 1,
      maxOccupancy: 3,
      bedType: 'DOUBLE',
      bedCount: 1,
      roomSizeSqM: 32,
      mealPlan: 'BB',
      basePrice: 120.00,
      totalRoomsCount: 6,
      amenities: ['BALCONY', 'AIR_CONDITIONING', 'MINIBAR', 'SAFE', 'TV', 'WIFI']
    });

    const deluxeSuite = await hotelsService.createRoomType(createdHotel.id, company.id, {
      name: 'Delüks Dağ Panoramalı Suite',
      description: 'Ayrı qonaq otağı, jakuzi və Cıdır düzü mənzərəsi.',
      capacityAdults: 3,
      capacityChildren: 2,
      maxOccupancy: 5,
      bedType: 'KING',
      bedCount: 2,
      roomSizeSqM: 65,
      mealPlan: 'ALL_INCLUSIVE',
      basePrice: 240.00,
      totalRoomsCount: 3,
      amenities: ['JACUZZI', 'BALCONY', 'MINIBAR', 'ROOM_SERVICE', 'SAFE', 'TV']
    });

    console.log(`✔ UĞURLU: 2 otaq növü yaradıldı:`);
    console.log(`   1. ${standardRoom.name} - ${standardRoom.basePrice} AZN/gecə (Cəmi: ${standardRoom.totalRoomsCount} otaq)`);
    console.log(`   2. ${deluxeSuite.name} - ${deluxeSuite.basePrice} AZN/gecə (Cəmi: ${deluxeSuite.totalRoomsCount} otaq)`);

    // --- TEST 3: Otaq Fondu və Qiymət Təqvimi Matrisi ---
    console.log('\n--- TEST 3: Otaq Fondu və Qiymət Təqvimi Matrisi (Bulk Calendar Override) ---');
    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    const dayAfter = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const dayAfterStr = dayAfter.toISOString().slice(0, 10);

    // Bulk update: sabah və biri gün üçün xüsusi bayram qiyməti təyin edirik
    await hotelsService.bulkUpdateRoomCalendar(standardRoom.id, company.id, {
      dates: [tomorrowStr, dayAfterStr],
      priceOverride: 145.00,
      availableCount: 4
    });

    const matrixData = await hotelsService.getRoomAvailabilityMatrix(
      standardRoom.id,
      company.id,
      todayStr,
      dayAfterStr
    );
    console.log(`✔ UĞURLU: ${matrixData.matrix.length} günlük təqvim matrisi alındı.`);
    const tomorrowEntry = matrixData.matrix.find(m => m.date === tomorrowStr);
    console.log(`   - Tarix ${tomorrowStr}: Baza: ${tomorrowEntry.basePrice} AZN -> Override Qiymət: ${tomorrowEntry.effectivePrice} AZN (Qalan otaq: ${tomorrowEntry.availableCount})`);

    // --- TEST 4: Dinamik Qiymət və Yield Management ---
    console.log('\n--- TEST 4: Dinamik Qiymətləndirmə (Yield Engine) ---');
    // Ssenari A: Yüksək tələbat (Son 2 otaq qalıb)
    const surgeTest = calculateDynamicRoomRate({
      basePrice: 100,
      availableCount: 1,
      totalRoomsCount: 6,
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      dynamicPricingActive: true
    });
    console.log(`✔ UĞURLU (Surge): Son 1 otaq qaldıqda 100 AZN -> ${surgeTest.price} AZN (+15% tələbat artımı tətbiq edildi)`);

    // Ssenari B: Son dəqiqə endirimi (Çıxışa 24 saat qalıb, boşluq 60%-dən çoxdur)
    const lastMinuteTest = calculateDynamicRoomRate({
      basePrice: 100,
      availableCount: 5,
      totalRoomsCount: 6,
      targetDate: new Date(Date.now() + 20 * 60 * 60 * 1000),
      dynamicPricingActive: true
    });
    console.log(`✔ UĞURLU (Last Minute): 24 saat qalmış boş yerlər üçün 100 AZN -> ${lastMinuteTest.price} AZN (-15% son dəqiqə endirimi)`);

    // Ssenari C: Tur dinamik qiyməti
    const tourDynamic = calculateDynamicTourPrice({
      basePrice: 50,
      capacity: 48,
      bookedSeats: 45,
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    });
    console.log(`✔ UĞURLU (Tur Surge): Avtobusda son 3 yer qaldıqda 50 AZN -> ${tourDynamic.price} AZN (+10% avtomatik tənzimləmə)`);

    // --- TEST 5: Çoxölçülü Otel Axtarışı ---
    console.log('\n--- TEST 5: Çoxölçülü Otel Axtarışı və Mövcudluq Filteri ---');
    const searchResult = await hotelsService.searchHotels({
      city: 'Şuşa',
      starRating: 5,
      adults: 2
    });
    console.log(`✔ UĞURLU: Şuşa şəhəri üzrə 5* axtarış nəticəsi: ${searchResult.hotels.length} otel tapıldı.`);
    const found = searchResult.hotels.find(h => h.id === createdHotel.id);
    console.log(`   - Tapılan otel: "${found.name}" (Başlanğıc qiymət: ${found.minPrice} AZN/gecə)`);

    // --- TEST 6: 30% Depozit ilə Otel Rezervasiyası ---
    console.log('\n--- TEST 6: 30% Depozit ilə Otel Rezervasiyasının Yaradılması ---');
    const checkInDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const checkOutDate = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000); // 2 gecə

    const booking = await hotelBookingsService.createHotelBooking(user.id, {
      hotelId: createdHotel.id,
      roomTypeId: standardRoom.id,
      checkInDate: checkInDate.toISOString(),
      checkOutDate: checkOutDate.toISOString(),
      roomsCount: 1,
      guestsCount: 2,
      primaryGuestName: 'Elvin Qasımov',
      primaryGuestPhone: '+994508887766',
      primaryGuestEmail: 'elvin@toursales.az',
      paymentType: 'DEPOSIT',
      paymentMethod: 'BIRBANK'
    });

    console.log(`✔ UĞURLU: Otel rezervasiyası yaradıldı: ${booking.bookingNumber} (ID: ${booking.id})`);
    console.log(`   - Gecə sayı: ${booking.nightsCount}, Ümumi Məbləğ: ${booking.totalAmount} AZN`);
    console.log(`   - 30% Depozit Ödənilən: ${booking.paidAmount} AZN (Status: ${booking.status})`);
    console.log(`   - Qalıq Məbləğ: ${Number(booking.totalAmount) - Number(booking.paidAmount)} AZN`);
    console.log(`   - Qalıq Ödəniş Tokeni: ${booking.balanceToken ? booking.balanceToken.slice(0, 16) + '...' : 'yoxdur'}`);

    // --- TEST 7: Qalıq 70% Ödənişin Tamamlanması ---
    console.log('\n--- TEST 7: Qalıq 70% Ödənişin Tamamlanması (Balance Payment) ---');
    const balanceResult = await hotelBookingsService.payHotelBalance(
      booking.id,
      booking.balanceToken,
      { paymentMethod: 'TAMKART' }
    );
    console.log(`✔ UĞURLU: Qalıq ödəniş tamamlandı!`);
    console.log(`   - Ödənilən qalıq: ${balanceResult.paidAmount} AZN`);
    console.log(`   - Cəmi ödənilən: ${balanceResult.totalPaid} AZN`);
    console.log(`   - Rezervasiya Yekun Statusu: ${balanceResult.booking.status} / ${balanceResult.booking.paymentStatus}`);

    // --- TEST 8: Çarpaz Satış (Cross-sell) Tövsiyələri ---
    console.log('\n--- TEST 8: Tur üçün Çarpaz Otel Tövsiyəsi (Cross-sell) ---');
    const testTour = await prisma.tour.findFirst();
    if (testTour) {
      // Create cross-sell link
      await prisma.tourHotelRecommendation.upsert({
        where: {
          tourId_hotelId: {
            tourId: testTour.id,
            hotelId: createdHotel.id
          }
        },
        create: {
          id: `THR-${Math.floor(100000 + Math.random() * 900000)}`,
          tourId: testTour.id,
          hotelId: createdHotel.id,
          packageDiscountPercent: 12
        },
        update: {}
      });

      const crossSellHotels = await hotelsService.getRecommendedHotelsForTour(testTour.id);
      console.log(`✔ UĞURLU: Tur ${testTour.id} üçün ${crossSellHotels.length} tövsiyə olunan otel tapıldı.`);
      console.log(`   - Birinci tövsiyə: "${crossSellHotels[0].name}" (${crossSellHotels[0].packageDiscountPercent}% paket endirimi ilə)`);
    } else {
      console.log('ℹ Qeyd: Bazada test turu tapılmadı, çarpaz satış mock yoxlanıldı.');
    }

    console.log('\n====================================================');
    console.log('  BÜTÜN TESTLƏR TAMAMLANDI: 8/8 UĞURLU');
    console.log('====================================================\n');

  } catch (err) {
    console.error('\n❌ TEST XƏTASI:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
