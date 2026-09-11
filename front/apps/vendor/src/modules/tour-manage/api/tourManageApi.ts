import { vendorAxiosClient } from '../../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../../shared/api/vendorEndpoints';
import { ApiResponse, Tour, ItineraryItem, SeatMatrix } from '@toursales/types';

export interface CreateTourPayload {
  title: string;
  description: string;
  type: 'DOMESTIC' | 'FOREIGN';
  region: string;
  destinationCountry?: string;
  basePrice: number;
  startDate: string;
  endDate: string;
  meetingPoint: string;
  meetingLat?: number;
  meetingLng?: number;
  images: string[];
  capacity: number;
  busType?: 'SPRINTER' | 'STANDARD_48' | 'VIP_30';
  hotelName?: string;
  hotelCategory?: string;
  flightIncluded?: boolean;
  passportVisaRequired?: boolean;
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryItem[];
  isKarabakh?: boolean;
  hasVisaSupport?: boolean;
  hasFlight?: boolean;
}

export const tourManageApi = {
  getMyTours: async (): Promise<ApiResponse<Tour[]>> => {
    try {
      const res = await vendorAxiosClient.get<{ status: string; msg?: string; data: Tour[] }>(
        VENDOR_ENDPOINTS.TOURS.MY_TOURS
      );
      const tours = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      return {
        success: true,
        data: tours,
      };
    } catch (err) {
      console.error('Turların yüklənməsində xəta:', err);
      return {
        success: false,
        data: [],
      };
    }
  },

  getTourById: async (id: string): Promise<ApiResponse<Tour>> => {
    try {
      const res = await vendorAxiosClient.get<ApiResponse<Tour>>(VENDOR_ENDPOINTS.TOURS.DETAIL(id));
      return res.data;
    } catch {
      const all = await tourManageApi.getMyTours();
      const found = all.data.find((t) => t.id === id) || all.data[0];
      return { success: true, data: found };
    }
  },

  createTour: async (payload: CreateTourPayload): Promise<ApiResponse<Tour>> => {
    const res = await vendorAxiosClient.post<ApiResponse<Tour>>(VENDOR_ENDPOINTS.TOURS.CREATE, payload);
    return res.data;
  },

  updateTour: async (id: string, payload: Partial<CreateTourPayload>): Promise<ApiResponse<Tour>> => {
    const res = await vendorAxiosClient.put<ApiResponse<Tour>>(VENDOR_ENDPOINTS.TOURS.UPDATE(id), payload);
    return res.data;
  },

  deleteTour: async (id: string): Promise<ApiResponse<void>> => {
    const res = await vendorAxiosClient.delete<ApiResponse<void>>(VENDOR_ENDPOINTS.TOURS.DELETE(id));
    return res.data;
  },

  configSeats: async (id: string, busType: string): Promise<ApiResponse<SeatMatrix>> => {
    const res = await vendorAxiosClient.post<ApiResponse<SeatMatrix>>(
      VENDOR_ENDPOINTS.TOURS.CONFIG_SEATS(id),
      { busType }
    );
    return res.data;
  },
};
