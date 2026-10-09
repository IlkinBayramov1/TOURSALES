import prisma from '../config/db.js';

async function runStage1Tests() {
  console.log('========================================================================');
  console.log('🛡️ TOURSALES TEAM RBAC MODULE: STAGE 1 BACKEND AUDIT & VERIFICATION 🛡️');
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
    // 1. DÖRD ROLUN HƏR BİRİ İLƏ GİRİŞ VƏ TOKEN ALINMASI
    // -------------------------------------------------------------------------
    console.log('--- 1. Bütün Rollar Üzrə Giriş və Token Əldə Edilməsi ---');

    async function loginAs(email, password = 'password123') {
      const res = await fetch('http://localhost:5000/api/v1/auth/login', {
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

    // -------------------------------------------------------------------------
    // 2. KOMANDA ÜZVLƏRİ SİYAHISI VƏ BƏLƏDÇİ TUR SAYI
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Komanda Üzvləri və Bələdçi Turları Göstəricisi ---');
    const membersRes = await fetch('http://localhost:5000/api/v1/teams/members', { headers: ownerHeaders });
    const membersData = await membersRes.json();
    assert(membersRes.ok && membersData.status === 'success', 'GET /teams/members HTTP 200 OK');

    const { members, kpis } = membersData.data;
    assert(Array.isArray(members) && members.length >= 4, `Ən azı 4 əməkdaş qaytarıldı (Tapıldı: ${members.length})`);
    assert(kpis.total === members.length, `KPI Total düzgündür: ${kpis.total}`);
    assert(kpis.managers >= 1, `KPI Managers düzgündür: ${kpis.managers}`);
    assert(kpis.accountants >= 1, `KPI Accountants düzgündür: ${kpis.accountants}`);
    assert(kpis.guides >= 1, `KPI Guides düzgündür: ${kpis.guides}`);

    const guideMember = members.find(m => m.agencyRole === 'GUIDE');
    assert(typeof guideMember?.assignedToursCount === 'number', `Bələdçinin təhkim olunan aktiv tur sayı mövcuddur: ${guideMember?.assignedToursCount}`);

    // -------------------------------------------------------------------------
    // 3. KOMANDA İDARƏETMƏSİNDƏ RBAC TƏHLÜKƏSİZLİK BLOKLARI
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Komanda Əməliyyatlarında RBAC Qoruyucusu ---');

    // A) Bələdçi yeni əməkdaş dəvət etməyə cəhd edir -> 403 Forbidden olmalıdır!
    const guideInviteRes = await fetch('http://localhost:5000/api/v1/teams/invite', {
      method: 'POST',
      headers: guideHeaders,
      body: JSON.stringify({ name: 'Hacker', email: 'hacker@aztour.az', role: 'GUIDE' })
    });
    assert(guideInviteRes.status === 403, 'Bələdçinin yeni işçi dəvət etməsi bloklandı (HTTP 403 Forbidden)');

    // B) Mühasib başqa əməkdaşı silməyə cəhd edir -> 403 Forbidden olmalıdır!
    const accDeleteRes = await fetch(`http://localhost:5000/api/v1/teams/members/${guideMember.id}`, {
      method: 'DELETE',
      headers: accountantHeaders
    });
    assert(accDeleteRes.status === 403, 'Mühasibin əməkdaşı silməsi bloklandı (HTTP 403 Forbidden)');

    // C) Menecer yeni OWNER yaratmağa cəhd edir -> 403 Forbidden olmalıdır!
    const mgrPromoteRes = await fetch('http://localhost:5000/api/v1/teams/invite', {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({ name: 'Fake Owner', email: 'fakeowner@aztour.az', role: 'OWNER' })
    });
    assert(mgrPromoteRes.status === 403, 'Menecerin OWNER dəvət etməsi bloklandı (HTTP 403 Forbidden)');

    // D) Owner yeni Bələdçi dəvət edir -> Uğurlu olmalıdır (201 Created)
    // Təmizləyirik əgər əvvəldən qalıbsa
    await prisma.user.deleteMany({ where: { email: 'testguide@aztour.az' } });
    const ownerInviteRes = await fetch('http://localhost:5000/api/v1/teams/invite', {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        name: 'Sənan Qasımov',
        email: 'testguide@aztour.az',
        phone: '+994 50 999 88 77',
        role: 'GUIDE',
        password: 'password123'
      })
    });
    const ownerInviteData = await ownerInviteRes.json();
    assert(ownerInviteRes.status === 201, 'Rəhbər uğurla yeni bələdçi əlavə etdi (HTTP 201 Created)');
    const testGuideId = ownerInviteData.data?.id;

    // -------------------------------------------------------------------------
    // 4. BİR KLİKLƏ STATUSUN DONDURULMASI VƏ AKTİVLƏŞDİRİLMƏSİ
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Bir Kliklə Statusun İdarə Edilməsi (Toggle Status) ---');

    // A) Bələdçi status dəyişməyə cəhd edir -> 403 Forbidden
    const guideToggleRes = await fetch(`http://localhost:5000/api/v1/teams/members/${testGuideId}/toggle-status`, {
      method: 'PATCH',
      headers: guideHeaders
    });
    assert(guideToggleRes.status === 403, 'Bələdçinin status dəyişməsi bloklandı (HTTP 403 Forbidden)');

    // B) Rəhbər bələdçinin statusunu 'Suspended' edir
    const suspendRes = await fetch(`http://localhost:5000/api/v1/teams/members/${testGuideId}/toggle-status`, {
      method: 'PATCH',
      headers: ownerHeaders
    });
    const suspendData = await suspendRes.json();
    assert(suspendRes.ok && suspendData.data?.status === 'Suspended', 'Əməkdaşın statusu donduruldu (Status: Suspended)');

    // C) Rəhbər bələdçinin statusunu yenidən 'Active' edir
    const activateRes = await fetch(`http://localhost:5000/api/v1/teams/members/${testGuideId}/toggle-status`, {
      method: 'PATCH',
      headers: ownerHeaders
    });
    const activateData = await activateRes.json();
    assert(activateRes.ok && activateData.data?.status === 'Active', 'Əməkdaşın statusu yenidən aktivləşdirildi (Status: Active)');

    // -------------------------------------------------------------------------
    // 5. ŞİFRƏNİN SIFIRLANMASI VƏ MÜVƏQQƏTİ ŞİFRƏ GENERASİYASI
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Şifrənin Təhlükəsiz Sıfırlanması (Reset Password) ---');

    // A) Bələdçi şifrə sıfırlamağa cəhd edir -> 403 Forbidden
    const guideResetRes = await fetch(`http://localhost:5000/api/v1/teams/members/${testGuideId}/reset-password`, {
      method: 'POST',
      headers: guideHeaders
    });
    assert(guideResetRes.status === 403, 'Bələdçinin şifrə sıfırlaması bloklandı (HTTP 403 Forbidden)');

    // B) Rəhbər avtomatik müvəqqəti şifrə ilə sıfırlayır
    const resetRes = await fetch(`http://localhost:5000/api/v1/teams/members/${testGuideId}/reset-password`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({}) // boş göndəririk ki, avto-generasiya etsin
    });
    const resetData = await resetRes.json();
    assert(resetRes.ok && !!resetData.data?.tempPassword, 'Rəhbər üçün avtomatik müvəqqəti şifrə generasiya edildi');
    const newTempPass = resetData.data.tempPassword;
    console.log(`    -> Yaradılan müvəqqəti şifrə: ${newTempPass}`);

    // C) Həmin əməkdaş yeni müvəqqəti şifrə ilə sistemə daxil ola bilir
    const tempLogin = await loginAs('testguide@aztour.az', newTempPass);
    assert(tempLogin.ok && !!tempLogin.token, 'Əməkdaş yeni müvəqqəti şifrəsi ilə uğurla daxil oldu');

    // -------------------------------------------------------------------------
    // 6. DİGƏR MODULLARDA AGENCY RBAC BLOKLARI (CROSS-MODULE PROTECTION)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Digər Modullarda Agency RBAC Mühafizəsi ---');

    // A) Bələdçi abunəlik planını dəyişməyə cəhd edir -> 403 Forbidden olmalıdır!
    const guideSubRes = await fetch('http://localhost:5000/api/v1/subscriptions/change-plan', {
      method: 'POST',
      headers: guideHeaders,
      body: JSON.stringify({ planId: 'SP-ENTERPRISE' })
    });
    assert(guideSubRes.status === 403, 'Bələdçinin abunəlik planını dəyişməsi bloklandı (HTTP 403 Forbidden)');

    // B) Bələdçi API açar yaratmağa cəhd edir -> 403 Forbidden olmalıdır!
    const guideApiRes = await fetch('http://localhost:5000/api/v1/api-keys', {
      method: 'POST',
      headers: guideHeaders,
      body: JSON.stringify({ name: 'Guide API' })
    });
    assert(guideApiRes.status === 403, 'Bələdçinin API açar yaratması bloklandı (HTTP 403 Forbidden)');

    // C) Bələdçi bank çıxarışı sorğusu göndərməyə cəhd edir -> 403 Forbidden olmalıdır!
    const guidePayoutRes = await fetch('http://localhost:5000/api/v1/finance/vendor/payout-request', {
      method: 'POST',
      headers: guideHeaders,
      body: JSON.stringify({ amount: 50, iban: 'AZ12ABB' })
    });
    assert(guidePayoutRes.status === 403, 'Bələdçinin balansdan çıxarış tələbi bloklandı (HTTP 403 Forbidden)');

    // D) Mühasib yeni tur yaratmağa cəhd edir -> 403 Forbidden olmalıdır!
    const accTourRes = await fetch('http://localhost:5000/api/v1/tours', {
      method: 'POST',
      headers: accountantHeaders,
      body: JSON.stringify({ title: 'Hacked Tour' })
    });
    assert(accTourRes.status === 403, 'Mühasibin tur yaratması bloklandı (HTTP 403 Forbidden)');

    // -------------------------------------------------------------------------
    // 7. TƏMİZLƏMƏ VƏ AUDİT JURNALI YOXLANMASI
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Əməkdaşın Silinməsi və Audit Jurnalının Yoxlanması ---');
    const delRes = await fetch(`http://localhost:5000/api/v1/teams/members/${testGuideId}`, {
      method: 'DELETE',
      headers: ownerHeaders
    });
    assert(delRes.ok, 'Rəhbər test əməkdaşını komandadan uğurla sildi');

    // Audit jurnalı gətiririk (yeni icra olunmuş RESET_PASSWORD və SUSPEND qeydləri ilə)
    const logsRes = await fetch('http://localhost:5000/api/v1/teams/activity-logs?action=RESET_PASSWORD', {
      headers: ownerHeaders
    });
    const logsData = await logsRes.json();
    assert(logsRes.ok && Array.isArray(logsData.data), 'GET /teams/activity-logs?action=RESET_PASSWORD işləkdir');
    assert(logsData.data.some(l => l.action === 'RESET_PASSWORD'), 'Şifrə sıfırlama əməliyyatı Audit jurnalında təsdiqləndi');

    console.log('\n========================================================================');
    console.log(`🎉 BÜTÜN MƏRHƏLƏ 1 TESTLƏRİ UĞURLA KEÇDİ! (${passed}/${total} test - 100%)`);
    console.log('✅ Agency RBAC Arxitekturası, Şifrə Sıfırlama, Status İdarəsi və Qoruyucular hazırdır!');
    console.log('========================================================================\n');

  } catch (err) {
    console.error('\n❌ MƏRHƏLƏ 1 TEST XƏTASI:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStage1Tests();
