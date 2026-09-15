import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShieldCheck, Gift, Heart, Bus, PlaneTakeoff, ArrowRight } from 'lucide-react';
import { Tour } from '@toursales/types';
import { useCurrency } from '@/shared/context/CurrencyContext';
import { useFavorites } from '@/shared/context/FavoritesContext';
import { formatDate } from '@/shared/utils/formatters';
import './TourCard.css';

interface TourCardProps {
  tour: Tour;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const TourCard: React.FC<TourCardProps> = ({
  tour,
  isFavorite: isFavoriteProp,
  onToggleFavorite: onToggleFavoriteProp,
}) => {
  const { formatPrice } = useCurrency();
  const { isFavorite: checkFavorite, toggleFavorite } = useFavorites();
  
  const effectiveIsFavorite = isFavoriteProp !== undefined ? isFavoriteProp : checkFavorite(tour.id);

  const isDomestic = tour.type === 'DOMESTIC' || tour.category === 'DOMESTIC';
  const tourPrice = tour.price ?? tour.basePrice ?? 0;
  const points = Math.max(15, Math.round(tourPrice * 0.05));

  const companyName = tour.company?.name || tour.company?.legalName || tour.companyName || 'Lisenziyalı Operator';
  const rating = tour.company?.rating || tour.ratingAvg || tour.rating || 4.9;

  let tourImage = 'https://images.unsplash.com/photo-1548777123-e216912df7d8?auto=format&fit=crop&q=80&w=600';
  if (Array.isArray(tour.images) && tour.images.length > 0 && tour.images[0]) {
    tourImage = tour.images[0];
  } else if (typeof tour.images === 'string') {
    try {
      const parsed = JSON.parse(tour.images);
      if (Array.isArray(parsed) && parsed.length > 0) tourImage = parsed[0];
    } catch {
      if ((tour.images as string).startsWith('http')) tourImage = tour.images;
    }
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavoriteProp) {
      onToggleFavoriteProp();
    } else {
      toggleFavorite(tour);
    }
  };

  return (
    <div className="web-tour-product-card">
      <div className="web-tour-thumbnail-wrapper">
        <img
          src={tourImage}
          alt={tour.title}
          className="web-tour-img"
          loading="lazy"
        />

        {/* Floating Top Badge */}
        <span className="web-floating-card-badge">
          {isDomestic ? 'Daxili Tur' : 'Xarici Tur'}
        </span>

        {/* Wishlist Button */}
        <button
          type="button"
          className={`web-wishlist-btn ${effectiveIsFavorite ? 'web-wishlist-active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={effectiveIsFavorite ? 'Seçilmişlərdən çıxar' : 'Seçilmişlərə əlavə et'}
        >
          <Heart size={18} fill={effectiveIsFavorite ? '#ff385c' : 'none'} color={effectiveIsFavorite ? '#ff385c' : 'currentColor'} />
        </button>

        {/* Loyalty Points Pill */}
        <div className="web-loyalty-points-indicator">
          <Gift size={12} />
          <span>+{points} Xal</span>
        </div>
      </div>

      <div className="web-tour-product-meta-body">
        <div className="web-operator-row">
          <div className="web-operator-title-group">
            <ShieldCheck size={14} className="web-verified-icon" />
            <span className="web-operator-company-name" title={companyName}>
              {companyName}
            </span>
          </div>
          <div className="web-rating-info-group">
            <Star size={14} className="web-star-rating-icon" />
            <span>{rating.toFixed(1)}</span>
          </div>
        </div>

        <h3 className="web-tour-title-heading" title={tour.title}>
          <Link to={`/tours/${tour.id}`}>{tour.title}</Link>
        </h3>

        <span className="web-tour-calendar-timeline">
          {isDomestic ? <Bus size={14} /> : <PlaneTakeoff size={14} />}
          <span>{tour.startDate ? formatDate(tour.startDate) : 'Hər həftəsonu'}</span>
          {tour.destination && <span>• {tour.destination}</span>}
        </span>

        <div className="web-tour-price-row">
          <div className="web-price-meta-block">
            <span>Başlayan qiymətlərlə</span>
            <h4>{formatPrice(tourPrice)}</h4>
          </div>

          <Link to={`/tours/${tour.id}`} className="web-tour-card-link-btn">
            <button className="web-btn-product-redirect" type="button">
              <span>Yer Seç</span>
              <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
