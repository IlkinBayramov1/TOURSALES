import http from 'http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Mərhələ 9: Şirkət Profili API Testləri Başlayır...\n');

  // 1. Login
  console.log('1. Vendor Login sorğusu...');
  const loginRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: 'aztour@gmail.com', password: 'password123' }
  );

  if (loginRes.status !== 200 || !loginRes.data?.data?.accessToken) {
    console.error('❌ Login uğursuz oldu:', loginRes);
    process.exit(1);
  }

  const token = loginRes.data.data.accessToken;
  console.log('✅ Uğurla login olundu! Token əldə edildi.\n');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // 2. GET /companies/my-company
  console.log('2. GET /companies/my-company yoxlanılır...');
  const profileRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/v1/companies/my-company',
    method: 'GET',
    headers: authHeaders
  });

  if (profileRes.status !== 200 || !profileRes.data?.data?.name) {
    console.error('❌ Profil gətirilməsi uğursuz oldu:', profileRes);
    process.exit(1);
  }
  console.log('✅ Profil gətirildi:', {
    name: profileRes.data.data.name,
    voen: profileRes.data.data.voen,
    rating: profileRes.data.data.rating,
    bankName: profileRes.data.data.bankName,
    iban: profileRes.data.data.iban,
    plan: profileRes.data.data.plan?.name
  });

  // 3. GET /companies/my-company/stats
  console.log('\n3. GET /companies/my-company/stats yoxlanılır...');
  const statsRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/v1/companies/my-company/stats',
    method: 'GET',
    headers: authHeaders
  });

  if (statsRes.status !== 200 || statsRes.data?.data?.activeTours === undefined) {
    console.error('❌ Statistika gətirilməsi uğursuz oldu:', statsRes);
    process.exit(1);
  }
  console.log('✅ Profil statistikası gətirildi:', statsRes.data.data);

  // 4. PUT /companies/my-company (Brend və Əlaqə məlumatları)
  console.log('\n4. PUT /companies/my-company (Brend və Əlaqə məlumatları) yoxlanılır...');
  const updateRes1 = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/v1/companies/my-company',
      method: 'PUT',
      headers: authHeaders
    },
    {
      name: 'AzTour Travel & Tourism MMC',
      legalName: 'AzTour Turizm və Səyahət MMC',
      city: 'Bakı',
      website: 'https://aztour.az',
      description: 'Azərbaycanın və regionun aparıcı daxili və xarici turlarını təşkil edən lisenziyalı rəsmi turizm şirkəti.',
      workingHours: 'B.e - Şənbə: 09:00 - 19:00'
    }
  );

  if (updateRes1.status !== 200 || updateRes1.data?.data?.city !== 'Bakı') {
    console.error('❌ Profil yenilənməsi uğursuz oldu:', updateRes1);
    process.exit(1);
  }
  console.log('✅ Profil brend məlumatları uğurla yeniləndi!');

  // 5. PUT /companies/my-company (Bank Rekvizitləri və Bildirişlər)
  console.log('\n5. PUT /companies/my-company (Bank Rekvizitləri və Bildirişlər) yoxlanılır...');
  const updateRes2 = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/v1/companies/my-company',
      method: 'PUT',
      headers: authHeaders
    },
    {
      bankName: 'Azərbaycan Beynəlxalq Bankı (ABB ASC)',
      iban: 'AZ12ABB0000000012345678901',
      bankVoen: '9900001881',
      bankCode: '805624',
      swiftBic: 'IBAZAZ2X',
      accountantName: 'Fərid Quliyev (Baş Mühasib)',
      notificationSettings: {
        emailBookings: true,
        emailPayouts: true,
        smsAlerts: true,
        marketingTips: false
      }
    }
  );

  if (updateRes2.status !== 200 || !updateRes2.data?.data?.bankVoen) {
    console.error('❌ Bank rekvizitləri yenilənməsi uğursuz oldu:', updateRes2);
    process.exit(1);
  }
  console.log('✅ Bank rekvizitləri və bildiriş tənzimləmələri uğurla yeniləndi!');

  // 6. POST /companies/my-profile/password (Yanlış şifrə testi)
  console.log('\n6. POST /companies/my-profile/password (Yanlış cari şifrə) yoxlanılır...');
  const passResFail = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/v1/companies/my-profile/password',
      method: 'POST',
      headers: authHeaders
    },
    {
      currentPassword: 'yanlisSifre123',
      newPassword: 'newPassword123!'
    }
  );

  if (passResFail.status !== 400) {
    console.error('❌ Yanlış cari şifrə testi gözlənilən 400 xətası vermədi:', passResFail);
    process.exit(1);
  }
  console.log('✅ Yanlış cari şifrə düzgün bloklandı (400 Bad Request)!');

  // 7. POST /companies/my-profile/password (Qısa şifrə testi)
  console.log('\n7. POST /companies/my-profile/password (Qısa yeni şifrə) yoxlanılır...');
  const passResShort = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/v1/companies/my-profile/password',
      method: 'POST',
      headers: authHeaders
    },
    {
      currentPassword: 'password123',
      newPassword: 'short'
    }
  );

  if (passResShort.status !== 400) {
    console.error('❌ Qısa şifrə testi 400 vermədi:', passResShort);
    process.exit(1);
  }
  console.log('✅ Qısa yeni şifrə düzgün bloklandı (400 Bad Request)!');

  // 8. POST /companies/my-profile/password (Uğurlu şifrə dəyişimi)
  console.log('\n8. POST /companies/my-profile/password (Uğurlu şifrə dəyişimi) yoxlanılır...');
  const passResSuccess = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/v1/companies/my-profile/password',
      method: 'POST',
      headers: authHeaders
    },
    {
      currentPassword: 'password123',
      newPassword: 'newSecretPass2026!'
    }
  );

  if (passResSuccess.status !== 200) {
    console.error('❌ Şifrə dəyişimi uğursuz oldu:', passResSuccess);
    process.exit(1);
  }
  console.log('✅ Şifrə uğurla dəyişdirildi!');

  // 9. Şifrəni geri ilkin vəziyyətə bərpa etmək (password123)
  console.log('\n9. Şifrənin ilkin password123 halına bərpa edilməsi...');
  const passResRevert = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/v1/companies/my-profile/password',
      method: 'POST',
      headers: authHeaders
    },
    {
      currentPassword: 'newSecretPass2026!',
      newPassword: 'password123'
    }
  );

  if (passResRevert.status !== 200) {
    console.error('❌ Şifrə bərpası uğursuz oldu:', passResRevert);
    process.exit(1);
  }
  console.log('✅ Şifrə uğurla ilkin vəziyyətinə bərpa olundu!');

  console.log('\n🎉 BÜTÜN MƏRHƏLƏ 9 BACKEND TESTLƏRİ 100% UĞURLA TAMAMLANDI!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test icrası xətası:', err);
  process.exit(1);
});
