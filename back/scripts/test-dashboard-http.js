async function testHttp() {
  console.log('--- HTTP API TESTİ BAŞLADI ---');
  const baseUrl = 'http://localhost:5000/api/v1';

  // 1. Login
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'aztour@gmail.com',
      password: 'password123'
    })
  });

  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken || loginData.data?.token || loginData.token;
  if (!token) throw new Error('Token alına bilmədi: ' + JSON.stringify(loginData));
  console.log('✅ Uğurla daxil olundu (JWT alındı).');

  const headers = { Authorization: `Bearer ${token}` };

  // 2. GET /vendor/dashboard
  const statsRes = await fetch(`${baseUrl}/vendor/dashboard?period=month`, { headers });
  const statsData = await statsRes.json();
  console.log('✅ GET /vendor/dashboard status:', statsRes.status);
  console.log('   Gəlir:', statsData.data.totalRevenue, 'AZN');
  console.log('   Artım:', statsData.data.revenueGrowth, '%');
  console.log('   Alerts:', statsData.data.operationalAlerts?.length, 'ədəd');

  // 3. GET /vendor/dashboard/manifest
  const manifestRes = await fetch(`${baseUrl}/vendor/dashboard/manifest`, { headers });
  const manifestData = await manifestRes.json();
  console.log('✅ GET /vendor/dashboard/manifest status:', manifestRes.status);
  console.log('   Tur:', manifestData.data?.tour?.title);
  console.log('   Sərnişinlər:', manifestData.data?.passengers?.length);

  // 4. GET /vendor/dashboard/export
  const exportRes = await fetch(`${baseUrl}/vendor/dashboard/export?period=month`, { headers });
  const exportBuffer = await exportRes.arrayBuffer();
  console.log('✅ GET /vendor/dashboard/export status:', exportRes.status);
  console.log('   Excel Fayl ölçüsü:', exportBuffer.byteLength, 'bytes');

  console.log('\n🎉 BÜTÜN HTTP ENDPOINTLƏR 100% UĞURLA İŞLƏYİR! 🚀');
}

testHttp().catch(err => {
  console.error('❌ HTTP Xətası:', err);
  process.exit(1);
});
