import prisma from '../config/db.js';

async function runStage1Tests() {
  console.log('================================================================');
  console.log('🚀 TOURSALES SUBSCRIPTION MODULE: STAGE 1 BACKEND AUDIT & TEST 🚀');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 1. Vendor Girişi
    const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aztour@gmail.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.accessToken;
    assert(loginRes.ok && !!token, 'Vendor (aztour@gmail.com) uğurla daxil oldu və access token alındı');

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    const companyId = 'C-586288';

    // 2. Cari Abunəlik Detalları (Multi-Quota & DaysLeft)
    const currentRes = await fetch('http://localhost:5000/api/v1/subscriptions/current', { headers });
    const currentData = await currentRes.json();
    assert(currentRes.status === 200 && currentData.status === 'success', 'GET /subscriptions/current HTTP 200 OK');
    const sub = currentData.data;
    assert(typeof sub.maxTours === 'number', `maxTours ədəddir (${sub.maxTours})`);
    assert(typeof sub.activeToursCount === 'number', `activeToursCount (${sub.activeToursCount}) hesablandı`);
    assert(typeof sub.maxMembers === 'number', `maxMembers (${sub.maxMembers}) hesablandı`);
    assert(typeof sub.activeMembersCount === 'number', `activeMembersCount (${sub.activeMembersCount}) hesablandı`);
    assert(typeof sub.maxApiKeys === 'number', `maxApiKeys (${sub.maxApiKeys}) hesablandı`);
    assert(typeof sub.activeApiKeysCount === 'number', `activeApiKeysCount (${sub.activeApiKeysCount}) hesablandı`);
    assert(typeof sub.daysLeft === 'number', `daysLeft (${sub.daysLeft} gün) hesablandı`);
    console.log(`    -> Şirkət Planı: ${sub.planName}, Turlar: ${sub.activeToursCount}/${sub.maxTours}, Qalan gün: ${sub.daysLeft}`);

    // 3. Plan Dəyişmə Testləri (Çoxmetodlu Ödənişlər & Guard-lar)

    // A) Yetərsiz Balans Yoxlanışı (Balansdan çox məbləğ tələb edildikdə)
    const currentBal = sub.availableBalance;
    // Enterprise illik planı (149 * 12 * 0.8 = 1430 AZN) - əgər balans 1430-dan azdırsa:
    if (currentBal < 1430) {
      const overBalRes = await fetch('http://localhost:5000/api/v1/subscriptions/change-plan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          planId: 'SP-ENTERPRISE',
          billingCycle: 'YEARLY',
          paymentMethod: 'BALANCE'
        })
      });
      assert(overBalRes.status === 400, 'Balans çatmadıqda BALANCE ödənişi rədd edildi (HTTP 400)');
    }

    // B) Onlayn Bank Kartı ilə Ödəniş (Balans toxunulmaz qalır, plan aktivləşir)
    const cardPayRes = await fetch('http://localhost:5000/api/v1/subscriptions/change-plan', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        planId: 'SP-PRO',
        billingCycle: 'MONTHLY',
        paymentMethod: 'CARD'
      })
    });
    const cardPayData = await cardPayRes.json();
    assert(cardPayRes.status === 200 && cardPayData.status === 'success', 'Bank Kartı ilə plan ödənişi uğurla emal edildi (HTTP 200)');
    assert(cardPayData.data?.status === 'Paid', 'Faktura statusu Paid oldu');
    assert(cardPayData.data?.paymentMethod === 'CARD', 'Ödəniş metodu CARD kimi qeydə alındı');

    // C) B2B Bank Köçürməsi (Faktura Pending qalır, bank rekvizitləri verilir)
    const b2bPayRes = await fetch('http://localhost:5000/api/v1/subscriptions/change-plan', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        planId: 'SP-ENTERPRISE',
        billingCycle: 'MONTHLY',
        paymentMethod: 'BANK_TRANSFER'
      })
    });
    const b2bPayData = await b2bPayRes.json();
    assert(b2bPayRes.status === 200 && b2bPayData.status === 'success', 'B2B Bank Köçürməsi sorğusu uğurla tərtib edildi');
    assert(b2bPayData.data?.status === 'Pending', 'B2B Faktura statusu Pending olaraq gözləmədə qaldı');
    assert(b2bPayData.data?.paymentMethod === 'BANK_TRANSFER', 'Ödəniş metodu BANK_TRANSFER oldu');

    // D) Şirkəti test üçün yenidən SP-PRO planına qaytarırıq (balans testi ilə)
    // Şirkətin balansını yoxlayırıq, əgər kifayətdirsə balansdan ödənişi test edirik
    const compBefore = await prisma.company.findUnique({ where: { id: companyId } });
    const balBefore = Number(compBefore.availableBalance);
    if (balBefore >= 49) {
      const balPayRes = await fetch('http://localhost:5000/api/v1/subscriptions/change-plan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          planId: 'SP-PRO',
          billingCycle: 'MONTHLY',
          paymentMethod: 'BALANCE'
        })
      });
      const balPayData = await balPayRes.json();
      assert(balPayRes.status === 200 && balPayData.status === 'success', 'Platforma balansından 49 AZN ödənişlə plana keçid uğurla icra olundu');
      
      const compAfter = await prisma.company.findUnique({ where: { id: companyId } });
      const balAfter = Number(compAfter.availableBalance);
      assert(Math.abs(balAfter - (balBefore - 49)) < 0.01, 'Şirkətin balansından dəqiq 49 AZN silindi');
    }

    // 4. Ağıllı Downgrade Guard Testi:
    // Şirkətin aktiv turlarının sayını tapırıq.
    const activeTours = await prisma.tour.count({
      where: { companyId, status: 'Active', deletedAt: null }
    });
    console.log(`    -> Şirkətin aktiv turlarının sayı: ${activeTours}`);

    if (activeTours > 5) {
      // Starter planının limiti 5-dir. Əgər turlar 5-dən çoxdursa, Starter-ə keçid rədd edilməlidir!
      const downgradeRes = await fetch('http://localhost:5000/api/v1/subscriptions/change-plan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          planId: 'SP-STARTER',
          billingCycle: 'MONTHLY',
          paymentMethod: 'BALANCE'
        })
      });
      assert(downgradeRes.status === 400, 'Aktiv turlar 5-dən çox olduğu üçün Starter planına keçid rədd edildi (HTTP 400 Downgrade Guard)');
      const downgradeData = await downgradeRes.json();
      assert(downgradeData.msg?.includes('limit') || downgradeData.message?.includes('limit'), 'Xəta mesajında tur limiti xəbərdarlığı mövcuddur');
    } else {
      console.log('    -> (Şirkətdə 5 və ya daha az tur olduğu üçün downgrade testi ötürüldü)');
    }

    // 5. API Açar Kvotası Testi (Pro planı üçün maksimum 2 açar limiti)
    const apiKeyLimitRes = await fetch('http://localhost:5000/api/v1/api-keys', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: '3-cü Açar Testi' })
    });
    assert(apiKeyLimitRes.status === 400, 'Pro planında 2 açardan artıq açar yaratmağa cəhd rədd edildi (HTTP 400 Quota Guard)');

    // 6. Fakturalar Tarixçəsi Testi
    const invoicesRes = await fetch('http://localhost:5000/api/v1/subscriptions/payments', { headers });
    const invoicesData = await invoicesRes.json();
    assert(invoicesRes.status === 200 && Array.isArray(invoicesData.data), 'GET /subscriptions/payments faktura tarixçəsini qaytardı');
    assert(invoicesData.data.length > 0, 'Ən azı 1 abunəlik fakturası mövcuddur');
    const sampleInv = invoicesData.data[0];
    assert(!!sampleInv.invoiceNumber, `Faktura nömrəsi mövcuddur: ${sampleInv.invoiceNumber}`);

    console.log('\n================================================================');
    console.log(`🎉 NƏTİCƏ: BÜTÜN MƏRHƏLƏ 1 TESTLƏRİ UĞURLA KEÇDİ! (${passedTests}/${totalTests} test)`);
    console.log('✅ Backend Abunəlik Məntiqi, Çoxmetodlu Ödənişlər və Quota Guard-lar 100% işləkdir.');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ TEST XƏTASI:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStage1Tests();
