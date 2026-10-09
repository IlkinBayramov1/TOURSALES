import { vendorAxiosClient } from '../../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../../shared/api/vendorEndpoints';
import { ApiResponse, Booking } from '@toursales/types';

export interface DestinationStat {
  id: string;
  name: string;
  type: 'daxili' | 'xarici';
  tickets: number;
  revenue: string;
  revenueNum?: number;
  percent: number;
  color: string;
}

export interface DashboardActivity {
  id: string;
  title: string;
  time: string;
  desc: string;
  type: 'success' | 'warning' | 'primary' | 'danger';
  iconType: 'ticket' | 'dollar' | 'clock' | 'activity';
}

export interface SalesDistributionItem {
  name: string;
  value: number;
  tickets: number;
  color: string;
}

export interface MonthlyRevenueItem {
  month: string;
  revenue: number;
  bookings: number;
}

export interface OperationalAlert {
  id: string;
  type: 'warning' | 'danger' | 'primary' | 'success';
  title: string;
  desc?: string;
  message?: string;
  actionLink?: string;
  actionText?: string;
  count?: number;
  amount?: number;
}

export interface ManifestPassenger {
  bookingId: string;
  passengerName: string;
  phone?: string;
  email?: string;
  seatNumber: string;
  seatsCount: number;
  amount: number;
  paymentStatus: string;
  bookingStatus: string;
  isCheckedIn: boolean;
  checkedInAt?: string | null;
}

export interface ManifestSummary {
  tour: {
    id: string;
    title: string;
    type?: string;
    startDate: string;
    price?: number;
    currency?: string;
    maxParticipants?: number;
    destinationCountry?: string;
  } | null;
  totalSeats: number;
  checkedInCount: number;
  passengers: ManifestPassenger[];
}

export interface VendorStats {
  companyName: string;
  isFinancialMasked?: boolean;
  availableBalance: number | null;
  pendingBalance: number | null;
  pendingDeposits: number | null;
  totalRevenue: number | null;
  revenueGrowth: number | null;
  avgTicketPrice?: number | null;
  totalBookingsCount: number;
  bookingsGrowth: number;
  totalSeatsSold: number;
  totalTours: number;
  activeToursCount: number;
  domesticToursCount: number;
  foreignToursCount: number;
  occupancyRate: number;
  checkInRate?: number;
  activeAds?: number;
  activeCampaigns?: number;
  salesDistribution: SalesDistributionItem[];
  monthlyRevenue: MonthlyRevenueItem[];
  popularDestinations: DestinationStat[];
  activities: DashboardActivity[];
  recentBookings: Booking[];
  operationalAlerts?: OperationalAlert[];
  allTimeRevenue?: number | null;
  allTimeBookingsCount?: number;
}

export const vendorDashboardApi = {
  getStats: async (period: string = 'month'): Promise<ApiResponse<VendorStats>> => {
    const res = await vendorAxiosClient.get<ApiResponse<VendorStats>>(
      VENDOR_ENDPOINTS.DASHBOARD.STATS,
      { params: { period } }
    );
    return res.data;
  },

  getManifestSummary: async (tourId?: string): Promise<ApiResponse<ManifestSummary>> => {
    const res = await vendorAxiosClient.get<ApiResponse<ManifestSummary>>(
      VENDOR_ENDPOINTS.DASHBOARD.MANIFEST(tourId)
    );
    return res.data;
  },

  exportReport: async (period: string = 'month'): Promise<void> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.DASHBOARD.EXPORT, {
      params: { period },
      responseType: 'blob',
    });

    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `toursales_hesabat_${period}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

