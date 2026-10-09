import prisma from '../config/db.js';

async function runStage1Tests() {
  console.log('=== TOURSALES FINANCE MODULE: STAGE 1 BACKEND AUDIT & TEST ===\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 1. Vendor Girişi və Token Alınması
    const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aztour@gmail.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.accessToken;
    assert(loginRes.ok && !!token, 'Vendor (aztour@gmail.com) uğurla daxil oldu və access token alındı');

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    // 2. Overview Testi
    const ovRes = await fetch('http://localhost:5000/api/v1/finance/vendor/overview', { headers });
    const ovData = await ovRes.json();
    assert(ovRes.status === 200 && ovData.status === 'success', 'GET /vendor/overview uğurla icra olundu (HTTP 200)');
    assert(typeof ovData.data.availableBalance === 'number', 'availableBalance ədədi formatdadır');
    assert(typeof ovData.data.pendingBalance === 'number', 'pendingBalance (Escrow) hesablandı');
    assert(typeof ovData.data.totalTurnover === 'number', 'totalTurnover hesablandı');
    assert(typeof ovData.data.totalWithdrawn === 'number', 'totalWithdrawn hesablandı');
    assert(typeof ovData.data.totalCommissions === 'number', 'totalCommissions hesablandı');
    console.log(`    -> Mövcud balans: ${ovData.data.availableBalance} AZN, Escrow: ${ovData.data.pendingBalance} AZN, Dövriyyə: ${ovData.data.totalTurnover} AZN`);

    const initialBalance = ovData.data.availableBalance;

    // 3. Transactions Testi (Debet / Kredit / Axtarış)
    const txRes = await fetch('http://localhost:5000/api/v1/finance/vendor/transactions', { headers });
    const txData = await txRes.json();
    assert(txRes.status === 200 && Array.isArray(txData.data), 'GET /vendor/transactions tranzaksiyalar siyahısını qaytardı');
    
    // Yoxlayırıq ki, heç bir kredit mənfi deyil və xərclər debit sütunundadır
    let hasSubscriptionOrPayout = false;
    for (const t of txData.data) {
      assert(t.credit >= 0, `Tranzaksiya #${t.id} kredit mənfi deyil (credit >= 0)`);
      assert(t.debit >= 0, `Tranzaksiya #${t.id} debet mənfi deyil (debit >= 0)`);
      if (t.type === 'SUBSCRIPTION' || t.type === 'PAYOUT') {
        hasSubscriptionOrPayout = true;
        assert(t.debit > 0, `Xərc tranzaksiyası #${t.id} (${t.type}) Məxaric (Debet) sütununda müsbət göstərilir (${t.debit} AZN)`);
      }
    }
    assert(hasSubscriptionOrPayout, 'Çıxarış və ya abunəlik xərcləri tapıldı və Debet sütununda düzgün əks olundu');

    // Axtarış filtri testi
    const searchRes = await fetch('http://localhost:5000/api/v1/finance/vendor/transactions?search=bilet', { headers });
    const searchData = await searchRes.json();
    assert(searchRes.status === 200 && searchData.data.length > 0, 'Tranzaksiyaların axtarış (search=bilet) filtri işləyir');

    // 4. Escrow Detalları Testi
    const escrowRes = await fetch('http://localhost:5000/api/v1/finance/vendor/escrow-details', { headers });
    const escrowData = await escrowRes.json();
    assert(escrowRes.status === 200 && Array.isArray(escrowData.data), 'GET /vendor/escrow-details gözləmədəki turları qaytardı');
    console.log(`    -> Escrow-da olan turların sayı: ${escrowData.data.length}`);

    // 5. Bank Rekvizitlərinin Yenilənməsi Testi
    const bankUpdateRes = await fetch('http://localhost:5000/api/v1/finance/vendor/bank-details', {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        iban: 'AZ12ABB0000000012345678901',
        bankName: 'Azərbaycan Beynəlxalq Bankı (ABB ASC)',
        bankCode: 'ABB001',
        swiftBic: 'IBAZAZ2X'
      })
    });
    const bankUpdateData = await bankUpdateRes.json();
    assert(bankUpdateRes.status === 200 && bankUpdateData.status === 'success', 'PUT /vendor/bank-details bank rekvizitlərini uğurla yenilədi');
    assert(bankUpdateData.data.iban === 'AZ12ABB0000000012345678901', 'Yenilənmiş IBAN düzgün saxlanıldı');

    // Səhv IBAN testi
    const invalidIbanRes = await fetch('http://localhost:5000/api/v1/finance/vendor/bank-details', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ iban: '12345' })
    });
    assert(invalidIbanRes.status === 400, 'Qeyri-düzgün IBAN formatında xəta qaytarıldı (HTTP 400)');

    // 6. Payout Sorğusu Validasiya Testləri
    // a) 20 AZN-dən az məbləğ
    const lowAmountRes = await fetch('http://localhost:5000/api/v1/finance/vendor/payout-request', {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount: 10, bankAccount: 'AZ12ABB0000000012345678901' })
    });
    assert(lowAmountRes.status === 400, 'Minimum 20 AZN həddindən aşağı sorğu rədd edildi (HTTP 400)');

    // b) Səhv IBAN
    const badIbanRes = await fetch('http://localhost:5000/api/v1/finance/vendor/payout-request', {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount: 25, bankAccount: 'INVALID_IBAN' })
    });
    assert(badIbanRes.status === 400, 'Səhv IBAN ilə çıxarış sorğusu rədd edildi (HTTP 400)');

    // c) Balansdan böyük məbləğ
    const overBalanceRes = await fetch('http://localhost:5000/api/v1/finance/vendor/payout-request', {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount: 999999, bankAccount: 'AZ12ABB0000000012345678901' })
    });
    assert(overBalanceRes.status === 400, 'Balansdan artıq məbləğ sorğusu rədd edildi (HTTP 400)');

    // d) Uğurlu Payout Sorğusu (20 AZN)
    const validPayoutRes = await fetch('http://localhost:5000/api/v1/finance/vendor/payout-request', {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount: 20, bankAccount: 'AZ12ABB0000000012345678901' })
    });
    const validPayoutData = await validPayoutRes.json();
    assert(validPayoutRes.status === 201 && validPayoutData.data?.id, 'Uğurlu Payout sorğusu yaradıldı (#ID: ' + validPayoutData.data?.id + ')');
    const createdPayoutId = validPayoutData.data.id;

    // Balansın azaldığını yoxlayırıq
    const ovAfterPayout = await fetch('http://localhost:5000/api/v1/finance/vendor/overview', { headers });
    const ovAfterData = await ovAfterPayout.json();
    assert(
      Math.abs(ovAfterData.data.availableBalance - (initialBalance - 20)) < 0.01,
      `Mövcud balans 20 AZN azaldı (${initialBalance} -> ${ovAfterData.data.availableBalance})`
    );

    // 7. Payout Sorğusunun Vendor Tərəfindən Ləğv Edilməsi (Cancel Payout)
    const cancelRes = await fetch(`http://localhost:5000/api/v1/finance/vendor/payouts/${createdPayoutId}/cancel`, {
      method: 'POST',
      headers
    });
    const cancelData = await cancelRes.json();
    assert(cancelRes.status === 200 && cancelData.data?.status === 'CANCELLED', 'Gözləmədəki Payout sorğusu uğurla ləğv edildi');

    // Balansın dərhal geri qayıtdığını yoxlayırıq
    const ovAfterCancel = await fetch('http://localhost:5000/api/v1/finance/vendor/overview', { headers });
    const ovCancelData = await ovAfterCancel.json();
    assert(
      Math.abs(ovCancelData.data.availableBalance - initialBalance) < 0.01,
      `Ləğv edildikdən sonra 20 AZN tam olaraq balansa bərpa olundu (${ovCancelData.data.availableBalance} AZN)`
    );

    // Artıq ləğv edilmiş sorğunu təkrar ləğv etmə cəhdi rədd edilməlidir
    const cancelAgainRes = await fetch(`http://localhost:5000/api/v1/finance/vendor/payouts/${createdPayoutId}/cancel`, {
      method: 'POST',
      headers
    });
    assert(cancelAgainRes.status === 400, 'Artıq ləğv edilmiş sorğunu təkrar ləğv etmək qadağandır (HTTP 400)');

    console.log(`\n=== BÜTÜN MƏRHƏLƏ 1 TESTLƏRİ UĞURLA KEÇDİ: ${passedTests}/${totalTests} (100%) ===\n`);
  } catch (err) {
    console.error('\n[XƏTA] Test zamanı problem aşkar edildi:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStage1Tests();
