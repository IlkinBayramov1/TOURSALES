import React, { useState } from 'react';
import { Tag, Check } from 'lucide-react';
import { Button } from '@toursales/ui';
import './PromoInput.css';

interface PromoInputProps {
  onApplyPromo: (code: string) => void;
  appliedPromo?: string;
  discountAmount?: number;
}

export const PromoInput: React.FC<PromoInputProps> = ({
  onApplyPromo,
  appliedPromo,
  discountAmount,
}) => {
  const [code, setCode] = useState(appliedPromo || '');

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onApplyPromo(code.trim().toUpperCase());
    }
  };

  return (
    <div className="web-promo-container">
      <form className="web-promo-form" onSubmit={handleApply}>
        <div className="web-promo-input-wrapper">
          <Tag size={16} className="web-promo-icon" />
          <input
            type="text"
            placeholder="Promo kod daxil edin"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="web-promo-input"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Tətbiq et
        </Button>
      </form>

      {appliedPromo && (
        <div className="web-promo-applied">
          <Check size={14} />
          <span>
            <strong>{appliedPromo}</strong> promo kodu tətbiq edildi
            {discountAmount ? ` (-${discountAmount} AZN)` : ''}
          </span>
        </div>
      )}
    </div>
  );
};
