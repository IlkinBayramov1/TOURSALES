import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Star,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  CreditCard,
  Building,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { hotelApi } from '../../api/hotelApi';
import { Hotel, RoomType } from '@toursales/types';
import './HotelCatalogPage.css';

const AZERBAIJAN_CITIES = [
  'Bütün Şəhərlər',
  'Bakı',
  'Qəbələ',
  'Quba',
  'Şəki',
  'Şamaxı',
  'Lənkəran',
  'İsmayıllı',
  'Qusar',
  'Naftalan'
];

const HOTEL_CATEGORIES = [
  { id: 'LUXURY', label: 'Lüks və Premium' },
  { id: 'RESORT', label: 'Kurort və Dağ İstirahəti' },
  { id: 'BOUTIQUE', label: 'Butik Otel' },
  { id: 'SPA', label: 'Sağlamlıq və SPA' },
  { id: 'BUSINESS', label: 'Biznes və Şəhər' },
  { id: 'BUDGET', label: 'Büdcəli / Ailəvi' }
];

export const HotelCatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'Bütün Şəhərlər');
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [allowDepositOnly, setAllowDepositOnly] = useState(false);
  const [allowInstallmentsOnly, setAllowInstallmentsOnly] = useState(false);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams: Record<string, any> = {
        limit: 20,
      };

      if (keyword.trim()) queryParams.q = keyword.trim();
      if (selectedCity && selectedCity !== 'Bütün Şəhərlər') queryParams.city = selectedCity;
      if (selectedStars.length > 0) queryParams.starRating = selectedStars[0]; // primary filter
      if (selectedCategory) queryParams.category = selectedCategory;
      if (allowDepositOnly) queryParams.allowDeposit = true;
      if (allowInstallmentsOnly) queryParams.allowInstallments = true;

      const data = await hotelApi.searchHotels(queryParams);
      setHotels(data?.hotels || []);
    } catch (err: any) {
      console.error('Failed to load hotels:', err);
      setError('Otellər yüklənərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    } finally {
      setLoading(false);
    }
  }, [keyword, selectedCity, selectedStars, selectedCategory, allowDepositOnly, allowInstallmentsOnly]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHotels();
  };

  const handleResetFilters = () => {
    setKeyword('');
    setSelectedCity('Bütün Şəhərlər');
    setSelectedStars([]);
    setSelectedCategory('');
    setAllowDepositOnly(false);
    setAllowInstallmentsOnly(false);
  };

  const toggleStar = (star: number) => {
    if (selectedStars.includes(star)) {
      setSelectedStars(selectedStars.filter((s) => s !== star));
    } else {
      setSelectedStars([...selectedStars, star]);
    }
  };

  return (
    <div className="web-hotel-catalog-page">
      {/* Hero Search Banner */}
      <div className="web-hotel-hero-banner">
        <h1 className="web-hotel-hero-title">Azərbaycanın Seçilmiş Otelləri və İstirahət Mərkəzləri</h1>
        <p className="web-hotel-hero-subtitle">
          Qəbələ dağlarından Xəzər sahillərinədək ən yaxşı otellər. 30% ilkin ödəniş, BirKart/Tamkart taksitləri və ani WhatsApp təsdiqi ilə bron edin.
        </p>

        <form className="web-hotel-quick-search" onSubmit={handleSearchSubmit}>
          <div className="web-hotel-search-input-wrap">
            <Search size={18} color="#64748b" />
            <input
              type="text"
              placeholder="Otel adı, rayon və ya məkan..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="web-hotel-search-input-wrap">
            <MapPin size={18} color="#64748b" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              {AZERBAIJAN_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="web-hotel-search-input-wrap">
            <Building size={18} color="#64748b" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Bütün Kateqoriyalar</option>
              {HOTEL_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="web-hotel-search-btn">
            <Search size={18} />
            <span>Axtar</span>
          </button>
        </form>
      </div>

      {/* Main Layout Grid */}
      <div className="web-hotel-layout-grid">
        {/* Filter Sidebar */}
        <aside className="web-hotel-filter-sidebar">
          <div className="web-hotel-filter-header">
            <span className="web-hotel-filter-title">Filtrlər</span>
            <button
              type="button"
              className="web-hotel-filter-reset"
              onClick={handleResetFilters}
            >
              <RotateCcw size={14} style={{ marginRight: 4 }} />
              Sıfırla
            </button>
          </div>

          {/* Star Rating Filter */}
          <div className="web-hotel-filter-section">
            <div className="web-hotel-filter-label">Ulduz Sayı</div>
            <div className="web-hotel-checkbox-group">
              {[5, 4, 3].map((star) => (
                <label key={star} className="web-hotel-checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedStars.includes(star)}
                    onChange={() => toggleStar(star)}
                  />
                  <span>{star} Ulduzlu</span>
                  <div style={{ display: 'flex', marginLeft: 'auto', gap: 2 }}>
                    {Array.from({ length: star }).map((_, i) => (
                      <Star key={i} size={13} fill="#facc15" color="#facc15" />
                    ))}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Payment & Offer Filters */}
          <div className="web-hotel-filter-section">
            <div className="web-hotel-filter-label">Ödəniş Üstünlükləri</div>
            <div className="web-hotel-checkbox-group">
              <label className="web-hotel-checkbox-item">
                <input
                  type="checkbox"
                  checked={allowDepositOnly}
                  onChange={(e) => setAllowDepositOnly(e.target.checked)}
                />
                <span>30% İlkin Ödənişlə</span>
              </label>

              <label className="web-hotel-checkbox-item">
                <input
                  type="checkbox"
                  checked={allowInstallmentsOnly}
                  onChange={(e) => setAllowInstallmentsOnly(e.target.checked)}
                />
                <span>Birkart / Tamkart Taksit</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Results Area */}
        <section className="web-hotel-results-area">
          <div className="web-hotel-results-bar">
            <div className="web-hotel-count-text">
              <span>{hotels.length}</span> otel təklifi tapıldı
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <Loader2 size={36} className="animate-spin" color="#2563eb" />
            </div>
          ) : error ? (
            <div className="web-catalog-error-state">{error}</div>
          ) : hotels.length === 0 ? (
            <div className="web-hotel-empty-state">
              <Building size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
              <h3 className="web-hotel-empty-title">Axtarışa uyğun otel tapılmadı</h3>
              <p className="web-hotel-empty-desc">
                Zəhmət olmasa axtarış parametrlərini və ya seçilmiş filtrləri dəyişərək yenidən yoxlayın.
              </p>
              <button
                type="button"
                className="web-hotel-search-btn"
                style={{ margin: '0 auto' }}
                onClick={handleResetFilters}
              >
                Bütün Otelləri Göstər
              </button>
            </div>
          ) : (
            <div className="web-hotel-cards-grid">
              {hotels.map((hotel) => {
                const mainImage =
                  hotel.images && hotel.images.length > 0
                    ? hotel.images[0]
                    : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

                // Find lowest room base price
                const minPrice =
                  hotel.roomTypes && hotel.roomTypes.length > 0
                    ? Math.min(...hotel.roomTypes.map((r: RoomType) => r.basePrice))
                    : (hotel.minPrice || 120);

                return (
                  <div key={hotel.id} className="web-hotel-card">
                    <div className="web-hotel-card-media">
                      <img
                        src={mainImage}
                        alt={hotel.name}
                        className="web-hotel-card-img"
                        loading="lazy"
                      />
                      <div className="web-hotel-card-badge-top">
                        <span className="web-hotel-badge-stars">
                          <Star size={13} fill="#facc15" color="#facc15" />
                          {hotel.starRating} Ulduz
                        </span>
                        <span className="web-hotel-badge-category">
                          {hotel.category}
                        </span>
                      </div>
                    </div>

                    <div className="web-hotel-card-body">
                      <div className="web-hotel-card-location">
                        <MapPin size={14} color="#2563eb" />
                        <span>{hotel.city}, {hotel.region || 'Azərbaycan'}</span>
                      </div>

                      <h2 className="web-hotel-card-name">{hotel.name}</h2>

                      <div className="web-hotel-card-amenities">
                        {hotel.amenities && hotel.amenities.slice(0, 4).map((amenity, idx) => (
                          <span key={idx} className="web-hotel-amenity-tag">
                            {amenity}
                          </span>
                        ))}
                      </div>

                      <div className="web-hotel-card-footer">
                        <div className="web-hotel-price-block">
                          <span className="web-hotel-price-label">Gecəlik qiymət</span>
                          <div className="web-hotel-price-val">
                            {minPrice} ₼ <span>/ gecə</span>
                          </div>
                          {hotel.allowInstallments && (
                            <div className="web-hotel-installments-note">
                              <CreditCard size={12} style={{ display: 'inline', marginRight: 4 }} />
                              Birkart ilə {(minPrice / 12).toFixed(1)} ₼/ay
                            </div>
                          )}
                        </div>

                        <Link
                          to={`/hotels/${hotel.id}`}
                          className="web-hotel-view-btn"
                        >
                          <span>Otaqları Seç</span>
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
