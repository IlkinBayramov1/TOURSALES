import { vendorAxiosClient } from '../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../shared/api/vendorEndpoints';
import { Ad, AdPackage, VendorAdsKPI, CampaignPromo } from '@toursales/types';

export const vendorAdsApi = {
  // Reklam paketləri
  getPackages: async (): Promise<AdPackage[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.ADS.PACKAGES);
    return res.data?.data || res.data;
  },

  // Reklamların siyahısı
  getAds: async (filters: { status?: string; position?: string; search?: string } = {}): Promise<Ad[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.ADS.LIST, { params: filters });
    return res.data?.data || res.data;
  },

  // KPI analitikası
  getKPI: async (): Promise<VendorAdsKPI> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.ADS.KPI);
    return res.data?.data || res.data;
  },

  // Reklam almaq / başlatmaq
  purchaseAd: async (data: {
    tourId?: string;
    packageId: string;
    position?: string;
    title?: string;
    imageUrl?: string;
    linkUrl?: string;
  }): Promise<Ad> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.ADS.PURCHASE, data);
    return res.data?.data || res.data;
  },

  // Statusu dəyişmək (Active <-> Paused)
  toggleStatus: async (id: string): Promise<Ad> => {
    const res = await vendorAxiosClient.patch(VENDOR_ENDPOINTS.ADS.STATUS(id));
    return res.data?.data || res.data;
  },

  // Reklamı silmək
  deleteAd: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await vendorAxiosClient.delete(VENDOR_ENDPOINTS.ADS.DELETE(id));
    return res.data?.data || res.data;
  },

  // Promokodların siyahısı
  getPromoCodes: async (): Promise<CampaignPromo[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.CAMPAIGNS.LIST, {
      params: { companyOnly: true }
    });
    return res.data?.data || res.data;
  },

  // Yeni promokod yaratmaq
  createPromoCode: async (data: {
    promoCode: string;
    type?: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    usageLimit?: number;
    startDate: string;
    endDate: string;
    description?: string;
  }): Promise<CampaignPromo> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.CAMPAIGNS.CREATE, data);
    return res.data?.data || res.data;
  },

  // Promokodu silmək
  deletePromoCode: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await vendorAxiosClient.delete(VENDOR_ENDPOINTS.CAMPAIGNS.DELETE(id));
    return res.data?.data || res.data;
  }
};
