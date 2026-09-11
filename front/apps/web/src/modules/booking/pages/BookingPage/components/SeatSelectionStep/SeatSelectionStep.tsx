import React from 'react';
import { BusSeatPicker } from '@/modules/booking/components/BusSeatPicker/BusSeatPicker';
import { PromoInput } from '@/modules/booking/components/PromoInput/PromoInput';
import { SeatMatrix } from '@toursales/types';
import './SeatSelectionStep.css';

interface SeatSelectionStepProps {
  seatMatrix: SeatMatrix | null;
  selectedSeats: number[];
  onToggleSeat: (seatNumber: number) => void;
  lockTimeRemaining: number;
  promoCode: string;
  onApplyPromo: (code: string) => void;
  promoDiscount?: number;
}

export const SeatSelectionStep: React.FC<SeatSelectionStepProps> = ({
  seatMatrix,
  selectedSeats,
  onToggleSeat,
  lockTimeRemaining,
  promoCode,
  onApplyPromo,
  promoDiscount,
}) => {
  return (
    <div className="web-seat-step-wrapper">
      <div className="web-seat-step-header">
        <h3 className="web-step-heading">Avtobusda Oturacaq Yerinizi Seçin</h3>
        <p className="web-step-subheading">
          Yaşıl rəngdə işarələnən yerlər sizin tərəfinizdən seçilmişdir. Hər bir yer üçün 5 dəqiqəlik eksklüziv bron təmin olunur.
        </p>
      </div>

      <BusSeatPicker
        seatMatrix={seatMatrix}
        selectedSeats={selectedSeats}
        onToggleSeat={onToggleSeat}
        lockTimeRemaining={lockTimeRemaining}
      />

      <div className="web-seat-step-promo-box">
        <PromoInput
          onApplyPromo={onApplyPromo}
          appliedPromo={promoCode}
          discountAmount={promoDiscount}
        />
      </div>
    </div>
  );
};
