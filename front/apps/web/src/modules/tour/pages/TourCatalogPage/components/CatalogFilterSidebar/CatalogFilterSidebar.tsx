import React from 'react';
import { TourFilter } from '@/modules/tour/components/TourFilter/TourFilter';
import { TourFilterParams } from '@toursales/types';
import './CatalogFilterSidebar.css';

interface CatalogFilterSidebarProps {
  filters: TourFilterParams;
  onChange: (newFilters: TourFilterParams) => void;
  onReset: () => void;
}

export const CatalogFilterSidebar: React.FC<CatalogFilterSidebarProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  return (
    <aside className="web-catalog-filter-sidebar">
      <TourFilter filters={filters} onChange={onChange} onReset={onReset} />
    </aside>
  );
};
