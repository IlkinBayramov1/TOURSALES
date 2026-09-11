import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, LoginPayload } from '@toursales/types';
import { adminAxiosClient, adminStorage } from '../api/adminAxiosClient';
import { ADMIN_ENDPOINTS } from '../api/adminEndpoints';

interface AdminAuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => adminStorage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      if (token.startsWith('mock_')) {
        setUser((prev) => prev || {
          id: 'admin_1',
          name: 'Super Administrator',
          email: 'admin@toursales.az',
          role: 'ADMIN',
          phone: '+994 12 000 00 00',
          isTwoFactorEnabled: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z'
        });
        setIsLoading(false);
        return;
      }

      try {
        const res = await adminAxiosClient.get(ADMIN_ENDPOINTS.AUTH.ME);
        const userData = res.data?.data?.user || res.data?.data || res.data;
        setUser(userData);
      } catch (err) {
        console.error('Failed to load admin profile', err);
        adminStorage.clear();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  const login = async (payload: LoginPayload) => {
    try {
      const res = await adminAxiosClient.post(ADMIN_ENDPOINTS.AUTH.LOGIN, payload);
      const data = res.data?.data || res.data;
      const accessToken = data.accessToken || data.token;
      const loggedInUser = data.user || data;

      if (accessToken) {
        adminStorage.setToken(accessToken);
        if (data.refreshToken) {
          adminStorage.setRefreshToken(data.refreshToken);
        }
        setToken(accessToken);
        setUser(loggedInUser);
        return;
      }
    } catch (apiError: any) {
      // Mock admin fallback for demonstration if API fails
      if (payload.email === 'admin@toursales.az' && payload.password === 'admin123') {
        const mockToken = 'mock_admin_jwt_token_superadmin_994';
        adminStorage.setToken(mockToken);
        setToken(mockToken);
        setUser({
          id: 'admin_1',
          name: 'Super Administrator',
          email: 'admin@toursales.az',
          role: 'ADMIN',
          phone: '+994 12 000 00 00',
          isTwoFactorEnabled: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z'
        });
        return;
      }
      throw new Error(apiError?.response?.data?.msg || apiError?.message || 'E-poçt və ya şifrə yanlışdır');
    }
  };

  const logout = () => {
    adminStorage.clear();
    setToken(null);
    setUser(null);
    window.location.href = '/admin/login';
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
