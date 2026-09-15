import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, RotateCcw, ChevronDown, Star, Search, Building2, MapPin } from 'lucide-react';
import { TourFilterParams, TourType, CompanyPublic } from '@toursales/types';
import { companyApi } from '@/modules/company/api/companyApi';
import { useCurrency } from '@/shared/context/CurrencyContext';
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
  { value: 'Quba', label: 'Quba & Qusar' },
  { value: 'Gabala', label: 'Qəbələ & Şəki' },
  { value: 'Lankaran', label: 'Lənkəran & Lerik' },
  { value: 'Georgia', label: 'Gürcüstan (Tbilisi/Batumi)' },
  { value: 'Turkey', label: 'Türkiyə (İstanbul/Antalya)' },
  { value: 'Europe', label: 'Avropa Turları' },
  { value: 'UAE', label: 'BƏƏ (Dubay)' },
];

export const TourFilter: React.FC<TourFilterProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const { currency } = useCurrency();
  const [companies, setCompanies] = useState<CompanyPublic[]>([]);

  useEffect(() => {
    let isMounted = true;
    companyApi.getPublicCompanies(30).then((data: CompanyPublic[]) => {
      if (isMounted) {
        setCompanies(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'TRY' ? '₺' : currency === 'RUB' ? '₽' : '₼';

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
            placeholder="Tur adı, məkan və ya şirkət..."
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>
      </div>

      {/* Tour Type */}
      <div className="web-filter-group">
        <label className="web-filter-label">Tur İstiqaməti</label>
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

      {/* Partner Agencies Filter */}
      <div className="web-filter-group">
        <label className="web-filter-label">Partnyor Agentlik</label>
        <div className="web-filter-select-wrap">
          <select
            className="web-filter-select"
            value={filters.companyId || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                companyId: e.target.value || undefined,
                page: 1,
              })
            }
          >
            <option value="">Bütün Agentliklər</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.isVerified ? '✓' : ''}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="web-filter-select-arrow" />
        </div>
      </div>

      {/* Region Dropdown */}
      <div className="web-filter-group">
        <label className="web-filter-label">Region / Şəhər</label>
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
        <label className="web-filter-label">Qiymət Aralığı ({currencySymbol})</label>
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
      </div>

      {/* Customer Rating */}
      <div className="web-filter-group">
        <label className="web-filter-label">Müştəri Reytinqi</label>
        <div className="web-checkbox-list">
          <label className="web-checkbox-label">
            <input 
              type="radio" 
              name="rating-filter" 
              checked={!filters.rating} 
              onChange={() => onChange({ ...filters, rating: undefined, page: 1 })}
            />
            <span className="web-custom-radio" />
            <span className="web-rating-text-label">Bütün reytinqlər</span>
          </label>
          <label className="web-checkbox-label">
            <input 
              type="radio" 
              name="rating-filter" 
              checked={filters.rating === 4.5} 
              onChange={() => onChange({ ...filters, rating: 4.5, page: 1 })}
            />
            <span className="web-custom-radio" />
            <div className="web-rating-stars-row">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={14} fill="#f59e0b" color="#f59e0b" />
              ))}
              <span className="web-rating-text-label">4.5+</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
