import { axiosClient } from '../../../shared/api/axiosClient';
import { API_ENDPOINTS } from '../../../shared/api/apiEndpoints';
import {
  SupportTicket,
  TicketMessage,
  CreateTicketPayload,
  ReplyTicketPayload,
} from '@toursales/types';

export const ticketApi = {
  createTicket: async (payload: CreateTicketPayload): Promise<SupportTicket> => {
    const res = await axiosClient.post<{ success: boolean; data: SupportTicket }>(
      API_ENDPOINTS.TICKETS.CREATE,
      payload
    );
    return res.data?.data;
  },

  getMyTickets: async (): Promise<SupportTicket[]> => {
    const res = await axiosClient.get<{ success: boolean; data: SupportTicket[] }>(
      API_ENDPOINTS.TICKETS.MY_TICKETS
    );
    return res.data?.data || [];
  },

  getTicketDetails: async (id: string): Promise<SupportTicket> => {
    const res = await axiosClient.get<{ success: boolean; data: SupportTicket }>(
      API_ENDPOINTS.TICKETS.DETAIL(id)
    );
    return res.data?.data;
  },

  replyTicket: async (
    id: string,
    payload: ReplyTicketPayload
  ): Promise<TicketMessage> => {
    const res = await axiosClient.post<{ success: boolean; data: TicketMessage }>(
      API_ENDPOINTS.TICKETS.REPLY(id),
      payload
    );
    return res.data?.data;
  },

  escalateTicket: async (
    id: string,
    reason: string
  ): Promise<SupportTicket> => {
    const res = await axiosClient.post<{ success: boolean; data: SupportTicket }>(
      API_ENDPOINTS.TICKETS.ESCALATE(id),
      { reason }
    );
    return res.data?.data;
  },
};
