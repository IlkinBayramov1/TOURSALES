import { axiosClient } from '../../../shared/api/axiosClient';
import { API_ENDPOINTS } from '../../../shared/api/apiEndpoints';
import { Ad, ApiResponse } from '@toursales/types';

export const adsApi = {
  getPublicAds: async (position?: string, limit?: number): Promise<Ad[]> => {
    try {
      const res = await axiosClient.get<ApiResponse<Ad[]>>(API_ENDPOINTS.ADS.PUBLIC, {
        params: { position, limit },
      });
      return res.data?.data || [];
    } catch {
      return [];
    }
  },

  recordClick: async (adId: string): Promise<void> => {
    try {
      await axiosClient.post(API_ENDPOINTS.ADS.CLICK(adId));
    } catch (err) {
      console.warn('Failed to record ad click:', err);
    }
  },
};
