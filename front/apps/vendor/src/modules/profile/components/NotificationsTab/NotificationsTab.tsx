import React, { useState, useEffect } from 'react';
import { Company, CompanyNotificationSettings } from '@toursales/types';
import { Button } from '@toursales/ui';
import './NotificationsTab.css';

interface NotificationsTabProps {
  company: Company;
  onSave: (data: Partial<Company>) => Promise<void>;
  saving: boolean;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  company,
  onSave,
  saving
}) => {
  const [settings, setSettings] = useState<CompanyNotificationSettings>({
    emailBookings: true,
    emailPayouts: true,
    smsAlerts: false,
    marketingTips: false
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let parsed: CompanyNotificationSettings = {
      emailBookings: true,
      emailPayouts: true,
      smsAlerts: false,
      marketingTips: false
    };

    if (typeof company.notificationSettings === 'string') {
      try {
        parsed = { ...parsed, ...JSON.parse(company.notificationSettings) };
      } catch {
        // default
      }
    } else if (company.notificationSettings) {
      parsed = { ...parsed, ...company.notificationSettings };
    }

    setSettings(parsed);
  }, [company]);

  const toggleSetting = (key: keyof CompanyNotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    try {
      await onSave({
        notificationSettings: settings
      });

      setNotification({
        type: 'success',
        text: 'Bildiriş və əməliyyat tənzimləmələri uğurla yadda saxlanıldı!'
      });
      setTimeout(() => setNotification(null), 4000);
    } catch {
      setNotification({
        type: 'error',
        text: 'Tənzimləmələri yadda saxlayarkən xəta baş verdi.'
      });
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

      <form onSubmit={handleSubmit} className="profile-edit-form">
        <div className="form-card-section">
          <div className="section-title-wrap">
            <h3 className="section-title">Rezervasiya və Müştəri Əlaqələri</h3>
            <p className="section-desc">Yeni turların satışı və sərnişin qeydiyyatı bildirişləri</p>
          </div>

          <div className="notification-item-row">
            <div className="notif-text-col">
              <span className="notif-title">Yeni Bilet Sifarişləri (E-poçt)</span>
              <span className="notif-subtitle">
                Müştəri saytdan tura bilet sifariş etdikdə rəsmi e-poçt ünvanınıza anında bildiriş göndərilsin
              </span>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={!!settings.emailBookings}
                onChange={() => toggleSetting('emailBookings')}
              />
              <span className="slider-round" />
            </label>
          </div>

          <div className="notification-item-row">
            <div className="notif-text-col">
              <span className="notif-title">Təcili Rezervasiyalar (SMS Xəbərdarlıq)</span>
              <span className="notif-subtitle">
                Turun başlanmasına 24 saatdan az qaldıqda daxil olan bilet sifarişləri üzrə SMS xəbərdarlıq
              </span>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={!!settings.smsAlerts}
                onChange={() => toggleSetting('smsAlerts')}
              />
              <span className="slider-round" />
            </label>
          </div>
        </div>

        <div className="form-card-section">
          <div className="section-title-wrap">
            <h3 className="section-title">Maliyyə və Çıxarış Bildirişləri</h3>
            <p className="section-desc">Balans dəyişiklikləri və bank köçürmələri haqqında məlumatlandırma</p>
          </div>

          <div className="notification-item-row">
            <div className="notif-text-col">
              <span className="notif-title">Pul Çıxarışı Statusu (E-poçt)</span>
              <span className="notif-subtitle">
                Balansdan bank hesabınıza köçürülən vəsaitlər təsdiqləndikdə və icra edildikdə bildiriş alın
              </span>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={!!settings.emailPayouts}
                onChange={() => toggleSetting('emailPayouts')}
              />
              <span className="slider-round" />
            </label>
          </div>

          <div className="notification-item-row">
            <div className="notif-text-col">
              <span className="notif-title">Turizm Platforması Yenilikləri & Tövsiyələr</span>
              <span className="notif-subtitle">
                Tur satışlarınızı artırmaq üçün analitik hesabatlar və mövsümi tövsiyələr göndərilsin
              </span>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={!!settings.marketingTips}
                onChange={() => toggleSetting('marketingTips')}
              />
              <span className="slider-round" />
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="form-actions-bar">
          <Button variant="primary" type="submit" isLoading={saving}>
            Tənzimləmələri Saxla
          </Button>
        </div>
      </form>
    </div>
  );
};
