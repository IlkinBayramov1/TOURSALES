import React from 'react';
import { PriceCalculationResult } from '@toursales/types';
import { useCurrency } from '@/shared/context/CurrencyContext';
import './DynamicPriceBreakdown.css';

interface DynamicPriceBreakdownProps {
  breakdown: PriceCalculationResult | null;
  seatsCount: number;
}

export const DynamicPriceBreakdown: React.FC<DynamicPriceBreakdownProps> = ({
  breakdown,
  seatsCount,
}) => {
  const { format } = useCurrency();

  if (!breakdown) {
    return (
      <div className="web-price-breakdown-box">
        <span className="web-price-placeholder">Oturacaq seçdikdə qiymət hesablanacaq</span>
      </div>
    );
  }

  return (
    <div className="web-price-breakdown-box">
      <h4 className="web-breakdown-heading">Qiymət Hesablaması</h4>

      <div className="web-breakdown-row">
        <span>Baza qiymət ({seatsCount} oturacaq)</span>
        <span>{format(breakdown.subtotal)}</span>
      </div>

      {breakdown.earlyBirdDiscount > 0 && (
        <div className="web-breakdown-row discount">
          <span>Erkən Rezervasiya (-20%)</span>
          <span>-{format(breakdown.earlyBirdDiscount)}</span>
        </div>
      )}

      {breakdown.loyaltyDiscount > 0 && (
        <div className="web-breakdown-row discount">
          <span>Loyallıq Xal Endirimi</span>
          <span>-{format(breakdown.loyaltyDiscount)}</span>
        </div>
      )}

      {breakdown.promoDiscount > 0 && (
        <div className="web-breakdown-row discount">
          <span>Promokod Endirimi</span>
          <span>-{format(breakdown.promoDiscount)}</span>
        </div>
      )}

      <div className="web-breakdown-divider" />

      <div className="web-breakdown-row total">
        <strong>Yekun Məbləğ</strong>
        <strong className="total-amount">{format(breakdown.totalPrice)}</strong>
      </div>
    </div>
  );
};
