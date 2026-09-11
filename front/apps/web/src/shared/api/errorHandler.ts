import { ApiErrorResponse } from '@toursales/types';

export const parseApiError = (error: any): string => {
  if (error?.response?.data) {
    const data = error.response.data as ApiErrorResponse;
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (data.details) {
      const firstKey = Object.keys(data.details)[0];
      if (firstKey && data.details[firstKey].length > 0) {
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

  return 'Gözlənilməz xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.';
};
