import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';

async function runMasterE2ETests() {
  console.log('========================================================================');
  console.log('👑 TOURSALES KOMANDA VƏ RBAC MASTER E2E AVTOMATLAŞDIRILMIŞ TESTLƏR 🛡️');
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
    // 0. TEST MÜHİTİNİN HAZIRLANMASI (İDEMPOTENT SETUP)
    // -------------------------------------------------------------------------
    const defaultHash = await bcrypt.hash('password123', 10);
    await prisma.user.updateMany({
      where: { email: { in: ['aztour@gmail.com', 'elvin@aztour.az', 'aysel@aztour.az', 'murad@aztour.az'] } },
      data: { password: defaultHash, status: 'Active' },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'e2e_guide_' } },
    });

    // -------------------------------------------------------------------------
    // 1. DÖRD ROL ÜZRƏ GİRİŞ VƏ TOKENLƏRİN ƏLDƏ EDİLMƏSİ
    // -------------------------------------------------------------------------
    console.log('--- 1. Bütün Rollar Üzrə Giriş və Token İdentifikasiyası ---');

    async function login(email, password = 'password123') {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      return { status: res.status, ok: res.ok, token: data.data?.accessToken, user: data.data?.user };
    }

    const ownerAuth = await login('aztour@gmail.com');
    assert(ownerAuth.ok && !!ownerAuth.token, 'Owner (aztour@gmail.com) daxil oldu və JWT aldı');

    const managerAuth = await login('elvin@aztour.az');
    assert(managerAuth.ok && !!managerAuth.token, 'Manager (elvin@aztour.az) daxil oldu və JWT aldı');

    const accountantAuth = await login('aysel@aztour.az');
    assert(accountantAuth.ok && !!accountantAuth.token, 'Accountant (aysel@aztour.az) daxil oldu və JWT aldı');

    const guideAuth = await login('murad@aztour.az');
    assert(guideAuth.ok && !!guideAuth.token, 'Guide (murad@aztour.az) daxil oldu və JWT aldı');

    const ownerH = { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerAuth.token}` };
    const managerH = { 'Content-Type': 'application/json', Authorization: `Bearer ${managerAuth.token}` };
    const accountantH = { 'Content-Type': 'application/json', Authorization: `Bearer ${accountantAuth.token}` };
    const guideH = { 'Content-Type': 'application/json', Authorization: `Bearer ${guideAuth.token}` };

    // -------------------------------------------------------------------------
    // 2. KOMANDA ÜZVLƏRİ VƏ BƏLƏDÇİ TUR SAYI
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Komanda Üzvləri, KPI və Bələdçi Turları ---');
    const membersRes = await fetch(`${BASE_URL}/teams/members`, { headers: ownerH });
    const membersData = await membersRes.json();
    assert(membersRes.status === 200 && membersData.status === 'success', 'GET /teams/members HTTP 200 OK');

    const { members, kpis } = membersData.data;
    assert(Array.isArray(members) && members.length >= 4, `Komanda üzvlərinin sayı: ${members.length}`);
    assert(kpis.total === members.length, `KPI Total düzgündür: ${kpis.total}`);
    assert(kpis.managers >= 1, `KPI Menecerlər: ${kpis.managers}`);
    assert(kpis.accountants >= 1, `KPI Mühasiblər: ${kpis.accountants}`);
    assert(kpis.guides >= 1, `KPI Bələdçilər: ${kpis.guides}`);

    const guideMember = members.find((m) => m.agencyRole === 'GUIDE');
    assert(guideMember && typeof guideMember.assignedToursCount === 'number', `Bələdçinin aktiv tur sayı mövcuddur: ${guideMember?.assignedToursCount}`);

    // -------------------------------------------------------------------------
    // 3. İCAZƏLƏR MATRİSİ API
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Rollar və İcazələr Matrisi ---');
    const rolesRes = await fetch(`${BASE_URL}/teams/roles`, { headers: ownerH });
    const rolesData = await rolesRes.json();
    assert(rolesRes.status === 200 && Array.isArray(rolesData.data), 'GET /teams/roles HTTP 200 OK');
    assert(rolesData.data.length >= 7, `İcazələr matrisi ən azı 7 modul ehtiva edir (Tapıldı: ${rolesData.data.length})`);

    // -------------------------------------------------------------------------
    // 4. HEYƏT DƏVƏTİ VƏ SAAS KVOTA QORUYUCUSU
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Əməkdaş Dəvəti və SaaS Kvota İdarəetməsi ---');

    // Test Guide dəvət etmək
    const testEmail = `e2e_guide_${Date.now()}@aztour.az`;
    const inviteRes = await fetch(`${BASE_URL}/teams/invite`, {
      method: 'POST',
      headers: ownerH,
      body: JSON.stringify({
        name: 'E2E Test Bələdçi',
        email: testEmail,
        phone: '+994509998877',
        role: 'GUIDE',
        password: 'Password#2026',
      }),
    });
    const inviteData = await inviteRes.json();

    let createdMemberId = null;
    if (inviteRes.status === 201 || inviteRes.status === 200) {
      assert(true, `Yeni əməkdaş (${testEmail}) uğurla dəvət edildi`);
      createdMemberId = inviteData.data?.id;
    } else if (inviteRes.status === 400 && inviteData.msg?.includes('limiti')) {
      assert(true, `SaaS Kvota qoruyucusu işə düşdü: ${inviteData.msg}`);
    } else {
      assert(false, `Gözlənilməz dəvət statusu: ${inviteRes.status} - ${JSON.stringify(inviteData)}`);
    }

    // -------------------------------------------------------------------------
    // 5. İYERARXİYA TƏHLÜKƏSİZLİYİ (MANAGER OWNER-Ə MÜDAXİLƏ EDƏ BİLMƏZ)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. İyerarxiya Təhlükəsizliyi: Menecer Rəhbərə Təsir Edə Bilməz ---');
    const ownerMember = members.find((m) => m.agencyRole === 'OWNER');
    assert(!!ownerMember, 'Owner üzvü tapıldı');

    // Menecer rəhbəri redaktə etməyə çalışır
    const badEditRes = await fetch(`${BASE_URL}/teams/members/${ownerMember.id}`, {
      method: 'PUT',
      headers: managerH,
      body: JSON.stringify({ name: 'Hacked Name' }),
    });
    assert(badEditRes.status === 403, `Menecer rəhbəri redaktə edə bilməz -> HTTP 403 Forbidden (Alındı: ${badEditRes.status})`);

    // Menecer rəhbəri dondurmağa çalışır
    const badSuspendRes = await fetch(`${BASE_URL}/teams/members/${ownerMember.id}/toggle-status`, {
      method: 'PATCH',
      headers: managerH,
    });
    assert(badSuspendRes.status === 403, `Menecer rəhbəri dondura bilməz -> HTTP 403 Forbidden (Alındı: ${badSuspendRes.status})`);

    // Rəhbər özünü dondurmağa çalışsa belə sistem icazə verməməlidir
    const ownerSelfSuspendRes = await fetch(`${BASE_URL}/teams/members/${ownerMember.id}/toggle-status`, {
      method: 'PATCH',
      headers: ownerH,
    });
    assert(ownerSelfSuspendRes.status === 400 || ownerSelfSuspendRes.status === 403, `Rəhbərin statusu dondurula bilməz -> HTTP 400/403 (Alındı: ${ownerSelfSuspendRes.status})`);

    // -------------------------------------------------------------------------
    // 6. STATUSUN DONDURULMASI VƏ BƏRPASI (GUIDE)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Statusun Dondurulması və Aktivləşdirilməsi ---');
    const targetGuide = guideMember;

    // Dondurmaq
    const suspendRes = await fetch(`${BASE_URL}/teams/members/${targetGuide.id}/toggle-status`, {
      method: 'PATCH',
      headers: ownerH,
    });
    const suspendData = await suspendRes.json();
    assert(suspendRes.status === 200, `Bələdçi statusu dəyişdirildi (Yeni status: ${suspendData.data?.status})`);

    // Yenidən aktivləşdirmək
    const reactivateRes = await fetch(`${BASE_URL}/teams/members/${targetGuide.id}/toggle-status`, {
      method: 'PATCH',
      headers: ownerH,
    });
    const reactivateData = await reactivateRes.json();
    assert(reactivateRes.status === 200 && reactivateData.data?.status === 'Active', `Bələdçi təkrar aktivləşdirildi (Status: Active)`);

    // -------------------------------------------------------------------------
    // 7. ŞİFRƏNİN SIFIRLANMASI VƏ BCRYPT YOXLANMASI
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Şifrənin Sıfırlanması və Bcrypt Hash Yoxlanışı ---');
    const resetRes = await fetch(`${BASE_URL}/teams/members/${targetGuide.id}/reset-password`, {
      method: 'POST',
      headers: ownerH,
      body: JSON.stringify({}), // avtomatik generasiya
    });
    const resetData = await resetRes.json();
    assert(resetRes.status === 200 && !!resetData.data?.tempPassword, `Müvəqqəti şifrə generasiya edildi: ${resetData.data?.tempPassword}`);

    // Bazada saxlanan hash ilə müvəqqəti şifrənin uyğunluğunu test edirik
    const updatedGuideUser = await prisma.user.findUnique({ where: { id: targetGuide.userId || targetGuide.id } });
    const isPasswordValid = await bcrypt.compare(resetData.data.tempPassword, updatedGuideUser.password);
    assert(isPasswordValid === true, 'Müvəqqəti şifrə verilənlər bazasındakı Bcrypt hash ilə 100% uyğundur');

    // Mühasib və ya bələdçi şifrə sıfırlaya bilməz
    const guideTryResetRes = await fetch(`${BASE_URL}/teams/members/${targetGuide.id}/reset-password`, {
      method: 'POST',
      headers: guideH,
      body: JSON.stringify({}),
    });
    assert(guideTryResetRes.status === 403, `Bələdçi şifrə sıfırlaya bilməz -> HTTP 403 (Alındı: ${guideTryResetRes.status})`);

    // -------------------------------------------------------------------------
    // 8. ÇARPAZ RBAC TƏHLÜKƏSİZLİK MƏHDUDİYYƏTLƏRİ (CROSS-MODULE RBAC)
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Çarpaz Modullar Üzrə RBAC Qoruması ---');

    // 8.1 API Açarları: Yalnız OWNER
    const guideApiKeyRes = await fetch(`${BASE_URL}/api-keys`, {
      method: 'POST',
      headers: guideH,
      body: JSON.stringify({ name: 'Hacked Key' }),
    });
    assert(guideApiKeyRes.status === 403, `Bələdçi API Açar yarada bilməz -> HTTP 403 (Alındı: ${guideApiKeyRes.status})`);

    const managerApiKeyRes = await fetch(`${BASE_URL}/api-keys`, {
      method: 'POST',
      headers: managerH,
      body: JSON.stringify({ name: 'Hacked Key' }),
    });
    assert(managerApiKeyRes.status === 403, `Menecer API Açar yarada bilməz -> HTTP 403 (Alındı: ${managerApiKeyRes.status})`);

    // 8.2 Abunəlik Planı: Yalnız OWNER
    const guideSubRes = await fetch(`${BASE_URL}/subscriptions/change-plan`, {
      method: 'POST',
      headers: guideH,
      body: JSON.stringify({ planId: 'plan-enterprise' }),
    });
    assert(guideSubRes.status === 403, `Bələdçi Abunəlik planını dəyişə bilməz -> HTTP 403 (Alındı: ${guideSubRes.status})`);

    const managerSubRes = await fetch(`${BASE_URL}/subscriptions/change-plan`, {
      method: 'POST',
      headers: managerH,
      body: JSON.stringify({ planId: 'plan-enterprise' }),
    });
    assert(managerSubRes.status === 403, `Menecer Abunəlik planını dəyişə bilməz -> HTTP 403 (Alındı: ${managerSubRes.status})`);

    // 8.3 Maliyyə Çıxarışı: Yalnız OWNER və ACCOUNTANT (Menecer və Bələdçi BLOKLANIR)
    const guidePayoutRes = await fetch(`${BASE_URL}/finance/vendor/payout-request`, {
      method: 'POST',
      headers: guideH,
      body: JSON.stringify({ amount: 100 }),
    });
    assert(guidePayoutRes.status === 403, `Bələdçi Maliyyə Çıxarışı edə bilməz -> HTTP 403 (Alındı: ${guidePayoutRes.status})`);

    const managerPayoutRes = await fetch(`${BASE_URL}/finance/vendor/payout-request`, {
      method: 'POST',
      headers: managerH,
      body: JSON.stringify({ amount: 100 }),
    });
    assert(managerPayoutRes.status === 403, `Menecer Maliyyə Çıxarışı edə bilməz -> HTTP 403 (Alındı: ${managerPayoutRes.status})`);

    // 8.4 Turlar: Yalnız OWNER və MANAGER (Mühasib və Bələdçi BLOKLANIR)
    const guideCreateTourRes = await fetch(`${BASE_URL}/tours`, {
      method: 'POST',
      headers: guideH,
      body: JSON.stringify({ title: 'Hacked Tour' }),
    });
    assert(guideCreateTourRes.status === 403, `Bələdçi Tur yarada bilməz -> HTTP 403 (Alındı: ${guideCreateTourRes.status})`);

    const accountantCreateTourRes = await fetch(`${BASE_URL}/tours`, {
      method: 'POST',
      headers: accountantH,
      body: JSON.stringify({ title: 'Hacked Tour' }),
    });
    assert(accountantCreateTourRes.status === 403, `Mühasib Tur yarada bilməz -> HTTP 403 (Alındı: ${accountantCreateTourRes.status})`);

    // -------------------------------------------------------------------------
    // 9. AUDİT JURNALI VƏ AXTARIŞ/SÜZGƏC TESTLƏRİ
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Audit Jurnalı (Fəaliyyət Tarixçəsi) və Filtrlər ---');

    // Bələdçinin audit jurnalına baxışı bloklanmalıdır
    const guideAuditRes = await fetch(`${BASE_URL}/teams/activity-logs`, { headers: guideH });
    assert(guideAuditRes.status === 403, `Bələdçi Audit Jurnalına baxa bilməz -> HTTP 403 (Alındı: ${guideAuditRes.status})`);

    // Rəhbər və Menecer baxa bilər
    const auditRes = await fetch(`${BASE_URL}/teams/activity-logs`, { headers: ownerH });
    const auditData = await auditRes.json();
    assert(auditRes.status === 200 && Array.isArray(auditData.data), `Audit jurnalı gətirildi (${auditData.data?.length} qeyd)`);

    // Filtr: action=RESET_PASSWORD
    const filterResetRes = await fetch(`${BASE_URL}/teams/activity-logs?action=RESET_PASSWORD`, { headers: ownerH });
    const filterResetData = await filterResetRes.json();
    assert(filterResetRes.status === 200 && Array.isArray(filterResetData.data), `action=RESET_PASSWORD filtri işləyir (${filterResetData.data.length} qeyd)`);
    if (filterResetData.data.length > 0) {
      assert(filterResetData.data.every((l) => l.action === 'RESET_PASSWORD'), 'Bütün qaytarılan qeydlər RESET_PASSWORD əməliyyatına aiddir');
    }

    // Filtr: Axtarış (search=Status və ya search=Bələdçi və ya search=Admin)
    const searchRes = await fetch(`${BASE_URL}/teams/activity-logs?search=Elvin`, { headers: ownerH });
    const searchData = await searchRes.json();
    assert(searchRes.status === 200 && Array.isArray(searchData.data), `search=Elvin axtarış sorğusu HTTP 200 ilə icra olundu (${searchData.data.length} qeyd)`);

    // -------------------------------------------------------------------------
    // 10. TƏMİZLƏMƏ (CLEANUP)
    // -------------------------------------------------------------------------
    if (createdMemberId) {
      console.log('\n--- 10. Test Məlumatlarının Təmizlənməsi ---');
      const delRes = await fetch(`${BASE_URL}/teams/members/${createdMemberId}`, {
        method: 'DELETE',
        headers: ownerH,
      });
      assert(delRes.status === 200, `Yaradılmış test bələdçisi (${createdMemberId}) uğurla silindi`);
    }

    // Muradın şifrəsini default password123 halına bərpa edirik
    await prisma.user.update({
      where: { email: 'murad@aztour.az' },
      data: { password: defaultHash },
    });

    console.log('\n========================================================================');
    console.log(`🎉 BÜTÜN MASTER E2E TESTLƏRİ TAM UĞURLA BAŞA ÇATDI!`);
    console.log(`Nəticə: ${passed} / ${total} Test Keçdi (100% Uğur)`);
    console.log('========================================================================');
  } catch (error) {
    console.error('\n❌ MASTER E2E TESTLƏRİ ZAMANI XƏTA BAŞ VERDİ:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMasterE2ETests();
