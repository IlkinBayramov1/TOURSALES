import { vendorAxiosClient } from '../../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../../shared/api/vendorEndpoints';
import { ApiResponse, Booking } from '@toursales/types';

export interface CheckInPayload {
  qrToken?: string;
  bookingNumber?: string;
  seatNumber?: number;
}

export interface CheckInResult {
  verified: boolean;
  alreadyCheckedIn?: boolean;
  bookingNumber: string;
  passengerNames: string[];
  seatNumbers: number[];
  checkedInAt: string;
  tourTitle: string;
}

export interface RosterPassenger {
  id?: string;
  bookingId?: string;
  seatNumber: number;
  fullName: string;
  phone: string;
  finCode?: string;
  idNumber?: string;
  bookingNumber: string;
  status: string;
  isCheckedIn: boolean;
  checkedInAt?: string | null;
}

export interface BookingStats {
  totalBookings: number;
  totalPassengers: number;
  checkedInCount: number;
  checkedInRate: number;
  totalRevenue: number;
}

export const vendorBookingApi = {
  getBookings: async (params?: { tourId?: string; status?: string; search?: string }): Promise<ApiResponse<Booking[]>> => {
    const res = await vendorAxiosClient.get<ApiResponse<Booking[]>>(VENDOR_ENDPOINTS.BOOKINGS.LIST, { params });
    return res.data;
  },

  getStats: async (): Promise<ApiResponse<BookingStats>> => {
    const res = await vendorAxiosClient.get<ApiResponse<BookingStats>>(VENDOR_ENDPOINTS.BOOKINGS.STATS);
    return res.data;
  },

  getBookingById: async (id: string): Promise<ApiResponse<Booking>> => {
    const res = await vendorAxiosClient.get<ApiResponse<Booking>>(VENDOR_ENDPOINTS.BOOKINGS.DETAIL(id));
    return res.data;
  },

  checkIn: async (payload: CheckInPayload): Promise<ApiResponse<CheckInResult>> => {
    const res = await vendorAxiosClient.post<ApiResponse<CheckInResult>>(
      VENDOR_ENDPOINTS.BOOKINGS.CHECK_IN,
      payload
    );
    return res.data;
  },

  toggleCheckIn: async (bookingId: string, seatNumber?: number): Promise<ApiResponse<{ isCheckedIn: boolean; checkedInAt?: string }>> => {
    const res = await vendorAxiosClient.patch<ApiResponse<{ isCheckedIn: boolean; checkedInAt?: string }>>(
      VENDOR_ENDPOINTS.BOOKINGS.TOGGLE_CHECK_IN(bookingId),
      { seatNumber }
    );
    return res.data;
  },

  getRoster: async (tourId: string): Promise<ApiResponse<RosterPassenger[]>> => {
    const res = await vendorAxiosClient.get<ApiResponse<RosterPassenger[]>>(
      VENDOR_ENDPOINTS.BOOKINGS.ROSTER(tourId)
    );
    return res.data;
  },

  cancelBooking: async (id: string): Promise<ApiResponse<any>> => {
    const res = await vendorAxiosClient.post<ApiResponse<any>>(`/bookings/${id}/cancel`);
    return res.data;
  },

  exportBookingsExcel: async (params?: { tourId?: string; status?: string }) => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.BOOKINGS.EXPORT_BOOKINGS, {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sifarisler_${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportRosterExcel: async (tourId: string) => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.BOOKINGS.EXPORT_ROSTER(tourId), {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Manifest_${tourId}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
