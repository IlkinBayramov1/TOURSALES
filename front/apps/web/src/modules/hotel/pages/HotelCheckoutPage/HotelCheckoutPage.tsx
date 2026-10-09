import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Calendar,
  Building,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { hotelApi } from '../../api/hotelApi';
import { HotelBooking } from '@toursales/types';
import './HotelCheckoutPage.css';

export const HotelCheckoutPage: React.FC = () => {
  const { roomTypeId } = useParams<{ roomTypeId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const checkInDate = searchParams.get('checkIn') || '';
  const checkOutDate = searchParams.get('checkOut') || '';
  const nightsCount = parseInt(searchParams.get('nights') || '1', 10);

  // Form State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('+994 ');
  const [guestEmail, setGuestEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentType, setPaymentType] = useState<'DEPOSIT_30' | 'FULL_PAYMENT'>('DEPOSIT_30');
  const [paymentProvider, setPaymentProvider] = useState<'BIRKART' | 'TAMKART' | 'BOLKART' | 'CARD'>('CARD');
  const [installmentMonths, setInstallmentMonths] = useState<number>(3);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<HotelBooking | null>(null);

  // Fallback estimates if backend calculation takes room base
  const estimatedNightly = 150;
  const totalAmount = estimatedNightly * nightsCount;
  const depositAmount = Math.round(totalAmount * 0.3);
  const balanceAmount = totalAmount - depositAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomTypeId || !checkInDate || !checkOutDate) {
      setError('Tarixlər və otaq məlumatları tam deyil.');
      return;
    }

    if (!guestName.trim() || guestPhone.length < 9) {
      setError('Zəhmət olmasa ad, soyad və əlaqə nömrənizi qeyd edin.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        roomTypeId,
        checkInDate,
        checkOutDate,
        roomsCount: 1,
        guestsCount: 2,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim() || undefined,
        specialRequests: specialRequests.trim() || undefined,
        paymentType,
        paymentProvider: paymentType === 'FULL_PAYMENT' ? paymentProvider : 'CARD',
        installmentMonths: paymentType === 'FULL_PAYMENT' && paymentProvider !== 'CARD' ? installmentMonths : undefined,
      };

      const booking = await hotelApi.createHotelBooking(payload);
      setConfirmedBooking(booking);
    } catch (err: any) {
      console.error('Booking submission error:', err);
      setError(
        err.response?.data?.message ||
        'Rezervasiya tamamlanarkən xəta baş verdi. Zəhmət olmasa məlumatları yoxlayın.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedBooking) {
    return (
      <div className="web-hotel-checkout-page">
        <div className="web-checkout-success-card">
          <div className="web-checkout-success-icon">
            <CheckCircle2 size={44} />
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
            Rezervasiyanız Uğurla Qeydə Alındı!
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: 16 }}>
            Təsdiq bildirişi və rəqəmsal QR vəçer WhatsApp nömrənizə ({confirmedBooking.guestPhone}) göndərildi.
          </p>

          <div className="web-checkout-success-code">
            {confirmedBooking.bookingNumber}
          </div>

          <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, textAlign: 'left', margin: '24px 0', border: '1px solid #e2e8f0' }}>
            <div className="web-summary-line">
              <span>Qonaq:</span>
              <strong>{confirmedBooking.guestName}</strong>
            </div>
            <div className="web-summary-line">
              <span>Giriş / Çıxış:</span>
              <strong>
                {new Date(confirmedBooking.checkInDate).toLocaleDateString('az-AZ')} -{' '}
                {new Date(confirmedBooking.checkOutDate).toLocaleDateString('az-AZ')} ({confirmedBooking.nightsCount} gecə)
              </strong>
            </div>
            <div className="web-summary-line">
              <span>Ümumi Məbləğ:</span>
              <strong>{confirmedBooking.totalAmount} ₼</strong>
            </div>
            {confirmedBooking.paymentType === 'DEPOSIT_30' && (
              <>
                <div className="web-summary-line" style={{ color: '#16a34a' }}>
                  <span>Ödənilən 30% Depozit:</span>
                  <strong>{confirmedBooking.depositAmount} ₼</strong>
                </div>
                <div className="web-summary-line" style={{ color: '#ea580c' }}>
                  <span>Qalan Qalıq Məbləğ:</span>
                  <strong>{confirmedBooking.remainingBalance} ₼</strong>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link
              to="/account/bookings"
              className="web-room-book-btn"
              style={{ padding: '14px 28px' }}
            >
              Sifarişlərimə Keç
            </Link>
            <Link
              to="/"
              className="web-hotel-view-btn"
              style={{ padding: '14px 28px' }}
            >
              Ana Səhifəyə Qayıt
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="web-hotel-checkout-page">
      <div className="web-checkout-header">
        <h1 className="web-checkout-title">Otel Qonaqlamasının Rəsmiləşdirilməsi</h1>
        <p className="web-checkout-subtitle">
          Təhlükəsiz və rəsmi nağdsız ödəniş, ani elektron vəçer və WhatsApp bildirişi
        </p>
      </div>

      <div className="web-checkout-grid">
        {/* Left Form */}
        <form onSubmit={handleSubmit} className="web-checkout-form-card">
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Section: Guest Details */}
          <div>
            <h2 className="web-checkout-section-heading">
              <User size={20} color="#2563eb" />
              <span>Əsas Qonaq və Əlaqə Məlumatları</span>
            </h2>

            <div className="web-checkout-inputs-grid" style={{ marginTop: 16 }}>
              <div className="web-checkout-input-field">
                <label>Ad və Soyad *</label>
                <input
                  type="text"
                  required
                  placeholder="Məs: Cəmil Əliyev"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>

              <div className="web-checkout-input-field">
                <label>WhatsApp Mobil Nömrəsi *</label>
                <input
                  type="tel"
                  required
                  placeholder="+994 50 123 45 67"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>

              <div className="web-checkout-input-field" style={{ gridColumn: 'span 2' }}>
                <label>E-poçt Ünvanı (İxtiyari)</label>
                <input
                  type="email"
                  placeholder="qonaq@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
              </div>

              <div className="web-checkout-input-field" style={{ gridColumn: 'span 2' }}>
                <label>Xüsusi İstəklər (İxtiyari)</label>
                <textarea
                  rows={2}
                  placeholder="Məs: Sakit otaq, körpə çarpayısı, gec giriş və s."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section: Payment Model */}
          <div>
            <h2 className="web-checkout-section-heading">
              <CreditCard size={20} color="#2563eb" />
              <span>Ödəniş Seçimi</span>
            </h2>

            <div className="web-checkout-payment-modes" style={{ marginTop: 16 }}>
              <div
                className={`web-checkout-mode-card ${paymentType === 'DEPOSIT_30' ? 'active' : ''}`}
                onClick={() => setPaymentType('DEPOSIT_30')}
              >
                <div className="web-checkout-mode-title">
                  <span>30% İlkin Depozit</span>
                  <span style={{ color: '#16a34a', fontSize: '0.9rem' }}>Tövsiyə olunur</span>
                </div>
                <p className="web-checkout-mode-desc">
                  İndi sadəcə 30% depozit ödəyərək otağınızı zəmanətə alın. Qalan 70% gəlişə 3 gün qalmış və ya oteldə ödənilir.
                </p>
              </div>

              <div
                className={`web-checkout-mode-card ${paymentType === 'FULL_PAYMENT' ? 'active' : ''}`}
                onClick={() => setPaymentType('FULL_PAYMENT')}
              >
                <div className="web-checkout-mode-title">
                  <span>100% Tam Ödəniş</span>
                  <span style={{ color: '#2563eb', fontSize: '0.85rem' }}>Taksitlə</span>
                </div>
                <p className="web-checkout-mode-desc">
                  Birkart və ya Tamkart ilə 12 ayadək faizsiz taksit və ya bank kartı ilə tam nağdsız ödəniş.
                </p>
              </div>
            </div>

            {paymentType === 'FULL_PAYMENT' && (
              <div style={{ marginTop: 20 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                  Taksit və Kart Təminatçısı
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {(['CARD', 'BIRKART', 'TAMKART', 'BOLKART'] as const).map((prov) => (
                    <button
                      type="button"
                      key={prov}
                      className={`web-installment-pill ${paymentProvider === prov ? 'active' : ''}`}
                      onClick={() => setPaymentProvider(prov)}
                    >
                      {prov === 'CARD' ? 'Bank Kartı' : prov}
                    </button>
                  ))}
                </div>

                {paymentProvider !== 'CARD' && (
                  <div style={{ marginTop: 16 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                      Taksit Müddəti (Faizsiz)
                    </label>
                    <div className="web-installment-options">
                      {[3, 6, 12].map((m) => (
                        <div
                          key={m}
                          className={`web-installment-pill ${installmentMonths === m ? 'active' : ''}`}
                          onClick={() => setInstallmentMonths(m)}
                        >
                          {m} Ay ({(totalAmount / m).toFixed(1)} ₼/ay)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="web-checkout-submit-btn"
          >
            {submitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Bronlaşdırma aparılır...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={20} />
                <span>
                  {paymentType === 'DEPOSIT_30'
                    ? `${depositAmount} ₼ Depoziti Təsdiqlə və Ödə`
                    : `${totalAmount} ₼ Tam Ödənişi Tamamla`}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Right Summary Sidebar */}
        <div className="web-checkout-summary-card">
          <div className="web-summary-hotel-header">
            <h3 className="web-summary-hotel-name">Seçilmiş Qonaqlama</h3>
            <div className="web-summary-room-name">Otaq ID: {roomTypeId?.slice(-6).toUpperCase()}</div>
          </div>

          <div className="web-summary-dates-box">
            <div>
              <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Giriş</div>
              <strong style={{ color: '#0f172a' }}>{checkInDate || 'Təyin edilməyib'}</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Çıxış</div>
              <strong style={{ color: '#0f172a' }}>{checkOutDate || 'Təyin edilməyib'}</strong>
            </div>
          </div>

          <div className="web-summary-line">
            <span>Qonaqlama müddəti:</span>
            <strong>{nightsCount} Gecə</strong>
          </div>

          <div className="web-summary-line">
            <span>Qonaq sayı:</span>
            <strong>2 Nəfər</strong>
          </div>

          <div className="web-summary-total-line">
            <span>Ümumi Qiymət:</span>
            <span>{totalAmount} ₼</span>
          </div>

          {paymentType === 'DEPOSIT_30' && (
            <div style={{ marginTop: 16, background: '#f0fdf4', padding: 14, borderRadius: 12, border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#166534', fontWeight: 700 }}>
                <span>İndi Ödəniləcək (30%):</span>
                <span>{depositAmount} ₼</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                <span>Gəlişdən əvvəl qalıq:</span>
                <span>{balanceAmount} ₼</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, fontSize: '0.8rem', color: '#64748b' }}>
            <MessageSquare size={16} color="#16a34a" />
            <span>QR kodlu vəçer və təsdiq dərhal WhatsApp-a göndərilir.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
