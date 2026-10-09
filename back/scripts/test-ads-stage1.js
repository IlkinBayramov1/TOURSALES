import prisma from '../config/db.js';

async function runAdsStage1Tests() {
  console.log('========================================================================');
  console.log('📢 TOURSALES ADS & CAMPAIGNS MODULE: STAGE 1 BACKEND VERIFICATION 📢');
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

  const BASE_URL = 'http://localhost:5000/api/v1';

  try {
    // -------------------------------------------------------------------------
    // 1. DÖRD ROL ÜZRƏ GİRİŞ VƏ TOKEN ƏLDƏ EDİLMƏSİ
    // -------------------------------------------------------------------------
    console.log('--- 1. Bütün Rollar Üzrə Giriş və Token Əldə Edilməsi ---');

    async function loginAs(email, password = 'password123') {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      return { status: res.status, ok: res.ok, token: data.data?.accessToken, user: data.data?.user };
    }

    const ownerAuth = await loginAs('aztour@gmail.com');
    assert(ownerAuth.ok && !!ownerAuth.token, 'Owner (aztour@gmail.com) daxil oldu');

    const managerAuth = await loginAs('elvin@aztour.az');
    assert(managerAuth.ok && !!managerAuth.token, 'Manager (elvin@aztour.az) daxil oldu');

    const accountantAuth = await loginAs('aysel@aztour.az');
    assert(accountantAuth.ok && !!accountantAuth.token, 'Accountant (aysel@aztour.az) daxil oldu');

    const guideAuth = await loginAs('murad@aztour.az');
    assert(guideAuth.ok && !!guideAuth.token, 'Guide (murad@aztour.az) daxil oldu');

    const ownerHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerAuth.token}` };
    const managerHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${managerAuth.token}` };
    const accountantHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${accountantAuth.token}` };
    const guideHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${guideAuth.token}` };

    const companyId = 'C-586288';

    // -------------------------------------------------------------------------
    // 2. RBAC SƏLAHİYYƏT QORUMASI YOXLANIŞI
    // -------------------------------------------------------------------------
    console.log('\n--- 2. RBAC Səlahiyyət Qoruması Yoxlanışı ---');

    // Guide Ads & Campaigns GET-lərinə daxil ola BİLMƏMƏLİDİR (403)
    const guideAdsRes = await fetch(`${BASE_URL}/ads`, { headers: guideHeaders });
    assert(guideAdsRes.status === 403, 'Guide üçün GET /api/v1/ads bloklandı (403 Forbidden)');

    const guideCampaignsRes = await fetch(`${BASE_URL}/campaigns`, { headers: guideHeaders });
    assert(guideCampaignsRes.status === 403, 'Guide üçün GET /api/v1/campaigns bloklandı (403 Forbidden)');

    // Guide reklam və kampaniya yarada BİLMƏMƏLİDİR (403)
    const guidePurchaseRes = await fetch(`${BASE_URL}/ads/purchase`, {
      method: 'POST',
      headers: guideHeaders,
      body: JSON.stringify({ packageId: 'ADP-7D', title: 'Qadağan Test' })
    });
    assert(guidePurchaseRes.status === 403, 'Guide üçün POST /api/v1/ads/purchase bloklandı (403 Forbidden)');

    const guideCreatePromoRes = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: guideHeaders,
      body: JSON.stringify({
        promoCode: 'GUIDEPROMO',
        discountValue: 10,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString()
      })
    });
    assert(guideCreatePromoRes.status === 403, 'Guide üçün POST /api/v1/campaigns bloklandı (403 Forbidden)');

    // Accountant (Maliyyəçi) oxuya BİLƏR (200), amma yarada BİLMƏZ (403)
    const accountantAdsRes = await fetch(`${BASE_URL}/ads`, { headers: accountantHeaders });
    assert(accountantAdsRes.status === 200, 'Accountant üçün GET /api/v1/ads uğurla icazə verildi (200 OK)');

    const accountantCampaignsRes = await fetch(`${BASE_URL}/campaigns`, { headers: accountantHeaders });
    assert(accountantCampaignsRes.status === 200, 'Accountant üçün GET /api/v1/campaigns uğurla icazə verildi (200 OK)');

    const accountantPurchaseRes = await fetch(`${BASE_URL}/ads/purchase`, {
      method: 'POST',
      headers: accountantHeaders,
      body: JSON.stringify({ packageId: 'ADP-7D', title: 'Accountant Qadağan Test' })
    });
    assert(accountantPurchaseRes.status === 403, 'Accountant üçün POST /api/v1/ads/purchase bloklandı (403 Forbidden)');

    const accountantPromoRes = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: accountantHeaders,
      body: JSON.stringify({
        promoCode: 'ACCOUNTSALE',
        discountValue: 15,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString()
      })
    });
    assert(accountantPromoRes.status === 403, 'Accountant üçün POST /api/v1/campaigns bloklandı (403 Forbidden)');

    // Manager və Owner tam oxuma icazəsinə malikdir
    const managerAdsRes = await fetch(`${BASE_URL}/ads`, { headers: managerHeaders });
    assert(managerAdsRes.status === 200, 'Manager üçün GET /api/v1/ads icazə verildi (200 OK)');

    const ownerAdsRes = await fetch(`${BASE_URL}/ads`, { headers: ownerHeaders });
    assert(ownerAdsRes.status === 200, 'Owner üçün GET /api/v1/ads icazə verildi (200 OK)');

    // -------------------------------------------------------------------------
    // 3. PAKETLƏR VƏ MULTİ-METOD ÖDƏNİŞ İLƏ REKLAM ALINMASI
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Paketlər və Multi-Metod Ödəniş ilə Reklam Alınması ---');

    // Paketləri yoxlayırıq və ya təmin edirik
    let pkg7 = await prisma.adPackage.findUnique({ where: { id: 'ADP-7D' } });
    if (!pkg7) {
      pkg7 = await prisma.adPackage.create({
        data: {
          id: 'ADP-7D',
          name: '7 Günlük Standart Vitrin',
          durationDays: 7,
          price: 35.0,
          features: JSON.stringify(['Önə çıxan nişanı', 'Axtarışda prioritet'])
        }
      });
    }

    // Şirkət üçün mövcud tur tapırıq
    const tour = await prisma.tour.findFirst({ where: { companyId } });
    const tourId = tour?.id || null;

    // 3a. Qeyri-kafi Balans ilə 'BALANCE' metodu cəhdi (Error 400 olmalıdır)
    await prisma.company.update({
      where: { id: companyId },
      data: { availableBalance: 10.0 } // 35 AZN-dən az
    });

    const lowBalanceRes = await fetch(`${BASE_URL}/ads/purchase`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        packageId: 'ADP-7D',
        tourId,
        title: 'Qeyri-kafi Balans Reklamı',
        paymentMethod: 'BALANCE',
        position: 'HERO'
      })
    });
    const lowBalanceData = await lowBalanceRes.json();
    assert(
      lowBalanceRes.status === 400 && lowBalanceData.msg?.includes('kifayət qədər vəsait yoxdur'),
      'Qeyri-kafi balans zamanı BALANCE metodu rədd edildi (400 Bad Request)'
    );

    // 3b. Kafi Balans ilə 'BALANCE' metodu ilə reklam alışı
    await prisma.company.update({
      where: { id: companyId },
      data: { availableBalance: 200.0 }
    });

    const balancePurchaseRes = await fetch(`${BASE_URL}/ads/purchase`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        packageId: 'ADP-7D',
        tourId,
        title: 'Bahar Kampaniyası Quba Turu',
        paymentMethod: 'BALANCE',
        position: 'HERO'
      })
    });
    const balancePurchaseData = await balancePurchaseRes.json();
    assert(balancePurchaseRes.status === 201 && balancePurchaseData.data?.id, 'Platforma Balansı ilə reklam alındı (201 Created)');

    const createdAd1 = balancePurchaseData.data;

    // Balansın çıxıldığını və Tranzaksiyanın yaradıldığını yoxlayırıq
    const companyAfterBal = await prisma.company.findUnique({ where: { id: companyId } });
    assert(Number(companyAfterBal.availableBalance) === 165.0, 'Şirkət balansından 35 AZN silindi (200 -> 165 AZN)');

    const balanceTx = await prisma.transaction.findFirst({
      where: { companyId, type: 'MARKETING_AD' },
      orderBy: { createdAt: 'desc' }
    });
    assert(
      balanceTx && Number(balanceTx.amount) === 35.0 && balanceTx.status === 'Completed' && Number(balanceTx.netAmount) === -35.0,
      'Tranzaksiya cədvəlində MARKETING_AD (Completed, netAmount: -35 AZN) yazıldı'
    );

    // Audit Log qeydini yoxlayırıq
    const auditAd1 = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'Ad', entityId: createdAd1.id, action: 'PURCHASE_AD' }
    });
    assert(auditAd1 && auditAd1.performedBy.includes('OWNER'), 'AuditLog cədvəlində PURCHASE_AD (OWNER) uğurla qeydə alındı');

    // 3c. 'CARD' metodu ilə reklam alışı (Balans azalmır, Tranzaksiya Completed olur)
    const cardPurchaseRes = await fetch(`${BASE_URL}/ads/purchase`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({
        packageId: 'ADP-7D',
        tourId,
        title: 'Bank Kartı ilə VIP Qəbələ Reklamı',
        paymentMethod: 'CARD',
        position: 'SIDEBAR'
      })
    });
    const cardPurchaseData = await cardPurchaseRes.json();
    assert(cardPurchaseRes.status === 201 && cardPurchaseData.data?.id, 'Bank Kartı ilə reklam alındı (201 Created)');
    const createdAd2 = cardPurchaseData.data;

    const companyAfterCard = await prisma.company.findUnique({ where: { id: companyId } });
    assert(Number(companyAfterCard.availableBalance) === 165.0, 'Bank Kartı seçimində platforma balansı toxunulmaz qaldı (165 AZN)');

    const cardTx = await prisma.transaction.findFirst({
      where: { companyId, type: 'MARKETING_AD' },
      orderBy: { createdAt: 'desc' }
    });
    assert(
      cardTx && Number(cardTx.amount) === 35.0 && cardTx.status === 'Completed' && Number(cardTx.netAmount) === 0,
      'Bank Kartı tranzaksiyası Completed və netAmount: 0 kimi qeydə alındı'
    );

    const auditAd2 = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'Ad', entityId: createdAd2.id, action: 'PURCHASE_AD' }
    });
    assert(auditAd2 && auditAd2.performedBy.includes('MANAGER'), 'AuditLog-da Manager tərəfindən kart ödənişi qeyd olundu');

    // 3d. 'INVOICE' (B2B Faktura) metodu ilə reklam alışı
    const invoicePurchaseRes = await fetch(`${BASE_URL}/ads/purchase`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        packageId: 'ADP-7D',
        tourId,
        title: 'B2B Fakturalı Şəki Turu Reklamı',
        paymentMethod: 'INVOICE',
        position: 'VIP_LIST'
      })
    });
    const invoicePurchaseData = await invoicePurchaseRes.json();
    assert(invoicePurchaseRes.status === 201 && invoicePurchaseData.data?.id, 'B2B Faktura ilə reklam alındı (201 Created)');
    const createdAd3 = invoicePurchaseData.data;

    const invoiceTx = await prisma.transaction.findFirst({
      where: { companyId, type: 'MARKETING_AD' },
      orderBy: { createdAt: 'desc' }
    });
    assert(
      invoiceTx && invoiceTx.status === 'Pending_Verification' && invoiceTx.description.includes('B2B Faktura'),
      'B2B Faktura tranzaksiyası status: Pending_Verification ilə qeydə alındı'
    );

    // -------------------------------------------------------------------------
    // 4. REKLAM STATUSU DƏYİŞMƏSİ (TOGGLE) VƏ SİLİNMƏSİ
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Reklam Statusunun Dəyişdirilməsi və Silinməsi ---');

    // Statusu Active -> Paused edirik
    const toggleAdRes1 = await fetch(`${BASE_URL}/ads/${createdAd1.id}/status`, {
      method: 'PATCH',
      headers: managerHeaders
    });
    const toggleAdData1 = await toggleAdRes1.json();
    assert(toggleAdRes1.status === 200 && toggleAdData1.data?.status === 'Paused', 'Reklam statusu Active -> Paused dəyişdirildi');

    // AuditLog yoxlanışı
    const auditToggleAd = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'Ad', entityId: createdAd1.id, action: 'TOGGLE_AD_STATUS' },
      orderBy: { createdAt: 'desc' }
    });
    assert(auditToggleAd && auditToggleAd.newValues.includes('Paused'), 'AuditLog-da TOGGLE_AD_STATUS qeydiyyatı təsdiqləndi');

    // Reklamı silirik
    const deleteAdRes = await fetch(`${BASE_URL}/ads/${createdAd1.id}`, {
      method: 'DELETE',
      headers: ownerHeaders
    });
    assert(deleteAdRes.status === 200, 'Reklam uğurla silindi (200 OK)');

    const auditDeleteAd = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'Ad', entityId: createdAd1.id, action: 'DELETE_AD' },
      orderBy: { createdAt: 'desc' }
    });
    assert(auditDeleteAd && auditDeleteAd.performedBy.includes('OWNER'), 'AuditLog-da DELETE_AD qeydiyyatı təsdiqləndi');

    // -------------------------------------------------------------------------
    // 5. KAMPANİYALAR VƏ PROMOKODLAR İDARƏETMƏSİ
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Kampaniyalar və Promokodlar İdarəetməsi ---');

    const testPromoCode = `TESTPROMO${Date.now().toString().slice(-4)}`;

    // Yeni promokod yaradılması
    const createPromoRes = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({
        promoCode: testPromoCode,
        discountType: 'PERCENTAGE',
        discountValue: 15,
        usageLimit: 50,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        description: '15% Yaz Kampaniyası Promokodu'
      })
    });
    const createPromoData = await createPromoRes.json();
    assert(createPromoRes.status === 201 && createPromoData.data?.id, `Promokod ${testPromoCode} uğurla yaradıldı (201 Created)`);
    const createdCampaign = createPromoData.data;

    // Audit Log qeydini yoxlayırıq
    const auditCreatePromo = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'Campaign', entityId: createdCampaign.id, action: 'CREATE_PROMO' }
    });
    assert(auditCreatePromo && auditCreatePromo.performedBy.includes('MANAGER'), 'AuditLog-da CREATE_PROMO uğurla qeydə alındı');

    // Eyni promokod ilə təkrar yaratma cəhdi (409 Conflict verməlidir)
    const duplicatePromoRes = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        promoCode: testPromoCode,
        discountType: 'PERCENTAGE',
        discountValue: 20,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString()
      })
    });
    assert(duplicatePromoRes.status === 409, 'Təkrar promokod yaradılması rədd edildi (409 Conflict)');

    // Promokod statusunu Active -> Paused edirik
    const togglePromoRes = await fetch(`${BASE_URL}/campaigns/${createdCampaign.id}/status`, {
      method: 'PATCH',
      headers: ownerHeaders
    });
    const togglePromoData = await togglePromoRes.json();
    assert(
      togglePromoRes.status === 200 && togglePromoData.data?.status === 'Paused',
      'Promokod statusu Active -> Paused dəyişdirildi'
    );

    const auditTogglePromo = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'Campaign', entityId: createdCampaign.id, action: 'TOGGLE_PROMO_STATUS' }
    });
    assert(auditTogglePromo && auditTogglePromo.newValues.includes('Paused'), 'AuditLog-da TOGGLE_PROMO_STATUS qeydiyyatı təsdiqləndi');

    // Keçmiş tarixli (Expired) kampaniya üzrə status dəyişmə bloklanması testi
    const expiredPromo = await prisma.campaign.create({
      data: {
        id: `CP-EXP-${Date.now().toString().slice(-4)}`,
        companyId,
        type: 'DISCOUNT',
        promoCode: `EXPIRED${Date.now().toString().slice(-4)}`,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        startDate: new Date(Date.now() - 10 * 86400000),
        endDate: new Date(Date.now() - 2 * 86400000), // 2 gün əvvəl bitib
        status: 'Active'
      }
    });

    const toggleExpiredRes = await fetch(`${BASE_URL}/campaigns/${expiredPromo.id}/status`, {
      method: 'PATCH',
      headers: ownerHeaders
    });
    assert(
      toggleExpiredRes.status === 400,
      'Müddəti bitmiş (Expired) promokodun status dəyişməsi bloklandı (400 Bad Request)'
    );

    // Promokodu silirik
    const deletePromoRes = await fetch(`${BASE_URL}/campaigns/${createdCampaign.id}`, {
      method: 'DELETE',
      headers: ownerHeaders
    });
    assert(deletePromoRes.status === 200, 'Promokod uğurla silindi (200 OK)');

    const auditDeletePromo = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'Campaign', entityId: createdCampaign.id, action: 'DELETE_PROMO' }
    });
    assert(auditDeletePromo && auditDeletePromo.performedBy.includes('OWNER'), 'AuditLog-da DELETE_PROMO qeydiyyatı təsdiqləndi');

    // Təmizlik
    await prisma.campaign.delete({ where: { id: expiredPromo.id } }).catch(() => {});
    await prisma.ad.delete({ where: { id: createdAd2.id } }).catch(() => {});
    await prisma.ad.delete({ where: { id: createdAd3.id } }).catch(() => {});

    console.log('\n========================================================================');
    console.log(`🎉 BÜTÜN MƏRHƏLƏ 1 TESTLƏRİ UĞURLA BAŞA ÇATDI: ${passed}/${total} TEST KEÇDİ!`);
    console.log('========================================================================\n');
  } catch (error) {
    console.error('\n❌ TEST XƏTASI:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAdsStage1Tests();
