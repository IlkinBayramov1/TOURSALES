export type ConversationContextType = 'GENERAL' | 'TOUR' | 'HOTEL' | 'BOOKING';
export type MessageSenderRole = 'USER' | 'VENDOR' | 'ADMIN' | 'SYSTEM';

export type TicketCategory =
  | 'REFUND_REQUEST'
  | 'DATE_OR_SEAT_CHANGE'
  | 'COMPLAINT'
  | 'PAYMENT_ISSUE'
  | 'HOTEL_INQUIRY'
  | 'GENERAL_SUPPORT';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_CUSTOMER'
  | 'WAITING_VENDOR'
  | 'RESOLVED'
  | 'CLOSED'
  | 'ESCALATED_TO_ADMIN';

export interface PinnedContextMeta {
  type?: 'TOUR' | 'HOTEL' | 'BOOKING' | string;
  id?: string;
  title?: string;
  price?: number;
  date?: string;
  image?: string | null;
  imageUrl?: string | null;
  city?: string;
  stars?: number;
  bookingNumber?: string;
  amount?: number;
  status?: string;
  link?: string | null;
}

export interface Conversation {
  id: string;
  userId: string;
  companyId: string;
  contextType: ConversationContextType | string;
  contextTourId?: string | null;
  contextHotelId?: string | null;
  contextBookingId?: string | null;
  pinnedMeta?: string | null | any; // JSON string or parsed object
  status: string;
  lastMessageText?: string | null;
  lastMessage?: string | null;
  lastMessageAt: string;
  unreadCountUser: number;
  unreadCountVendor: number;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    rating?: number;
  };
  user?: {
    id: string;
    name?: string | null;
    email: string;
    phoneNumber?: string | null;
    loyaltyPoints?: number;
  };
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: MessageSenderRole | string;
  content: string;
  attachments?: string | null; // JSON string of [{ name, url, type, size }]
  isRead: boolean;
  readAt?: string | null;
  isSystemEvent: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  companyId?: string | null;
  bookingId?: string | null;
  category: TicketCategory | string;
  priority: TicketPriority | string;
  status: TicketStatus | string;
  subject: string;
  description: string;
  attachments?: string | null;
  requestedRefund?: number | null;
  approvedRefund?: number | null;
  assignedAdminId?: string | null;
  internalNotes?: string | null;
  escalatedToAdmin?: boolean;
  resolutionReason?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    phoneNumber?: string | null;
  } | null;
  user?: {
    id: string;
    name?: string | null;
    email: string;
    phoneNumber?: string | null;
  };
  messages?: TicketMessage[];
  booking?: {
    id: string;
    type?: 'TOUR' | 'HOTEL' | string;
    title?: string;
    tourTitle?: string;
    tourStartDate?: string | null;
    startDate?: string | null;
    seats?: number;
    passengerName?: string;
    contactNumber?: string;
    totalAmount?: number;
    paidAmount?: number;
    remainingAmount?: number;
    status?: string;
    paymentStatus?: string;
  } | null;
  cancellationPolicyAnalysis?: {
    daysLeft: number;
    refundPercent: number;
    totalPaid: number;
    recommendedAmount: number;
    policyExplanation: string;
    policyTier: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'NO_REFUND' | string;
  } | null;
  attachmentsList?: Array<{ name: string; url: string; size?: number; type?: string }>;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: MessageSenderRole | string;
  message: string;
  attachments?: string | null;
  isInternalNote: boolean;
  sender?: {
    id: string;
    name: string;
    role?: string;
    roleLabel?: string;
  } | null;
  attachmentsList?: Array<{ name: string; url: string; size?: number; type?: string }>;
  createdAt: string;
}

export interface CannedResponse {
  id: string;
  companyId: string;
  title: string;
  shortcut: string;
  content: string;
  category?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartConversationPayload {
  userId?: string;
  companyId: string;
  contextType?: ConversationContextType | string;
  contextTourId?: string;
  contextHotelId?: string;
  contextBookingId?: string;
}

export interface SendChatMessagePayload {
  content?: string;
  attachments?: Array<{ name: string; url: string; type?: string; size?: number }>;
  senderId?: string;
  senderRole?: string;
}

export interface CreateTicketPayload {
  companyId?: string;
  bookingId?: string;
  category: TicketCategory | string;
  priority?: TicketPriority | string;
  subject: string;
  description: string;
  requestedRefund?: number;
  attachments?: Array<{ name: string; url: string }>;
}

export interface ReplyTicketPayload {
  message: string;
  isInternalNote?: boolean;
  attachments?: Array<{ name: string; url: string }>;
  senderId?: string;
  senderRole?: string;
}

export interface UpdateTicketPayload {
  status?: TicketStatus | string;
  priority?: TicketPriority | string;
  assignedAdminId?: string;
  approvedRefund?: number;
  internalNotes?: string;
  resolutionReason?: string;
}

