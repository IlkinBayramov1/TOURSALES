import prisma from '../../config/db.js';
import currencyService from '../common/currency.service.js';

class PricingEngine {
  // Loyallıq dərəcəsinə görə endirim faizi (Loyalty Tier Discount)
  getLoyaltyTierDiscount(points = 0) {
    if (points >= 1000) return 15; // Platinum: 15%
    if (points >= 500) return 10;  // Gold: 10%
    if (points >= 100) return 5;   // Silver: 5%
    return 0;                      // Bronze: 0%
  }

  // Mərkəzləşdirilmiş Dinamik Qiymətləndirmə Hesablaması
  async calculateFinalPrice(options) {
    const { tourId, seats = 1, loyaltyPoints = 0, promoCode = null, targetCurrency = 'AZN' } = options;

    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include: { bookings: { where: { status: { in: ['CONFIRMED', 'PENDING'] } } } }
    });

    if (!tour) throw new Error('Tur tapılmadı.');

    const basePriceUnit = Number(tour.price);
    const now = new Date();
    const startDate = new Date(tour.startDate);
    const diffMs = startDate - now;
    const daysLeft = diffMs / (1000 * 60 * 60 * 24);

    let pricePerSeat = basePriceUnit;

    // 1. Erkən rezervasiya endirimi (Early Bird - 20%)
    if (daysLeft >= 30) {
      pricePerSeat = pricePerSeat * 0.8;
    } else {
      // 2. Surge Pricing (Son 3 gün və 90% doluluq - 30% artım)
      const soldSeats = tour.bookings.reduce((sum, b) => sum + b.seats, 0);
      const occupancyPercent = tour.maxParticipants > 0 ? (soldSeats / tour.maxParticipants) * 100 : 0;
      if (daysLeft <= 3 && daysLeft >= 0 && occupancyPercent >= 90) {
        pricePerSeat = pricePerSeat * 1.3;
      }
    }

    // 3. Mövsümlülük əmsalı (Seasonality Multiplier - Yay aylarında 15% yüksək)
    const month = startDate.getMonth(); // 0 = Jan, 5 = Jun, 6 = Jul, 7 = Aug
    if (month >= 5 && month <= 7) {
      pricePerSeat = pricePerSeat * 1.15;
    }

    let totalAmountAZN = pricePerSeat * seats;

    // 4. Müştəri Loyallıq Dərəcəsi Endirimi
    const loyaltyDiscountPercent = this.getLoyaltyTierDiscount(loyaltyPoints);
    if (loyaltyDiscountPercent > 0) {
      totalAmountAZN = totalAmountAZN * (1 - loyaltyDiscountPercent / 100);
    }

    // 5. Promo Kod / Kampaniya Endirimi
    let promoDiscountApplied = 0;
    if (promoCode) {
      const campaign = await prisma.campaign.findUnique({
        where: { promoCode, status: 'Active' }
      });

      if (campaign && new Date(campaign.endDate) > now) {
        const val = Number(campaign.discountValue);
        if (campaign.discountType === 'PERCENTAGE') {
          promoDiscountApplied = (totalAmountAZN * val) / 100;
        } else {
          promoDiscountApplied = val;
        }
        totalAmountAZN = Math.max(0, totalAmountAZN - promoDiscountApplied);
      }
    }

    totalAmountAZN = Math.round(totalAmountAZN * 100) / 100;

    // 6. Hədəf Valyutaya Konversiya
    const convertedTotal = currencyService.convert(totalAmountAZN, 'AZN', targetCurrency);
    const convertedUnit = currencyService.convert(pricePerSeat, 'AZN', targetCurrency);

    return {
      tourId,
      seats,
      basePriceAZN: basePriceUnit,
      pricePerSeatAZN: Math.round(pricePerSeat * 100) / 100,
      totalAmountAZN,
      loyaltyDiscountPercent,
      promoDiscountAZN: Math.round(promoDiscountApplied * 100) / 100,
      targetCurrency: targetCurrency.toUpperCase(),
      totalAmountConverted: convertedTotal,
      unitPriceConverted: convertedUnit
    };
  }
}

export const pricingEngine = new PricingEngine();
export default pricingEngine;
