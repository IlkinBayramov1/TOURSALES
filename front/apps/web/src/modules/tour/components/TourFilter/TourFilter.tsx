import React from 'react';
import { SlidersHorizontal, RotateCcw, ChevronDown, Star, Search } from 'lucide-react';
import { TourFilterParams, TourType } from '@toursales/types';
import './TourFilter.css';

interface TourFilterProps {
  filters: TourFilterParams;
  onChange: (newFilters: TourFilterParams) => void;
  onReset: () => void;
}

const REGIONS = [
  { value: '', label: 'Bütün Regionlar' },
  { value: 'Shusha', label: 'Şuşa (Qarabağ)' },
  { value: 'Khankendi', label: 'Xankəndi & Ağdam' },
  { value: 'Lachin', label: 'Laçın & Kəlbəcər' },
  { value: 'Quba', label: 'Quba' },
  { value: 'Qusar', label: 'Qusar (Şahdağ)' },
  { value: 'Sheki', label: 'Şəki' },
  { value: 'Gabala', label: 'Qəbələ' },
  { value: 'Lankaran', label: 'Lənkəran & Lerik' },
  { value: 'Georgia', label: 'Gürcüstan (Tbilisi/Batumi)' },
  { value: 'Turkey', label: 'Türkiyə' },
  { value: 'Europe', label: 'Avropa Turları' },
];

const CATEGORIES = [
  { id: 'nature', label: 'Təbiət və Dağlar', count: 45 },
  { id: 'culture', label: 'Mədəniyyət və Tarix', count: 28 },
  { id: 'beach', label: 'Dəniz və Çimərlik', count: 12 },
  { id: 'extreme', label: 'Aktiv və Ekstremal', count: 8 },
];

export const TourFilter: React.FC<TourFilterProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  return (
    <div className="web-tour-filter-box">
      {/* Header */}
      <div className="web-tour-filter-header">
        <h3 className="web-tour-filter-title">
          <SlidersHorizontal size={18} /> Filtrlər
        </h3>
        <button
          type="button"
          className="web-tour-filter-reset"
          onClick={onReset}
          title="Süzgəcləri sıfırla"
        >
          <RotateCcw size={14} /> Sıfırla
        </button>
      </div>

      {/* Keyword Search */}
      <div className="web-filter-group">
        <label className="web-filter-label">Açar Sözlə Axtarış</label>
        <div className="web-filter-search-wrap">
          <Search size={16} className="web-filter-search-icon" />
          <input
            type="text"
            className="web-filter-text-input"
            placeholder="Tur adı və ya təsvir..."
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>
      </div>

      {/* Tour Type */}
      <div className="web-filter-group">
        <label className="web-filter-label">Tur Tipi</label>
        <div className="web-filter-pill-group">
          {(['', 'DOMESTIC', 'FOREIGN'] as (TourType | '')[]).map((type) => (
            <button
              key={type}
              type="button"
              className={`web-filter-pill ${(!filters.type && type === '') || filters.type === type ? 'active' : ''}`}
              onClick={() =>
                onChange({
                  ...filters,
                  type: type === '' ? undefined : (type as TourType),
                  page: 1,
                })
              }
            >
              {type === '' ? 'Hamısı' : type === 'DOMESTIC' ? 'Daxili' : 'Xarici'}
            </button>
          ))}
        </div>
      </div>

      {/* Region Dropdown */}
      <div className="web-filter-group">
        <label className="web-filter-label">Region / İstiqamət</label>
        <div className="web-filter-select-wrap">
          <select
            className="web-filter-select"
            value={filters.region || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                region: e.target.value || undefined,
                page: 1,
              })
            }
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="web-filter-select-arrow" />
        </div>
      </div>

      {/* Price Range */}
      <div className="web-filter-group">
        <label className="web-filter-label">Qiymət Aralığı (₼)</label>
        <div className="web-price-inputs-row">
          <div className="web-price-input-wrap">
            <span>Min</span>
            <input
              type="number"
              placeholder="0"
              value={filters.minPrice ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  minPrice: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
            />
          </div>
          <div className="web-price-sep">-</div>
          <div className="web-price-input-wrap">
            <span>Maks</span>
            <input
              type="number"
              placeholder="5000"
              value={filters.maxPrice ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  maxPrice: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
            />
          </div>
        </div>
        <div className="web-range-slider-track">
          <div className="web-range-slider-fill" style={{ left: '0%', right: '35%' }} />
          <div className="web-range-thumb" style={{ left: '0%' }} />
          <div className="web-range-thumb" style={{ left: '65%' }} />
        </div>
      </div>

      {/* Category Checkboxes */}
      <div className="web-filter-group">
        <label className="web-filter-label">Kateqoriya</label>
        <div className="web-checkbox-list">
          {CATEGORIES.map((cat) => (
            <label key={cat.id} className="web-checkbox-label">
              <input type="checkbox" defaultChecked={cat.id === 'nature'} />
              <span className="web-custom-checkbox" />
              <span className="web-checkbox-text">{cat.label}</span>
              <span className="web-checkbox-count">({cat.count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Duration Options */}
      <div className="web-filter-group">
        <label className="web-filter-label">Müddət</label>
        <div className="web-checkbox-list">
          <label className="web-checkbox-label">
            <input type="checkbox" />
            <span className="web-custom-checkbox" />
            <span className="web-checkbox-text">1 Günlük (Gündəlik)</span>
          </label>
          <label className="web-checkbox-label">
            <input type="checkbox" defaultChecked />
            <span className="web-custom-checkbox" />
            <span className="web-checkbox-text">2 - 3 Gün (Həftəsonu)</span>
          </label>
          <label className="web-checkbox-label">
            <input type="checkbox" />
            <span className="web-custom-checkbox" />
            <span className="web-checkbox-text">4+ Gün (Uzunmüddətli)</span>
          </label>
        </div>
      </div>

      {/* Customer Rating */}
      <div className="web-filter-group">
        <label className="web-filter-label">Müştəri Reytinqi</label>
        <div className="web-checkbox-list">
          <label className="web-checkbox-label">
            <input type="radio" name="rating-filter" defaultChecked />
            <span className="web-custom-radio" />
            <div className="web-rating-stars-row">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={14} fill="#f59e0b" color="#f59e0b" />
              ))}
              <span className="web-rating-text-label">və yuxarı</span>
            </div>
          </label>
          <label className="web-checkbox-label">
            <input type="radio" name="rating-filter" />
            <span className="web-custom-radio" />
            <div className="web-rating-stars-row">
              {[1, 2, 3, 4].map((s) => (
                <Star key={s} size={14} fill="#f59e0b" color="#f59e0b" />
              ))}
              <Star size={14} color="#cbd5e1" />
              <span className="web-rating-text-label">4.0+</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
