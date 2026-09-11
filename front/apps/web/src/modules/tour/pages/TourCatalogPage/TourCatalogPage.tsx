import React from 'react';
import { CatalogHeroBanner } from './components/CatalogHeroBanner/CatalogHeroBanner';
import { CatalogFilterSidebar } from './components/CatalogFilterSidebar/CatalogFilterSidebar';
import { CatalogSortToolbar } from './components/CatalogSortToolbar/CatalogSortToolbar';
import { TourGridList } from './components/TourGridList/TourGridList';
import { CatalogEmptyState } from './components/CatalogEmptyState/CatalogEmptyState';
import { useCatalogFilters } from './hooks/useCatalogFilters';
import { useTours } from '../../hooks/useTours';
import { Pagination, Spinner } from '@toursales/ui';
import './TourCatalogPage.css';

export const TourCatalogPage: React.FC = () => {
  const { filters, updateFilters, resetFilters } = useCatalogFilters();
  const { tours, meta, loading, error } = useTours(filters);

  return (
    <div className="web-catalog-container-page">
      <CatalogHeroBanner
        totalCount={meta.total || tours.length}
        searchValue={filters.search}
        onSearch={(search) => updateFilters({ ...filters, search, page: 1 })}
      />

      <div className="web-catalog-layout-grid">
        <CatalogFilterSidebar
          filters={filters}
          onChange={updateFilters}
          onReset={resetFilters}
        />

        <main className="web-catalog-results-area">
          <CatalogSortToolbar
            total={meta.total || tours.length}
            sortBy={filters.sortBy}
            onSortChange={(sortBy) => updateFilters({ ...filters, sortBy })}
          />

          {loading ? (
            <div className="web-catalog-loading-state">
              <Spinner size="lg" />
              <p>Turlar axtarılır və filtrasiya olunur...</p>
            </div>
          ) : error ? (
            <div className="web-catalog-error-state">
              <p>{error}</p>
            </div>
          ) : tours.length === 0 ? (
            <CatalogEmptyState onReset={resetFilters} />
          ) : (
            <>
              <TourGridList tours={tours} />
              {meta.totalPages > 1 && (
                <div className="web-catalog-pagination-wrap">
                  <Pagination
                    currentPage={meta.page}
                    totalPages={meta.totalPages}
                    onPageChange={(page) => updateFilters({ ...filters, page })}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
