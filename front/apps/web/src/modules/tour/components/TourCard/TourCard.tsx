import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Star, ShieldCheck, Gift, Heart, Bus, PlaneTakeoff, ArrowRight } from 'lucide-react';
import { Tour } from '@toursales/types';
import { useCurrency } from '@/shared/context/CurrencyContext';
import { formatDate } from '@/shared/utils/formatters';
import './TourCard.css';

interface TourCardProps {
  tour: Tour;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const TourCard: React.FC<TourCardProps> = ({
  tour,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const { format } = useCurrency();
  const isDomestic = tour.category === 'DOMESTIC';
  const points = isDomestic ? 10 : 50;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite();
    }
  };

  return (
    <div className="web-tour-product-card">
      <div className="web-tour-thumbnail-wrapper">
        <img
          src={tour.images?.[0] || 'https://images.unsplash.com/photo-1548777123-e216912df7d8?auto=format&fit=crop&q=80&w=600'}
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
          className={`web-wishlist-btn ${isFavorite ? 'web-wishlist-active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? 'Seçilmişlərdən çıxar' : 'Seçilmişlərə əlavə et'}
        >
          <Heart size={18} fill={isFavorite ? '#ff385c' : 'none'} color={isFavorite ? '#ff385c' : 'currentColor'} />
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
            <span className="web-operator-company-name">
              {tour.companyName || 'Lisenziyalı Operator'}
            </span>
          </div>
          <div className="web-rating-info-group">
            <Star size={14} className="web-star-rating-icon" />
            <span>{tour.ratingAvg ? tour.ratingAvg.toFixed(1) : '4.9'}</span>
          </div>
        </div>

        <h3 className="web-tour-title-heading" title={tour.title}>
          <Link to={`/tours/${tour.id}`}>{tour.title}</Link>
        </h3>

        <span className="web-tour-calendar-timeline">
          {isDomestic ? <Bus size={14} /> : <PlaneTakeoff size={14} />}
          <span>{formatDate(tour.startDate)}</span>
          {tour.destination && <span>• {tour.destination}</span>}
        </span>

        <div className="web-tour-price-row">
          <div className="web-price-meta-block">
            <span>Başlayan qiymətlərlə</span>
            <h4>{format(tour.basePrice)}</h4>
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
