export type UserRole = 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'GUIDE' | 'ACCOUNTANT';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  isTwoFactorEnabled: boolean;
  companyId?: string | null;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  requiresTwoFactor?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'CUSTOMER' | 'VENDOR';
  companyName?: string;
  companyVoen?: string;
}

export interface TwoFactorVerifyPayload {
  userId: string;
  code: string;
}
