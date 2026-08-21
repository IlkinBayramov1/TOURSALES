import prisma from '../../config/db.js';

class CrmService {
  // 1. Müştəri LTV (Lifetime Value) Hesablanması (contactEmail üzrə)
  async calculateLTV(email) {
    const bookings = await prisma.booking.findMany({
      where: { contactEmail: email, paymentStatus: 'PAID' }
    });

    const totalSpent = bookings.reduce((sum, b) => sum + Number(b.paidAmount || b.totalAmount || 0), 0);
    const bookingCount = bookings.length;
    const avgOrderValue = bookingCount > 0 ? totalSpent / bookingCount : 0;

    return {
      email,
      totalSpent: Math.round(totalSpent * 100) / 100,
      bookingCount,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100
    };
  }

  // 2. Müştəri Seqmentasiyası (Customer Segmentation)
  async getCustomerSegment(email) {
    const ltv = await this.calculateLTV(email);
    const lastBooking = await prisma.booking.findFirst({
      where: { contactEmail: email },
      orderBy: { createdAt: 'desc' }
    });

    let segment = 'NEW';
    const now = Date.now();
    const daysInactive = lastBooking ? (now - new Date(lastBooking.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 999;

    if (ltv.totalSpent >= 1000) {
      segment = 'VIP';
    } else if (daysInactive >= 180 && ltv.bookingCount > 0) {
      segment = 'AT_RISK';
    } else if (ltv.bookingCount >= 2) {
      segment = 'REGULAR';
    }

    return { email, segment, daysInactive: Math.round(daysInactive), ltv };
  }

  // 3. Tərk Edilmiş Biletlərin Bərpası Avtomatlaşdırılması (Cart Recovery Automation)
  async processCartRecovery() {
    const halfHourAgo = new Date(Date.now() - 30 * 60 * 1000);

    const abandonedBookings = await prisma.booking.findMany({
      where: {
        paymentStatus: 'UNPAID',
        status: 'PENDING',
        createdAt: { lte: halfHourAgo }
      },
      include: { tour: true }
    });

    const remindersSent = [];

    for (const b of abandonedBookings) {
      console.log(`[Cart Recovery Automated Alert] Email/WhatsApp sent to: ${b.contactEmail}. Title: Biletinizi tamamlamağı unutmayın! Tour: ${b.tour.title}`);
      remindersSent.push({ bookingId: b.id, email: b.contactEmail, tour: b.tour.title });
    }

    return { processedCount: abandonedBookings.length, remindersSent };
  }
}

export const crmService = new CrmService();
export default crmService;
