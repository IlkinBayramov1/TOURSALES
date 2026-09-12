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
      const res = await vendorAxiosClient.get<{ status: string; data: Tour } | ApiResponse<Tour>>(VENDOR_ENDPOINTS.TOURS.DETAIL(id));
      const tour = (res.data as any)?.data || res.data;
      return { success: true, data: tour };
    } catch {
      const all = await tourManageApi.getMyTours();
      const found = all.data.find((t) => t.id === id) || all.data[0];
      return { success: true, data: found };
    }
  },

  createTour: async (payload: CreateTourPayload): Promise<ApiResponse<Tour>> => {
    const res = await vendorAxiosClient.post<{ status: string; data: Tour } | ApiResponse<Tour>>(VENDOR_ENDPOINTS.TOURS.CREATE, payload);
    const tour = (res.data as any)?.data || res.data;
    return { success: true, data: tour };
  },

  updateTour: async (id: string, payload: Partial<CreateTourPayload>): Promise<ApiResponse<Tour>> => {
    const res = await vendorAxiosClient.put<{ status: string; data: Tour } | ApiResponse<Tour>>(VENDOR_ENDPOINTS.TOURS.UPDATE(id), payload);
    const tour = (res.data as any)?.data || res.data;
    return { success: true, data: tour };
  },

  toggleTourStatus: async (id: string, status?: string): Promise<ApiResponse<Tour>> => {
    const res = await vendorAxiosClient.patch<{ status: string; data: Tour } | ApiResponse<Tour>>(
      VENDOR_ENDPOINTS.TOURS.STATUS(id),
      status ? { status } : {}
    );
    const tour = (res.data as any)?.data || res.data;
    return { success: true, data: tour };
  },

  deleteTour: async (id: string): Promise<ApiResponse<void>> => {
    const res = await vendorAxiosClient.delete<ApiResponse<void>>(VENDOR_ENDPOINTS.TOURS.DELETE(id));
    return res.data;
  },

  getSeatMatrix: async (id: string): Promise<{ tourId: string; busCapacity: number; matrix: Array<{ seatNumber: number; status: 'AVAILABLE' | 'BOOKED' | 'LOCKED'; lockedBy?: string | null }> }> => {
    const res = await vendorAxiosClient.get<{ status: string; data: { tourId: string; busCapacity: number; matrix: Array<{ seatNumber: number; status: 'AVAILABLE' | 'BOOKED' | 'LOCKED'; lockedBy?: string | null }> } }>(
      VENDOR_ENDPOINTS.TOURS.SEATS(id)
    );
    return res.data.data;
  },

  exportToursExcel: async (): Promise<void> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.TOURS.EXPORT, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `turlar-${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  configSeats: async (id: string, busType: string): Promise<ApiResponse<SeatMatrix>> => {
    const res = await vendorAxiosClient.post<ApiResponse<SeatMatrix>>(
      VENDOR_ENDPOINTS.TOURS.CONFIG_SEATS(id),
      { busType }
    );
    return res.data;
  },
};
