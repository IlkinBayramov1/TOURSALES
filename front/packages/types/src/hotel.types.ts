export type HotelCategory =
  | 'HOTEL_1_STAR'
  | 'HOTEL_2_STAR'
  | 'HOTEL_3_STAR'
  | 'HOTEL_4_STAR'
  | 'HOTEL_5_STAR'
  | 'BOUTIQUE'
  | 'RESORT'
  | 'COTTAGE_VILLA'
  | 'HOSTEL';

export type MealPlan = 
  | 'RO' // Room Only
  | 'BB' // Bed & Breakfast
  | 'HB' // Half Board
  | 'FB' // Full Board
  | 'ALL_INCLUSIVE';

export type BedType = 
  | 'SINGLE'
  | 'DOUBLE'
  | 'TWIN'
  | 'QUEEN'
  | 'KING'
  | 'SOFA_BED';

export interface RoomType {
  id: string;
  hotelId: string;
  name: string;
  description?: string;
  capacityAdults: number;
  capacityChildren: number;
  maxOccupancy: number;
  bedType: BedType | string;
  bedCount: number;
  roomSizeSqM?: number | null;
  mealPlan: MealPlan | string;
  basePrice: number;
  currentPrice?: number;
  isSurge?: boolean;
  isDiscount?: boolean;
  surgeType?: string;
  surgeReason?: string;
  totalRoomsCount: number;
  availableRoomsCount?: number;
  amenities: string[];
  images: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Hotel {
  id: string;
  companyId: string;
  name: string;
  legalName?: string | null;
  category: HotelCategory | string;
  starRating: number;
  city: string;
  region: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  checkInTime: string;
  checkOutTime: string;
  description: string;
  amenities: string[];
  cancellationPolicy?: string | null;
  images: string[];
  featuredImage?: string | null;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isActive: boolean;
  allowInstallments: boolean;
  allowDeposit: boolean;
  dynamicPricingActive: boolean;
  minPrice?: number;
  roomTypesCount?: number;
  rooms?: RoomType[];
  roomTypes?: RoomType[];
  company?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    rating?: number;
    phoneNumber?: string | null;
    email?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomAvailabilityMatrixItem {
  date: string;
  dayOfWeek: string;
  basePrice: number;
  effectivePrice: number;
  isOverride: boolean;
  availableCount: number;
  totalRoomsCount: number;
  isBlocked: boolean;
  isSurge: boolean;
  isDiscount: boolean;
  surgeType: string;
}

export interface RoomAvailabilityMatrixResponse {
  room: {
    id: string;
    name: string;
    hotelName: string;
    basePrice: number;
    totalRoomsCount: number;
  };
  matrix: RoomAvailabilityMatrixItem[];
}

export interface HotelBooking {
  id: string;
  bookingNumber: string;
  userId: string;
  companyId: string;
  hotelId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  nightsCount: number;
  roomsCount: number;
  guestsCount: number;
  primaryGuestName: string;
  primaryGuestPhone: string;
  primaryGuestEmail?: string | null;
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string | null;
  guestNotes?: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount?: number;
  depositAmount?: number;
  remainingBalance?: number;
  paymentType: string;
  paymentMethod?: string | null;
  paymentStatus: string;
  status: string;
  balanceToken?: string | null;
  depositDueDate?: string | null;
  installmentMonths?: number | null;
  cancellationReason?: string | null;
  qrCodeToken?: string | null;
  linkedTourBookingId?: string | null;
  crossSellDiscount?: number | null;
  hotel?: {
    id: string;
    name: string;
    city: string;
    address: string;
    starRating: number;
    images?: string[] | string;
    featuredImage?: string | null;
    checkInTime: string;
    checkOutTime: string;
  };
  roomType?: {
    id: string;
    name: string;
    bedType: string;
    mealPlan: string;
  };
  hotelImages?: string[];
  hotelAmenities?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TourHotelCrossSellItem extends Partial<Hotel> {
  id: string;
  packageDiscountPercent: number;
  hotelId?: string;
  hotelName?: string;
  hotelCity?: string;
  hotelStarRating?: number;
  hotelImages?: string[];
  basePrice?: number;
  recommendedRooms?: RoomType[];
}

export interface HotelListResponse {
  hotels: Hotel[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateHotelBookingPayload {
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  roomsCount?: number;
  guestsCount?: number;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  specialRequests?: string;
  paymentType?: 'DEPOSIT_30' | 'FULL_PAYMENT';
  paymentProvider?: string;
  installmentMonths?: number;
  linkedTourBookingId?: string;
}

export interface HotelSearchParams {
  city?: string;
  region?: string;
  category?: string;
  starRating?: number | number[];
  minPrice?: number;
  maxPrice?: number;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  amenities?: string | string[];
  search?: string;
  sort?: 'popular' | 'price_asc' | 'price_desc' | 'rating_desc';
  page?: number;
  limit?: number;
}
