import { vendorAxiosClient } from '../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../shared/api/vendorEndpoints';
import { AgencyMember } from '@toursales/types';

export const teamApi = {
  getMembers: async (): Promise<AgencyMember[]> => {
    try {
      const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.TEAM.LIST);
      return res.data?.data || res.data;
    } catch {
      return [
        {
          id: 'mem_1',
          userId: 'usr_1',
          companyId: 'comp_1',
          name: 'Elvin Əliyev',
          email: 'elvin@caspiantour.az',
          role: 'MANAGER',
          createdAt: '2026-01-15T10:00:00.000Z'
        },
        {
          id: 'mem_2',
          userId: 'usr_2',
          companyId: 'comp_1',
          name: 'Aysel Qasımova',
          email: 'aysel@caspiantour.az',
          role: 'ACCOUNTANT',
          createdAt: '2026-02-01T12:00:00.000Z'
        },
        {
          id: 'mem_3',
          userId: 'usr_3',
          companyId: 'comp_1',
          name: 'Murad Məmmədov',
          email: 'murad@caspiantour.az',
          role: 'GUIDE',
          createdAt: '2026-03-10T14:30:00.000Z'
        }
      ];
    }
  },

  inviteMember: async (data: { email: string; name: string; role: 'GUIDE' | 'ACCOUNTANT' | 'MANAGER' }): Promise<AgencyMember> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.TEAM.INVITE, data);
    return res.data?.data || res.data;
  },

  removeMember: async (memberId: string): Promise<void> => {
    await vendorAxiosClient.delete(VENDOR_ENDPOINTS.TEAM.REMOVE(memberId));
  }
};
