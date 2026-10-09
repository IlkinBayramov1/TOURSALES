export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PARTIALLY_PAID'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'CHECKED_IN'
  | 'COMPLETED';

export type PaymentMethod =
  | 'BIRBANK'
  | 'TAMKART'
  | 'BOLKART'
  | 'ALBALI'
  | 'KAPITAL_BANK'
  | 'STRIPE'
  | 'EMANAT'
  | 'MILLION'
  | 'CASH_DESK';

export type PaymentStatus = 
  | 'PENDING' 
  | 'PAID' 
  | 'PARTIALLY_PAID' 
  | 'OVERDUE' 
  | 'FAILED' 
  | 'REFUNDED';

export type PaymentType = 'FULL' | 'DEPOSIT' | 'INSTALLMENT' | 'BALANCE';

export type InstallmentCardType = 
  | 'BIRKART' 
  | 'TAMKART' 
  | 'BOLKART' 
  | 'ALBALI' 
  | 'STANDARD';

export interface InstallmentOptionItem {
  months: number;
  label: string;
  monthlyPayment: number;
  totalPayment: number;
  formattedMonthly: string;
  isZeroInterest: boolean;
}

export interface BinDetectionResult {
  bin: string;
  bankCode: 'KAPITAL' | 'ABB' | 'BANK_OF_BAKU' | 'UNIBANK' | 'RABITABANK' | 'PASHA_BANK' | 'OTHER';
  bankName: string;
  cardName: string;
  cardBrand: 'VISA' | 'MASTERCARD' | 'AMEX' | 'MIR';
  cardType: 'INSTALLMENT' | 'DEBIT';
  isInstallment: boolean;
  supportedMonths: number[];
  themeColor: string;
  badgeText: string;
  logo: string;
  isLocalCard: boolean;
  installments?: InstallmentOptionItem[];
}

export interface PassengerInfo {
  seatNumber: number;
  fullName: string;
  idNumber?: string; // Şəxsiyyət vəsiqəsi / FİN kod
  finCode?: string; // 7 simvollu FİN kod
  phone: string;
  passportNumber?: string; // Xarici pasport nömrəsi
  passportUrl?: string; // Xarici turlar üçün pasport sənədi/şəkli
  birthDate?: string; // Doğum tarixi (YYYY-MM-DD)
  gender?: 'MALE' | 'FEMALE';
  emergencyPhone?: string; // Təcili əlaqə nömrəsi
  notes?: string; // Xüsusi tələblər və ya qeydlər
  isCheckedIn?: boolean;
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
  paidAmount?: number;
  remainingAmount?: number;
  paymentType?: PaymentType;
  depositDueDate?: string | null;
  depositPaidAt?: string | null;
  balancePaidAt?: string | null;
  balanceToken?: string | null;
  installmentMonths?: number;
  installmentCardType?: string | null;
  seats?: number;
  currency: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  passengers: PassengerInfo[];
  passengerName?: string;
  passengerSurname?: string;
  contactNumber?: string;
  contactEmail?: string;
  busSeatNumber?: string;
  qrToken?: string;
  isCheckedIn?: boolean;
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
  paymentType?: PaymentType;
  installmentMonths?: number;
  installmentCardType?: string;
  passengerName?: string;
  passengerSurname?: string;
  contactNumber?: string;
  contactEmail?: string;
  paidAmount?: number;
  paymentStatus?: string;
}
