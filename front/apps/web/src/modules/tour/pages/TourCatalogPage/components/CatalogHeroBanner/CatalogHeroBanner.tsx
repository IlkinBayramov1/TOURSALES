import React, { useState } from 'react';
import { Globe, Sparkles, Search } from 'lucide-react';
import './CatalogHeroBanner.css';

interface CatalogHeroBannerProps {
  totalCount: number;
  searchValue?: string;
  onSearch?: (value: string) => void;
}

export const CatalogHeroBanner: React.FC<CatalogHeroBannerProps> = ({
  totalCount,
  searchValue = '',
  onSearch,
}) => {
  const [localSearch, setLocalSearch] = useState(searchValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(localSearch);
    }
  };

  return (
    <header className="web-collection-banner">
      <div className="web-collection-banner-overlay" />
      <div className="web-collection-banner-content">
        <div className="web-collection-title-wrap">
          <div className="web-collection-icon-pulse-wrap">
            <Globe size={28} className="web-collection-banner-icon" />
          </div>
          <div>
            <div className="web-collection-badge-promo">
              <Sparkles size={14} /> Xəyallarınızdakı Səyahəti Tapın
            </div>
            <h1 className="web-collection-page-title">Kəşf Etməyə Başlayın</h1>
            <p className="web-collection-page-subtitle">
              Hazırda sistemdə <strong>{totalCount} aktiv tur</strong> mövcuddur. Ağıllı filtrlərimizlə sizə ən uyğun turları saniyələr içində tapın.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Search Bar */}
      <form className="web-collection-search-bar-floating" onSubmit={handleSubmit}>
        <Search size={20} className="web-collection-search-icon" />
        <input
          type="text"
          placeholder="İstiqamət, şəhər, təcrübə və ya tur şirkəti axtarın..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
        <button type="submit" className="web-btn-collection-search">
          Axtar
        </button>
      </form>
    </header>
  );
};
