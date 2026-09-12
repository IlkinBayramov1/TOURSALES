import React, { useState } from 'react';
import { PasswordChangePayload } from '@toursales/types';
import { Button } from '@toursales/ui';
import './SecurityTab.css';

interface SecurityTabProps {
  onPasswordChange: (payload: PasswordChangePayload) => Promise<void>;
  changing: boolean;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  onPasswordChange,
  changing
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password strength calculation
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const calculateStrength = () => {
    let score = 0;
    if (hasMinLength) score++;
    if (hasLetter) score++;
    if (hasNumber) score++;
    if (newPassword.length >= 12) score++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) score++;
    return score;
  };

  const strength = calculateStrength();
  const strengthLabels = ['Çox Zəif', 'Zəif', 'Orta', 'Yaxşı', 'Çox Güclü'];
  const strengthColors = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#10b981'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!hasMinLength) {
      setNotification({ type: 'error', text: 'Yeni şifrə ən azı 8 simvoldan ibarət olmalıdır.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotification({ type: 'error', text: 'Yeni şifrə və təkrarı bir-biri ilə eyni deyil!' });
      return;
    }

    try {
      await onPasswordChange({
        currentPassword,
        newPassword
      });

      setNotification({
        type: 'success',
        text: 'Şifrəniz uğurla yeniləndi! Növbəti daxilolmalarda yeni şifrədən istifadə edin.'
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        'Cari şifrə yanlışdır və ya xəta baş verdi.';
      setNotification({ type: 'error', text: errorMsg });
    }
  };

  return (
    <div className="tab-pane-content">
      {notification && (
        <div className={`tab-notification ${notification.type}`}>
          <div className="notification-icon">
            {notification.type === 'success' ? '✓' : '⚠️'}
          </div>
          <span>{notification.text}</span>
        </div>
      )}

      {/* Two-Factor Auth Info Card */}
      <div className="security-status-card">
        <div className="security-status-icon">🔐</div>
        <div className="security-status-info">
          <div className="status-header-line">
            <h4>Hesab Təhlükəsizliyi & Giriş Qoruması</h4>
            <span className="status-badge-active">Qorunur (BCrypt 256)</span>
          </div>
          <p>
            Hesabınızın təhlükəsizliyi üçün şifrənizi mütəmadi olaraq yeniləməyiniz və digər platformalarda istifadə olunmayan unikal şifrə təyin etməyiniz tövsiyə olunur.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="profile-edit-form">
        <div className="form-card-section">
          <div className="section-title-wrap">
            <h3 className="section-title">Şifrənin Dəyişdirilməsi</h3>
            <p className="section-desc">Cari şifrənizi təsdiqləyərək yeni güclü şifrə təyin edin</p>
          </div>

          <div className="form-field-group full-width">
            <label htmlFor="currentPassword">
              Cari Şifrə <span className="req-star">*</span>
            </label>
            <div className="password-input-wrap">
              <input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Cari şifrənizi daxil edin"
              />
              <button
                type="button"
                className="eye-toggle-btn"
                onClick={() => setShowCurrent(!showCurrent)}
                tabIndex={-1}
              >
                {showCurrent ? '👁️' : '🔒'}
              </button>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-field-group">
              <label htmlFor="newPassword">
                Yeni Şifrə <span className="req-star">*</span>
              </label>
              <div className="password-input-wrap">
                <input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Minimum 8 simvol"
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowNew(!showNew)}
                  tabIndex={-1}
                >
                  {showNew ? '👁️' : '🔒'}
                </button>
              </div>

              {newPassword.length > 0 && (
                <div className="password-strength-box">
                  <div className="strength-bar-track">
                    <div
                      className="strength-bar-fill"
                      style={{
                        width: `${Math.min(100, (strength / 5) * 100)}%`,
                        backgroundColor: strengthColors[Math.min(4, Math.max(0, strength - 1))]
                      }}
                    />
                  </div>
                  <span
                    className="strength-text"
                    style={{ color: strengthColors[Math.min(4, Math.max(0, strength - 1))] }}
                  >
                    Güc: {strengthLabels[Math.min(4, Math.max(0, strength - 1))]}
                  </span>
                </div>
              )}
            </div>

            <div className="form-field-group">
              <label htmlFor="confirmPassword">
                Yeni Şifrənin Təkrarı <span className="req-star">*</span>
              </label>
              <div className="password-input-wrap">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Yeni şifrəni təkrar daxil edin"
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                >
                  {showConfirm ? '👁️' : '🔒'}
                </button>
              </div>
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="security-checklist">
            <div className={`checklist-item ${hasMinLength ? 'valid' : ''}`}>
              <span className="chk-icon">{hasMinLength ? '✓' : '○'}</span>
              <span>Ən azı 8 simvol</span>
            </div>
            <div className={`checklist-item ${hasLetter ? 'valid' : ''}`}>
              <span className="chk-icon">{hasLetter ? '✓' : '○'}</span>
              <span>Ən azı bir hərf (a-z, A-Z)</span>
            </div>
            <div className={`checklist-item ${hasNumber ? 'valid' : ''}`}>
              <span className="chk-icon">{hasNumber ? '✓' : '○'}</span>
              <span>Ən azı bir rəqəm (0-9)</span>
            </div>
            <div className={`checklist-item ${passwordsMatch ? 'valid' : ''}`}>
              <span className="chk-icon">{passwordsMatch ? '✓' : '○'}</span>
              <span>Şifrələr bir-biri ilə eynidir</span>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="form-actions-bar">
          <Button
            variant="primary"
            type="submit"
            isLoading={changing}
            disabled={!currentPassword || !hasMinLength || !passwordsMatch}
          >
            Şifrəni Yenilə
          </Button>
        </div>
      </form>
    </div>
  );
};
