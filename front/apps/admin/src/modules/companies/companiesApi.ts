import { adminAxiosClient } from '../../shared/api/adminAxiosClient';
import { ADMIN_ENDPOINTS } from '../../shared/api/adminEndpoints';
import { Company, CompanyStatus } from '@toursales/types';

export const companiesApi = {
  getCompanies: async (status?: CompanyStatus): Promise<Company[]> => {
    try {
      const res = await adminAxiosClient.get(ADMIN_ENDPOINTS.COMPANIES.LIST, { params: { status } });
      return res.data?.data || res.data;
    } catch {
      return [
        {
          id: 'comp_1',
          name: 'Caspian Tour MMC',
          voen: '1302948571',
          email: 'info@caspiantour.az',
          phone: '+994 12 498 00 00',
          address: 'Bakı ş., Nizami küç. 48',
          bankName: 'Kapital Bank ASC',
          bankIban: 'AZ12ABB0000000012345678901',
          status: 'ACTIVE',
          commissionRate: 5,
          createdAt: '2025-11-20T10:00:00Z',
          updatedAt: '2026-09-01T12:00:00Z',
        },
        {
          id: 'comp_2',
          name: 'Baku Travel Club MMC',
          voen: '2001948191',
          email: 'contact@bakutravel.az',
          phone: '+994 50 222 33 44',
          address: 'Bakı ş., Fəvvarələr meydanı 12',
          bankName: 'Paşa Bank ASC',
          bankIban: 'AZ44PASH0000000098765432101',
          status: 'PENDING',
          commissionRate: 7,
          createdAt: '2026-09-08T15:30:00Z',
          updatedAt: '2026-09-08T15:30:00Z',
        },
        {
          id: 'comp_3',
          name: 'Karabakh Heritage Tours',
          voen: '1803456122',
          email: 'info@karabakhtours.az',
          phone: '+994 12 555 11 22',
          address: 'Şuşa ş., Pənahəli xan küç. 5',
          bankName: 'ABB Bank',
          bankIban: 'AZ33IBAZ0000000055443322110',
          status: 'ACTIVE',
          commissionRate: 4,
          createdAt: '2026-01-10T09:00:00Z',
          updatedAt: '2026-08-15T14:00:00Z',
        },
        {
          id: 'comp_4',
          name: 'Quba Mountain Guides',
          voen: '1400293847',
          email: 'quba@mountainguides.az',
          phone: '+994 55 999 88 77',
          address: 'Quba ş., Heydər Əliyev pr. 10',
          bankName: 'Kapital Bank',
          bankIban: 'AZ12KAPB0000000077889900112',
          status: 'SUSPENDED',
          commissionRate: 6,
          rejectionReason: 'Lisenziya müddəti bitib, yenilənmə tələb olunur',
          createdAt: '2025-08-01T11:00:00Z',
          updatedAt: '2026-07-20T10:00:00Z',
        }
      ];
    }
  },

  getCompanyById: async (id: string): Promise<Company> => {
    try {
      const res = await adminAxiosClient.get(ADMIN_ENDPOINTS.COMPANIES.DETAIL(id));
      return res.data?.data || res.data;
    } catch {
      const list = await companiesApi.getCompanies();
      const found = list.find((c) => c.id === id);
      if (found) return found;
      return list[0];
    }
  },

  updateStatus: async (id: string, status: CompanyStatus, reason?: string): Promise<Company> => {
    const res = await adminAxiosClient.patch(ADMIN_ENDPOINTS.COMPANIES.UPDATE_STATUS(id), { status, reason });
    return res.data?.data || res.data;
  },

  updateCommission: async (id: string, commissionRate: number): Promise<Company> => {
    const res = await adminAxiosClient.patch(ADMIN_ENDPOINTS.COMPANIES.UPDATE_COMMISSION(id), { commissionRate });
    return res.data?.data || res.data;
  },
};
