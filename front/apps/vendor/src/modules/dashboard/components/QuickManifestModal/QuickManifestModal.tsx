import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  X, 
  Printer, 
  Search, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Bus, 
  Calendar, 
  MapPin, 
  RefreshCw,
  Lock,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import { Spinner } from '@toursales/ui';
import { vendorDashboardApi, ManifestSummary, ManifestPassenger } from '../../api/vendorDashboardApi';
import { vendorBookingApi } from '../../../bookings/api/vendorBookingApi';
import './QuickManifestModal.css';

export interface QuickManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourId?: string;
  isFinancialMasked?: boolean;
  onCheckInChanged?: () => void;
}

export const QuickManifestModal: React.FC<QuickManifestModalProps> = ({
  isOpen,
  onClose,
  tourId,
  isFinancialMasked = false,
  onCheckInChanged,
}) => {
  const [manifest, setManifest] = useState<ManifestSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchManifest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await vendorDashboardApi.getManifestSummary(tourId);
      if (res.data) {
        setManifest(res.data);
      }
    } catch (err: any) {
      console.error('Manifest yüklənərkən xəta:', err);
      setError(err?.response?.data?.msg || err.message || 'Manifest məlumatları alına bilmədi.');
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  useEffect(() => {
    if (isOpen) {
      fetchManifest();
    }
  }, [isOpen, fetchManifest]);

  const handleToggleCheckIn = async (passenger: ManifestPassenger) => {
    try {
      setUpdatingId(passenger.bookingId);
      const res = await vendorBookingApi.toggleCheckIn(passenger.bookingId);
      
      const newStatus = res.data?.isCheckedIn ?? !passenger.isCheckedIn;

      // Update local manifest state immediately
      setManifest(prev => {
        if (!prev) return prev;
        const updatedPassengers = prev.passengers.map(p => 
          p.bookingId === passenger.bookingId 
            ? { ...p, isCheckedIn: newStatus, checkedInAt: newStatus ? new Date().toISOString() : null } 
            : p
        );
        const newCheckedCount = updatedPassengers.filter(p => p.isCheckedIn).length;
        return {
          ...prev,
          passengers: updatedPassengers,
          checkedInCount: newCheckedCount
        };
      });

      if (onCheckInChanged) {
        onCheckInChanged();
      }
    } catch (err: any) {
      console.error('Check-in dəyişdirilərkən xəta:', err);
      alert(err?.response?.data?.msg || 'Minik statusu yenilənmədi.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredPassengers = useMemo(() => {
    if (!manifest?.passengers) return [];
    if (!searchQuery.trim()) return manifest.passengers;

    const q = searchQuery.toLowerCase().trim();
    return manifest.passengers.filter(p => 
      p.passengerName.toLowerCase().includes(q) ||
      (p.phone && p.phone.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.seatNumber && p.seatNumber.toLowerCase().includes(q))
    );
  }, [manifest?.passengers, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const totalSeats = manifest?.totalSeats || 0;
  const checkedInCount = manifest?.checkedInCount || 0;
  const checkInPercent = totalSeats > 0 ? Math.round((checkedInCount / totalSeats) * 100) : 0;
  const tour = manifest?.tour;

  return (
    <div className="quick-manifest-overlay" onClick={onClose}>
      <div 
        className="quick-manifest-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="quick-manifest-header">
          <div className="quick-manifest-header-left">
            <div className="quick-manifest-badge">
              <Bus size={16} />
              <span>Sərnişin Manifesti</span>
            </div>
            <h2 className="quick-manifest-title">
              {tour?.title || 'Aktiv Tur Sərnişin Siyahısı'}
            </h2>
            {tour && (
              <div className="quick-manifest-meta-row">
                <span className="quick-manifest-meta-item">
                  <Calendar size={13} />
                  {new Date(tour.startDate).toLocaleDateString('az-AZ')}
                </span>
                {tour.destinationCountry && (
                  <span className="quick-manifest-meta-item">
                    <MapPin size={13} />
                    {tour.destinationCountry}
                  </span>
                )}
                <span className="quick-manifest-meta-item">
                  Maks. tutum: {tour.maxParticipants || 'Limitsiz'}
                </span>
              </div>
            )}
          </div>

          <div className="quick-manifest-header-actions no-print">
            <button 
              type="button" 
              className="quick-manifest-btn-action" 
              onClick={handlePrint}
              title="Manifesti Çap Et"
            >
              <Printer size={16} />
              <span>Çap Et</span>
            </button>
            <button 
              type="button" 
              className="quick-manifest-btn-action" 
              onClick={fetchManifest}
              title="Yenilə"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'is-spinning' : ''} />
            </button>
            <button 
              type="button" 
              className="quick-manifest-btn-close" 
              onClick={onClose}
              title="Bağla"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Check-in Progress & Search Bar */}
        <div className="quick-manifest-toolbar no-print">
          <div className="quick-manifest-progress-box">
            <div className="quick-manifest-progress-labels">
              <span className="progress-label">
                <UserCheck size={14} /> Minik Edənlər: <strong>{checkedInCount} / {totalSeats}</strong>
              </span>
              <span className="progress-percent">{checkInPercent}%</span>
            </div>
            <div className="quick-manifest-progress-track">
              <div 
                className="quick-manifest-progress-fill" 
                style={{ width: `${checkInPercent}%` }} 
              />
            </div>
          </div>

          <div className="quick-manifest-search-box">
            <Search size={15} className="quick-manifest-search-icon" />
            <input
              type="text"
              placeholder="Sərnişin adı, telefon və ya yer nömrəsi ilə axtar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="quick-manifest-search-input"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="quick-manifest-search-clear"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="quick-manifest-body">
          {loading ? (
            <div className="quick-manifest-state-box">
              <Spinner size="lg" />
              <p>Sərnişin manifesti yüklənir...</p>
            </div>
          ) : error ? (
            <div className="quick-manifest-state-box is-error">
              <AlertCircle size={32} />
              <p>{error}</p>
              <button type="button" onClick={fetchManifest} className="quick-manifest-btn-retry">
                Yenidən Cəhd Et
              </button>
            </div>
          ) : filteredPassengers.length === 0 ? (
            <div className="quick-manifest-state-box">
              <Bus size={36} />
              <p>{searchQuery ? 'Axtarışa uyğun sərnişin tapılmadı' : 'Bu tur üzrə heç bir sərnişin sifarişi yoxdur'}</p>
            </div>
          ) : (
            <div className="quick-manifest-table-wrap">
              <table className="quick-manifest-table">
                <thead>
                  <tr>
                    <th>Oturacaq</th>
                    <th>Sərnişin</th>
                    <th>Əlaqə</th>
                    <th>Yer</th>
                    {!isFinancialMasked && <th>Məbləğ</th>}
                    <th>Ödəniş</th>
                    <th className="text-right no-print">Minik (Check-in)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPassengers.map((p) => {
                    const isUpdating = updatingId === p.bookingId;

                    return (
                      <tr key={p.bookingId} className={p.isCheckedIn ? 'row-checked-in' : ''}>
                        <td>
                          <span className="seat-pill">{p.seatNumber}</span>
                        </td>
                        <td>
                          <div className="passenger-info-cell">
                            <strong className="passenger-name">{p.passengerName}</strong>
                            <span className="booking-ref">ID: {p.bookingId}</span>
                          </div>
                        </td>
                        <td>
                          <div className="contact-cell">
                            {p.phone && (
                              <span className="contact-item">
                                <Phone size={12} /> {p.phone}
                              </span>
                            )}
                            {p.email && (
                              <span className="contact-item">
                                <Mail size={12} /> {p.email}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="seats-count-badge">{p.seatsCount} yer</span>
                        </td>
                        {!isFinancialMasked && (
                          <td>
                            <strong className="amount-text">{p.amount} ₼</strong>
                          </td>
                        )}
                        <td>
                          <span className={`payment-pill payment-${p.paymentStatus.toLowerCase()}`}>
                            {p.paymentStatus === 'PAID'
                              ? 'Ödənilib'
                              : p.paymentStatus === 'PARTIALLY_PAID'
                              ? 'Qismən'
                              : 'Gözləyir'}
                          </span>
                        </td>
                        <td className="text-right no-print">
                          <button
                            type="button"
                            className={`checkin-toggle-btn ${p.isCheckedIn ? 'is-checked' : ''}`}
                            onClick={() => handleToggleCheckIn(p)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <Spinner size="sm" />
                            ) : p.isCheckedIn ? (
                              <>
                                <CheckCircle2 size={15} />
                                <span>Minik Edilib</span>
                              </>
                            ) : (
                              <>
                                <Circle size={15} />
                                <span>Qeydiyyat Et</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="quick-manifest-footer no-print">
          <div className="manifest-footer-summary">
            Cəmi tapıldı: <strong>{filteredPassengers.length}</strong> sərnişin
            {isFinancialMasked && (
              <span className="footer-masked-notice">
                <Lock size={12} /> Maliyyə məlumatları məxfidir
              </span>
            )}
          </div>
          <button type="button" className="quick-manifest-btn-close-bottom" onClick={onClose}>
            Bağla
          </button>
        </div>
      </div>
    </div>
  );
};
