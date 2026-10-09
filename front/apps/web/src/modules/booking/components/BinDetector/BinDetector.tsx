import React, { useState, useEffect } from 'react';
import { BinDetectionResult, InstallmentOptionItem } from '@toursales/types';
import { CreditCard, Sparkles, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { bookingApi } from '@/modules/booking/api/bookingApi';
import './BinDetector.css';

interface BinDetectorProps {
  totalAmount: number;
  currency?: string;
  selectedInstallment: number;
  onSelectInstallment: (months: number) => void;
  onDetectionChange?: (detection: BinDetectionResult | null) => void;
  defaultBank?: 'KAPITAL' | 'ABB' | 'BANK_OF_BAKU' | 'UNIBANK';
}

export const BinDetector: React.FC<BinDetectorProps> = ({
  totalAmount,
  currency = 'AZN',
  selectedInstallment,
  onSelectInstallment,
  onDetectionChange,
  defaultBank = 'KAPITAL',
}) => {
  const [cardNumber, setCardNumber] = useState<string>('');
  const [detection, setDetection] = useState<BinDetectionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Pre-load default simulation for selected provider if user hasn't typed a custom card
  useEffect(() => {
    if (!cardNumber) {
      let defaultBin = '416973'; // Birkart
      if (defaultBank === 'ABB') defaultBin = '402860'; // Tamkart
      if (defaultBank === 'BANK_OF_BAKU') defaultBin = '418342'; // Bolkart
      if (defaultBank === 'UNIBANK') defaultBin = '409802'; // Albali

      bookingApi.detectBin({ cardNumberOrBin: defaultBin, amount: totalAmount, currency })
        .then((res) => {
          if (res) {
            setDetection(res);
            onDetectionChange?.(res);
          }
        })
        .catch(() => {});
    }
  }, [defaultBank, totalAmount, currency]);

  const handleCardInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    // Format card with spaces: XXXX XXXX XXXX XXXX
    const formatted = rawVal.match(/.{1,4}/g)?.join(' ') || rawVal;
    setCardNumber(formatted.substring(0, 19));

    if (rawVal.length >= 6) {
      try {
        setLoading(true);
        const res = await bookingApi.detectBin({
          cardNumberOrBin: rawVal.substring(0, 6),
          amount: totalAmount,
          currency,
        });
        if (res) {
          setDetection(res);
          onDetectionChange?.(res);
          if (res.supportedMonths && !res.supportedMonths.includes(selectedInstallment)) {
            onSelectInstallment(res.supportedMonths[0] || 1);
          }
        }
      } catch (err) {
        console.error('BIN Detection Error', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const getCardBgGradient = () => {
    if (!detection) return 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
    switch (detection.bankCode) {
      case 'KAPITAL':
        return 'linear-gradient(135deg, #E31E24 0%, #8B0000 100%)';
      case 'ABB':
        return 'linear-gradient(135deg, #003B70 0%, #001B3A 100%)';
      case 'BANK_OF_BAKU':
        return 'linear-gradient(135deg, #F5A623 0%, #9B51E0 100%)';
      case 'UNIBANK':
        return 'linear-gradient(135deg, #A30046 0%, #4A0021 100%)';
      default:
        return 'linear-gradient(135deg, #334155 0%, #1e293b 100%)';
    }
  };

  return (
    <div className="fintech-bin-detector-container">
      {/* 1. Virtual Card Visual Preview */}
      <div 
        className="fintech-card-preview"
        style={{ background: getCardBgGradient() }}
      >
        <div className="card-preview-header">
          <div className="card-bank-info">
            <span className="card-bank-name">{detection?.bankName || 'Bank Kartı'}</span>
            <span className="card-product-name">{detection?.cardName || 'Taksit Kartı'}</span>
          </div>
          <div className="card-network-badge">
            {detection?.cardBrand || 'VISA'}
          </div>
        </div>

        <div className="card-preview-chip">
          <div className="chip-lines"></div>
        </div>

        <div className="card-preview-number">
          {cardNumber || '•••• •••• •••• ••••'}
        </div>

        <div className="card-preview-footer">
          <div className="card-badge-pill">
            {detection?.badgeText || '0% Faizsiz Taksit'}
          </div>
          <div className="card-secure-mark">
            <ShieldCheck size={16} /> 3D Secure
          </div>
        </div>
      </div>

      {/* 2. Live Card Input for BIN verification */}
      <div className="fintech-card-input-wrapper">
        <label className="fintech-input-label">
          <span>Kartınızın ilk 6 rəqəmini və ya tam nömrəsini daxil edin:</span>
          {loading && <span className="bin-detecting-text">Bank yoxlanılır...</span>}
        </label>
        <div className="fintech-input-box">
          <CreditCard size={18} className="input-icon" />
          <input
            type="text"
            className="fintech-card-input"
            placeholder="Məs: 4169 73•• •••• ••••"
            value={cardNumber}
            onChange={handleCardInput}
            maxLength={19}
          />
          {detection?.isInstallment && (
            <span className="bin-verified-tag">
              <CheckCircle2 size={15} /> Taksit Təsdiqləndi
            </span>
          )}
        </div>
      </div>

      {/* 3. Dynamic Installment Month Selector */}
      {detection?.isInstallment && detection.installments && detection.installments.length > 0 ? (
        <div className="fintech-installments-selection-box">
          <div className="installments-section-title">
            <Sparkles size={16} />
            <span>Mövcud Faizsiz Taksit Müddətləri:</span>
          </div>

          <div className="fintech-installments-grid">
            {detection.installments.map((opt: InstallmentOptionItem) => {
              const isSelected = selectedInstallment === opt.months;
              return (
                <button
                  key={opt.months}
                  type="button"
                  className={`fintech-installment-tile ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectInstallment(opt.months)}
                  style={{
                    borderColor: isSelected ? detection.themeColor : undefined,
                  }}
                >
                  <div className="tile-top-row">
                    <span className="tile-months-text">
                      {opt.months === 1 ? 'Tam Ödəniş' : `${opt.months} Ay`}
                    </span>
                    {isSelected && (
                      <div 
                        className="tile-check-circle"
                        style={{ background: detection.themeColor }}
                      >
                        <CheckCircle2 size={12} color="#fff" />
                      </div>
                    )}
                  </div>
                  <div className="tile-cost-amount">
                    <strong>{opt.monthlyPayment.toFixed(2)}</strong> {currency}/ay
                  </div>
                  <div className="tile-subtext">
                    {opt.months === 1 ? 'Komissiyasız 1 dəfə' : '0% faiz və komissiya'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : detection && !detection.isInstallment ? (
        <div className="fintech-non-installment-alert">
          <AlertCircle size={18} />
          <span>
            Daxil edilən kart <strong>adi debet kartıdır</strong>. Sifarişinizi birdəfəlik tam məbləğlə ödəyə bilərsiniz. Faizsiz taksit üçün Birkart, Tamkart və ya Bolkart kartınızı daxil edin.
          </span>
        </div>
      ) : null}
    </div>
  );
};
