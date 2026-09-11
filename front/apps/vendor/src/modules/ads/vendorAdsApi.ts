import { vendorAxiosClient } from '../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../shared/api/vendorEndpoints';
import { Ad } from '@toursales/types';

export const vendorAdsApi = {
  getCampaigns: async (): Promise<Ad[]> => {
    try {
      const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.ADS.MY_CAMPAIGNS);
      return res.data?.data || res.data;
    } catch {
      return [
        {
          id: 'ad_1',
          title: 'Qəbələ Turlarında Payız Kampaniyası',
          imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
          linkUrl: '/tours/gabala-autumn',
          position: 'HERO',
          isActive: true,
          startDate: '2026-09-01T00:00:00Z',
          endDate: '2026-09-30T23:59:59Z',
          clicksCount: 342,
          impressionsCount: 8900
        },
        {
          id: 'ad_2',
          title: 'Şahdağ Qış Xizək Turlarına Erkən Qeydiyyat',
          imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800',
          linkUrl: '/tours/shahdag-winter',
          position: 'SIDEBAR',
          isActive: false,
          startDate: '2026-10-01T00:00:00Z',
          endDate: '2026-11-15T23:59:59Z',
          clicksCount: 0,
          impressionsCount: 0
        }
      ];
    }
  },

  createCampaign: async (data: {
    title: string;
    imageUrl: string;
    linkUrl?: string;
    position: 'HERO' | 'SIDEBAR' | 'POPUP';
    startDate: string;
    endDate: string;
  }): Promise<Ad> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.ADS.CREATE, data);
    return res.data?.data || res.data;
  }
};
