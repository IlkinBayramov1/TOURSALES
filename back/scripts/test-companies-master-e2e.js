import prisma from '../config/db.js';

async function runCompaniesMasterE2E() {
  console.log('========================================================================');
  console.log('💎 TOURSALES ŞİRKƏT PROFİLİ & REKVİZİTLƏR: MASTER E2E TESTLƏRİ 💎');
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
    console.log('\n--- 2. RBAC Səlahiyyət Qoruması (Rollara Görə Giriş) ---');

    const guideGetRes = await fetch(`${BASE_URL}/companies/my-company`, { headers: guideHeaders });
    assert(guideGetRes.status === 403, 'Bələdçi (GUIDE) şirkət profilini görə bilməz (403)');

    const guideStatsRes = await fetch(`${BASE_URL}/companies/my-company/stats`, { headers: guideHeaders });
    assert(guideStatsRes.status === 403, 'Bələdçi (GUIDE) şirkət statistikasını görə bilməz (403)');

    const guidePutRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: guideHeaders,
      body: JSON.stringify({ name: 'Hacked Name' })
    });
    assert(guidePutRes.status === 403, 'Bələdçi (GUIDE) şirkət profilini dəyişə bilməz (403)');

    const ownerGetRes = await fetch(`${BASE_URL}/companies/my-company`, { headers: ownerHeaders });
    const ownerGetData = await ownerGetRes.json();
    assert(ownerGetRes.ok && ownerGetData.data?.id === companyId, 'Owner şirkət profilini uğurla əldə etdi');

    const managerGetRes = await fetch(`${BASE_URL}/companies/my-company`, { headers: managerHeaders });
    assert(managerGetRes.ok, 'Manager şirkət profilini uğurla əldə etdi');

    const accountantGetRes = await fetch(`${BASE_URL}/companies/my-company`, { headers: accountantHeaders });
    assert(accountantGetRes.ok, 'Accountant şirkət profilini uğurla əldə etdi');

    const statsRes = await fetch(`${BASE_URL}/companies/my-company/stats`, { headers: ownerHeaders });
    const statsData = await statsRes.json();
    assert(statsRes.ok && statsData.data?.rating !== undefined, 'Şirkət statistikası (turlar, dövriyyə, reytinq) uğurla qaytarıldı');

    // -------------------------------------------------------------------------
    // 3. DƏRİN FORMAT VƏ SAHƏ VALIDASIYASI
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Dərin Format və Sahə Validasiyası ---');

    const invalidNameRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: ownerHeaders,
      body: JSON.stringify({ name: 'X' })
    });
    assert(invalidNameRes.status === 400, 'Qısa şirkət adı (<2 simvol) rədd edildi (400)');

    const invalidVoenRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: ownerHeaders,
      body: JSON.stringify({ voen: '99001' })
    });
    assert(invalidVoenRes.status === 400, 'Qeyri-10 rəqəmli VÖEN rədd edildi (400)');

    const invalidIbanRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: ownerHeaders,
      body: JSON.stringify({ iban: 'TR123456789012345678901234' })
    });
    assert(invalidIbanRes.status === 400, 'AZ ilə başlamayan IBAN rədd edildi (400)');

    const invalidIbanLenRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: ownerHeaders,
      body: JSON.stringify({ iban: 'AZ21NABZ12345' })
    });
    assert(invalidIbanLenRes.status === 400, '28 simvoldan qısa IBAN rədd edildi (400)');

    const invalidSwiftRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: ownerHeaders,
      body: JSON.stringify({ swiftBic: 'INVALID_SWIFT_TOOLONG' })
    });
    assert(invalidSwiftRes.status === 400, 'Qeyri-standart SWIFT kodu rədd edildi (400)');

    const invalidUrlRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: ownerHeaders,
      body: JSON.stringify({ website: 'not-valid-url-format' })
    });
    assert(invalidUrlRes.status === 400, 'Qeyri-düzgün Vebsayt URL rədd edildi (400)');

    // -------------------------------------------------------------------------
    // 4. MÜHASİB SƏLAHİYYƏT LİMİTİ VƏ BANK REKVİZİTLƏRİ
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Mühasib Səlahiyyət Limiti və Bank Rekvizitləri ---');

    const accountantNameChangeRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: accountantHeaders,
      body: JSON.stringify({ name: 'Tamamilə Yeni Ad LLC' })
    });
    assert(accountantNameChangeRes.status === 403, 'Mühasibin şirkətin adını dəyişməsi qadağan edildi (403)');

    const validPashaIban = 'AZ21PASZ01350100000000987654';
    const validPashaSwift = 'PASHAZ22';
    const accountantUpdateRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: accountantHeaders,
      body: JSON.stringify({
        bankName: 'PAŞA Bank ASC',
        iban: validPashaIban,
        swiftBic: validPashaSwift,
        bankCode: '505199',
        bankVoen: '1401551061',
        payoutAccount: validPashaIban,
        accountantName: 'Aysel Məmmədova',
        accountantPhone: '+994 50 777 88 99'
      })
    });
    const accountantUpdateData = await accountantUpdateRes.json();
    assert(accountantUpdateRes.ok, 'Mühasib bank rekvizitlərini və mühasibatlıq əlaqəsini uğurla yenilədi');
    assert(accountantUpdateData.data?.iban === validPashaIban, 'Yenilənmiş PAŞA Bank IBAN bazaya yazıldı');
    assert(accountantUpdateData.data?.swiftBic === validPashaSwift, 'Yenilənmiş SWIFT bazaya yazıldı');

    // -------------------------------------------------------------------------
    // 5. AUDITLOG REKVİZİT DƏYİŞİKLİYİ İZLƏNMƏSİ
    // -------------------------------------------------------------------------
    console.log('\n--- 5. AuditLog Təhlükəsizlik Jurnalı Yoxlanışı ---');

    const bankAuditLog = await prisma.auditLog.findFirst({
      where: {
        tenantId: companyId,
        action: 'UPDATE_BANKING_DETAILS'
      },
      orderBy: { createdAt: 'desc' }
    });
    assert(!!bankAuditLog, 'Bank rekvizitləri dəyişikliyi UPDATE_BANKING_DETAILS olaraq AuditLog-da arxivləndi');
    assert(bankAuditLog.performedBy.includes('ACCOUNTANT') || bankAuditLog.performedBy.includes('Aysel'), 'Dəyişikliyi icra edən istifadəçi adı və rolu jurnalda qeyd olundu');

    // -------------------------------------------------------------------------
    // 6. RƏHBƏR (OWNER) TAM PROFİL VƏ DTA REYESTR YENİLƏNMƏSİ
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Rəhbər Tam Profil və DTA Reyestr Yenilənməsi ---');

    const ownerProfileUpdateRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: ownerHeaders,
      body: JSON.stringify({
        legalName: 'AzTour Turizm və Ekskursiya Xidmətləri MMC',
        description: 'Azərbaycanın bütün regionlarına eksklüziv turlar və yüksək komfortlu səyahətlər təşkil edirik.',
        city: 'Bakı',
        address: 'Nizami küçəsi 48, AF Business House',
        workingHours: 'B.e - Şənbə: 09:00 - 19:00',
        website: 'https://aztour.az',
        socialLinks: {
          instagram: 'https://instagram.com/aztour',
          whatsapp: '+994501234567',
          facebook: 'https://facebook.com/aztour.az',
          telegram: 'https://t.me/aztour_baku',
          dtaRegistry: 'DTA-TR-2026/8941',
          hotline: '+994 12 599 00 00'
        }
      })
    });
    const ownerProfileUpdateData = await ownerProfileUpdateRes.json();
    assert(ownerProfileUpdateRes.ok, 'Owner şirkətin hüquqi adını, təsvirini və DTA məlumatlarını yenilədi');
    assert(ownerProfileUpdateData.data?.legalName.includes('MMC'), 'Hüquqi ad bazada yeniləndi');

    // -------------------------------------------------------------------------
    // 7. BİLDİRİŞ TƏNZİMLƏMƏLƏRİ (NOTIFICATION SETTINGS)
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Bildiriş Kanalları və Tənzimləmələri ---');

    const notifSettingsUpdateRes = await fetch(`${BASE_URL}/companies/my-company`, {
      method: 'PUT',
      headers: ownerHeaders,
      body: JSON.stringify({
        notificationSettings: {
          emailBookings: true,
          emailPayouts: true,
          smsAlerts: false,
          whatsappAlerts: true,
          telegramAlerts: true,
          dailyDigest: true,
          notificationEmail: 'alerts@aztour.az'
        }
      })
    });
    const notifSettingsData = await notifSettingsUpdateRes.json();
    assert(notifSettingsUpdateRes.ok, 'Bildiriş kanalları və xüsusi bildiriş e-poçtu uğurla saxlanıldı');

    let parsedNotif = {};
    try {
      parsedNotif = typeof notifSettingsData.data?.notificationSettings === 'string'
        ? JSON.parse(notifSettingsData.data.notificationSettings)
        : notifSettingsData.data?.notificationSettings;
    } catch {}
    assert(parsedNotif?.notificationEmail === 'alerts@aztour.az', 'Xüsusi bildiriş e-poçtu bazada saxlanıldı');
    assert(parsedNotif?.whatsappAlerts === true, 'WhatsApp bildiriş kanalı aktiv saxlanıldı');

    // -------------------------------------------------------------------------
    // 8. AKTİV SESSIYALAR VƏ DİGƏR SESSIYALARDAN ÇIXIŞ
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Təhlükəsizlik: Aktiv Sessiyalar və Çıxış ---');

    const sessionsRes = await fetch(`${BASE_URL}/companies/my-profile/sessions`, { headers: ownerHeaders });
    const sessionsData = await sessionsRes.json();
    assert(sessionsRes.ok && Array.isArray(sessionsData.data), 'Aktiv sessiyalar siyahısı qaytarıldı');
    assert(sessionsData.data.length > 0, 'Ən azı 1 aktiv cihaz mövcuddur');
    assert(sessionsData.data[0].isCurrent === true, 'Cari brauzer isCurrent=true ilə işarələndi');
    assert(!!sessionsData.data[0].device, 'Cihaz modeli (Windows PC / MacBook və s.) formatlandı');

    const revokeRes = await fetch(`${BASE_URL}/companies/my-profile/sessions/revoke-others`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({ currentSessionId: 'sess-current' })
    });
    const revokeData = await revokeRes.json();
    assert(revokeRes.ok && revokeData.status === 'success', 'Digər aktiv sessiyaların ləğv edilməsi icra edildi');

    const revokeAudit = await prisma.auditLog.findFirst({
      where: {
        tenantId: companyId,
        action: 'REVOKE_SESSIONS'
      },
      orderBy: { createdAt: 'desc' }
    });
    assert(!!revokeAudit, 'Sessiyaların ləğv edilməsi REVOKE_SESSIONS olaraq AuditLog-da qeydə alındı');

    // -------------------------------------------------------------------------
    // 9. İCTİMAİ MÜŞTƏRİ VİTRİNİ (PUBLIC DIRECTORY & PROFILE)
    // -------------------------------------------------------------------------
    console.log('\n--- 9. İctimai Müştəri Vitrini (Public Directory) ---');

    const publicListRes = await fetch(`${BASE_URL}/companies/public`);
    const publicListData = await publicListRes.json();
    assert(publicListRes.ok && Array.isArray(publicListData.data), 'İctimai şirkətlər kataloqu uğurla qaytarıldı');

    const publicProfileRes = await fetch(`${BASE_URL}/companies/public/${companyId}`);
    const publicProfileData = await publicProfileRes.json();
    assert(publicProfileRes.ok && publicProfileData.data?.id === companyId, 'Şirkətin ictimai vitrin profili uğurla qaytarıldı');
    assert(publicProfileData.data?.legalName !== undefined, 'İctimai profildə hüquqi məlumatlar mövcuddur');
    assert(Array.isArray(publicProfileData.data?.tours), 'İctimai vitrində şirkətin aktiv turları əks olunur');

    console.log('\n========================================================================');
    console.log(`🎉 ŞİRKƏT PROFİLİ MASTER E2E TESTLƏRİ TAM UĞURLA BAŞA ÇATDI: ${passed}/${total} Keçdi!`);
    console.log('========================================================================\n');
  } catch (error) {
    console.error('Master E2E xətası:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runCompaniesMasterE2E();
