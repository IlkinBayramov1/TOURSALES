export type TourType = 'DOMESTIC' | 'FOREIGN';

export type TourStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'CANCELLED';

export type TourRegion =
  | 'Baku'
  | 'Quba'
  | 'Qusar'
  | 'Shusha'
  | 'Lachin'
  | 'Khankendi'
  | 'Aghdam'
  | 'Sheki'
  | 'Gabala'
  | 'Lankaran'
  | 'Ganja'
  | 'Georgia'
  | 'Turkey'
  | 'UAE'
  | 'Europe';

export interface ItineraryItem {
  id?: string;
  day: number;
  time: string;
  title: string;
  description: string;
}

export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED' | 'SELECTED';

export interface BusSeat {
  seatNumber: number;
  row: number;
  column: number; // 1, 2 (sol), 3, 4 (sağ) və ya dəhliz
  status: SeatStatus;
  lockedBy?: string;
  lockExpiresAt?: string;
  priceModifier?: number;
}

export interface SeatMatrix {
  tourId: string;
  busType: 'SPRINTER' | 'STANDARD_48' | 'VIP_30';
  totalSeats: number;
  availableSeats: number;
  seats: BusSeat[];
}

export interface TourReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  verifiedBooking?: boolean;
}

export interface Tour {
  id: string;
  title: string;
  slug?: string;
  description: string;
  type: TourType;
  region: TourRegion | string;
  destinationCountry?: string;
  basePrice: number;
  currency: string;
  startDate: string;
  endDate: string;
  meetingPoint: string;
  meetingLat?: number;
  meetingLng?: number;
  images: string[];
  capacity: number;
  availableSeats: number;
  status: TourStatus;
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryItem[];
  companyId: string;
  companyName?: string;
  companyLogo?: string;
  rating?: number;
  ratingAvg?: number;
  reviewsCount?: number;
  reviewCount?: number;
  reviews?: TourReview[];
  category?: 'DOMESTIC' | 'FOREIGN';
  location?: string;
  destination?: string;
  isGuaranteed?: boolean;
  earlyBirdDiscount?: number;
  company?: any;
  isKarabakh?: boolean;
  hasVisaSupport?: boolean;
  hasFlight?: boolean;
  flightIncluded?: boolean;
  passportVisaRequired?: boolean;
  hotelName?: string;
  hotelCategory?: string;
  hotelStars?: number;
  busType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TourFilterParams {
  type?: TourType;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  rating?: number;
  search?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}
