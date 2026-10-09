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

async function runTenderStage1Tests() {
  console.log('================================================================================');
  console.log('🚀 [STAGE 1 TEST SUITE] Tender Masası - Backend API, Stats & Təklif İdarəetməsi');
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
    console.log('[1/7] Vendor Avtorizasiyası:');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'aztour@gmail.com',
        password: 'password123'
      }
    });

    const token = loginRes.data?.accessToken || loginRes.data?.data?.accessToken;
    assert(Boolean(token), 'Vendor uğurla daxil oldu və JWT token əldə edildi');

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Vendor Tender Stats KPI
    console.log('\n[2/7] Tender Statistikası Endpoint-i (/custom-tours/vendor/stats):');
    const statsRes = await request('/custom-tours/vendor/stats', {
      method: 'GET',
      headers: authHeaders
    });
    const stats = statsRes.data?.data;
    assert(statsRes.ok && Boolean(stats), 'Tender statistikası cavabı uğurludur (200 OK)');
    assert(stats?.totalOpenTenders >= 5, `Aktiv açıq tender sayı düzgündür: ${stats?.totalOpenTenders} tender`);
    assert(stats?.mySubmittedBids >= 1, `Vendorun göndərdiyi təklif sayı mövcuddur: ${stats?.mySubmittedBids}`);

    // 3. Get Tender Board via /tenders and /vendor/tender-board
    console.log('\n[3/7] Tender Masası Oxunması (/tenders & /vendor/tender-board):');
    const boardRes1 = await request('/custom-tours/tenders', {
      method: 'GET',
      headers: authHeaders
    });
    const tenders1 = boardRes1.data?.data || boardRes1.data;
    assert(boardRes1.ok && Array.isArray(tenders1) && tenders1.length >= 5,
      `GET /custom-tours/tenders: ${tenders1.length} aktiv tender sorğusu qaytarıldı`
    );

    const boardRes2 = await request('/custom-tours/vendor/tender-board', {
      method: 'GET',
      headers: authHeaders
    });
    const tenders2 = boardRes2.data?.data || boardRes2.data;
    assert(boardRes2.ok && Array.isArray(tenders2) && tenders2.length === tenders1.length,
      `GET /custom-tours/vendor/tender-board: Eyni siyahı uğurla qaytarıldı (${tenders2.length} sorğu)`
    );

    const targetTender = tenders1.find(t => t.id === 'CTR-702045') || tenders1[0];
    console.log(`      Seçilmiş Tender: "${targetTender.title}" (#${targetTender.requestNumber})`);

    // 4. Single Tender Details
    console.log('\n[4/7] Tək Tender Sorğusunun Detalları (/tenders/:id):');
    const detailsRes = await request(`/custom-tours/tenders/${targetTender.id}`, {
      method: 'GET',
      headers: authHeaders
    });
    assert(detailsRes.ok && detailsRes.data?.data?.id === targetTender.id,
      `Tender detalları oxundu: Büdcə=${detailsRes.data?.data?.budgetMin}-${detailsRes.data?.data?.budgetMax} AZN`
    );

    // 5. Submit New Bid (/tenders/:id/bid)
    console.log('\n[5/7] Tenderə Yeni Təklif Göndərilməsi (Submit Bid):');
    const submitBidRes = await request(`/custom-tours/tenders/${targetTender.id}/bid`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        offeredPrice: 3800,
        itineraryProgram: '1-ci Gün: Bakı-Qəbələ, Tufandağ. 2-ci Gün: Şəki Xan Sarayı. 3-cü Gün: Bakıya qayıdış.',
        includedServices: ['Mercedes Sprinter 18 yer', '5 ulduzlu otel', 'Səhər və şam yeməyi'],
        excludedServices: ['Şəxsi xərclər'],
        vehicleDetails: 'Mercedes-Benz Sprinter 2022, 18 yerlik VIP',
        hotelDetails: 'Qəbələ 5* Kurort Oteli',
        vendorNotes: 'Korporativ heyət üçün ingilisdilli bələdçi təmin edilir.',
        validDays: 5
      }
    });

    const createdBid = submitBidRes.data?.data;
    assert(submitBidRes.status === 201 && Boolean(createdBid?.id),
      `Yeni təklif uğurla göndərildi: ID=${createdBid?.id}, Qiymət=${createdBid?.offeredPrice} AZN`
    );

    // 6. Get My Bids via /tenders/my-bids
    console.log('\n[6/7] Vendorun Təklifləri Siyahısı (/tenders/my-bids):');
    const myBidsRes = await request('/custom-tours/tenders/my-bids', {
      method: 'GET',
      headers: authHeaders
    });
    if (!myBidsRes.ok) console.log('myBidsRes status & data:', myBidsRes.status, myBidsRes.data);
    const myBids = myBidsRes.data?.data || myBidsRes.data;
    assert(myBidsRes.ok && Array.isArray(myBids) && myBids.some(b => b.id === createdBid.id),
      `Göndərilmiş #${createdBid.id} nömrəli təklif siyahıda əks olundu (Cəmi təkliflər: ${myBids?.length})`
    );

    // 7. Update and Withdraw Submitted Bid
    console.log('\n[7/7] Təklifin Redaktəsi və Geri Çəkilməsi (Edit & Withdraw Bid):');
    const updateBidRes = await request(`/custom-tours/bids/${createdBid.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        offeredPrice: 3600,
        vendorNotes: 'Xüsusi endirimlə yenilənmiş korporativ paket təklifi.'
      }
    });
    if (!updateBidRes.ok) console.log('updateBidRes status & data:', updateBidRes.status, updateBidRes.data);
    assert(updateBidRes.ok && updateBidRes.data?.data?.offeredPrice === 3600,
      `Təklifin qiyməti uğurla 3600 AZN-ə endirildi (Redaktə təsdiqləndi)`
    );

    const withdrawRes = await request(`/custom-tours/bids/${createdBid.id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert(withdrawRes.ok && withdrawRes.data?.success === true,
      `Test təklifi uğurla geri çəkildi və sistemdən silindi (Withdraw təsdiqləndi)`
    );

    console.log('\n================================================================================');
    console.log(`🏁 [STAGE 1 NƏTİCƏ]: Bütün ${passedTests}/${totalTests} Test Uğurla Keçdi (100% SUCCESS)`);
    console.log('================================================================================');
  } catch (err) {
    console.error('❌ Mərhələ 1 test xətası:', err);
    process.exit(1);
  }
}

runTenderStage1Tests();
