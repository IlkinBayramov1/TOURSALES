import prisma from '../config/db.js';

async function runAdsCampaignsMasterE2E() {
  console.log('================================================================================');
  console.log('🏆 TOURSALES ADS & CAMPAIGNS MODULE: MASTER E2E VERIFICATION SUITE 🏆');
  console.log('================================================================================\n');

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
    // BLOK 1: BÜTÜN AGENTLİK ROLLARI ÜZRƏ AUTENTİFİKASİYA VƏ RBAC MATRİSİ
    // -------------------------------------------------------------------------
    console.log('--- 1. Agentlik Rolları Üzrə Giriş və RBAC Qoruması ---');

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

    // 1.1 Guide Bloklanması
    const guideAdsRes = await fetch(`${BASE_URL}/ads`, { headers: guideHeaders });
    assert(guideAdsRes.status === 403, 'Guide üçün GET /api/v1/ads bloklandı (403)');

    const guideCampaignsRes = await fetch(`${BASE_URL}/campaigns`, { headers: guideHeaders });
    assert(guideCampaignsRes.status === 403, 'Guide üçün GET /api/v1/campaigns bloklandı (403)');

    const guidePurchaseRes = await fetch(`${BASE_URL}/ads/purchase`, {
      method: 'POST',
      headers: guideHeaders,
      body: JSON.stringify({ packageId: 'ADP-7D', title: 'Qadağan Test' })
    });
    assert(guidePurchaseRes.status === 403, 'Guide üçün POST /api/v1/ads/purchase bloklandı (403)');

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
    assert(guideCreatePromoRes.status === 403, 'Guide üçün POST /api/v1/campaigns bloklandı (403)');

    // 1.2 Accountant İcazələri (Read-Only)
    const accountantAdsRes = await fetch(`${BASE_URL}/ads`, { headers: accountantHeaders });
    assert(accountantAdsRes.status === 200, 'Accountant üçün GET /api/v1/ads icazə verildi (200)');

    const accountantCampaignsRes = await fetch(`${BASE_URL}/campaigns`, { headers: accountantHeaders });
    assert(accountantCampaignsRes.status === 200, 'Accountant üçün GET /api/v1/campaigns icazə verildi (200)');

    const accountantPurchaseRes = await fetch(`${BASE_URL}/ads/purchase`, {
      method: 'POST',
      headers: accountantHeaders,
      body: JSON.stringify({ packageId: 'ADP-7D', title: 'Maliyyəçi Reklamı' })
    });
    assert(accountantPurchaseRes.status === 403, 'Accountant üçün POST /api/v1/ads/purchase bloklandı (403)');

    const accountantPromoRes = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: accountantHeaders,
      body: JSON.stringify({
        promoCode: 'ACCPROMO',
        discountValue: 10,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString()
      })
    });
    assert(accountantPromoRes.status === 403, 'Accountant üçün POST /api/v1/campaigns bloklandı (403)');

    // 1.3 Manager və Owner Tam İcazələri
    const managerAdsRes = await fetch(`${BASE_URL}/ads`, { headers: managerHeaders });
    assert(managerAdsRes.status === 200, 'Manager üçün GET /api/v1/ads icazə verildi (200)');

    const ownerAdsRes = await fetch(`${BASE_URL}/ads`, { headers: ownerHeaders });
    assert(ownerAdsRes.status === 200, 'Owner üçün GET /api/v1/ads icazə verildi (200)');

    // -------------------------------------------------------------------------
    // BLOK 2: REKLAM PAKETLƏRİ VƏ MULTİ-METOD ÖDƏNİŞ İLƏ REKLAM ALINMASI
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Reklam Paketləri və Çoxmetodlu Ödəniş Sistemi ---');

    // Paketlərin oxunması
    const pkgsRes = await fetch(`${BASE_URL}/ads/packages`, { headers: ownerHeaders });
    const pkgsData = await pkgsRes.json();
    assert(pkgsRes.status === 200 && Array.isArray(pkgsData.data) && pkgsData.data.length > 0, 'Reklam paketləri gətirildi (200)');

    const targetPkg = pkgsData.data[0];
    const pkgPrice = Number(targetPkg.price);

    // Tur tapırıq
    const tour = await prisma.tour.findFirst({ where: { companyId } });
    const tourId = tour?.id || null;

    // 2.1 Qeyri-kafi balansla 'BALANCE' cəhdi
    await prisma.company.update({
      where: { id: companyId },
      data: { availableBalance: 5.0 }
    });

    const failBalRes = await fetch(`${BASE_URL}/ads/purchase`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        packageId: targetPkg.id,
        tourId,
        title: 'Qeyri-kafi Balans Reklamı',
        paymentMethod: 'BALANCE',
        position: 'HERO'
      })
    });
    assert(failBalRes.status === 400, 'Kifayət qədər balans olmadıqda BALANCE ödənişi rədd edildi (400)');

    // 2.2 Kafi balansla 'BALANCE' alışı
    await prisma.company.update({
      where: { id: companyId },
      data: { availableBalance: 300.0 }
    });

    const balAdRes = await fetch(`${BASE_URL}/ads/purchase`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        packageId: targetPkg.id,
        tourId,
        title: 'Master E2E Balans Reklamı',
        paymentMethod: 'BALANCE',
        position: 'HERO'
      })
    });
    const balAdData = await balAdRes.json();
    assert(balAdRes.status === 201 && balAdData.data?.id, 'Platforma Balansı ilə reklam alındı (201)');
    const createdAd1 = balAdData.data;

    // Balansın çıxılması və Tranzaksiya yoxlanışı
    const compAfterBal = await prisma.company.findUnique({ where: { id: companyId } });
    assert(Number(compAfterBal.availableBalance) === 300.0 - pkgPrice, `Balansdan dəqiq ${pkgPrice} AZN çıxıldı (Qalıq: ${300 - pkgPrice} AZN)`);

    const txBal = await prisma.transaction.findFirst({
      where: { companyId, type: 'MARKETING_AD' },
      orderBy: { createdAt: 'desc' }
    });
    assert(
      txBal && Number(txBal.amount) === pkgPrice && txBal.status === 'Completed' && Number(txBal.netAmount) === -pkgPrice,
      'Tranzaksiyada Completed statuslu MARKETING_AD qeydi yaradıldı'
    );

    const auditAd1 = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'Ad', entityId: createdAd1.id, action: 'PURCHASE_AD' }
    });
    assert(auditAd1 && auditAd1.performedBy.includes('OWNER'), 'AuditLog-da OWNER tərəfindən PURCHASE_AD qeydə alındı');

    // 2.3 'CARD' metodu ilə alış (Balans toxunulmaz qalır, Status Completed)
    const cardAdRes = await fetch(`${BASE_URL}/ads/purchase`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({
        packageId: targetPkg.id,
        tourId,
        title: 'Master E2E Bank Kartı Reklamı',
        paymentMethod: 'CARD',
        position: 'VIP_LIST'
      })
    });
    const cardAdData = await cardAdRes.json();
    assert(cardAdRes.status === 201 && cardAdData.data?.id, 'Onlayn Bank Kartı ilə reklam alındı (201)');
    const createdAd2 = cardAdData.data;

    const compAfterCard = await prisma.company.findUnique({ where: { id: companyId } });
    assert(Number(compAfterCard.availableBalance) === 300.0 - pkgPrice, 'Bank Kartı ödənişində platforma balansı dəyişməz qaldı');

    const txCard = await prisma.transaction.findFirst({
      where: { companyId, type: 'MARKETING_AD' },
      orderBy: { createdAt: 'desc' }
    });
    assert(
      txCard && Number(txCard.amount) === pkgPrice && txCard.status === 'Completed' && Number(txCard.netAmount) === 0,
      'Kart tranzaksiyası Completed və netAmount: 0 olaraq qeydə alındı'
    );

    // 2.4 'INVOICE' metodu ilə alış (B2B Faktura, Status Pending_Verification)
    const invoiceAdRes = await fetch(`${BASE_URL}/ads/purchase`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        packageId: targetPkg.id,
        tourId,
        title: 'Master E2E B2B Faktura Reklamı',
        paymentMethod: 'INVOICE',
        position: 'SIDEBAR'
      })
    });
    const invoiceAdData = await invoiceAdRes.json();
    assert(invoiceAdRes.status === 201 && invoiceAdData.data?.id, 'B2B Faktura ilə reklam alındı (201)');
    const createdAd3 = invoiceAdData.data;

    const txInvoice = await prisma.transaction.findFirst({
      where: { companyId, type: 'MARKETING_AD' },
      orderBy: { createdAt: 'desc' }
    });
    assert(
      txInvoice && txInvoice.status === 'Pending_Verification' && txInvoice.description.includes('B2B Faktura'),
      'B2B Faktura tranzaksiyası Pending_Verification statusu ilə qeydə alındı'
    );

    // -------------------------------------------------------------------------
    // BLOK 3: REKLAM STATUSU, KLİK STATİSTİKASI, KPI VƏ SİLİNMƏSİ
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Reklam Statusu, Klik Statistikası, KPI və Silinmə ---');

    // 3.1 Status Toggle: Active -> Paused
    const toggleAdRes1 = await fetch(`${BASE_URL}/ads/${createdAd1.id}/status`, {
      method: 'PATCH',
      headers: managerHeaders
    });
    const toggleAdData1 = await toggleAdRes1.json();
    assert(toggleAdRes1.status === 200 && toggleAdData1.data?.status === 'Paused', 'Reklam statusu Active -> Paused dəyişdirildi');

    const auditToggle = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'Ad', entityId: createdAd1.id, action: 'TOGGLE_AD_STATUS' },
      orderBy: { createdAt: 'desc' }
    });
    assert(auditToggle && auditToggle.newValues.includes('Paused'), 'AuditLog-da TOGGLE_AD_STATUS qeydə alındı');

    // 3.2 Status Toggle: Paused -> Active
    const toggleAdRes2 = await fetch(`${BASE_URL}/ads/${createdAd1.id}/status`, {
      method: 'PATCH',
      headers: managerHeaders
    });
    const toggleAdData2 = await toggleAdRes2.json();
    assert(toggleAdRes2.status === 200 && toggleAdData2.data?.status === 'Active', 'Reklam statusu Paused -> Active yenidən bərpa olundu');

    // 3.3 İctimai Klik Qeydiyyatı
    const clickRes = await fetch(`${BASE_URL}/ads/${createdAd1.id}/click`, {
      method: 'POST'
    });
    assert(clickRes.status === 200, 'İctimai reklam kliklənməsi qeydə alındı (200)');

    const updatedAdWithClick = await prisma.ad.findUnique({ where: { id: createdAd1.id } });
    assert(updatedAdWithClick.clicksCount >= 1, 'Reklamın clicksCount göstəricisi artırıldı');

    // 3.4 KPI Hesabatı
    const kpiRes = await fetch(`${BASE_URL}/ads/kpi`, { headers: ownerHeaders });
    const kpiData = await kpiRes.json();
    assert(kpiRes.status === 200 && kpiData.data?.summary, 'Reklam KPI hesabatı uğurla gətirildi (200)');

    // 3.5 Reklamın Silinməsi
    const deleteAdRes = await fetch(`${BASE_URL}/ads/${createdAd1.id}`, {
      method: 'DELETE',
      headers: ownerHeaders
    });
    assert(deleteAdRes.status === 200, 'Reklam uğurla silindi (200)');

    const auditDelete = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'Ad', entityId: createdAd1.id, action: 'DELETE_AD' },
      orderBy: { createdAt: 'desc' }
    });
    assert(auditDelete && auditDelete.performedBy.includes('OWNER'), 'AuditLog-da DELETE_AD qeydiyyatı aparıldı');

    // -------------------------------------------------------------------------
    // BLOK 4: KAMPANİYALAR VƏ PROMOKODLAR İDARƏETMƏSİ
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Kampaniyalar və Promokodlar Dövrü ---');

    const promoCode = `MASTER${Date.now().toString().slice(-4)}`;

    // 4.1 Yeni Promokod Yaradılması
    const createPromoRes = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({
        promoCode,
        discountType: 'PERCENTAGE',
        discountValue: 20,
        usageLimit: 100,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        description: 'Master E2E 20% Endirim Kampaniyası'
      })
    });
    const createPromoData = await createPromoRes.json();
    assert(createPromoRes.status === 201 && createPromoData.data?.id, `Promokod ${promoCode} yaradıldı (201)`);
    const createdPromo = createPromoData.data;

    const auditPromoCreate = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'Campaign', entityId: createdPromo.id, action: 'CREATE_PROMO' }
    });
    assert(auditPromoCreate && auditPromoCreate.performedBy.includes('MANAGER'), 'AuditLog-da CREATE_PROMO qeydiyyatı təsdiqləndi');

    // 4.2 Təkrar Promokod Unikallıq Qoruması (409 Conflict)
    const dupPromoRes = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        promoCode,
        discountValue: 25,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString()
      })
    });
    assert(dupPromoRes.status === 409, 'Təkrar promokod yaradılması 409 Conflict ilə bloklandı');

    // 4.3 İctimai Promokod Validation API Yoxlanışı
    const validatePromoRes = await fetch(`${BASE_URL}/campaigns/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promoCode })
    });
    const validatePromoData = await validatePromoRes.json();
    assert(
      validatePromoRes.status === 200 && validatePromoData.data?.promoCode === promoCode,
      'İctimai müştəri üçün promokod təsdiqləndi və endirim tətbiq edildi (200)'
    );

    // 4.4 Promokod Statusunun Dəyişdirilməsi (Active -> Paused)
    const togglePromoRes1 = await fetch(`${BASE_URL}/campaigns/${createdPromo.id}/status`, {
      method: 'PATCH',
      headers: ownerHeaders
    });
    const togglePromoData1 = await togglePromoRes1.json();
    assert(togglePromoRes1.status === 200 && togglePromoData1.data?.status === 'Paused', 'Promokod statusu Active -> Paused dəyişdirildi');

    const auditPromoToggle = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'Campaign', entityId: createdPromo.id, action: 'TOGGLE_PROMO_STATUS' }
    });
    assert(auditPromoToggle && auditPromoToggle.newValues.includes('Paused'), 'AuditLog-da TOGGLE_PROMO_STATUS qeydə alındı');

    // 4.5 Promokod Statusunun Bərpası (Paused -> Active)
    const togglePromoRes2 = await fetch(`${BASE_URL}/campaigns/${createdPromo.id}/status`, {
      method: 'PATCH',
      headers: ownerHeaders
    });
    const togglePromoData2 = await togglePromoRes2.json();
    assert(togglePromoRes2.status === 200 && togglePromoData2.data?.status === 'Active', 'Promokod statusu yenidən Active edildi');

    // 4.6 Müddəti Bitmiş (Expired) Promokodun Status Dəyişməsinin Bloklanması
    const expiredPromo = await prisma.campaign.create({
      data: {
        id: `CP-EXP-${Date.now().toString().slice(-4)}`,
        companyId,
        type: 'DISCOUNT',
        promoCode: `EXP${Date.now().toString().slice(-4)}`,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        startDate: new Date(Date.now() - 10 * 86400000),
        endDate: new Date(Date.now() - 2 * 86400000),
        status: 'Active'
      }
    });

    const toggleExpiredRes = await fetch(`${BASE_URL}/campaigns/${expiredPromo.id}/status`, {
      method: 'PATCH',
      headers: ownerHeaders
    });
    assert(toggleExpiredRes.status === 400, 'Müddəti bitmiş promokodun statusunun dəyişdirilməsi bloklandı (400)');

    // 4.7 Promokodun Silinməsi
    const deletePromoRes = await fetch(`${BASE_URL}/campaigns/${createdPromo.id}`, {
      method: 'DELETE',
      headers: ownerHeaders
    });
    assert(deletePromoRes.status === 200, 'Promokod uğurla silindi (200)');

    const auditPromoDelete = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'Campaign', entityId: createdPromo.id, action: 'DELETE_PROMO' }
    });
    assert(auditPromoDelete && auditPromoDelete.performedBy.includes('OWNER'), 'AuditLog-da DELETE_PROMO qeydiyyatı təsdiqləndi');

    // -------------------------------------------------------------------------
    // BLOK 5: İCTİMAİ VİTRİN VƏ WEB MÜŞTƏRİ İNTEQRASİYASI
    // -------------------------------------------------------------------------
    console.log('\n--- 5. İctimai Vitrin və Web Müştəri İnteqrasiyası ---');

    // 5.1 İctimai Reklamlar (Autentifikasiyasız)
    const publicAdsRes = await fetch(`${BASE_URL}/ads/public?limit=5`);
    const publicAdsData = await publicAdsRes.json();
    assert(publicAdsRes.status === 200 && Array.isArray(publicAdsData.data), 'Web müştərilər üçün ictimai reklamlar gətirildi (200)');

    // 5.2 İctimai Kampaniyalar (Autentifikasiyasız)
    const publicCampaignsRes = await fetch(`${BASE_URL}/campaigns/active`);
    const publicCampaignsData = await publicCampaignsRes.json();
    assert(publicCampaignsRes.status === 200 && Array.isArray(publicCampaignsData.data), 'Web müştərilər üçün aktiv xüsusi təkliflər gətirildi (200)');

    // Təmizlik
    await prisma.campaign.delete({ where: { id: expiredPromo.id } }).catch(() => {});
    await prisma.ad.delete({ where: { id: createdAd2.id } }).catch(() => {});
    await prisma.ad.delete({ where: { id: createdAd3.id } }).catch(() => {});

    console.log('\n================================================================================');
    console.log(`🏆 BÜTÜN MASTER E2E TESTLƏRİ UĞURLA BAŞA ÇATDI: ${passed}/${total} TEST KEÇDİ! (100%)`);
    console.log('================================================================================\n');
  } catch (error) {
    console.error('\n❌ MASTER E2E TEST XƏTASI:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAdsCampaignsMasterE2E();
