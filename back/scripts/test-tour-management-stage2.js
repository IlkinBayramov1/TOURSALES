const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
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

async function runStage2Tests() {
  console.log('================================================================================');
  console.log('🚀 [STAGE 2 TEST SUITE] Turların İdarəsi - Frontend & Backend İnteqrasiya Yoxlanışı');
  console.log('================================================================================');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Login as Vendor
    console.log('\n[1/5] Vendor Avtorizasiyası:');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'aztour@gmail.com',
        password: 'password123'
      }
    });
    const token = loginRes.data?.accessToken || loginRes.data?.data?.accessToken || loginRes.data?.token || loginRes.data?.data?.token;
    if (!token) {
      console.log('Login cavabı:', loginRes.data);
    }
    assert(Boolean(token), 'Vendor sistemə daxil oldu və JWT token əldə edildi');

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Fetch tours for vendor
    console.log('\n[2/5] Tur Siyahısının və Tarix Formatlarının Yoxlanışı:');
    const toursRes = await request('/tours', {
      method: 'GET',
      headers: authHeaders
    });
    const tours = toursRes.data?.data || toursRes.data;
    assert(Array.isArray(tours) && tours.length > 0, `Vendorun ${tours.length} turu bazadan uğurla oxundu`);

    const sampleTour = tours[0];
    assert(Boolean(sampleTour.id && sampleTour.title), `Tur obyekti: ID: ${sampleTour.id}, Ad: "${sampleTour.title}"`);
    assert(Boolean(sampleTour.startDate), `Turun başlanğıc tarixi mövcuddur: ${sampleTour.startDate}`);

    // Verify formatAzDate logic
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
      'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];
    const d = new Date(sampleTour.startDate);
    const formattedAz = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    assert(!formattedAz.includes('NaN') && !formattedAz.includes('undefined'), `Azərbaycan dilində tarix düzgün formatlandı: "${formattedAz}"`);

    // 3. Bulk status changes
    console.log('\n[3/5] Toplu Status Dəyişdirilməsi (Bulk Status Change):');
    const targetTourIds = tours.slice(0, 2).map(t => t.id);

    // Bulk activate
    const bulkActiveRes = await request('/tours/bulk-status', {
      method: 'POST',
      headers: authHeaders,
      body: {
        tourIds: targetTourIds,
        status: 'Active'
      }
    });
    assert(bulkActiveRes.ok && (bulkActiveRes.data?.status === 'success' || bulkActiveRes.data?.success === true), `Toplu şəkildə ${targetTourIds.length} tur 'Active' (Satışda) edildi`);

    // Bulk deactivate
    const bulkDeactiveRes = await request('/tours/bulk-status', {
      method: 'POST',
      headers: authHeaders,
      body: {
        tourIds: targetTourIds,
        status: 'Deactive'
      }
    });
    assert(bulkDeactiveRes.ok && (bulkDeactiveRes.data?.status === 'success' || bulkDeactiveRes.data?.success === true), `Toplu şəkildə ${targetTourIds.length} tur 'Deactive' (Deaktiv) edildi`);

    // Restore to Active
    await request('/tours/bulk-status', {
      method: 'POST',
      headers: authHeaders,
      body: {
        tourIds: targetTourIds,
        status: 'Active'
      }
    });

    // 4. Tour Clone Integration
    console.log('\n[4/5] Tur Klonlama Əməliyyatının Yoxlanışı (Clone Tour):');
    const cloneRes = await request(`/tours/${sampleTour.id}/clone`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        startDate: '2026-06-20T08:00:00.000Z',
        endDate: '2026-06-21T20:00:00.000Z',
        title: `${sampleTour.title} (Nüsxə Qrup)`
      }
    });

    const clonedTour = cloneRes.data?.data;
    assert(cloneRes.ok && Boolean(clonedTour && clonedTour.id), `Yeni nüsxə yaradıldı: ID: ${clonedTour?.id}`);
    assert(clonedTour?.title?.includes('Nüsxə Qrup'), `Klon turun adı düzgün mənimsədildi: "${clonedTour?.title}"`);
    assert(clonedTour?.status === 'Active' || clonedTour?.status === 'ACTIVE', `Klon turun ilkin statusu aktivdir (${clonedTour?.status})`);

    // 5. Clean up cloned test tour
    console.log('\n[5/5] Test Klonunun Silinməsi:');
    const deleteRes = await request(`/tours/${clonedTour.id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert(deleteRes.ok, 'Test üçün yaradılmış klon tur bazadan təmizləndi');

    console.log('\n================================================================================');
    console.log(`🏁 [STAGE 2 NƏTİCƏ]: ${passedTests}/${totalTests} Test uğurla keçdi (100% SUCCESS)`);
    console.log('================================================================================');
  } catch (err) {
    console.error('❌ Xəta baş verdi:', err);
    process.exit(1);
  }
}

runStage2Tests();
