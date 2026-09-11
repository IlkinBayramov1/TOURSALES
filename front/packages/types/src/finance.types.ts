export type PayoutStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

export interface PayoutRequest {
  id: string;
  companyId: string;
  companyName?: string;
  amount: number;
  currency: string;
  bankAccount: string;
  status: PayoutStatus;
  requestedAt: string;
  processedAt?: string | null;
  rejectionReason?: string | null;
}

export interface LedgerEntry {
  id: string;
  companyId?: string | null;
  transactionId?: string | null;
  account: string;
  debit: number;
  credit: number;
  currency: string;
  description: string;
  createdAt: string;
}

export interface CompanyBalance {
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  currency: string;
}

export interface PlatformFinancialSummary {
  totalTurnover: number;
  totalCommissions: number;
  totalPayouts: number;
  pendingPayoutsCount: number;
  isLedgerBalanced: boolean;
  currency: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  customerName: string;
  customerVoen?: string;
  amount: number;
  vatAmount: number;
  pdfUrl?: string;
  eqaimeXmlUrl?: string;
  createdAt: string;
}
