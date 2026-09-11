import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, LoginPayload, RegisterPayload } from '@toursales/types';
import { storage } from '../utils/storage';
import { axiosClient } from '../api/axiosClient';
import { API_ENDPOINTS } from '../api/apiEndpoints';
import { useToast } from './ToastContext';
import { parseApiError } from '../api/errorHandler';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<{ requires2FA?: boolean; userId?: string }>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  verify2FA: (userId: string, code: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => storage.getUser());
  const [token, setToken] = useState<string | null>(() => storage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { success, error: toastError } = useToast();

  const refreshProfile = async () => {
    try {
      const res = await axiosClient.get(API_ENDPOINTS.AUTH.ME);
      if (res.data?.data) {
        const userData = res.data.data.user || res.data.data;
        setUser(userData);
        storage.setUser(userData);
      }
    } catch {
      // If profile fails and token expired, storage will be handled
    }
  };

  useEffect(() => {
    if (token) {
      refreshProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (payload: LoginPayload): Promise<{ requires2FA?: boolean; userId?: string }> => {
    try {
      const res = await axiosClient.post(API_ENDPOINTS.AUTH.LOGIN, payload);
      const data = res.data?.data || res.data;

      if (data.requiresTwoFactor) {
        return { requires2FA: true, userId: data.userId };
      }

      const receivedToken = data.token || data.accessToken;
      if (receivedToken) {
        storage.setToken(receivedToken);
        setToken(receivedToken);
      }
      if (data.refreshToken) {
        storage.setRefreshToken(data.refreshToken);
      }
      if (data.user) {
        storage.setUser(data.user);
        setUser(data.user);
      }

      success('Hesaba uğurla daxil oldunuz!', 'Xoş gəlmisiniz');
      return { requires2FA: false };
    } catch (err: any) {
      const msg = parseApiError(err);
      toastError(msg, 'Giriş xətası');
      throw err;
    }
  };

  const verify2FA = async (userId: string, code: string): Promise<void> => {
    try {
      const res = await axiosClient.post(API_ENDPOINTS.AUTH.VERIFY_2FA, { userId, code });
      const data = res.data?.data || res.data;

      const receivedToken = data.token || data.accessToken;
      if (receivedToken) {
        storage.setToken(receivedToken);
        setToken(receivedToken);
      }
      if (data.refreshToken) {
        storage.setRefreshToken(data.refreshToken);
      }
      if (data.user) {
        storage.setUser(data.user);
        setUser(data.user);
      }

      success('İki mərhələli təhlükəsizlik kodu təsdiqləndi!', 'Uğurlu');
    } catch (err: any) {
      const msg = parseApiError(err);
      toastError(msg, '2FA Xətası');
      throw err;
    }
  };

  const register = async (payload: RegisterPayload): Promise<void> => {
    try {
      const res = await axiosClient.post(API_ENDPOINTS.AUTH.REGISTER, payload);
      const data = res.data?.data || res.data;

      const receivedToken = data.token || data.accessToken;
      if (receivedToken) {
        storage.setToken(receivedToken);
        setToken(receivedToken);
      }
      if (data.refreshToken) {
        storage.setRefreshToken(data.refreshToken);
      }
      if (data.user) {
        storage.setUser(data.user);
        setUser(data.user);
      }

      success('Qeydiyyat uğurla tamamlandı!', 'Təbriklər');
    } catch (err: any) {
      const msg = parseApiError(err);
      toastError(msg, 'Qeydiyyat xətası');
      throw err;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = storage.getRefreshToken();
      await axiosClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
    } catch {
      // ignore
    } finally {
      storage.clearAll();
      setUser(null);
      setToken(null);
      success('Hesabdan çıxış edildi');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        verify2FA,
        refreshProfile,
        refreshUser: refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
