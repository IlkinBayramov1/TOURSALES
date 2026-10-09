import { vendorAxiosClient } from '../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../shared/api/vendorEndpoints';
import { CompanyBalance, PayoutRequest, LedgerEntry, SubscriptionPlan } from '@toursales/types';

export interface VendorCompanyBalance extends CompanyBalance {
  totalTurnover?: number;
  totalCommissions?: number;
  netEarnings?: number;
  totalRefunds?: number;
  iban?: string;
  bankName?: string;
  voen?: string;
  swiftBic?: string;
  bankCode?: string;
}

export interface CurrentSubscriptionInfo {
  companyId: string;
  companyName: string;
  planId: string | null;
  planName: string;
  monthlyPrice: number;
  domesticCommission: number;
  foreignCommission: number;
  commissionRate: number;
  features: string[];
  maxTours: number;
  activeToursCount: number;
  maxMembers?: number;
  activeMembersCount?: number;
  maxApiKeys?: number;
  activeApiKeysCount?: number;
  daysLeft?: number;
  autoRenewSubscription?: boolean;
  nextBillingDate?: string | null;
  availableBalance?: number;
}

export interface SubscriptionPaymentItem {
  id: string;
  invoiceNumber: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  paymentDate: string;
  dueDate: string;
  status: string;
  paymentMethod: string;
}

export interface SubscriptionInvoice {
  invoiceNumber: string;
  id: string;
  issueDate: string;
  dueDate: string;
  status: string;
  currency: string;
  seller: {
    name: string;
    voen: string;
    address: string;
    email: string;
    phone: string;
    iban: string;
  };
  customer: {
    id: string;
    name: string;
    voen: string;
    address: string;
    email: string;
    phone: string;
    iban: string;
  };
  items: Array<{
    description: string;
    period: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
}

export interface EscrowTourItem {
  bookingId: string;
  tourTitle: string;
  tourStartDate: string | null;
  tourEndDate: string | null;
  passengerName: string;
  amount: number;
  daysLeft: number;
  releaseDate: string;
  status: string;
}

export interface BankDetailsPayload {
  iban?: string;
  bankName?: string;
  voen?: string;
  swiftBic?: string;
  bankCode?: string;
}

export interface ExtendedLedgerEntry extends LedgerEntry {
  bookingId?: string | null;
  tourTitle?: string | null;
  passengerName?: string | null;
  passengerPhone?: string | null;
  passengerPassport?: string | null;
  amount: number;
  type: string;
  status: string;
  commission?: number;
  netAmount?: number;
}

export const vendorFinanceApi = {
  getBalance: async (): Promise<VendorCompanyBalance> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.FINANCE.OVERVIEW);
    return res.data?.data || res.data;
  },

  getPayoutRequests: async (): Promise<PayoutRequest[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.FINANCE.PAYOUTS);
    return res.data?.data || res.data || [];
  },

  createPayoutRequest: async (data: { amount: number; bankAccount: string }): Promise<PayoutRequest> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.FINANCE.REQUEST_PAYOUT, data);
    return res.data?.data || res.data;
  },

  cancelPayoutRequest: async (payoutId: string): Promise<any> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.FINANCE.CANCEL_PAYOUT(payoutId));
    return res.data?.data || res.data;
  },

  getEscrowDetails: async (): Promise<EscrowTourItem[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.FINANCE.ESCROW_DETAILS);
    return res.data?.data || res.data || [];
  },

  updateBankDetails: async (data: BankDetailsPayload): Promise<any> => {
    const res = await vendorAxiosClient.put(VENDOR_ENDPOINTS.FINANCE.BANK_DETAILS, data);
    return res.data?.data || res.data;
  },

  getLedger: async (params?: { type?: string; status?: string; search?: string; startDate?: string; endDate?: string }): Promise<ExtendedLedgerEntry[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.FINANCE.TRANSACTIONS, { params });
    return res.data?.data || res.data || [];
  },

  downloadEQaimeXML: async (bookingId: string) => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.FINANCE.EQAIME(bookingId));
    const xmlContent = res.data?.data?.xml || res.data?.xml;
    if (!xmlContent) throw new Error('e-Qaimə XML məlumatı tapılmadı');
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `e-Qaime_${bookingId}.xml`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  downloadInvoicePdf: async (bookingId: string) => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.FINANCE.INVOICE_PDF(bookingId), {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Faktura_${bookingId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  getCurrentSubscription: async (): Promise<CurrentSubscriptionInfo> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.SUBSCRIPTION.CURRENT);
    return res.data?.data || res.data;
  },

  getSubscriptions: async (): Promise<SubscriptionPlan[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.SUBSCRIPTION.PLANS);
    const list = res.data?.data || res.data || [];
    return list.map((p: any) => ({
      id: p.id,
      name: p.name,
      monthlyPrice: Number(p.monthlyPrice || 0),
      currency: 'AZN',
      commissionRate: Number(p.domesticCommission || 5),
      domesticCommission: Number(p.domesticCommission || 5),
      foreignCommission: Number(p.foreignCommission || 7),
      maxTours: p.name?.includes('Starter') ? 5 : p.name?.includes('Pro') ? 50 : -1,
      isPopular: p.name?.includes('Pro') || p.name?.includes('Peşəkar'),
      features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []),
    }));
  },

  changeSubscriptionPlan: async (payload: {
    planId: string;
    billingCycle?: 'MONTHLY' | 'YEARLY';
    paymentMethod?: 'BALANCE' | 'CARD' | 'BANK_TRANSFER';
    payFromBalance?: boolean;
  } | string): Promise<any> => {
    const body = typeof payload === 'string' ? { planId: payload } : payload;
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.SUBSCRIPTION.CHANGE_PLAN, body);
    return res.data?.data || res.data;
  },

  getBillingHistory: async (): Promise<SubscriptionPaymentItem[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.SUBSCRIPTION.PAYMENTS);
    return res.data?.data || res.data || [];
  },

  getInvoiceDetails: async (paymentId: string): Promise<SubscriptionInvoice> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.SUBSCRIPTION.INVOICE(paymentId));
    return res.data?.data || res.data;
  },

  toggleAutoRenewal: async (autoRenew: boolean): Promise<any> => {
    const res = await vendorAxiosClient.patch(VENDOR_ENDPOINTS.SUBSCRIPTION.AUTO_RENEWAL, { autoRenew });
    return res.data?.data || res.data;
  },

  exportTransactionsExcel: async (params?: { type?: string; status?: string; startDate?: string; endDate?: string }) => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.FINANCE.EXPORT, {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Maliyye_Tarixcesi_${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
