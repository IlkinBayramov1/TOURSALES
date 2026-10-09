import prisma from '../config/db.js';

async function runApiKeysStage1Tests() {
  console.log('========================================================================');
  console.log('🔑 TOURSALES API KEYS & WEBHOOKS MODULE: STAGE 1 VERIFICATION 🔑');
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

    // Guide API açarları və Webhooks oxumağa bloklanmalıdır (403)
    const guideKeysRes = await fetch(`${BASE_URL}/api-keys`, { headers: guideHeaders });
    assert(guideKeysRes.status === 403, 'Guide üçün GET /api/v1/api-keys bloklandı (403 Forbidden)');

    const guideStatsRes = await fetch(`${BASE_URL}/api-keys/stats`, { headers: guideHeaders });
    assert(guideStatsRes.status === 403, 'Guide üçün GET /api/v1/api-keys/stats bloklandı (403 Forbidden)');

    const guideWebhooksRes = await fetch(`${BASE_URL}/api-keys/webhooks/all`, { headers: guideHeaders });
    assert(guideWebhooksRes.status === 403, 'Guide üçün GET /api/v1/api-keys/webhooks/all bloklandı (403 Forbidden)');

    // Guide API açar və ya Webhook yarada BİLMƏZ (403)
    const guideCreateKeyRes = await fetch(`${BASE_URL}/api-keys`, {
      method: 'POST',
      headers: guideHeaders,
      body: JSON.stringify({ name: 'Guide Key Test' })
    });
    assert(guideCreateKeyRes.status === 403, 'Guide üçün POST /api/v1/api-keys bloklandı (403 Forbidden)');

    // Accountant (Maliyyəçi) oxuya BİLƏR (200), amma yarada və ya ləğv edə BİLMƏZ (403)
    const accKeysRes = await fetch(`${BASE_URL}/api-keys`, { headers: accountantHeaders });
    assert(accKeysRes.status === 200, 'Accountant üçün GET /api/v1/api-keys icazə verildi (200 OK)');

    const accStatsRes = await fetch(`${BASE_URL}/api-keys/stats`, { headers: accountantHeaders });
    assert(accStatsRes.status === 200, 'Accountant üçün GET /api/v1/api-keys/stats icazə verildi (200 OK)');

    const accCreateKeyRes = await fetch(`${BASE_URL}/api-keys`, {
      method: 'POST',
      headers: accountantHeaders,
      body: JSON.stringify({ name: 'Accountant Key Test' })
    });
    assert(accCreateKeyRes.status === 403, 'Accountant üçün POST /api/v1/api-keys bloklandı (403 Forbidden)');

    const accCreateWhRes = await fetch(`${BASE_URL}/api-keys/webhooks`, {
      method: 'POST',
      headers: accountantHeaders,
      body: JSON.stringify({ name: 'Acc Wh', url: 'https://test.com' })
    });
    assert(accCreateWhRes.status === 403, 'Accountant üçün POST /api/v1/api-keys/webhooks bloklandı (403 Forbidden)');

    // Manager və Owner oxuma icazəsinə malikdir
    const mgrKeysRes = await fetch(`${BASE_URL}/api-keys`, { headers: managerHeaders });
    assert(mgrKeysRes.status === 200, 'Manager üçün GET /api/v1/api-keys icazə verildi (200 OK)');

    const ownerKeysRes = await fetch(`${BASE_URL}/api-keys`, { headers: ownerHeaders });
    assert(ownerKeysRes.status === 200, 'Owner üçün GET /api/v1/api-keys icazə verildi (200 OK)');

    // -------------------------------------------------------------------------
    // 3. SAAS PLAN KVOTA QORUMASI (QUOTA GUARD)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. SaaS Abunəlik Planı Kvota Qoruması ---');

    // Şirkət Pro planındadır və artıq 2 açarı var -> 3-cü açar cəhdi bloklanmalıdır
    const quotaFailRes = await fetch(`${BASE_URL}/api-keys`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({ name: 'Quota Overlimit Test' })
    });
    const quotaFailData = await quotaFailRes.json();
    assert(
      quotaFailRes.status === 400 && quotaFailData.msg?.includes('limiti'),
      'Pro plan üçün 2 açar limiti dolduqda 3-cü açar cəhdi rədd edildi (400 Bad Request)'
    );

    // İndi şirkəti limitsiz Enterprise planına keçiririk
    await prisma.company.update({
      where: { id: companyId },
      data: { planId: 'SP-ENTERPRISE' }
    });

    // -------------------------------------------------------------------------
    // 4. API AÇAR YARADILMASI, REDAKTƏSİ VƏ SİRLƏRİN REGENERATE EDİLMƏSİ
    // -------------------------------------------------------------------------
    console.log('\n--- 4. API Açar Dövrü (Create, Update, Regenerate, Audit) ---');

    // 4.1 Yeni açar yaradırıq (Manager tərəfindən)
    const createKeyRes = await fetch(`${BASE_URL}/api-keys`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({
        name: 'Master CRM İnteqrasiyası',
        environment: 'LIVE',
        scopes: ['tours:read', 'bookings:read', 'bookings:write'],
        ipWhitelist: '185.120.45.10',
        rateLimitPerMinute: 150
      })
    });
    const createKeyData = await createKeyRes.json();
    assert(
      createKeyRes.status === 201 && createKeyData.data?.rawSecretKey?.startsWith('ts_live_'),
      'Yeni LIVE API açarı uğurla yaradıldı və rawSecretKey verildi (201 Created)'
    );
    const createdKey = createKeyData.data.apiKey;
    const rawSecret1 = createKeyData.data.rawSecretKey;

    // AuditLog yoxlanışı
    const auditCreateKey = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'ApiKey', entityId: createdKey.id, action: 'CREATE_API_KEY' }
    });
    assert(auditCreateKey && auditCreateKey.performedBy.includes('MANAGER'), 'AuditLog-da MANAGER tərəfindən CREATE_API_KEY qeydə alındı');

    // 4.2 Açarın redaktəsi (Update: Scopes & Name)
    const updateKeyRes = await fetch(`${BASE_URL}/api-keys/${createdKey.id}`, {
      method: 'PATCH',
      headers: ownerHeaders,
      body: JSON.stringify({
        name: 'Master CRM İnteqrasiyası (Yenilənmiş)',
        scopes: ['tours:read', 'bookings:read', 'bookings:write', 'finance:read'],
        ipWhitelist: '185.120.45.10, 185.120.45.11'
      })
    });
    const updateKeyData = await updateKeyRes.json();
    assert(
      updateKeyRes.status === 200 && updateKeyData.data?.scopes?.includes('finance:read'),
      'Açar parametrləri uğurla redaktə edildi və yeni scopes qeydə alındı'
    );

    const auditUpdateKey = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'ApiKey', entityId: createdKey.id, action: 'UPDATE_API_KEY' }
    });
    assert(auditUpdateKey && auditUpdateKey.performedBy.includes('OWNER'), 'AuditLog-da OWNER tərəfindən UPDATE_API_KEY qeydə alındı');

    // 4.3 Canlı API Test & Simulyasiya Sorğusu (Simulate Request)
    const simRes1 = await fetch(`${BASE_URL}/api-keys/simulate`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({
        rawSecretKey: rawSecret1,
        endpoint: '/tours/my-tours',
        method: 'GET'
      })
    });
    const simData1 = await simRes1.json();
    assert(
      simRes1.status === 200 && simData1.data?.status === 200,
      'Canlı API simulyatoru rawSecretKey ilə turları uğurla çağırdı (200 OK)'
    );

    // Sayğacın artdığını yoxlayırıq
    const keyAfterSim = await prisma.apiKey.findUnique({ where: { id: createdKey.id } });
    assert(keyAfterSim.requestCount >= 1 && !!keyAfterSim.lastUsedAt, 'API açarının requestCount və lastUsedAt dəyərləri yeniləndi');

    // 4.4 Açarın Yenilənməsi (Roll / Regenerate Secret Key)
    const regenRes = await fetch(`${BASE_URL}/api-keys/${createdKey.id}/regenerate`, {
      method: 'POST',
      headers: ownerHeaders
    });
    const regenData = await regenRes.json();
    assert(
      regenRes.status === 200 && regenData.data?.rawSecretKey && regenData.data.rawSecretKey !== rawSecret1,
      'API açarı yeniləndi (Regenerate Key) və yeni rawSecretKey təqdim edildi'
    );
    const rawSecret2 = regenData.data.rawSecretKey;

    // Köhnə açarla sorğu rədd edilməlidir (401)
    const simOldRes = await fetch(`${BASE_URL}/api-keys/simulate`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({
        rawSecretKey: rawSecret1,
        endpoint: '/tours/my-tours'
      })
    });
    assert(simOldRes.status === 401, 'Köhnə rawSecretKey dərhal etibarsız sayıldı (401 Unauthorized)');

    // Yeni açarla sorğu uğurla keçməlidir (200)
    const simNewRes = await fetch(`${BASE_URL}/api-keys/simulate`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({
        rawSecretKey: rawSecret2,
        endpoint: '/tours/my-tours'
      })
    });
    assert(simNewRes.status === 200, 'Yeni rawSecretKey uğurla işləyir (200 OK)');

    const auditRegen = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'ApiKey', entityId: createdKey.id, action: 'REGENERATE_API_KEY' }
    });
    assert(auditRegen && auditRegen.performedBy.includes('OWNER'), 'AuditLog-da REGENERATE_API_KEY qeydə alındı');

    // 4.5 Açarı Ləğv Etmək (Revoke)
    const revokeRes = await fetch(`${BASE_URL}/api-keys/${createdKey.id}/revoke`, {
      method: 'PATCH',
      headers: managerHeaders
    });
    assert(revokeRes.status === 200, 'API açarı uğurla ləğv edildi (Revoked)');

    // Ləğv olunmuş açarla sorğu rədd edilməlidir (403)
    const simRevokedRes = await fetch(`${BASE_URL}/api-keys/simulate`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({
        rawSecretKey: rawSecret2,
        endpoint: '/tours/my-tours'
      })
    });
    assert(simRevokedRes.status === 403, 'Ləğv olunmuş açarla sorğu rədd edildi (403 Forbidden)');

    // 4.6 Açarı Silmək (Delete)
    const deleteKeyRes = await fetch(`${BASE_URL}/api-keys/${createdKey.id}`, {
      method: 'DELETE',
      headers: ownerHeaders
    });
    assert(deleteKeyRes.status === 200, 'API açarı uğurla silindi (200 OK)');

    const auditDeleteKey = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'ApiKey', entityId: createdKey.id, action: 'DELETE_API_KEY' }
    });
    assert(auditDeleteKey && auditDeleteKey.performedBy.includes('OWNER'), 'AuditLog-da DELETE_API_KEY qeydə alındı');

    // -------------------------------------------------------------------------
    // 5. WEBHOOKS İDARƏETMƏSİ (CREATE, UPDATE, TEST, DELETE)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Webhooks İdarəetməsi və Sınağı ---');

    // 5.1 Webhook Yaratmaq
    const createWhRes = await fetch(`${BASE_URL}/api-keys/webhooks`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({
        name: 'CRM Sifariş Dinləyicisi',
        url: 'https://agency-crm.az/api/webhooks/orders',
        events: ['booking.created', 'booking.confirmed']
      })
    });
    const createWhData = await createWhRes.json();
    assert(createWhRes.status === 201 && createWhData.data?.id, 'Yeni Webhook uğurla yaradıldı (201 Created)');
    const createdWh = createWhData.data;

    const auditCreateWh = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'Webhook', entityId: createdWh.id, action: 'CREATE_WEBHOOK' }
    });
    assert(auditCreateWh && auditCreateWh.performedBy.includes('MANAGER'), 'AuditLog-da CREATE_WEBHOOK qeydə alındı');

    // 5.2 Webhook Redaktəsi (Update)
    const updateWhRes = await fetch(`${BASE_URL}/api-keys/webhooks/${createdWh.id}`, {
      method: 'PATCH',
      headers: ownerHeaders,
      body: JSON.stringify({
        name: 'CRM Sifariş & Ödəniş Dinləyicisi',
        url: 'https://agency-crm.az/api/webhooks/v2/events',
        events: ['booking.created', 'booking.confirmed', 'payment.received']
      })
    });
    const updateWhData = await updateWhRes.json();
    assert(
      updateWhRes.status === 200 && updateWhData.data?.url.includes('v2/events'),
      'Webhook URL və hadisələri uğurla redaktə edildi (200 OK)'
    );

    const auditUpdateWh = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'Webhook', entityId: createdWh.id, action: 'UPDATE_WEBHOOK' }
    });
    assert(auditUpdateWh && auditUpdateWh.performedBy.includes('OWNER'), 'AuditLog-da UPDATE_WEBHOOK qeydə alındı');

    // 5.3 Webhook Sınağı (Ping / Test)
    const testWhRes = await fetch(`${BASE_URL}/api-keys/webhooks/${createdWh.id}/test`, {
      method: 'POST',
      headers: managerHeaders
    });
    const testWhData = await testWhRes.json();
    assert(
      testWhRes.status === 200 && testWhData.data?.status === '200 OK',
      'Webhook testi uğurla 200 OK çatdırılma statusu aldı'
    );

    const auditTestWh = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'Webhook', entityId: createdWh.id, action: 'TEST_WEBHOOK' }
    });
    assert(auditTestWh && auditTestWh.performedBy.includes('MANAGER'), 'AuditLog-da TEST_WEBHOOK qeydə alındı');

    // 5.4 Webhook Silinməsi
    const deleteWhRes = await fetch(`${BASE_URL}/api-keys/webhooks/${createdWh.id}`, {
      method: 'DELETE',
      headers: ownerHeaders
    });
    assert(deleteWhRes.status === 200, 'Webhook uğurla silindi (200 OK)');

    const auditDeleteWh = await prisma.auditLog.findFirst({
      where: { tenantId: companyId, entityName: 'Webhook', entityId: createdWh.id, action: 'DELETE_WEBHOOK' }
    });
    assert(auditDeleteWh && auditDeleteWh.performedBy.includes('OWNER'), 'AuditLog-da DELETE_WEBHOOK qeydə alındı');

    // Şirkət planını bərpa edirik (SP-PRO)
    await prisma.company.update({
      where: { id: companyId },
      data: { planId: 'SP-PRO' }
    });

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

runApiKeysStage1Tests();
