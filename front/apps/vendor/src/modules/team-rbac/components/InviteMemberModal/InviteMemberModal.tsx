import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { teamApi } from '../../teamApi';
import { UserPlus, AlertCircle } from 'lucide-react';
import './InviteMemberModal.css';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'GUIDE' | 'ACCOUNTANT' | 'MANAGER'>('MANAGER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      setError('Zəhmət olmasa ad və e-poçt ünvanını doldurun.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await teamApi.inviteMember({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password: password.trim() || undefined,
        role,
      });
      onSuccess();
      onClose();
      // reset form
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
    } catch (err: any) {
      setError(err?.response?.data?.msg || err?.response?.data?.message || 'İstifadəçi dəvət edilərkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invite-modal-overlay" onClick={onClose}>
      <div className="invite-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="invite-modal-header">
          <div>
            <span className="invite-badge">Komanda Heyəti</span>
            <h3>Yeni Əməkdaş Əlavə Et</h3>
          </div>
          <button type="button" className="invite-close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="invite-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
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
            <label>E-poçt Ünvanı (Giriş Logini)</label>
            <input
              type="email"
              placeholder="example@aztour.az"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="invite-form-group">
            <label>Əlaqə Telefonu</label>
            <input
              type="text"
              placeholder="+994 XX XXX XX XX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="invite-form-group">
            <label>Sistem Rolu (RBAC Səlahiyyəti)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
            >
              <option value="MANAGER">Menecer (MANAGER) - Turlar, sifarişlər & komanda</option>
              <option value="ACCOUNTANT">Mühasib (ACCOUNTANT) - Maliyyə, çıxarış & hesabatlar</option>
              <option value="GUIDE">Bələdçi (GUIDE) - QR skan & sərnişin manifesti</option>
            </select>
          </div>

          <div className="invite-form-group">
            <label>İlkin Giriş Şifrəsi</label>
            <input
              type="text"
              placeholder="Boş buraxsanız: password123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <small className="invite-hint">
              Əməkdaş ilk dəfə sistemə daxil olduqdan sonra öz şifrəsini istədiyi vaxt dəyişə bilər.
            </small>
          </div>

          <div className="invite-actions">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Ləğv et
            </Button>
            <Button variant="primary" type="submit" isLoading={loading}>
              Əməkdaşı Əlavə Et
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
