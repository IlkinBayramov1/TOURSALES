import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const ADMIN_TOKEN_KEY = 'ts_admin_jwt';
const ADMIN_REFRESH_TOKEN_KEY = 'ts_admin_refresh_token';

export const adminStorage = {
  getToken: (): string | null => localStorage.getItem(ADMIN_TOKEN_KEY),
  setToken: (token: string): void => localStorage.setItem(ADMIN_TOKEN_KEY, token),
  getRefreshToken: (): string | null => localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string): void => localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, token),
  clear: (): void => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
  },
};

export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '/api/v1';
};

export const adminAxiosClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Bearer token & normalize duplicate /api/v1 prefixes
adminAxiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.url && config.url.startsWith('/api/v1')) {
      config.url = config.url.substring('/api/v1'.length);
    }
    const token = adminStorage.getToken();
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

adminAxiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh-token');

    if (error.response?.status === 401 && !isAuthRoute && !originalRequest?._retry) {
      const refreshToken = adminStorage.getRefreshToken();
      if (!refreshToken) {
        adminStorage.clear();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/admin/login';
        }
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
            return adminAxiosClient(originalRequest);
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
          adminStorage.setToken(newToken);
          if (newRefreshToken) {
            adminStorage.setRefreshToken(newRefreshToken);
          }
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          processQueue(null, newToken);
          return adminAxiosClient(originalRequest);
        } else {
          throw new Error('No access token returned from refresh endpoint');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        adminStorage.clear();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/admin/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
