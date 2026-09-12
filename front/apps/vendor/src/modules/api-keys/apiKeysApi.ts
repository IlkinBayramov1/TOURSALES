import { vendorAxiosClient } from '../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../shared/api/vendorEndpoints';
import { ApiKey, WebhookConfig, ApiIntegrationStats } from '@toursales/types';

export interface CreateKeyResponse {
  apiKey: ApiKey;
  rawSecretKey: string;
}

export const apiKeysApi = {
  // API Açarları
  getKeys: async (): Promise<ApiKey[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.API_KEYS.LIST);
    return res.data?.data || res.data;
  },

  createKey: async (data: {
    name: string;
    environment?: 'LIVE' | 'TEST';
    scopes?: string[];
    ipWhitelist?: string;
    rateLimitPerMinute?: number;
    expiresDays?: number;
  }): Promise<CreateKeyResponse> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.API_KEYS.CREATE, data);
    return res.data?.data || res.data;
  },

  revokeKey: async (keyId: string): Promise<ApiKey> => {
    const res = await vendorAxiosClient.patch(VENDOR_ENDPOINTS.API_KEYS.REVOKE(keyId));
    return res.data?.data || res.data;
  },

  deleteKey: async (keyId: string): Promise<{ success: boolean; message: string }> => {
    const res = await vendorAxiosClient.delete(VENDOR_ENDPOINTS.API_KEYS.DELETE(keyId));
    return res.data?.data || res.data;
  },

  // KPI Statistika
  getStats: async (): Promise<ApiIntegrationStats> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.API_KEYS.STATS);
    return res.data?.data || res.data;
  },

  // Webhooks
  getWebhooks: async (): Promise<WebhookConfig[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.API_KEYS.WEBHOOKS.LIST);
    return res.data?.data || res.data;
  },

  createWebhook: async (data: {
    name: string;
    url: string;
    events?: string[];
  }): Promise<WebhookConfig> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.API_KEYS.WEBHOOKS.CREATE, data);
    return res.data?.data || res.data;
  },

  testWebhook: async (webhookId: string): Promise<{ success: boolean; message: string }> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.API_KEYS.WEBHOOKS.TEST(webhookId));
    return res.data?.data || res.data;
  },

  deleteWebhook: async (webhookId: string): Promise<{ success: boolean; message: string }> => {
    const res = await vendorAxiosClient.delete(VENDOR_ENDPOINTS.API_KEYS.WEBHOOKS.DELETE(webhookId));
    return res.data?.data || res.data;
  }
};
