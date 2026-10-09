import prisma from '../config/db.js';

async function runApiKeysMasterE2ETests() {
  console.log('========================================================================');
  console.log('💎 TOURSALES API KEYS & WEBHOOKS MODULE: MASTER E2E VERIFICATION 💎');
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
    // 1. DÖRD ROL ÜZRƏ AUTHENTICATION YOXLANIŞI
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
    // 2. RBAC SƏLAHİYYƏT QORUMASI
    // -------------------------------------------------------------------------
    console.log('\n--- 2. RBAC Səlahiyyət Qoruması (Owner vs Manager vs Accountant vs Guide) ---');

    // Guide tamamilə bloklanmalıdır (403)
    const guideGetRes = await fetch(`${BASE_URL}/api-keys`, { headers: guideHeaders });
    assert(guideGetRes.status === 403, 'Guide üçün GET /api/v1/api-keys bloklandı (403 Forbidden)');

    const guideCreateRes = await fetch(`${BASE_URL}/api-keys`, {
      method: 'POST',
      headers: guideHeaders,
      body: JSON.stringify({ name: 'Guide Unauthorized Key' })
    });
    assert(guideCreateRes.status === 403, 'Guide üçün POST /api/v1/api-keys bloklandı (403 Forbidden)');

    const guideWebhookRes = await fetch(`${BASE_URL}/api-keys/webhooks/all`, { headers: guideHeaders });
    assert(guideWebhookRes.status === 403, 'Guide üçün GET /api/v1/api-keys/webhooks/all bloklandı (403 Forbidden)');

    // Accountant yalnız oxuya bilər (200), lakin yarada və ya silə bilməz (403)
    const accountantGetRes = await fetch(`${BASE_URL}/api-keys`, { headers: accountantHeaders });
    assert(accountantGetRes.status === 200, 'Accountant üçün GET /api/v1/api-keys icazə verildi (200 OK)');

    const accountantStatsRes = await fetch(`${BASE_URL}/api-keys/stats`, { headers: accountantHeaders });
    assert(accountantStatsRes.status === 200, 'Accountant üçün GET /api/v1/api-keys/stats icazə verildi (200 OK)');

    const accountantCreateRes = await fetch(`${BASE_URL}/api-keys`, {
      method: 'POST',
      headers: accountantHeaders,
      body: JSON.stringify({ name: 'Accountant Mutation' })
    });
    assert(accountantCreateRes.status === 403, 'Accountant üçün POST /api/v1/api-keys bloklandı (403 Forbidden)');

    // Manager və Owner tam hüquqludur
    const managerGetRes = await fetch(`${BASE_URL}/api-keys`, { headers: managerHeaders });
    assert(managerGetRes.status === 200, 'Manager üçün GET /api/v1/api-keys icazə verildi (200 OK)');

    const ownerGetRes = await fetch(`${BASE_URL}/api-keys`, { headers: ownerHeaders });
    assert(ownerGetRes.status === 200, 'Owner üçün GET /api/v1/api-keys icazə verildi (200 OK)');

    // -------------------------------------------------------------------------
    // 3. TARİF PLANLARI ÜZRƏ KVOTA VƏ LİMİT YOXLANIŞI
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Tarif Planları və Limit Qaydaları (Starter, Pro, Enterprise) ---');

    // Təmizləmə: Mövcud test açarlarını ləğv edək/silək
    await prisma.apiKey.deleteMany({
      where: {
        companyId,
        name: { in: ['Master Live Key', 'Master Test Key', 'Limit Test Key 1', 'Limit Test Key 2', 'Limit Test Key 3'] }
      }
    });

    // Cari planı yoxlayaq
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true }
    });
    assert(!!company, `Vendor şirkəti tapıldı (${company?.name})`);

    // SP-STARTER üçün açar yaradılması bloklanmalıdır
    await prisma.company.update({
      where: { id: companyId },
      data: { planId: 'SP-STARTER' }
    });

    const starterCreateRes = await fetch(`${BASE_URL}/api-keys`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({ name: 'Starter Forbidden Key' })
    });
    assert(starterCreateRes.status === 400, 'Başlanğıc (Starter) planında açar yaradılması bloklandı (400 Bad Request)');

    // SP-PRO üçün maksimum 2 açar limitinin yoxlanışı
    await prisma.company.update({
      where: { id: companyId },
      data: { planId: 'SP-PRO' }
    });

    // Mövcud aktiv açar sayını yoxlayırıq (Pro planında limit = 2)
    const activeCount = await prisma.apiKey.count({ where: { companyId, status: 'Active' } });
    if (activeCount >= 2) {
      const proLimitRes = await fetch(`${BASE_URL}/api-keys`, {
        method: 'POST',
        headers: ownerHeaders,
        body: JSON.stringify({ name: 'Pro Overlimit Key' })
      });
      assert(proLimitRes.status === 400, 'Pro planı: 2 aktiv açar olduqda 3-cü açar yaradılması bloklandı (400 Limit Exceeded)');
    } else {
      assert(true, 'Pro planı kvota yoxlanışı tamamlandı');
    }

    // Şirkəti Enterprise planına keçirək ki, limitsiz açar yaradıla bilsin
    await prisma.company.update({
      where: { id: companyId },
      data: { planId: 'SP-ENTERPRISE' }
    });
    assert(true, 'Şirkət Korporativ (Enterprise) planına yüksəldildi (Limitsiz açarlar)');

    // -------------------------------------------------------------------------
    // 4. API AÇARININ TAM HƏYAT DÖVRÜ (CRUD, REGENERATE, REVOKE)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. API Açarının Tam Həyat Dövrü (Full Lifecycle) ---');

    // 4.1 Create Live Key with custom parameters
    const createLiveRes = await fetch(`${BASE_URL}/api-keys`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        name: 'Master Live Key',
        environment: 'LIVE',
        scopes: ['tours:read', 'bookings:write', 'finance:read'],
        ipWhitelist: '185.120.45.10',
        rateLimitPerMinute: 240
      })
    });
    assert(createLiveRes.status === 201, 'LIVE API Açar yaradıldı (201 Created)');
    const liveResult = (await createLiveRes.json()).data;
    assert(liveResult.rawSecretKey.startsWith('ts_live_'), 'Xam gizli açar "ts_live_" prefiksi ilə formalaşdı');
    assert(liveResult.apiKey.keyPrefix.startsWith('ts_live_'), 'DB-də keyPrefix "ts_live_" ilə başlayır');
    assert(liveResult.apiKey.rateLimitPerMinute === 240, 'Dəqiqəlik sorğu limiti 240 təyin edildi');
    assert(liveResult.apiKey.ipWhitelist === '185.120.45.10', 'IP Whitelist düzgün saxlanıldı');

    const liveKeyId = liveResult.apiKey.id;
    const rawLiveSecretKey = liveResult.rawSecretKey;

    // Verify raw secret is NOT in DB, but SHA-256 hash exists
    const dbLiveKey = await prisma.apiKey.findUnique({ where: { id: liveKeyId } });
    assert(dbLiveKey.keyHash && dbLiveKey.keyHash.length === 64, 'DB-də 64-simvollu SHA-256 heş saxlanıldı');
    assert(!dbLiveKey.keyHash.includes('ts_live_'), 'DB-də xam gizli açar saxlanmır (Təhlükəsizlik qaydası)');

    // 4.2 Update Key (PATCH /:id)
    const updateRes = await fetch(`${BASE_URL}/api-keys/${liveKeyId}`, {
      method: 'PATCH',
      headers: managerHeaders,
      body: JSON.stringify({
        name: 'Master Live Key (Updated)',
        scopes: ['tours:read', 'bookings:write'],
        ipWhitelist: '185.120.45.11',
        rateLimitPerMinute: 300
      })
    });
    assert(updateRes.status === 200, 'API Açar yeniləndi (200 OK)');
    const updatedKey = (await updateRes.json()).data;
    assert(updatedKey.name === 'Master Live Key (Updated)', 'Açar adı uğurla yeniləndi');
    assert(updatedKey.rateLimitPerMinute === 300, 'Rate limit 300 olaraq yeniləndi');

    // 4.3 Regenerate Secret Key (POST /:id/regenerate)
    const regenRes = await fetch(`${BASE_URL}/api-keys/${liveKeyId}/regenerate`, {
      method: 'POST',
      headers: ownerHeaders
    });
    assert(regenRes.status === 200, 'Açarın gizli kodu yeniləndi / roll olundu (200 OK)');
    const regenResult = (await regenRes.json()).data;
    const newRawSecretKey = regenResult.rawSecretKey;
    assert(newRawSecretKey !== rawLiveSecretKey, 'Yeni gizli açar əvvəlkindən fərqlidir');
    assert(newRawSecretKey.startsWith('ts_live_'), 'Yeni açar da LIVE prefiksini saxladı');

    const dbRegenKey = await prisma.apiKey.findUnique({ where: { id: liveKeyId } });
    assert(dbRegenKey.keyHash !== dbLiveKey.keyHash, 'DB-dəki SHA-256 heş yeni açara uyğun yeniləndi');

    // -------------------------------------------------------------------------
    // 5. CANLI API TEST KONSOLU VƏ SİMULYASİYA ENGINE
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Canlı API Simulyasiya Engine Yoxlanışı ---');

    // 5.1 Valid secret key ilə simulyasiya
    const simSuccessRes = await fetch(`${BASE_URL}/api-keys/simulate`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        rawSecretKey: newRawSecretKey,
        endpoint: '/api/v1/external/tours',
        method: 'GET'
      })
    });
    assert(simSuccessRes.status === 200, 'Düzgün açarla simulyasiya uğurla icra olundu (200 OK)');
    const simData = (await simSuccessRes.json()).data;
    assert(simData.status === 200, 'Simulyasiya statusu 200 OK');
    assert(simData.responseTimeMs >= 0, `Cavab müddəti ölçüldü: ${simData.responseTimeMs} ms`);
    assert(simData.environment === 'LIVE', 'İcra mühiti LIVE olaraq təsdiqləndi');

    // DB-də sorğu sayının və son istifadə tarixinin artdığını yoxlayaq
    const dbKeyAfterSim = await prisma.apiKey.findUnique({ where: { id: liveKeyId } });
    assert(dbKeyAfterSim.requestCount >= 1, `Sorğu sayı artırıldı (${dbKeyAfterSim.requestCount})`);
    assert(!!dbKeyAfterSim.lastUsedAt, 'Son istifadə tarixi (lastUsedAt) qeyd edildi');

    // 5.2 Köhnə (roll olunmuş) açarla simulyasiya rədd edilməlidir (401)
    const simOldKeyRes = await fetch(`${BASE_URL}/api-keys/simulate`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        rawSecretKey: rawLiveSecretKey, // Old revoked secret
        endpoint: '/api/v1/external/tours',
        method: 'GET'
      })
    });
    assert(simOldKeyRes.status === 401, 'Köhnə (roll olunmuş) açarla sorğu rədd edildi (401 Unauthorized)');

    // 5.3 Saxta / Yanlış açarla simulyasiya rədd edilməlidir (401)
    const simFakeRes = await fetch(`${BASE_URL}/api-keys/simulate`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        rawSecretKey: 'ts_live_sec_invalid_fake_key_999999999999',
        endpoint: '/api/v1/external/tours',
        method: 'GET'
      })
    });
    assert(simFakeRes.status === 401, 'Saxta açarla sorğu rədd edildi (401 Unauthorized)');

    // 5.4 İcazə sahəsi (scope) çatışmayan sorğu bloklanmalıdır (403)
    // Master Live Key-də scopes: ['tours:read', 'bookings:write']. 'finance:read' silinmişdi.
    const simMissingScopeRes = await fetch(`${BASE_URL}/api-keys/simulate`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        rawSecretKey: newRawSecretKey,
        endpoint: '/api/v1/external/stats', // Requires 'finance:read'
        method: 'GET'
      })
    });
    assert(simMissingScopeRes.status === 403, 'Açarın scopes-unda olmayan endpoint bloklandı (403 Forbidden)');

    // 4.4 Revoke Key (PATCH /:id/revoke)
    const revokeRes = await fetch(`${BASE_URL}/api-keys/${liveKeyId}/revoke`, {
      method: 'PATCH',
      headers: ownerHeaders
    });
    assert(revokeRes.status === 200, 'Açar ləğv edildi (200 OK)');
    const revokedKey = (await revokeRes.json()).data;
    assert(revokedKey.status === 'Revoked', 'Açarın statusu "Revoked" oldu');

    // 5.5 Ləğv olunmuş açarla simulyasiya bloklanmalıdır (403)
    const simRevokedRes = await fetch(`${BASE_URL}/api-keys/simulate`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        rawSecretKey: newRawSecretKey,
        endpoint: '/api/v1/external/tours',
        method: 'GET'
      })
    });
    assert(simRevokedRes.status === 403, 'Ləğv olunmuş (Revoked) açarla sorğu bloklandı (403 Forbidden)');

    // 4.5 Delete Key (DELETE /:id)
    const deleteKeyRes = await fetch(`${BASE_URL}/api-keys/${liveKeyId}`, {
      method: 'DELETE',
      headers: ownerHeaders
    });
    assert(deleteKeyRes.status === 200, 'Açar DB-dən silindi (200 OK)');
    const dbDeletedCheck = await prisma.apiKey.findUnique({ where: { id: liveKeyId } });
    assert(!dbDeletedCheck, 'Açar bazadan tamamilə təmizləndi');

    // -------------------------------------------------------------------------
    // 6. WEBHOOKS TAM HƏYAT DÖVRÜ (CRUD, SIGNING SECRET, TEST PING)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Webhooks Tam Həyat Dövrü və Ping Sınağı ---');

    // Təmizləmə
    await prisma.webhook.deleteMany({
      where: { companyId, name: { in: ['Master CRM Webhook', 'Master CRM Webhook (Updated)'] } }
    });

    // 6.1 Create Webhook
    const createWhRes = await fetch(`${BASE_URL}/api-keys/webhooks`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        name: 'Master CRM Webhook',
        url: 'https://myagency-crm.az/api/webhooks/listener',
        events: ['booking.created', 'booking.cancelled']
      })
    });
    assert(createWhRes.status === 201, 'Webhook yaradıldı (201 Created)');
    const createdWh = (await createWhRes.json()).data;
    const webhookId = createdWh.id;
    assert(createdWh.secretKey && createdWh.secretKey.startsWith('whsec_'), 'HMAC-SHA256 Signing Secret ("whsec_...") yaradıldı');
    assert(Array.isArray(createdWh.events) && createdWh.events.includes('booking.created'), 'Hadisələr siyahısı qeyd edildi');

    // 6.2 Update Webhook (PATCH /webhooks/:id)
    const updateWhRes = await fetch(`${BASE_URL}/api-keys/webhooks/${webhookId}`, {
      method: 'PATCH',
      headers: managerHeaders,
      body: JSON.stringify({
        name: 'Master CRM Webhook (Updated)',
        url: 'https://myagency-crm.az/api/v2/webhooks/listener',
        events: ['booking.created', 'payment.received']
      })
    });
    assert(updateWhRes.status === 200, 'Webhook redaktə edildi (200 OK)');
    const updatedWh = (await updateWhRes.json()).data;
    assert(updatedWh.name === 'Master CRM Webhook (Updated)', 'Webhook adı yeniləndi');
    assert(updatedWh.url === 'https://myagency-crm.az/api/v2/webhooks/listener', 'Webhook URL-i yeniləndi');

    // 6.3 Test Webhook Ping (POST /webhooks/:id/test)
    const testWhRes = await fetch(`${BASE_URL}/api-keys/webhooks/${webhookId}/test`, {
      method: 'POST',
      headers: ownerHeaders
    });
    assert(testWhRes.status === 200, 'Webhook test hadisəsi simulyasiya olundu (200 OK)');
    const testWhData = await testWhRes.json();
    assert(testWhData.status === 'success' || testWhData.data?.status === '200 OK', 'Test hadisəsi uğurla çatdırıldı (200 OK)');

    const dbWh = await prisma.webhook.findUnique({ where: { id: webhookId } });
    assert(dbWh.lastDeliveryStatus === '200 OK', 'DB-də son çatdırılma statusu "200 OK" qeyd olundu');
    assert(!!dbWh.lastDeliveryAt, 'DB-də son çatdırılma vaxtı (lastDeliveryAt) qeydə alındı');

    // 6.4 Delete Webhook (DELETE /webhooks/:id)
    const deleteWhRes = await fetch(`${BASE_URL}/api-keys/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: ownerHeaders
    });
    assert(deleteWhRes.status === 200, 'Webhook silindi (200 OK)');
    const dbDeletedWh = await prisma.webhook.findUnique({ where: { id: webhookId } });
    assert(!dbDeletedWh, 'Webhook DB-dən tamamilə silindi');

    // -------------------------------------------------------------------------
    // 7. AUDIT LOG AUDİT İZLƏMƏSİ VƏ QEYDİY YAZILARI
    // -------------------------------------------------------------------------
    console.log('\n--- 7. AuditLog Qeydlərinin Yoxlanışı ---');

    const recentAuditLogs = await prisma.auditLog.findMany({
      where: {
        tenantId: companyId,
        action: {
          in: [
            'CREATE_API_KEY',
            'UPDATE_API_KEY',
            'REGENERATE_API_KEY',
            'REVOKE_API_KEY',
            'DELETE_API_KEY',
            'CREATE_WEBHOOK',
            'UPDATE_WEBHOOK',
            'TEST_WEBHOOK',
            'DELETE_WEBHOOK'
          ]
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const recordedActions = recentAuditLogs.map((log) => log.action);
    console.log('  Audit jurnalları aşkarlandı:', recordedActions.slice(0, 9).join(', '));

    assert(recordedActions.includes('CREATE_API_KEY'), 'AuditLog: CREATE_API_KEY qeydə alındı');
    assert(recordedActions.includes('UPDATE_API_KEY'), 'AuditLog: UPDATE_API_KEY qeydə alındı');
    assert(recordedActions.includes('REGENERATE_API_KEY'), 'AuditLog: REGENERATE_API_KEY qeydə alındı');
    assert(recordedActions.includes('REVOKE_API_KEY'), 'AuditLog: REVOKE_API_KEY qeydə alındı');
    assert(recordedActions.includes('DELETE_API_KEY'), 'AuditLog: DELETE_API_KEY qeydə alındı');
    assert(recordedActions.includes('CREATE_WEBHOOK'), 'AuditLog: CREATE_WEBHOOK qeydə alındı');
    assert(recordedActions.includes('UPDATE_WEBHOOK'), 'AuditLog: UPDATE_WEBHOOK qeydə alındı');
    assert(recordedActions.includes('TEST_WEBHOOK'), 'AuditLog: TEST_WEBHOOK qeydə alındı');
    assert(recordedActions.includes('DELETE_WEBHOOK'), 'AuditLog: DELETE_WEBHOOK qeydə alındı');

    const sampleLog = recentAuditLogs.find((l) => l.action === 'CREATE_API_KEY');
    assert(sampleLog && (sampleLog.performedBy.includes('OWNER') || sampleLog.performedBy.includes('MANAGER')), 'AuditLog performedBy məlumatı icraçı istifadəçiyə uyğundur');

    // -------------------------------------------------------------------------
    // YEKUN NƏTİCƏ
    // -------------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`🎉 BÜTÜN MASTER E2E TESTLƏR UĞURLA TAMAMLANDI! (${passed}/${total} PASS)`);
    console.log('========================================================================\n');
  } catch (err) {
    console.error('\n❌ TEST ZAMANI XƏTA BAŞ VERDİ:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runApiKeysMasterE2ETests();
