import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Compass, Search, Trash2, Info, LogIn, Filter, SlidersHorizontal } from 'lucide-react';
import { Card, Button, Spinner } from '@toursales/ui';
import { AccountSidebar } from '../../components/AccountSidebar/AccountSidebar';
import { TourCard } from '@/modules/tour/components/TourCard/TourCard';
import { useFavorites } from '@/shared/context/FavoritesContext';
import { useAuth } from '@/shared/hooks/useAuth';
import './FavoritesPage.css';

export const FavoritesPage: React.FC = () => {
  const { favorites, favoritesCount, isLoading, toggleFavorite, clearFavorites } = useFavorites();
  const { isAuthenticated } = useAuth();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'DOMESTIC' | 'FOREIGN'>('ALL');
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  // Filtered favorites list
  const filteredFavorites = useMemo(() => {
    return favorites.filter((tour) => {
      // Type / Category filter
      if (selectedFilter === 'DOMESTIC') {
        const isDomestic = tour.type === 'DOMESTIC' || tour.category === 'DOMESTIC';
        if (!isDomestic) return false;
      } else if (selectedFilter === 'FOREIGN') {
        const isForeign = tour.type === 'FOREIGN' || tour.category === 'FOREIGN';
        if (!isForeign) return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const titleMatch = tour.title?.toLowerCase().includes(term);
        const regionMatch = tour.region?.toLowerCase().includes(term);
        const destinationMatch = tour.destination?.toLowerCase().includes(term);
        const companyMatch = (tour.company?.name || tour.companyName || '')
          .toLowerCase()
          .includes(term);
        return Boolean(titleMatch || regionMatch || destinationMatch || companyMatch);
      }

      return true;
    });
  }, [favorites, searchTerm, selectedFilter]);

  const handleClearAll = async () => {
    if (confirmClear) {
      await clearFavorites();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 5000);
    }
  };

  return (
    <div className="web-account-layout-container">
      <div className="web-account-grid">
        <aside className="web-account-sidebar-col">
          <AccountSidebar />
        </aside>

        <main className="web-account-main-col">
          {/* Guest Advisory Banner */}
          {!isAuthenticated && (
            <div className="web-favorites-guest-banner">
              <div className="web-guest-banner-icon">
                <Info size={20} />
              </div>
              <div className="web-guest-banner-text">
                <strong>Qonaq Rejimi:</strong> Seçdiyiniz turlar hal-hazırda bu brauzerdə yadda saxlanılır. Bütün cihazlarınızda sinxron saxlamaq üçün hesabınıza daxil olun.
              </div>
              <Link to="/login" className="web-guest-banner-action">
                <LogIn size={15} />
                <span>Daxil Ol</span>
              </Link>
            </div>
          )}

          {/* Header */}
          <div className="web-account-page-header web-fav-page-header">
            <div>
              <div className="web-fav-title-row">
                <h1>Seçilmiş Turlar</h1>
                <span className="web-fav-total-badge">{favoritesCount}</span>
              </div>
              <p>Bəyəndiyiniz və sonradan rezerv etmək üçün yadda saxladığınız bütün ekskursiya və turlar.</p>
            </div>

            {favorites.length > 0 && (
              <div className="web-fav-header-actions">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleClearAll}
                  leftIcon={<Trash2 size={16} />}
                >
                  {confirmClear ? 'Əminsiniz? (Təsdiqlə)' : 'Hamısını Təmizlə'}
                </Button>
              </div>
            )}
          </div>

          {/* Search & Filter Bar (Only if favorites exist) */}
          {favorites.length > 0 && (
            <div className="web-favorites-filter-bar">
              <div className="web-favorites-search-box">
                <Search size={18} className="web-fav-search-icon" />
                <input
                  type="text"
                  placeholder="Seçilmiş turlar arasında axtar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="web-fav-search-input"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="web-fav-search-clear"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="web-favorites-type-filters">
                <button
                  type="button"
                  className={`web-fav-filter-chip ${selectedFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('ALL')}
                >
                  Hamısı ({favorites.length})
                </button>
                <button
                  type="button"
                  className={`web-fav-filter-chip ${selectedFilter === 'DOMESTIC' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('DOMESTIC')}
                >
                  🇦🇿 Daxili
                </button>
                <button
                  type="button"
                  className={`web-fav-filter-chip ${selectedFilter === 'FOREIGN' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('FOREIGN')}
                >
                  ✈️ Xarici
                </button>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          {isLoading ? (
            <div className="web-favorites-loading">
              <Spinner size="lg" />
              <p>Seçilmiş turlarınız hazırlanır...</p>
            </div>
          ) : favorites.length === 0 ? (
            <Card variant="default" className="web-favorites-empty">
              <div className="web-empty-heart-circle">
                <Heart size={44} className="web-empty-heart-icon" />
              </div>
              <h3>Seçilmiş turunuz yoxdur</h3>
              <p>İstənilən turun üzərindəki ürək ikonuna klikləyərək bəyəndiyiniz səyahətləri buraya əlavə edə bilərsiniz.</p>
              <Link to="/catalog">
                <Button variant="primary" size="md">
                  <Compass size={18} />
                  <span>Turlar Kataloquna Get</span>
                </Button>
              </Link>
            </Card>
          ) : filteredFavorites.length === 0 ? (
            <div className="web-favorites-no-results">
              <SlidersHorizontal size={36} className="web-no-results-icon" />
              <h3>Axtarışa uyğun seçilmiş tur tapılmadı</h3>
              <p>"{searchTerm}" üzrə heç bir nəticə çıxmadı. Filterləri sıfırlayın və ya axtarış sözünü dəyişin.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedFilter('ALL');
                }}
              >
                Filterləri Sıfırla
              </Button>
            </div>
          ) : (
            <div className="web-favorites-grid">
              {filteredFavorites.map((tour) => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  isFavorite={true}
                  onToggleFavorite={() => toggleFavorite(tour)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
