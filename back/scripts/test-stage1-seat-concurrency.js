import prisma from '../config/db.js';

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

async function runStage1SeatTests() {
  console.log('================================================================');
  console.log('🛡️ MƏRHƏLƏ 1: AVTOBUS OTURACAQ SİSTEMİ & PARALEL KİLİDLƏMƏ TESTİ');
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
    // 1. Aktiv daxili tur tapırıq
    console.log('1. Aktiv avtobuslu tur axtarılır...');
    const tour = await prisma.tour.findFirst({
      where: { status: 'Active', deletedAt: null },
      select: { id: true, title: true, busCapacity: true, maxParticipants: true }
    });

    if (!tour) {
      throw new Error('Aktiv tur tapılmadı. Zəhmət olmasa bazada aktiv tur olduğundan əmin olun.');
    }
    const tourId = tour.id;
    console.log(`   Tur tapıldı: "${tour.title}" (ID: ${tourId})\n`);

    const userA = 'user_tester_A_' + Date.now();
    const userB = 'user_tester_B_' + Date.now();

    // 2. GET /seats
    console.log('2. GET /tours/:id/seats yoxlanılır...');
    const matrixRes = await request(`/tours/${tourId}/seats`);
    assert(matrixRes.ok, `GET /seats status 200 qaytardı (Status: ${matrixRes.status})`);
    assert(Array.isArray(matrixRes.data?.data?.seats), 'Oturacaqlar massiv şəklində qaytarıldı');
    assert(matrixRes.data?.data?.availableSeats >= 5, 'Ən azı 5 boş oturacaq mövcuddur');
    console.log(`   Cəmi yer: ${matrixRes.data?.data?.totalSeats}, Boş yer: ${matrixRes.data?.data?.availableSeats}\n`);

    // Boş oturacaqları dinamik seçirik
    const freeSeats = matrixRes.data?.data?.seats
      ?.filter((s) => s.status === 'AVAILABLE')
      ?.map((s) => s.seatNumber) || [];

    const seat1 = freeSeats[0];
    const batchA = [freeSeats[1], freeSeats[2], freeSeats[3]];
    const rollbackSeat = freeSeats[4];

    console.log(`   Seçilmiş test oturacaqları: Tək=#${seat1}, Qrup=[${batchA.join(', ')}], Rollback=#${rollbackSeat}\n`);

    // 3. Tək oturacaq kilidləmə (User A)
    console.log(`3. User A tərəfindən tək oturacaq (#${seat1}) kilidlənir...`);
    const lockRes1 = await request(`/tours/${tourId}/seats/lock`, {
      method: 'POST',
      headers: { 'x-guest-id': userA },
      body: { seatNumber: seat1, durationSeconds: 60 }
    });
    assert(lockRes1.ok, `Oturacaq #${seat1} uğurla kilidləndi (Status: ${lockRes1.status})`);
    assert(lockRes1.data?.data?.status === 'LOCKED', 'Status LOCKED olaraq qeyd edildi');

    // 4. Concurrency Test: User B eyni oturacağı kilidləməyə cəhd edir (409 Conflict gözlənilir)
    console.log(`\n4. User B eyni oturacağı (#${seat1}) kilidləməyə cəhd edir (Paralel toqquşma yoxlanışı)...`);
    const lockRes2 = await request(`/tours/${tourId}/seats/lock`, {
      method: 'POST',
      headers: { 'x-guest-id': userB },
      body: { seatNumber: seat1 }
    });
    assert(lockRes2.status === 409, `User B üçün 409 Conflict qaytarıldı (Status: ${lockRes2.status})`);
    console.log(`   Xəta mesajı: "${lockRes2.data?.msg || lockRes2.data?.message}"`);

    // 5. Toplu / Qrup kilidləmə (User A, Seats batchA)
    console.log(`\n5. User A tərəfindən 3 oturacaq ([${batchA.join(', ')}]) toplu kilidlənir...`);
    const batchLockRes = await request(`/tours/${tourId}/seats/lock`, {
      method: 'POST',
      headers: { 'x-guest-id': userA },
      body: { seatNumbers: batchA, durationSeconds: 60 }
    });
    assert(batchLockRes.ok, `Oturacaqlar [${batchA.join(', ')}] uğurla kilidləndi (Status: ${batchLockRes.status})`);
    assert(batchLockRes.data?.data?.seatNumbers?.length === 3, 'Bütün 3 oturacaq təsdiqləndi');

    // 6. Toplu kilidləmədə Atomik Rollback yoxlanışı (User B [batchA[0], rollbackSeat] seçir, batchA[0] məşğuldur)
    console.log(`\n6. User B [${batchA[0]}, ${rollbackSeat}] seçməyə cəhd edir (#${batchA[0]} məşğuldur -> Atomik Rollback gözlənilir)...`);
    const conflictBatchRes = await request(`/tours/${tourId}/seats/lock`, {
      method: 'POST',
      headers: { 'x-guest-id': userB },
      body: { seatNumbers: [batchA[0], rollbackSeat] }
    });
    assert(conflictBatchRes.status === 409, `Toplu toqquşmada 409 Conflict qaytarıldı (Status: ${conflictBatchRes.status})`);

    // Yoxlayırıq ki, rollbackSeat kilidlənməyib (boş qalıb)
    const checkMatrix = await request(`/tours/${tourId}/seats`);
    const rolledSeat = checkMatrix.data?.data?.seats?.find((s) => s.seatNumber === rollbackSeat);
    assert(rolledSeat?.status === 'AVAILABLE', `Oturacaq #${rollbackSeat} atomik olaraq boş qaldı`);

    // 7. Kilid Müddətini Uzatma (Heartbeat / Extend)
    console.log(`\n7. User A oturacaqların ([${batchA.join(', ')}]) kilid müddətini uzadır (Extend)...`);
    const extendRes = await request(`/tours/${tourId}/seats/extend`, {
      method: 'POST',
      headers: { 'x-guest-id': userA },
      body: { seatNumbers: batchA, extensionSeconds: 120 }
    });
    assert(extendRes.ok, `Kilid müddəti uğurla uzadıldı (Status: ${extendRes.status})`);
    assert(extendRes.data?.data?.extendedSeats?.length === 3, '3 oturacaq üçün vaxt artırıldı');

    // 8. Təhlükəsizlik: User B, User A-nın yerlərini aça bilməz!
    console.log(`\n8. User B, User A-nın oturacağını (#${seat1}) açmağa cəhd edir (Təhlükəsizlik yoxlanışı)...`);
    const unauthorizedRelease = await request(`/tours/${tourId}/seats/release`, {
      method: 'POST',
      headers: { 'x-guest-id': userB },
      body: { seatNumber: seat1 }
    });
    assert(unauthorizedRelease.ok, 'Sorğu icra edildi');
    assert(unauthorizedRelease.data?.data?.status === 'NOT_LOCKED', 'Başqasının kilidini aça bilmədi (Status: NOT_LOCKED)');

    // 9. User A öz yerlərini azad edir (#seat1 və batchA)
    console.log('\n9. User A oturacaqları azad edir (Clean release)...');
    const releaseRes1 = await request(`/tours/${tourId}/seats/release`, {
      method: 'POST',
      headers: { 'x-guest-id': userA },
      body: { seatNumber: seat1 }
    });
    assert(releaseRes1.data?.data?.status === 'RELEASED', `Oturacaq #${seat1} uğurla azad edildi`);

    const releaseRes2 = await request(`/tours/${tourId}/seats/release`, {
      method: 'POST',
      headers: { 'x-guest-id': userA },
      body: { seatNumbers: batchA }
    });
    assert(releaseRes2.data?.data?.releasedSeats?.length === 3, `Oturacaqlar [${batchA.join(', ')}] uğurla azad edildi`);

    // 10. Azad edildikdən sonra User B artıq seat1-i kilidləyə bilir
    console.log(`\n10. Azad edildikdən sonra User B artıq #${seat1}-i kilidləyə bilir...`);
    const lockRes3 = await request(`/tours/${tourId}/seats/lock`, {
      method: 'POST',
      headers: { 'x-guest-id': userB },
      body: { seatNumber: seat1, durationSeconds: 30 }
    });
    assert(lockRes3.ok, `User B üçün #${seat1} uğurla kilidləndi (Status: ${lockRes3.status})`);

    // Təmizlik
    await request(`/tours/${tourId}/seats/release`, {
      method: 'POST',
      headers: { 'x-guest-id': userB },
      body: { seatNumber: seat1 }
    });

    console.log('\n================================================================');
    console.log(`🏁 MƏRHƏLƏ 1 NƏTİCƏ: Bütün ${totalTests} / ${passedTests} testlər 100% UĞURLA KEÇDİ!`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('\n❌ Mərhələ 1 Testlərində Xəta:', error.message);
    process.exit(1);
  }
}

runStage1SeatTests();
