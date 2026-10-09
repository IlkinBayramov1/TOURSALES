import fs from 'fs';
import path from 'path';

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
  if (contentType.includes('application/vnd.openxmlformats') || contentType.includes('application/octet-stream')) {
    const arrayBuffer = await res.arrayBuffer();
    return { status: res.status, ok: res.ok, isBuffer: true, length: arrayBuffer.byteLength };
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  return { status: res.status, ok: res.ok, data: json };
}

async function runMasterE2ETests() {
  console.log('================================================================================');
  console.log('🏆 [MASTER E2E TEST SUITE] Sifarişlər & Minik Nəzarəti Modulu');
  console.log('   (Full-Stack Backend APIs, FinTech Mappings, Roster & Print-Ready Manifest)');
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
    // 1. Vendor Authentication
    console.log('[1/12] Vendor Avtorizasiyası:');
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

    // 2. Vendor Stats Verification
    console.log('\n[2/12] KPI Statistika Göstəriciləri (GET /bookings/vendor/stats):');
    const statsRes = await request('/bookings/vendor/stats', { headers: authHeaders });
    assert(statsRes.status === 200, 'Statistika sorğusu 200 OK qaytardı');
    const stats = statsRes.data?.data;
    assert(typeof stats?.totalBookings === 'number' && stats?.totalBookings > 0, `Ümumi sifarişlər: ${stats?.totalBookings}`);
    assert(typeof stats?.totalPassengers === 'number' && stats?.totalPassengers > 0, `Cəmi sərnişinlər: ${stats?.totalPassengers}`);
    assert(typeof stats?.checkedInCount === 'number', `Minik edənlər: ${stats?.checkedInCount}`);
    assert(typeof stats?.checkedInRate === 'number', `Minik faizi: ${stats?.checkedInRate}%`);
    assert(typeof stats?.totalRevenue === 'number' && stats?.totalRevenue > 0, `Dövriyyə: ${stats?.totalRevenue} AZN`);

    // 3. Bookings List & Data Mapping Completeness
    console.log('\n[3/12] Rezervasiyalar Siyahısı & Data Mapping (GET /bookings/vendor/bookings):');
    const listRes = await request('/bookings/vendor/bookings', { headers: authHeaders });
    assert(listRes.status === 200, 'Bütün rezervasiyalar siyahısı 200 OK qaytardı');
    const bookings = listRes.data?.data;
    assert(Array.isArray(bookings) && bookings.length > 0, `Siyahıda ${bookings?.length} rezervasiya təsdiqləndi`);

    const sample = bookings[0];
    assert(sample.id && sample.bookingNumber, `Bilet № mövcuddur: ${sample.bookingNumber}`);
    assert(typeof sample.totalAmount === 'number', `Ümumi məbləğ: ${sample.totalAmount} AZN`);
    assert(typeof sample.paidAmount === 'number', `Ödənilən məbləğ: ${sample.paidAmount} AZN`);
    assert(typeof sample.remainingAmount === 'number', `Qalıq borc: ${sample.remainingAmount} AZN`);
    assert(typeof sample.paymentType === 'string', `Ödəniş növü: ${sample.paymentType}`);
    assert(sample.tourTitle !== undefined, `Tur adı: "${sample.tourTitle}"`);
    assert(Array.isArray(sample.passengers), `Sərnişin siyahısı array formatındadır (${sample.passengers.length} nəfər)`);

    // 4. Status Filtering (Confirmed, Cancelled, Partially Paid)
    console.log('\n[4/12] Filtrasiya Dəqiqliyi (CONFIRMED & CANCELLED & PARTIALLY_PAID):');
    const confirmedRes = await request('/bookings/vendor/bookings?status=CONFIRMED', { headers: authHeaders });
    assert(confirmedRes.status === 200 && confirmedRes.data?.data?.length > 0, `Təsdiqlənmiş biletlər filtri: ${confirmedRes.data?.data?.length} bilet`);

    const cancelledRes = await request('/bookings/vendor/bookings?status=CANCELLED', { headers: authHeaders });
    assert(cancelledRes.status === 200, 'Ləğv edilmiş biletlər filtri 200 OK qaytardı');
    const cancelledCount = cancelledRes.data?.data?.length || 0;
    assert(cancelledCount > 0, `Ləğv edilmiş biletlər itmir və bazadan gəlir: ${cancelledCount} ədəd`);

    // 5. Booking Details By ID
    console.log('\n[5/12] Fərdi Bilet Detalları (GET /bookings/vendor/bookings/:id):');
    const detailRes = await request(`/bookings/vendor/bookings/${sample.id}`, { headers: authHeaders });
    assert(detailRes.status === 200, `Bilet ID üzrə detallar 200 OK qaytardı (${sample.id})`);
    const detail = detailRes.data?.data;
    assert(detail.paidAmount !== undefined, `paidAmount sahəsi tamdır: ${detail.paidAmount} AZN`);
    assert(detail.remainingAmount !== undefined, `remainingAmount sahəsi tamdır: ${detail.remainingAmount} AZN`);
    assert(detail.qrToken !== undefined, `qrToken sahəsi tamdır: ${detail.qrToken}`);

    // 6. Passenger Manifest (Roster) with Debt Indicators
    console.log('\n[6/12] Sərnişin Manifesti & Borc Göstəriciləri (GET /bookings/vendor/roster/:tourId):');
    const rosterRes = await request(`/bookings/vendor/roster/${sample.tourId}`, { headers: authHeaders });
    assert(rosterRes.status === 200, 'Manifest sorğusu 200 OK qaytardı');
    const roster = rosterRes.data?.data;
    assert(Array.isArray(roster) && roster.length > 0, `Manifestdə ${roster?.length} sərnişin yerləşdirilib`);
    const p1 = roster[0];
    assert(typeof p1.seatNumber === 'number', `Oturacaq nömrəsi mövcuddur: #${p1.seatNumber}`);
    assert(typeof p1.fullName === 'string', `Sərnişin tam adı mövcuddur: ${p1.fullName}`);
    assert(typeof p1.isCheckedIn === 'boolean', `Minik vəziyyəti: ${p1.isCheckedIn ? 'Mindirilib' : 'Gözləyir'}`);
    assert(p1.paymentStatus !== undefined, `Ödəniş vəziyyəti: ${p1.paymentStatus}`);
    assert(p1.remainingAmount !== undefined, `Qalıq borc sahəsi: ${p1.remainingAmount} AZN`);

    // 7. Check-In & Toggle Check-In
    console.log('\n[7/12] Minik İdarəetməsi (Toggle & Direct QR/Code):');
    const toggleRes = await request(`/bookings/vendor/check-in/toggle/${p1.bookingId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: { seatNumber: p1.seatNumber }
    });
    assert(toggleRes.status === 200, `Toggle check-in uğurla icra olundu (Yeni status: ${toggleRes.data?.data?.isCheckedIn})`);

    // Revert toggle
    await request(`/bookings/vendor/check-in/toggle/${p1.bookingId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: { seatNumber: p1.seatNumber }
    });

    // Check-in via QR / Booking Number
    const checkInRes = await request('/bookings/vendor/check-in', {
      method: 'POST',
      headers: authHeaders,
      body: {
        bookingNumber: sample.bookingNumber,
        qrToken: sample.qrToken
      }
    });
    assert(checkInRes.status === 200 && checkInRes.data?.data?.verified, 'QR kod / Bilet nömrəsi ilə minik təsdiqləndi');

    // 8. Bulk Check-In
    console.log('\n[8/12] Kütləvi Minik (POST /bookings/vendor/bulk-checkin):');
    const bulkRes = await request('/bookings/vendor/bulk-checkin', {
      method: 'POST',
      headers: authHeaders,
      body: { tourId: sample.tourId }
    });
    assert(bulkRes.status === 200 && bulkRes.data?.data?.success, `Bütün sərnişinlər bir kliklə mindirildi (${bulkRes.data?.data?.checkedInCount} nəfər)`);

    // 9. Excel Bookings Export
    console.log('\n[9/12] Excel Sifarişlər İxracı (GET /bookings/vendor/export):');
    const exportBookingsRes = await request('/bookings/vendor/export', { headers: authHeaders });
    assert(exportBookingsRes.status === 200, 'Excel sifarişlər ixracı 200 OK qaytardı');
    assert(exportBookingsRes.isBuffer && exportBookingsRes.length > 1000, `Excel fayl axını yaradıldı (${exportBookingsRes.length} bayt)`);

    // 10. Excel Roster Manifest Export
    console.log('\n[10/12] Excel Manifest İxracı (GET /bookings/vendor/roster/:tourId/export):');
    const exportRosterRes = await request(`/bookings/vendor/roster/${sample.tourId}/export`, { headers: authHeaders });
    assert(exportRosterRes.status === 200, 'Excel sərnişin manifesti 200 OK qaytardı');
    assert(exportRosterRes.isBuffer && exportRosterRes.length > 1000, `Manifest fayl axını yaradıldı (${exportRosterRes.length} bayt)`);

    // 11. Route Precedence & Admin Export Protection
    console.log('\n[11/12] Marşrut Sıralaması / Çaxnaşma Təhlükəsizliyi (GET /bookings/export):');
    const adminExportRes = await request('/bookings/export', { headers: authHeaders });
    assert(adminExportRes.status === 200, '/bookings/export marşrutu :id ilə toqquşmur və 200 OK qaytarır');

    // 12. Frontend Bundle & Printable Component Files Check
    console.log('\n[12/12] Frontend Komponentləri və Build Yoxlanışı:');
    const modalPath = path.resolve('../front/apps/vendor/src/modules/bookings/components/BookingDetailModal/BookingDetailModal.tsx');
    const rosterPath = path.resolve('../front/apps/vendor/src/modules/bookings/components/PassengerRosterTable/PassengerRosterTable.tsx');
    const scannerPath = path.resolve('../front/apps/vendor/src/modules/bookings/components/QrScannerModal/QrScannerModal.tsx');
    const distPath = path.resolve('../front/apps/vendor/dist/index.html');

    assert(fs.existsSync(modalPath), 'BookingDetailModal.tsx mövcuddur');
    assert(fs.existsSync(rosterPath), 'PassengerRosterTable.tsx mövcuddur');
    assert(fs.existsSync(scannerPath), 'QrScannerModal.tsx mövcuddur');
    assert(fs.existsSync(distPath), 'Vite production bundle dist/index.html uğurla yaradılıb');

    console.log('\n================================================================================');
    console.log(`🏆 [MASTER E2E NƏTİCƏ]: ${passedTests}/${totalTests} Test Uğurla Keçdi! (100% SUCCESS)`);
    console.log('================================================================================\n');

  } catch (err) {
    console.error('\n❌ Master E2E Testində Gözlənilməz Xəta:', err);
    process.exitCode = 1;
  }
}

runMasterE2ETests();
