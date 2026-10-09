import React, { useEffect, useState } from 'react';
import { 
  X, 
  Bus, 
  RefreshCw, 
  Users, 
  CheckCircle2, 
  Lock, 
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { Button, Spinner } from '@toursales/ui';
import { Tour } from '@toursales/types';
import { tourManageApi } from '../../api/tourManageApi';
import { vendorSocketService } from '@/shared/services/vendorSocketService';
import './SeatMatrixModal.css';

interface SeatItem {
  seatNumber: number;
  status: 'AVAILABLE' | 'BOOKED' | 'LOCKED';
  lockedBy?: string | null;
  isVendorHold?: boolean;
  holdReason?: string;
}

interface SeatMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour | null;
}

// Az-AZ Tarix Formatlayıcı
const formatAzDate = (dateStr?: string | Date | null) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
      'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return String(dateStr);
  }
};

export const SeatMatrixModal: React.FC<SeatMatrixModalProps> = ({
  isOpen,
  onClose,
  tour,
}) => {
  const [matrix, setMatrix] = useState<SeatItem[]>([]);
  const [capacity, setCapacity] = useState<number>(48);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Seat for Vendor Hold Action
  const [selectedSeat, setSelectedSeat] = useState<SeatItem | null>(null);
  const [holdReason, setHoldReason] = useState<string>('Bələdçi (Guide)');
  const [customReason, setCustomReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchMatrix = async () => {
    if (!tour?.id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await tourManageApi.getSeatMatrix(tour.id);
      setMatrix((data.matrix as SeatItem[]) || []);
      setCapacity(data.busCapacity || tour.capacity || 48);
      // Keep selectedSeat in sync if already selected
      if (selectedSeat) {
        const updatedSelected = (data.matrix as SeatItem[]).find(s => s.seatNumber === selectedSeat.seatNumber);
        if (updatedSelected) setSelectedSeat(updatedSelected);
      }
    } catch (err: any) {
      console.error('Oturacaq matrisi xətası:', err);
      setError(err.response?.data?.message || 'Oturacaq planı yüklənərkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tour?.id) {
      fetchMatrix();

      // Real-time WebSocket Listeners
      vendorSocketService.joinTour(tour.id);

      const unregisterLocked = vendorSocketService.onSeatsLocked((payload: any) => {
        if (payload.tourId === tour.id && payload.seatNumbers) {
          setMatrix((prev) =>
            prev.map((s) =>
              payload.seatNumbers.includes(s.seatNumber)
                ? { ...s, status: 'LOCKED', lockedBy: payload.lockedBy }
                : s
            )
          );
        }
      });

      const unregisterReleased = vendorSocketService.onSeatsReleased((payload: any) => {
        if (payload.tourId === tour.id && payload.seatNumbers) {
          setMatrix((prev) =>
            prev.map((s) =>
              payload.seatNumbers.includes(s.seatNumber)
                ? { ...s, status: 'AVAILABLE', lockedBy: null, isVendorHold: false }
                : s
            )
          );
        }
      });

      return () => {
        vendorSocketService.leaveTour(tour.id);
        unregisterLocked();
        unregisterReleased();
      };
    } else {
      setSelectedSeat(null);
    }
  }, [isOpen, tour?.id]);

  if (!isOpen || !tour) return null;

  const availableCount = matrix.filter((s) => s.status === 'AVAILABLE').length;
  const bookedCount = matrix.filter((s) => s.status === 'BOOKED').length;
  const vendorHoldCount = matrix.filter((s) => s.status === 'LOCKED' && s.isVendorHold).length;
  const tempLockedCount = matrix.filter((s) => s.status === 'LOCKED' && !s.isVendorHold).length;
  const totalLockedCount = vendorHoldCount + tempLockedCount;
  const occupancyPercent = capacity > 0 ? Math.round((bookedCount / capacity) * 100) : 0;

  const isSprinter = capacity <= 20;
  const isVip = capacity > 20 && capacity <= 32;

  // Toggle Vendor Seat Lock (Service / VIP / Guide Hold)
  const handleToggleVendorHold = async () => {
    if (!selectedSeat || !tour.id) return;
    try {
      setActionLoading(true);
      const finalReason = holdReason === 'CUSTOM' ? (customReason.trim() || 'Xüsusi Ehtiyat') : holdReason;
      
      const res = await tourManageApi.toggleSeatLock(tour.id, selectedSeat.seatNumber, finalReason);
      const isNowHold = res.data?.isVendorHold;
      const nextStatus = (res.data?.status || (isNowHold ? 'LOCKED' : 'AVAILABLE')) as 'AVAILABLE' | 'LOCKED';

      // Optimistically update local matrix
      const updatedSeat: SeatItem = {
        ...selectedSeat,
        status: nextStatus,
        isVendorHold: isNowHold,
        holdReason: isNowHold ? finalReason : undefined,
      };

      setMatrix((prev) =>
        prev.map((s) => (s.seatNumber === selectedSeat.seatNumber ? updatedSeat : s))
      );
      setSelectedSeat(updatedSeat);

      showToast(
        isNowHold
          ? `#${selectedSeat.seatNumber} nömrəli yer “${finalReason}” üçün uğurla kilidləndi.`
          : `#${selectedSeat.seatNumber} nömrəli yer kiliddən azad edildi və satışa açıldı.`,
        'success'
      );
    } catch (err: any) {
      console.error('Xidməti yer kilidləmə xətası:', err);
      showToast(err.response?.data?.message || 'Əməliyyat icra edilərkən xəta baş verdi.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="seat-matrix-overlay" onClick={onClose}>
      <div className="seat-matrix-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="seat-matrix-header">
          <div className="seat-matrix-title-wrap">
            <div className="seat-matrix-icon">
              <Bus size={22} />
            </div>
            <div>
              <h3>Avtobus Oturacaq Xəritəsi & Xidməti İdarəetmə</h3>
              <p className="seat-matrix-subtitle">
                <strong>{tour.title}</strong> — {formatAzDate(tour.startDate)}
              </p>
            </div>
          </div>
          <button className="seat-matrix-close" onClick={onClose} aria-label="Bağla">
            <X size={20} />
          </button>
        </div>

        {/* Modal-Internal Toast Message */}
        {toastMessage && (
          <div className={`seat-matrix-toast-banner ${toastMessage.type}`}>
            {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{toastMessage.text}</span>
            <button className="toast-dismiss-btn" onClick={() => setToastMessage(null)}>
              <X size={12} />
            </button>
          </div>
        )}

        {/* KPI Stats Bar */}
        <div className="seat-matrix-stats-bar">
          <div className="seat-stat-item available">
            <span className="stat-indicator green" />
            <div className="stat-data">
              <span className="stat-val">{availableCount}</span>
              <span className="stat-lbl">Boş (Satışda)</span>
            </div>
          </div>

          <div className="seat-stat-item booked">
            <span className="stat-indicator red" />
            <div className="stat-data">
              <span className="stat-val">{bookedCount}</span>
              <span className="stat-lbl">Bron Edilib</span>
            </div>
          </div>

          <div className="seat-stat-item vendor-hold">
            <span className="stat-indicator purple" />
            <div className="stat-data">
              <span className="stat-val">{vendorHoldCount}</span>
              <span className="stat-lbl">Xidməti Yerlər</span>
            </div>
          </div>

          {tempLockedCount > 0 && (
            <div className="seat-stat-item locked">
              <span className="stat-indicator yellow" />
              <div className="stat-data">
                <span className="stat-val">{tempLockedCount}</span>
                <span className="stat-lbl">Səbətdə (5 dəq)</span>
              </div>
            </div>
          )}

          <div className="seat-stat-item total">
            <span className="stat-indicator blue" />
            <div className="stat-data">
              <span className="stat-val">%{occupancyPercent}</span>
              <span className="stat-lbl">Doluluq dərəcəsi</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchMatrix}
            isLoading={loading}
            className="seat-refresh-btn"
            title="Məlumatları Yenilə"
          >
            <RefreshCw size={14} />
            <span>Yenilə</span>
          </Button>
        </div>

        {/* Content Body */}
        <div className="seat-matrix-body">
          {loading ? (
            <div className="seat-matrix-loading">
              <Spinner size="lg" />
              <p>Avtobus planı və yer doluluğu yüklənir...</p>
            </div>
          ) : error ? (
            <div className="seat-matrix-error">
              <AlertCircle size={32} />
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={fetchMatrix}>Yenidən Cəhd Et</Button>
            </div>
          ) : (
            <div className="bus-blueprint-wrapper">
              <div className="bus-chassis">
                {/* Bus Front Section */}
                <div className="bus-front-cap">
                  <div className="windshield">
                    <span>Ön Şüşə (Marşrut İstiqaməti)</span>
                  </div>
                  <div className="driver-row">
                    <div className="bus-door-badge">🚪 Sərnişin Qapısı</div>
                    <div className="driver-seat">
                      <span>💺 Sürücü Yeri</span>
                    </div>
                  </div>
                </div>

                {/* Seat Matrix Grid */}
                <div className="bus-interior">
                  <div className="aisle-guide-label">
                    <span>← SOL CƏRGƏ</span>
                    <span className="aisle-text">DƏHLİZ</span>
                    <span>SAĞ CƏRGƏ →</span>
                  </div>

                  <div className={`bus-seats-grid ${isSprinter ? 'sprinter-layout' : isVip ? 'vip-layout' : 'standard-layout'}`}>
                    {matrix.map((s) => {
                      const isBooked = s.status === 'BOOKED';
                      const isVendorHold = s.status === 'LOCKED' && !!s.isVendorHold;
                      const isTempLocked = s.status === 'LOCKED' && !s.isVendorHold;
                      const isSelected = selectedSeat?.seatNumber === s.seatNumber;

                      let seatClass = 'available';
                      if (isBooked) seatClass = 'booked';
                      else if (isVendorHold) seatClass = 'vendor-hold';
                      else if (isTempLocked) seatClass = 'temp-locked';

                      return (
                        <div
                          key={s.seatNumber}
                          className={`bus-seat-box ${seatClass} ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedSeat(isSelected ? null : s)}
                          title={`Oturacaq #${s.seatNumber} — ${
                            isBooked
                              ? 'Sərnişin bronu'
                              : isVendorHold
                              ? `Xidməti Yer (${s.holdReason || 'Bələdçi'})`
                              : isTempLocked
                              ? 'Müştəri səbətində (5 dəq)'
                              : 'Satışa açıqdır (Klikləyərək idarə edin)'
                          }`}
                        >
                          <span className="seat-num">#{s.seatNumber}</span>
                          <div className="seat-icon-wrap">
                            {isBooked ? (
                              <Users size={14} />
                            ) : isVendorHold ? (
                              <ShieldCheck size={14} />
                            ) : isTempLocked ? (
                              <Lock size={14} />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                          </div>
                          <span className="seat-status-tag">
                            {isBooked
                              ? 'Dolu'
                              : isVendorHold
                              ? 'Xidmət'
                              : isTempLocked
                              ? 'Səbət'
                              : 'Boş'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bus Rear Section */}
                <div className="bus-rear-cap">
                  <span>Arxa Salon</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Seat Interactive Management Drawer */}
        {selectedSeat && (
          <div className="seat-action-drawer">
            <div className="drawer-header">
              <div className="drawer-seat-info">
                <span className="drawer-seat-badge">#{selectedSeat.seatNumber}</span>
                <div>
                  <strong>
                    {selectedSeat.status === 'BOOKED'
                      ? 'Bron Edilmiş Yer'
                      : selectedSeat.isVendorHold
                      ? `Xidməti Kilid (${selectedSeat.holdReason || 'Bələdçi'})`
                      : selectedSeat.status === 'LOCKED'
                      ? 'Müştəri Tərəfindən Müvəqqəti Kilidlənib'
                      : 'Satışa Açıq Boş Yer'}
                  </strong>
                  <p className="drawer-seat-sub">
                    {selectedSeat.status === 'BOOKED'
                      ? 'Bu yer rəsmi qeydiyyatdan keçmiş sərnişinə təhkim edilib.'
                      : selectedSeat.isVendorHold
                      ? 'Bu yer bələdçi, sürücü və ya heyət üçün qorunur, müştərilərə satılmır.'
                      : 'Bu yeri bələdçi və ya xidməti heyət üçün operativ olaraq kilidləyə bilərsiniz.'}
                  </p>
                </div>
              </div>
              <button className="drawer-close-btn" onClick={() => setSelectedSeat(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="drawer-actions-row">
              {selectedSeat.status === 'AVAILABLE' && (
                <>
                  <div className="reason-chips-group">
                    <button
                      type="button"
                      className={`reason-chip ${holdReason === 'Bələdçi (Guide)' ? 'active' : ''}`}
                      onClick={() => setHoldReason('Bələdçi (Guide)')}
                    >
                      🛡️ Bələdçi
                    </button>
                    <button
                      type="button"
                      className={`reason-chip ${holdReason === 'Sürücü (Driver)' ? 'active' : ''}`}
                      onClick={() => setHoldReason('Sürücü (Driver)')}
                    >
                      🚌 Sürücü
                    </button>
                    <button
                      type="button"
                      className={`reason-chip ${holdReason === 'VIP Ehtiyat' ? 'active' : ''}`}
                      onClick={() => setHoldReason('VIP Ehtiyat')}
                    >
                      👑 VIP Ehtiyat
                    </button>
                    <button
                      type="button"
                      className={`reason-chip ${holdReason === 'CUSTOM' ? 'active' : ''}`}
                      onClick={() => setHoldReason('CUSTOM')}
                    >
                      ✏️ Digər
                    </button>
                  </div>

                  {holdReason === 'CUSTOM' && (
                    <input
                      type="text"
                      className="custom-reason-input"
                      placeholder="Xidməti səbəbi qeyd edin..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                    />
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    className="action-hold-btn"
                    onClick={handleToggleVendorHold}
                    isLoading={actionLoading}
                  >
                    <ShieldCheck size={14} />
                    <span>Xidməti Yer Kimi Kilidlə</span>
                  </Button>
                </>
              )}

              {selectedSeat.isVendorHold && (
                <Button
                  variant="danger"
                  size="sm"
                  className="action-release-btn"
                  onClick={handleToggleVendorHold}
                  isLoading={actionLoading}
                >
                  <ShieldAlert size={14} />
                  <span>Xidməti Kilidi Azad Et (Satışa Aç)</span>
                </Button>
              )}

              {selectedSeat.status === 'BOOKED' && (
                <a
                  href={`/bookings?tourId=${tour.id}`}
                  className="drawer-roster-link"
                >
                  <Users size={14} />
                  <span>Sərnişin Manifestini Aç</span>
                  <ArrowRight size={14} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="seat-matrix-footer">
          <div className="seat-legend">
            <span className="legend-item"><span className="legend-dot green" /> Boş (Satışda)</span>
            <span className="legend-item"><span className="legend-dot red" /> Bron Edilib</span>
            <span className="legend-item"><span className="legend-dot purple" /> Xidməti (Bələdçi)</span>
            <span className="legend-item"><span className="legend-dot yellow" /> Müştəri Səbəti (5 dəq)</span>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Bağla
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SeatMatrixModal;
