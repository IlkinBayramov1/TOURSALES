import { vendorAxiosClient } from '../../../shared/api/vendorAxiosClient';
import { VENDOR_ENDPOINTS } from '../../../shared/api/vendorEndpoints';
import {
  CustomTourRequest,
  CustomTourBid,
  SubmitBidPayload
} from '@toursales/types';

export interface VendorTenderStats {
  totalOpenTenders: number;
  mySubmittedBids: number;
  myWonBids: number;
  myPendingBids: number;
  myRejectedBids: number;
  totalWonAmount: number;
}

export const vendorCustomTourApi = {
  // Get active tender requests board
  getTenderBoard: async (params?: { destination?: string; vehicleType?: string; status?: string }): Promise<CustomTourRequest[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.CUSTOM_TOURS.TENDER_BOARD, { params });
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.requests)) return raw.requests;
    return [];
  },

  // Get vendor tender KPI stats
  getStats: async (): Promise<VendorTenderStats> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.CUSTOM_TOURS.STATS);
    return res.data?.data || {
      totalOpenTenders: 0,
      mySubmittedBids: 0,
      myWonBids: 0,
      myPendingBids: 0,
      myRejectedBids: 0,
      totalWonAmount: 0,
    };
  },

  // Get details of a single custom tour request
  getRequestDetails: async (requestId: string): Promise<CustomTourRequest> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.CUSTOM_TOURS.REQUEST_DETAILS(requestId));
    return res.data?.data || res.data;
  },

  // Submit a bid to an open tender
  submitBid: async (requestId: string, payload: SubmitBidPayload): Promise<CustomTourBid> => {
    const res = await vendorAxiosClient.post(VENDOR_ENDPOINTS.CUSTOM_TOURS.SUBMIT_BID(requestId), payload);
    return res.data?.data;
  },

  // Update a submitted pending bid
  updateBid: async (bidId: string, payload: Partial<SubmitBidPayload>): Promise<CustomTourBid> => {
    const res = await vendorAxiosClient.put(VENDOR_ENDPOINTS.CUSTOM_TOURS.UPDATE_BID(bidId), payload);
    return res.data?.data;
  },

  // Withdraw a submitted bid
  withdrawBid: async (bidId: string): Promise<{ success: boolean; message: string }> => {
    const res = await vendorAxiosClient.delete(VENDOR_ENDPOINTS.CUSTOM_TOURS.WITHDRAW_BID(bidId));
    return res.data;
  },

  // Get my submitted bids
  getMyBids: async (): Promise<CustomTourBid[]> => {
    const res = await vendorAxiosClient.get(VENDOR_ENDPOINTS.CUSTOM_TOURS.MY_BIDS);
    const raw = res.data?.data !== undefined ? res.data.data : res.data;
    return Array.isArray(raw) ? raw : [];
  },
};

