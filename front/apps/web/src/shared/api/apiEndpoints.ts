export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    REFRESH_TOKEN: '/api/v1/auth/refresh-token',
    LOGOUT: '/api/v1/auth/logout',
    VERIFY_2FA: '/api/v1/auth/verify-2fa',
    ENABLE_2FA: '/api/v1/auth/enable-2fa',
    ME: '/api/v1/auth/me',
  },

  // Tours
  TOURS: {
    LIST: '/api/v1/tours',
    DETAIL: (id: string) => `/api/v1/tours/${id}`,
    SEATS: (id: string) => `/api/v1/tours/${id}/seats`,
    LOCK_SEAT: (id: string) => `/api/v1/tours/${id}/seats/lock`,
    RELEASE_SEAT: (id: string) => `/api/v1/tours/${id}/seats/release`,
    CALCULATE_PRICE: (id: string) => `/api/v1/tours/${id}/calculate-price`,
    REVIEWS: (id: string) => `/api/v1/tours/${id}/reviews`,
  },

  // Bookings
  BOOKINGS: {
    CREATE: '/api/v1/bookings',
    MY_BOOKINGS: '/api/v1/bookings/my',
    DETAIL: (id: string) => `/api/v1/bookings/${id}`,
    CANCEL: (id: string) => `/api/v1/bookings/${id}/cancel`,
    VOUCHER: (id: string) => `/api/v1/bookings/${id}/voucher`,
    VERIFY_QR: '/api/v1/bookings/verify-qr',
  },

  // Payments
  PAYMENTS: {
    INIT: '/api/v1/payments/init',
    STATUS: (id: string) => `/api/v1/payments/${id}/status`,
  },

  // Common (Currencies, Geofence, i18n)
  COMMON: {
    CURRENCIES: '/api/v1/common/currencies',
    GEOFENCE: '/api/v1/common/geofence',
  },

  // Campaigns & CMS
  CAMPAIGNS: {
    ACTIVE: '/api/v1/campaigns',
    VALIDATE_PROMO: '/api/v1/campaigns/validate-promo',
  },
  CMS: {
    BLOGS: '/api/v1/cms/blogs',
    FAQS: '/api/v1/cms/faqs',
  },
};
