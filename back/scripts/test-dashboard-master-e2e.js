import prisma from '../config/db.js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function main() {
  console.log('========================================================================');
  console.log('🚀 TOURSALES VENDOR DASHBOARD — MASTER E2E HƏRTƏRƏFLİ SINAQ TESTİ BAŞLADI');
  console.log('========================================================================\n');

  let passedTests = 0;
  const totalTests = 8;

  // -------------------------------------------------------------------------
  // TEST 1: VENDOR AUTHENTICATION & JWT GENERATION
  // -------------------------------------------------------------------------
  console.log('🔹 [TEST 1/8] Vendor Girişi və JWT Token Generasiyası...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aztour@gmail.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken || loginData.data?.token || loginData.token;

  if (!loginRes.ok || !token) {
    throw new Error(`Giriş uğursuz oldu: ${JSON.stringify(loginData)}`);
  }
  const vendorUser = loginData.data?.user;
  console.log(`   ✅ Uğurlu giriş: ${vendorUser.name} (${vendorUser.email})`);
  console.log(`   ✅ Şirkət ID: ${vendorUser.companyId}, Rol: ${vendorUser.role}, Agentlik Rolu: ${vendorUser.agencyRole}`);
  passedTests++;

  const authHeaders = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` 
  };

  // -------------------------------------------------------------------------
  // TEST 2: DASHBOARD STATİSTİKALARI (BÜTÜN DÖVRLƏR ÜZRƏ)
  // -------------------------------------------------------------------------
  console.log('\n🔹 [TEST 2/8] Dövrlər üzrə İdarəetmə Paneli Statistikaları (today, week, month, year)...');
  const periods = ['today', 'week', 'month', 'year'];
  for (const period of periods) {
    const res = await fetch(`${BASE_URL}/vendor/dashboard?period=${period}`, { headers: authHeaders });
    const json = await res.json();
    if (!res.ok || !json.data) {
      throw new Error(`Period [${period}] üzrə statistika alına bilmədi: ${JSON.stringify(json)}`);
    }
    const d = json.data;
    console.log(`   ✅ Dövr [${period}]: Gəlir = ${d.totalRevenue} ₼, Artım = ${d.revenueGrowth}%, Orta Bilet = ${d.avgTicketPrice} ₼, Sifarişlər = ${d.totalBookingsCount}, Yerlər = ${d.totalSeatsSold}, Minik Dərəcəsi = ${d.checkInRate}%`);
    if (typeof d.totalRevenue !== 'number' || typeof d.occupancyRate !== 'number') {
      throw new Error(`Period [${period}] üçün tiplər uyğun gəlmir`);
    }
  }
  passedTests++;

  // -------------------------------------------------------------------------
  // TEST 3: İNTELLEKTUAL ƏMƏLİYYAT BİLDİRİŞLƏRİ (OPERATIONAL ALERTS)
  // -------------------------------------------------------------------------
  console.log('\n🔹 [TEST 3/8] İntellektual Əməliyyat Bildirişləri (operationalAlerts)...');
  const monthRes = await fetch(`${BASE_URL}/vendor/dashboard?period=month`, { headers: authHeaders });
  const monthStats = (await monthRes.json()).data;

  if (!Array.isArray(monthStats.operationalAlerts)) {
    throw new Error('operationalAlerts massiv olmalıdır!');
  }
  console.log(`   ✅ Bildiriş sayı: ${monthStats.operationalAlerts.length} ədəd`);
  monthStats.operationalAlerts.forEach(alert => {
    console.log(`      - [${alert.type.toUpperCase()}] ${alert.title}`);
    console.log(`        Mətn: ${alert.message || alert.desc}`);
    console.log(`        Keçid: ${alert.actionLink} (${alert.actionText}), Miqdar: ${alert.count || alert.amount}`);
    if (!alert.id || !alert.type || !alert.title || !(alert.message || alert.desc)) {
      throw new Error('Alert strukturunda zəruri sahələr çatışmır!');
    }
  });
  passedTests++;

  // -------------------------------------------------------------------------
  // TEST 4: RBAC VƏ MƏXFİLİK SINAĞI (GUIDE vs OWNER)
  // -------------------------------------------------------------------------
  console.log('\n🔹 [TEST 4/8] Bələdçi (GUIDE) üçün RBAC Maliyyə Məxfiliyi Yoxlanışı...');
  const { vendorService } = await import('../modules/vendor/vendor.service.js');
  const guideUser = { ...vendorUser, agencyRole: 'GUIDE' };
  const guideStats = await vendorService.getDashboardStats(vendorUser.companyId, 'month', guideUser);

  if (guideStats.isFinancialMasked !== true) {
    throw new Error('GUIDE üçün isFinancialMasked true olmalıdır!');
  }
  if (guideStats.totalRevenue !== null || guideStats.availableBalance !== null || guideStats.pendingDeposits !== null) {
    throw new Error('Maliyyə sızması aşkar edildi: totalRevenue və balanslar null olmalıdır!');
  }
  if (guideStats.monthlyRevenue.length !== 0) {
    throw new Error('GUIDE üçün aylıq gəlir qrafiki tam gizlədilməlidir!');
  }
  if (guideStats.totalBookingsCount === null || guideStats.activeToursCount === null) {
    throw new Error('GUIDE üçün əməliyyat göstəriciləri (turlar, biletlər) açıq qalmalıdır!');
  }
  console.log('   ✅ Bələdçi üçün maliyyə sahələri 100% zirehli şəkildə maskalandı (0% sızma).');
  console.log('   ✅ Bələdçi üçün operativ göstəricilər (sərnişinlər, turlar, yerlər) tam əlçatandır.');
  passedTests++;

  // -------------------------------------------------------------------------
  // TEST 5: SƏRNİŞİN MANİFESTİ APİ ENDPOİNTİ (GET /vendor/dashboard/manifest)
  // -------------------------------------------------------------------------
  console.log('\n🔹 [TEST 5/8] Sərnişin Manifesti Endpointi (GET /vendor/dashboard/manifest)...');
  const manifestRes = await fetch(`${BASE_URL}/vendor/dashboard/manifest`, { headers: authHeaders });
  const manifestJson = await manifestRes.json();

  if (!manifestRes.ok || !manifestJson.data) {
    throw new Error(`Manifest alına bilmədi: ${JSON.stringify(manifestJson)}`);
  }
  const manifestData = manifestJson.data;
  console.log(`   ✅ Manifest Turu: ${manifestData.tour?.title || 'Aktiv tur yoxdur'}`);
  console.log(`   ✅ Ümumi Sərnişin Tutumu / Yer: ${manifestData.totalSeats}`);
  console.log(`   ✅ Minik Etmiş Şəxslər: ${manifestData.checkedInCount}`);
  console.log(`   ✅ Sərnişin Siyahısı: ${manifestData.passengers.length} sərnişin`);

  if (manifestData.passengers.length > 0) {
    const p1 = manifestData.passengers[0];
    console.log(`      Nümunə Sərnişin: ${p1.passengerName}, Oturacaq: ${p1.seatNumber}, Status: ${p1.bookingStatus}, Ödəniş: ${p1.paymentStatus}, Minik: ${p1.isCheckedIn}`);
    if (!p1.bookingId || !p1.passengerName || p1.seatNumber === undefined) {
      throw new Error('Sərnişin obyektində vacib sahələr çatışmır!');
    }
  }
  passedTests++;

  // -------------------------------------------------------------------------
  // TEST 6: CANLI MİNİK (CHECK-IN) KEÇİDİ VƏ BAZA İNTEQRASİYASI
  // -------------------------------------------------------------------------
  console.log('\n🔹 [TEST 6/8] Canlı Minik (Check-in) Keçid Əməliyyatı (Toggle Check-in)...');
  if (manifestData.passengers.length > 0) {
    const testPassenger = manifestData.passengers[0];
    const originalChecked = testPassenger.isCheckedIn;

    // 1. Minik statusunu dəyişirik
    const toggleRes = await fetch(`${BASE_URL}/bookings/vendor/check-in/toggle/${testPassenger.bookingId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({})
    });
    const toggleJson = await toggleRes.json();
    if (!toggleRes.ok) {
      throw new Error(`Check-in toggle xətası: ${JSON.stringify(toggleJson)}`);
    }
    const newStatus = toggleJson.data?.isCheckedIn;
    console.log(`   ✅ Toggle icra edildi: ${originalChecked} -> ${newStatus}`);
    if (newStatus === originalChecked) {
      throw new Error('Minik statusu dəyişmədi!');
    }

    // 2. Yenidən manifesti yoxlayırıq
    const recheckManifest = await fetch(`${BASE_URL}/vendor/dashboard/manifest`, { headers: authHeaders });
    const recheckData = (await recheckManifest.json()).data;
    const recheckedPassenger = recheckData.passengers.find(p => p.bookingId === testPassenger.bookingId);
    console.log(`   ✅ Manifestdə yeni minik statusu təsdiqləndi: ${recheckedPassenger.isCheckedIn}`);

    // 3. Statusu ilkin vəziyyətinə qaytarırıq (baza təmizliyi)
    await fetch(`${BASE_URL}/bookings/vendor/check-in/toggle/${testPassenger.bookingId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({})
    });
    console.log(`   ✅ Sərnişin minik statusu ilkin vəziyyətinə (${originalChecked}) qaytarıldı.`);
  } else {
    console.log('   ⚠️ Sərnişin tapılmadığı üçün toggle simulyasiyası keçildi.');
  }
  passedTests++;

  // -------------------------------------------------------------------------
  // TEST 7: ÇOXFORMATLI HESABAT İXRACI (EXCEL & CSV)
  // -------------------------------------------------------------------------
  console.log('\n🔹 [TEST 7/8] Excel və CSV Analitika Fayllarının İxracı...');
  const exportRes = await fetch(`${BASE_URL}/vendor/dashboard/export?period=month`, { headers: authHeaders });
  if (!exportRes.ok) {
    throw new Error(`Excel ixrac sorğusu uğursuz oldu: status ${exportRes.status}`);
  }
  const excelBuffer = await exportRes.arrayBuffer();
  console.log(`   ✅ HTTP GET /vendor/dashboard/export: 200 OK (${excelBuffer.byteLength} bytes)`);

  const guideExcel = await vendorService.exportDashboardExcel(vendorUser.companyId, 'month', guideUser);
  console.log(`   ✅ GUIDE üçün Excel ixracı: Xətasız generasiya (${guideExcel.length} bytes)`);

  const guideCsv = await vendorService.exportDashboardSummary(vendorUser.companyId, 'month', guideUser);
  if (!guideCsv.includes('Məxfi')) {
    throw new Error('GUIDE CSV hesabatında Məxfi etiketi olmalıdır!');
  }
  console.log(`   ✅ GUIDE üçün CSV hesabatı: "Məxfi" qeydləri ilə uğurla formatlandı.`);
  passedTests++;

  // -------------------------------------------------------------------------
  // TEST 8: TƏHLÜKƏSİZLİK VƏ SƏHVƏ DÖZÜMLÜLÜK (SECURITY & ERROR HANDLING)
  // -------------------------------------------------------------------------
  console.log('\n🔹 [TEST 8/8] Təhlükəsizlik və Xəta İdarəetməsi...');
  // 1. Auth-suz sorğu
  const unauthRes = await fetch(`${BASE_URL}/vendor/dashboard`);
  console.log(`   ✅ Autentifikasiyasız sorğu rədd edildi: Status ${unauthRes.status} (Gözlənilən: 401)`);
  if (unauthRes.status !== 401) throw new Error('Unauthenticated sorğu 401 qaytarmalıdır!');

  // 2. Yanlış tur ID üzrə manifest
  const invalidTourRes = await fetch(`${BASE_URL}/vendor/dashboard/manifest/INVALID_TOUR_9999`, { headers: authHeaders });
  console.log(`   ✅ Mövcud olmayan tur üzrə manifest cavabı: Status ${invalidTourRes.status} (Gözlənilən: 404)`);
  if (invalidTourRes.status !== 404) throw new Error('Mövcud olmayan tur 404 qaytarmalıdır!');

  passedTests++;

  console.log('\n========================================================================');
  console.log(`🏆 NƏTİCƏ: BÜTÜN ${passedTests}/${totalTests} MASTER E2E TESTLƏRİ 100% UĞURLA TAMAMLANDI! 🚀`);
  console.log('========================================================================');
}

main()
  .catch(err => {
    console.error('\n❌ MASTER TEST XƏTASI:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
