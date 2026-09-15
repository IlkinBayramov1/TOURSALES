import { ApiErrorResponse } from '@toursales/types';

export const parseApiError = (error: any, defaultMsg?: string): string => {
  if (error?.response?.data) {
    const data = error.response.data as ApiErrorResponse;
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (data.details) {
      if (Array.isArray(data.details) && data.details.length > 0) {
        return typeof data.details[0] === 'string' ? data.details[0] : JSON.stringify(data.details[0]);
      }
      const firstKey = Object.keys(data.details)[0];
      if (firstKey && data.details[firstKey]?.length > 0) {
        return data.details[firstKey][0];
      }
    }
  }

  if (error?.message) {
    if (error.message === 'Network Error') {
      return 'Serverlə əlaqə qurulmadı. Zəhmət olmasa internet bağlantınızı yoxlayın.';
    }
    return error.message;
  }

  return defaultMsg || 'Gözlənilməz xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.';
};

export const getErrorMessage = (error: any, defaultMsg?: string): string => {
  return parseApiError(error, defaultMsg);
};
