import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { teamApi } from '../../teamApi';
import './InviteMemberModal.css';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'GUIDE' | 'ACCOUNTANT' | 'MANAGER'>('GUIDE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      setError('Zəhmət olmasa bütün sahələri doldurun');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await teamApi.inviteMember({ name, email, role });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'İstifadəçi dəvət edilərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invite-modal-overlay" onClick={onClose}>
      <div className="invite-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="invite-modal-header">
          <h3>Yeni Komanda Üzvü Dəvət Et</h3>
          <button type="button" className="invite-close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="invite-form-group">
            <label>Ad və Soyad</label>
            <input
              type="text"
              placeholder="Məsələn: Rəşad Quliyev"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="invite-form-group">
            <label>E-poçt Ünvanı</label>
            <input
              type="email"
              placeholder="example@caspiantour.az"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="invite-form-group">
            <label>Sistem Rolu (RBAC)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
            >
              <option value="GUIDE">Bələdçi (GUIDE) - QR skan & sərnişin siyahısı</option>
              <option value="ACCOUNTANT">Mühasib (ACCOUNTANT) - Maliyyə, çıxarış & hesabatlar</option>
              <option value="MANAGER">Menecer (MANAGER) - Turlar, sifarişlər & komanda</option>
            </select>
          </div>

          <div className="invite-actions">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Ləğv et
            </Button>
            <Button variant="primary" type="submit" isLoading={loading}>
              Dəvət Göndər
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
