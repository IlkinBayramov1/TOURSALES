export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface LoyaltyOffer {
  id: string;
  partnerName: string;
  offerName: string;
  description: string;
  requiredPoints: number;
  maxUsage: number;
  usedCount: number;
  category: 'FOOD' | 'SERVICE' | 'TRAVEL' | 'TRANSPORT' | string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface LoyaltyHistoryItem {
  id: string;
  points: number;
  description: string;
  type: 'EARNED' | 'REDEEMED' | 'SPENT';
  date: string;
}

export interface LoyaltyOverview {
  points: number;
  tier: LoyaltyTier;
  tierDiscount: number;
  history: LoyaltyHistoryItem[];
}

export interface RedeemResult {
  id: string;
  voucherCode: string;
  offerName: string;
  partnerName: string;
  pointsSpent: number;
  remainingPoints: number;
  createdAt: string;
}
