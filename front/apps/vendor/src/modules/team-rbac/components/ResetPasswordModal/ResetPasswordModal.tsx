import React, { useState } from 'react';
import { Button, Badge } from '@toursales/ui';
import { AgencyMember, teamApi } from '../../teamApi';
import { KeyRound, Copy, Check, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import './ResetPasswordModal.css';

interface ResetPasswordModalProps {
  isOpen: boolean;
  member: AgencyMember | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  member,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'AUTO' | 'CUSTOM'>('AUTO');
  const [customPassword, setCustomPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPass, setGeneratedPass] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !member) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const passToSend = mode === 'CUSTOM' ? customPassword.trim() : undefined;
      const res = await teamApi.resetPassword(member.id, passToSend);
      setGeneratedPass(res.tempPassword || passToSend || 'password123');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Şifrə sıfırlanarkən xəta:', err);
      setError(
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        'Şifrə sıfırlanarkən xəta baş verdi.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedPass) {
      navigator.clipboard.writeText(generatedPass);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleModalClose = () => {
    setGeneratedPass(null);
    setCustomPassword('');
    setError(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="reset-modal-overlay" onClick={handleModalClose}>
      <div className="reset-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="reset-modal-header">
          <div className="reset-header-left">
            <span className="reset-badge">
              <KeyRound size={13} />
              Təhlükəsizlik
            </span>
            <h3>Giriş Şifrəsini Sıfırla</h3>
          </div>
          <button type="button" className="reset-close-btn" onClick={handleModalClose}>×</button>
        </div>

        {/* Member Identity Card */}
        <div className="reset-member-info">
          <div className="reset-member-avatar">
            {member.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="reset-member-meta">
            <h4>{member.name}</h4>
            <span className="reset-member-email">{member.email}</span>
          </div>
          <Badge variant="neutral" pill className="ml-auto">
            {member.role}
          </Badge>
        </div>

        {error && (
          <div className="reset-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {generatedPass ? (
          /* Success Screen with Copyable Password */
          <div className="reset-success-screen">
            <div className="reset-success-icon-wrap">
              <CheckCircle2 size={36} className="text-success" />
            </div>
            <h4>Şifrə Uğurla Yeniləndi!</h4>
            <p className="reset-success-desc">
              Əməkdaş üçün yeni giriş şifrəsi təyin edildi. Bu şifrəni kopyalayıb əməkdaşa təqdim edin:
            </p>

            <div className="reset-copy-box">
              <span className="reset-pass-code">{generatedPass}</span>
              <button
                type="button"
                className={`reset-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Kopyalandı!' : 'Kopyala'}</span>
              </button>
            </div>

            <div className="reset-security-hint">
              <span>ℹ️ Əməkdaş ilk dəfə sistemə daxil olduqdan sonra öz profilindən bu şifrəni istədiyi vaxt dəyişə bilər.</span>
            </div>

            <div className="reset-modal-actions">
              <Button variant="primary" style={{ width: '100%' }} onClick={handleModalClose}>
                Bağla və Bitir
              </Button>
            </div>
          </div>
        ) : (
          /* Form for Reset Options */
          <form onSubmit={handleReset}>
            <div className="reset-mode-selector">
              <label
                className={`reset-mode-opt ${mode === 'AUTO' ? 'active' : ''}`}
                onClick={() => setMode('AUTO')}
              >
                <input
                  type="radio"
                  name="resetMode"
                  checked={mode === 'AUTO'}
                  onChange={() => setMode('AUTO')}
                />
                <div className="reset-mode-text">
                  <strong>
                    <Sparkles size={14} className="text-primary inline mr-1" />
                    Avtomatik Təsadüfi Şifrə (Tövsiyə olunur)
                  </strong>
                  <p>Sistem təhlükəsiz, mürəkkəb birdəfəlik şifrə generasiya edəcək</p>
                </div>
              </label>

              <label
                className={`reset-mode-opt ${mode === 'CUSTOM' ? 'active' : ''}`}
                onClick={() => setMode('CUSTOM')}
              >
                <input
                  type="radio"
                  name="resetMode"
                  checked={mode === 'CUSTOM'}
                  onChange={() => setMode('CUSTOM')}
                />
                <div className="reset-mode-text">
                  <strong>Əllə Yeni Şifrə Daxil Et</strong>
                  <p>Özünüz müəyyən etdiyiniz xüsusi şifrəni təyin edin</p>
                </div>
              </label>
            </div>

            {mode === 'CUSTOM' && (
              <div className="reset-form-group">
                <label>Yeni Şifrə</label>
                <input
                  type="text"
                  placeholder="Məsələn: Tour2026#Agency"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="reset-actions">
              <Button variant="secondary" onClick={handleModalClose} disabled={loading}>
                Ləğv et
              </Button>
              <Button variant="primary" type="submit" isLoading={loading}>
                Şifrəni Sıfırla
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
