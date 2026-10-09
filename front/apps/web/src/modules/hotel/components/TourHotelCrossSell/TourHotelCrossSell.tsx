import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, MapPin, Star, Sparkles, ArrowRight } from 'lucide-react';
import { hotelApi } from '../../api/hotelApi';
import { TourHotelCrossSellItem } from '@toursales/types';
import './TourHotelCrossSell.css';

interface TourHotelCrossSellProps {
  tourId: string;
}

export const TourHotelCrossSell: React.FC<TourHotelCrossSellProps> = ({ tourId }) => {
  const [recommendations, setRecommendations] = useState<TourHotelCrossSellItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadRecommendations = async () => {
      try {
        const data = await hotelApi.getTourRecommendedHotels(tourId);
        if (isMounted) {
          setRecommendations(data || []);
        }
      } catch (err) {
        console.error('Failed to load recommended hotels for tour:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRecommendations();
    return () => {
      isMounted = false;
    };
  }, [tourId]);

  if (loading || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="tour-hotel-cross-sell-section">
      <div className="tour-cross-sell-header">
        <div className="tour-cross-sell-title-wrap">
          <div className="tour-cross-sell-icon">
            <Building size={24} />
          </div>
          <div>
            <h3 className="tour-cross-sell-title">Bu Tur Üçün Seçilmiş Otellər</h3>
            <p className="tour-cross-sell-subtitle">
              Turla birlikdə sifariş edin, xüsusi paket endirimi və 30% ilkin depozit üstünlüyü əldə edin.
            </p>
          </div>
        </div>

        <span className="tour-cross-sell-badge">Paket Endirimi</span>
      </div>

      <div className="tour-cross-sell-grid">
        {recommendations.map((rec) => {
          const discountPct = rec.packageDiscountPercent || 15;
          const baseRate = rec.basePrice || rec.minPrice || 120;
          const discountedPrice = Math.round(baseRate * (1 - discountPct / 100));

          return (
            <div key={rec.id} className="tour-cross-sell-card">
              <div className="tour-cross-sell-img-wrap">
                <img
                  src={
                    rec.hotelImages && rec.hotelImages.length > 0
                      ? rec.hotelImages[0]
                      : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={rec.hotelName}
                  className="tour-cross-sell-img"
                  loading="lazy"
                />
              </div>

              <div className="tour-cross-sell-card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  {Array.from({ length: rec.hotelStarRating || 5 }).map((_, i) => (
                    <Star key={i} size={12} fill="#facc15" color="#facc15" />
                  ))}
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', marginLeft: 4 }}>
                    -{discountPct}% Paket
                  </span>
                </div>

                <h4 className="tour-cross-sell-hotel-name">{rec.hotelName}</h4>

                <div className="tour-cross-sell-location">
                  <MapPin size={13} color="#64748b" />
                  <span>{rec.hotelCity}</span>
                </div>

                <div className="tour-cross-sell-pricing-row">
                  <div className="tour-cross-sell-prices">
                    <span className="tour-cross-sell-old-price">{baseRate} ₼</span>
                    <span className="tour-cross-sell-new-price">{discountedPrice} ₼ / gecə</span>
                  </div>

                  <Link
                    to={`/hotels/${rec.hotelId}?fromTour=${tourId}`}
                    className="tour-cross-sell-add-btn"
                  >
                    <span>Otelə Bax</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
