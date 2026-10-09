import prisma from '../config/db.js';
import { aiConciergeService } from '../modules/ai-concierge/ai-concierge.service.js';
import { yieldPricingService } from '../modules/yield-pricing/yield-pricing.service.js';
import { analyticsService } from '../modules/analytics/analytics.service.js';

async function runPhase6Tests() {
  console.log('====================================================');
  console.log('  TOURSALES FAZA 6: ANALİTİKA, AI & YİELD TESTİ');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------------------
    // TEST 1: AI Concierge NLP Intent Parsing
    // ----------------------------------------------------------------
    console.log('--- TEST 1: AI Concierge Təbii Dil (NLP) Analizi ---');
    const prompt1 = '4 nəfərlik ailə üçün 500 AZN büdcə ilə Qəbələ və Şəkidə sakit təbiət və dağ istirahəti istəyirik';
    const parsed = aiConciergeService.parseTravelPrompt(prompt1);

    if (parsed.pax !== 4 || parsed.groupType !== 'FAMILY') {
      throw new Error(`Pax və ya Qrup tipi düzgün tapılmadı: pax=${parsed.pax}, group=${parsed.groupType}`);
    }
    if (parsed.maxBudget !== 500) {
      throw new Error(`Büdcə düzgün aşkar edilmədi: ${parsed.maxBudget}`);
    }
    if (!parsed.destinations.includes('Qəbələ') || !parsed.destinations.includes('Şəki')) {
      throw new Error(`İstiqamətlər natamamdır: ${parsed.destinations.join(', ')}`);
    }
    if (!parsed.tags.includes('təbiət') || !parsed.tags.includes('dağ')) {
      throw new Error(`Etiketlər aşkar edilmədi: ${parsed.tags.join(', ')}`);
    }

    console.log(`✔ UĞURLU: Sorğu uğurla analiz edildi:`);
    console.log(`   - Sərnişin: ${parsed.pax} nəfər (${parsed.groupType})`);
    console.log(`   - Büdcə: ${parsed.maxBudget} AZN`);
    console.log(`   - Məkanlar: ${parsed.destinations.join(', ')}`);
    console.log(`   - Maraqlar: ${parsed.tags.join(', ')}\n`);

    // ----------------------------------------------------------------
    // TEST 2: AI Səyahət Tövsiyə Alqoritmi (3 Fərqli Paket)
    // ----------------------------------------------------------------
    console.log('--- TEST 2: AI Tövsiyə Mühərriki və 3 Paket Generasiyası ---');
    const recommendations = await aiConciergeService.getRecommendations(prompt1);

    if (!recommendations.packages || recommendations.packages.length !== 3) {
      throw new Error(`Dəqiq 3 paket generasiya edilmədi: ${recommendations.packages?.length}`);
    }
    if (!recommendations.advice || recommendations.advice.length < 20) {
      throw new Error(`Fərdi məsləhət mətni generasiya edilmədi: ${recommendations.advice}`);
    }

    console.log(`✔ UĞURLU: AI Səyahət Köməkçisi 3 unikal paket təqdim etdi:`);
    recommendations.packages.forEach((pkg, i) => {
      console.log(`   ${i + 1}. [${pkg.badge}] ${pkg.tour.title} (~${pkg.tour.price} AZN)`);
    });
    console.log(`   - Fərdi Məsləhət: "${recommendations.advice.slice(0, 100)}..."\n`);

    // ----------------------------------------------------------------
    // Setup Tours for Yield Pricing Tests
    // ----------------------------------------------------------------
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Test Turizm Şirkəti MMC',
          legalName: 'Test MMC',
          city: 'Bakı',
          rating: 4.9,
          status: 'ACTIVE',
        },
      });
    }

    // ----------------------------------------------------------------
    // TEST 3: Smart Yield Surge Pricing (High Demand)
    // ----------------------------------------------------------------
    console.log('--- TEST 3: Smart Yield Surge Pricing (Yüksək Tələbat) ---');
    const surgeTour = await prisma.tour.create({
      data: {
        id: `T-SRG-${Date.now()}`,
        companyId: company.id,
        title: 'Quba Qırmızı Qəsəbə & Şahdağ Surge Test',
        description: 'Quba və Şahdağ istirahət turu',
        type: 'DOMESTIC',
        price: 50.0,
        busCapacity: 20,
        maxParticipants: 20,
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days later
        dynamicPricingActive: true,
        surgeThreshold: 5,
        surgePercent: 15,
      },
    });

    // Create 17 bookings (leaves 3 seats remaining, 85% occupancy)
    await prisma.booking.create({
      data: {
        id: `TR-SRG-${Date.now()}`,
        tourId: surgeTour.id,
        companyId: company.id,
        passengerName: 'Surge',
        passengerSurname: 'Test',
        contactNumber: '+994501112233',
        contactEmail: 'surge@test.az',
        seats: 17,
        totalAmount: 850,
        remainingAmount: 0,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
    });

    const surgeEval = await yieldPricingService.evaluateTourDynamicPrice(surgeTour.id);
    if (surgeEval.ruleTriggered !== 'SURGE_HIGH_DEMAND') {
      throw new Error(`Gözlənən qayda SURGE_HIGH_DEMAND, lakin nəticə: ${surgeEval.ruleTriggered}`);
    }
    const expectedSurgePrice = Math.round(50 * 1.15);
    if (surgeEval.appliedPrice !== expectedSurgePrice) {
      throw new Error(`Qiymət artımı səhvdir: Gözlənən ${expectedSurgePrice}, Alınan ${surgeEval.appliedPrice}`);
    }
    console.log(`✔ UĞURLU: Surge Pricing aktivləşdi:`);
    console.log(`   - Baza Qiymət: ${surgeEval.basePrice} AZN ➔ Tələbat Qiyməti: ${surgeEval.appliedPrice} AZN (+15%)`);
    console.log(`   - Doluluq: ${surgeEval.occupancyRate}% (Qalan yer: ${surgeEval.remainingSeats})`);
    console.log(`   - Etiket: ${surgeEval.badge}\n`);

    // ----------------------------------------------------------------
    // TEST 4: Smart Yield Last-Minute Flash Deal
    // ----------------------------------------------------------------
    console.log('--- TEST 4: Smart Yield Last-Minute Flash Deal (-20%) ---');
    const lastMinuteTour = await prisma.tour.create({
      data: {
        id: `T-LST-${Date.now()}`,
        companyId: company.id,
        title: 'Qəbələ Şəlalə Turu Last Minute Test',
        description: 'Qəbələ şəlalə və göl turu',
        type: 'DOMESTIC',
        price: 60.0,
        busCapacity: 30,
        maxParticipants: 30,
        startDate: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18 hours until departure
        dynamicPricingActive: true,
        lastMinuteHours: 24,
        lastMinuteDiscount: 20,
        lastMinuteMinOccupancy: 50,
      },
    });

    const lastMinEval = await yieldPricingService.evaluateTourDynamicPrice(lastMinuteTour.id);
    if (lastMinEval.ruleTriggered !== 'LAST_MINUTE_FLASH') {
      throw new Error(`Gözlənən qayda LAST_MINUTE_FLASH, lakin nəticə: ${lastMinEval.ruleTriggered}`);
    }
    const expectedLastMinPrice = Math.round(60 * 0.8);
    if (lastMinEval.appliedPrice !== expectedLastMinPrice) {
      throw new Error(`Endirim səhvdir: Gözlənən ${expectedLastMinPrice}, Alınan ${lastMinEval.appliedPrice}`);
    }
    console.log(`✔ UĞURLU: Last-Minute Flash Deal aktivləşdi:`);
    console.log(`   - Baza Qiymət: ${lastMinEval.basePrice} AZN ➔ Endirimli: ${lastMinEval.appliedPrice} AZN (-20%)`);
    console.log(`   - Çıxışa qalan: ${lastMinEval.hoursUntilDeparture} saat`);
    console.log(`   - Etiket: ${lastMinEval.badge}\n`);

    // ----------------------------------------------------------------
    // TEST 5: Smart Yield Early Bird Promotion
    // ----------------------------------------------------------------
    console.log('--- TEST 5: Smart Yield Early Bird Promo (-10%) ---');
    const earlyBirdTour = await prisma.tour.create({
      data: {
        id: `T-EBD-${Date.now()}`,
        companyId: company.id,
        title: 'Kapadokya 5 Günlük Yay Turu Early Bird',
        description: 'Kapadokya hava şarları turu',
        type: 'FOREIGN',
        price: 350.0,
        busCapacity: 40,
        maxParticipants: 40,
        startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days later
        dynamicPricingActive: true,
        earlyBirdDays: 20,
        earlyBirdDiscount: 10,
      },
    });

    const earlyEval = await yieldPricingService.evaluateTourDynamicPrice(earlyBirdTour.id);
    if (earlyEval.ruleTriggered !== 'EARLY_BIRD_DISCOUNT') {
      throw new Error(`Gözlənən qayda EARLY_BIRD_DISCOUNT, lakin nəticə: ${earlyEval.ruleTriggered}`);
    }
    console.log(`✔ UĞURLU: Early Bird Endirimi aktivləşdi:`);
    console.log(`   - Baza Qiymət: ${earlyEval.basePrice} AZN ➔ Erkən Qiymət: ${earlyEval.appliedPrice} AZN (-10%)`);
    console.log(`   - Etiket: ${earlyEval.badge}\n`);

    // ----------------------------------------------------------------
    // TEST 6: Sales Heatmap (7x24 Matrix)
    // ----------------------------------------------------------------
    console.log('--- TEST 6: Satış İstilik Xəritəsi (7x24 Heatmap) ---');
    const heatmapRes = await analyticsService.getSalesHeatmap(company.id);

    if (!heatmapRes.heatmap || heatmapRes.heatmap.length !== 168) {
      throw new Error(`Heatmap hüceyrə sayı 168 deyil: ${heatmapRes.heatmap?.length}`);
    }
    console.log(`✔ UĞURLU: 7x24 Satış İstilik Matrisi formalaşdırıldı:`);
    console.log(`   - Ümumi hüceyrə: ${heatmapRes.heatmap.length} (7 gün x 24 saat)`);
    console.log(`   - Analiz olunan sifariş: ${heatmapRes.totalAnalyzedBookings}`);
    console.log(`   - Pik Satış Günü: ${heatmapRes.peakDay}`);
    console.log(`   - Pik Satış Saatı: ${heatmapRes.peakHour}\n`);

    // ----------------------------------------------------------------
    // TEST 7: Route Profitability and Load Factor
    // ----------------------------------------------------------------
    console.log('--- TEST 7: Marşrut Rentabelliyi və Doluluq (Load Factor) ---');
    const profitability = await analyticsService.getRouteProfitability(company.id);

    if (!Array.isArray(profitability.routes)) {
      throw new Error('Marşrutlar massivi tapılmadı');
    }
    console.log(`✔ UĞURLU: Marşrut rentabelliyi hesablandı:`);
    console.log(`   - Analiz olunan marşrut sayı: ${profitability.routes.length}`);
    console.log(`   - Orta Doluluq Dərəcəsi: ${profitability.avgOccupancy}%`);
    console.log(`   - Cəmi Dövriyyə: ${profitability.totalRevenue} AZN`);
    if (profitability.topPerforming.length > 0) {
      console.log(`   - Ən gəlirli: "${profitability.topPerforming[0].title}" (Marja: ${profitability.topPerforming[0].marginPercent}%)`);
    }
    console.log('');

    // ----------------------------------------------------------------
    // TEST 8: Customer Retention and Cohort Analysis
    // ----------------------------------------------------------------
    console.log('--- TEST 8: Müştəri Retensiyası və Sadiqlik Kohortası ---');
    const retention = await analyticsService.getCustomerRetention(company.id);

    if (typeof retention.repeatRatePercent !== 'number') {
      throw new Error('Təkrar alış faizi ədəd deyil');
    }
    console.log(`✔ UĞURLU: Müştəri retensiyası analiz edildi:`);
    console.log(`   - Unikal müştəri sayı: ${retention.totalUniqueCustomers}`);
    console.log(`   - Təkrar alış edənlər: ${retention.repeatBuyers} nəfər (${retention.repeatRatePercent}%)`);
    console.log(`   - Orta Müştəri Ömür Dəyəri (LTV): ${retention.avgLifetimeValue} AZN\n`);

    console.log('====================================================');
    console.log('  BÜTÜN TESTLƏR TAMAMLANDI: 8/8 UĞURLU (100% KEÇDİ)');
    console.log('====================================================');

    // Clean up test records
    await prisma.booking.deleteMany({ where: { tourId: surgeTour.id } });
    await prisma.tour.deleteMany({
      where: { id: { in: [surgeTour.id, lastMinuteTour.id, earlyBirdTour.id] } },
    });
  } catch (error) {
    console.error('\n❌ TEST XƏTASI:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase6Tests();
