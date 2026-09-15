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

  // Vouchers & Tickets
  VOUCHERS: {
    DETAIL: (bookingId: string) => `/api/v1/vouchers/${bookingId}`,
    PDF: (bookingId: string) => `/api/v1/vouchers/${bookingId}/pdf`,
    VERIFY: (token: string) => `/api/v1/vouchers/${token}/verify`,
  },

  // Payments
  PAYMENTS: {
    INIT: '/api/v1/payments/init',
    PROVIDERS: '/api/v1/payments/providers',
    STATUS: (id: string) => `/api/v1/payments/${id}/status`,
  },

  // Common (Currencies, Geofence, i18n)
  COMMON: {
    CURRENCIES: '/api/v1/common/currencies',
    GEOFENCE: '/api/v1/common/geofence',
  },

  // Sponsored Ads
  ADS: {
    PUBLIC: '/api/v1/ads/public',
    CLICK: (id: string) => `/api/v1/ads/${id}/click`,
  },

  // Partner Companies / Agencies
  COMPANIES: {
    PUBLIC_LIST: '/api/v1/companies/public',
    PUBLIC_DETAIL: (id: string) => `/api/v1/companies/public/${id}`,
  },

  // Campaigns & Promotions
  CAMPAIGNS: {
    ACTIVE: '/api/v1/campaigns/active',
    VALIDATE_PROMO: '/api/v1/campaigns/validate',
  },

  // Loyalty Program
  LOYALTY: {
    OFFERS: '/api/v1/loyalty/offers',
    REDEEM: '/api/v1/loyalty/redeem',
    HISTORY: '/api/v1/loyalty/history',
    OVERVIEW: '/api/v1/users/loyalty',
  },

  // Tour Reviews
  REVIEWS: {
    CREATE: '/api/v1/reviews',
    TOUR_REVIEWS: (tourId: string) => `/api/v1/reviews/tour/${tourId}`,
  },

  // CMS
  CMS: {
    BLOGS: '/api/v1/cms/blogs',
    FAQS: '/api/v1/cms/faqs',
  },
};
