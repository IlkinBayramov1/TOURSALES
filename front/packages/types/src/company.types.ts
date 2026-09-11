export type CompanyStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export interface Company {
  id: string;
  name: string;
  voen: string;
  email: string;
  phone: string;
  address?: string;
  bankName?: string;
  bankIban?: string;
  logoUrl?: string;
  status: CompanyStatus;
  subscriptionPlanId?: string | null;
  subscriptionPlan?: SubscriptionPlan;
  commissionRate: number; // e.g. 5%
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  currency: string;
  commissionRate: number;
  maxTours: number;
  features: string[];
  isPopular?: boolean;
}

export interface AgencyMember {
  id: string;
  userId: string;
  companyId: string;
  name: string;
  email: string;
  role: 'GUIDE' | 'ACCOUNTANT' | 'MANAGER';
  createdAt: string;
}

export interface ApiKey {
  id: string;
  companyId: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string | null;
}
