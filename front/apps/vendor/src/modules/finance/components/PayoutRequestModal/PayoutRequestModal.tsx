import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { vendorFinanceApi } from '../../vendorFinanceApi';
import './PayoutRequestModal.css';

interface PayoutRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  currency: string;
  onSuccess: () => void;
}

export const PayoutRequestModal: React.FC<PayoutRequestModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  currency,
  onSuccess
}) => {
  const [amount, setAmount] = useState<string>('');
  const [bankAccount, setBankAccount] = useState<string>('AZ12ABB0000000012345678901');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Zəhmət olmasa düzgün məbləğ daxil edin');
      return;
    }
    if (numAmount > availableBalance) {
      setError(`Məbləğ mövcud balansdan (${availableBalance} ${currency}) çox ola bilməz`);
      return;
    }
    if (!bankAccount.trim()) {
      setError('IBAN hesabını daxil edin');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await vendorFinanceApi.createPayoutRequest({
        amount: numAmount,
        bankAccount
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Çıxarış sorğusu göndərilərkən xəta baş verdi');
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
          <div style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="payout-form-group">
            <label>Çıxarılacaq Məbləğ ({currency})</label>
            <input
              type="number"
              step="0.01"
              min="1"
              max={availableBalance}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
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
          </div>

          <div className="payout-actions">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Ləğv et
            </Button>
            <Button variant="primary" type="submit" isLoading={loading}>
              Sorğu Göndər
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
