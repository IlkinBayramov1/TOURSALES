import { axiosClient } from '../../../shared/api/axiosClient';
import { API_ENDPOINTS } from '../../../shared/api/apiEndpoints';
import { CompanyPublic, ApiResponse } from '@toursales/types';

export const companyApi = {
  getPublicCompanies: async (limit: number = 20): Promise<CompanyPublic[]> => {
    try {
      const res = await axiosClient.get<ApiResponse<CompanyPublic[]>>(
        API_ENDPOINTS.COMPANIES.PUBLIC_LIST,
        { params: { limit } }
      );
      return res.data?.data || [];
    } catch {
      return [];
    }
  },

  getCompanyById: async (id: string): Promise<CompanyPublic | null> => {
    try {
      const res = await axiosClient.get<ApiResponse<CompanyPublic>>(
        API_ENDPOINTS.COMPANIES.PUBLIC_DETAIL(id)
      );
      return res.data?.data || null;
    } catch {
      return null;
    }
  },
};
