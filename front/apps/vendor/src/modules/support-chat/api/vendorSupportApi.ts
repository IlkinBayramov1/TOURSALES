import { vendorAxiosClient } from '../../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../../shared/api/vendorEndpoints';
import {
  Conversation,
  ChatMessage,
  SupportTicket,
  CannedResponse,
  ReplyTicketPayload,
  UpdateTicketPayload
} from '@toursales/types';

export const vendorSupportApi = {
  // Chat Conversations
  getConversations: async (params?: { contextType?: string }): Promise<Conversation[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.CHAT.CONVERSATIONS, { params });
    return res.data?.data || [];
  },

  getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.CHAT.MESSAGES(conversationId));
    return res.data?.data || [];
  },

  sendMessage: async (
    conversationId: string,
    content: string,
    attachments: Array<{ url: string; name: string; size?: number; type?: string }> = []
  ): Promise<ChatMessage> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.CHAT.MESSAGES(conversationId), {
      content,
      attachments,
    });
    return res.data?.data;
  },

  uploadFile: async (file: File): Promise<{
    url: string;
    fullUrl: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await vendorAxiosClient.post('/common/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data;
  },

  markAsRead: async (conversationId: string): Promise<{ success: boolean }> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.CHAT.MARK_READ(conversationId));
    return res.data;
  },

  // Canned Responses
  getCannedResponses: async (): Promise<CannedResponse[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.CHAT.CANNED_RESPONSES);
    return res.data?.data || [];
  },

  createCannedResponse: async (payload: {
    title: string;
    shortcut: string;
    content: string;
  }): Promise<CannedResponse> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.CHAT.CANNED_RESPONSES, payload);
    return res.data?.data;
  },

  deleteCannedResponse: async (id: string): Promise<{ success: boolean }> => {
    const res = await vendorAxiosClient.delete(VENDOR_ENDPOINTS.CHAT.DELETE_CANNED(id));
    return res.data;
  },

  // Customer CRM Profile
  getCustomerProfile: async (conversationId: string): Promise<{
    user: {
      id: string;
      name: string | null;
      email: string;
      phoneNumber: string | null;
      loyaltyPoints: number;
      status: string;
      createdAt: string;
    };
    totalBookingsCount: number;
    totalSpent: number;
    recentBookings: Array<{
      id: string;
      passengerName: string;
      passengerSurname: string;
      totalAmount: number | string;
      status: string;
      paymentStatus: string;
      bookingDate: string;
      seats: number;
      tour?: { id: string; title: string; startDate: string } | null;
    }>;
  }> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.CHAT.CUSTOMER_CRM(conversationId));
    return res.data?.data;
  },

  updateConversationStatus: async (conversationId: string, status: string): Promise<any> => {
    const res = await vendorAxiosClient.patch(VENDOR_ENDPOINTS.CHAT.UPDATE_STATUS(conversationId), { status });
    return res.data?.data;
  },

  // Support Tickets
  getTickets: async (params?: {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }): Promise<{ tickets: SupportTicket[]; stats?: any }> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.TICKETS.LIST, { params });
    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    return {
      tickets: list,
      stats: res.data?.stats,
    };
  },

  getTicket: async (id: string): Promise<SupportTicket> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.TICKETS.DETAIL(id));
    return res.data?.data;
  },

  replyTicket: async (id: string, payload: ReplyTicketPayload): Promise<any> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.TICKETS.REPLY(id), payload);
    return res.data?.data;
  },

  updateTicket: async (id: string, payload: UpdateTicketPayload): Promise<SupportTicket> => {
    const res = await vendorAxiosClient.put(VENDOR_ENDPOINTS.TICKETS.UPDATE(id), payload);
    return res.data?.data;
  },

  createTicket: async (payload: {
    subject: string;
    description: string;
    category?: string;
    priority?: string;
    attachments?: any;
  }): Promise<SupportTicket> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.TICKETS.LIST, payload);
    return res.data?.data;
  },

  escalateTicket: async (id: string, reason: string): Promise<SupportTicket> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.TICKETS.ESCALATE(id), { reason });
    return res.data?.data;
  },
};
