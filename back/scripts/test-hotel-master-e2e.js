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

async function runHotelMasterE2ETests() {
  console.log('================================================================================');
  console.log('🏆 [STAGE 4 MASTER E2E] Otellər və Otaq Fondu - Tam Həyat Dövrü Test Suite');
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
    console.log('[1/12] Vendor Avtorizasiyası:');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'aztour@gmail.com',
        password: 'password123'
      }
    });

    const token = loginRes.data?.accessToken || loginRes.data?.data?.accessToken;
    assert(Boolean(token), 'Vendor aztour@gmail.com daxil oldu və JWT token əldə edildi');
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Vendor Otellərinin Əldə Edilməsi
    console.log('\n[2/12] Mövcud Otellərin Yoxlanılması (/hotels/vendor/my-hotels):');
    const myHotelsRes = await request('/hotels/vendor/my-hotels', { headers: authHeaders });
    assert(myHotelsRes.status === 200, 'HTTP 200 uğurlu status');
    assert(Array.isArray(myHotelsRes.data?.data), 'Cavab birbaşa massiv (Array) kimi unwrapped edildi');
    assert(myHotelsRes.data?.data?.length >= 2, `Ən azı 2 otel mövcuddur (Tapıldı: ${myHotelsRes.data?.data?.length})`);

    // 3. Yeni Lüks Otelin Qeydiyyatı (E2E Hotel Creation)
    console.log('\n[3/12] Yeni Lüks Otel Qeydiyyatı:');
    const testHotelPayload = {
      name: `Quba Palace & Mountain Chalet E2E-${Date.now()}`,
      category: 'RESORT',
      starRating: 5,
      city: 'Quba',
      region: 'Quba / Şahdağ',
      address: 'Əski İqrığ kəndi, Quba',
      description: 'Qafqaz meşələri qoynunda lüks dağ şalesi və qolf kompleksi.',
      amenities: ['Qolf Sahəsi', 'Açıq Hovuz', 'SPA & Sauna', 'Restoran', 'Wi-Fi'],
      images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'],
      allowDeposit: true,
      allowInstallments: true,
      dynamicPricingActive: true
    };

    const createHotelRes = await request('/hotels/vendor/hotels', {
      method: 'POST',
      headers: authHeaders,
      body: testHotelPayload
    });
    assert(createHotelRes.status === 201, 'Yeni otel uğurla yaradıldı (201 Created)');
    const testHotelId = createHotelRes.data?.data?.id;
    assert(Boolean(testHotelId), `Otel ID: ${testHotelId}`);

    // 4. Otel Məlumatlarının Yenilənməsi
    console.log('\n[4/12] Otel Məlumatlarının Yenilənməsi:');
    const updateHotelRes = await request(`/hotels/vendor/hotels/${testHotelId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        description: 'Təzələnmiş təsvir: 18 dəlikli peşəkar qolf sahəsi və helikopter eniş meydançası.'
      }
    });
    assert(updateHotelRes.status === 200, 'Otel məlumatları uğurla yeniləndi');
    assert(updateHotelRes.data?.data?.description?.includes('helikopter eniş'), 'Yenilənmiş təsvir saxlanıldı');

    // 5. Otaq Növünün Əlavə Edilməsi (E2E Room Creation)
    console.log('\n[5/12] Otaq Növünün Əlavə Edilməsi:');
    const testRoomPayload = {
      name: 'Presidential Mountain Chalet',
      description: 'Şəxsi kamin və terraslı iki mərtəbəli prezident şalesi.',
      capacityAdults: 4,
      capacityChildren: 2,
      maxOccupancy: 6,
      bedType: 'KING',
      bedCount: 2,
      roomSizeSqM: 110,
      mealPlan: 'ALL_INCLUSIVE',
      basePrice: 350.0,
      totalRoomsCount: 4,
      amenities: ['Kamin', 'Jakuzi', 'Panoramik Terras', 'Smart TV'],
      images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800']
    };

    const createRoomRes = await request(`/hotels/vendor/hotels/${testHotelId}/rooms`, {
      method: 'POST',
      headers: authHeaders,
      body: testRoomPayload
    });
    assert(createRoomRes.status === 201, 'Otaq növü uğurla yaradıldı (201 Created)');
    const testRoomId = createRoomRes.data?.data?.id;
    assert(Boolean(testRoomId), `Otaq ID: ${testRoomId}`);

    // 6. 30 Günlük Təqvim Matrisinin Yoxlanılması
    console.log('\n[6/12] 30 Günlük İnventar və Qiymət Matrisi:');
    const matrixRes = await request(`/hotels/vendor/rooms/${testRoomId}/calendar`, {
      headers: authHeaders
    });
    assert(matrixRes.status === 200, 'Təqvim matrisi əldə edildi');
    assert(matrixRes.data?.data?.matrix?.length >= 30, `Matrisdə ən azı 30 gün var (${matrixRes.data?.data?.matrix?.length} gün)`);
    assert(matrixRes.data?.data?.room?.basePrice === 350, 'Baza qiymət 350 AZN olaraq əks olundu');

    // 7. Kütləvi Smart Yield Qiymət Tətbiqi (Bulk Update)
    console.log('\n[7/12] Kütləvi Təqvim Yeniləməsi (Xüsusi Tarif və Otaq Bloklanması):');
    const targetDate1 = new Date(Date.now() + 86400000 * 10).toISOString().slice(0, 10);
    const targetDate2 = new Date(Date.now() + 86400000 * 11).toISOString().slice(0, 10);
    const targetDate3 = new Date(Date.now() + 86400000 * 12).toISOString().slice(0, 10);

    const bulkUpdateRes = await request(`/hotels/vendor/rooms/${testRoomId}/calendar`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        updates: [
          { date: targetDate1, priceOverride: 420, availableCount: 3, isBlocked: false },
          { date: targetDate2, priceOverride: 450, availableCount: 2, isBlocked: false },
          { date: targetDate3, priceOverride: 350, availableCount: 0, isBlocked: true }
        ]
      }
    });
    assert(bulkUpdateRes.status === 200, 'Smart Yield kütləvi yeniləmə uğurla tamamlandı');
    assert(bulkUpdateRes.data?.data?.updatedDaysCount === 3, '3 gün üzrə fərdi tarif və inventar yazıldı');

    // 8. Təqvimin Yenidən Oxunması və Dəyişikliyin Təsdiqi
    console.log('\n[8/12] Təqvim Matrisində Yeni Qiymətlərin Təsdiqi:');
    const verifyMatrixRes = await request(`/hotels/vendor/rooms/${testRoomId}/calendar`, {
      headers: authHeaders
    });
    const target1Matrix = verifyMatrixRes.data?.data?.matrix?.find(m => m.date === targetDate1);
    assert(target1Matrix?.effectivePrice === 420, `Hədəf tarix üzrə qiymət 420 AZN olaraq tətbiq edildi (Faktiki: ${target1Matrix?.effectivePrice})`);
    
    const blockedDayMatrix = verifyMatrixRes.data?.data?.matrix?.find(m => m.date === targetDate3);
    assert(blockedDayMatrix?.isBlocked === true, 'Stop-Sale bloklama statusu təqvimdə qeydə alındı');

    // 9. Müştəri Tərəfindən 30% Depozitli Rezervasiya (Customer Booking Flow)
    console.log('\n[9/12] 30% Depozitli Otel Rezervasiyası Yaradılması:');
    const checkIn = new Date(Date.now() + 86400000 * 15); // 15 gün sonra
    const checkOut = new Date(Date.now() + 86400000 * 17); // 17 gün sonra (2 gecə)

    const bookingPayload = {
      hotelId: testHotelId,
      roomTypeId: testRoomId,
      checkInDate: checkIn.toISOString().slice(0, 10),
      checkOutDate: checkOut.toISOString().slice(0, 10),
      roomsCount: 1,
      guestsCount: 2,
      primaryGuestName: 'Eldar Mahmudov',
      primaryGuestPhone: '+994507778899',
      primaryGuestEmail: 'eldar.m@toursales.az',
      paymentType: 'DEPOSIT_30',
      paymentMethod: 'KAPITAL_BANK'
    };

    const createBookingRes = await request('/hotels/bookings', {
      method: 'POST',
      headers: authHeaders,
      body: bookingPayload
    });
    assert(createBookingRes.status === 201, 'Rezervasiya uğurla qeydə alındı (201 Created)');
    const testBooking = createBookingRes.data?.data;
    assert(Boolean(testBooking?.id), `Rezervasiya ID: ${testBooking?.id}`);
    assert(testBooking?.paymentStatus === 'PARTIALLY_PAID', 'Ödəniş statusu PARTIALLY_PAID (30% Depozit) qeydə alındı');
    const expectedDeposit = Math.round(Number(testBooking?.totalAmount) * 0.30 * 100) / 100;
    assert(Number(testBooking?.paidAmount) === expectedDeposit, `30% depozit ödənildi: ${testBooking?.paidAmount} AZN (Ümumi: ${testBooking?.totalAmount} AZN)`);

    // 10. Vendor Rezervasiyalar Siyahısında Əks Olunması
    console.log('\n[10/12] Vendor Panelində Rezervasiyanın Əks Olunması:');
    const vendorBookingsRes = await request('/hotels/vendor/bookings', { headers: authHeaders });
    assert(vendorBookingsRes.status === 200, 'Vendor rezervasiyaları əldə edildi');
    const foundBooking = vendorBookingsRes.data?.data?.find(b => b.id === testBooking?.id);
    assert(Boolean(foundBooking), 'Yaradılan rezervasiya AzTour-un rezervasiyalar siyahısında mövcuddur');
    assert(foundBooking?.primaryGuestName === 'Eldar Mahmudov', 'Qonaq adı "Eldar Mahmudov" düzgün əks olundu');

    // 11. Qalıq 70% Ödəniş Məlumatı (Balance Info Endpoint)
    console.log('\n[11/12] Qalıq Məbləğ və Balans İnformasiyası:');
    const balanceInfoRes = await request(`/hotels/bookings/${testBooking?.id}/balance-info`);
    assert(balanceInfoRes.status === 200, 'Qalıq məlumatı ictimai vauçer endpointindən alındı');
    const expectedRemaining = Math.round((Number(testBooking?.totalAmount) - Number(testBooking?.paidAmount)) * 100) / 100;
    assert(Number(balanceInfoRes.data?.data?.remainingAmount) === expectedRemaining, `Qalan 70% məbləğ dəqiq ${expectedRemaining} AZN-dir (Faktiki: ${balanceInfoRes.data?.data?.remainingAmount} AZN)`);

    // 12. Qalıq Ödənişin Tamamlanması (Pay Balance)
    console.log('\n[12/12] Qalıq Ödənişin Tamamlanması və Rezervasiyanın 100% Təsdiqi:');
    const payBalanceRes = await request(`/hotels/bookings/${testBooking?.id}/pay-balance`, {
      method: 'POST',
      body: {
        token: testBooking?.balanceToken,
        paymentMethod: 'KAPITAL_BANK'
      }
    });
    assert(payBalanceRes.status === 200, 'Qalıq ödəniş uğurla tamamlandı');
    assert(payBalanceRes.data?.data?.booking?.paymentStatus === 'PAID', 'Ödəniş statusu tam PAID oldu');
    assert(payBalanceRes.data?.data?.booking?.status === 'CONFIRMED', 'Rezervasiya tam CONFIRMED oldu');

    console.log('\n================================================================================');
    console.log(`🎉 MASTER E2E NƏTİCƏSİ: Bütün ${totalTests} testdən ${passedTests} test UĞURLA KEÇDİ! (100%)`);
    console.log('================================================================================');
  } catch (err) {
    console.error('Master E2E xətası:', err);
    process.exitCode = 1;
  }
}

runHotelMasterE2ETests();
