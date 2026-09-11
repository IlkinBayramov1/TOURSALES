import { adminAxiosClient } from '../../shared/api/adminAxiosClient';
import { ADMIN_ENDPOINTS } from '../../shared/api/adminEndpoints';
import { SubscriptionPlan } from '@toursales/types';

export const subscriptionsAdminApi = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    try {
      const res = await adminAxiosClient.get(ADMIN_ENDPOINTS.SUBSCRIPTIONS.PLANS);
      return res.data?.data || res.data;
    } catch {
      return [
        {
          id: 'starter',
          name: 'Başlanğıc (Starter)',
          monthlyPrice: 0,
          currency: 'AZN',
          commissionRate: 8,
          maxTours: 5,
          features: [
            '5 aktiv tur elanı',
            '8% platform komissiyası',
            'Standart bilet satışı & QR vauçer',
            'E-poçt dəstəyi'
          ]
        },
        {
          id: 'pro',
          name: 'Peşəkar (Pro)',
          monthlyPrice: 49,
          currency: 'AZN',
          commissionRate: 5,
          maxTours: 50,
          isPopular: true,
          features: [
            '50 aktiv tur elanı',
            '5% platform komissiyası',
            'Avtobus oturacaq interaktiv seçimi',
            'FİN kod ilə sərnişin siyahısı (roster)',
            'QR Bilet Yoxlama skaneri',
            'API Açar inteqrasiyası'
          ]
        },
        {
          id: 'enterprise',
          name: 'Korporativ (Enterprise)',
          monthlyPrice: 149,
          currency: 'AZN',
          commissionRate: 3,
          maxTours: -1,
          features: [
            'Limitsiz aktiv tur elanları',
            '3% minimum platform komissiyası',
            'Fərdi menecer dəstəyi',
            'Reklam bannerlərində 20% endirim',
            'Avtomatlaşdırılmış e-Qaimə integrasiyası'
          ]
        }
      ];
    }
  },

  createPlan: async (plan: Omit<SubscriptionPlan, 'id'>): Promise<SubscriptionPlan> => {
    const res = await adminAxiosClient.post(ADMIN_ENDPOINTS.SUBSCRIPTIONS.PLANS, plan);
    return res.data?.data || res.data;
  },

  updatePlan: async (id: string, plan: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
    const res = await adminAxiosClient.put(ADMIN_ENDPOINTS.SUBSCRIPTIONS.PLAN_DETAIL(id), plan);
    return res.data?.data || res.data;
  },

  deletePlan: async (id: string): Promise<void> => {
    await adminAxiosClient.delete(ADMIN_ENDPOINTS.SUBSCRIPTIONS.PLAN_DETAIL(id));
  }
};
