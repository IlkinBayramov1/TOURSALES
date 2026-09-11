import React from 'react';
import { ChevronDown, ArrowUpDown } from 'lucide-react';
import './CatalogSortToolbar.css';

interface CatalogSortToolbarProps {
  total: number;
  sortBy?: string;
  onSortChange: (sort: any) => void;
}

export const CatalogSortToolbar: React.FC<CatalogSortToolbarProps> = ({
  total,
  sortBy = 'newest',
  onSortChange,
}) => {
  return (
    <div className="web-results-header">
      <h2 className="web-results-count">{total} tur tapıldı</h2>
      <div className="web-sort-wrapper">
        <span className="web-sort-label">Sırala:</span>
        <div className="web-sort-select-box">
          <ArrowUpDown size={14} className="web-sort-icon" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="web-sort-select"
          >
            <option value="newest">Tövsiyə edilənlər</option>
            <option value="price_asc">Qiymət: Ucuzdan Bahaya</option>
            <option value="price_desc">Qiymət: Bahadan Ucuza</option>
            <option value="rating">Reytinqə görə</option>
          </select>
          <ChevronDown size={14} className="web-sort-arrow" />
        </div>
      </div>
    </div>
  );
};
