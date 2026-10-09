import prisma from '../config/db.js';
import { vendorService } from '../modules/vendor/vendor.service.js';

async function main() {
  console.log('--- TEST: VENDOR DASHBOARD MƏRHƏLƏ 1 TESTİ BAŞLADI ---');

  // 1. Şirkəti və istifadəçini tapırıq
  const user = await prisma.user.findFirst({
    where: { email: 'aztour@gmail.com' },
    include: { company: true }
  });

  if (!user || !user.companyId) {
    console.error('Test istifadəçisi və ya şirkət tapılmadı!');
    process.exit(1);
  }

  const companyId = user.companyId;
  console.log(`Şirkət: ${user.company.name} (${companyId})`);

  // Test 1: OWNER / ADMIN üçün Stats yoxlanışı (Period: month)
  console.log('\n[TEST 1] OWNER üçün Dashboard Statistikaları (period = "month")...');
  const ownerStats = await vendorService.getDashboardStats(companyId, 'month', user);
  
  console.log('✅ Şirkət adı:', ownerStats.companyName);
  console.log('✅ isFinancialMasked:', ownerStats.isFinancialMasked);
  console.log('✅ Ümumi Gəlir:', ownerStats.totalRevenue, 'AZN');
  console.log('✅ Gəlir Artımı:', ownerStats.revenueGrowth, '%');
  console.log('✅ Orta Bilet Qiyməti:', ownerStats.avgTicketPrice, 'AZN');
  console.log('✅ Rezervasiya Sayı:', ownerStats.totalBookingsCount);
  console.log('✅ Satılmış Yerlər:', ownerStats.totalSeatsSold);
  console.log('✅ Minik / Check-in dərəcəsi:', ownerStats.checkInRate, '%');
  console.log('✅ Bütün Zamanlar Üzrə Gəlir:', ownerStats.allTimeRevenue, 'AZN');
  console.log('✅ Bütün Zamanlar Rezervasiya Sayı:', ownerStats.allTimeBookingsCount);
  console.log('✅ Operativ Bildirişlər (Alerts):', ownerStats.operationalAlerts.length, 'ədəd');
  ownerStats.operationalAlerts.forEach(a => {
    console.log(`   - [${a.type.toUpperCase()}] ${a.title}: ${a.message} (Say: ${a.count})`);
  });

  if (ownerStats.isFinancialMasked !== false) throw new Error('OWNER maliyyə məlumatlarını görməlidir!');
  if (typeof ownerStats.totalRevenue !== 'number') throw new Error('totalRevenue rəqəm olmalıdır!');
  if (typeof ownerStats.avgTicketPrice !== 'number' && ownerStats.avgTicketPrice !== null) throw new Error('avgTicketPrice düzgün formatda deyil!');

  // Test 2: Bütün dövrlər (today, week, year)
  console.log('\n[TEST 2] Fərqli dövrlər üzrə statistika sorğuları...');
  for (const period of ['today', 'week', 'year']) {
    const pStats = await vendorService.getDashboardStats(companyId, period, user);
    console.log(`✅ Dövr [${period}]: Gəlir = ${pStats.totalRevenue} AZN, Rezervasiyalar = ${pStats.totalBookingsCount}, Aktiv Turlar = ${pStats.activeToursCount}`);
  }

  // Test 3: GUIDE (Bələdçi) Rolu üçün RBAC Maliyyə Məxfiliyi
  console.log('\n[TEST 3] GUIDE (Bələdçi) rolu üçün maliyyə məlumatlarının gizlədilməsi...');
  const guideUser = { ...user, agencyRole: 'GUIDE' };
  const guideStats = await vendorService.getDashboardStats(companyId, 'month', guideUser);

  console.log('✅ Guide isFinancialMasked:', guideStats.isFinancialMasked);
  console.log('✅ Guide totalRevenue:', guideStats.totalRevenue);
  console.log('✅ Guide availableBalance:', guideStats.availableBalance);
  console.log('✅ Guide avgTicketPrice:', guideStats.avgTicketPrice);
  console.log('✅ Guide monthlyRevenue element sayı:', guideStats.monthlyRevenue.length);
  console.log('✅ Guide Rezervasiya sayı (əməliyyat icazəlidir):', guideStats.totalBookingsCount);

  if (guideStats.isFinancialMasked !== true) throw new Error('GUIDE üçün isFinancialMasked true olmalıdır!');
  if (guideStats.totalRevenue !== null) throw new Error('GUIDE üçün totalRevenue null olmalıdır!');
  if (guideStats.availableBalance !== null) throw new Error('GUIDE üçün availableBalance null olmalıdır!');
  if (guideStats.monthlyRevenue.length !== 0) throw new Error('GUIDE üçün aylıq gəlir qrafiki boş olmalıdır!');
  if (guideStats.totalBookingsCount === null) throw new Error('GUIDE üçün rezervasiya sayı görünməlidir!');

  // Test 4: Sərnişin Manifesti (getManifestSummary)
  console.log('\n[TEST 4] Sərnişin Manifesti Xülasəsi...');
  const manifest = await vendorService.getManifestSummary(companyId, null, user);
  console.log('✅ Manifest Tur:', manifest.tour?.title || 'Aktiv tur yoxdur');
  console.log('✅ Ümumi Yerlər:', manifest.totalSeats);
  console.log('✅ Minik etmiş sərnişinlər:', manifest.checkedInCount);
  console.log('✅ Sərnişin siyahısı sayı:', manifest.passengers.length);
  if (manifest.passengers.length > 0) {
    const p1 = manifest.passengers[0];
    console.log(`   Nümunə sərnişin: ${p1.passengerName}, Oturacaq: ${p1.seatNumber}, Status: ${p1.bookingStatus}, Ödəniş: ${p1.amount} AZN`);
  }

  // Guide üçün manifestdə məbləğin 0/gizli olması yoxlanışı
  const guideManifest = await vendorService.getManifestSummary(companyId, null, guideUser);
  if (guideManifest.passengers.length > 0) {
    if (guideManifest.passengers[0].amount !== 0) {
      throw new Error('Bələdçi üçün manifestdə sərnişin ödədiyi məbləğ 0/məxfi olmalıdır!');
    }
    console.log('✅ Guide üçün manifestdə qiymətlər uğurla gizlədildi (0 AZN).');
  }

  // Test 5: Excel və CSV İxracı (Həm Rəhbər, Həm Bələdçi)
  console.log('\n[TEST 5] Excel və CSV İxracı...');
  const ownerExcel = await vendorService.exportDashboardExcel(companyId, 'month', user);
  console.log('✅ OWNER Excel buffer ölçüsü:', ownerExcel.length, 'bytes');
  if (!ownerExcel || ownerExcel.length < 500) throw new Error('Excel buffer yaradılmadı!');

  const guideExcel = await vendorService.exportDashboardExcel(companyId, 'month', guideUser);
  console.log('✅ GUIDE Excel buffer ölçüsü (xətasız generasiya):', guideExcel.length, 'bytes');

  const ownerCsv = await vendorService.exportDashboardSummary(companyId, 'month', user);
  console.log('✅ OWNER CSV uzunluğu:', ownerCsv.length, 'simvol (Gəlir ehtiva edir)');

  const guideCsv = await vendorService.exportDashboardSummary(companyId, 'month', guideUser);
  if (!guideCsv.includes('Məxfi')) {
    throw new Error('Bələdçi CSV-də Məxfi qeydi olmalıdır!');
  }
  console.log('✅ GUIDE CSV uğurla "Məxfi" qeydlərini ehtiva edir.');

  console.log('\n🎉 BÜTÜN MƏRHƏLƏ 1 TESTLƏRİ UĞURLA TAMAMLANDI! 🚀');
}

main()
  .catch(err => {
    console.error('❌ TEST XƏTASI:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
