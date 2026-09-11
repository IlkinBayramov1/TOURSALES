import { axiosClient } from '../../../shared/api/axiosClient';
import { API_ENDPOINTS } from '../../../shared/api/apiEndpoints';
import { LoginPayload, RegisterPayload, TwoFactorVerifyPayload, AuthResponse } from '@toursales/types';

export const authApi = {
  login: async (payload: LoginPayload) => {
    const res = await axiosClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, payload);
    return res.data;
  },

  register: async (payload: RegisterPayload) => {
    const res = await axiosClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, payload);
    return res.data;
  },

  verify2FA: async (payload: TwoFactorVerifyPayload) => {
    const res = await axiosClient.post<AuthResponse>(API_ENDPOINTS.AUTH.VERIFY_2FA, payload);
    return res.data;
  },

  logout: async (refreshToken?: string) => {
    const res = await axiosClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
    return res.data;
  },

  getProfile: async () => {
    const res = await axiosClient.get(API_ENDPOINTS.AUTH.ME);
    return res.data;
  },
};
