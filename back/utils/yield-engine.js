/**
 * TOURSALES Smart Yield Management & Dynamic Pricing Engine
 * Faza 3: Dynamic pricing algorithms based on occupancy, demand surge, and last-minute deals.
 */

/**
 * Evaluates real-time rate for a room on a specific date.
 * @param {Object} params
 * @param {number} params.basePrice Base price per night in AZN
 * @param {number} params.availableCount Currently available rooms for this type
 * @param {number} params.totalRoomsCount Total physical rooms of this type
 * @param {Date|string} params.targetDate Target check-in date
 * @param {number} [params.priceOverride] Vendor manual price override if any
 * @param {boolean} [params.dynamicPricingActive=true] Whether dynamic pricing is enabled for the property
 * @returns {Object} Calculated pricing details
 */
export function calculateDynamicRoomRate({
  basePrice,
  availableCount,
  totalRoomsCount,
  targetDate,
  priceOverride = null,
  dynamicPricingActive = true
}) {
  const base = priceOverride !== null && priceOverride !== undefined 
    ? Number(priceOverride) 
    : Number(basePrice);

  if (!dynamicPricingActive) {
    return {
      price: base,
      surgeMultiplier: 1.0,
      surgeType: 'STANDARD',
      isSurge: false,
      isDiscount: false,
      reason: 'Standard base rate'
    };
  }

  const now = new Date();
  const dateObj = new Date(targetDate);
  const diffDays = Math.ceil((dateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const occupancyRate = totalRoomsCount > 0 
    ? (totalRoomsCount - availableCount) / totalRoomsCount 
    : 0;

  // Case 1: High Demand / Low Inventory Surge (+15%)
  // When available rooms <= 2 or occupancy >= 80%
  if (availableCount <= 2 || occupancyRate >= 0.80) {
    const surgeMultiplier = 1.15;
    const finalPrice = Math.round(base * surgeMultiplier * 100) / 100;
    return {
      price: finalPrice,
      originalPrice: base,
      surgeMultiplier,
      surgeType: 'HIGH_DEMAND_SURGE',
      isSurge: true,
      isDiscount: false,
      reason: 'Yüksək tələbat: Otaqların 80%+-i dolub və ya son 2 otaq qalıb (+15%)'
    };
  }

  // Case 2: Last Minute Deal (-15%)
  // When check-in is within 48 hours and occupancy is below 50%
  if (diffDays >= 0 && diffDays <= 2 && occupancyRate < 0.50 && availableCount > 0) {
    const surgeMultiplier = 0.85;
    const finalPrice = Math.round(base * surgeMultiplier * 100) / 100;
    return {
      price: finalPrice,
      originalPrice: base,
      surgeMultiplier,
      surgeType: 'LAST_MINUTE_DEAL',
      isSurge: false,
      isDiscount: true,
      reason: 'Son Dəqiqə Fürsəti: 48 saat qalmış boş qalan otaqlar üçün xüsusi endirim (-15%)'
    };
  }

  // Case 3: Weekend Premium (+10% on Friday & Saturday nights)
  const dayOfWeek = dateObj.getDay(); // 5 = Friday, 6 = Saturday
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    const surgeMultiplier = 1.10;
    const finalPrice = Math.round(base * surgeMultiplier * 100) / 100;
    return {
      price: finalPrice,
      originalPrice: base,
      surgeMultiplier,
      surgeType: 'WEEKEND_PREMIUM',
      isSurge: true,
      isDiscount: false,
      reason: 'Həftəsonu tarifləri (+10%)'
    };
  }

  return {
    price: base,
    surgeMultiplier: 1.0,
    surgeType: 'STANDARD',
    isSurge: false,
    isDiscount: false,
    reason: 'Standart günlük baza tarif'
  };
}

/**
 * Evaluates dynamic pricing for a tour.
 * @param {Object} params
 * @param {number} params.basePrice
 * @param {number} params.capacity
 * @param {number} params.bookedSeats
 * @param {Date|string} params.startDate
 * @returns {Object}
 */
export function calculateDynamicTourPrice({
  basePrice,
  capacity,
  bookedSeats,
  startDate
}) {
  const base = Number(basePrice);
  const remainingSeats = Math.max(0, capacity - bookedSeats);
  const now = new Date();
  const start = new Date(startDate);
  const hoursLeft = Math.floor((start.getTime() - now.getTime()) / (1000 * 60 * 60));

  // Son 5 yer qaldıqda +10% tələbat artımı
  if (remainingSeats > 0 && remainingSeats <= 5) {
    const finalPrice = Math.round(base * 1.10 * 100) / 100;
    return {
      price: finalPrice,
      originalPrice: base,
      multiplier: 1.10,
      isSurge: true,
      isDiscount: false,
      label: 'Yüksək Tələbat (+10%)',
      reason: 'Avtobusda son 5 yer qaldı'
    };
  }

  // Çıxışa 24 saatdan az qaldıqda və 8-dən çox boş yer varsa: -10% son dəqiqə
  if (hoursLeft > 0 && hoursLeft <= 24 && remainingSeats >= 8) {
    const finalPrice = Math.round(base * 0.90 * 100) / 100;
    return {
      price: finalPrice,
      originalPrice: base,
      multiplier: 0.90,
      isSurge: false,
      isDiscount: true,
      label: 'Son Dəqiqə Fürsəti (-10%)',
      reason: 'Çıxışa 24 saat qaldı'
    };
  }

  return {
    price: base,
    multiplier: 1.0,
    isSurge: false,
    isDiscount: false,
    label: 'Standart Qiymət',
    reason: 'Standart bilet tarifi'
  };
}
