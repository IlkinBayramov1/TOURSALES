import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Check, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Spinner } from '@toursales/ui';
import { vendorBookingApi } from '../../../bookings/api/vendorBookingApi';
import './QuickCheckInModal.css';

export interface QuickCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickCheckInModal: React.FC<QuickCheckInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [ticketInput, setTicketInput] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [checkingIn, setCheckingIn] = useState<boolean>(false);
  const [foundBooking, setFoundBooking] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTicketInput('');
      setFoundBooking(null);
      setErrorMsg(null);
      setSuccessAnimation(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = ticketInput.trim();
    if (!query) return;

    try {
      setSearching(true);
      setErrorMsg(null);
      setFoundBooking(null);
      setSuccessAnimation(false);

      // Search using getBookings query
      const res = await vendorBookingApi.getBookings({ search: query });
      const items = res.data || [];

      if (items.length === 0) {
        setErrorMsg(`"${query}" nömrəli bilet və ya aktiv sifariş tapılmadı.`);
        return;
      }

      // Pick the best match (exact bookingNumber or ID if available)
      const exactMatch = items.find(
        (b: any) => 
          b.bookingNumber?.toLowerCase() === query.toLowerCase() || 
          b.id?.toLowerCase() === query.toLowerCase()
      ) || items[0];

      setFoundBooking(exactMatch);
    } catch (err: any) {
      console.error('Bilet axtarış xətası:', err);
      setErrorMsg(err?.response?.data?.msg || err.message || 'Axtarış zamanı xəta baş verdi.');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!foundBooking) return;

    try {
      setCheckingIn(true);
      setErrorMsg(null);

      // Call toggle check in API
      const res = await vendorBookingApi.toggleCheckIn(foundBooking.id);
      const isNowChecked = res.data?.isCheckedIn ?? !foundBooking.isCheckedIn;

      setFoundBooking((prev: any) => ({
        ...prev,
        isCheckedIn: isNowChecked,
        checkedInAt: isNowChecked ? new Date().toISOString() : null,
      }));

      if (isNowChecked) {
        setSuccessAnimation(true);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Check-in təsdiq xətası:', err);
      setErrorMsg(err?.response?.data?.msg || err.message || 'Minik təsdiqlənərkən xəta baş verdi.');
    } finally {
      setCheckingIn(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="quick-checkin-overlay" onClick={onClose}>
      <div 
        className="quick-checkin-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="quick-checkin-header">
          <div className="quick-checkin-badge">
            <QrCode size={16} />
            <span>Sürətli Minik Qeydiyyatı</span>
          </div>
          <button type="button" className="quick-checkin-btn-close" onClick={onClose} title="Bağla">
            <X size={18} />
          </button>
        </div>

        {/* Input Bar */}
        <div className="quick-checkin-search-section">
          <h3 className="quick-checkin-prompt">Bilet və ya Sifariş Nömrəsini Daxil Edin</h3>
          <p className="quick-checkin-subprompt">
            Müştərinin elektron biletindəki nömrəni (məs: BK-123456, TR-123456) və ya QR kodu daxil edin
          </p>

          <form onSubmit={handleSearch} className="quick-checkin-form">
            <div className="quick-checkin-input-wrapper">
              <Search size={18} className="quick-checkin-input-icon" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Nümunə: BK-100234 və ya sərnişin adı..."
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                className="quick-checkin-input"
              />
            </div>
            <button 
              type="submit" 
              className="quick-checkin-btn-submit"
              disabled={searching || !ticketInput.trim()}
            >
              {searching ? <Spinner size="sm" /> : <Search size={16} />}
              <span>Axtar</span>
            </button>
          </form>
        </div>

        {/* Content Body */}
        <div className="quick-checkin-body">
          {errorMsg && (
            <div className="quick-checkin-alert alert-error">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {foundBooking && (
            <div className={`quick-checkin-result-card ${successAnimation ? 'pulse-success' : ''}`}>
              {/* Passenger & Tour Details */}
              <div className="result-card-header">
                <div className="result-passenger-main">
                  <div className="result-avatar">
                    <User size={22} />
                  </div>
                  <div>
                    <h4 className="result-passenger-name">
                      {foundBooking.passengerName || 'Sərnişin'} {foundBooking.passengerSurname || ''}
                    </h4>
                    <span className="result-booking-no">
                      Bilet №: <strong>{foundBooking.bookingNumber || foundBooking.id}</strong>
                    </span>
                  </div>
                </div>

                <div className="result-seat-box">
                  <span className="result-seat-label">Təyin edilmiş yer</span>
                  <strong className="result-seat-number">
                    {foundBooking.busSeatNumber ? `№ ${foundBooking.busSeatNumber}` : `${foundBooking.seats || 1} yer`}
                  </strong>
                </div>
              </div>

              <div className="result-details-grid">
                <div className="result-detail-item">
                  <Calendar size={14} className="detail-icon" />
                  <div>
                    <span className="detail-label">Tur</span>
                    <strong className="detail-value">{foundBooking.tour?.title || foundBooking.tourTitle || 'Seçilmiş Tur'}</strong>
                  </div>
                </div>

                <div className="result-detail-item">
                  <CreditCard size={14} className="detail-icon" />
                  <div>
                    <span className="detail-label">Ödəniş Vəziyyəti</span>
                    <strong className={`detail-value status-${(foundBooking.paymentStatus || '').toLowerCase()}`}>
                      {foundBooking.paymentStatus === 'PAID'
                        ? 'Tam Ödənilib'
                        : foundBooking.paymentStatus === 'PARTIALLY_PAID'
                        ? 'Qismən Ödənilib'
                        : 'Ödəniş Gözləyir'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Banner */}
              <div className="result-action-section">
                {foundBooking.isCheckedIn ? (
                  <div className="checked-in-banner">
                    <div className="checked-in-left">
                      <CheckCircle2 size={24} className="checked-icon" />
                      <div>
                        <strong>Sərnişin Minik Edib!</strong>
                        <span>
                          {foundBooking.checkedInAt 
                            ? `Qeydiyyat vaxtı: ${new Date(foundBooking.checkedInAt).toLocaleTimeString('az-AZ')}`
                            : 'Minik uğurla təsdiqlənib'}
                        </span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="btn-undo-checkin"
                      onClick={handleConfirmCheckIn}
                      disabled={checkingIn}
                    >
                      <RotateCcw size={14} />
                      <span>{checkingIn ? 'Dəyişdirilir...' : 'Ləğv Et'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="pending-checkin-banner">
                    <button 
                      type="button" 
                      className="btn-confirm-checkin"
                      onClick={handleConfirmCheckIn}
                      disabled={checkingIn}
                    >
                      {checkingIn ? (
                        <Spinner size="sm" />
                      ) : (
                        <>
                          <CheckCircle2 size={20} />
                          <span>Sərnişini Təsdiqlə (Minik Qeydiyyatı)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {!foundBooking && !errorMsg && !searching && (
            <div className="quick-checkin-placeholder">
              <QrCode size={48} className="placeholder-icon" />
              <p>Avtobusa və ya tura minən sərnişinin bilet nömrəsini daxil edərək dərhal təsdiqləyin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
