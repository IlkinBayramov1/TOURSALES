export type CompanyStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'Pending' | 'Active' | 'Suspended';

export interface CompanySocialLinks {
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  telegram?: string;
  [key: string]: string | undefined;
}

export interface CompanyNotificationSettings {
  emailBookings?: boolean;
  emailPayouts?: boolean;
  smsAlerts?: boolean;
  marketingTips?: boolean;
  [key: string]: boolean | undefined;
}

export interface Company {
  id: string;
  name: string;
  legalName?: string;
  voen: string;
  email: string;
  phone: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  website?: string;
  description?: string;
  workingHours?: string;
  logoUrl?: string;
  coverUrl?: string;
  socialLinks?: CompanySocialLinks | string;
  bankName?: string;
  bankIban?: string;
  iban?: string;
  bankVoen?: string;
  bankCode?: string;
  swiftBic?: string;
  payoutAccount?: string;
  accountantName?: string;
  accountantPhone?: string;
  status: CompanyStatus | string;
  rating?: number;
  availableBalance?: number | string;
  pendingBalance?: number | string;
  notificationSettings?: CompanyNotificationSettings | string;
  subscriptionPlanId?: string | null;
  subscriptionPlan?: SubscriptionPlan;
  plan?: any;
  commissionRate?: number; // e.g. 5%
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfileStats {
  companyId: string;
  name: string;
  rating: number;
  status: string;
  planName: string;
  activeTours: number;
  totalBookings: number;
  totalRevenue: number;
  memberSince?: string;
}

export interface PasswordChangePayload {
  currentPassword: string;
  newPassword: string;
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
  environment: 'LIVE' | 'TEST' | string;
  scopes?: string[];
  ipWhitelist?: string | null;
  rateLimitPerMinute?: number;
  requestCount?: number;
  status: 'Active' | 'Revoked' | string;
  createdAt: string;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
}

export interface WebhookConfig {
  id: string;
  companyId: string;
  name: string;
  url: string;
  secretKey?: string;
  events: string[];
  status: 'Active' | 'Disabled' | string;
  lastDeliveryAt?: string | null;
  lastDeliveryStatus?: string | null;
  createdAt: string;
}

export interface ApiIntegrationStats {
  totalKeys: number;
  activeLiveKeys: number;
  activeTestKeys: number;
  totalRequestsLast30Days: number;
  avgLatencyMs: number;
  activeWebhooksCount: number;
}
