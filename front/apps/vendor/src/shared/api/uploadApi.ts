import { vendorAxiosClient } from './vendorAxiosClient';
import { VENDOR_ENDPOINTS } from './vendorEndpoints';

export interface UploadResult {
  url: string;
  fullUrl?: string;
  filename?: string;
  originalName?: string;
  size?: number;
  mimetype?: string;
}

export interface UploadResponse {
  status: string;
  msg: string;
  data: UploadResult;
}

export const uploadApi = {
  uploadImage: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await vendorAxiosClient.post<UploadResponse>(
      VENDOR_ENDPOINTS.COMMON.UPLOAD,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  },
};
