import prisma from '../config/db.js';
import subscriptionsService from '../modules/subscriptions/subscriptions.service.js';

async function runMasterE2ETests() {
  console.log('========================================================================');
  console.log('👑 TOURSALES SUBSCRIPTION & BILLING: MASTER END-TO-END VERIFICATION 👑');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  [PASS] #${total} ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] #${total} ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. VENDOR GİRİŞİ VƏ TOKEN ALINMASI
    // -------------------------------------------------------------------------
    console.log('--- 1. Autentifikasiya və Vendor Sessiyası ---');
    const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aztour@gmail.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.accessToken;
    assert(loginRes.ok && !!token, 'Vendor (aztour@gmail.com) uğurla daxil oldu və JWT access token təyin edildi');

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
    const companyId = 'C-586288';

    // -------------------------------------------------------------------------
    // 2. BÜTÜN PLANLARIN GƏTİRİLMƏSİ (STARTER, PRO, ENTERPRISE)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Abunəlik Planları və Qiymət Siyafı ---');
    const plansRes = await fetch('http://localhost:5000/api/v1/subscriptions/plans', { headers });
    const plansData = await plansRes.json();
    assert(plansRes.ok && Array.isArray(plansData.data), 'GET /subscriptions/plans bütün mövcud planları qaytardı');
    const plans = plansData.data;
    assert(plans.length >= 3, `Ən azı 3 plan mövcuddur (Tapıldı: ${plans.length})`);
    const planNames = plans.map(p => p.name).join(', ');
    console.log(`    -> Mövcud planlar: ${planNames}`);

    // -------------------------------------------------------------------------
    // 3. CARİ ABUNƏLİK VƏ ÇOX-KVOTALI MƏLUMATLAR
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Çox-Kvotali İstifadə Paneli və Şirkət Məlumatları ---');
    const curRes = await fetch('http://localhost:5000/api/v1/subscriptions/current', { headers });
    const curData = await curRes.json();
    assert(curRes.ok && curData.status === 'success', 'GET /subscriptions/current HTTP 200 OK');
    const sub = curData.data;

    assert(sub.companyId === companyId, `Şirkət ID uyğundur (${sub.companyId})`);
    assert(typeof sub.maxTours === 'number', `maxTours ədəddir (${sub.maxTours})`);
    assert(typeof sub.activeToursCount === 'number', `activeToursCount (${sub.activeToursCount}) qaytarıldı`);
    assert(typeof sub.maxMembers === 'number', `maxMembers (${sub.maxMembers}) qaytarıldı`);
    assert(typeof sub.activeMembersCount === 'number', `activeMembersCount (${sub.activeMembersCount}) qaytarıldı`);
    assert(typeof sub.maxApiKeys === 'number', `maxApiKeys (${sub.maxApiKeys}) qaytarıldı`);
    assert(typeof sub.activeApiKeysCount === 'number', `activeApiKeysCount (${sub.activeApiKeysCount}) qaytarıldı`);
    assert(typeof sub.daysLeft === 'number', `daysLeft (${sub.daysLeft} gün) hesablandı`);
    assert(typeof sub.autoRenewSubscription === 'boolean', `autoRenewSubscription statusu: ${sub.autoRenewSubscription}`);

    // -------------------------------------------------------------------------
    // 4. AVTOMATİK YENİLƏNMƏ REJİMİNİN (AUTO-RENEW) İDARƏ EDİLMƏSİ
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Avtomatik Yenilənmə Rejimi (Auto-Renew Toggle) ---');
    const toggleToFalse = await fetch('http://localhost:5000/api/v1/subscriptions/auto-renewal', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ autoRenew: false })
    });
    const toggleData1 = await toggleToFalse.json();
    assert(toggleToFalse.ok && toggleData1.data?.autoRenewSubscription === false, 'Auto-renewal uğurla DEAKTİV edildi');

    const toggleToTrue = await fetch('http://localhost:5000/api/v1/subscriptions/auto-renewal', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ autoRenew: true })
    });
    const toggleData2 = await toggleToTrue.json();
    assert(toggleToTrue.ok && toggleData2.data?.autoRenewSubscription === true, 'Auto-renewal uğurla AKTİVLƏŞDİRİLDİ');

    // -------------------------------------------------------------------------
    // 5. ÇOXMETODLU ÖDƏNİŞ VƏ TƏHLÜKƏSİZLİK GUARD-LARI
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Çoxmetodlu Ödəniş Kanalları və Guard-lar ---');

    // A) Platforma balansı yetmirsə -> Rədd edilir
    const compDb = await prisma.company.findUnique({ where: { id: companyId } });
    const currentBal = Number(compDb.availableBalance || 0);
    const requiredBigAmount = 1430; // Enterprise illik
    if (currentBal < requiredBigAmount) {
      const overBalRes = await fetch('http://localhost:5000/api/v1/subscriptions/change-plan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          planId: 'SP-ENTERPRISE',
          billingCycle: 'YEARLY',
          paymentMethod: 'BALANCE'
        })
      });
      assert(overBalRes.status === 400, 'Balans kifayət etmədikdə sistem ödənişi təhlükəsiz şəkildə blokladı (HTTP 400)');
    }

    // B) Onlayn Bank Kartı ilə Ödəniş
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
    assert(cardPayRes.ok && cardPayData.data?.status === 'Paid', 'Bank Kartı ilə Pro planı dərhal aktivləşdirildi (Status: Paid)');

    // C) B2B Bank Köçürməsi (Pending faktura)
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
    assert(b2bPayRes.ok && b2bPayData.data?.status === 'Pending', 'B2B Bank Köçürməsi ilə rəsmi invoys yaradıldı (Status: Pending)');
    const b2bPaymentId = b2bPayData.data?.paymentId;

    // D) Planı təkrar SP-PRO-ya qaytarırıq (stabil mühit üçün)
    await fetch('http://localhost:5000/api/v1/subscriptions/change-plan', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        planId: 'SP-PRO',
        billingCycle: 'MONTHLY',
        paymentMethod: 'CARD'
      })
    });

    // -------------------------------------------------------------------------
    // 6. AĞILLI DOWNGRADE GUARD
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Ağıllı Downgrade Guard Testi ---');
    const activeTours = await prisma.tour.count({
      where: { companyId, status: 'Active', deletedAt: null }
    });
    console.log(`    -> Mövcud aktiv tur sayı: ${activeTours} (Starter limiti: 5)`);
    if (activeTours > 5) {
      const downRes = await fetch('http://localhost:5000/api/v1/subscriptions/change-plan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          planId: 'SP-STARTER',
          billingCycle: 'MONTHLY',
          paymentMethod: 'CARD'
        })
      });
      assert(downRes.status === 400, 'Aktiv tur sayı Starter limitini aşdığı üçün Downgrade Guard blokladı (HTTP 400)');
    }

    // -------------------------------------------------------------------------
    // 7. ELEKTRON FAKTURA VƏ ÇAP REKVİZİTLƏRİ
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Rəsmi Elektron Faktura və Çap / PDF Strukturu ---');
    if (b2bPaymentId) {
      const invRes = await fetch(`http://localhost:5000/api/v1/subscriptions/invoice/${b2bPaymentId}`, { headers });
      const invData = await invRes.json();
      assert(invRes.ok && !!invData.data, 'GET /subscriptions/invoice/:paymentId faktura detallarını qaytardı');
      const invoice = invData.data;
      assert(invoice.seller.voen === '1405987121', 'Xidmət göstərən (TOURSALES MMC) VÖEN rekvizitləri dəqiqdir');
      assert(!!invoice.customer.name, `Müştəri şirkət adı qeyd olunub: ${invoice.customer.name}`);
      assert(Array.isArray(invoice.items) && invoice.items.length > 0, 'Faktura bəndləri və lisenziya xidməti mövcuddur');
      assert(invoice.total > 0, `Yekun faktura məbləği hesablandı: ${invoice.total} ${invoice.currency}`);
    }

    // -------------------------------------------------------------------------
    // 8. FAKTURAR VƏ ÖDƏNİŞ TARİXÇƏSİ CƏDVƏLİ
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Faktura və Ödəniş Tarixçəsi Cədvəli ---');
    const historyRes = await fetch('http://localhost:5000/api/v1/subscriptions/payments', { headers });
    const historyData = await historyRes.json();
    assert(historyRes.ok && Array.isArray(historyData.data), 'GET /subscriptions/payments tarixçəni qaytardı');
    assert(historyData.data.length >= 2, `Tarixçədə fakturalar mövcuddur (Tapıldı: ${historyData.data.length})`);

    // -------------------------------------------------------------------------
    // 9. CRON İŞİ VƏ AVTOMATİK YENİLƏNMƏ MOTORU
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Cron Motoru və Avtomatik Balansdan Yenilənmə Simulyasiyası ---');
    // Test üçün xüsusi test şirkəti və ya cari şirkətin vaxtını müvəqqəti keçmiş tarixə qoyub cron-u yoxlayırıq
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.company.update({
      where: { id: companyId },
      data: {
        nextBillingDate: yesterday,
        autoRenewSubscription: true
      }
    });

    // Avtomatik cron metodunu birbaşa çağırırıq
    const cronResult = await subscriptionsService.processSubscriptionAutoRenewals();
    assert(typeof cronResult.totalDue === 'number', 'Cron prosesi icra olundu və nəticə hesabatı təqdim edildi');
    console.log(`    -> Cron icra hesabatı:`, cronResult);

    // Yoxlayırıq ki, şirkətin növbəti hesablaşma tarixi artıq gələcəyə çəkildi
    const updatedComp = await prisma.company.findUnique({ where: { id: companyId } });
    assert(new Date(updatedComp.nextBillingDate) > new Date(), 'Şirkətin nextBillingDate tarixi avtomatik olaraq növbəti aya uzadıldı');

    // -------------------------------------------------------------------------
    // 10. SAAS KVOTA GUARD-LARININ DİGƏR MODULLARDA İNTELİQENT İŞLƏMƏSİ
    // -------------------------------------------------------------------------
    console.log('\n--- 10. SaaS Kvota Guard-larının Sistem İnteqrasiyası ---');
    // API Keys guard
    const apiKeyLimitRes = await fetch('http://localhost:5000/api/v1/api-keys', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'E2E Excess Key' })
    });
    assert(apiKeyLimitRes.status === 400, 'API Keys limiti dolduqda sistem yeni açar yaradılmasına imkan vermir (HTTP 400)');

    console.log('\n========================================================================');
    console.log(`🏆 BÜTÜN MASTER E2E TESTLƏRİ UĞURLA TAMAMLANDI! (${passed}/${total} test - 100%)`);
    console.log('✅ Bütün Abunəlik & Hesablaşma infrastrukturu tam funksional və etibarlıdır!');
    console.log('========================================================================\n');

  } catch (err) {
    console.error('\n❌ MASTER E2E TEST XƏTASI:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMasterE2ETests();
