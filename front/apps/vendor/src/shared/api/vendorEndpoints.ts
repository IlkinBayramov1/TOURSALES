export const VENDOR_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
  },
  PROFILE: {
    COMPANY: '/companies/my-company',
    UPDATE: '/companies/my-company',
  },
  DASHBOARD: {
    STATS: '/companies/my-company/stats',
  },
  TOURS: {
    MY_TOURS: '/tours/my-tours',
    CREATE: '/tours',
    DETAIL: (id: string) => `/tours/${id}`,
    UPDATE: (id: string) => `/tours/${id}`,
    DELETE: (id: string) => `/tours/${id}`,
    CONFIG_SEATS: (id: string) => `/tours/${id}/seats`,
  },
  BOOKINGS: {
    LIST: '/bookings/vendor/bookings',
    DETAIL: (id: string) => `/bookings/vendor/bookings/${id}`,
    CHECK_IN: '/bookings/vendor/check-in',
    ROSTER: (tourId: string) => `/bookings/vendor/roster/${tourId}`,
  },
  FINANCE: {
    OVERVIEW: '/finance/vendor/overview',
    TRANSACTIONS: '/finance/vendor/transactions',
    REQUEST_PAYOUT: '/finance/vendor/payout-request',
  },
  SUBSCRIPTION: {
    CURRENT: '/subscriptions/current',
    CHANGE_PLAN: '/subscriptions/change-plan',
  },
  TEAM: {
    LIST: '/teams/members',
    INVITE: '/teams/invite',
    REMOVE: (id: string) => `/teams/members/${id}`,
  },
  API_KEYS: {
    LIST: '/api-keys',
    CREATE: '/api-keys',
    REVOKE: (id: string) => `/api-keys/${id}`,
  },
  ADS: {
    MY_CAMPAIGNS: '/ads/my-campaigns',
    CREATE: '/ads',
  },
  COMMON: {
    UPLOAD: '/common/upload',
  },
};
