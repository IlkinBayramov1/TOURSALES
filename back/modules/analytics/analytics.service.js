import prisma from '../../config/db.js';

// Helper for date filtering based on predefined periods
function getDateFilter(period) {
  if (!period || period === 'ALL') return null;
  const now = new Date();
  if (period === 'TODAY') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { gte: start };
  }
  if (period === '7D') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { gte: start };
  }
  if (period === '30D') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { gte: start };
  }
  if (period === 'THIS_MONTH') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { gte: start };
  }
  if (period === 'THIS_YEAR') {
    const start = new Date(now.getFullYear(), 0, 1);
    return { gte: start };
  }
  return null;
}

export const analyticsService = {
  // 1. Sales Heatmap: 7 days of week x 24 hours of day
  getSalesHeatmap: async (companyId, period = 'ALL') => {
    const dateFilter = getDateFilter(period);
    const whereClause = {
      status: { notIn: ['CANCELLED', 'REJECTED'] },
      ...(dateFilter ? { bookingDate: dateFilter } : {}),
    };
    if (companyId) {
      whereClause.companyId = companyId;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      select: {
        id: true,
        bookingDate: true,
        totalAmount: true,
        seats: true,
      },
    });

    // Days: 0 (Monday) to 6 (Sunday)
    // Hours: 0 to 23
    const daysNameAz = [
      'Bazar ertəsi',
      'Çərşənbə axşamı',
      'Çərşənbə',
      'Cümə axşamı',
      'Cümə',
      'Şənbə',
      'Bazar'
    ];

    // Initialize 7 x 24 grid
    const heatmap = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        heatmap.push({
          dayIndex: d,
          dayName: daysNameAz[d],
          hour: h,
          hourLabel: `${String(h).padStart(2, '0')}:00`,
          bookingCount: 0,
          revenue: 0,
        });
      }
    }

    let maxBookingsInCell = 0;
    let peakDay = 'Çərşənbə';
    let peakHour = '13:00';

    bookings.forEach((b) => {
      const date = new Date(b.bookingDate);
      const jsDay = date.getDay();
      const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
      const hour = date.getHours();

      const cell = heatmap.find((item) => item.dayIndex === dayIdx && item.hour === hour);
      if (cell) {
        cell.bookingCount += 1;
        cell.revenue += Number(b.totalAmount || 0);
        if (cell.bookingCount > maxBookingsInCell) {
          maxBookingsInCell = cell.bookingCount;
          peakDay = cell.dayName;
          peakHour = cell.hourLabel;
        }
      }
    });

    return {
      heatmap,
      totalAnalyzedBookings: bookings.length,
      peakDay,
      peakHour,
      maxDensity: maxBookingsInCell,
      period,
    };
  },

  // 2. Route Profitability and Occupancy (Load Factor)
  getRouteProfitability: async (companyId, period = 'ALL') => {
    const dateFilter = getDateFilter(period);
    const whereClause = companyId ? { companyId } : {};

    const tours = await prisma.tour.findMany({
      where: whereClause,
      include: {
        bookings: {
          where: {
            status: { notIn: ['CANCELLED', 'REJECTED'] },
            ...(dateFilter ? { bookingDate: dateFilter } : {}),
          },
          select: {
            seats: true,
            totalAmount: true,
            paidAmount: true,
          },
        },
      },
    });

    const routeStats = tours.map((tour) => {
      const totalCapacity = tour.busCapacity || (tour.type === 'DOMESTIC' ? 48 : 30);
      const bookedSeats = tour.bookings.reduce((sum, b) => sum + (b.seats || 1), 0);
      const occupancyRate = totalCapacity > 0 ? Math.min(100, Math.round((bookedSeats / totalCapacity) * 100)) : 0;
      const revenue = tour.bookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

      // Estimated operational cost model (vehicle + guide + driver)
      const estimatedCost = tour.type === 'DOMESTIC' 
        ? Math.round(revenue * 0.55 + 150) 
        : Math.round(revenue * 0.70 + 400);
      const profit = Math.max(0, revenue - estimatedCost);
      const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

      return {
        id: tour.id,
        title: tour.title,
        type: tour.type,
        basePrice: Number(tour.price),
        totalCapacity,
        bookedSeats,
        occupancyRate,
        revenue,
        estimatedProfit: profit,
        marginPercent: margin,
        isDynamicPricingActive: Boolean(tour.dynamicPricingActive),
        surgeThreshold: tour.surgeThreshold ?? 5,
        surgePercent: tour.surgePercent ?? 10,
        lastMinuteHours: tour.lastMinuteHours ?? 36,
        lastMinuteDiscount: tour.lastMinuteDiscount ?? 15,
        lastMinuteMinOccupancy: tour.lastMinuteMinOccupancy ?? 60,
        earlyBirdDays: tour.earlyBirdDays ?? 21,
        earlyBirdDiscount: tour.earlyBirdDiscount ?? 10,
        startDate: tour.startDate,
      };
    });

    // Sort by revenue descending
    routeStats.sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = routeStats.reduce((sum, r) => sum + r.revenue, 0);
    const avgOccupancy = routeStats.length > 0 
      ? Math.round(routeStats.reduce((sum, r) => sum + r.occupancyRate, 0) / routeStats.length) 
      : 0;

    return {
      routes: routeStats,
      totalRevenue,
      avgOccupancy,
      topPerforming: routeStats.slice(0, 5),
      needsAttention: routeStats.filter((r) => r.occupancyRate < 40),
      period,
    };
  },

  // 3. Customer Retention and Cohort
  getCustomerRetention: async (companyId, period = 'ALL') => {
    const dateFilter = getDateFilter(period);
    const whereClause = {
      status: { notIn: ['CANCELLED', 'REJECTED'] },
      ...(dateFilter ? { bookingDate: dateFilter } : {}),
    };
    if (companyId) {
      whereClause.companyId = companyId;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      select: {
        contactEmail: true,
        contactNumber: true,
        totalAmount: true,
        bookingDate: true,
      },
    });

    const customerMap = new Map();

    bookings.forEach((b) => {
      const key = (b.contactEmail || b.contactNumber || 'unknown').toLowerCase().trim();
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          totalBookings: 0,
          totalSpent: 0,
          firstBooking: b.bookingDate,
          lastBooking: b.bookingDate,
        });
      }
      const data = customerMap.get(key);
      data.totalBookings += 1;
      data.totalSpent += Number(b.totalAmount || 0);
      if (new Date(b.bookingDate) < new Date(data.firstBooking)) {
        data.firstBooking = b.bookingDate;
      }
      if (new Date(b.bookingDate) > new Date(data.lastBooking)) {
        data.lastBooking = b.bookingDate;
      }
    });

    const totalUniqueCustomers = customerMap.size;
    let singleTimeBuyers = 0;
    let repeatBuyers = 0; // 2+ bookings
    let loyalVipBuyers = 0; // 4+ bookings
    let totalRevenue = 0;

    customerMap.forEach((data) => {
      totalRevenue += data.totalSpent;
      if (data.totalBookings === 1) singleTimeBuyers++;
      else if (data.totalBookings >= 4) {
        repeatBuyers++;
        loyalVipBuyers++;
      } else {
        repeatBuyers++;
      }
    });

    const repeatRate = totalUniqueCustomers > 0 
      ? Math.round((repeatBuyers / totalUniqueCustomers) * 100) 
      : 0;
    const avgLifetimeValue = totalUniqueCustomers > 0 
      ? Math.round(totalRevenue / totalUniqueCustomers) 
      : 0;

    return {
      totalUniqueCustomers,
      singleTimeBuyers,
      repeatBuyers,
      loyalVipBuyers,
      repeatRatePercent: repeatRate,
      avgLifetimeValue,
      cohortBreakdown: [
        { name: 'İlk Dəfə Alış Edənlər', value: singleTimeBuyers, color: '#94a3b8' },
        { name: 'Təkrar Alış Edənlər (2-3 tur)', value: Math.max(0, repeatBuyers - loyalVipBuyers), color: '#3b82f6' },
        { name: 'Daimi VIP Müştərilər (4+ tur)', value: loyalVipBuyers, color: '#10b981' },
      ],
      period,
    };
  },

  // 4. Time Series Revenue & Bookings Trend
  getRevenueTrend: async (companyId, period = '30D') => {
    const dateFilter = getDateFilter(period);
    const whereClause = {
      status: { notIn: ['CANCELLED', 'REJECTED'] },
      ...(dateFilter ? { bookingDate: dateFilter } : {}),
    };
    if (companyId) {
      whereClause.companyId = companyId;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      select: {
        id: true,
        bookingDate: true,
        totalAmount: true,
        seats: true,
      },
      orderBy: { bookingDate: 'asc' },
    });

    const map = new Map();
    const monthNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];

    bookings.forEach((b) => {
      const d = new Date(b.bookingDate);
      const dateKey = d.toISOString().split('T')[0];
      const label = `${d.getDate()} ${monthNames[d.getMonth()]}`;

      if (!map.has(dateKey)) {
        map.set(dateKey, {
          date: dateKey,
          label,
          revenue: 0,
          bookingsCount: 0,
          seatsCount: 0,
        });
      }
      const entry = map.get(dateKey);
      entry.revenue += Number(b.totalAmount || 0);
      entry.bookingsCount += 1;
      entry.seatsCount += (b.seats || 1);
    });

    const trend = Array.from(map.values());
    const totalRevenue = trend.reduce((sum, item) => sum + item.revenue, 0);
    const totalBookings = trend.reduce((sum, item) => sum + item.bookingsCount, 0);
    const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

    return {
      trend,
      totalRevenue,
      totalBookings,
      avgBookingValue,
      period,
    };
  },

  // 5. Company-specific Yield Audit Logs & Uplift
  getYieldLogs: async (companyId, limit = 50) => {
    let tourIds = undefined;
    const tourMap = new Map();

    if (companyId) {
      const companyTours = await prisma.tour.findMany({
        where: { companyId },
        select: { id: true, title: true, type: true },
      });
      companyTours.forEach((t) => tourMap.set(t.id, t));
      tourIds = companyTours.map((t) => t.id);
    } else {
      const allTours = await prisma.tour.findMany({
        select: { id: true, title: true, type: true },
      });
      allTours.forEach((t) => tourMap.set(t.id, t));
    }

    const where = tourIds ? { tourId: { in: tourIds } } : {};

    const logs = await prisma.dynamicPriceLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    let totalYieldUplift = 0;

    const formattedLogs = logs.map((log) => {
      const tour = tourMap.get(log.tourId);
      const base = Number(log.basePrice);
      const applied = Number(log.appliedPrice);
      const diff = applied - base;
      if (diff > 0) totalYieldUplift += diff;

      return {
        id: log.id,
        tourId: log.tourId,
        tourTitle: tour ? tour.title : 'Tur #' + log.tourId,
        tourType: tour ? tour.type : 'DOMESTIC',
        basePrice: base,
        appliedPrice: applied,
        difference: diff,
        ruleTriggered: log.ruleTriggered,
        occupancyRate: log.occupancyRate !== null ? Math.round(log.occupancyRate) : null,
        createdAt: log.createdAt,
      };
    });

    return {
      logs: formattedLogs,
      totalLogs: formattedLogs.length,
      estimatedYieldUplift: totalYieldUplift,
    };
  },
};
