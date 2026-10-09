import { axiosClient } from '../../../shared/api/axiosClient';
import { API_ENDPOINTS } from '../../../shared/api/apiEndpoints';
import {
  Hotel,
  HotelSearchParams,
  HotelListResponse,
  RoomAvailabilityMatrixResponse,
  TourHotelCrossSellItem,
  CreateHotelBookingPayload,
  HotelBooking
} from '@toursales/types';

export const hotelApi = {
  searchHotels: async (params?: HotelSearchParams): Promise<HotelListResponse> => {
    const res = await axiosClient.get<{ success: boolean; data: HotelListResponse }>(
      API_ENDPOINTS.HOTELS.SEARCH,
      { params }
    );
    return res.data?.data;
  },

  getHotelDetails: async (
    id: string,
    params?: { checkInDate?: string; checkOutDate?: string }
  ): Promise<Hotel> => {
    const res = await axiosClient.get<{ success: boolean; data: Hotel }>(
      API_ENDPOINTS.HOTELS.DETAIL(id),
      { params }
    );
    return res.data?.data;
  },

  getRoomCalendar: async (
    hotelId: string,
    roomId: string,
    params?: { startDate?: string; endDate?: string }
  ): Promise<RoomAvailabilityMatrixResponse> => {
    const res = await axiosClient.get<{ success: boolean; data: RoomAvailabilityMatrixResponse }>(
      API_ENDPOINTS.HOTELS.ROOM_CALENDAR(hotelId, roomId),
      { params }
    );
    return res.data?.data;
  },

  getTourRecommendedHotels: async (tourId: string): Promise<TourHotelCrossSellItem[]> => {
    const res = await axiosClient.get<{ success: boolean; data: TourHotelCrossSellItem[] }>(
      API_ENDPOINTS.HOTELS.RECOMMENDED(tourId)
    );
    return res.data?.data || [];
  },

  createHotelBooking: async (payload: CreateHotelBookingPayload): Promise<HotelBooking> => {
    const res = await axiosClient.post<{ success: boolean; data: HotelBooking }>(
      API_ENDPOINTS.HOTELS.BOOK,
      payload
    );
    return res.data?.data;
  },

  getMyHotelBookings: async (): Promise<HotelBooking[]> => {
    const res = await axiosClient.get<{ success: boolean; data: HotelBooking[] }>(
      API_ENDPOINTS.HOTELS.MY_BOOKINGS
    );
    return res.data?.data || [];
  },

  getHotelBookingDetails: async (id: string): Promise<HotelBooking> => {
    const res = await axiosClient.get<{ success: boolean; data: HotelBooking }>(
      API_ENDPOINTS.HOTELS.BOOKING_DETAIL(id)
    );
    return res.data?.data;
  },

  payHotelBalance: async (
    id: string,
    payload: { balanceToken: string; provider?: string }
  ): Promise<HotelBooking> => {
    const res = await axiosClient.post<{ success: boolean; data: HotelBooking }>(
      API_ENDPOINTS.HOTELS.PAY_BALANCE(id),
      payload
    );
    return res.data?.data;
  },

  cancelHotelBooking: async (
    id: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> => {
    const res = await axiosClient.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.HOTELS.CANCEL(id),
      { reason }
    );
    return res.data;
  },
};
