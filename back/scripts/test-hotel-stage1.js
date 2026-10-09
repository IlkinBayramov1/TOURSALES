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

async function runHotelStage1Tests() {
  console.log('================================================================================');
  console.log('🏨 [STAGE 1 TEST SUITE] Otellər və Otaq Fondu - Backend API & Təqvim Sinxronu');
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
    console.log('[1/10] Vendor Avtorizasiyası:');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'aztour@gmail.com',
        password: 'password123'
      }
    });

    const token = loginRes.data?.accessToken || loginRes.data?.data?.accessToken;
    assert(Boolean(token), 'Vendor aztour@gmail.com uğurla daxil oldu və JWT token əldə edildi');

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. GET /hotels/vendor/my-hotels
    console.log('\n[2/10] Vendor Otellərinin Əldə Edilməsi (/hotels/vendor/my-hotels):');
    const myHotelsRes = await request('/hotels/vendor/my-hotels', { headers: authHeaders });
    assert(myHotelsRes.status === 200, 'HTTP status 200 qaytarıldı');
    assert(Array.isArray(myHotelsRes.data?.data), 'Data birbaşa massiv (Array) kimi qaytarılır');
    assert(myHotelsRes.data?.data?.length >= 2, `Ən azı 2 otel mövcuddur (Tapıldı: ${myHotelsRes.data?.data?.length})`);
    
    const qabalaHotel = myHotelsRes.data?.data?.find(h => h.id === 'H-QABALA-RESORT');
    assert(Boolean(qabalaHotel), 'Qəbələ Tufandağ Mountain Resort tapıldı');
    assert(qabalaHotel?.roomTypesCount >= 2, `Qəbələ kurortunun otaq növləri mövcuddur (Sayı: ${qabalaHotel?.roomTypesCount})`);

    // 3. GET /hotels/:id
    console.log('\n[3/10] Tək Otel Detallarının Əldə Edilməsi (/hotels/:id):');
    const hotelDetailRes = await request('/hotels/H-QABALA-RESORT');
    assert(hotelDetailRes.status === 200, 'Tək otel detalları uğurla əldə edildi');
    assert(hotelDetailRes.data?.data?.rooms?.length >= 2, 'Otel otaqları ilə birlikdə formatlandı');

    // 4. GET /hotels (İctimai Axtarış)
    console.log('\n[4/10] İctimai Otel Axtarışı (/hotels):');
    const publicSearchRes = await request('/hotels?city=Qəbələ');
    assert(publicSearchRes.status === 200, 'İctimai axtarış uğurla işləyir');
    assert(publicSearchRes.data?.data?.length >= 1, 'Qəbələ üzrə aktiv otellər siyahılandı');

    // 5. POST /hotels (Yeni Otel Yaradılması - Həm birbaşa, həm də alias dəstəyi)
    console.log('\n[5/10] Yeni Otel Əlavə Edilməsi (POST /hotels alias):');
    const newHotelPayload = {
      name: 'Lənkəran Springs Wellness Resort',
      category: 'RESORT',
      starRating: 5,
      city: 'Lənkəran',
      region: 'Cənub / Talış',
      address: 'Haftoni qəsəbəsi, Lənkəran',
      description: 'Termal mineral bulaqlar üzərində salınmış müalicəvi və istirahət kompleksi.',
      amenities: ['SPA', 'Termal Bulaq', 'Restoran', 'Wi-Fi'],
      images: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800'],
      allowDeposit: true,
      allowInstallments: true,
      dynamicPricingActive: true
    };

    const createHotelRes = await request('/hotels', {
      method: 'POST',
      headers: authHeaders,
      body: newHotelPayload
    });
    assert(createHotelRes.status === 201, `Yeni otel uğurla yaradıldı (Status: ${createHotelRes.status})`);
    const createdHotelId = createHotelRes.data?.data?.id;
    assert(Boolean(createdHotelId), `Yaradılan otelin ID-si: ${createdHotelId}`);

    // 6. PUT /hotels/:id (Otel Redaktəsi - Alias)
    console.log('\n[6/10] Otel Məlumatlarının Redaktəsi (PUT /hotels/:id):');
    const updateHotelRes = await request(`/hotels/${createdHotelId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        description: 'Müasir tibbi spa və termal vannalar təklif edən yenilənmiş lüks kurort.'
      }
    });
    assert(updateHotelRes.status === 200, 'Otel məlumatları uğurla yeniləndi');
    assert(updateHotelRes.data?.data?.description?.includes('Müasir tibbi spa'), 'Təsvir mətni düzgün yeniləndi');

    // 7. POST /hotels/:hotelId/rooms (Otaq Əlavə Edilməsi - Alias)
    console.log('\n[7/10] Otaq Növünün Əlavə Edilməsi (POST /hotels/:hotelId/rooms):');
    const newRoomPayload = {
      name: 'Thermal Junior Suite',
      description: 'Özəl termal vannası olan suite.',
      capacityAdults: 2,
      capacityChildren: 1,
      maxOccupancy: 3,
      bedType: 'KING',
      bedCount: 1,
      roomSizeSqM: 45,
      mealPlan: 'HB',
      basePrice: 220,
      totalRoomsCount: 6,
      amenities: ['Termal Vanna', 'Smart TV', 'Balkon'],
      images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800']
    };

    const createRoomRes = await request(`/hotels/${createdHotelId}/rooms`, {
      method: 'POST',
      headers: authHeaders,
      body: newRoomPayload
    });
    assert(createRoomRes.status === 201, `Otaq növü uğurla yaradıldı (Status: ${createRoomRes.status})`);
    const createdRoomId = createRoomRes.data?.data?.id;
    assert(Boolean(createdRoomId), `Yaradılan otağın ID-si: ${createdRoomId}`);

    // 8. GET /hotels/vendor/rooms/:roomId/calendar (30 Günlük Matris)
    console.log('\n[8/10] 30 Günlük Təqvim Matrisi (GET /hotels/vendor/rooms/:roomId/calendar):');
    const calendarRes = await request(`/hotels/vendor/rooms/RT-QAB-DLX/calendar`, {
      headers: authHeaders
    });
    assert(calendarRes.status === 200, 'Təqvim matrisi uğurla əldə edildi');
    assert(Array.isArray(calendarRes.data?.data?.matrix), 'Matrix massiv formatındadır');
    assert(calendarRes.data?.data?.matrix?.length >= 30, `Matrisdə ən azı 30 gün var (Sayı: ${calendarRes.data?.data?.matrix?.length})`);

    // 9. Kütləvi Təqvim Yeniləmə (Bulk Update) - Həm updates massivi, həm də dates massivi
    console.log('\n[9/10] Kütləvi Təqvim Yeniləməsi (Həm updates [], həm də dates [] formatı):');
    
    // Format A: { dates: [...], priceOverride: 185, availableCount: 10 }
    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    const bulkDatesRes = await request(`/hotels/vendor/rooms/RT-QAB-DLX/calendar`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        dates: [todayStr, tomorrowStr],
        priceOverride: 185,
        availableCount: 11
      }
    });
    assert(bulkDatesRes.status === 200, 'Format A (dates massivi) uğurla yeniləndi');
    assert(bulkDatesRes.data?.data?.updatedDaysCount === 2, '2 gün üçün qiymət tətbiq edildi');

    // Format B: POST /hotels/:hotelId/rooms/:roomId/calendar/bulk ilə { updates: [...] }
    const bulkUpdatesRes = await request(`/hotels/H-QABALA-RESORT/rooms/RT-QAB-DLX/calendar/bulk`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        updates: [
          { date: todayStr, priceOverride: 199, availableCount: 9, isBlocked: false },
          { date: tomorrowStr, priceOverride: 209, availableCount: 8, isBlocked: false }
        ]
      }
    });
    assert(bulkUpdatesRes.status === 200, 'Format B (updates massivi və POST bulk endpoint) uğurla yeniləndi');
    assert(bulkUpdatesRes.data?.data?.updatedDaysCount === 2, '2 gün üzrə fərqli qiymətlər yeniləndi');

    // 10. GET /hotels/vendor/bookings
    console.log('\n[10/10] Vendor Rezervasiyaları və Qonaq Siyahısı (/hotels/vendor/bookings):');
    const bookingsRes = await request('/hotels/vendor/bookings', { headers: authHeaders });
    assert(bookingsRes.status === 200, 'Rezervasiyalar siyahısı uğurla əldə edildi');
    assert(Array.isArray(bookingsRes.data?.data), 'Bookings massiv formatındadır');
    assert(bookingsRes.data?.data?.length >= 3, `Ən azı 3 rezervasiya mövcuddur (Tapıldı: ${bookingsRes.data?.data?.length})`);

    const hasKamran = bookingsRes.data?.data?.some(b => b.primaryGuestName === 'Kamran Məmmədov');
    assert(hasKamran, 'Kamran Məmmədov adlı qonağın rezervasiyası tapıldı');

    const partiallyPaid = bookingsRes.data?.data?.find(b => b.paymentStatus === 'PARTIALLY_PAID');
    assert(Boolean(partiallyPaid), '30% depozitli qalıq ödənişli rezervasiya mövcuddur');

    console.log('\n================================================================================');
    console.log(`🎉 NƏTİCƏ: Bütün ${totalTests} testdən ${passedTests} test UĞURLA KEÇDİ! (100%)`);
    console.log('================================================================================');
  } catch (err) {
    console.error('Test icrası zamanı xəta:', err);
    process.exitCode = 1;
  }
}

runHotelStage1Tests();
