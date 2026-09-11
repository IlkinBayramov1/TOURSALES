import { vendorAxiosClient } from '../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../shared/api/vendorEndpoints';
import { CompanyBalance, PayoutRequest, LedgerEntry, SubscriptionPlan } from '@toursales/types';

export const vendorFinanceApi = {
  getBalance: async (): Promise<CompanyBalance> => {
    try {
      const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.FINANCE.OVERVIEW);
      return res.data?.data || res.data;
    } catch {
      return {
        availableBalance: 4250.00,
        pendingBalance: 1200.00,
        totalWithdrawn: 18450.00,
        currency: 'AZN'
      };
    }
  },

  getPayoutRequests: async (): Promise<PayoutRequest[]> => {
    try {
      const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.FINANCE.TRANSACTIONS);
      return res.data?.data || res.data;
    } catch {
      return [
        {
          id: 'pay_1',
          companyId: 'comp_1',
          amount: 1500,
          currency: 'AZN',
          bankAccount: 'AZ12ABB0000000012345678901',
          status: 'COMPLETED',
          requestedAt: '2026-08-28T10:00:00Z',
          processedAt: '2026-08-29T14:00:00Z'
        },
        {
          id: 'pay_2',
          companyId: 'comp_1',
          amount: 850,
          currency: 'AZN',
          bankAccount: 'AZ12ABB0000000012345678901',
          status: 'PENDING',
          requestedAt: '2026-09-08T09:30:00Z'
        }
      ];
    }
  },

  createPayoutRequest: async (data: { amount: number; bankAccount: string }): Promise<PayoutRequest> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.FINANCE.REQUEST_PAYOUT, data);
    return res.data?.data || res.data;
  },

  getLedger: async (): Promise<LedgerEntry[]> => {
    try {
      const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.FINANCE.TRANSACTIONS);
      return res.data?.data || res.data;
    } catch {
      return [
        {
          id: 'led_1',
          account: 'TUR_SATIŞI',
          debit: 0,
          credit: 120,
          currency: 'AZN',
          description: 'Quba-Qusar turu bilet satışı #BK-9482',
          createdAt: '2026-09-09T14:20:00Z'
        },
        {
          id: 'led_2',
          account: 'KOMISSIYA',
          debit: 6,
          credit: 0,
          currency: 'AZN',
          description: 'Platforma komissiyası (5%) #BK-9482',
          createdAt: '2026-09-09T14:20:00Z'
        }
      ];
    }
  },

  getSubscriptions: async (): Promise<SubscriptionPlan[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.SUBSCRIPTION.CURRENT);
    return res.data?.data || res.data || [];
  },

  changeSubscriptionPlan: async (planId: string): Promise<any> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.SUBSCRIPTION.CHANGE_PLAN, { planId });
    return res.data?.data || res.data;
  }
};
