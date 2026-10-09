import prisma from '../config/db.js';

async function runMasterE2ETests() {
  console.log('================================================================');
  console.log('🏁 TOURSALES FINANCE & BALANCE MODULE: MASTER E2E VERIFICATION 🏁');
  console.log('================================================================\n');

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
    // -------------------------------------------------------------
    // 0. AUTHENTICATION (VENDOR LOGIN)
    // -------------------------------------------------------------
    console.log('👉 [0/4] İSTİFADƏÇİ AVTORİZASİYASI:');
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

    // -------------------------------------------------------------
    // 1. MƏRHƏLƏ 1: BAZA HESABLAŞMALAR, VALIDASIYA VƏ ATOMİK PAYOUT
    // -------------------------------------------------------------
    console.log('\n👉 [1/4] MƏRHƏLƏ 1: BAZA HESABLAŞMALAR VƏ ATOMİK ƏMƏLİYYATLAR:');
    
    // 1.1 Overview
    const ovRes = await fetch('http://localhost:5000/api/v1/finance/vendor/overview', { headers });
    const ovData = await ovRes.json();
    assert(ovRes.status === 200 && ovData.status === 'success', 'GET /vendor/overview - 200 OK');
    const startBalance = Number(ovData.data.availableBalance);
    assert(!isNaN(startBalance), `Mövcud balans uğurla oxundu: ${startBalance.toFixed(2)} AZN`);
    assert(typeof ovData.data.totalTurnover === 'number', 'Dövriyyə cəmi hesablandı');
    assert(typeof ovData.data.totalCommissions === 'number', 'Platforma komissiyası hesablandı');

    // 1.2 Minimum məbləğ validasiyası (20 AZN həddi)
    const minPayoutRes = await fetch('http://localhost:5000/api/v1/finance/vendor/payout-request', {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount: 10, bankAccount: 'AZ21NABZ01350100000000001234' })
    });
    assert(minPayoutRes.status === 400, 'Minimum 20 AZN-dən az sorğu rədd edildi (HTTP 400)');

    // 1.3 IBAN format validasiyası
    const ibanPayoutRes = await fetch('http://localhost:5000/api/v1/finance/vendor/payout-request', {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount: 25, bankAccount: '12345INVALID' })
    });
    assert(ibanPayoutRes.status === 400, 'Qeyri-düzgün IBAN formatı rədd edildi (HTTP 400)');

    // 1.4 Düzgün Payout sorğusu və balansın atomik azalması
    const testAmount = 25;
    const testIban = 'AZ21NABZ01350100000000009999';
    const validPayoutRes = await fetch('http://localhost:5000/api/v1/finance/vendor/payout-request', {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount: testAmount, bankAccount: testIban })
    });
    const validPayoutData = await validPayoutRes.json();
    assert(validPayoutRes.status === 201 && validPayoutData.status === 'success', '25 AZN-lik çıxarış sorğusu uğurla yaradıldı (HTTP 201)');
    const createdPayoutId = validPayoutData.data?.id;
    assert(!!createdPayoutId, `Çıxarış ID-si generasiya edildi: #${createdPayoutId}`);

    // Balansın dərhal 25 AZN azalması yoxlanılır
    const midOvRes = await fetch('http://localhost:5000/api/v1/finance/vendor/overview', { headers });
    const midOvData = await midOvRes.json();
    const midBalance = Number(midOvData.data.availableBalance);
    assert(Math.abs(midBalance - (startBalance - testAmount)) < 0.01, 'Balans atomik olaraq 25 AZN azaldıldı');

    // 1.5 Pending sorğunun ləğv edilməsi və vəsaitin bərpası
    const cancelRes = await fetch(`http://localhost:5000/api/v1/finance/vendor/payouts/${createdPayoutId}/cancel`, {
      method: 'POST',
      headers
    });
    const cancelData = await cancelRes.json();
    assert(cancelRes.status === 200 && cancelData.status === 'success', `Sorğu #${createdPayoutId} vendor tərəfindən uğurla ləğv edildi`);

    // Balansın dərhal bərpa olunması yoxlanılır
    const endOvRes = await fetch('http://localhost:5000/api/v1/finance/vendor/overview', { headers });
    const endOvData = await endOvRes.json();
    const restoredBalance = Number(endOvData.data.availableBalance);
    assert(Math.abs(restoredBalance - startBalance) < 0.01, 'Ləğv edilən 25 AZN tam olaraq mövcud balansa bərpa olundu');

    // -------------------------------------------------------------
    // 2. MƏRHƏLƏ 2: RƏSMİ BANK REKVİZİTLƏRİ VƏ FİLTRLƏMƏ
    // -------------------------------------------------------------
    console.log('\n👉 [2/4] MƏRHƏLƏ 2: BANK REKVİZİTLƏRİ VƏ PAYOUT SİYAHILARI:');
    
    // 2.1 Bank rekvizitlərinin yenilənməsi
    const updateBankRes = await fetch('http://localhost:5000/api/v1/finance/vendor/bank-details', {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        bankName: 'Kapital Bank ASC',
        iban: 'AZ44AIIB38019440123456789012',
        voen: '9900012345',
        swiftBic: 'AIIBAZ2X',
        bankCode: '380194'
      })
    });
    const updateBankData = await updateBankRes.json();
    assert(updateBankRes.status === 200 && updateBankData.status === 'success', 'Rəsmi bank rekvizitləri uğurla yeniləndi');
    assert(updateBankData.data?.bankName === 'Kapital Bank ASC', 'Bank adı yadda saxlanıldı');
    assert(updateBankData.data?.iban === 'AZ44AIIB38019440123456789012', 'IBAN yadda saxlanıldı');

    // 2.2 Payouts siyahısı
    const payoutsListRes = await fetch('http://localhost:5000/api/v1/finance/vendor/payouts', { headers });
    const payoutsListData = await payoutsListRes.json();
    assert(payoutsListRes.status === 200 && Array.isArray(payoutsListData.data), 'Vendor payout sorğuları siyahısı gətirildi');
    assert(payoutsListData.data.some(p => p.id === createdPayoutId && p.status?.toUpperCase() === 'CANCELLED'), 'Ləğv edilmiş sorğu siyahıda CANCELLED statusundadır');

    // -------------------------------------------------------------
    // 3. MƏRHƏLƏ 3: LEDGER, ESCROW, e-QAİMƏ XML VƏ FAKTURA PDF
    // -------------------------------------------------------------
    console.log('\n👉 [3/4] MƏRHƏLƏ 3: LEDGER AUDİTİ, ESCROW VƏ VERGİ SƏNƏDLƏRİ:');

    // 3.1 Tranzaksiyalar və debet/kredit təhlükəsizliyi
    const txRes = await fetch('http://localhost:5000/api/v1/finance/vendor/transactions', { headers });
    const txData = await txRes.json();
    assert(txRes.status === 200 && Array.isArray(txData.data), 'Tranzaksiyalar gətirildi');
    for (const t of txData.data) {
      assert(t.credit >= 0 && t.debit >= 0, `Tranzaksiya #${t.id} debet və kredit mənfi deyil`);
    }

    // 3.2 Escrow rezervasiyalar
    const escrowRes = await fetch('http://localhost:5000/api/v1/finance/vendor/escrow-details', { headers });
    const escrowData = await escrowRes.json();
    assert(escrowRes.status === 200 && Array.isArray(escrowData.data), 'Escrow detalları massiv şəklində qaytarıldı');

    // 3.3 e-Qaimə XML və PDF sənədi
    const sampleBooking = await prisma.booking.findFirst({
      where: { companyId: 'C-586288', deletedAt: null }
    });
    if (sampleBooking) {
      const xmlRes = await fetch(`http://localhost:5000/api/v1/finance/invoices/${sampleBooking.id}/eqaime`, { headers });
      const xmlData = await xmlRes.json();
      assert(xmlRes.status === 200 && xmlData.data?.xml?.includes('<?xml'), 'DVX üçün e-Qaimə XML generasiya edildi');

      const pdfRes = await fetch(`http://localhost:5000/api/v1/finance/invoices/${sampleBooking.id}/pdf`, { headers });
      assert(pdfRes.status === 200, 'Kommersiya Fakturası PDF uğurla hasil edildi');
    }

    // -------------------------------------------------------------
    // 4. MƏRHƏLƏ 4: ADVANCED EXCEL İXRACI VƏ TARİX DİAPAZONLARI
    // -------------------------------------------------------------
    console.log('\n👉 [4/4] MƏRHƏLƏ 4: EXCEL HESABAT VƏ TARİX ARALIĞI FİLTRİ:');

    // 4.1 Bütün dövr üçün Excel ixracı
    const excelRes = await fetch('http://localhost:5000/api/v1/finance/vendor/export', { headers });
    assert(excelRes.status === 200, 'GET /vendor/export HTTP 200 qaytardı');
    const excelBuffer = await excelRes.arrayBuffer();
    assert(excelBuffer.byteLength > 1000, `Excel fayl bufferi uğurla generasiya edildi (${excelBuffer.byteLength} bayt)`);

    // 4.2 Tarix diapazonu ilə Excel ixracı
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateExcelRes = await fetch(`http://localhost:5000/api/v1/finance/vendor/export?startDate=${sevenDaysAgo.toISOString()}`, { headers });
    assert(dateExcelRes.status === 200, 'Tarix filtri ilə Excel ixracı HTTP 200 qaytardı');
    const dateExcelBuffer = await dateExcelRes.arrayBuffer();
    assert(dateExcelBuffer.byteLength > 1000, 'Diapazonlu Excel bufferi etibarlıdır');

    // 4.3 Tranzaksiyaların tarix aralığı ilə sorğulanması
    const dateTxRes = await fetch(`http://localhost:5000/api/v1/finance/vendor/transactions?startDate=${sevenDaysAgo.toISOString()}`, { headers });
    const dateTxData = await dateTxRes.json();
    assert(dateTxRes.status === 200 && Array.isArray(dateTxData.data), 'Tarix aralığı üzrə tranzaksiyalar uğurla süzüldü');

    console.log('\n================================================================');
    console.log(`🏆 NƏTİCƏ: BÜTÜN 4 MƏRHƏLƏ MASTER TESTLƏRİNDƏN KEÇDİ! (${passedTests}/${totalTests} test)`);
    console.log('✅ MALİYYƏ VƏ HESABLAŞMA MODULU 100% FUNKSİONALDIR VƏ HAZIRDIR.');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ MASTER TEST XƏTASI:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMasterE2ETests();
