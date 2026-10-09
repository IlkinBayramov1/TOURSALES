import { vendorAxiosClient } from '../../shared/api/vendorAxiosClient';
import {
  GuideTourItem,
  GuideManifestResponse,
  GuideStaffItem,
  AssignGuidePayload,
} from '@toursales/types';

export interface ScanQrResponse {
  success: boolean;
  verified: boolean;
  isDuplicate?: boolean;
  message?: string;
  bookingNumber?: string;
  passengerNames?: string[];
  seatNumbers?: number[];
  checkedInAt?: string;
  checkedInBy?: string;
  tourTitle?: string;
}

export const guideApi = {
  // Bələdçiyə təyin edilmiş və ya şirkətin aktiv turlarını gətirir
  getGuideTours: async (): Promise<GuideTourItem[]> => {
    const res = await vendorAxiosClient.get('/bookings/guide/tours');
    return res.data?.data || [];
  },

  // Şirkətin bələdçi və heyət üzvlərini gətirir
  getCompanyGuides: async (): Promise<GuideStaffItem[]> => {
    const res = await vendorAxiosClient.get('/bookings/guide/staff');
    return res.data?.data || [];
  },

  // Tura bələdçi, sürücü və minik məlumatlarını təhkim edir
  assignGuideToTour: async (tourId: string, payload: AssignGuidePayload) => {
    const res = await vendorAxiosClient.patch(`/bookings/guide/tours/${tourId}/assign`, payload);
    return res.data?.data;
  },

  // Turun sərnişin manifestini və oturacaq xəritəsini gətirir
  getGuideManifest: async (tourId: string): Promise<GuideManifestResponse> => {
    const res = await vendorAxiosClient.get(`/bookings/guide/manifest/${tourId}`);
    return res.data?.data;
  },

  // Kamera və ya əl ilə QR kod skan edib minik təsdiqləyir
  scanQrCheckIn: async (payload: { qrToken?: string; bookingId?: string; tourId: string }): Promise<ScanQrResponse> => {
    const res = await vendorAxiosClient.post('/bookings/guide/scan-checkin', payload);
    return res.data?.data || res.data;
  },

  // Tək sərnişinin minik statusunu əl ilə açır/bağlayır (Toggle)
  toggleGuideCheckIn: async (bookingId: string, seatNumber?: number): Promise<{ success: boolean; isCheckedIn: boolean }> => {
    const res = await vendorAxiosClient.patch(`/bookings/guide/toggle-checkin/${bookingId}`, { seatNumber });
    return res.data?.data;
  },

  // Toplu minik qeydiyyatı (Hamısını və ya seçilmişləri mindir)
  bulkCheckIn: async (tourId: string, bookingIds?: string[]) => {
    const res = await vendorAxiosClient.post('/bookings/guide/bulk-checkin', { tourId, bookingIds });
    return res.data?.data;
  },

  // Oflayn rejimdə toplanmış skanları kütləvi göndərir
  syncOfflineCheckIns: async (tourId: string, checkIns: Array<{ qrToken?: string; bookingId?: string }>) => {
    const res = await vendorAxiosClient.post('/bookings/guide/sync-offline', { tourId, checkIns });
    return res.data?.data;
  },

  // WhatsApp bilet bildirişini yenidən göndərir
  resendWhatsApp: async (bookingId: string) => {
    const res = await vendorAxiosClient.post(`/bookings/notifications/whatsapp/resend/${bookingId}`);
    return res.data;
  },

  // Manifesti Excel faylı kimi endirir
  exportGuideManifestExcel: async (tourId: string, tourTitle?: string) => {
    const res = await vendorAxiosClient.get(`/bookings/guide/manifest/${tourId}/export`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manifest-${tourTitle ? tourTitle.replace(/\s+/g, '_') : tourId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
