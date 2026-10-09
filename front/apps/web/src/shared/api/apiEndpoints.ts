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

  // Hotels & Accommodation
  HOTELS: {
    SEARCH: '/api/v1/hotels',
    DETAIL: (id: string) => `/api/v1/hotels/${id}`,
    ROOM_CALENDAR: (id: string, roomId: string) => `/api/v1/hotels/${id}/rooms/${roomId}/calendar`,
    RECOMMENDED: (tourId: string) => `/api/v1/hotels/recommendations/tour/${tourId}`,
    BOOK: '/api/v1/hotels/bookings',
    MY_BOOKINGS: '/api/v1/hotels/bookings/my',
    BOOKING_DETAIL: (id: string) => `/api/v1/hotels/bookings/${id}`,
    PAY_BALANCE: (id: string) => `/api/v1/hotels/bookings/${id}/pay-balance`,
    CANCEL: (id: string) => `/api/v1/hotels/bookings/${id}/cancel`,
  },

  // Chat & Real-Time Messaging (Faza 4)
  CHAT: {
    CONVERSATIONS: '/api/v1/chat/conversations',
    MY_CONVERSATIONS: '/api/v1/chat/conversations/my',
    MESSAGES: (conversationId: string) => `/api/v1/chat/conversations/${conversationId}/messages`,
    MARK_READ: (conversationId: string) => `/api/v1/chat/conversations/${conversationId}/read`,
  },

  // Support Tickets (Faza 4)
  TICKETS: {
    CREATE: '/api/v1/tickets',
    MY_TICKETS: '/api/v1/tickets/my',
    DETAIL: (id: string) => `/api/v1/tickets/${id}`,
    REPLY: (id: string) => `/api/v1/tickets/${id}/reply`,
    STATUS: (id: string) => `/api/v1/tickets/${id}/status`,
    ESCALATE: (id: string) => `/api/v1/tickets/${id}/escalate`,
  },

  // Custom Private Tours & B2B Tender (Faza 5)
  CUSTOM_TOURS: {
    ESTIMATE: '/api/v1/custom-tours/estimate',
    REQUESTS: '/api/v1/custom-tours/requests',
    MY_REQUESTS: '/api/v1/custom-tours/my-requests',
    DETAIL: (id: string) => `/api/v1/custom-tours/requests/${id}`,
    CANCEL: (id: string) => `/api/v1/custom-tours/requests/${id}/cancel`,
    ACCEPT_BID: (bidId: string) => `/api/v1/custom-tours/bids/${bidId}/accept`,
    CHECKOUT: (bidId: string) => `/api/v1/custom-tours/bids/${bidId}/checkout`,
  },

  // AI Concierge & Smart Yield Pricing (Faza 6)
  AI_CONCIERGE: {
    RECOMMEND: '/api/v1/ai-concierge/recommend',
    PARSE: '/api/v1/ai-concierge/parse',
  },
  YIELD_PRICING: {
    TOUR: (tourId: string) => `/api/v1/yield-pricing/tours/${tourId}`,
  },
};

