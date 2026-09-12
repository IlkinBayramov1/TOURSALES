import prisma from '../../config/db.js';

class SuperAdminService {
  async getDashboardStats() {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${currentYear}-12-31T23:59:59.999Z`);

    // Bütün statistik sorğuları paralel icra edirik (ardıcıl 10x gözləmə əvəzinə tək dövrə)
    const [
      companyStatuses,
      totalCustomers,
      totalActiveTours,
      ticketCommissionSum,
      subscriptionPaymentSum,
      pendingPayoutSum,
      pendingPayoutsCount,
      pendingCompaniesCount,
      transactions,
      subPayments
    ] = await Promise.all([
      prisma.company.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      prisma.user.count({
        where: { role: 'User' }
      }),
      prisma.tour.count({
        where: { status: 'Active' }
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'TICKET_SALE',
          status: 'Completed'
        },
        _sum: { commission: true }
      }),
      prisma.subscriptionPayment.aggregate({
        where: { status: 'Paid' },
        _sum: { amount: true }
      }),
      prisma.payout.aggregate({
        where: { status: 'Pending' },
        _sum: { amount: true }
      }),
      prisma.payout.count({
        where: { status: 'Pending' }
      }),
      prisma.company.count({
        where: { status: 'Pending' }
      }),
      prisma.transaction.findMany({
        where: {
          type: 'TICKET_SALE',
          status: 'Completed',
          createdAt: { gte: startDate, lte: endDate }
        },
        select: {
          commission: true,
          createdAt: true
        }
      }),
      prisma.subscriptionPayment.findMany({
        where: {
          status: 'Paid',
          paymentDate: { gte: startDate, lte: endDate }
        },
        select: {
          amount: true,
          paymentDate: true
        }
      })
    ]);

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

    const totalCommissionsEarned = ticketCommissionSum._sum.commission || 0;
    const totalSubscriptionsEarned = subscriptionPaymentSum._sum.amount || 0;
    const totalPendingPayoutAmount = pendingPayoutSum._sum.amount || 0;

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
