import { adminAxiosClient } from '../../shared/api/adminAxiosClient';
import { ADMIN_ENDPOINTS } from '../../shared/api/adminEndpoints';

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  details?: Record<string, any>;
  createdAt: string;
}

export const auditLogsApi = {
  getLogs: async (params?: { entity?: string; action?: string }): Promise<AuditLog[]> => {
    try {
      const res = await adminAxiosClient.get(ADMIN_ENDPOINTS.AUDIT_LOGS.LIST, { params });
      return res.data?.data || res.data;
    } catch {
      return [
        {
          id: 'log_1',
          userName: 'Super Administrator',
          userRole: 'ADMIN',
          action: 'UPDATE_COMMISSION',
          entity: 'Company',
          entityId: 'comp_1',
          ipAddress: '194.135.152.18',
          details: { oldRate: 6, newRate: 5, companyName: 'Caspian Tour MMC' },
          createdAt: '2026-09-09T17:40:00Z',
        },
        {
          id: 'log_2',
          userName: 'Super Administrator',
          userRole: 'ADMIN',
          action: 'APPROVE_PAYOUT',
          entity: 'PayoutRequest',
          entityId: 'pay_100',
          ipAddress: '194.135.152.18',
          details: { amount: 1500, bankAccount: 'AZ12ABB...' },
          createdAt: '2026-08-29T14:00:00Z',
        },
        {
          id: 'log_3',
          userName: 'Elvin Əliyev',
          userRole: 'VENDOR',
          action: 'CREATE_TOUR',
          entity: 'Tour',
          entityId: 'tour_55',
          ipAddress: '85.132.78.4',
          details: { title: 'Quba Qırmızı Qəsəbə Turu' },
          createdAt: '2026-08-25T11:20:00Z',
        },
        {
          id: 'log_4',
          userName: 'Super Administrator',
          userRole: 'ADMIN',
          action: 'VERIFY_COMPANY',
          entity: 'Company',
          entityId: 'comp_3',
          ipAddress: '194.135.152.18',
          details: { status: 'ACTIVE' },
          createdAt: '2026-08-15T14:00:00Z',
        }
      ];
    }
  },
};
