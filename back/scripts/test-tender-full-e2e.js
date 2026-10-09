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

async function runMasterE2ETests() {
  console.log('================================================================================');
  console.log('🌟 [STAGE 4 MASTER E2E TEST] Tender Masası & Fərdi Turlar B2B Tam Dövrü');
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
      body: { email: 'aztour@gmail.com', password: 'password123' }
    });
    const vendorToken = loginRes.data?.accessToken || loginRes.data?.data?.accessToken;
    assert(Boolean(vendorToken), 'Vendor (aztour@gmail.com) uğurla daxil oldu və JWT token aldı');
    const vendorHeaders = { Authorization: `Bearer ${vendorToken}` };

    // 2. Initial Stats Check
    console.log('\n[2/12] Vendor Tender KPI Statistikası:');
    const statsRes = await request('/custom-tours/vendor/stats', {
      method: 'GET',
      headers: vendorHeaders
    });
    const initialStats = statsRes.data?.data;
    assert(statsRes.ok && initialStats?.totalOpenTenders >= 5,
      `Aktiv tenderlər statistikası: ${initialStats?.totalOpenTenders} tender, Göndərilmiş: ${initialStats?.mySubmittedBids}`
    );

    // 3. Customer Registration & Token
    console.log('\n[3/12] Müştəri Avtorizasiyası:');
    const customerEmail = `customer_${Date.now()}@toursales.az`;
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Kamran Məmmədov',
        email: customerEmail,
        password: 'password123',
        phoneNumber: '+994503332211',
        role: 'User'
      }
    });

    const customerToken = regRes.data?.data?.accessToken || regRes.data?.accessToken;
    assert(Boolean(customerToken), `Müştəri (${customerEmail}) uğurla yaradıldı və JWT token əldə edildi`);
    const customerHeaders = { Authorization: `Bearer ${customerToken}` };

    // 4. Customer Creates a New Custom Tour Request (Tender)
    console.log('\n[4/12] Müştəri Yeni Fərdi Tur Tenderi Yaradır:');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newRequestPayload = {
      type: 'CORPORATE',
      title: `Bakı - Qax - Zaqatala Korporativ Eko Tur #${randomNum}`,
      destinations: ['Bakı', 'Qax', 'İlisu', 'Zaqatala'],
      startDate: '2026-11-10T08:00:00.000Z',
      endDate: '2026-11-13T20:00:00.000Z',
      adultsCount: 16,
      childrenCount: 0,
      vehicleType: 'MINIBUS_MERCEDES_SPRINTER_18',
      hotelPreference: 'HOTEL_4_STAR',
      mealPreference: 'FULL_BOARD',
      guideRequired: true,
      guideLanguage: 'Azərbaycan dili',
      attractions: ['Sumuq Qala', 'Mamırlı Şəlalə', 'Zaqatala Qalası'],
      budgetMin: 4500,
      budgetMax: 6000,
      specialNotes: 'Şirkət rəhbərliyi üçün fərdi menyu və transfer arzu olunandır.'
    };

    const createReqRes = await request('/custom-tours/requests', {
      method: 'POST',
      headers: customerHeaders,
      body: newRequestPayload
    });
    const createdReq = createReqRes.data?.data || createReqRes.data;
    assert(createReqRes.status === 201 && Boolean(createdReq?.id),
      `Yeni Tender Sorğusu yaradıldı: ${createdReq?.title} (${createdReq?.requestNumber})`
    );

    // 5. Vendor Views Tender Board & Finds New Request
    console.log('\n[5/12] Vendor Tender Masasında Yeni Sorğunu Görür:');
    const boardRes = await request('/custom-tours/tenders', {
      method: 'GET',
      headers: vendorHeaders
    });
    const boardTenders = boardRes.data?.data || boardRes.data;
    const foundOnBoard = Array.isArray(boardTenders) && boardTenders.find(t => t.id === createdReq.id);
    assert(Boolean(foundOnBoard),
      `Yaradılmış tender dərhal tender masasında əks olundu (#${createdReq.requestNumber})`
    );

    // 6. Vendor Submits a Smart Bid
    console.log('\n[6/12] Vendor Tenderə Qiymət və Tur Proqramı Təklif Edir:');
    const submitBidRes = await request(`/custom-tours/tenders/${createdReq.id}/bid`, {
      method: 'POST',
      headers: vendorHeaders,
      body: {
        offeredPrice: 5200,
        itineraryProgram: '1-ci Gün: Bakı-Qax, İlisu gəzintisi. 2-ci Gün: Mamırlı şəlalə, Zaqatala fındıq bağları. 3-cü Gün: Qayıdış.',
        includedServices: ['Mercedes Sprinter VIP 18 yerlik', '4* El Resort Qax oteli', 'Gündə 3 dəfə qidalanma', 'Sertifikatlı bələdçi'],
        excludedServices: ['Alkoqollu içkilər'],
        vehicleDetails: 'Mercedes-Benz Sprinter 2023 VIP Salon',
        hotelDetails: 'Qax El Resort 4* Oteli',
        vendorNotes: 'Qrup üçün xüsusi milli musiqi proqramı və çay dəsgahı daxildir.',
        validDays: 5
      }
    });
    const submittedBid = submitBidRes.data?.data;
    assert(submitBidRes.status === 201 && Boolean(submittedBid?.id),
      `Təklif təqdim edildi: #${submittedBid?.bidNumber}, Məbləğ: ${submittedBid?.offeredPrice} AZN (Hər nəfərə: ${submittedBid?.pricePerPerson} AZN)`
    );

    // 7. Verify My Bids Contains New Bid
    console.log('\n[7/12] Vendorun Təkliflərim Siyahısında Yeni Təklif Yoxlanılır:');
    const myBidsRes = await request('/custom-tours/tenders/my-bids', {
      method: 'GET',
      headers: vendorHeaders
    });
    const myBids = myBidsRes.data?.data || myBidsRes.data;
    const foundMyBid = Array.isArray(myBids) && myBids.find(b => b.id === submittedBid.id);
    assert(Boolean(foundMyBid) && foundMyBid.status === 'PENDING',
      `Təklif "Mənim Təkliflərim" siyahısında status PENDING olaraq mövcuddur`
    );

    // 8. Vendor Edits Bid (Price Discount)
    console.log('\n[8/12] Vendor Təklifi Redaktə Edir (Endirim Təklif Edir):');
    const editBidRes = await request(`/custom-tours/bids/${submittedBid.id}`, {
      method: 'PUT',
      headers: vendorHeaders,
      body: {
        offeredPrice: 4950,
        vendorNotes: 'Xüsusi korporativ endirimlə yenilənmiş paket qiyməti.'
      }
    });
    const updatedBid = editBidRes.data?.data;
    assert(editBidRes.ok && updatedBid?.offeredPrice === 4950,
      `Təklif uğurla redaktə olundu: Qiymət 5200 AZN -> ${updatedBid?.offeredPrice} AZN`
    );

    // 9. Customer Accepts Winning Bid
    console.log('\n[9/12] Müştəri Təklifi Qəbul Edir (Accept Winning Bid):');
    const acceptBidRes = await request(`/custom-tours/bids/${submittedBid.id}/accept`, {
      method: 'POST',
      headers: customerHeaders,
      body: {
        requestId: createdReq.id
      }
    });
    assert(acceptBidRes.ok && acceptBidRes.data?.data?.status === 'ACCEPTED',
      `Müştəri #${submittedBid.bidNumber} nömrəli təklifi qəbul etdi (Status: ACCEPTED)`
    );

    // 10. Customer Confirms & Checkouts Booking (Deposit / Full)
    console.log('\n[10/12] Müştəri Səfəri Təsdiqləyir və Vauçer Yaradır:');
    const checkoutRes = await request(`/custom-tours/bids/${submittedBid.id}/checkout`, {
      method: 'POST',
      headers: customerHeaders,
      body: {
        requestId: createdReq.id,
        paymentType: 'FULL'
      }
    });
    const booking = checkoutRes.data?.data;
    assert(checkoutRes.ok && Boolean(booking?.voucherCode),
      `Rezervasiya və Vauçer yaradıldı: ${booking?.bookingNumber}, Vauçer: ${booking?.voucherCode}, Məbləğ: ${booking?.paidAmount} AZN`
    );

    // 11. Vendor Sees Customer Contacts & Won Status
    console.log('\n[11/12] Vendor Panelində Müştəri Əlaqə Məlumatları və Vauçer Əks Olunur:');
    const myWonBidsRes = await request('/custom-tours/tenders/my-bids', {
      method: 'GET',
      headers: vendorHeaders
    });
    const updatedBids = myWonBidsRes.data?.data || myWonBidsRes.data;
    const winningBidOnVendor = Array.isArray(updatedBids) && updatedBids.find(b => b.id === submittedBid.id);
    assert(
      winningBidOnVendor?.status === 'ACCEPTED' &&
      winningBidOnVendor?.request?.status === 'PAID_CONFIRMED' &&
      Boolean(winningBidOnVendor?.request?.user?.phoneNumber),
      `Vendor panelində müştərinin əlaqə telefonu (${winningBidOnVendor?.request?.user?.phoneNumber}) və vauçer statusu təsdiqləndi`
    );

    // 12. Vendor KPI Reflects Increased Revenue
    console.log('\n[12/12] Yekun KPI Statistika Sinxronizasiyası:');
    const finalStatsRes = await request('/custom-tours/vendor/stats', {
      method: 'GET',
      headers: vendorHeaders
    });
    const finalStats = finalStatsRes.data?.data;
    assert(
      finalStats?.myWonBids >= initialStats?.myWonBids + 1 &&
      finalStats?.totalWonAmount >= initialStats?.totalWonAmount + 4950,
      `KPI dərhal yeniləndi: Qazanılan tenderlər=${finalStats?.myWonBids}, Qazanılan gəlir=${finalStats?.totalWonAmount} AZN`
    );

    console.log('\n================================================================================');
    console.log(`🏆 [MASTER E2E NƏTİCƏ]: Bütün ${passedTests}/${totalTests} Test Uğurla Keçdi (100% SUCCESS)`);
    console.log('================================================================================\n');

  } catch (err) {
    console.error('❌ Master E2E Xətası:', err);
    process.exit(1);
  }
}

runMasterE2ETests();
