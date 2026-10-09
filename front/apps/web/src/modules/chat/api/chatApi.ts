import { axiosClient } from '../../../shared/api/axiosClient';
import { API_ENDPOINTS } from '../../../shared/api/apiEndpoints';
import {
  Conversation,
  ChatMessage,
  StartConversationPayload,
  SendChatMessagePayload,
} from '@toursales/types';

export const chatApi = {
  startOrGetConversation: async (payload: StartConversationPayload): Promise<Conversation> => {
    const res = await axiosClient.post<{ success: boolean; data: Conversation }>(
      API_ENDPOINTS.CHAT.CONVERSATIONS,
      payload
    );
    return res.data?.data;
  },

  getMyConversations: async (): Promise<Conversation[]> => {
    const res = await axiosClient.get<{ success: boolean; data: Conversation[] }>(
      API_ENDPOINTS.CHAT.MY_CONVERSATIONS
    );
    return res.data?.data || [];
  },

  getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    const res = await axiosClient.get<{ success: boolean; data: ChatMessage[] }>(
      API_ENDPOINTS.CHAT.MESSAGES(conversationId)
    );
    return res.data?.data || [];
  },

  sendMessage: async (
    conversationId: string,
    payload: SendChatMessagePayload
  ): Promise<ChatMessage> => {
    const res = await axiosClient.post<{ success: boolean; data: ChatMessage }>(
      API_ENDPOINTS.CHAT.MESSAGES(conversationId),
      payload
    );
    return res.data?.data;
  },

  markAsRead: async (conversationId: string): Promise<{ success: boolean }> => {
    const res = await axiosClient.post<{ success: boolean }>(
      API_ENDPOINTS.CHAT.MARK_READ(conversationId)
    );
    return res.data;
  },
};
