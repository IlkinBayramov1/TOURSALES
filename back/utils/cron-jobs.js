import cron from 'node-cron';
import prisma from '../config/db.js';
import whatsappProvider from '../modules/notifications/whatsapp.provider.js';
import subscriptionsService from '../modules/subscriptions/subscriptions.service.js';

export const startCronJobs = () => {
  // 1. Hər gün saat 00:00-da işləyir (Abunəlik və Arxivlənmə)
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron Job] Gündəlik abunəlik və tur arxivlənməsi yoxlanışı başladı...');
    try {
      const now = new Date();

      // 1. Vaxtı keçmiş Pending abunəlik ödənişlərini 'Overdue' edirik
      const overduePayments = await prisma.subscriptionPayment.updateMany({
        where: {
          dueDate: { lt: now },
          status: 'Pending'
        },
        data: {
          status: 'Overdue'
        }
      });
      console.log(`[Cron Job] ${overduePayments.count} abunəlik ödənişinin statusu 'Overdue' olaraq yeniləndi.`);

      // 2. Başlama tarixi keçmiş turları 'Archived' statusuna gətiririk
      const archivedTours = await prisma.tour.updateMany({
        where: {
          startDate: { lt: now },
          status: 'Active'
        },
        data: {
          status: 'Archived'
        }
      });
      console.log(`[Cron Job] ${archivedTours.count} keçmiş tur 'Archived' statusuna gətirildi.`);

      // 3. Avtomatik abunəlik uzadılması (Balansdan avto-çıxılma)
      const renewSummary = await subscriptionsService.processSubscriptionAutoRenewals();
      console.log(`[Cron Job] Avtomatik abunəlik yenilənməsi tamamlandı:`, renewSummary);

    } catch (error) {
      console.error('[Cron Job] Gündəlik iş zamanı xəta yarandı:', error);
    }
  });

  // 2. Hər 30 dəqiqədən bir işləyir: WhatsApp 24h və 2h çıxış xatırlatmaları
  cron.schedule('*/30 * * * *', async () => {
    try {
      const now = new Date();
      const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);
      const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const in2Hours = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);
      const in1Hour = new Date(now.getTime() + 1 * 60 * 60 * 1000);

      // A) 24 saat qalmış xatırlatma
      const tours24h = await prisma.tour.findMany({
        where: {
          startDate: { gte: in23Hours, lte: in25Hours },
          status: 'Active',
          deletedAt: null
        },
        include: {
          guide: true,
          bookings: { where: { status: 'CONFIRMED', deletedAt: null } }
        }
      });

      for (const tour of tours24h) {
        for (const booking of tour.bookings) {
          const alreadySent = await prisma.notificationDeliveryLog.findFirst({
            where: { bookingId: booking.id, templateName: 'departure_reminder_24h' }
          });
          if (!alreadySent) {
            await whatsappProvider.sendDepartureReminder24h(booking, tour).catch(() => {});
          }
        }
      }

      // B) 2 saat qalmış avtobus anonsu
      const tours2h = await prisma.tour.findMany({
        where: {
          startDate: { gte: in1Hour, lte: in2Hours },
          status: 'Active',
          deletedAt: null
        },
        include: {
          guide: true,
          bookings: { where: { status: 'CONFIRMED', deletedAt: null } }
        }
      });

      for (const tour of tours2h) {
        for (const booking of tour.bookings) {
          const alreadySent = await prisma.notificationDeliveryLog.findFirst({
            where: { bookingId: booking.id, templateName: 'departure_reminder_2h' }
          });
          if (!alreadySent) {
            await whatsappProvider.sendDepartureReminder2h(booking, tour).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error('[Cron Job WhatsApp Reminder Error]', err.message);
    }
  });

  // 3. Hər 1 saatdan bir: 30/70 Depozit Qalıq Ödəniş Xatırlatmaları və Gecikmə Monitorinqi
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron Job] Depozit qalıq ödənişləri və son tarixlər yoxlanılır...');
    try {
      const now = new Date();
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      // Qalıq borcu olan aktiv rezervasiyaları tap
      const pendingDeposits = await prisma.booking.findMany({
        where: {
          paymentType: 'DEPOSIT',
          paymentStatus: { in: ['PARTIALLY_PAID', 'PENDING'] },
          status: { in: ['CONFIRMED', 'PENDING'] },
          deletedAt: null,
          depositDueDate: { not: null }
        },
        include: { tour: true }
      });

      for (const booking of pendingDeposits) {
        const dueDate = new Date(booking.depositDueDate);
        const diffMs = dueDate.getTime() - now.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        const remaining = Number(booking.remainingAmount);

        if (remaining <= 0) continue;

        const balanceUrl = `${frontendUrl}/pay/balance/${booking.id}?token=${booking.balanceToken}`;
        const dueDateStr = dueDate.toLocaleDateString('az-AZ');

        // A) 7 gün qalmış xatırlatma
        if (diffDays <= 7 && diffDays > 6) {
          const alreadySent = await prisma.notificationDeliveryLog.findFirst({
            where: { bookingId: booking.id, templateName: 'deposit_reminder_7d' }
          });
          if (!alreadySent) {
            await whatsappProvider.sendWhatsAppMessage({
              to: booking.contactNumber,
              templateName: 'deposit_reminder_7d',
              bodyText: `Hörmətli ${booking.passengerName}, ${booking.tour.title} turu üçün qalan ${remaining} AZN depozit məbləğinin son ödənişinə 7 gün qaldı (Son tarix: ${dueDateStr}). Qalıq ödəniş linkiniz: ${balanceUrl}`,
              bookingId: booking.id
            }).catch(() => {});
          }
        }

        // B) 3 gün qalmış xatırlatma
        if (diffDays <= 3 && diffDays > 2) {
          const alreadySent = await prisma.notificationDeliveryLog.findFirst({
            where: { bookingId: booking.id, templateName: 'deposit_reminder_3d' }
          });
          if (!alreadySent) {
            await whatsappProvider.sendWhatsAppMessage({
              to: booking.contactNumber,
              templateName: 'deposit_reminder_3d',
              bodyText: `Hörmətli ${booking.passengerName}, ${booking.tour.title} turu üçün qalan ${remaining} AZN məbləğin son ödənişinə 3 gün qaldı! Zəhmət olmasa ödənişi vaxtında tamamlayın: ${balanceUrl}`,
              bookingId: booking.id
            }).catch(() => {});
          }
        }

        // C) 24 saat (1 gün) qalmış təcili xəbərdarlıq
        if (diffDays <= 1 && diffDays > 0) {
          const alreadySent = await prisma.notificationDeliveryLog.findFirst({
            where: { bookingId: booking.id, templateName: 'deposit_reminder_1d' }
          });
          if (!alreadySent) {
            await whatsappProvider.sendWhatsAppMessage({
              to: booking.contactNumber,
              templateName: 'deposit_reminder_1d',
              bodyText: `DİQQƏT: Sabah ${booking.tour.title} turu üçün qalan ${remaining} AZN depozit ödənişinin SON GÜNÜDÜR! Bronunuzun ləğv edilməməsi üçün indi ödəyin: ${balanceUrl}`,
              bookingId: booking.id
            }).catch(() => {});
          }
        }

        // D) Son tarix keçibsə -> OVERDUE statusu
        if (diffDays < 0 && booking.paymentStatus !== 'OVERDUE') {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { paymentStatus: 'OVERDUE' }
          });
          console.log(`[Cron Job] Rezervasiya ${booking.id} üçün depozit son tarixi keçdi. Status: OVERDUE`);
        }
      }
    } catch (err) {
      console.error('[Cron Job Deposit Reminder Error]', err.message);
    }
  });

  console.log('[Cron Job] Gündəlik, WhatsApp və Depozit avtomatlaşdırılmış işləri planlaşdırıldı.');
};
export default startCronJobs;

