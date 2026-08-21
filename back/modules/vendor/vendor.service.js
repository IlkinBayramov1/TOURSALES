import prisma from '../../config/db.js';
import ApiError from '../../core/api.error.js';

class VendorService {
  async getDashboardStats(companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw ApiError.notFound('Şirkət tapılmadı.');
    }

    // 1. Turların sayı
    const totalTours = await prisma.tour.count({
      where: { companyId }
    });

    // 2. Təsdiqlənmiş biletlərin (seats) ümumi sayı
    const bookingAggregate = await prisma.booking.aggregate({
      where: {
        companyId,
        status: 'CONFIRMED'
      },
      _sum: {
        seats: true
      }
    });
    const totalSeatsSold = bookingAggregate._sum.seats || 0;

    // 3. Aktiv reklamların və kampaniyaların sayı
    const activeAds = await prisma.ad.count({
      where: {
        companyId,
        status: 'Active'
      }
    });

    const activeCampaigns = await prisma.campaign.count({
      where: {
        companyId,
        status: 'Active'
      }
    });

    // 4. Orta doluluq dərəcəsinin (occupancy rate) hesablanması
    const tours = await prisma.tour.findMany({
      where: { companyId },
      select: {
        maxParticipants: true,
        bookings: {
          where: { status: 'CONFIRMED' },
          select: { seats: true }
        }
      }
    });

    let totalMaxSeats = 0;
    let totalSoldSeats = 0;
    tours.forEach((t) => {
      totalMaxSeats += t.maxParticipants;
      totalSoldSeats += t.bookings.reduce((sum, b) => sum + b.seats, 0);
    });
    const occupancyRate = totalMaxSeats > 0 ? ((totalSoldSeats / totalMaxSeats) * 100).toFixed(2) + '%' : '0.00%';

    // 5. Son 5 rezervasiya məlumatı
    const recentBookings = await prisma.booking.findMany({
      where: { companyId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        tour: {
          select: { title: true }
        }
      }
    });

    // 6. Cari il üzrə aylıq satış göstəriciləri (qrafik üçün)
    const currentYear = new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${currentYear}-12-31T23:59:59.999Z`);

    const transactions = await prisma.transaction.findMany({
      where: {
        companyId,
        type: 'TICKET_SALE',
        status: 'Completed',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        amount: true,
        netAmount: true,
        createdAt: true
      }
    });

    // 12 aylıq massiv qururuq (Azərbaycan dilində aylarla)
    const monthsAz = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
      'Iyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];

    const monthlySales = Array(12).fill(0).map((_, i) => ({
      month: monthsAz[i],
      sales: 0,
      netEarnings: 0
    }));

    transactions.forEach((tx) => {
      const monthIndex = new Date(tx.createdAt).getMonth();
      monthlySales[monthIndex].sales += tx.amount;
      monthlySales[monthIndex].netEarnings += tx.netAmount;
    });

    return {
      companyName: company.name,
      availableBalance: company.availableBalance,
      pendingBalance: company.pendingBalance,
      totalTours,
      totalSeatsSold,
      activeAds,
      activeCampaigns,
      occupancyRate,
      recentBookings,
      monthlySales
    };
  }
}

export const vendorService = new VendorService();
export default vendorService;
