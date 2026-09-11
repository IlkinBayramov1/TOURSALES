import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { Spinner, Input, Button } from '@toursales/ui';
import './DataTable.css';

export interface Column<T = any> {
  key?: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  accessor?: keyof T | string | ((item: T, index: number) => React.ReactNode);
  width?: string;
}

export interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchField?: (item: T) => string;
  pageSize?: number;
  emptyMessage?: string;
  headerActions?: React.ReactNode;
}

export function DataTable<T = any>({
  columns,
  data = [],
  isLoading = false,
  searchPlaceholder = 'Cədvəldə axtarın...',
  searchField,
  pageSize = 10,
  emptyMessage = 'Məlumat tapılmadı',
  headerActions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const safeData = data || [];
  const filteredData = safeData.filter((item) => {
    if (!search || !searchField) return true;
    return searchField(item).toLowerCase().includes(search.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const renderCell = (col: Column<T>, item: T, idx: number) => {
    if (col.render) {
      return col.render(item, idx);
    }
    if (typeof col.accessor === 'function') {
      return col.accessor(item, idx);
    }
    if (typeof col.accessor === 'string') {
      return (item as any)[col.accessor] ?? '—';
    }
    if (col.key) {
      return (item as any)[col.key] ?? '—';
    }
    return '—';
  };

  return (
    <div className="vendor-data-table-card">
      <div className="vendor-table-toolbar">
        {searchField && (
          <div className="vendor-table-search">
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        )}

        {headerActions && (
          <div className="vendor-table-header-actions">{headerActions}</div>
        )}
      </div>

      <div className="vendor-table-wrapper">
        <table className="vendor-data-table">
          <thead>
            <tr>
              {columns.map((col, cIdx) => (
                <th key={col.key || `col_${cIdx}`} style={{ width: col.width }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="vendor-table-loading-cell">
                  <Spinner size="md" />
                  <span>Məlumatlar yüklənir...</span>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="vendor-table-empty-cell">
                  <Inbox size={36} />
                  <p>{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr key={(item as any)?.id ?? idx}>
                  {columns.map((col, cIdx) => (
                    <td key={col.key || `cell_${cIdx}`}>
                      {renderCell(col, item, idx)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && filteredData.length > pageSize && (
        <div className="vendor-table-pagination">
          <span className="vendor-pagination-info">
            Göstərilir: {(currentPage - 1) * pageSize + 1} —{' '}
            {Math.min(currentPage * pageSize, filteredData.length)} / Cəmi{' '}
            {filteredData.length} qeyd
          </span>

          <div className="vendor-pagination-controls">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="vendor-current-page">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
