import React, { useEffect, useState } from 'react';
import { 
  X, 
  Bus, 
  RefreshCw, 
  Users, 
  CheckCircle2, 
  Lock, 
  AlertCircle 
} from 'lucide-react';
import { Button, Spinner } from '@toursales/ui';
import { Tour } from '@toursales/types';
import { tourManageApi } from '../../api/tourManageApi';
import './SeatMatrixModal.css';

interface SeatItem {
  seatNumber: number;
  status: 'AVAILABLE' | 'BOOKED' | 'LOCKED';
  lockedBy?: string | null;
}

interface SeatMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour | null;
}

export const SeatMatrixModal: React.FC<SeatMatrixModalProps> = ({
  isOpen,
  onClose,
  tour,
}) => {
  const [matrix, setMatrix] = useState<SeatItem[]>([]);
  const [capacity, setCapacity] = useState<number>(48);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatrix = async () => {
    if (!tour?.id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await tourManageApi.getSeatMatrix(tour.id);
      setMatrix(data.matrix || []);
      setCapacity(data.busCapacity || tour.capacity || 48);
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
    }
  }, [isOpen, tour?.id]);

  if (!isOpen || !tour) return null;

  const availableCount = matrix.filter((s) => s.status === 'AVAILABLE').length;
  const bookedCount = matrix.filter((s) => s.status === 'BOOKED').length;
  const lockedCount = matrix.filter((s) => s.status === 'LOCKED').length;
  const occupancyPercent = capacity > 0 ? Math.round((bookedCount / capacity) * 100) : 0;

  const isSprinter = capacity <= 20;
  const isVip = capacity > 20 && capacity <= 32;

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
              <h3>Avtobus Oturacaq Xəritəsi & Canlı Yer Planı</h3>
              <p className="seat-matrix-subtitle">
                <strong>{tour.title}</strong> — {new Date(tour.startDate).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button className="seat-matrix-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* KPI Stats Bar */}
        <div className="seat-matrix-stats-bar">
          <div className="seat-stat-item available">
            <span className="stat-indicator green" />
            <div className="stat-data">
              <span className="stat-val">{availableCount}</span>
              <span className="stat-lbl">Boş Yerlər</span>
            </div>
          </div>

          <div className="seat-stat-item booked">
            <span className="stat-indicator red" />
            <div className="stat-data">
              <span className="stat-val">{bookedCount}</span>
              <span className="stat-lbl">Satılmış / Bron</span>
            </div>
          </div>

          <div className="seat-stat-item locked">
            <span className="stat-indicator yellow" />
            <div className="stat-data">
              <span className="stat-val">{lockedCount}</span>
              <span className="stat-lbl">Canlı Kilidli</span>
            </div>
          </div>

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
            title="Yenilə"
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
              <p>Avtobus planı yüklənir...</p>
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
                    <span>Ön Şüşə (Marşrut)</span>
                  </div>
                  <div className="driver-row">
                    <div className="bus-door-badge">🚪 Qapı (Giriş)</div>
                    <div className="driver-seat">
                      <span>💺 Sürücü</span>
                    </div>
                  </div>
                </div>

                {/* Seat Matrix Grid */}
                <div className="bus-interior">
                  <div className={`bus-seats-grid ${isSprinter ? 'sprinter-layout' : isVip ? 'vip-layout' : 'standard-layout'}`}>
                    {matrix.map((s) => {
                      const isBooked = s.status === 'BOOKED';
                      const isLocked = s.status === 'LOCKED';

                      return (
                        <div
                          key={s.seatNumber}
                          className={`bus-seat-box ${s.status.toLowerCase()}`}
                          title={`Oturacaq #${s.seatNumber} — ${isBooked ? 'Bron edilib' : isLocked ? 'Müvəqqəti kilidlənib' : 'Boşdur'}`}
                        >
                          <span className="seat-num">#{s.seatNumber}</span>
                          <div className="seat-icon-wrap">
                            {isBooked ? (
                              <Users size={13} />
                            ) : isLocked ? (
                              <Lock size={13} />
                            ) : (
                              <CheckCircle2 size={13} />
                            )}
                          </div>
                          <span className="seat-status-tag">
                            {isBooked ? 'Dolu' : isLocked ? 'Kilid' : 'Boş'}
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

        {/* Footer */}
        <div className="seat-matrix-footer">
          <div className="seat-legend">
            <span className="legend-item"><span className="legend-dot green" /> Boş (Satışa Açıq)</span>
            <span className="legend-item"><span className="legend-dot red" /> Bron Edilib</span>
            <span className="legend-item"><span className="legend-dot yellow" /> 5 Dəqiqəlik Kilid</span>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Bağla
          </Button>
        </div>
      </div>
    </div>
  );
};
