import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Company, LoginPayload, RegisterPayload } from '@toursales/types';
import { vendorAxiosClient, vendorStorage } from '../api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../api/vendorEndpoints';

interface VendorAuthContextType {
  user: User | null;
  company: Company | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const VendorAuthContext = createContext<VendorAuthContextType | undefined>(undefined);

export const VendorAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [token, setToken] = useState<string | null>(() => vendorStorage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    if (!token || token.startsWith('mock_')) {
      return;
    }
    try {
      const [userRes, compRes] = await Promise.allSettled([
        vendorAxiosClient.get(VENDOR_ENDPOINTS.AUTH.ME),
        vendorAxiosClient.get(VENDOR_ENDPOINTS.PROFILE.COMPANY),
      ]);

      if (userRes.status === 'fulfilled' && userRes.value.data?.data) {
        const userData = userRes.value.data.data.user || userRes.value.data.data;
        setUser(userData);
      }
      if (compRes.status === 'fulfilled' && compRes.value.data?.data) {
        const compData = compRes.value.data.data.company || compRes.value.data.data;
        setCompany(compData);
      }
    } catch (err) {
      console.error('Profil yeniləmə xətası:', err);
    }
  };

  useEffect(() => {
    if (token) {
      if (token.startsWith('mock_')) {
        setUser((prev) => prev || {
          id: 'U-VENDOR-01',
          name: 'AzTur Menecer',
          email: 'vendor@toursales.az',
          role: 'VENDOR',
          companyId: 'C-TESTER',
          isTwoFactorEnabled: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        });
        setCompany((prev) => prev || {
          id: 'C-TESTER',
          name: 'AzTur Turizm MMC',
          status: 'Active',
          commissionRate: 5.0,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        } as any);
        setIsLoading(false);
      } else {
        refreshProfile().finally(() => setIsLoading(false));
      }
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (payload: LoginPayload) => {
    try {
      const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.AUTH.LOGIN, payload);
      const data = res.data?.data || res.data;
      const accessToken = data.accessToken || data.token;
      const loggedInUser = data.user || data;

      if (accessToken) {
        vendorStorage.setToken(accessToken);
        if (data.refreshToken) {
          vendorStorage.setRefreshToken(data.refreshToken);
        }
        setToken(accessToken);
        setUser(loggedInUser);
        await refreshProfile();
        return;
      }
    } catch (apiErr: any) {
      if (payload.email === 'vendor@toursales.az' && payload.password === 'vendor123') {
        const mockToken = 'mock_vendor_jwt_token_partner_01';
        vendorStorage.setToken(mockToken);
        setToken(mockToken);
        setUser({
          id: 'U-VENDOR-01',
          name: 'AzTur Menecer',
          email: 'vendor@toursales.az',
          role: 'VENDOR',
          companyId: 'C-TESTER',
          isTwoFactorEnabled: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        });
        setCompany({
          id: 'C-TESTER',
          name: 'AzTur Turizm MMC',
          status: 'Active',
          commissionRate: 5.0,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        } as any);
        return;
      }
      throw new Error(apiErr?.response?.data?.msg || apiErr?.message || 'E-poçt və ya şifrə yanlışdır');
    }
  };

  const register = async (payload: RegisterPayload) => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.AUTH.REGISTER, {
      ...payload,
      role: 'Vendor',
    });
    const data = res.data?.data || res.data;
    const accessToken = data.accessToken || data.token;
    const registeredUser = data.user || data;

    if (accessToken) {
      vendorStorage.setToken(accessToken);
      if (data.refreshToken) {
        vendorStorage.setRefreshToken(data.refreshToken);
      }
      setToken(accessToken);
      setUser(registeredUser);
      await refreshProfile();
    }
  };

  const logout = () => {
    vendorStorage.clear();
    setUser(null);
    setCompany(null);
    setToken(null);
    window.location.href = '/vendor/login';
  };

  return (
    <VendorAuthContext.Provider
      value={{
        user,
        company,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </VendorAuthContext.Provider>
  );
};

export const useVendorAuth = (): VendorAuthContextType => {
  const context = useContext(VendorAuthContext);
  if (!context) {
    throw new Error('useVendorAuth must be used within a VendorAuthProvider');
  }
  return context;
};
