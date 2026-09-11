import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Calendar, Users, ChevronDown, QrCode, Clock, ArrowRight } from 'lucide-react';
import { Tour } from '@toursales/types';
import { useCurrency } from '@/shared/context/CurrencyContext';
import { formatDate } from '@/shared/utils/formatters';
import './TourStickyBookingBar.css';

interface TourStickyBookingBarProps {
  tour: Tour;
}

export const TourStickyBookingBar: React.FC<TourStickyBookingBarProps> = ({ tour }) => {
  const navigate = useNavigate();
  const { format } = useCurrency();
  const [passengerCount, setPassengerCount] = useState(1);

  const isSoldOut = (tour.availableSeats ?? 0) <= 0;
  const totalPrice = tour.basePrice * passengerCount;

  return (
    <div className="web-sticky-booking-card">
      {/* Price Header */}
      <div className="web-booking-card-header">
        <div className="web-booking-price-wrap">
          <span className="web-booking-price-amount">{format(tour.basePrice)}</span>
          <span className="web-booking-price-label">/ adambaşı</span>
        </div>
        {tour.earlyBirdDiscount && tour.earlyBirdDiscount > 0 && (
          <span className="web-booking-discount-badge">
            -{tour.earlyBirdDiscount}% Erkən
          </span>
        )}
      </div>

      {/* Booking Form Preview */}
      <div className="web-booking-form-preview">
        <div className="web-booking-input-group">
          <div className="web-booking-input-label">Səfər Tarixi</div>
          <div className="web-booking-input-value">
            <Calendar size={15} />
            <span>{formatDate(tour.startDate)}</span>
          </div>
        </div>

        <div className="web-booking-input-group">
          <div className="web-booking-input-label">Sərnişin Sayı</div>
          <div className="web-booking-input-value web-booking-passengers-select">
            <div className="web-booking-passengers-left">
              <Users size={15} />
              <select
                value={passengerCount}
                onChange={(e) => setPassengerCount(Number(e.target.value))}
                className="web-booking-native-select"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} Sərnişin
                  </option>
                ))}
              </select>
            </div>
            <ChevronDown size={14} className="web-booking-select-arrow" />
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <button
        type="button"
        className="web-btn-book-primary"
        disabled={isSoldOut}
        onClick={() => navigate(`/booking/${tour.id}?pax=${passengerCount}`)}
      >
        <span>{isSoldOut ? 'Bütün Yerlər Dolub' : 'Yerini İndi Rezerv Et'}</span>
        <ArrowRight size={16} />
      </button>

      <p className="web-booking-note">
        Yerinizi təsdiqləmək üçün cəmi 5 AZN beh tələb olunur. Qalıq məbləği avtobusda ödəyə bilərsiniz.
      </p>

      {/* Price Breakdown */}
      <div className="web-price-breakdown">
        <div className="web-price-row">
          <span>{format(tour.basePrice)} x {passengerCount} Sərnişin</span>
          <span>{format(totalPrice)}</span>
        </div>
        <div className="web-price-row">
          <span>Xidmət haqqı</span>
          <span className="web-free-badge">Pulsuz</span>
        </div>
        <div className="web-price-divider" />
        <div className="web-price-total-row">
          <span>Ümumi Məbləğ</span>
          <span>{format(totalPrice)}</span>
        </div>
      </div>

      {/* Trust reassurance icons */}
      <div className="web-booking-reassurance">
        <div className="web-reassurance-item">
          <ShieldCheck size={14} className="web-reassurance-icon" />
          <span>Dərhal Onlayn Təsdiq</span>
        </div>
        <div className="web-reassurance-item">
          <QrCode size={14} className="web-reassurance-icon" />
          <span>Elektron QR Bilet</span>
        </div>
        <div className="web-reassurance-item">
          <Clock size={14} className="web-reassurance-icon" />
          <span>24/7 Dəstək Xidməti</span>
        </div>
      </div>
    </div>
  );
};
