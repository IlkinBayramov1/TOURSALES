import { vendorAxiosClient } from '../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../shared/api/vendorEndpoints';
import { Company, CompanyProfileStats, PasswordChangePayload } from '@toursales/types';

export const vendorProfileApi = {
  // Şirkətin profil məlumatlarını gətir
  getMyCompany: async (): Promise<Company> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.PROFILE.COMPANY);
    return res.data?.data || res.data;
  },

  // Şirkət profilini və rekvizitlərini yenilə
  updateCompany: async (data: Partial<Company>): Promise<Company> => {
    const res = await vendorAxiosClient.put(VENDOR_ENDPOINTS.PROFILE.UPDATE, data);
    return res.data?.data || res.data;
  },

  // Şirkətin profil statistikası (Aktiv turlar, Cəmi sifarişlər, Reytinq, Dövriyyə)
  getCompanyStats: async (): Promise<CompanyProfileStats> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.PROFILE.STATS);
    return res.data?.data || res.data;
  },

  // Təhlükəsizlik: Şifrənin dəyişdirilməsi
  changePassword: async (payload: PasswordChangePayload): Promise<{ message: string }> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.PROFILE.PASSWORD, payload);
    return { message: res.data?.msg || res.data?.message || 'Şifrə uğurla dəyişdirildi' };
  },

  // Şəkil / Loqo / Sənəd yükləmə
  uploadFile: async (file: File): Promise<{ url: string; fullUrl: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.PROFILE.UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    const data = res.data?.data || res.data;
    return {
      url: data.url || '',
      fullUrl: data.fullUrl || data.url || ''
    };
  }
};
