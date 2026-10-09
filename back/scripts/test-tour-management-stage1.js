import prisma from '../config/db.js';
import { toursService } from '../modules/tours/tours.service.js';
import { seatService } from '../modules/tours/seat.service.js';

async function runTourManagementStage1Test() {
  console.log('\n======================================================');
  console.log('🚀 MƏRHƏLƏ 1: TURLARIN İDARƏSİ BACKEND TEST SUITI');
  console.log('======================================================\n');

  try {
    // 1. Şirkət və Mövcud Tur tapılır
    const company = await prisma.company.findFirst({
      where: { id: 'C-586288' }
    });
    if (!company) {
      throw new Error('AzTour şirkəti tapılmadı!');
    }
    console.log(`[Test 1] Şirkət təsdiqləndi: "${company.name}" (ID: ${company.id})`);

    // Mövcud turların siyahısını yoxlayırıq
    const tours = await toursService.getAll({}, company.id);
    console.log(`[Test 2] toursService.getAll: ${tours.length} tur tapıldı`);
    if (tours.length === 0) {
      throw new Error('Şirkət üçün heç bir tur tapılmadı!');
    }
    const sampleTour = tours[0];
    console.log(`         Nümunə Tur: "${sampleTour.title}" (ID: ${sampleTour.id}, Status: ${sampleTour.status})`);

    // 2. Tur Klonlama Testi (cloneTour)
    const newStartDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const newTitle = `${sampleTour.title} (Yeni Həftəsonu Qrupu)`;

    const clonedTour = await toursService.cloneTour(
      sampleTour.id,
      newStartDate,
      null,
      newTitle,
      company.id
    );

    if (!clonedTour || clonedTour.id === sampleTour.id) {
      throw new Error('cloneTour uğursuz oldu və ya eyni ID qaytardı!');
    }
    if (clonedTour.title !== newTitle) {
      throw new Error(`cloneTour başlığı düzgün qeyd etmədi! Gözlənilən: "${newTitle}", Alınan: "${clonedTour.title}"`);
    }
    console.log(`[Test 3] ✅ cloneTour uğurla icra olundu: Yeni ID=${clonedTour.id}, Başlıq="${clonedTour.title}"`);
    console.log(`         Tutumu=${clonedTour.capacity || clonedTour.maxParticipants}, Qiymət=${clonedTour.price} AZN`);

    // 3. Kütləvi Status Dəyişmə Testi (bulkToggleStatus)
    const targetTourIds = [sampleTour.id, clonedTour.id];
    
    // Hamısını 'Active' edirik
    const bulkActiveRes = await toursService.bulkToggleStatus(targetTourIds, 'Active', company.id);
    if (bulkActiveRes.count !== targetTourIds.length || bulkActiveRes.status !== 'Active') {
      throw new Error('bulkToggleStatus (Active) uğursuz oldu!');
    }
    console.log(`[Test 4] ✅ bulkToggleStatus (Active): ${bulkActiveRes.count} tur aktivləşdirildi`);

    // Yoxlayırıq ki, bazada həqiqətən 'Active' oldumu
    const updatedTourCheck = await prisma.tour.findUnique({ where: { id: sampleTour.id } });
    if (updatedTourCheck.status.toLowerCase() !== 'active') {
      throw new Error(`Tur statusu bazada 'Active' olmalı idi, amma '${updatedTourCheck.status}' oldu!`);
    }
    console.log(`         Baza yoxlanışı təsdiqləndi: Status=${updatedTourCheck.status}`);

    // Klonlanan turu 'Deactive' edirik
    const bulkDeactiveRes = await toursService.bulkToggleStatus([clonedTour.id], 'Deactive', company.id);
    if (bulkDeactiveRes.count !== 1 || bulkDeactiveRes.status !== 'Deactive') {
      throw new Error('bulkToggleStatus (Deactive) uğursuz oldu!');
    }
    console.log(`[Test 5] ✅ bulkToggleStatus (Deactive): Klonlanan tur deaktiv edildi`);

    // 4. Vendor Xidməti Yer Kilidləmə Testi (toggleVendorSeatLock)
    const testSeatNumber = 1;
    const testUser = { id: 'U-269805', email: 'aztour@gmail.com' };

    // Əvvəlcə yer kilidlənir
    const lockRes = await seatService.toggleVendorSeatLock(
      clonedTour.id,
      testSeatNumber,
      'Bələdçi & Xidməti Heyət',
      testUser
    );

    if (lockRes.status !== 'LOCKED' || !lockRes.isVendorHold) {
      throw new Error('toggleVendorSeatLock yeri xidməti kilidləmədi!');
    }
    console.log(`[Test 6] ✅ toggleVendorSeatLock (Lock): #${testSeatNumber} yeri uğurla xidməti kilidləndi (${lockRes.reason})`);

    // Oturacaq matrisini gətiririk və yerin 'LOCKED' və isVendorHold olduğunu yoxlayırıq
    const seatMatrix = await seatService.getSeatMatrix(clonedTour.id);
    const seat1 = seatMatrix.matrix.find((s) => s.seatNumber === testSeatNumber);
    if (!seat1 || seat1.status !== 'LOCKED' || !seat1.isVendorHold) {
      throw new Error('getSeatMatrix daxilində yerin xidməti kilid statusu düzgün əks olunmadı!');
    }
    console.log(`[Test 7] ✅ getSeatMatrix yoxlanışı: #${testSeatNumber} yer Status=${seat1.status}, VendorHold=${seat1.isVendorHold}`);

    // İndi təkrar çağırırıq: yer kiliddən azad edilməlidir (Release)
    const releaseRes = await seatService.toggleVendorSeatLock(
      clonedTour.id,
      testSeatNumber,
      'Bələdçi & Xidməti Heyət',
      testUser
    );

    if (releaseRes.status !== 'AVAILABLE' || releaseRes.isVendorHold) {
      throw new Error('toggleVendorSeatLock yeri kiliddən azad etmədi!');
    }
    console.log(`[Test 8] ✅ toggleVendorSeatLock (Release): #${testSeatNumber} yer uğurla kiliddən azad edildi`);

    // 5. Excel Hesabatı Eksportu (exportToursToExcel)
    const excelBuffer = await toursService.exportToursToExcel({}, company.id);
    if (!excelBuffer || excelBuffer.length < 1000) {
      throw new Error('exportToursToExcel etibarlı fayl bufferi yaratmadı!');
    }
    console.log(`[Test 9] ✅ exportToursToExcel: Uğurlu Excel faylı yaradıldı (Ölçü: ${excelBuffer.length} bayt)`);

    // Klonlanan test turunu təmizləyirik (soft-delete)
    await prisma.tour.delete({ where: { id: clonedTour.id } });
    console.log(`[Test 10] ✅ Test təmizliyi: Klonlanan test turu bazadan təmizləndi`);

    console.log('\n======================================================');
    console.log('🎉 MƏRHƏLƏ 1: BÜTÜN 10 TEST UĞURLA TAMAMLANDI! (100% PASS)');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ MƏRHƏLƏ 1 TEST XƏTASI:', err);
    process.exit(1);
  }
}

runTourManagementStage1Test();
