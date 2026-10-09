import prisma from '../config/db.js';

async function seedTenders() {
  console.log('🌱 [SEED TENDERS] Fərdi və Qrup Turları Tender Elanlarının Yaradılması...');

  // 1. AzTour və ya mövcud Vendor şirkəti tapılır
  let azTour = await prisma.company.findFirst({ where: { id: 'C-586288' } });
  if (!azTour) {
    azTour = await prisma.company.findFirst({ where: { status: 'Active' } });
  }

  // 2. Müştəri istifadəçiləri tapılır və ya yaradılır
  let customerUser = await prisma.user.findFirst({ where: { role: 'User' } });
  if (!customerUser) {
    customerUser = await prisma.user.create({
      data: {
        id: 'U-778899',
        name: 'Kənan Əliyev',
        email: 'kenan.traveler@gmail.com',
        phoneNumber: '+994 50 234 56 78',
        password: 'hashed_password_123',
        role: 'User'
      }
    });
  }

  // Cari zamana görə gələcək tarixlər (Oktyabr - Noyabr 2026)
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const sampleTenders = [
    {
      id: 'CTR-701021',
      requestNumber: 'CTR-701021',
      userId: customerUser.id,
      type: 'FAMILY',
      title: 'Şuşa & Xankəndi 2 Günlük VIP Ailəvi Ziyarət və Tarix Turu',
      destinations: JSON.stringify(['Şuşa', 'Xankəndi', 'Cıdır Düzü']),
      startDate: new Date(now + 7 * day),
      endDate: new Date(now + 9 * day),
      durationDays: 2,
      adultsCount: 4,
      childrenCount: 2,
      totalPassengers: 6,
      vehicleType: 'MINIVAN_MERCEDES_VITO_7',
      hotelPreference: 'HOTEL_4_STAR',
      mealPreference: 'HALF_BOARD',
      guideRequired: true,
      guideLanguage: 'AZ',
      attractions: JSON.stringify(['Cıdır Düzü', 'Yuxarı Gövhər Ağa Məscidi', 'Bülbülün Ev Muzeyi', 'Xankəndi Mərkəzi Meydan']),
      budgetMin: 1200,
      budgetMax: 1800,
      currency: 'AZN',
      specialNotes: 'Ailədə azyaşlı uşaqlar var, uşaq oturacağı və rahat tempdə proqram tələb olunur.',
      status: 'OPEN_FOR_BIDS',
      bidsCount: 1,
      expiresAt: new Date(now + 3 * day)
    },
    {
      id: 'CTR-702045',
      requestNumber: 'CTR-702045',
      userId: customerUser.id,
      type: 'CORPORATE',
      title: 'Qəbələ & Şəki İdarə Heyəti Strateji Toplantısı & Qastronomiya Turu',
      destinations: JSON.stringify(['Qəbələ', 'Şəki']),
      startDate: new Date(now + 12 * day),
      endDate: new Date(now + 15 * day),
      durationDays: 3,
      adultsCount: 14,
      childrenCount: 0,
      totalPassengers: 14,
      vehicleType: 'MINIBUS_MERCEDES_SPRINTER_18',
      hotelPreference: 'HOTEL_5_STAR',
      mealPreference: 'FULL_BOARD',
      guideRequired: true,
      guideLanguage: 'EN',
      attractions: JSON.stringify(['Tufandağ Kanat', 'Nohurgöl Qayıq', 'Şəki Xan Sarayı', 'Şəki Karvansarayı']),
      budgetMin: 3200,
      budgetMax: 4800,
      currency: 'AZN',
      specialNotes: 'Xarici tərəfdaşlar iştirak edəcək, ingilisdilli bələdçi və yüksək komfortlu Sprinter vacibdir.',
      status: 'OPEN_FOR_BIDS',
      bidsCount: 0,
      expiresAt: new Date(now + 5 * day)
    },
    {
      id: 'CTR-703088',
      requestNumber: 'CTR-703088',
      userId: customerUser.id,
      type: 'FRIENDS_GROUP',
      title: 'Quba & Xınalıq Dağ Macərası və Kənd Həyatı Ekspedisiyası',
      destinations: JSON.stringify(['Quba', 'Qəçrəş', 'Xınalıq']),
      startDate: new Date(now + 5 * day),
      endDate: new Date(now + 7 * day),
      durationDays: 2,
      adultsCount: 4,
      childrenCount: 0,
      totalPassengers: 4,
      vehicleType: 'MINIVAN_MERCEDES_VITO_7',
      hotelPreference: 'COTTAGES',
      mealPreference: 'BREAKFAST_ONLY',
      guideRequired: false,
      guideLanguage: 'AZ',
      attractions: JSON.stringify(['Qəçrəş Meşəsi', 'Xınalıq Etnoqrafik Kəndi', 'Minarəli Qədim Məscid']),
      budgetMin: 650,
      budgetMax: 950,
      currency: 'AZN',
      specialNotes: 'Dağ yollarına uyğun 4x4 və ya yüksək klirensli etibarlı maşın istəyirik.',
      status: 'OPEN_FOR_BIDS',
      bidsCount: 0,
      expiresAt: new Date(now + 2 * day)
    },
    {
      id: 'CTR-704112',
      requestNumber: 'CTR-704112',
      userId: customerUser.id,
      type: 'INDIVIDUAL',
      title: 'Lənkəran & Lerik Şəxsi Çay Plantasiyası & Qala Xudafərin İstirahəti',
      destinations: JSON.stringify(['Lənkəran', 'Lerik']),
      startDate: new Date(now + 10 * day),
      endDate: new Date(now + 12 * day),
      durationDays: 2,
      adultsCount: 2,
      childrenCount: 1,
      totalPassengers: 3,
      vehicleType: 'SEDAN_4',
      hotelPreference: 'BOUTIQUE',
      mealPreference: 'HALF_BOARD',
      guideRequired: true,
      guideLanguage: 'AZ',
      attractions: JSON.stringify(['Lənkəran Çay Plantasiyası', 'Bəbirlər Vadisi', 'Talış Dağları Mənzərəsi']),
      budgetMin: 550,
      budgetMax: 850,
      currency: 'AZN',
      specialNotes: 'Yolda çay fasiləsi və yerli Lənkəran ləvəngisi dequstasiyası təşkil edilsin.',
      status: 'OPEN_FOR_BIDS',
      bidsCount: 0,
      expiresAt: new Date(now + 4 * day)
    },
    {
      id: 'CTR-705230',
      requestNumber: 'CTR-705230',
      userId: customerUser.id,
      type: 'FAMILY',
      title: 'Göy-Göl & Maralgöl Təbiət Qoynunda 2 Günlük Ailəvi Qastronomiya',
      destinations: JSON.stringify(['Gəncə', 'Göygöl', 'Maralgöl']),
      startDate: new Date(now + 8 * day),
      endDate: new Date(now + 10 * day),
      durationDays: 2,
      adultsCount: 5,
      childrenCount: 2,
      totalPassengers: 7,
      vehicleType: 'MINIVAN_MERCEDES_VITO_7',
      hotelPreference: 'HOTEL_4_STAR',
      mealPreference: 'BREAKFAST_ONLY',
      guideRequired: true,
      guideLanguage: 'AZ',
      attractions: JSON.stringify(['Göygöl Milli Parkı', 'Maralgöl Qoruğu', 'Nizami Gəncəvi Məqbərəsi']),
      budgetMin: 900,
      budgetMax: 1300,
      currency: 'AZN',
      specialNotes: 'Gəncədə tarixi yerlər və Göygöldə qayıq gəzintisi daxil edilsin.',
      status: 'OPEN_FOR_BIDS',
      bidsCount: 0,
      expiresAt: new Date(now + 6 * day)
    }
  ];

  for (const tender of sampleTenders) {
    await prisma.customTourRequest.upsert({
      where: { id: tender.id },
      update: {
        status: tender.status,
        expiresAt: tender.expiresAt,
        startDate: tender.startDate,
        endDate: tender.endDate
      },
      create: tender
    });
    console.log(`  ✓ Tender yaradıldı/yeniləndi: #${tender.requestNumber} — "${tender.title}"`);
  }

  // AzTour üçün 1 qazanılmış və 1 baxışda olan təklif təmin edirik
  if (azTour) {
    const targetReq = sampleTenders[0];
    const existingBid = await prisma.customTourBid.findFirst({
      where: { requestId: targetReq.id, companyId: azTour.id }
    });

    if (!existingBid) {
      await prisma.customTourBid.create({
        data: {
          id: 'BID-701021',
          bidNumber: 'BID-701021',
          requestId: targetReq.id,
          companyId: azTour.id,
          offeredPrice: 1350,
          pricePerPerson: 225,
          itineraryProgram: '1-ci Gün: Bakı-Füzuli-Şuşa (Zəfər Yolu), Cıdır Düzü və İsa Bulağı ziyarəti. Oteldə yerləşmə.\n2-ci Gün: Xankəndi şəhər turu, Yuxarı Gövhər Ağa Məscidi və Bakıya qayıdış.',
          includedServices: JSON.stringify([
            'Mercedes Vito VIP nəqliyyat və yanacaq',
            'Şuşa 4 ulduzlu oteldə gecələmə və səhər yeməyi',
            'Portal rəsmi sertifikatlı bələdçi',
            'Milli park və muzey biletləri'
          ]),
          excludedServices: JSON.stringify(['Nahar və şam yeməkləri', 'Şəxsi xərclər']),
          vehicleDetails: 'Mercedes-Benz Vito 2023, Dəri salon, WiFi, Kondisioner',
          hotelDetails: 'Şuşa Otel 4*, Standart otaqlar, Dağ mənzərəsi',
          vendorNotes: 'Ailə üçün 2 ədəd uşaq oturacağı ödənişsiz təmin ediləcəkdir.',
          status: 'PENDING',
          validUntil: new Date(now + 3 * day)
        }
      });
      console.log(`  ✓ AzTour üçün nümunə təklif əlavə edildi: #BID-701021 (1,350 AZN)`);
    }
  }

  console.log('\n🎉 [TAMAMLANDI] Bütün tender elanları və nümunə təkliflər uğurla bazaya yazıldı.');
  process.exit(0);
}

seedTenders().catch((err) => {
  console.error('❌ Toxum xətası:', err);
  process.exit(1);
});
