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

export interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  position: 'HERO' | 'SIDEBAR' | 'POPUP';
  isActive: boolean;
  startDate: string;
  endDate: string;
  clicksCount?: number;
  impressionsCount?: number;
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
