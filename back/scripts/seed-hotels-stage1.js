import prisma from '../config/db.js';

async function seedHotels() {
  console.log('--- SEEDING HOTELS, ROOMS & 30-DAY INVENTORY FOR AZTOUR (C-586288) ---');

  const companyId = 'C-586288';
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });

  if (!company) {
    console.error(`Company ${companyId} tapılmadı!`);
    process.exit(1);
  }

  // 1. Mövcud dublikat otelləri və əlaqəli qeydləri təmizləyək
  const existingHotels = await prisma.hotel.findMany({
    where: { companyId }
  });

  for (const h of existingHotels) {
    const roomTypes = await prisma.roomType.findMany({ where: { hotelId: h.id } });
    for (const rt of roomTypes) {
      await prisma.roomAvailabilityCalendar.deleteMany({ where: { roomTypeId: rt.id } });
      await prisma.hotelBooking.deleteMany({ where: { roomTypeId: rt.id } });
    }
    await prisma.roomType.deleteMany({ where: { hotelId: h.id } });
    await prisma.hotelBooking.deleteMany({ where: { hotelId: h.id } });
    await prisma.hotel.delete({ where: { id: h.id } });
  }
  console.log(`Mövcud ${existingHotels.length} köhnə otel təmizləndi.`);

  // 2. OTEL 1: Qəbələ Tufandağ Mountain Resort & Spa
  const hotel1 = await prisma.hotel.create({
    data: {
      id: 'H-QABALA-RESORT',
      companyId,
      name: 'Qəbələ Tufandağ Mountain Resort & Spa',
      legalName: 'Tufandağ Hospitality MMC',
      category: 'RESORT',
      starRating: 5,
      city: 'Qəbələ',
      region: 'Qəbələ / Tufandağ',
      address: 'Tufandağ Qış-Yay Turizm Kompleksi, Qəbələ',
      lat: 40.9825,
      lng: 47.8488,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      description: 'Böyük Qafqaz dağlarının ətəyində, kanat xəttinə birbaşa çıxışı olan 5 ulduzlu lüks istirahət və spa kurortu. Dağ mənzərəli eyvanlar, qızdırılan açıq və qapalı hovuzlar, zəngin restoranlar şəbəkəsi.',
      amenities: JSON.stringify([
        'Açıq Hovuz',
        'Bağlı Hovuz',
        'SPA & Sağlamlıq Mərkəzi',
        'Pulsuz Yüksəksürətli Wi-Fi',
        'Restoran & Bar',
        'Qapalı / Açıq Parkinq',
        'Fitnes və İdman Zalı',
        'Uşaq Əyləncə Mərkəzi',
        'Dağ Mənzərəsi'
      ]),
      cancellationPolicy: 'Girişə 48 saat qalmışadək pulsuz ləğvetmə. Daha sonra 1 gecəlik cərimə.',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80'
      ]),
      featuredImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      rating: 4.9,
      reviewCount: 48,
      isFeatured: true,
      isActive: true,
      allowInstallments: true,
      allowDeposit: true,
      dynamicPricingActive: true
    }
  });

  // Otaq 1.1: Deluxe Dağ Mənzərəli King
  const room1_1 = await prisma.roomType.create({
    data: {
      id: 'RT-QAB-DLX',
      hotelId: hotel1.id,
      name: 'Deluxe Dağ Mənzərəli King Otaq',
      description: 'Geniş eyvanlı, Tufandağ zirvələrinə panoramik mənzərəli lüks king otaq.',
      capacityAdults: 2,
      capacityChildren: 1,
      maxOccupancy: 3,
      bedType: 'KING',
      bedCount: 1,
      roomSizeSqM: 38,
      mealPlan: 'BB',
      basePrice: 160.0,
      totalRoomsCount: 12,
      amenities: JSON.stringify(['Dağ Mənzərəsi', 'Balkon', 'Smart TV', 'Kondisioner', 'Mini-bar', 'Sürətli Wi-Fi']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
      ]),
      isActive: true
    }
  });

  // Otaq 1.2: Junior Suite Balkonlu Panorama
  const room1_2 = await prisma.roomType.create({
    data: {
      id: 'RT-QAB-JSUITE',
      hotelId: hotel1.id,
      name: 'Junior Suite Balkonlu Panorama',
      description: 'Ayrıca qonaq zonası və ikiqat eyvanı olan premium suit.',
      capacityAdults: 3,
      capacityChildren: 2,
      maxOccupancy: 4,
      bedType: 'KING',
      bedCount: 2,
      roomSizeSqM: 55,
      mealPlan: 'HB',
      basePrice: 240.0,
      totalRoomsCount: 8,
      amenities: JSON.stringify(['Jakuzi', 'Panoramik Eyvan', 'Smart TV', 'Espresso Maşını', 'Xalat və Dəsmallar']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
      ]),
      isActive: true
    }
  });

  // 3. OTEL 2: Şuşa Xan Sarayı Boutique Hotel
  const hotel2 = await prisma.hotel.create({
    data: {
      id: 'H-SHUSHA-PALACE',
      companyId,
      name: 'Şuşa Xan Sarayı Boutique Hotel',
      legalName: 'Qarabağ Otellər Şəbəkəsi MMC',
      category: 'BOUTIQUE',
      starRating: 4,
      city: 'Şuşa',
      region: 'Qarabağ',
      address: 'Pənahəli Xan küçəsi 14, Şuşa',
      lat: 39.7594,
      lng: 46.7498,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      description: 'Qədim Şuşa memarlığının incisi, Cıdır düzünə və Topxana meşəsinə açılan füsunkar mənzərəsi ilə milli koloritli butik otel.',
      amenities: JSON.stringify([
        'Restoran & Bar',
        'Pulsuz Yüksəksürətli Wi-Fi',
        'Qapalı / Açıq Parkinq',
        'Otaq Xidməti (Room Service)',
        'Kondisioner və Smart TV',
        'Qarabağ Çay Evi'
      ]),
      cancellationPolicy: 'Girişə 24 saat qalmışadək pulsuz ləğv edilə bilər.',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80'
      ]),
      featuredImage: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
      rating: 4.8,
      reviewCount: 32,
      isFeatured: false,
      isActive: true,
      allowInstallments: true,
      allowDeposit: true,
      dynamicPricingActive: true
    }
  });

  // Otaq 2.1: Standart Qarabağ Double
  const room2_1 = await prisma.roomType.create({
    data: {
      id: 'RT-SHU-STD',
      hotelId: hotel2.id,
      name: 'Standart Qarabağ Double Otaq',
      description: 'Klassik Qarabağ xalça motivləri ilə bəzədilmiş rahat iki nəfərlik otaq.',
      capacityAdults: 2,
      capacityChildren: 1,
      maxOccupancy: 2,
      bedType: 'DOUBLE',
      bedCount: 1,
      roomSizeSqM: 28,
      mealPlan: 'BB',
      basePrice: 110.0,
      totalRoomsCount: 10,
      amenities: JSON.stringify(['Şəhər Mənzərəsi', 'Kondisioner', 'Smart TV', 'Wi-Fi']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'
      ]),
      isActive: true
    }
  });

  console.log('2 otel və 3 otaq kateqoriyası uğurla yaradıldı!');

  // 4. 30 Günlük İnventar və Qiymət Təqvimi Yaratmaq (RoomAvailabilityCalendar)
  const allRooms = [room1_1, room1_2, room2_1];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const room of allRooms) {
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const d = new Date(today);
      d.setDate(d.getDate() + dayOffset);

      const dayOfWeek = d.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

      // Həftəsonu qiymət artımı (+20%)
      const priceOverride = isWeekend ? Math.round(room.basePrice * 1.2) : null;
      // 1 gün son dəqiqə endirimi
      const isDiscount = dayOffset === 2;
      const finalPriceOverride = isDiscount ? Math.round(room.basePrice * 0.85) : priceOverride;

      // Mövcud otaq sayı
      let availableCount = room.totalRoomsCount;
      if (dayOffset >= 5 && dayOffset <= 8) {
        availableCount = Math.max(1, room.totalRoomsCount - 3); // Bəzi günlər qismən bron olunub
      }

      await prisma.roomAvailabilityCalendar.create({
        data: {
          id: `RAC-${room.id}-${dayOffset}`,
          roomTypeId: room.id,
          date: d,
          availableCount,
          priceOverride: finalPriceOverride,
          isBlocked: dayOffset === 14 // 14-cü gün profilaktik bloklanıb
        }
      });
    }
  }
  console.log('Bütün otaqlar üçün 30 günlük inventar və Smart Yield təqvimi yaradıldı!');

  // 5. Nümunəvi Qonaq Rezervasiyaları (KPI və Rezervasiyalar Səhifəsi üçün)
  const user = await prisma.user.findFirst({ where: { role: 'User' } }) ||
    await prisma.user.findFirst();

  const booking1CheckIn = new Date(today);
  booking1CheckIn.setDate(booking1CheckIn.getDate() + 3);
  const booking1CheckOut = new Date(booking1CheckIn);
  booking1CheckOut.setDate(booking1CheckOut.getDate() + 2);

  await prisma.hotelBooking.create({
    data: {
      id: 'HB-701928',
      bookingNumber: 'HB-701928',
      companyId,
      hotelId: hotel1.id,
      roomTypeId: room1_1.id,
      userId: user ? user.id : 'U-269805',
      checkInDate: booking1CheckIn,
      checkOutDate: booking1CheckOut,
      nightsCount: 2,
      roomsCount: 1,
      guestsCount: 2,
      primaryGuestName: 'Kamran Məmmədov',
      primaryGuestPhone: '+994502223344',
      primaryGuestEmail: 'kamran.m@mail.ru',
      totalAmount: 320.0,
      paidAmount: 96.0, // 30% depozit
      paymentType: 'DEPOSIT_30',
      paymentStatus: 'PARTIALLY_PAID',
      status: 'CONFIRMED',
      paymentMethod: 'KAPITAL_BANK',
      depositDueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    }
  });

  const booking2CheckIn = new Date(today);
  booking2CheckIn.setDate(booking2CheckIn.getDate() + 7);
  const booking2CheckOut = new Date(booking2CheckIn);
  booking2CheckOut.setDate(booking2CheckOut.getDate() + 3);

  await prisma.hotelBooking.create({
    data: {
      id: 'HB-701929',
      bookingNumber: 'HB-701929',
      companyId,
      hotelId: hotel1.id,
      roomTypeId: room1_2.id,
      userId: user ? user.id : 'U-269805',
      checkInDate: booking2CheckIn,
      checkOutDate: booking2CheckOut,
      nightsCount: 3,
      roomsCount: 1,
      guestsCount: 3,
      primaryGuestName: 'Nərmin Hüseynova',
      primaryGuestPhone: '+994553334455',
      primaryGuestEmail: 'narmin.h@gmail.com',
      totalAmount: 720.0,
      paidAmount: 720.0, // 100% tam ödəniş
      paymentType: 'FULL',
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
      paymentMethod: 'PASHABANK'
    }
  });

  const booking3CheckIn = new Date(today);
  booking3CheckIn.setDate(booking3CheckIn.getDate() + 10);
  const booking3CheckOut = new Date(booking3CheckIn);
  booking3CheckOut.setDate(booking3CheckOut.getDate() + 1);

  await prisma.hotelBooking.create({
    data: {
      id: 'HB-701930',
      bookingNumber: 'HB-701930',
      companyId,
      hotelId: hotel2.id,
      roomTypeId: room2_1.id,
      userId: user ? user.id : 'U-269805',
      checkInDate: booking3CheckIn,
      checkOutDate: booking3CheckOut,
      nightsCount: 1,
      roomsCount: 1,
      guestsCount: 2,
      primaryGuestName: 'Rəşad Quliyev',
      primaryGuestPhone: '+994704445566',
      primaryGuestEmail: 'rashad.q@gmail.com',
      totalAmount: 110.0,
      paidAmount: 33.0, // 30% depozit
      paymentType: 'DEPOSIT_30',
      paymentStatus: 'PARTIALLY_PAID',
      status: 'CONFIRMED',
      paymentMethod: 'KAPITAL_BANK',
      depositDueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('3 ədəd real rezervasiya və depozit qeydi uğurla yaradıldı!');
  console.log('================ SEEDING UĞURLA BAŞA ÇATDI ================');
}

seedHotels()
  .catch((e) => {
    console.error('Seed xətası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
