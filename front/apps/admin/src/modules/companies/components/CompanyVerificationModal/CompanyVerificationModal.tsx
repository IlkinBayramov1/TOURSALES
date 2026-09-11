import React, { useState } from 'react';
import { Button, Badge } from '@toursales/ui';
import { Company, CompanyStatus } from '@toursales/types';
import { companiesApi } from '../../companiesApi';
import './CompanyVerificationModal.css';

interface CompanyVerificationModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CompanyVerificationModal: React.FC<CompanyVerificationModalProps> = ({
  company,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [status, setStatus] = useState<CompanyStatus>(company?.status || 'ACTIVE');
  const [reason, setReason] = useState<string>(company?.rejectionReason || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !company) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await companiesApi.updateStatus(company.id, status, reason);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Status dəyişdirilərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-modal-overlay" onClick={onClose}>
      <div className="verify-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="verify-modal-header">
          <h3>Agentlik Verifikasiyası & Statusu</h3>
          <button type="button" className="verify-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="verify-company-box">
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
            {company.name}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            VÖEN: {company.voen} | Əlaqə: {company.email}
          </div>
        </div>

        {error && (
          <div style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="verify-form-group">
            <label>Yeni Hüquqi Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CompanyStatus)}
            >
              <option value="ACTIVE">Təsdiq Et & Aktivləşdir (ACTIVE)</option>
              <option value="PENDING">Gözləmədə Saxla (PENDING)</option>
              <option value="SUSPENDED">Fəaliyyətini Dayandır (SUSPENDED)</option>
              <option value="REJECTED">İmtina Et (REJECTED)</option>
            </select>
          </div>

          {(status === 'SUSPENDED' || status === 'REJECTED') && (
            <div className="verify-form-group">
              <label>Səbəb və ya Tələb Edilən Sənəd</label>
              <textarea
                rows={3}
                placeholder="Agentliyə göndəriləcək bildiriş və səbəb..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
          )}

          <div className="verify-modal-actions">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Ləğv et
            </Button>
            <Button variant="primary" type="submit" isLoading={loading}>
              Statusu Təsdiqlə
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
