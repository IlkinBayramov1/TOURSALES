export const ADMIN_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
  },
  DASHBOARD: {
    STATS: '/superadmin/dashboard',
  },
  COMPANIES: {
    LIST: '/companies',
    DETAIL: (id: string) => `/companies/${id}`,
    UPDATE_STATUS: (id: string) => `/companies/${id}/status`,
    UPDATE_COMMISSION: (id: string) => `/companies/${id}/commission`,
  },
  SUBSCRIPTIONS: {
    PLANS: '/subscriptions',
    PLAN_DETAIL: (id: string) => `/subscriptions/${id}`,
  },
  FINANCE: {
    SUMMARY: '/finance/stats',
    LEDGER: '/finance/ledger',
    PAYOUTS: '/finance/payouts',
    APPROVE_PAYOUT: (id: string) => `/finance/payouts/${id}/approve`,
    REJECT_PAYOUT: (id: string) => `/finance/payouts/${id}/reject`,
  },
  AUDIT_LOGS: {
    LIST: '/superadmin/audit-logs',
  },
  CMS: {
    BLOGS: '/cms/blogs',
    BLOG_DETAIL: (id: string) => `/cms/blogs/${id}`,
    FAQS: '/cms/faqs',
    FAQ_DETAIL: (id: string) => `/cms/faqs/${id}`,
    BANNERS: '/cms/banners',
    BANNER_DETAIL: (id: string) => `/cms/banners/${id}`,
  },
};
