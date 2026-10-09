import { axiosClient } from '../../../shared/api/axiosClient';
import { API_ENDPOINTS } from '../../../shared/api/apiEndpoints';
import {
  AiConciergeResponse,
  AiParsedCriteria,
  YieldPriceEvaluation,
} from '@toursales/types';

export const aiConciergeApi = {
  // Get tailored recommendations and natural advice from prompt
  getRecommendations: async (prompt: string): Promise<AiConciergeResponse> => {
    const res = await axiosClient.post<{ success: boolean; data: AiConciergeResponse }>(
      API_ENDPOINTS.AI_CONCIERGE.RECOMMEND,
      { prompt }
    );
    return res.data?.data;
  },

  // Parse prompt only
  parsePrompt: async (prompt: string): Promise<AiParsedCriteria> => {
    const res = await axiosClient.post<{ success: boolean; data: AiParsedCriteria }>(
      API_ENDPOINTS.AI_CONCIERGE.PARSE,
      { prompt }
    );
    return res.data?.data;
  },

  // Get dynamic yield pricing for a tour
  getTourYieldPrice: async (tourId: string): Promise<YieldPriceEvaluation> => {
    const res = await axiosClient.get<{ success: boolean; data: YieldPriceEvaluation }>(
      API_ENDPOINTS.YIELD_PRICING.TOUR(tourId)
    );
    return res.data?.data;
  },
};
