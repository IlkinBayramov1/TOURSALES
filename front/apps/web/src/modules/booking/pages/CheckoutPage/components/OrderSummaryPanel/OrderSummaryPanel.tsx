import React from 'react';
import { Tour, PassengerInfo, PriceCalculationResult } from '@toursales/types';
import { Card, Button } from '@toursales/ui';
import { ShieldCheck, ArrowRight, User } from 'lucide-react';
import { DynamicPriceBreakdown } from '@/modules/booking/components/DynamicPriceBreakdown/DynamicPriceBreakdown';
import './OrderSummaryPanel.css';

interface OrderSummaryPanelProps {
  tour: Tour;
  passengers: PassengerInfo[];
  priceBreakdown: PriceCalculationResult | null;
  onPay: () => void;
  isLoading: boolean;
}

export const OrderSummaryPanel: React.FC<OrderSummaryPanelProps> = ({
  tour,
  passengers,
  priceBreakdown,
  onPay,
  isLoading,
}) => {
  return (
    <Card variant="glass" className="web-order-summary-panel">
      <h3 className="web-order-summary-title">Sifariş Xülasəsi</h3>

      <div className="web-order-passenger-summary">
        <span className="web-order-section-label">Qeydiyyatdan keçən sərnişinlər:</span>
        <div className="web-order-passenger-list">
          {passengers.map((p) => (
            <div key={p.seatNumber} className="web-order-passenger-item">
              <User size={14} />
              <span>
                <strong>Yer {p.seatNumber}:</strong> {p.fullName || 'Adsız'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <DynamicPriceBreakdown
        breakdown={priceBreakdown}
        seatsCount={passengers.length}
      />

      <div className="web-order-security">
        <ShieldCheck size={18} className="security-icon" />
        <span>3D Secure ilə 100% güvənli ödəniş</span>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onPay}
        isLoading={isLoading}
        rightIcon={<ArrowRight size={18} />}
        style={{ width: '100%' }}
      >
        Ödənişi Tamamla
      </Button>
    </Card>
  );
};
