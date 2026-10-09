import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@toursales/ui';
import { Building2, ShieldCheck, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { vendorFinanceApi } from '../../vendorFinanceApi';
import './PayoutRequestModal.css';

interface PayoutRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  initialIban?: string;
  initialBankName?: string;
  currency: string;
  onSuccess: () => void;
}

const AZ_BANKS: Record<string, string> = {
  IBAZ: 'ABB (Azərbaycan Beynəlxalq Bankı)',
  PASHA: 'PAŞA Bank ASC',
  PASH: 'PAŞA Bank ASC',
  KAPB: 'Kapital Bank ASC',
  KAPI: 'Kapital Bank ASC',
  UNIB: 'Unibank KB ASC',
  YAPI: 'Yapı Kredi Bank Azərbaycan',
  YKBA: 'Yapı Kredi Bank Azərbaycan',
  RABT: 'Rabitəbank ASC',
  XALQ: 'Xalq Bank ASC',
  AFBB: 'AFB Bank ASC',
  ATIB: 'AccessBank QSC',
  BOBA: 'Bank of Baku ASC',
  BRES: 'Bank Respublika ASC',
  BTIB: 'Bank Respublika ASC',
  PREM: 'Premium Bank ASC',
  PAKO: 'Premium Bank ASC',
  EXPR: 'Expressbank ASC',
  AZTB: 'Azər-Türk Bank ASC',
};

export const PayoutRequestModal: React.FC<PayoutRequestModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  initialIban = 'AZ12ABB0000000012345678901',
  initialBankName,
  currency,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [bankAccount, setBankAccount] = useState<string>(initialIban);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialIban) {
      setBankAccount(initialIban);
    }
  }, [initialIban, isOpen]);

  const cleanIban = useMemo(() => {
    return bankAccount.replace(/\s+/g, '').toUpperCase();
  }, [bankAccount]);

  const detectedBank = useMemo(() => {
    if (cleanIban.length >= 8 && cleanIban.startsWith('AZ')) {
      const code4 = cleanIban.substring(4, 8);
      const code5 = cleanIban.substring(4, 9);
      if (AZ_BANKS[code5]) return AZ_BANKS[code5];
      if (AZ_BANKS[code4]) return AZ_BANKS[code4];
    }
    return initialBankName || null;
  }, [cleanIban, initialBankName]);

  const isIbanValid = useMemo(() => {
    return cleanIban.startsWith('AZ') && cleanIban.length === 28;
  }, [cleanIban]);

  if (!isOpen) return null;

  const handleQuickAmount = (val: number) => {
    const finalVal = Math.min(val, availableBalance);
    setAmount(finalVal.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Zəhmət olmasa düzgün məbləğ daxil edin.');
      return;
    }
    if (numAmount < 20) {
      setError('Minimum çıxarış məbləği 20 AZN təşkil edir.');
      return;
    }
    if (numAmount > availableBalance) {
      setError(`Məbləğ mövcud balansdan (${availableBalance.toFixed(2)} ${currency}) çox ola bilməz.`);
      return;
    }
    if (!cleanIban.startsWith('AZ') || cleanIban.length !== 28) {
      setError('Azərbaycan IBAN nömrəsi 28 simvoldan ibarət olmalıdır (məs: AZ12ABB0000000012345678901).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await vendorFinanceApi.createPayoutRequest({
        amount: numAmount,
        bankAccount: cleanIban,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.msg || err?.response?.data?.message || 'Çıxarış sorğusu göndərilərkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payout-modal-overlay" onClick={onClose}>
      <div className="payout-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="payout-modal-header">
          <div className="payout-header-title">
            <h3>Pul Çıxarışı Sorğusu</h3>
            <p>Mövcud balansınızdan bank hesabınıza komissiyasız vəsait çıxarışı</p>
          </div>
          <button type="button" className="payout-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="payout-info-box">
          <div className="payout-info-header">
            <span className="payout-info-label">Çıxarışa Hazır Xalis Balans</span>
            <span className="payout-info-pill">0% Komissiya</span>
          </div>
          <div className="payout-info-value">{availableBalance.toFixed(2)} {currency}</div>
        </div>

        {error && (
          <div className="payout-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="payout-form-group">
            <label>Çıxarılacaq Məbləğ ({currency}) *</label>
            <div className="payout-input-wrap">
              <input
                type="number"
                step="0.01"
                min="20"
                max={availableBalance}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <span className="payout-currency-suffix">{currency}</span>
            </div>

            {/* Quick Amount Buttons */}
            <div className="payout-quick-pills">
              <button
                type="button"
                className="payout-quick-pill"
                onClick={() => handleQuickAmount(50)}
                disabled={availableBalance < 50}
              >
                50 {currency}
              </button>
              <button
                type="button"
                className="payout-quick-pill"
                onClick={() => handleQuickAmount(100)}
                disabled={availableBalance < 100}
              >
                100 {currency}
              </button>
              <button
                type="button"
                className="payout-quick-pill"
                onClick={() => handleQuickAmount(250)}
                disabled={availableBalance < 250}
              >
                250 {currency}
              </button>
              <button
                type="button"
                className="payout-quick-pill full"
                onClick={() => handleQuickAmount(availableBalance)}
                disabled={availableBalance < 20}
              >
                Tam Balans ({availableBalance.toFixed(2)})
              </button>
            </div>
          </div>

          <div className="payout-form-group">
            <label>Bank Hesabı (IBAN) *</label>
            <div className="payout-iban-input-wrap">
              <input
                type="text"
                placeholder="AZ12ABB0000000012345678901"
                maxLength={34}
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value.toUpperCase())}
                className={isIbanValid ? 'valid' : ''}
                required
              />
              {isIbanValid ? (
                <CheckCircle2 size={18} className="payout-iban-status-icon text-success" />
              ) : (
                <span className="payout-iban-length-tag">{cleanIban.length}/28</span>
              )}
            </div>

            {detectedBank && (
              <div className="payout-bank-detected-pill">
                <Building2 size={14} />
                <span>Tanınan Bank: <strong>{detectedBank}</strong></span>
              </div>
            )}

            <div className="payout-meta-notes">
              <div className="payout-meta-item">
                <ShieldCheck size={14} />
                <span>Çıxarış komissiyası: <strong>0.00 AZN (Pulsuz)</strong></span>
              </div>
              <div className="payout-meta-item">
                <ArrowUpRight size={14} />
                <span>İcra müddəti: <strong>1 iş günü ərzində</strong></span>
              </div>
            </div>
          </div>

          <div className="payout-actions">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Ləğv et
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              isLoading={loading} 
              disabled={availableBalance < 20 || (parseFloat(amount) || 0) < 20 || (parseFloat(amount) || 0) > availableBalance}
            >
              Sorğu Göndər
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
