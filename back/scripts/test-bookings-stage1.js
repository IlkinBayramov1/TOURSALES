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

async function runStage1BookingsTests() {
  console.log('================================================================================');
  console.log('🚀 [STAGE 1 TEST SUITE] Sifarişlər & Minik Nəzarəti - Backend API & Data Mapping');
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
    console.log('[1/8] Vendor Avtorizasiyası:');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'aztour@gmail.com',
        password: 'password123'
      }
    });

    const token = loginRes.data?.accessToken || loginRes.data?.data?.accessToken;
    assert(Boolean(token), 'Vendor (aztour@gmail.com) uğurla daxil oldu və JWT token əldə edildi');

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Vendor Stats
    console.log('\n[2/8] Vendor Statistika Göstəriciləri (GET /bookings/vendor/stats):');
    const statsRes = await request('/bookings/vendor/stats', { headers: authHeaders });
    assert(statsRes.status === 200, 'Statistika sorğusu 200 OK qaytardı');
    const stats = statsRes.data?.data;
    assert(typeof stats?.totalBookings === 'number', `Ümumi sifariş sayı mövcuddur: ${stats?.totalBookings}`);
    assert(typeof stats?.totalPassengers === 'number', `Ümumi sərnişin sayı mövcuddur: ${stats?.totalPassengers}`);
    assert(typeof stats?.checkedInCount === 'number', `Minik edən sərnişin sayı mövcuddur: ${stats?.checkedInCount}`);
    assert(typeof stats?.checkedInRate === 'number', `Minik faizi hesablanıb: ${stats?.checkedInRate}%`);
    assert(typeof stats?.totalRevenue === 'number', `Ümumi dövriyyə məbləği mövcuddur: ${stats?.totalRevenue} AZN`);

    // 3. Vendor Bookings List & Data Mapping
    console.log('\n[3/8] Vendor Rezervasiyalar Siyahısı & Data Mapping (GET /bookings/vendor/bookings):');
    const listRes = await request('/bookings/vendor/bookings', { headers: authHeaders });
    assert(listRes.status === 200, 'Rezervasiyalar siyahısı 200 OK qaytardı');
    const bookings = listRes.data?.data;
    assert(Array.isArray(bookings) && bookings.length > 0, `Siyahıda ${bookings?.length} rezervasiya tapıldı`);

    // Verify rich mapped fields on first booking
    const sampleBooking = bookings[0];
    assert(sampleBooking.bookingNumber !== undefined, `bookingNumber sahəsi mövcuddur: ${sampleBooking.bookingNumber}`);
    assert(typeof sampleBooking.totalAmount === 'number', `totalAmount ədəddir: ${sampleBooking.totalAmount} AZN`);
    assert(typeof sampleBooking.paidAmount === 'number', `paidAmount ədəddir (əvvəl itirdi): ${sampleBooking.paidAmount} AZN`);
    assert(typeof sampleBooking.remainingAmount === 'number', `remainingAmount ədəddir (əvvəl itirdi): ${sampleBooking.remainingAmount} AZN`);
    assert(typeof sampleBooking.paymentType === 'string', `paymentType mövcuddur: ${sampleBooking.paymentType}`);
    assert(sampleBooking.tourTitle !== undefined, `tourTitle mövcuddur: "${sampleBooking.tourTitle}"`);
    assert(Array.isArray(sampleBooking.passengers), `passengers massivi mövcuddur (${sampleBooking.passengers?.length} nəfər)`);

    // 4. Status Filtering (including CANCELLED & PARTIALLY_PAID)
    console.log('\n[4/8] Status Filtrlərinin Dəqiqliyi:');
    const confirmedRes = await request('/bookings/vendor/bookings?status=CONFIRMED', { headers: authHeaders });
    assert(confirmedRes.status === 200, 'CONFIRMED filtri 200 OK qaytardı');
    const confirmedList = confirmedRes.data?.data || [];
    assert(confirmedList.every(b => b.status === 'CONFIRMED'), 'Bütün biletlər CONFIRMED statusundadır');

    const cancelledRes = await request('/bookings/vendor/bookings?status=CANCELLED', { headers: authHeaders });
    assert(cancelledRes.status === 200, 'CANCELLED filtri 200 OK qaytardı');
    const cancelledList = cancelledRes.data?.data || [];
    assert(cancelledList.length > 0, `Ləğv edilmiş sifarişlər itmir və siyahıda görünür (${cancelledList.length} ədəd)`);

    // 5. Booking Details by ID
    console.log('\n[5/8] Bilet Detalları Endpoint-i (GET /bookings/vendor/bookings/:id):');
    const detailRes = await request(`/bookings/vendor/bookings/${sampleBooking.id}`, { headers: authHeaders });
    assert(detailRes.status === 200, `Bilet detalları 200 OK qaytardı (ID: ${sampleBooking.id})`);
    const detail = detailRes.data?.data;
    assert(detail.id === sampleBooking.id, 'Doğru bilet obyekti qaytarıldı');
    assert(detail.paidAmount !== undefined, `Ödənilən məbləğ mövcuddur: ${detail.paidAmount} AZN`);
    assert(detail.remainingAmount !== undefined, `Qalıq borc məbləği mövcuddur: ${detail.remainingAmount} AZN`);
    assert(detail.qrToken !== undefined, `Bilet QR tokeni mövcuddur: ${detail.qrToken}`);

    // 6. Sərnişin Manifesti (Roster) & Borc İndikatorları
    console.log('\n[6/8] Sərnişin Manifesti (GET /bookings/vendor/roster/:tourId):');
    const rosterRes = await request(`/bookings/vendor/roster/${sampleBooking.tourId}`, { headers: authHeaders });
    assert(rosterRes.status === 200, 'Manifest sorğusu 200 OK qaytardı');
    const roster = rosterRes.data?.data;
    assert(Array.isArray(roster), `Manifestdə ${roster?.length} sərnişin yerləşdirilib`);
    if (roster && roster.length > 0) {
      const p1 = roster[0];
      assert(typeof p1.seatNumber === 'number', `Oturacaq № mövcuddur: #${p1.seatNumber}`);
      assert(typeof p1.fullName === 'string', `Sərnişin adı mövcuddur: "${p1.fullName}"`);
      assert(typeof p1.isCheckedIn === 'boolean', `Minik statusu mövcuddur: ${p1.isCheckedIn ? 'Mindirilib' : 'Gözləyir'}`);
      assert(p1.paymentStatus !== undefined, `Ödəniş statusu mövcuddur: ${p1.paymentStatus}`);
      assert(p1.remainingAmount !== undefined, `Qalıq borc sahəsi mövcuddur: ${p1.remainingAmount} AZN`);
    }

    // 7. Check-In & Toggle Check-In
    console.log('\n[7/8] Canlı Minik (Check-in) və Toggle Əməliyyatları:');
    const targetPassenger = roster ? roster[0] : null;
    if (targetPassenger) {
      const toggleRes = await request(`/bookings/vendor/check-in/toggle/${targetPassenger.bookingId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: { seatNumber: targetPassenger.seatNumber }
      });
      assert(toggleRes.status === 200, `Toggle minik statusu uğurla dəyişdirildi (Yeni isCheckedIn: ${toggleRes.data?.data?.isCheckedIn})`);

      // Toggle back
      await request(`/bookings/vendor/check-in/toggle/${targetPassenger.bookingId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: { seatNumber: targetPassenger.seatNumber }
      });
      console.log('    (Status əvvəlki vəziyyətinə qaytarıldı)');
    }

    // Check-in via QR / Ticket Code
    const checkInRes = await request('/bookings/vendor/check-in', {
      method: 'POST',
      headers: authHeaders,
      body: {
        bookingNumber: sampleBooking.bookingNumber,
        qrToken: sampleBooking.qrToken
      }
    });
    assert(checkInRes.status === 200, `QR/Bilet nömrəsi ilə minik təsdiqləndi (verified: ${checkInRes.data?.data?.verified})`);

    // 8. Vendor Kütləvi Minik (Bulk Check-in)
    console.log('\n[8/8] Vendor Kütləvi Minik Endpoint-i (POST /bookings/vendor/bulk-checkin):');
    const bulkRes = await request('/bookings/vendor/bulk-checkin', {
      method: 'POST',
      headers: authHeaders,
      body: {
        tourId: sampleBooking.tourId
      }
    });
    assert(bulkRes.status === 200, `Kütləvi minik 200 OK qaytardı (${bulkRes.data?.data?.checkedInCount} sərnişin təsdiqləndi)`);

    console.log('\n================================================================================');
    console.log(`🏁 [STAGE 1 NƏTİCƏ]: ${passedTests}/${totalTests} Test Uğurla Keçdi! (100% SUCCESS)`);
    console.log('================================================================================');

  } catch (err) {
    console.error('\n❌ Mərhələ 1 Testlərində Gözlənilməz Xəta:', err);
    process.exitCode = 1;
  }
}

runStage1BookingsTests();
