import { axiosClient } from '../../../shared/api/axiosClient';
import { API_ENDPOINTS } from '../../../shared/api/apiEndpoints';
import { LoyaltyOffer, LoyaltyOverview, RedeemResult, LoyaltyHistoryItem, ApiResponse } from '@toursales/types';

export const loyaltyApi = {
  getOffers: async (): Promise<LoyaltyOffer[]> => {
    const res = await axiosClient.get<ApiResponse<LoyaltyOffer[]>>(API_ENDPOINTS.LOYALTY.OFFERS);
    return res.data?.data || [];
  },

  getOverview: async (): Promise<LoyaltyOverview> => {
    const res = await axiosClient.get<ApiResponse<LoyaltyOverview>>(API_ENDPOINTS.LOYALTY.OVERVIEW);
    return res.data?.data || {
      points: 0,
      tier: 'BRONZE',
      tierDiscount: 0,
      history: []
    };
  },

  redeemOffer: async (offerId: string): Promise<RedeemResult> => {
    const res = await axiosClient.post<ApiResponse<RedeemResult>>(API_ENDPOINTS.LOYALTY.REDEEM, { offerId });
    return res.data?.data;
  },

  getHistory: async (): Promise<LoyaltyHistoryItem[]> => {
    const res = await axiosClient.get<ApiResponse<LoyaltyHistoryItem[]>>(API_ENDPOINTS.LOYALTY.HISTORY);
    return res.data?.data || [];
  }
};
