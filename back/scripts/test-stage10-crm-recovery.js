import prisma from '../config/db.js';
import crmService from '../modules/crm/crm.service.js';

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function request(url, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  return { status: res.status, ok: res.ok, data: json };
}

async function runStage10CrmTests() {
  console.log('================================================================');
  console.log('📊 MƏRHƏLƏ 10: CRM, MÜŞTƏRİ LTV & TƏRK EDİLMİŞ SİFARİŞ BƏRPASI');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [KEÇDİ] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [UĞURSUZ] ${message}`);
      throw new Error(`Test uğursuz oldu: ${message}`);
    }
  }

  try {
    // 1. SuperAdmin Girişi (Cart Recovery icazəsi üçün)
    console.log('1. Vendor / SuperAdmin Login...');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'aztour@gmail.com',
        password: 'password123'
      }
    });

    const token = loginRes.data?.data?.accessToken || loginRes.data?.accessToken;
    assert(!!token, 'Login uğurlu oldu, JWT token alındı');

    // 2. GET /crm/segment
    console.log('\n2. GET /crm/segment yoxlanılır...');
    const segmentRes = await request('/crm/segment?email=aztour@gmail.com', { method: 'GET' }, token);
    assert(segmentRes.ok, `GET /crm/segment status 200 qaytardı (Status: ${segmentRes.status})`);
    assert(segmentRes.data?.data?.segment !== undefined, `Müştəri seqmenti təyin edildi: "${segmentRes.data?.data?.segment}"`);
    console.log(`   Email: ${segmentRes.data?.data?.email}, Seqment: ${segmentRes.data?.data?.segment}`);

    // 3. GET /crm/ltv
    console.log('\n3. GET /crm/ltv (Lifetime Value) yoxlanılır...');
    const ltvRes = await request('/crm/ltv?email=aztour@gmail.com', { method: 'GET' }, token);
    assert(ltvRes.ok, `GET /crm/ltv status 200 qaytardı (Status: ${ltvRes.status})`);
    assert(ltvRes.data?.data?.totalSpent !== undefined, 'Cəmi xərclənən məbləğ hesablandı');
    assert(ltvRes.data?.data?.bookingCount !== undefined, 'Sifariş sayı hesablandı');
    console.log(`   Dövriyyə: ${ltvRes.data?.data?.totalSpent} AZN, Sifarişlər: ${ltvRes.data?.data?.bookingCount}, Orta Səbət: ${ltvRes.data?.data?.avgOrderValue} AZN`);

    // 4. Cart Recovery üçün test tərk edilmiş rezervasiya yaradırıq
    console.log('\n4. Cart Recovery (Tərk edilmiş səbət bərpası) sınağı...');
    const testTour = await prisma.tour.findFirst({ where: { status: 'Active', deletedAt: null } });
    if (testTour) {
      const abandonedBooking = await prisma.booking.create({
        data: {
          id: `TR-ABN-${Date.now()}`,
          tourId: testTour.id,
          companyId: testTour.companyId,
          passengerName: 'Elmir',
          passengerSurname: 'Zamanov',
          contactNumber: '+994507776655',
          contactEmail: 'elmir.cart.abandon@toursales.az',
          seats: 1,
          totalAmount: 45.0,
          remainingAmount: 45.0,
          paymentStatus: 'UNPAID',
          status: 'PENDING',
          createdAt: new Date(Date.now() - 40 * 60 * 1000) // 40 dəqiqə əvvəl tərk edilib
        }
      });

      const recoveryRes = await crmService.processCartRecovery();
      assert(recoveryRes.processedCount >= 1, `Ən azı 1 tərk edilmiş sifariş aşkarlandı (Tapıldı: ${recoveryRes.processedCount})`);
      const foundInSent = recoveryRes.remindersSent.some(r => r.email === 'elmir.cart.abandon@toursales.az');
      assert(foundInSent, 'Avtomatlaşdırılmış xatırlatma göndərilənlər siyahısına əlavə olundu');

      // Təmizlik
      await prisma.booking.delete({ where: { id: abandonedBooking.id } });
      console.log('   Tərk edilmiş sifariş bərpası sınağı tamamlandı və təmizləndi.');
    }

    console.log('\n================================================================');
    console.log(`🏁 MƏRHƏLƏ 10 NƏTİCƏ: Bütün ${totalTests} / ${passedTests} testlər 100% UĞURLA KEÇDİ!`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('\n❌ Mərhələ 10 Testlərində Xəta:', error.message);
    process.exit(1);
  }
}

runStage10CrmTests();
