export type CurrencyCode = 'AZN' | 'USD' | 'EUR';

export type LanguageCode = 'az' | 'en' | 'ru';

export interface CurrencyRate {
  code: CurrencyCode;
  symbol: string;
  rateToAZN: number; // 1 USD = 1.70 AZN
}

export interface GeofenceCoordinate {
  lat: number;
  lng: number;
  radiusKm?: number;
  label?: string;
}

export interface SelectOption<T = string> {
  value: T;
  label: string;
  badge?: string;
  disabled?: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

export interface AdPackage {
  id: string;
  name?: string;
  durationDays: number;
  price: number;
  features: string[];
}

export interface Ad {
  id: string;
  title: string;
  imageUrl?: string;
  linkUrl?: string;
  position: 'HERO' | 'SIDEBAR' | 'POPUP' | 'VIP_LIST' | string;
  isActive?: boolean;
  status: 'Active' | 'Paused' | 'Expired' | 'Cancelled' | string;
  startDate: string;
  endDate: string;
  clicksCount?: number;
  viewCount?: number;
  impressionsCount?: number;
  bookingCount?: number;
  amountPaid?: number;
  tourId?: string | null;
  packageId?: string | null;
  tour?: {
    id: string;
    title: string;
    price: number;
    images?: string;
  } | null;
  package?: AdPackage | null;
}

export interface VendorAdsKPI {
  summary: {
    totalImpressions: number;
    totalClicks: number;
    avgCtr: string;
    totalBookings: number;
    totalSpent: number;
    totalRevenueGenerated: number;
    roi: string;
    activeAdsCount: number;
    totalAdsCount: number;
  };
  campaigns: Array<{
    adId: string;
    title: string;
    tourTitle: string | null;
    packageName: string;
    position: string;
    amountPaid: number;
    startDate: string;
    endDate: string;
    status: string;
    viewCount: number;
    clicksCount: number;
    ctr: string;
    bookingCount: number;
    revenueGenerated: number;
  }>;
}

export interface CampaignPromo {
  id: string;
  companyId?: string | null;
  type: string;
  promoCode: string;
  discountType: 'PERCENTAGE' | 'FIXED' | string;
  discountValue: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  description?: string | null;
  status: 'Active' | 'Expired' | string;
  createdAt?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  publishedAt: string;
  tags: string[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}
