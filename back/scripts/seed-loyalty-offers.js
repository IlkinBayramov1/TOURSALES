import prisma from '../config/db.js';

async function seedLoyaltyOffers() {
  console.log('Seeding Loyalty Offers into database...');

  const offers = [
    {
      id: 'LYO-100001',
      partnerName: 'PAŞA Sığorta',
      offerName: 'Səyahət Sığortasına 15% Endirim',
      description: 'Xaricə və ölkədaxili səfərlər üçün tibbi və baqaj sığortası paketlərində 15% endirim vauçeri.',
      requiredPoints: 250,
      maxUsage: 500,
      usedCount: 14,
      category: 'SERVICE'
    },
    {
      id: 'LYO-100002',
      partnerName: 'Starbucks Azerbaijan',
      offerName: 'Pulsuz Grande Qəhvə Və Desert',
      description: 'İstənilən Starbucks filialında keçərli 1 ədəd pulsuz Grande ölçülü isti və ya soyuq içki kuponu.',
      requiredPoints: 150,
      maxUsage: 1000,
      usedCount: 88,
      category: 'FOOD'
    },
    {
      id: 'LYO-100003',
      partnerName: 'Baku Ride Airport Express',
      offerName: 'Hava Limanına Komfort Transfer 10 AZN Endirimlə',
      description: 'Heydər Əliyev Beynəlxalq Hava Limanına rahat və vaxtında çatdırılma xidməti üzrə xüsusi endirim vauçeri.',
      requiredPoints: 300,
      maxUsage: 300,
      usedCount: 29,
      category: 'TRANSPORT'
    },
    {
      id: 'LYO-100004',
      partnerName: 'DiscoverAz Tours',
      offerName: 'Həftəsonu Quba-Şahdağ Turuna 20 AZN Kupon',
      description: 'DiscoverAz tərəfindən təşkil edilən bütün daxili turlarda bilet alışında birbaşa 20 AZN endirim kuponu.',
      requiredPoints: 400,
      maxUsage: 250,
      usedCount: 42,
      category: 'TRAVEL'
    },
    {
      id: 'LYO-100005',
      partnerName: 'TOURSALES VIP Club',
      offerName: 'Bütün Beynəlxalq Turlara 50 AZN Dəyərində Hədiyyə Kuponu',
      description: 'Platformada bron edilən istənilən xarici tur paketinə tətbiq oluna bilən eksklüziv nağd endirim vauçeri.',
      requiredPoints: 800,
      maxUsage: 150,
      usedCount: 11,
      category: 'TRAVEL'
    },
    {
      id: 'LYO-100006',
      partnerName: 'Shahdag Hotel & Spa',
      offerName: 'Otel Rezervasiyasına SPA Və Səhər Yeməyi Paketi',
      description: 'Şahdağda 2 gecəlik qonaqlama zamanı cütlüklər üçün ödənişsiz SPA və termal hovuz paketi.',
      requiredPoints: 650,
      maxUsage: 100,
      usedCount: 19,
      category: 'SERVICE'
    }
  ];

  for (const offer of offers) {
    await prisma.loyaltyOffer.upsert({
      where: { id: offer.id },
      update: {
        partnerName: offer.partnerName,
        offerName: offer.offerName,
        description: offer.description,
        requiredPoints: offer.requiredPoints,
        maxUsage: offer.maxUsage,
        category: offer.category
      },
      create: offer
    });
    console.log(`✓ Inserted/Updated offer: ${offer.offerName} (${offer.partnerName})`);
  }

  const count = await prisma.loyaltyOffer.count();
  console.log(`Total loyalty offers in database: ${count}`);
}

seedLoyaltyOffers()
  .catch((err) => {
    console.error('Error seeding loyalty offers:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
