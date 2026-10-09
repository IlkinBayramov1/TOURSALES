import { vendorAxiosClient } from '../../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../../shared/api/vendorEndpoints';
import {
  Hotel,
  RoomType,
  RoomAvailabilityMatrixResponse,
  HotelBooking
} from '@toursales/types';

export interface CreateHotelPayload {
  name: string;
  category: string;
  starRating: number;
  city: string;
  region?: string;
  address: string;
  description: string;
  checkInTime?: string;
  checkOutTime?: string;
  amenities: string[];
  images: string[];
  allowInstallments?: boolean;
  allowDeposit?: boolean;
  dynamicPricingActive?: boolean;
}

export interface CreateRoomPayload {
  name: string;
  description?: string;
  bedType: string;
  mealPlan: string;
  capacityAdults: number;
  capacityChildren: number;
  basePrice: number;
  totalRoomsCount: number;
  amenities: string[];
  images: string[];
}

export interface CalendarBulkUpdateItem {
  date: string;
  availableCount?: number;
  priceOverride?: number;
  isBlocked?: boolean;
}

export const vendorHotelApi = {
  getHotels: async (): Promise<Hotel[]> => {
    const res = await vendorAxiosClient.get<{ success: boolean; data: any }>(
      VENDOR_ENDPOINTS.HOTELS.LIST
    );
    if (Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    if (Array.isArray(res.data?.data?.hotels)) {
      return res.data.data.hotels;
    }
    return [];
  },

  getHotelById: async (id: string): Promise<Hotel> => {
    const res = await vendorAxiosClient.get<{ success: boolean; data: Hotel }>(
      VENDOR_ENDPOINTS.HOTELS.DETAIL(id)
    );
    return res.data?.data;
  },

  createHotel: async (payload: CreateHotelPayload): Promise<Hotel> => {
    const res = await vendorAxiosClient.post<{ success: boolean; data: Hotel }>(
      VENDOR_ENDPOINTS.HOTELS.CREATE,
      payload
    );
    return res.data?.data;
  },

  updateHotel: async (id: string, payload: Partial<CreateHotelPayload>): Promise<Hotel> => {
    const res = await vendorAxiosClient.put<{ success: boolean; data: Hotel }>(
      VENDOR_ENDPOINTS.HOTELS.UPDATE(id),
      payload
    );
    return res.data?.data;
  },

  createRoom: async (hotelId: string, payload: CreateRoomPayload): Promise<RoomType> => {
    const res = await vendorAxiosClient.post<{ success: boolean; data: RoomType }>(
      VENDOR_ENDPOINTS.HOTELS.CREATE_ROOM(hotelId),
      payload
    );
    return res.data?.data;
  },

  getRoomCalendarMatrix: async (
    hotelId: string,
    roomId: string,
    params?: { startDate?: string; endDate?: string }
  ): Promise<RoomAvailabilityMatrixResponse> => {
    const res = await vendorAxiosClient.get<{ success: boolean; data: RoomAvailabilityMatrixResponse }>(
      VENDOR_ENDPOINTS.HOTELS.ROOM_CALENDAR(hotelId, roomId),
      { params }
    );
    return res.data?.data;
  },

  bulkUpdateCalendar: async (
    hotelId: string,
    roomId: string,
    updates: CalendarBulkUpdateItem[]
  ): Promise<{ success: boolean; count: number }> => {
    const res = await vendorAxiosClient.post<{ success: boolean; data?: { updatedDaysCount: number } }>(
      VENDOR_ENDPOINTS.HOTELS.BULK_UPDATE_CALENDAR(hotelId, roomId),
      { updates }
    );
    return {
      success: res.data?.success ?? true,
      count: res.data?.data?.updatedDaysCount ?? updates.length,
    };
  },

  getHotelBookings: async (params?: { hotelId?: string; status?: string; search?: string }): Promise<HotelBooking[]> => {
    const res = await vendorAxiosClient.get<{ success: boolean; data: any }>(
      VENDOR_ENDPOINTS.HOTELS.BOOKINGS,
      { params }
    );
    if (Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  },
};
