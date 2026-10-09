export type CustomTourType =
  | 'INDIVIDUAL'
  | 'FAMILY'
  | 'FRIENDS_GROUP'
  | 'CORPORATE'
  | 'SCHOOL_STUDENT';

export type CustomTourVehicleType =
  | 'SEDAN_4'
  | 'MINIVAN_MERCEDES_VITO_7'
  | 'MINIBUS_MERCEDES_SPRINTER_18'
  | 'BUS_NEOPLAN_50'
  | 'OWN_TRANSPORT';

export type CustomHotelPreference =
  | 'NONE'
  | 'HOTEL_3_STAR'
  | 'HOTEL_4_STAR'
  | 'HOTEL_5_STAR'
  | 'COTTAGES'
  | 'BOUTIQUE';

export type CustomMealPreference =
  | 'NONE'
  | 'BREAKFAST_ONLY'
  | 'HALF_BOARD'
  | 'FULL_BOARD'
  | 'CORPORATE_BANQUET';

export type CustomRequestStatus =
  | 'OPEN_FOR_BIDS'
  | 'BIDS_REVIEW'
  | 'ACCEPTED'
  | 'PAID_CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type CustomBidStatus =
  | 'PENDING'
  | 'SHORTLISTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export interface CustomTourEstimateResponse {
  durationDays: number;
  nights: number;
  totalPassengers: number;
  roomsCount: number;
  estimatedMin: number;
  estimatedMax: number;
  currency: string;
  breakdown: {
    vehicle: number;
    hotel: number;
    meal: number;
    guide: number;
    attractions: number;
  };
}

export interface CustomTourBid {
  id: string;
  bidNumber: string;
  requestId: string;
  companyId: string;
  offeredPrice: number;
  pricePerPerson: number;
  itineraryProgram: string;
  includedServices: string[];
  excludedServices?: string[];
  vehicleDetails?: string | null;
  hotelDetails?: string | null;
  status: CustomBidStatus | string;
  validUntil: string;
  vendorNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    rating?: number;
    phoneNumber?: string | null;
  };
  request?: CustomTourRequest;
}

export interface CustomTourBooking {
  id: string;
  bookingNumber: string;
  requestId: string;
  bidId: string;
  userId: string;
  companyId: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentType: string;
  paymentStatus: string;
  voucherCode: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomTourRequest {
  id: string;
  requestNumber: string;
  userId: string;
  type: CustomTourType | string;
  title: string;
  destinations: string[];
  startDate: string;
  endDate: string;
  durationDays: number;
  adultsCount: number;
  childrenCount: number;
  totalPassengers: number;
  vehicleType: CustomTourVehicleType | string;
  hotelPreference: CustomHotelPreference | string;
  mealPreference: CustomMealPreference | string;
  guideRequired: boolean;
  guideLanguage?: string | null;
  attractions?: string[];
  budgetMin?: number | null;
  budgetMax?: number | null;
  currency: string;
  specialNotes?: string | null;
  status: CustomRequestStatus | string;
  acceptedBidId?: string | null;
  bidsCount: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  bids?: CustomTourBid[];
  booking?: CustomTourBooking | null;
  user?: {
    id?: string;
    name?: string | null;
    email?: string;
    phoneNumber?: string | null;
  };
  hasMyBid?: boolean;
  myBid?: CustomTourBid | null;
}

export interface CreateCustomRequestPayload {
  type?: CustomTourType | string;
  title?: string;
  destinations: string[];
  startDate: string;
  endDate: string;
  adultsCount: number;
  childrenCount?: number;
  vehicleType?: CustomTourVehicleType | string;
  hotelPreference?: CustomHotelPreference | string;
  mealPreference?: CustomMealPreference | string;
  guideRequired?: boolean;
  guideLanguage?: string;
  attractions?: string[];
  budgetMin?: number;
  budgetMax?: number;
  specialNotes?: string;
  expiresHours?: number;
}

export interface SubmitBidPayload {
  offeredPrice: number;
  itineraryProgram: string;
  includedServices: string[];
  excludedServices?: string[];
  vehicleDetails?: string;
  hotelDetails?: string;
  vendorNotes?: string;
  validDays?: number;
}

export interface EstimatePayload {
  startDate?: string;
  endDate?: string;
  adultsCount: number;
  childrenCount?: number;
  vehicleType?: CustomTourVehicleType | string;
  hotelPreference?: CustomHotelPreference | string;
  mealPreference?: CustomMealPreference | string;
  guideRequired?: boolean;
  guideLanguage?: string;
  attractions?: string[];
}
