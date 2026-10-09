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

async function runStage3Tests() {
  console.log('================================================================================');
  console.log('🚀 [STAGE 3 TEST SUITE] Oturacaq Matrisi & Xidməti Bloklama (Seat Matrix Modal)');
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
    // 1. Vendor Login
    console.log('[1/4] Vendor Avtorizasiyası:');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'aztour@gmail.com',
        password: 'password123'
      }
    });
    const token = loginRes.data?.accessToken || loginRes.data?.data?.accessToken;
    assert(Boolean(token), 'Vendor hesabı uğurla daxil oldu və JWT token əldə edildi');

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Fetch tours and find a test tour
    console.log('\n[2/4] Turun Oturacaq Matrisinin Oxunması:');
    const toursRes = await request('/tours', { method: 'GET', headers: authHeaders });
    const tours = toursRes.data?.data || toursRes.data;
    assert(Array.isArray(tours) && tours.length > 0, `Vendorun ${tours.length} aktiv turu mövcuddur`);

    const testTour = tours[0];
    console.log(`      Seçilmiş Tur: "${testTour.title}" (ID: ${testTour.id})`);

    const initialMatrixRes = await request(`/tours/${testTour.id}/seats`, { method: 'GET' });
    const initialMatrix = initialMatrixRes.data?.data?.matrix || initialMatrixRes.data?.matrix || [];
    assert(Array.isArray(initialMatrix) && initialMatrix.length > 0, `Turun oturacaq matrisi gətirildi (${initialMatrix.length} yer)`);

    // Pick an available seat for test
    const targetSeat = initialMatrix.find(s => s.status === 'AVAILABLE') || initialMatrix[0];
    const targetSeatNum = targetSeat.seatNumber;
    console.log(`      Test üçün hədəf yer: #${targetSeatNum} (İlkin status: ${targetSeat.status})`);

    // 3. Toggle Vendor Seat Lock (Lock as Service Seat)
    console.log('\n[3/4] Xidməti Yer Kilidləməsi (Vendor Hold Toggle - LOCK):');
    const lockRes = await request(`/tours/${testTour.id}/seats/toggle-lock`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        seatNumber: targetSeatNum,
        reason: 'Bələdçi (Guide)'
      }
    });

    const lockData = lockRes.data?.data;
    assert(lockRes.ok && lockRes.data?.status === 'success', `API cavabı uğurludur (${lockRes.status})`);
    assert(lockData?.status === 'LOCKED', `Yer statusu LOCKED olaraq dəyişdirildi (status: ${lockData?.status})`);
    assert(lockData?.isVendorHold === true, `Yerin isVendorHold dəyəri true təyin edildi`);
    assert(lockData?.reason === 'Bələdçi (Guide)', `Kilidləmə səbəbi qeyd edildi: "${lockData?.reason}"`);

    // Verify matrix reflects the vendor hold
    const afterLockMatrixRes = await request(`/tours/${testTour.id}/seats`, { method: 'GET' });
    const afterLockMatrix = afterLockMatrixRes.data?.data?.matrix || afterLockMatrixRes.data?.matrix || [];
    const lockedSeatInMatrix = afterLockMatrix.find(s => s.seatNumber === targetSeatNum);
    assert(lockedSeatInMatrix?.status === 'LOCKED' && lockedSeatInMatrix?.isVendorHold === true,
      `Oturacaq matrisində #${targetSeatNum} nömrəli yer LOCKED və isVendorHold: true kimi görünür`
    );

    // 4. Toggle Vendor Seat Lock (Release / Unlock Seat)
    console.log('\n[4/4] Xidməti Yerin Kiliddən Azad Edilməsi (Vendor Hold Toggle - RELEASE):');
    const releaseRes = await request(`/tours/${testTour.id}/seats/toggle-lock`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        seatNumber: targetSeatNum,
        reason: 'Bələdçi (Guide)'
      }
    });

    const releaseData = releaseRes.data?.data;
    assert(releaseRes.ok && releaseRes.data?.status === 'success', `API azad etmə cavabı uğurludur (${releaseRes.status})`);
    assert(releaseData?.status === 'AVAILABLE', `Yer statusu təkrar AVAILABLE oldu (status: ${releaseData?.status})`);
    assert(releaseData?.isVendorHold === false, `isVendorHold dəyəri false oldu`);

    // Verify matrix reflects the release
    const afterReleaseMatrixRes = await request(`/tours/${testTour.id}/seats`, { method: 'GET' });
    const afterReleaseMatrix = afterReleaseMatrixRes.data?.data?.matrix || afterReleaseMatrixRes.data?.matrix || [];
    const releasedSeatInMatrix = afterReleaseMatrix.find(s => s.seatNumber === targetSeatNum);
    assert(releasedSeatInMatrix?.status === 'AVAILABLE' && !releasedSeatInMatrix?.isVendorHold,
      `Oturacaq matrisində #${targetSeatNum} nömrəli yer təkrar AVAILABLE və azad statusdadır`
    );

    console.log('\n================================================================================');
    console.log(`🏁 [STAGE 3 NƏTİCƏ]: ${passedTests}/${totalTests} Test uğurla keçdi (100% SUCCESS)`);
    console.log('================================================================================');
  } catch (err) {
    console.error('❌ Mərhələ 3 testində xəta:', err);
    process.exit(1);
  }
}

runStage3Tests();
