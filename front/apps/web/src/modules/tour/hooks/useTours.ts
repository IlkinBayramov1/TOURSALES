import { useState, useEffect, useCallback } from 'react';
import { Tour, TourFilterParams, PaginationMeta } from '@toursales/types';
import { tourApi } from '../api/tourApi';

export const useTours = (initialParams?: TourFilterParams) => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTours = useCallback(async (params?: TourFilterParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await tourApi.getTours(params);
      if (res?.data) {
        setTours(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      setError(err?.message || 'Turlar yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTours(initialParams);
  }, [fetchTours, JSON.stringify(initialParams)]);

  return {
    tours,
    meta,
    loading,
    error,
    refetch: fetchTours,
  };
};
