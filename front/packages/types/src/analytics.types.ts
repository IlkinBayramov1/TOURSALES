export interface HeatmapCell {
  dayIndex: number;
  dayName: string;
  hour: number;
  hourLabel: string;
  bookingCount: number;
  revenue: number;
}

export interface HeatmapResponse {
  heatmap: HeatmapCell[];
  totalAnalyzedBookings: number;
  peakDay: string;
  peakHour: string;
  maxDensity: number;
}

export interface RouteProfitability {
  id: string;
  title: string;
  type: string;
  basePrice: number;
  totalCapacity: number;
  bookedSeats: number;
  occupancyRate: number;
  revenue: number;
  estimatedProfit: number;
  marginPercent: number;
  isDynamicPricingActive: boolean;
  surgeThreshold?: number;
  surgePercent?: number;
  lastMinuteHours?: number;
  lastMinuteDiscount?: number;
  lastMinuteMinOccupancy?: number;
  earlyBirdDays?: number;
  earlyBirdDiscount?: number;
  startDate?: string;
}

export interface RouteProfitabilityResponse {
  routes: RouteProfitability[];
  totalRevenue: number;
  avgOccupancy: number;
  topPerforming: RouteProfitability[];
  needsAttention: RouteProfitability[];
  period?: string;
}

export interface RevenueTrendPoint {
  date: string;
  label: string;
  revenue: number;
  bookingsCount: number;
  seatsCount: number;
}

export interface RevenueTrendResponse {
  trend: RevenueTrendPoint[];
  totalRevenue: number;
  totalBookings: number;
  avgBookingValue: number;
  period: string;
}

export interface YieldLogItem {
  id: string;
  tourId: string | null;
  tourTitle: string;
  tourType: string;
  basePrice: number;
  appliedPrice: number;
  difference: number;
  ruleTriggered: 'SURGE_HIGH_DEMAND' | 'LAST_MINUTE_FLASH' | 'EARLY_BIRD_DISCOUNT' | 'STANDARD' | string;
  occupancyRate: number | null;
  createdAt: string;
}

export interface YieldLogsResponse {
  logs: YieldLogItem[];
  totalLogs: number;
  estimatedYieldUplift: number;
}

export interface CustomerRetentionCohortItem {
  name: string;
  value: number;
  color: string;
}

export interface CustomerRetentionResponse {
  totalUniqueCustomers: number;
  singleTimeBuyers: number;
  repeatBuyers: number;
  loyalVipBuyers: number;
  repeatRatePercent: number;
  avgLifetimeValue: number;
  cohortBreakdown: CustomerRetentionCohortItem[];
}

export interface YieldPriceEvaluation {
  tourId: string;
  basePrice: number;
  appliedPrice: number;
  difference: number;
  ruleTriggered: 'SURGE_HIGH_DEMAND' | 'LAST_MINUTE_FLASH' | 'EARLY_BIRD_DISCOUNT' | 'STANDARD' | string;
  badge: string | null;
  totalCapacity: number;
  bookedSeats: number;
  remainingSeats: number;
  occupancyRate: number;
  hoursUntilDeparture?: number;
  dynamicPricingActive: boolean;
}

export interface YieldRulesPayload {
  dynamicPricingActive?: boolean;
  surgeThreshold?: number;
  surgePercent?: number;
  lastMinuteHours?: number;
  lastMinuteDiscount?: number;
  lastMinuteMinOccupancy?: number;
  earlyBirdDays?: number;
  earlyBirdDiscount?: number;
}

export interface AiParsedCriteria {
  rawPrompt: string;
  pax: number;
  groupType: 'FAMILY' | 'COUPLE' | 'GROUP' | 'SOLO' | string;
  maxBudget: number | null;
  destinations: string[];
  tags: string[];
  category: string;
}

export interface AiRecommendationPackage {
  badge: string;
  tagline: string;
  tour: {
    id: string;
    title: string;
    price: number;
    estTotalPrice: number;
    type: string;
    startDate?: string;
    companyName: string;
    rating: number;
    images: string[];
  };
  highlights: string[];
}

export interface AiConciergeResponse {
  criteria: AiParsedCriteria;
  advice: string;
  packages: AiRecommendationPackage[];
}
