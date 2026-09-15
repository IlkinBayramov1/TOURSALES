/**
 * Centralized Customer Support & Contact Information for TOURSALES Platform
 */
export const SUPPORT_CONTACTS = {
  phoneDisplay: '+994 (77) 599 00 95',
  phoneRaw: '994775990095',
  whatsappUrl: 'https://wa.me/994775990095',
  whatsappUrlWithText: (text: string) =>
    `https://wa.me/994775990095?text=${encodeURIComponent(text)}`,
  email: 'support@toursales.az',
  address: 'Bakı ş., Nizami r-nu, Heydər Əliyev pr.',
  workHours: 'Həftənin 7 günü 09:00 - 21:00',
  defaultSupportMessage: 'Salam, TOURSALES platforması ilə bağlı məlumat almaq istəyirəm.',
};
