import { axiosClient } from '../../../shared/api/axiosClient';
import { API_ENDPOINTS } from '../../../shared/api/apiEndpoints';
import { ApiResponse, Ad, CampaignPromo } from '@toursales/types';

export interface CampaignOffer {
  id: string;
  title: string;
  subtitle: string;
  discountPercentage: number;
  promoCode: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  targetCategory?: 'DOMESTIC' | 'FOREIGN' | 'ALL';
  minOrderAmount?: number;
  terms: string[];
}

export const campaignApi = {
  getActiveAds: async (position?: string): Promise<ApiResponse<Ad[]>> => {
    const res = await axiosClient.get<ApiResponse<Ad[]>>(API_ENDPOINTS.ADS.PUBLIC, {
      params: { position },
    });
    return res.data;
  },

  getActiveCampaigns: async (): Promise<ApiResponse<CampaignPromo[]>> => {
    const res = await axiosClient.get<ApiResponse<CampaignPromo[]>>(
      API_ENDPOINTS.CAMPAIGNS.ACTIVE
    );
    return res.data;
  },

  getSpecialOffers: async (): Promise<ApiResponse<CampaignOffer[]>> => {
    try {
      const res = await axiosClient.get<ApiResponse<CampaignOffer[]>>(
        API_ENDPOINTS.CAMPAIGNS.ACTIVE
      );
      if (res.data?.data && res.data.data.length > 0) {
        return res.data;
      }
    } catch {
      // fallback to curated special offers below
    }

    return {
      success: true,
      data: [
        {
          id: 'camp-1',
          title: 'Qarabağ Zəfər Baharı Kampaniyası',
          subtitle: 'Şuşa, Laçın və Kəlbəcər turlarına 15% xüsusi endirim!',
          discountPercentage: 15,
          promoCode: 'QARABAG15',
          imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
          startDate: '2026-03-01',
          endDate: '2026-04-30',
          targetCategory: 'DOMESTIC',
          minOrderAmount: 50,
          terms: [
            'Bütün Qarabağ istiqamətli həftəsonu turlarına şamildir.',
            'Bir nəfər tərəfindən maksimum 2 dəfə istifadə edilə bilər.',
            'Digər kuponlarla birləşdirilə bilməz.',
          ],
        },
        {
          id: 'camp-2',
          title: 'Erkən Rezervasiya - Yay 2026',
          subtitle: 'Antalya, Tbilisi və Batumi yay turlarına indi rezerv edin, 20% qənaət edin.',
          discountPercentage: 20,
          promoCode: 'SUMMER20',
          imageUrl: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800',
          startDate: '2026-02-01',
          endDate: '2026-05-31',
          targetCategory: 'FOREIGN',
          minOrderAmount: 150,
          terms: [
            'Yalnız xarici istiqamətli qrup turlarında keçərlidir.',
            'Tam ödəniş online edildikdə tətbiq olunur.',
          ],
        },
      ],
    };
  },

  validatePromoCode: async (code: string, amount: number, tourId?: string) => {
    const res = await axiosClient.post(API_ENDPOINTS.CAMPAIGNS.VALIDATE_PROMO, {
      promoCode: code,
      bookingAmount: amount,
      tourId,
    });
    return res.data;
  },
};
