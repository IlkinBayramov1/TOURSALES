import { axiosClient } from '../../../shared/api/axiosClient';
import { ApiResponse, User, Booking, Tour } from '@toursales/types';

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface LoyaltyData {
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  tierDiscount: number;
  history: Array<{
    id: string;
    description: string;
    points: number;
    type: 'EARNED' | 'REDEEMED';
    createdAt: string;
  }>;
}

export const accountApi = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    return axiosClient.get('/users/profile');
  },

  updateProfile: async (data: UpdateProfilePayload): Promise<ApiResponse<User>> => {
    return axiosClient.put('/users/profile', data);
  },

  changePassword: async (data: ChangePasswordPayload): Promise<ApiResponse<void>> => {
    return axiosClient.put('/users/change-password', data);
  },

  getMyBookings: async (params?: { page?: number; limit?: number; status?: string }): Promise<ApiResponse<Booking[]>> => {
    return axiosClient.get('/bookings/my-bookings', { params });
  },

  cancelBooking: async (bookingId: string, reason?: string): Promise<ApiResponse<Booking>> => {
    return axiosClient.post(`/bookings/${bookingId}/cancel`, { reason });
  },

  getFavorites: async (): Promise<ApiResponse<Tour[]>> => {
    return axiosClient.get('/users/favorites');
  },

  toggleFavorite: async (tourId: string): Promise<ApiResponse<{ isFavorite: boolean }>> => {
    return axiosClient.post(`/users/favorites/${tourId}`);
  },

  getLoyaltyInfo: async (): Promise<ApiResponse<LoyaltyData>> => {
    return axiosClient.get('/users/loyalty');
  },
};
