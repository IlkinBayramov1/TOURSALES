export type TourType = 'DOMESTIC' | 'FOREIGN';

export type TourStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'CANCELLED' | 'Active' | 'Deactive' | 'Archived' | 'Full' | string;

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

export interface TourReviewsResponse {
  reviews: TourReview[];
  averageRating: number;
  totalReviews: number;
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
  price?: number;
  isVIP?: boolean;
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
  company?: {
    id: string;
    name: string;
    legalName?: string;
    logoUrl?: string | null;
    rating: number;
    phoneNumber?: string;
    city?: string;
    isVerified: boolean;
  } | null;
  isKarabakh?: boolean;
  hasVisaSupport?: boolean;
  hasFlight?: boolean;
  flightIncluded?: boolean;
  passportVisaRequired?: boolean;
  hotelName?: string;
  hotelCategory?: string;
  hotelStars?: number;
  busType?: string;
  guideId?: string | null;
  guide?: {
    id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
  } | null;
  driverName?: string | null;
  driverPhone?: string | null;
  busPlateNumber?: string | null;
  departureNotes?: string | null;
  allowInstallments?: boolean;
  maxInstallmentMonths?: number;
  allowDeposit?: boolean;
  depositPercentage?: number;
  depositDueDaysBefore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GuidePassenger {
  seatNumber: number;
  fullName: string;
  phone: string;
  finCode?: string;
  isCheckedIn: boolean;
  bookingId: string;
  qrToken?: string;
  paymentStatus?: string;
  totalAmount?: number;
  paidAmount?: number;
  remainingBalance?: number;
  isFullyPaid?: boolean;
  hasRemainingDebt?: boolean;
  specialNotes?: string | null;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
}

export interface GuideSeatItem {
  seatNumber: number;
  status: 'EMPTY' | 'RESERVED' | 'CHECKED_IN';
  passenger: GuidePassenger | null;
}

export type GuideSeat = GuideSeatItem;

export interface GuideStaffItem {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: string;
  agencyRole?: string;
}

export interface AssignGuidePayload {
  guideId?: string | null;
  driverName?: string;
  driverPhone?: string;
  busPlateNumber?: string;
  meetingPointAddress?: string;
  departureNotes?: string;
}

export interface GuideManifestResponse {
  tour: {
    id: string;
    title: string;
    type: string;
    startDate: string;
    endDate?: string;
    meetingPointAddress: string;
    meetingPointLat?: number;
    meetingPointLng?: number;
    busCapacity: number;
    busPlateNumber?: string;
    driverName?: string;
    driverPhone?: string;
    departureNotes?: string;
    guide?: { id: string; name: string; phoneNumber?: string; email?: string } | null;
  };
  stats: {
    totalCapacity: number;
    totalBookedSeats: number;
    checkedInCount: number;
    pendingCount: number;
    progressPercentage: number;
    totalRevenue?: number;
    totalDebtAmount?: number;
    debtorCount?: number;
  };
  seatMap: GuideSeatItem[];
  passengers: GuidePassenger[];
}

export interface GuideTourItem {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate?: string;
  meetingPointAddress: string;
  busCapacity: number;
  busPlateNumber: string;
  driverName: string;
  driverPhone: string;
  departureNotes: string;
  guideId?: string | null;
  guide?: { id: string; name: string; phoneNumber?: string } | null;
  totalBookedSeats: number;
  checkedInCount: number;
  pendingCount: number;
  progressPercent: number;
}

export interface TourFilterParams {
  type?: TourType;
  category?: string;
  companyId?: string;
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
