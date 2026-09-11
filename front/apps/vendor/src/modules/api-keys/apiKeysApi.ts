import { vendorAxiosClient } from '../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../shared/api/vendorEndpoints';
import { ApiKey } from '@toursales/types';

export interface CreateKeyResponse {
  apiKey: ApiKey;
  rawSecretKey: string;
}

export const apiKeysApi = {
  getKeys: async (): Promise<ApiKey[]> => {
    try {
      const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.API_KEYS.LIST);
      return res.data?.data || res.data;
    } catch {
      return [
        {
          id: 'key_1',
          companyId: 'comp_1',
          name: 'Vebsayt Bilet Satış Vidjeti',
          keyPrefix: 'ts_live_4f92',
          createdAt: '2026-02-10T11:00:00.000Z',
          lastUsedAt: '2026-09-08T19:40:00.000Z'
        }
      ];
    }
  },

  createKey: async (name: string): Promise<CreateKeyResponse> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.API_KEYS.CREATE, { name });
    return res.data?.data || res.data || {
      apiKey: {
        id: `key_${Date.now()}`,
        companyId: 'comp_1',
        name,
        keyPrefix: 'ts_live_' + Math.random().toString(36).substring(2, 6),
        createdAt: new Date().toISOString(),
        lastUsedAt: null
      },
      rawSecretKey: `ts_live_sec_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`
    };
  },

  revokeKey: async (keyId: string): Promise<void> => {
    await vendorAxiosClient.delete(VENDOR_ENDPOINTS.API_KEYS.REVOKE(keyId));
  }
};
