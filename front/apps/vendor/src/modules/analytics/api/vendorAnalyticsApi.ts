import { vendorAxiosClient } from '../../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../../shared/api/vendorEndpoints';
import {
  HeatmapResponse,
  RouteProfitabilityResponse,
  CustomerRetentionResponse,
  RevenueTrendResponse,
  YieldPriceEvaluation,
  YieldRulesPayload,
  YieldLogsResponse,
} from '@toursales/types';

export const vendorAnalyticsApi = {
  // Get 7x24 sales heatmap with period filter
  getSalesHeatmap: async (period?: string): Promise<HeatmapResponse> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.ANALYTICS.HEATMAP, {
      params: period ? { period } : undefined,
    });
    return res.data?.data;
  },

  // Get route profitability & occupancy stats with period filter
  getRouteProfitability: async (period?: string): Promise<RouteProfitabilityResponse> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.ANALYTICS.PROFITABILITY, {
      params: period ? { period } : undefined,
    });
    return res.data?.data;
  },

  // Get customer retention and cohort with period filter
  getCustomerRetention: async (period?: string): Promise<CustomerRetentionResponse> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.ANALYTICS.RETENTION, {
      params: period ? { period } : undefined,
    });
    return res.data?.data;
  },

  // Get time series revenue and bookings trend
  getRevenueTrend: async (period?: string): Promise<RevenueTrendResponse> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.ANALYTICS.REVENUE_TREND, {
      params: period ? { period } : undefined,
    });
    return res.data?.data;
  },

  // Get company tours yield pricing overview
  getYieldOverview: async (): Promise<YieldPriceEvaluation[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.YIELD_PRICING.OVERVIEW);
    return res.data?.data || [];
  },

  // Get yield audit logs history
  getYieldLogs: async (limit: number = 50): Promise<YieldLogsResponse> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.ANALYTICS.YIELD_LOGS, {
      params: { limit },
    });
    return res.data?.data || { logs: [], totalLogs: 0, estimatedYieldUplift: 0 };
  },

  // Update dynamic pricing rules for a tour
  updateTourYieldRules: async (tourId: string, payload: YieldRulesPayload) => {
    const res = await vendorAxiosClient.put(VENDOR_ENDPOINTS.YIELD_PRICING.UPDATE_RULES(tourId), payload);
    return res.data?.data;
  },
};
