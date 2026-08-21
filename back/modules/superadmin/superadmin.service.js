import prisma from '../../config/db.js';

class SuperAdminService {
  async getDashboardStats() {
    // 1. Şirkətlərin statuslarına görə sayları
    const companyStatuses = await prisma.company.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const companyStats = {
      Active: 0,
      Pending: 0,
      Suspended: 0,
      Total: 0
    };

    companyStatuses.forEach((statusGroup) => {
      if (statusGroup.status === 'Active') companyStats.Active = statusGroup._count.id;
      if (statusGroup.status === 'Pending') companyStats.Pending = statusGroup._count.id;
      if (statusGroup.status === 'Suspended') companyStats.Suspended = statusGroup._count.id;
      companyStats.Total += statusGroup._count.id;
    });

    // 2. Müştərilərin (Role='User') sayı
    const totalCustomers = await prisma.user.count({
      where: { role: 'User' }
    });

    // 3. Aktiv turların sayı
    const totalActiveTours = await prisma.tour.count({
      where: { status: 'Active' }
    });

    // 4. Maliyyə göstəriciləri
    // 4.1 Bilet satışlarından platforma qazancı (komissiyaların cəmi)
    const ticketCommissionSum = await prisma.transaction.aggregate({
      where: {
        type: 'TICKET_SALE',
        status: 'Completed'
      },
      _sum: {
        commission: true
      }
    });
    const totalCommissionsEarned = ticketCommissionSum._sum.commission || 0;

    // 4.2 Toplanan abunəlik ödənişləri
    const subscriptionPaymentSum = await prisma.subscriptionPayment.aggregate({
      where: {
        status: 'Paid'
      },
      _sum: {
        amount: true
      }
    });
    const totalSubscriptionsEarned = subscriptionPaymentSum._sum.amount || 0;

    // 4.3 Gözləyən payoutların cəmi məbləği
    const pendingPayoutSum = await prisma.payout.aggregate({
      where: {
        status: 'Pending'
      },
      _sum: {
        amount: true
      }
    });
    const totalPendingPayoutAmount = pendingPayoutSum._sum.amount || 0;

    // 5. Gözləyən payout və şirkət qeydiyyatı sorğularının sayı
    const pendingPayoutsCount = await prisma.payout.count({
      where: { status: 'Pending' }
    });

    const pendingCompaniesCount = await prisma.company.count({
      where: { status: 'Pending' }
    });

    // 6. Cari il üzrə aylıq platforma gəlirləri (qrafik üçün)
    const currentYear = new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${currentYear}-12-31T23:59:59.999Z`);

    // Cari ilin komissiya gətirən tranzaksiyaları
    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'TICKET_SALE',
        status: 'Completed',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        commission: true,
        createdAt: true
      }
    });

    // Cari ilin abunəlik ödənişləri
    const subPayments = await prisma.subscriptionPayment.findMany({
      where: {
        status: 'Paid',
        paymentDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        amount: true,
        paymentDate: true
      }
    });

    const monthsAz = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
      'Iyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];

    const monthlyRevenue = Array(12).fill(0).map((_, i) => ({
      month: monthsAz[i],
      commissionRevenue: 0,
      subscriptionRevenue: 0,
      totalRevenue: 0
    }));

    transactions.forEach((tx) => {
      const monthIndex = new Date(tx.createdAt).getMonth();
      monthlyRevenue[monthIndex].commissionRevenue += tx.commission;
      monthlyRevenue[monthIndex].totalRevenue += tx.commission;
    });

    subPayments.forEach((sp) => {
      const monthIndex = new Date(sp.paymentDate).getMonth();
      monthlyRevenue[monthIndex].subscriptionRevenue += sp.amount;
      monthlyRevenue[monthIndex].totalRevenue += sp.amount;
    });

    return {
      companyStats,
      totalCustomers,
      totalActiveTours,
      financeSummary: {
        totalCommissionsEarned,
        totalSubscriptionsEarned,
        totalPendingPayoutAmount,
        totalPlatformEarnings: totalCommissionsEarned + totalSubscriptionsEarned
      },
      pendingRequests: {
        pendingPayoutsCount,
        pendingCompaniesCount
      },
      monthlyRevenue
    };
  }
}

export const superAdminService = new SuperAdminService();
export default superAdminService;
