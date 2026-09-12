import prisma from '../config/db.js';

async function seedVendorAds() {
  console.log('Seeding Ad Packages, Vendor Ads and Campaigns...');

  const companyId = 'C-586288';
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    console.error(`Company ${companyId} not found!`);
    process.exit(1);
  }

  // 1. Seed Packages
  const packages = [
    {
      id: 'ADP-7D',
      name: '7 Günlük Standart Vitrin',
      durationDays: 7,
      price: 35.00,
      features: JSON.stringify([
        'Turlar siyahısında "Önə Çıxan" nişanı',
        'Axtarış nəticələrində ön sıralar',
        'Həftəlik baxış və klik analitikası',
        'Bütün mobil və desktop cihazlarda göstərilmə'
      ])
    },
    {
      id: 'ADP-14D',
      name: '14 Günlük VIP Qızıl Nişan',
      durationDays: 14,
      price: 65.00,
      features: JSON.stringify([
        'Qızıl "VIP Sponsor" nişanı',
        'Axtarışda 1-ci sırada prioritet',
        'Yan panel və bənzər turlarda tövsiyə',
        '2 həftəlik ətraflı konversiya hesabatı',
        'Təkanverici xüsusi rəng vurğusu'
      ])
    },
    {
      id: 'ADP-30D',
      name: '30 Günlük Platin Hərtərəfli',
      durationDays: 30,
      price: 120.00,
      features: JSON.stringify([
        'Ana səhifə Hero Banner rotasiyası',
        'Kataloqda ən üst mövqe (1-ci yer)',
        'VIP qızıl çərçivə və vizual vurğu',
        'Müştəri rezervasiya zəmanəti dəstəyi',
        '30 günlük tam ROI & gəlir analitikası'
      ])
    }
  ];

  for (const pkg of packages) {
    await prisma.adPackage.upsert({
      where: { id: pkg.id },
      update: pkg,
      create: pkg
    });
  }
  console.log('✓ 3 Ad Packages upserted successfully.');

  // Check tours
  const tours = await prisma.tour.findMany({
    where: { companyId },
    take: 2
  });

  const tour1Id = tours[0]?.id || null;
  const tour2Id = tours[1]?.id || null;

  // 2. Seed Ads
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const nineDaysAhead = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000);
  const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
  const thirteenDaysAgo = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);

  const ads = [
    {
      id: 'AD-840192',
      companyId,
      tourId: tour1Id,
      packageId: 'ADP-14D',
      title: 'Türkiyə, Antalya — Erkən Qeydiyyat VIP Fürsəti',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
      linkUrl: tour1Id ? `/tours/${tour1Id}` : '/tours',
      position: 'HERO',
      amountPaid: 65.00,
      startDate: fiveDaysAgo,
      endDate: nineDaysAhead,
      status: 'Active',
      viewCount: 1420,
      clicksCount: 186,
      bookingCount: 9
    },
    {
      id: 'AD-310842',
      companyId,
      tourId: tour2Id,
      packageId: 'ADP-7D',
      title: 'Qəbələ & Şamaxı Təbiət Qoynunda Həftəsonu',
      imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200',
      linkUrl: tour2Id ? `/tours/${tour2Id}` : '/tours',
      position: 'SIDEBAR',
      amountPaid: 35.00,
      startDate: twentyDaysAgo,
      endDate: thirteenDaysAgo,
      status: 'Expired',
      viewCount: 890,
      clicksCount: 94,
      bookingCount: 4
    }
  ];

  for (const ad of ads) {
    await prisma.ad.upsert({
      where: { id: ad.id },
      update: ad,
      create: ad
    });
  }
  console.log('✓ 2 Vendor Ads upserted successfully.');

  // 3. Seed Campaigns (Promo codes)
  const campaigns = [
    {
      id: 'CP-YAY15',
      companyId,
      type: 'DISCOUNT',
      promoCode: 'YAY15',
      discountType: 'PERCENTAGE',
      discountValue: 15.00,
      usageLimit: 50,
      usedCount: 14,
      startDate: fiveDaysAgo,
      endDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      description: 'Bütün turlara yay mövsümü üçün xüsusi 15% endirim kuponu',
      status: 'Active'
    },
    {
      id: 'CP-VIP20',
      companyId,
      type: 'DISCOUNT',
      promoCode: 'VIP20',
      discountType: 'FIXED',
      discountValue: 20.00,
      usageLimit: 30,
      usedCount: 28,
      startDate: twentyDaysAgo,
      endDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      description: 'Daimi müştərilərə xüsusi 20 AZN birbaşa nağd endirim kuponu',
      status: 'Active'
    }
  ];

  for (const c of campaigns) {
    await prisma.campaign.upsert({
      where: { id: c.id },
      update: c,
      create: c
    });
  }
  console.log('✓ 2 Vendor Campaigns (Promo codes) upserted successfully.');

  console.log('Seeding completed successfully!');
  await prisma.$disconnect();
}

seedVendorAds().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
