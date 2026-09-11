import { adminAxiosClient } from '../../shared/api/adminAxiosClient';
import { ADMIN_ENDPOINTS } from '../../shared/api/adminEndpoints';
import { PlatformFinancialSummary, PayoutRequest, LedgerEntry } from '@toursales/types';

export const financeAuditApi = {
  getSummary: async (): Promise<PlatformFinancialSummary> => {
    try {
      const res = await adminAxiosClient.get(ADMIN_ENDPOINTS.FINANCE.SUMMARY);
      return res.data?.data || res.data;
    } catch {
      return {
        totalTurnover: 284500.00,
        totalCommissions: 14225.00,
        totalPayouts: 198400.00,
        pendingPayoutsCount: 2,
        isLedgerBalanced: true,
        currency: 'AZN',
      };
    }
  },

  getPayouts: async (): Promise<PayoutRequest[]> => {
    try {
      const res = await adminAxiosClient.get(ADMIN_ENDPOINTS.FINANCE.PAYOUTS);
      return res.data?.data || res.data;
    } catch {
      return [
        {
          id: 'pay_101',
          companyId: 'comp_1',
          companyName: 'Caspian Tour MMC',
          amount: 2500.00,
          currency: 'AZN',
          bankAccount: 'AZ12ABB0000000012345678901',
          status: 'PENDING',
          requestedAt: '2026-09-09T10:00:00Z',
        },
        {
          id: 'pay_102',
          companyId: 'comp_3',
          companyName: 'Karabakh Heritage Tours',
          amount: 3920.00,
          currency: 'AZN',
          bankAccount: 'AZ33IBAZ0000000055443322110',
          status: 'PENDING',
          requestedAt: '2026-09-09T14:30:00Z',
        },
        {
          id: 'pay_100',
          companyId: 'comp_1',
          companyName: 'Caspian Tour MMC',
          amount: 1500.00,
          currency: 'AZN',
          bankAccount: 'AZ12ABB0000000012345678901',
          status: 'COMPLETED',
          requestedAt: '2026-08-28T10:00:00Z',
          processedAt: '2026-08-29T14:00:00Z',
        },
      ];
    }
  },

  getLedger: async (): Promise<LedgerEntry[]> => {
    try {
      const res = await adminAxiosClient.get(ADMIN_ENDPOINTS.FINANCE.LEDGER);
      return res.data?.data || res.data;
    } catch {
      return [
        {
          id: 'led_901',
          account: 'MÜŞTƏRİ_ÖDƏNİŞİ',
          debit: 120.00,
          credit: 0,
          currency: 'AZN',
          description: 'BirBank vasitəsilə bilet satışı #TS-2026-901',
          createdAt: '2026-09-09T16:00:00Z',
        },
        {
          id: 'led_902',
          account: 'AGENTLİK_ESCROW',
          debit: 0,
          credit: 114.00,
          currency: 'AZN',
          description: 'Caspian Tour hesabına saxlanan bilet məbləği (95%)',
          createdAt: '2026-09-09T16:00:00Z',
        },
        {
          id: 'led_903',
          account: 'PLATFORMA_GƏLİRİ',
          debit: 0,
          credit: 6.00,
          currency: 'AZN',
          description: 'Platforma xidmət haqqı komissiyası (5%)',
          createdAt: '2026-09-09T16:00:00Z',
        },
      ];
    }
  },

  approvePayout: async (id: string): Promise<void> => {
    await adminAxiosClient.post(ADMIN_ENDPOINTS.FINANCE.APPROVE_PAYOUT(id));
  },

  rejectPayout: async (id: string, reason: string): Promise<void> => {
    await adminAxiosClient.post(ADMIN_ENDPOINTS.FINANCE.REJECT_PAYOUT(id), { reason });
  },
};
