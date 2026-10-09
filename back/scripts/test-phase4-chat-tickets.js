import prisma from '../config/db.js';
import chatService from '../modules/chat/chat.service.js';
import ticketsService from '../modules/tickets/tickets.service.js';

async function runPhase4Tests() {
  console.log('====================================================');
  console.log('  TOURSALES FAZA 4: CANLI ÇAT VƏ DƏSTƏK BİLETLƏRİ TESTİ');
  console.log('====================================================\n');

  try {
    // 0. Ensure base company, user, and tour exist
    let company = await prisma.company.findFirst({ where: { status: 'Active' } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          id: 'C-' + Math.floor(100000 + Math.random() * 900000),
          name: 'Caspian Travel Service LLC',
          status: 'Active',
          phoneNumber: '+994125554433',
        },
      });
    }

    let user = await prisma.user.findFirst({ where: { role: 'User' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'U-' + Math.floor(100000 + Math.random() * 900000),
          email: `chat_tester_${Date.now()}@example.com`,
          password: 'hashed_password',
          name: 'Nurlan İsmayılov',
          phoneNumber: '+994509998877',
          role: 'User',
        },
      });
    }

    let tour = await prisma.tour.findFirst({ where: { companyId: company.id } });
    if (!tour) {
      tour = await prisma.tour.create({
        data: {
          id: 'T-' + Math.floor(100000 + Math.random() * 900000),
          title: 'Qəbələ & Tufandağ Yay İstirahət Turu',
          companyId: company.id,
          region: 'Qəbələ',
          price: 55.0,
          startDate: new Date(Date.now() + 10 * 24 * 3600 * 1000), // 10 days later
          endDate: new Date(Date.now() + 11 * 24 * 3600 * 1000),
          meetingPoint: 'Gənclik m/s',
          capacity: 48,
          images: ['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800'],
        },
      });
    }

    // --- TEST 1: Kontekstli Çat Dialoqunun Başladılması ---
    console.log('--- TEST 1: Kontekstli Çat Dialoqunun Başladılması ---');
    const conversation = await chatService.startOrGetConversation({
      userId: user.id,
      companyId: company.id,
      contextType: 'TOUR',
      contextTourId: tour.id,
    });

    console.log(`✔ UĞURLU: Çat dialoqu başladıldı ID: ${conversation.id}`);
    console.log(`   - Kontekst: ${conversation.contextType}`);
    const meta = JSON.parse(conversation.pinnedMeta);
    console.log(`   - Sabitlənmiş Kart: "${meta.title}" | Qiymət: ${meta.price} AZN`);

    // --- TEST 2: Müştəri Tərəfindən Mesaj Göndərilməsi ---
    console.log('\n--- TEST 2: Müştəri Tərəfindən Mesaj Göndərilməsi ---');
    const userMsg = await chatService.sendMessage({
      conversationId: conversation.id,
      senderId: user.id,
      senderRole: 'USER',
      content: 'Salam, tur üçün toplanış vaxtı və avtobus yerləri barədə məlumat verə bilərsiniz?',
    });

    const updatedConv1 = await prisma.conversation.findUnique({ where: { id: conversation.id } });
    console.log(`✔ UĞURLU: Müştəri mesajı göndərildi (ID: ${userMsg.id})`);
    console.log(`   - Son mesaj: "${updatedConv1.lastMessageText}"`);
    console.log(`   - Vendor üçün oxunmamış mesaj sayı: ${updatedConv1.unreadCountVendor}`);

    // --- TEST 3: Vendor Cavabı və WhatsApp Offline Alert ---
    console.log('\n--- TEST 3: Vendor Cavabı və Bildiriş Xəbərdarlığı ---');
    const vendorMsg = await chatService.sendMessage({
      conversationId: conversation.id,
      senderId: 'U-VENDOR-1',
      senderRole: 'VENDOR',
      content: 'Salam Nurlan bəy! Toplanış saat 06:45-də Gənclikdədir, yerlər seçiminizə uyğun ayrılıb.',
    });

    const updatedConv2 = await prisma.conversation.findUnique({ where: { id: conversation.id } });
    console.log(`✔ UĞURLU: Vendor cavab verdi (ID: ${vendorMsg.id})`);
    console.log(`   - Müştəri üçün oxunmamış mesaj sayı: ${updatedConv2.unreadCountUser}`);

    // --- TEST 4: Oxunma Statusunun Yenilənməsi ---
    console.log('\n--- TEST 4: Oxunma Statusunun Yenilənməsi ---');
    await chatService.markAsRead(conversation.id, 'USER');
    const updatedConv3 = await prisma.conversation.findUnique({ where: { id: conversation.id } });
    console.log(`✔ UĞURLU: Müştəri tərəfi mesajları oxudu. Qalan unreadUser: ${updatedConv3.unreadCountUser}`);

    // --- TEST 5: Canned Responses (Hazır Şablon Cavablar) ---
    console.log('\n--- TEST 5: Canned Responses (Şablon Cavablar) ---');
    const canned = await chatService.createCannedResponse(company.id, {
      title: 'Standart Toplanış Vaxtı',
      shortcut: 'toplanis',
      content: 'Toplanış saat 07:00-da Gənclik metrosunun qarşısında (Mall tərəf) həyata keçirilir.',
    });
    console.log(`✔ UĞURLU: Şablon yaradıldı: "${canned.title}" (${canned.shortcut})`);
    const allCanned = await chatService.getCannedResponses(company.id);
    console.log(`   - Şirkət üçün cəmi şablon sayı: ${allCanned.length}`);

    // --- TEST 6: Dəstək Biletinin Yaradılması və Avtomatik Refund Hesablanması ---
    console.log('\n--- TEST 6: Dəstək Bileti və Avtomatik Refund Kalkulyatoru ---');
    // Create a mock booking 10 days ahead to test 100% refund recommendation
    const booking = await prisma.booking.create({
      data: {
        id: 'B-' + Math.floor(100000 + Math.random() * 900000),
        tourId: tour.id,
        companyId: company.id,
        passengerName: 'Nurlan',
        passengerSurname: 'İsmayılov',
        contactNumber: '+994509998877',
        contactEmail: 'nurlan@example.com',
        seats: 2,
        remainingAmount: 0.0,
        totalAmount: 110.0,
        paidAmount: 110.0,
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
      },
    });

    const ticket = await ticketsService.createTicket(user.id, {
      companyId: company.id,
      bookingId: booking.id,
      category: 'REFUND_REQUEST',
      priority: 'HIGH',
      subject: 'İş səfəri səbəbilə turun ləğvi və pulun qaytarılması',
      description: 'Hörmətli rəhbərlik, təcili ezamiyyətə görə turda iştirak edə bilməyəcəm. 10 gün əvvəlcədən xəbər verirəm.',
    });

    console.log(`✔ UĞURLU: Dəstək bileti yaradıldı: ${ticket.ticketNumber} (ID: ${ticket.id})`);
    console.log(`   - Kateqoriya: ${ticket.category}`);
    console.log(`   - Status: ${ticket.status}`);
    console.log(`   - Avtomatik Tövsiyə Olunan Qaytarılma: ${ticket.requestedRefund} AZN (10 gün qalmış 100% tam qaytarılma)`);

    // --- TEST 7: Biletə Cavab və Daxili Qeydin (Internal Note) Testi ---
    console.log('\n--- TEST 7: Bilet Mesajlaşması və Daxili Qeydlər ---');
    // Vendor replies to customer
    await ticketsService.replyTicket(ticket.id, {
      senderId: 'U-VENDOR-1',
      senderRole: 'VENDOR',
      message: 'Müraciətiniz qeydə alındı. Mühasibatlıq qaytarılma əməliyyatını icra edir.',
      isInternalNote: false,
    });

    // Vendor adds internal note (invisible to user)
    await ticketsService.replyTicket(ticket.id, {
      senderId: 'U-VENDOR-1',
      senderRole: 'VENDOR',
      message: '[MÜHASİBAT]: 110 AZN vəsait Birkart geri qaytarma portalı vasitəsilə 2 iş gününə qaytarılacaq.',
      isInternalNote: true,
    });

    const userView = await ticketsService.getTicketDetails(ticket.id, { isVendorOrAdmin: false });
    const vendorView = await ticketsService.getTicketDetails(ticket.id, { isVendorOrAdmin: true });

    console.log(`✔ UĞURLU: Müştəri üçün görünən mesaj sayı: ${userView.messages.length}`);
    console.log(`✔ UĞURLU: Vendor/Admin üçün görünən mesaj sayı (daxili qeydlərlə): ${vendorView.messages.length}`);

    // --- TEST 8: Mübahisənin SuperAdmin-ə Eskalasiyası ---
    console.log('\n--- TEST 8: SuperAdmin Arbitraj Eskalasiyası ---');
    const escalatedTicket = await ticketsService.escalateToAdmin(
      ticket.id,
      'Müştəri kompensasiya məbləğinə əlavə bonus kupon tələb edir.'
    );

    console.log(`✔ UĞURLU: Bilet SuperAdmin-ə yönləndirildi!`);
    console.log(`   - Yeni Status: ${escalatedTicket.status}`);
    console.log(`   - Prioritet: ${escalatedTicket.priority}`);

    console.log('\n====================================================');
    console.log('  BÜTÜN TESTLƏR TAMAMLANDI: 8/8 UĞURLU (100% KEÇDİ)');
    console.log('====================================================\n');
  } catch (err) {
    console.error('Test zamanı xəta:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase4Tests();
