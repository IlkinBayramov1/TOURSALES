import React, { useState, useEffect } from 'react';
import { Button } from '@toursales/ui';
import { AgencyMember, teamApi } from '../../teamApi';
import { UserCheck, AlertCircle } from 'lucide-react';
import './EditMemberModal.css';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: AgencyMember | null;
  onSuccess: () => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'MANAGER' | 'ACCOUNTANT' | 'GUIDE'>('GUIDE');
  const [status, setStatus] = useState<'Active' | 'Suspended'>('Active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      setName(member.name);
      setPhone(member.phoneNumber || '');
      setRole((member.role === 'OWNER' ? 'MANAGER' : member.role) as any);
      setStatus((member.status as any) || 'Active');
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await teamApi.updateMember(member.id, {
        name: name.trim(),
        phone: phone.trim(),
        role,
        status,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Əməkdaş yenilənmə xətası:', err);
      setError(
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        'Əməkdaş məlumatları yenilənərkən xəta baş verdi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <div>
            <span className="edit-header-badge">Əməkdaş Tənzimləmələri</span>
            <h3>Əməkdaş Məlumatlarını Redaktə Et</h3>
          </div>
          <button type="button" className="edit-close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="edit-error-banner">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="edit-form-group">
            <label>Ad və Soyad</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="edit-form-group">
            <label>E-poçt Ünvanı (Dəyişdirilə bilməz)</label>
            <input
              type="email"
              value={member.email}
              disabled
              style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
            />
          </div>

          <div className="edit-form-group">
            <label>Əlaqə Telefonu</label>
            <input
              type="text"
              placeholder="+994 XX XXX XX XX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="edit-form-group">
            <label>Sistem Rolu (RBAC)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              disabled={member.role === 'OWNER'}
            >
              <option value="MANAGER">Menecer (MANAGER) - Turlar, sifarişlər & komanda</option>
              <option value="ACCOUNTANT">Mühasib (ACCOUNTANT) - Maliyyə, çıxarış & hesabatlar</option>
              <option value="GUIDE">Bələdçi (GUIDE) - QR skan & sərnişin manifesti</option>
            </select>
          </div>

          <div className="edit-form-group">
            <label>Hesab Statusu</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              disabled={member.role === 'OWNER'}
            >
              <option value="Active">Aktiv (Sistemə daxil ola bilər)</option>
              <option value="Suspended">Dondurulub (Giriş müvəqqəti qadağandır)</option>
            </select>
          </div>

          <div className="edit-actions">
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
