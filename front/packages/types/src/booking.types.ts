export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'CHECKED_IN'
  | 'COMPLETED';

export type PaymentMethod =
  | 'BIRBANK'
  | 'KAPITAL_BANK'
  | 'STRIPE'
  | 'EMANAT'
  | 'MILLION'
  | 'CASH_DESK';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface PassengerInfo {
  seatNumber: number;
  fullName: string;
  idNumber?: string; // Şəxsiyyət vəsiqəsi / FİN kod
  finCode?: string;
  phone: string;
  passportUrl?: string; // Xarici turlar üçün
  birthDate?: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  userId: string;
  user?: any;
  tourId: string;
  tour?: any;
  tourTitle?: string;
  tourStartDate?: string;
  tourEndDate?: string;
  companyId: string;
  companyName?: string;
  totalAmount: number;
  totalPrice?: number;
  currency: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  passengers: PassengerInfo[];
  qrToken?: string;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
  promoCode?: string | null;
  discountAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SeatLockPayload {
  tourId: string;
  seatNumbers: number[];
}

export interface SeatLockResponse {
  locked: boolean;
  seatNumbers: number[];
  expiresAt: string;
  expiresInSeconds: number;
}

export interface PriceCalculationResult {
  basePrice: number;
  seatsCount: number;
  subtotal: number;
  earlyBirdDiscount: number;
  loyaltyDiscount: number;
  promoDiscount: number;
  totalPrice: number;
  currency: string;
}

export interface CreateBookingPayload {
  tourId: string;
  seatNumbers: number[];
  passengers: PassengerInfo[];
  promoCode?: string;
  paymentMethod: PaymentMethod;
}
