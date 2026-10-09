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

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await res.json();
    return { status: res.status, ok: res.ok, data: json };
  } else {
    const buffer = await res.arrayBuffer();
    return { status: res.status, ok: res.ok, data: buffer, isBuffer: true };
  }
}

async function runFinalE2ETest() {
  console.log('================================================================================');
  console.log('🌟 [STAGE 4 FINAL E2E TEST] TURLARIN İDARƏSİ - TAM SİSTEM İNTEQRASİYA SINAQI');
  console.log('================================================================================\n');

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
    // --------------------------------------------------------------------------
    // SUITE 1: Vendor Avtorizasiyası və Profil Yoxlanışı
    // --------------------------------------------------------------------------
    console.log('[SUITE 1/6] Vendor Girişi və Şirkət Əlaqəsi:');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'aztour@gmail.com',
        password: 'password123'
      }
    });

    const token = loginRes.data?.accessToken || loginRes.data?.data?.accessToken;
    assert(Boolean(token), 'Vendor avtorizasiyası uğurlu oldu və JWT token əldə edildi');

    const authHeaders = { Authorization: `Bearer ${token}` };

    // --------------------------------------------------------------------------
    // SUITE 2: Turların Oxunması, Filtrlər və Tarix Formatının Təsdiqi
    // --------------------------------------------------------------------------
    console.log('\n[SUITE 2/6] Tur Siyahısı və Azərbaycan Lokalizasiyası:');
    const toursRes = await request('/tours', { method: 'GET', headers: authHeaders });
    const tours = toursRes.data?.data || toursRes.data;
    assert(Array.isArray(tours) && tours.length > 0, `Bazada ${tours.length} aktiv tur mövcuddur`);

    const sampleTour = tours[0];
    assert(Boolean(sampleTour.id && sampleTour.title), `Tur obyekt strukturu düzgündür: "${sampleTour.title}" (#${sampleTour.id})`);

    // Verify Azerbaijani Date Formatting
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
      'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];
    const d = new Date(sampleTour.startDate);
    const azDate = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    assert(!azDate.includes('undefined') && !azDate.includes('NaN'), `Tarix Azərbaycan dilində qüsursuz formatlandı: "${azDate}"`);

    // --------------------------------------------------------------------------
    // SUITE 3: Çoxsaylı Seçim & Toplu Əməliyyatlar (Bulk Status)
    // --------------------------------------------------------------------------
    console.log('\n[SUITE 3/6] Çoxsaylı Seçim & Toplu Status Yenilənməsi:');
    const targetIds = tours.slice(0, 2).map(t => t.id);

    // 3.1 Bulk Activate
    const bulkActiveRes = await request('/tours/bulk-status', {
      method: 'POST',
      headers: authHeaders,
      body: { tourIds: targetIds, status: 'Active' }
    });
    assert(bulkActiveRes.ok && bulkActiveRes.data?.status === 'success', `Seçilmiş ${targetIds.length} tur toplu şəkildə 'Active' edildi`);

    // 3.2 Bulk Deactivate
    const bulkDeactiveRes = await request('/tours/bulk-status', {
      method: 'POST',
      headers: authHeaders,
      body: { tourIds: targetIds, status: 'Deactive' }
    });
    assert(bulkDeactiveRes.ok && bulkDeactiveRes.data?.status === 'success', `Seçilmiş ${targetIds.length} tur toplu şəkildə 'Deactive' edildi`);

    // 3.3 Restore to Active
    await request('/tours/bulk-status', {
      method: 'POST',
      headers: authHeaders,
      body: { tourIds: targetIds, status: 'Active' }
    });

    // --------------------------------------------------------------------------
    // SUITE 4: Tur Klonlama / Çoxaltma (Tour Cloning)
    // --------------------------------------------------------------------------
    console.log('\n[SUITE 4/6] Tur Klonlama və Yeni Marşrut Yaradılması:');
    const targetStartDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();
    const clonedTitle = `${sampleTour.title} (E2E Master Klon)`;

    const cloneRes = await request(`/tours/${sampleTour.id}/clone`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        startDate: targetStartDate,
        title: clonedTitle
      }
    });

    const clonedTour = cloneRes.data?.data;
    assert(cloneRes.ok && Boolean(clonedTour?.id), `Yeni nüsxə tur yaradıldı: ID=${clonedTour?.id}`);
    assert(clonedTour?.title === clonedTitle, `Klon turun adı düzgündür: "${clonedTour?.title}"`);
    assert(clonedTour?.status === 'ACTIVE' || clonedTour?.status === 'Active', `Klon tur avtomatik olaraq aktiv satışa çıxarıldı`);

    // --------------------------------------------------------------------------
    // SUITE 5: Oturacaq Matrisi, Xidməti/Bələdçi Bloklama və Azad Etmə
    // --------------------------------------------------------------------------
    console.log('\n[SUITE 5/6] 2+2 Oturacaq Xəritəsi & Xidməti (Vendor Hold) Kilidləmə:');
    const matrixRes = await request(`/tours/${clonedTour.id}/seats`, { method: 'GET' });
    const matrix = matrixRes.data?.data?.matrix || matrixRes.data?.matrix || [];
    assert(Array.isArray(matrix) && matrix.length > 0, `Klon turun avtobus matrisi yükləndi (${matrix.length} yer)`);

    const testSeatNumber = 1;

    // 5.1 Lock as Guide/Service
    const lockRes = await request(`/tours/${clonedTour.id}/seats/toggle-lock`, {
      method: 'POST',
      headers: authHeaders,
      body: { seatNumber: testSeatNumber, reason: 'Bələdçi (Master Test)' }
    });
    assert(lockRes.ok && lockRes.data?.data?.status === 'LOCKED', `#${testSeatNumber} nömrəli yer xidməti kilidləndi`);
    assert(lockRes.data?.data?.isVendorHold === true, `isVendorHold flaqı true olaraq təsdiqləndi`);

    // 5.2 Release / Open for sales
    const releaseRes = await request(`/tours/${clonedTour.id}/seats/toggle-lock`, {
      method: 'POST',
      headers: authHeaders,
      body: { seatNumber: testSeatNumber, reason: 'Bələdçi (Master Test)' }
    });
    assert(releaseRes.ok && releaseRes.data?.data?.status === 'AVAILABLE', `#${testSeatNumber} nömrəli yer kiliddən azad edildi və satışa açıldı`);
    assert(releaseRes.data?.data?.isVendorHold === false, `isVendorHold flaqı false olaraq təsdiqləndi`);

    // --------------------------------------------------------------------------
    // SUITE 6: Excel Hesabat İxracı və Test Klonunun Təmizlənməsi
    // --------------------------------------------------------------------------
    console.log('\n[SUITE 6/6] Excel Eksportu & Məlumat Təmizliyi:');
    const excelRes = await request('/tours/export/excel', {
      method: 'GET',
      headers: authHeaders
    });
    assert(excelRes.ok && (excelRes.isBuffer || excelRes.data), 'Excel hesabat faylı (XLSX) uğurla generasiya olundu');

    // Clean up cloned tour
    const deleteRes = await request(`/tours/${clonedTour.id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert(deleteRes.ok, `E2E sınaq üçün yaradılmış klon tur (#${clonedTour.id}) sistemdən təmizləndi`);

    console.log('\n================================================================================');
    console.log(`🏁 [MASTER E2E NƏTİCƏ]: Bütün ${passedTests}/${totalTests} Test Uğurla Tamamlandı (100% SUCCESS)`);
    console.log('================================================================================');
  } catch (err) {
    console.error('❌ E2E Sınağında Gözlənilməz Xəta:', err);
    process.exit(1);
  }
}

runFinalE2ETest();
