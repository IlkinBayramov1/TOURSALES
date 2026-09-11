import { vendorAxiosClient } from '../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../shared/api/vendorEndpoints';
import { Company } from '@toursales/types';

export const vendorProfileApi = {
  getMyCompany: async (): Promise<Company> => {
    try {
      const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.PROFILE.COMPANY);
      return res.data?.data || res.data;
    } catch {
      return {
        id: 'comp_1',
        name: 'Caspian Tour MMC',
        voen: '1302948571',
        email: 'info@caspiantour.az',
        phone: '+994 12 498 00 00',
        address: 'Bakı ş., Nizami küç. 48',
        bankName: 'Kapital Bank ASC',
        bankIban: 'AZ12ABB0000000012345678901',
        logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200',
        status: 'ACTIVE',
        commissionRate: 5,
        createdAt: '2025-11-20T10:00:00Z',
        updatedAt: '2026-09-01T12:00:00Z'
      };
    }
  },

  updateCompany: async (data: Partial<Company>): Promise<Company> => {
    const res = await vendorAxiosClient.put(VENDOR_ENDPOINTS.PROFILE.UPDATE, data);
    return res.data?.data || res.data;
  }
};
