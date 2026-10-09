import prisma from '../../config/db.js';

export const yieldPricingService = {
  // Evaluate dynamic price for a single tour
  evaluateTourDynamicPrice: async (tourId) => {
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include: {
        bookings: {
          where: { status: { notIn: ['CANCELLED', 'REJECTED'] } },
          select: { seats: true },
        },
      },
    });

    if (!tour) {
      throw new Error('Tur tapılmadı');
    }

    const basePrice = Number(tour.price);
    const totalCapacity = tour.busCapacity || (tour.type === 'DOMESTIC' ? 48 : 30);
    const bookedSeats = tour.bookings.reduce((sum, b) => sum + (b.seats || 1), 0);
    const remainingSeats = Math.max(0, totalCapacity - bookedSeats);
    const occupancyRate = totalCapacity > 0 ? Math.min(100, Math.round((bookedSeats / totalCapacity) * 100)) : 0;

    // Default standard response if dynamic pricing is disabled
    if (!tour.dynamicPricingActive) {
      return {
        tourId: tour.id,
        basePrice,
        appliedPrice: basePrice,
        difference: 0,
        ruleTriggered: 'STANDARD',
        badge: null,
        totalCapacity,
        bookedSeats,
        remainingSeats,
        occupancyRate,
        dynamicPricingActive: false,
      };
    }

    const now = new Date();
    const startDate = new Date(tour.startDate);
    const diffMs = startDate.getTime() - now.getTime();
    const hoursUntilDeparture = Math.round(diffMs / (1000 * 60 * 60));
    const daysUntilDeparture = Math.round(hoursUntilDeparture / 24);

    let appliedPrice = basePrice;
    let ruleTriggered = 'STANDARD';
    let badge = null;

    const surgeThreshold = tour.surgeThreshold || 5;
    const surgePercent = tour.surgePercent || 10;
    const lastMinuteHours = tour.lastMinuteHours || 36;
    const lastMinuteDiscount = tour.lastMinuteDiscount || 15;
    const lastMinuteMinOccupancy = tour.lastMinuteMinOccupancy || 60;
    const earlyBirdDays = tour.earlyBirdDays || 21;
    const earlyBirdDiscount = tour.earlyBirdDiscount || 10;

    // RULE 1: Surge Pricing (High Demand)
    if (remainingSeats <= surgeThreshold && occupancyRate >= 80 && remainingSeats > 0) {
      appliedPrice = Math.round(basePrice * (1 + surgePercent / 100));
      ruleTriggered = 'SURGE_HIGH_DEMAND';
      badge = `🔥 Tələbat Yüksəkdir — Son ${remainingSeats} Yer!`;
    }
    // RULE 2: Last-Minute Flash Deal
    else if (hoursUntilDeparture > 0 && hoursUntilDeparture <= lastMinuteHours && occupancyRate < lastMinuteMinOccupancy) {
      appliedPrice = Math.round(basePrice * (1 - lastMinuteDiscount / 100));
      ruleTriggered = 'LAST_MINUTE_FLASH';
      badge = `⚡ Son Dəqiqə Fürsəti -${lastMinuteDiscount}%`;
    }
    // RULE 3: Early Bird Promotion
    else if (daysUntilDeparture >= earlyBirdDays) {
      appliedPrice = Math.round(basePrice * (1 - earlyBirdDiscount / 100));
      ruleTriggered = 'EARLY_BIRD_DISCOUNT';
      badge = `🌱 Erkən Rezervasiya -${earlyBirdDiscount}%`;
    }

    // Audit log if non-standard
    if (ruleTriggered !== 'STANDARD') {
      try {
        await prisma.dynamicPriceLog.create({
          data: {
            tourId: tour.id,
            basePrice,
            appliedPrice,
            ruleTriggered,
            occupancyRate,
          },
        });
      } catch (err) {
        console.error('Failed to log dynamic price audit:', err);
      }
    }

    return {
      tourId: tour.id,
      basePrice,
      appliedPrice,
      difference: appliedPrice - basePrice,
      ruleTriggered,
      badge,
      totalCapacity,
      bookedSeats,
      remainingSeats,
      occupancyRate,
      hoursUntilDeparture,
      dynamicPricingActive: true,
    };
  },

  // Update yield rules for a tour
  updateTourYieldRules: async (tourId, payload) => {
    const updated = await prisma.tour.update({
      where: { id: tourId },
      data: {
        dynamicPricingActive: payload.dynamicPricingActive !== undefined ? Boolean(payload.dynamicPricingActive) : undefined,
        surgeThreshold: payload.surgeThreshold !== undefined ? Number(payload.surgeThreshold) : undefined,
        surgePercent: payload.surgePercent !== undefined ? Number(payload.surgePercent) : undefined,
        lastMinuteHours: payload.lastMinuteHours !== undefined ? Number(payload.lastMinuteHours) : undefined,
        lastMinuteDiscount: payload.lastMinuteDiscount !== undefined ? Number(payload.lastMinuteDiscount) : undefined,
        lastMinuteMinOccupancy: payload.lastMinuteMinOccupancy !== undefined ? Number(payload.lastMinuteMinOccupancy) : undefined,
        earlyBirdDays: payload.earlyBirdDays !== undefined ? Number(payload.earlyBirdDays) : undefined,
        earlyBirdDiscount: payload.earlyBirdDiscount !== undefined ? Number(payload.earlyBirdDiscount) : undefined,
      },
    });

    return updated;
  },

  // Get dynamic pricing overview for all tours of a company
  getCompanyToursYieldOverview: async (companyId) => {
    const whereClause = companyId ? { companyId } : {};
    const tours = await prisma.tour.findMany({
      where: whereClause,
      select: { id: true, title: true, price: true, dynamicPricingActive: true },
    });

    const results = await Promise.all(
      tours.map(async (t) => {
        try {
          return await yieldPricingService.evaluateTourDynamicPrice(t.id);
        } catch {
          return {
            tourId: t.id,
            basePrice: Number(t.price),
            appliedPrice: Number(t.price),
            ruleTriggered: 'STANDARD',
            badge: null,
            dynamicPricingActive: Boolean(t.dynamicPricingActive),
          };
        }
      })
    );

    return results;
  },
};
