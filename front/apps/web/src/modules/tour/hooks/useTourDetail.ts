import { useState, useEffect, useCallback } from 'react';
import { Tour } from '@toursales/types';
import { tourApi } from '../api/tourApi';

export const useTourDetail = (tourId?: string) => {
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTour = useCallback(async () => {
    if (!tourId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await tourApi.getTourById(tourId);
      setTour(data);
    } catch (err: any) {
      setError(err?.message || 'Tur məlumatları yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  useEffect(() => {
    fetchTour();
  }, [fetchTour]);

  return { tour, loading, error, refetch: fetchTour };
};
