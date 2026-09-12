import React, { useState, useEffect } from 'react';
import { Button } from '@toursales/ui';
import { vendorFinanceApi } from '../../vendorFinanceApi';
import './PayoutRequestModal.css';

interface PayoutRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  initialIban?: string;
  currency: string;
  onSuccess: () => void;
}

export const PayoutRequestModal: React.FC<PayoutRequestModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  initialIban = 'AZ12ABB0000000012345678901',
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
  }, [initialIban]);

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
    if (!bankAccount.trim()) {
      setError('IBAN bank hesabını daxil edin.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await vendorFinanceApi.createPayoutRequest({
        amount: numAmount,
        bankAccount: bankAccount.trim(),
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
          <h3>Pul Çıxarışı Sorğusu</h3>
          <button type="button" className="payout-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="payout-info-box">
          <div className="payout-info-label">Mövcud Balans</div>
          <div className="payout-info-value">{availableBalance.toFixed(2)} {currency}</div>
        </div>

        {error && (
          <div className="payout-error-banner">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="payout-form-group">
            <label>Çıxarılacaq Məbləğ ({currency})</label>
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
                disabled={availableBalance <= 0}
              >
                Tam Balans
              </button>
            </div>
          </div>

          <div className="payout-form-group">
            <label>Bank Hesabı (IBAN)</label>
            <input
              type="text"
              placeholder="AZXX..."
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              required
            />
            <small className="payout-hint">
              Məbləğ təsdiq edildikdən sonra 1 iş günü ərzində bank hesabınıza köçürüləcəkdir.
            </small>
          </div>

          <div className="payout-actions">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Ləğv et
            </Button>
            <Button variant="primary" type="submit" isLoading={loading} disabled={availableBalance < 20}>
              Sorğu Göndər
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
