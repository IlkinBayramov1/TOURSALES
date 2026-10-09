import { vendorAxiosClient } from '../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../shared/api/vendorEndpoints';
import { Company, CompanyProfileStats, PasswordChangePayload, CompanySession } from '@toursales/types';

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

  // Təhlükəsizlik: Aktiv Sessiyaları gətir
  getSessions: async (): Promise<CompanySession[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.PROFILE.SESSIONS);
    return res.data?.data || [];
  },

  // Təhlükəsizlik: Digər sessiyalardan çıxış et
  revokeOtherSessions: async (currentSessionId?: string): Promise<{ success: boolean; message: string }> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.PROFILE.REVOKE_SESSIONS, { currentSessionId });
    return res.data?.data || res.data;
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
