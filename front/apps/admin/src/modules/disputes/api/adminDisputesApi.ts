import { adminAxiosClient } from '../../../shared/api/adminAxiosClient';
import { SupportTicket, TicketMessage, UpdateTicketPayload } from '@toursales/types';

export const adminDisputesApi = {
  getTickets: async (params?: {
    status?: string;
    priority?: string;
    escalatedOnly?: boolean;
    search?: string;
  }): Promise<SupportTicket[]> => {
    const res = await adminAxiosClient.get('/tickets', { params });
    return res.data?.data || [];
  },

  getTicket: async (id: string): Promise<SupportTicket> => {
    const res = await adminAxiosClient.get(`/tickets/${id}`);
    return res.data?.data;
  },

  updateTicketRuling: async (
    id: string,
    payload: {
      status?: string;
      approvedRefund?: number;
      resolutionReason?: string;
      internalNotes?: string;
    }
  ): Promise<SupportTicket> => {
    const res = await adminAxiosClient.put(`/tickets/${id}`, payload);
    return res.data?.data;
  },

  replyTicket: async (
    id: string,
    payload: {
      message: string;
      isInternalNote?: boolean;
    }
  ): Promise<TicketMessage> => {
    const res = await adminAxiosClient.post(`/tickets/${id}/reply`, payload);
    return res.data?.data;
  },
};
