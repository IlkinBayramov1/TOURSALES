import prisma from '../config/db.js';
import paymentOrchestrator from '../modules/payments/payment.orchestrator.js';
import ledgerService from '../modules/finance/ledger.service.js';
import { Prisma } from '@prisma/client';

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

async function runStage2LedgerAndIdempotencyTests() {
  console.log('================================================================');
  console.log('💳 MƏRHƏLƏ 2: İKİQAT YAZILIŞLI LEDGER & İDEMPOTENT VEBHUK SINAĞI');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [KEÇDİ] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [UĞURSUZ] ${message}`);
      throw new Error(`Test uğursuz oldu: ${message}`);
    }
  }

  try {
    // 1. POST /payments/detect-bin endpoint testi
    console.log('1. POST /payments/detect-bin API endpointi yoxlanılır...');
    const binRes = await request('/payments/detect-bin', {
      method: 'POST',
      body: { cardNumberOrBin: '4169730012345678', amount: 500 }
    });
    assert(binRes.ok, `POST /payments/detect-bin status 200 qaytardı (Status: ${binRes.status})`);
    assert(binRes.data?.data?.bankCode === 'KAPITAL', 'Birkart Kapital Bank kimi aşkarlandı');
    assert(binRes.data?.data?.isInstallment === true, 'Taksit dəstəyi təsdiqləndi');
    assert(Array.isArray(binRes.data?.data?.installments), 'Taksit cədvəli yaradıldı');
    console.log(`   Aşkarlanan kart: ${binRes.data?.data?.cardName} (${binRes.data?.data?.network})\n`);

    // 2. Bir şirkət və bron tapırıq
    const booking = await prisma.booking.findFirst({
      where: { paymentStatus: 'PAID', deletedAt: null },
      include: { tour: true }
    });

    if (!booking) {
      throw new Error('Test üçün ödənilmiş sifariş tapılmadı.');
    }

    // 3. İdempotent Webhook Replay Qorunması Sınağı
    console.log('2. İdempotent Webhook Replay Protection testi (Təkrar tranzaksiyanın qarşısının alınması)...');
    const testIdempotencyKey = `wh_test_replay_${Date.now()}`;
    const webhookPayload = {
      bookingId: booking.id,
      amount: 50.0,
      status: 'PAID',
      paymentType: 'FULL'
    };

    // İlk vebhuk göndərişi
    const firstWebhook = await paymentOrchestrator.handleWebhook({
      provider: 'BIRBANK',
      idempotencyKey: testIdempotencyKey,
      payload: webhookPayload
    });
    assert(firstWebhook.status === 'PROCESSED', `İlk vebhuk uğurla emal edildi (Status: ${firstWebhook.status})`);

    // Eyni açarla ikinci vebhuk göndərişi (Təkrar / Replay hücumu)
    const replayWebhook = await paymentOrchestrator.handleWebhook({
      provider: 'BIRBANK',
      idempotencyKey: testIdempotencyKey,
      payload: webhookPayload
    });
    assert(replayWebhook.status === 'SKIPPED_DUPLICATE', `Təkrar vebhuk SKIPPED_DUPLICATE olaraq bloklandı (Status: ${replayWebhook.status})`);
    console.log('   Təkrar tranzaksiya bazada ikiləşmə yaratmadan təhlükəsiz şəkildə dəf edildi.\n');

    // 4. İkitərəfli Mühasibat Balansı (Double-Entry Balance Verification)
    console.log('3. İkitərəfli Mühasibat Uçotu Balansının Yoxlanılması (Debit == Credit)...');
    const totalDebitAgg = await prisma.ledgerEntry.aggregate({
      _sum: { debit: true }
    });
    const totalCreditAgg = await prisma.ledgerEntry.aggregate({
      _sum: { credit: true }
    });

    const sumDebit = new Prisma.Decimal(totalDebitAgg._sum.debit || 0);
    const sumCredit = new Prisma.Decimal(totalCreditAgg._sum.credit || 0);

    console.log(`   Cəmi Debet:  ${sumDebit.toString()} AZN`);
    console.log(`   Cəmi Kredit: ${sumCredit.toString()} AZN`);

    assert(sumDebit.equals(sumCredit), `Mühasibat balansı dəqiqdir: Debet və Kredit bərabərdir (${sumDebit.toString()} AZN)`);

    // 5. Geri Qaytarma (Reversal Entry) Ledger Testi
    console.log('\n4. İmmutable Ledger Reversal (Geri Qaytarma) Sınağı...');
    const originalJournal = await prisma.ledgerEntry.findFirst({
      where: { referenceType: 'BOOKING_SALE' }
    });

    if (originalJournal) {
      const reversalRes = await ledgerService.recordReversalEntry({
        originalJournalId: originalJournal.journalId,
        bookingId: originalJournal.bookingId,
        companyId: booking.companyId,
        refundAmount: 20.0,
        reason: 'Müştəri ləğvetmə tələbi üzrə qismən geri qaytarma'
      });
      assert(reversalRes.status === 'REVERSED', `Reversal jurnalı uğurla qeydə alındı (ID: ${reversalRes.journalId})`);

      // Yenidən balans bərabərliyini yoxlayırıq
      const newDebitAgg = await prisma.ledgerEntry.aggregate({ _sum: { debit: true } });
      const newCreditAgg = await prisma.ledgerEntry.aggregate({ _sum: { credit: true } });
      assert(new Prisma.Decimal(newDebitAgg._sum.debit).equals(new Prisma.Decimal(newCreditAgg._sum.credit)), 'Reversal sonrası Debet və Kredit bərabərliyi qorundu');
    }

    // 6. GET /payments/providers testi
    console.log('\n5. GET /payments/providers endpointi yoxlanılır...');
    const providersRes = await request('/payments/providers');
    assert(providersRes.ok, `GET /payments/providers status 200 qaytardı (Status: ${providersRes.status})`);
    assert(Array.isArray(providersRes.data?.data), 'Ödəniş provayderləri massiv şəklindədir');
    console.log(`   Aktiv ödəniş şlüzləri: ${providersRes.data?.data?.join(', ')}\n`);

    console.log('================================================================');
    console.log(`🏁 MƏRHƏLƏ 2 NƏTİCƏ: Bütün ${totalTests} / ${passedTests} testlər 100% UĞURLA KEÇDİ!`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('\n❌ Mərhələ 2 Testlərində Xəta:', error.message);
    process.exit(1);
  }
}

runStage2LedgerAndIdempotencyTests();
