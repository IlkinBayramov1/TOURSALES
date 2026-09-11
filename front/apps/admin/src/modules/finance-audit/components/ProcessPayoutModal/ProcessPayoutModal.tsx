import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { PayoutRequest } from '@toursales/types';
import { financeAuditApi } from '../../financeAuditApi';
import './ProcessPayoutModal.css';

interface ProcessPayoutModalProps {
  payout: PayoutRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProcessPayoutModal: React.FC<ProcessPayoutModalProps> = ({
  payout,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [mode, setMode] = useState<'decision' | 'reject'>('decision');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !payout) return null;

  const handleApprove = async () => {
    try {
      setLoading(true);
      setError(null);
      await financeAuditApi.approvePayout(payout.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Çıxarış təsdiq edilərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await financeAuditApi.rejectPayout(payout.id, rejectReason);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Çıxarışdan imtina edilərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payout-proc-overlay" onClick={onClose}>
      <div className="payout-proc-card" onClick={(e) => e.stopPropagation()}>
        <div className="payout-proc-header">
          <h3>Pul Çıxarışı Əməliyyatı</h3>
          <button type="button" style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }} onClick={onClose}>×</button>
        </div>

        <div className="payout-proc-box">
          <div className="payout-proc-row">
            <span className="label">Şirkət / Agentlik:</span>
            <span className="val">{payout.companyName || payout.companyId}</span>
          </div>
          <div className="payout-proc-row">
            <span className="label">Məbləğ:</span>
            <span className="val" style={{ color: 'var(--color-success)', fontSize: '1.125rem' }}>
              {payout.amount.toFixed(2)} {payout.currency}
            </span>
          </div>
          <div className="payout-proc-row">
            <span className="label">Bank Hesabı (IBAN):</span>
            <span className="val" style={{ fontFamily: 'monospace' }}>{payout.bankAccount}</span>
          </div>
          <div className="payout-proc-row">
            <span className="label">Tələb Tarixi:</span>
            <span className="val">{new Date(payout.requestedAt).toLocaleString('az-AZ')}</span>
          </div>
        </div>

        {error && (
          <div style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {mode === 'decision' ? (
          <div className="payout-proc-actions">
            <Button
              variant="secondary"
              onClick={() => setMode('reject')}
              disabled={loading}
              style={{ color: 'var(--color-error)' }}
            >
              İmtina Et
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              isLoading={loading}
            >
              Ödənişi Təsdiqlə (Bank Transfer)
            </Button>
          </div>
        ) : (
          <form onSubmit={handleReject}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                İmtina Səbəbi
              </label>
              <textarea
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  boxSizing: 'border-box'
                }}
                placeholder="Agentliyə izah edici səbəb..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>

            <div className="payout-proc-actions">
              <Button variant="secondary" onClick={() => setMode('decision')} disabled={loading}>
                Geri
              </Button>
              <Button variant="primary" type="submit" isLoading={loading} style={{ backgroundColor: 'var(--color-error)' }}>
                İmtinanı Təsdiqlə
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
