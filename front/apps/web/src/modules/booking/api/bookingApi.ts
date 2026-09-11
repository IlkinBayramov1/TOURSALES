import { axiosClient } from '../../../shared/api/axiosClient';
import { API_ENDPOINTS } from '../../../shared/api/apiEndpoints';
import {
  Booking,
  CreateBookingPayload,
  SeatLockResponse,
  PriceCalculationResult,
  SeatMatrix,
} from '@toursales/types';

export const bookingApi = {
  getSeats: async (tourId: string) => {
    const res = await axiosClient.get<{ success: boolean; data: SeatMatrix }>(
      API_ENDPOINTS.TOURS.SEATS(tourId)
    );
    return res.data?.data;
  },

  lockSeat: async (tourId: string, seatNumbers: number[]) => {
    const res = await axiosClient.post<{ success: boolean; data: SeatLockResponse }>(
      API_ENDPOINTS.TOURS.LOCK_SEAT(tourId),
      { seatNumbers }
    );
    return res.data?.data;
  },

  releaseSeat: async (tourId: string, seatNumbers: number[]) => {
    const res = await axiosClient.post(
      API_ENDPOINTS.TOURS.RELEASE_SEAT(tourId),
      { seatNumbers }
    );
    return res.data;
  },

  calculatePrice: async (tourId: string, payload: { seatsCount: number; promoCode?: string }) => {
    const res = await axiosClient.post<{ success: boolean; data: PriceCalculationResult }>(
      API_ENDPOINTS.TOURS.CALCULATE_PRICE(tourId),
      payload
    );
    return res.data?.data;
  },

  createBooking: async (payload: CreateBookingPayload) => {
    const res = await axiosClient.post<{ success: boolean; data: Booking }>(
      API_ENDPOINTS.BOOKINGS.CREATE,
      payload
    );
    return res.data?.data;
  },

  getBookingDetail: async (bookingId: string) => {
    const res = await axiosClient.get<{ success: boolean; data: Booking }>(
      API_ENDPOINTS.BOOKINGS.DETAIL(bookingId)
    );
    return res.data?.data;
  },

  getBookingById: async (bookingId: string) => {
    const res = await axiosClient.get<{ success: boolean; data: Booking }>(
      API_ENDPOINTS.BOOKINGS.DETAIL(bookingId)
    );
    return res.data;
  },

  getBookingVoucher: async (bookingId: string) => {
    const res = await axiosClient.get<{ success: boolean; data: { voucher: any; qrToken: string } }>(
      API_ENDPOINTS.BOOKINGS.VOUCHER(bookingId)
    );
    return res.data?.data;
  },

  initPayment: async (payload: { bookingId: string; paymentMethod: string }) => {
    const res = await axiosClient.post(API_ENDPOINTS.PAYMENTS.INIT, payload);
    return res.data?.data || res.data;
  },
};
