import { axiosClient } from '../../../shared/api/axiosClient';
import { API_ENDPOINTS } from '../../../shared/api/apiEndpoints';
import { Tour, TourFilterParams, PaginatedResponse, SeatMatrix, PriceCalculationResult, TourReview } from '@toursales/types';

export const tourApi = {
  getTours: async (params?: TourFilterParams) => {
    const res = await axiosClient.get<PaginatedResponse<Tour>>(API_ENDPOINTS.TOURS.LIST, { params });
    return res.data;
  },

  getFeaturedTours: async () => {
    const res = await axiosClient.get<PaginatedResponse<Tour>>(API_ENDPOINTS.TOURS.LIST, { params: { limit: 6 } });
    return res.data;
  },

  getTourById: async (id: string) => {
    const res = await axiosClient.get<{ success: boolean; data: Tour }>(API_ENDPOINTS.TOURS.DETAIL(id));
    return res.data?.data;
  },

  getSeats: async (id: string) => {
    const res = await axiosClient.get<{ success: boolean; data: SeatMatrix }>(API_ENDPOINTS.TOURS.SEATS(id));
    return res.data?.data;
  },

  lockSeat: async (id: string, seatNumbers: number[]) => {
    const res = await axiosClient.post(API_ENDPOINTS.TOURS.LOCK_SEAT(id), { seatNumbers });
    return res.data;
  },

  releaseSeat: async (id: string, seatNumbers: number[]) => {
    const res = await axiosClient.post(API_ENDPOINTS.TOURS.RELEASE_SEAT(id), { seatNumbers });
    return res.data;
  },

  calculatePrice: async (id: string, payload: { seatsCount: number; promoCode?: string }) => {
    const res = await axiosClient.post<{ success: boolean; data: PriceCalculationResult }>(
      API_ENDPOINTS.TOURS.CALCULATE_PRICE(id),
      payload
    );
    return res.data?.data;
  },

  addReview: async (id: string, payload: { rating: number; comment: string }) => {
    const res = await axiosClient.post<{ success: boolean; data: TourReview }>(
      API_ENDPOINTS.TOURS.REVIEWS(id),
      payload
    );
    return res.data?.data;
  },
};
