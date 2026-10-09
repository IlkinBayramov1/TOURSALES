import { axiosClient } from '../../../shared/api/axiosClient';
import { API_ENDPOINTS } from '../../../shared/api/apiEndpoints';
import {
  CustomTourRequest,
  CustomTourBid,
  CustomTourBooking,
  CustomTourEstimateResponse,
  CreateCustomRequestPayload,
  EstimatePayload
} from '@toursales/types';

export const customTourApi = {
  // 1. Calculate live estimate
  calculateEstimate: async (payload: EstimatePayload): Promise<CustomTourEstimateResponse> => {
    const res = await axiosClient.post<{ success: boolean; data: CustomTourEstimateResponse }>(
      API_ENDPOINTS.CUSTOM_TOURS.ESTIMATE,
      payload
    );
    return res.data?.data;
  },

  // 2. Create new custom tour request
  createRequest: async (payload: CreateCustomRequestPayload): Promise<CustomTourRequest> => {
    const res = await axiosClient.post<{ success: boolean; data: CustomTourRequest }>(
      API_ENDPOINTS.CUSTOM_TOURS.REQUESTS,
      payload
    );
    return res.data?.data;
  },

  // 3. Get customer's requests
  getMyRequests: async (): Promise<CustomTourRequest[]> => {
    const res = await axiosClient.get<{ success: boolean; data: CustomTourRequest[] }>(
      API_ENDPOINTS.CUSTOM_TOURS.MY_REQUESTS
    );
    return res.data?.data || [];
  },

  // 4. Get single request details
  getRequestDetails: async (id: string): Promise<CustomTourRequest> => {
    const res = await axiosClient.get<{ success: boolean; data: CustomTourRequest }>(
      API_ENDPOINTS.CUSTOM_TOURS.DETAIL(id)
    );
    return res.data?.data;
  },

  // 5. Cancel request
  cancelRequest: async (id: string): Promise<CustomTourRequest> => {
    const res = await axiosClient.post<{ success: boolean; data: CustomTourRequest }>(
      API_ENDPOINTS.CUSTOM_TOURS.CANCEL(id)
    );
    return res.data?.data;
  },

  // 6. Accept winning bid
  acceptBid: async (requestId: string, bidId: string): Promise<CustomTourRequest> => {
    const res = await axiosClient.post<{ success: boolean; data: CustomTourRequest }>(
      API_ENDPOINTS.CUSTOM_TOURS.ACCEPT_BID(bidId),
      { requestId }
    );
    return res.data?.data;
  },

  // 7. Checkout booking
  checkoutBooking: async (
    requestId: string,
    bidId: string,
    paymentPayload: { paymentType: string; installmentMonths?: number; cardLast4?: string }
  ): Promise<CustomTourBooking> => {
    const res = await axiosClient.post<{ success: boolean; data: CustomTourBooking }>(
      API_ENDPOINTS.CUSTOM_TOURS.CHECKOUT(bidId),
      {
        requestId,
        ...paymentPayload,
      }
    );
    return res.data?.data;
  },
};
