import React from 'react';
import { SeatMatrix, BusSeat } from '@toursales/types';
import { ShieldCheck } from 'lucide-react';
import './BusSeatPicker.css';

interface BusSeatPickerProps {
  seatMatrix: SeatMatrix | null;
  selectedSeats: number[];
  onToggleSeat: (seatNumber: number) => void;
  lockTimeRemaining?: number;
}

export const BusSeatPicker: React.FC<BusSeatPickerProps> = ({
  seatMatrix,
  selectedSeats,
  onToggleSeat,
  lockTimeRemaining = 300,
}) => {
  if (!seatMatrix) {
    return <div className="web-bus-loading">Oturacaq planı hazırlanır...</div>;
  }

  // Format lock timer mm:ss
  const minutes = Math.floor(lockTimeRemaining / 60);
  const seconds = lockTimeRemaining % 60;
  const formattedTimer = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  // Organize seats into rows
  const totalSeats = seatMatrix.totalSeats || 48;
  const isSprinter = seatMatrix.busType === 'SPRINTER' || totalSeats <= 20;

  // Render seats matrix
  const renderSeatsGrid = () => {
    // Standard bus 2+2 layout (rows of 4 seats + aisle)
    const seatsPerRow = isSprinter ? 3 : 4;
    const totalRows = Math.ceil(totalSeats / seatsPerRow);
    const rows = [];

    for (let r = 1; r <= totalRows; r++) {
      const rowSeats: (BusSeat | null)[] = [];

      if (isSprinter) {
        // 1 + 2 Sprinter layout: left 1, aisle, right 2
        const s1 = (r - 1) * 3 + 1;
        const s2 = (r - 1) * 3 + 2;
        const s3 = (r - 1) * 3 + 3;

        rowSeats.push(getSeatObj(s1));
        rowSeats.push(null); // Aisle
        rowSeats.push(getSeatObj(s2));
        rowSeats.push(getSeatObj(s3));
      } else {
        // 2 + 2 Standard Layout: left 2, aisle, right 2
        const s1 = (r - 1) * 4 + 1;
        const s2 = (r - 1) * 4 + 2;
        const s3 = (r - 1) * 4 + 3;
        const s4 = (r - 1) * 4 + 4;

        rowSeats.push(getSeatObj(s1));
        rowSeats.push(getSeatObj(s2));
        rowSeats.push(null); // Aisle
        rowSeats.push(getSeatObj(s3));
        rowSeats.push(getSeatObj(s4));
      }

      rows.push(
        <div key={r} className="web-bus-row">
          <span className="web-bus-row-num">{r}</span>
          {rowSeats.map((seat, idx) => {
            if (seat === null) {
              return <div key={`aisle-${idx}`} className="web-bus-aisle" />;
            }

            if (seat.seatNumber > totalSeats) {
              return <div key={`empty-${idx}`} className="web-bus-seat-placeholder" />;
            }

            const isSelected = selectedSeats.includes(seat.seatNumber);
            const isBooked = seat.status === 'BOOKED';
            const isLocked = seat.status === 'LOCKED' && !isSelected;

            return (
              <button
                key={seat.seatNumber}
                type="button"
                className={`web-bus-seat ${
                  isSelected
                    ? 'selected'
                    : isBooked
                    ? 'booked'
                    : isLocked
                    ? 'locked'
                    : 'available'
                }`}
                disabled={isBooked || isLocked}
                onClick={() => onToggleSeat(seat.seatNumber)}
                title={`Yer #${seat.seatNumber} (${
                  isSelected
                    ? 'Seçilib'
                    : isBooked
                    ? 'Satılıb'
                    : isLocked
                    ? 'Kilidlənib'
                    : 'Boşdur'
                })`}
              >
                <span className="web-bus-seat-num">{seat.seatNumber}</span>
              </button>
            );
          })}
        </div>
      );
    }

    return rows;
  };

  const getSeatObj = (seatNumber: number): BusSeat => {
    const existing = seatMatrix.seats?.find((s) => s.seatNumber === seatNumber);
    return (
      existing || {
        seatNumber,
        row: Math.ceil(seatNumber / 4),
        column: ((seatNumber - 1) % 4) + 1,
        status: 'AVAILABLE',
      }
    );
  };

  return (
    <div className="web-bus-picker-container">
      {/* Legend & Timer Header */}
      <div className="web-bus-header">
        <div className="web-bus-legend">
          <div className="legend-item">
            <span className="seat-sample available" />
            <span>Boş yer</span>
          </div>
          <div className="legend-item">
            <span className="seat-sample selected" />
            <span>Seçiminiz</span>
          </div>
          <div className="legend-item">
            <span className="seat-sample locked" />
            <span>Bron edilib</span>
          </div>
          <div className="legend-item">
            <span className="seat-sample booked" />
            <span>Satılıb</span>
          </div>
        </div>

        {selectedSeats.length > 0 && (
          <div className="web-bus-timer-badge">
            <span>Rezerv vaxtı:</span>
            <strong>{formattedTimer}</strong>
          </div>
        )}
      </div>

      {/* Bus Graphic Exterior Chassis */}
      <div className="web-bus-chassis">
        {/* Front of the Bus (Windshield & Driver) */}
        <div className="web-bus-front">
          <div className="web-bus-windshield">Ön Şüşə (Hərəkət istiqaməti)</div>
          <div className="web-bus-driver-row">
            <div className="web-bus-driver-seat" title="Sürücü yeri">
              <span>Sürücü</span>
            </div>
            <div className="web-bus-entrance" title="Ön Qapı Girişi">
              <span>Ön Giriş</span>
            </div>
          </div>
        </div>

        {/* Passenger Seats Cabin */}
        <div className="web-bus-cabin">{renderSeatsGrid()}</div>

        {/* Rear of the Bus */}
        <div className="web-bus-rear">
          <div className="web-bus-rear-bumper">Avtobusun Arxası</div>
        </div>
      </div>
    </div>
  );
};
