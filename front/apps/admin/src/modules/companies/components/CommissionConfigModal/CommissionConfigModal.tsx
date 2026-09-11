import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { Company } from '@toursales/types';
import { companiesApi } from '../../companiesApi';
import './CommissionConfigModal.css';

interface CommissionConfigModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CommissionConfigModal: React.FC<CommissionConfigModalProps> = ({
  company,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rate, setRate] = useState<string>(company ? company.commissionRate.toString() : '5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !company) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numRate = parseFloat(rate);
    if (isNaN(numRate) || numRate < 0 || numRate > 100) {
      setError('Zəhmət olmasa 0 və 100 arasında faiz daxil edin');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await companiesApi.updateCommission(company.id, numRate);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Komissiya yenilənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comm-modal-overlay" onClick={onClose}>
      <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="comm-modal-header">
          <h3>Komissiya Dərəcəsini Tənzimlə</h3>
          <button type="button" className="comm-close-btn" onClick={onClose}>×</button>
        </div>

        <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          <strong>{company.name}</strong> üçün platforma komissiya faizini təyin edin.
        </div>

        {error && (
          <div style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="comm-form-group">
            <label>Platforma Komissiya Faizi (%)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
            />
          </div>

          <div className="comm-modal-actions">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Ləğv et
            </Button>
            <Button variant="primary" type="submit" isLoading={loading}>
              Yadda Saxla
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
