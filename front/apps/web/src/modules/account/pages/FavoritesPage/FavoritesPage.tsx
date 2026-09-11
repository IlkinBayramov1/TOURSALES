import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Compass } from 'lucide-react';
import { Card, Button, Spinner } from '@toursales/ui';
import { Tour } from '@toursales/types';
import { AccountSidebar } from '../../components/AccountSidebar/AccountSidebar';
import { TourCard } from '@/modules/tour/components/TourCard/TourCard';
import { accountApi } from '../../api/accountApi';
import { useToast } from '@/shared/context/ToastContext';
import './FavoritesPage.css';

export const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<Tour[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { addToast } = useToast();

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await accountApi.getFavorites();
      setFavorites(res.data || []);
    } catch (err) {
      console.error('Seçilmiş turlar yüklənərkən xəta:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleToggleFavorite = async (tourId: string) => {
    try {
      await accountApi.toggleFavorite(tourId);
      setFavorites((prev) => prev.filter((t) => t.id !== tourId));
      addToast({ type: 'info', message: 'Tur seçilmişlərdən çıxarıldı.' });
    } catch (err) {
      console.error('Xəta:', err);
    }
  };

  return (
    <div className="web-account-layout-container">
      <div className="web-account-grid">
        <aside className="web-account-sidebar-col">
          <AccountSidebar />
        </aside>

        <main className="web-account-main-col">
          <div className="web-account-page-header">
            <h1>Seçilmiş Turlar ({favorites.length})</h1>
            <p>Bəyəndiyiniz və sonradan rezerv etmək üçün yadda saxladığınız turlar.</p>
          </div>

          {loading ? (
            <div className="web-favorites-loading">
              <Spinner size="lg" />
              <p>Seçilmiş turlarınız yüklənir...</p>
            </div>
          ) : favorites.length === 0 ? (
            <Card variant="default" className="web-favorites-empty">
              <Heart size={48} className="web-empty-heart-icon" />
              <h3>Seçilmiş turunuz yoxdur</h3>
              <p>Bəyəndiyiniz turların üzərindəki ürək ikonuna klikləyərək buraya əlavə edə bilərsiniz.</p>
              <Link to="/catalog">
                <Button variant="primary">
                  <Compass size={18} />
                  <span>Turlara Bax</span>
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="web-favorites-grid">
              {favorites.map((tour) => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  isFavorite={true}
                  onToggleFavorite={() => handleToggleFavorite(tour.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
