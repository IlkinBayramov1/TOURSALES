import prisma from '../config/db.js';

async function runStage1Tests() {
  console.log('========================================================================');
  console.log('🏢 TOURSALES ŞİRKƏT PROFİLİ (COMPANIES): MƏRHƏLƏ 1 TESTLƏRİ 🏢');
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
    console.log('--- 1. Rollar Üzrə Giriş və Token Əldə Edilməsi ---');

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
    // 2. RBAC SƏLAHİYYƏT QORUMASI (GİRİŞ VƏ İCAZƏLƏR)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Şirkət Profilinə Giriş RBAC Qoruması ---');

    // Guide şirkət profilinə və statistikasına baxa BİLMƏMƏLİDİR (403 Forbidden)
    const guideGetRes = await fetch(`${BASE_URL}/companies/my-company`, { headers: guideHeaders });
    assert(guideGetRes.status === 403, 'Bələdçi (GUIDE) şirkət profilini görə bilməz (403)');

    const guideStatsRes = await fetch(`${BASE_URL}/companies/my-company/stats`, { headers: guideHeaders });
    assert(guideStatsRes.status === 403, 'Bələdçi (GUIDE) şirkət statistikasını görə bilməz (403)');

    const guidePutRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: guideHeaders,
      body: JSON.stringify({ name: 'Hack Name' })
    });
    assert(guidePutRes.status === 403, 'Bələdçi (GUIDE) profili dəyişə bilməz (403)');

    // Owner, Manager, Accountant profilə daxil ola bilməlidir
    const ownerGetRes = await fetch(`${BASE_URL}/companies/my-company`, { headers: ownerHeaders });
    const ownerGetData = await ownerGetRes.json();
    assert(ownerGetRes.ok && ownerGetData.data?.id === companyId, 'Owner şirkət profilini uğurla əldə etdi');

    const managerGetRes = await fetch(`${BASE_URL}/companies/my-company`, { headers: managerHeaders });
    assert(managerGetRes.ok, 'Manager şirkət profilini uğurla əldə etdi');

    const accountantGetRes = await fetch(`${BASE_URL}/companies/my-company`, { headers: accountantHeaders });
    assert(accountantGetRes.ok, 'Accountant şirkət profilini uğurla əldə etdi');

    const statsRes = await fetch(`${BASE_URL}/companies/my-company/stats`, { headers: ownerHeaders });
    const statsData = await statsRes.json();
    assert(statsRes.ok && statsData.data?.totalRevenue !== undefined, 'Şirkət statistikası (turlar, dövriyyə, reytinq) uğurla qaytarıldı');

    // -------------------------------------------------------------------------
    // 3. VALIDASIYA TESTLƏRİ (DƏRİN ŞƏBƏKƏ / AZƏRBAYCAN STANDARTLARI)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. companies.validation.js Dərin Validasiya Testləri ---');

    // 3.1 Qısa şirkət adı (min 2 hərf)
    const invalidNameRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: ownerHeaders,
      body: JSON.stringify({ name: 'A' })
    });
    assert(invalidNameRes.status === 400, 'Çox qısa şirkət adı (<2 simvol) rədd edildi (400)');

    // 3.2 Yanlış formatlı VÖEN (10 rəqəm olmalıdır)
    const invalidVoenRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: ownerHeaders,
      body: JSON.stringify({ voen: '12345' })
    });
    assert(invalidVoenRes.status === 400, 'Qeyri-standart VÖEN rədd edildi (400)');

    // 3.3 Yanlış IBAN (AZ ilə başlamalı və 28 simvol olmalıdır)
    const invalidIbanRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: ownerHeaders,
      body: JSON.stringify({ iban: 'GE29NB0000000123' })
    });
    assert(invalidIbanRes.status === 400, 'Yanlış IBAN (AZ prefiksi olmayan və ya qeyri-28) rədd edildi (400)');

    // 3.4 Yanlış SWIFT/BIC kodu (8 və ya 11 simvol olmalıdır)
    const invalidSwiftRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: ownerHeaders,
      body: JSON.stringify({ swiftBic: 'TOOLONG12345678' })
    });
    assert(invalidSwiftRes.status === 400, 'Yanlış SWIFT kodu rədd edildi (400)');

    // 3.5 Yanlış Sayt URL
    const invalidUrlRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: ownerHeaders,
      body: JSON.stringify({ website: 'not-a-valid-url' })
    });
    assert(invalidUrlRes.status === 400, 'Yanlış Vebsayt URL rədd edildi (400)');

    // -------------------------------------------------------------------------
    // 4. MÜHASİB (ACCOUNTANT) RBAC LİMİTİ VƏ BANK REKVİZİTLƏRİ YENİLƏNMƏSİ
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Mühasib (Accountant) Səlahiyyət Məhdudiyyətləri ---');

    // Mühasib şirkətin adını dəyişməyə cəhd edir -> 403 Forbidden
    const accountantChangeNameRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: accountantHeaders,
      body: JSON.stringify({ name: 'Accountant Changed Name LLC' })
    });
    assert(accountantChangeNameRes.status === 403, 'Mühasibin şirkətin adını dəyişməsi qadağan edildi (403)');

    // Mühasib bank rekvizitlərini yeniləyir -> Uğurlu olmalıdır
    const validIban = 'AZ21NABZ01350100000000123456';
    const validSwift = 'AIIBAZ2X';
    const accountantUpdateBankRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: accountantHeaders,
      body: JSON.stringify({
        bankName: 'Kapital Bank ASC',
        iban: validIban,
        swiftBic: validSwift,
        accountantName: 'Aysel Məmmədova',
        accountantPhone: '+994 50 222 33 44'
      })
    });
    const accountantUpdateBankData = await accountantUpdateBankRes.json();
    assert(accountantUpdateBankRes.ok, 'Mühasib bank rekvizitlərini və mühasib əlaqəsini uğurla yenilədi');
    assert(accountantUpdateBankData.data?.iban === validIban, 'Yenilənmiş IBAN bazada əks olundu');

    // -------------------------------------------------------------------------
    // 5. RƏHBƏR (OWNER) TAM PROFİL YENİLƏNMƏSİ VƏ AUDITLOG
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Rəhbər Tam Profil Yenilənməsi və AuditLog Təsdiqi ---');

    const updatedDesc = 'Azərbaycanın qabaqcıl turoperatoru və rəsmi turizm agentliyi.';
    const ownerUpdateRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: ownerHeaders,
      body: JSON.stringify({
        description: updatedDesc,
        city: 'Bakı',
        address: 'Nizami küçəsi 48, Şəhər Mərkəzi',
        workingHours: '09:00 - 19:00 (B.e - Şənbə)',
        socialLinks: {
          instagram: 'https://instagram.com/aztour',
          facebook: 'https://facebook.com/aztour',
          whatsapp: '+994501234567'
        }
      })
    });
    const ownerUpdateData = await ownerUpdateRes.json();
    assert(ownerUpdateRes.ok, 'Owner profilin təsvirini, iş saatlarını və sosial şəbəkələrini yenilədi');
    assert(ownerUpdateData.data?.city === 'Bakı', 'Şəhər Bakı olaraq yeniləndi');

    // AuditLog qeydlərini yoxlayırıq
    const recentAuditLogs = await prisma.auditLog.findMany({
      where: { tenantId: companyId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const hasProfileAudit = recentAuditLogs.some(l => l.action === 'UPDATE_COMPANY_PROFILE' || l.action === 'UPDATE_BANKING_DETAILS');
    assert(hasProfileAudit, 'Şirkət və ya Bank yenilənməsi AuditLog cədvəlində qeydə alındı');

    // -------------------------------------------------------------------------
    // 6. AKTİV SESSIYALAR VƏ DIGƏR SESSIYALARDAN ÇIXIŞ
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Aktiv Sessiyalar və Təhlükəsizlik Testləri ---');

    const sessionsRes = await fetch(`${BASE_URL}/companies/my-profile/sessions`, { headers: ownerHeaders });
    const sessionsData = await sessionsRes.json();
    assert(sessionsRes.ok && Array.isArray(sessionsData.data), 'Aktiv sessiyalar siyahısı uğurla gətirildi');
    assert(sessionsData.data.length > 0, 'Ən azı 1 aktiv sessiya mövcuddur');
    assert(sessionsData.data[0].isCurrent === true, 'Cari sessiya isCurrent=true ilə işarələnib');

    const revokeRes = await fetch(`${BASE_URL}/companies/my-profile/sessions/revoke-others`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({ currentSessionId: 'sess-current' })
    });
    const revokeData = await revokeRes.json();
    assert(revokeRes.ok && revokeData.status === 'success', 'Digər aktiv sessiyaların ləğv edilməsi uğurla icra olundu');

    console.log('\n========================================================================');
    console.log(`🎉 MƏRHƏLƏ 1 TESTLƏRİ TAM UĞURLA BAŞA ÇATDI: ${passed}/${total} Keçdi!`);
    console.log('========================================================================\n');
  } catch (error) {
    console.error('Test xətası baş verdi:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStage1Tests();
