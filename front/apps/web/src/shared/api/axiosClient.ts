import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';

export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '/api/v1';
};

export const axiosClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token & normalize duplicate /api/v1 prefixes
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Normalise URL to avoid duplicate /api/v1 if baseURL already ends with /api/v1
    if (config.url && config.url.startsWith('/api/v1')) {
      config.url = config.url.substring('/api/v1'.length);
    }

    const token = storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with Silent Refresh Token Queue mechanism
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthRoute = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh-token');

    if (error.response?.status === 401 && !isAuthRoute && !originalRequest?._retry) {
      const refreshToken = storage.getRefreshToken();
      if (!refreshToken) {
        storage.clearAll();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshEndpoint = `${getApiBaseUrl()}/auth/refresh-token`;
        const res = await axios.post(refreshEndpoint, { refreshToken });

        const newToken = res.data?.data?.accessToken || res.data?.accessToken || res.data?.token;
        const newRefreshToken = res.data?.data?.refreshToken || res.data?.refreshToken;

        if (newToken) {
          storage.setToken(newToken);
          if (newRefreshToken) {
            storage.setRefreshToken(newRefreshToken);
          }
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          processQueue(null, newToken);
          return axiosClient(originalRequest);
        } else {
          throw new Error('No access token returned from refresh endpoint');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        storage.clearAll();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
