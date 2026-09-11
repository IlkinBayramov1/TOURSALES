import { useSearchParams } from 'react-router-dom';
import { TourFilterParams, TourType } from '@toursales/types';

export const useCatalogFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: TourFilterParams = {
    search: searchParams.get('search') || undefined,
    type: (searchParams.get('type') as TourType) || undefined,
    region: searchParams.get('region') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sortBy: (searchParams.get('sortBy') as any) || undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: 12,
  };

  const updateFilters = (newFilters: TourFilterParams) => {
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.type) params.set('type', newFilters.type);
    if (newFilters.region) params.set('region', newFilters.region);
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice.toString());
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice.toString());
    if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy);
    if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString());
    setSearchParams(params);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return { filters, updateFilters, resetFilters };
};
