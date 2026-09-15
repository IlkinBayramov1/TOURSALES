import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Calendar, Users, ChevronDown, QrCode, Clock, ArrowRight, Tag, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Tour } from '@toursales/types';
import { useCurrency } from '@/shared/context/CurrencyContext';
import { formatDate } from '@/shared/utils/formatters';
import { campaignApi } from '@/modules/campaign/api/campaignApi';
import './TourStickyBookingBar.css';

interface TourStickyBookingBarProps {
  tour: Tour;
}

export const TourStickyBookingBar: React.FC<TourStickyBookingBarProps> = ({ tour }) => {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [passengerCount, setPassengerCount] = useState(1);

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccessMsg, setPromoSuccessMsg] = useState<string | null>(null);

  const availableSeats = tour.availableSeats ?? 40;
  const isSoldOut = availableSeats <= 0;
  const tourPrice = tour.price ?? tour.basePrice ?? 0;
  const subtotal = tourPrice * passengerCount;
  const finalPrice = Math.max(0, subtotal - discountAmount);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    setPromoLoading(true);
    setPromoError(null);
    setPromoSuccessMsg(null);

    try {
      const res = await campaignApi.validatePromoCode(promoInput.trim(), subtotal, tour.id);
      if (res?.success && res?.data) {
        const discount = res.data.discountAmount || 0;
        setDiscountAmount(discount);
        setAppliedPromo(promoInput.trim().toUpperCase());
        setPromoSuccessMsg(`"${promoInput.trim().toUpperCase()}" kuponu tətbiq edildi!`);
      } else {
        setPromoError(res?.message || 'Promo kod etibarsızdır');
      }
    } catch (err: any) {
      setPromoError(err?.response?.data?.message || 'Promo kod etibarsızdır və ya müddəti bitib');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setPromoInput('');
    setPromoSuccessMsg(null);
    setPromoError(null);
  };

  return (
    <div className="web-sticky-booking-card">
      {/* Price Header */}
      <div className="web-booking-card-header">
        <div className="web-booking-price-wrap">
          <span className="web-booking-price-amount">{formatPrice(tourPrice)}</span>
          <span className="web-booking-price-label">/ adambaşı</span>
        </div>
        {availableSeats <= 5 && availableSeats > 0 ? (
          <span className="web-booking-discount-badge" style={{ background: '#fef2f2', color: '#ef4444', borderColor: '#fca5a5' }}>
            Yalnız {availableSeats} yer qaldı!
          </span>
        ) : tour.earlyBirdDiscount && tour.earlyBirdDiscount > 0 ? (
          <span className="web-booking-discount-badge">
            -{tour.earlyBirdDiscount}% Erkən Rezervasiya
          </span>
        ) : null}
      </div>

      {/* Booking Form Preview */}
      <div className="web-booking-form-preview">
        <div className="web-booking-input-group">
          <div className="web-booking-input-label">Səfər Tarixi</div>
          <div className="web-booking-input-value">
            <Calendar size={15} />
            <span>{tour.startDate ? formatDate(tour.startDate) : 'Hər həftəsonu'}</span>
          </div>
        </div>

        <div className="web-booking-input-group">
          <div className="web-booking-input-label">Sərnişin Sayı</div>
          <div className="web-booking-input-value web-booking-passengers-select">
            <div className="web-booking-passengers-left">
              <Users size={15} />
              <select
                value={passengerCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPassengerCount(val);
                  if (appliedPromo) {
                    // Recalculate discount if passenger count changes
                    setDiscountAmount((val * tourPrice) * 0.2);
                  }
                }}
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

      {/* Instant Promo Code Input */}
      <div className="web-booking-promo-wrap" style={{ margin: '14px 0' }}>
        {!appliedPromo ? (
          <form onSubmit={handleApplyPromo} style={{ display: 'flex', gap: 6 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Promo kod daxil edin"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  borderRadius: 12,
                  border: promoError ? '1px solid #ef4444' : '1px solid #e2e8f0',
                  fontSize: 13,
                  fontWeight: 600,
                  outline: 'none',
                  textTransform: 'uppercase',
                }}
              />
              <Tag size={15} color="#94a3b8" style={{ position: 'absolute', left: 11, top: 11 }} />
            </div>
            <button
              type="submit"
              disabled={promoLoading || !promoInput.trim()}
              style={{
                padding: '9px 14px',
                borderRadius: 12,
                background: '#0f172a',
                color: '#fff',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: promoInput.trim() ? 'pointer' : 'default',
                opacity: promoInput.trim() ? 1 : 0.6,
              }}
            >
              {promoLoading ? '...' : 'Tətbiq'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 12px', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#059669' }}>
              <Check size={16} />
              <span>{appliedPromo} (-{formatPrice(discountAmount)})</span>
            </div>
            <button
              type="button"
              onClick={handleRemovePromo}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Ləğv et
            </button>
          </div>
        )}
        {promoError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', fontSize: 12, marginTop: 4 }}>
            <AlertCircle size={13} />
            <span>{promoError}</span>
          </div>
        )}
        {promoSuccessMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669', fontSize: 12, marginTop: 4 }}>
            <Sparkles size={13} />
            <span>{promoSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Primary CTA */}
      <button
        type="button"
        className="web-btn-book-primary"
        disabled={isSoldOut}
        onClick={() => {
          const params = new URLSearchParams();
          params.set('pax', passengerCount.toString());
          if (appliedPromo) params.set('promo', appliedPromo);
          navigate(`/booking/${tour.id}?${params.toString()}`);
        }}
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
          <span>{formatPrice(tourPrice)} x {passengerCount} Sərnişin</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="web-price-row" style={{ color: '#059669', fontWeight: 600 }}>
            <span>Kupon Endirimi</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        <div className="web-price-row">
          <span>Xidmət haqqı</span>
          <span className="web-free-badge">Pulsuz</span>
        </div>
        <div className="web-price-divider" />
        <div className="web-price-total-row">
          <span>Ümumi Məbləğ</span>
          <span>{formatPrice(finalPrice)}</span>
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
