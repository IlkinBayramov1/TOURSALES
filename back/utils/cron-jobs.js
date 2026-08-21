import cron from 'node-cron';
import prisma from '../config/db.js';

export const startCronJobs = () => {
  // Hər gün saat 00:00-da işləyir
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

    } catch (error) {
      console.error('[Cron Job] Gündəlik iş zamanı xəta yarandı:', error);
    }
  });

  console.log('[Cron Job] Gündəlik avtomatlaşdırılmış işlər (Cron Jobs) planlaşdırıldı.');
};
export default startCronJobs;
