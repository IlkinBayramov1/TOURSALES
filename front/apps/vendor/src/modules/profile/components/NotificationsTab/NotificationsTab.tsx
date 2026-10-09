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
    marketingTips: false,
    whatsappAlerts: true,
    telegramAlerts: false,
    dailyDigest: true
  });

  const [notificationEmail, setNotificationEmail] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let parsed: any = {
      emailBookings: true,
      emailPayouts: true,
      smsAlerts: false,
      marketingTips: false,
      whatsappAlerts: true,
      telegramAlerts: false,
      dailyDigest: true
    };

    if (typeof company.notificationSettings === 'string') {
      try {
        const obj = JSON.parse(company.notificationSettings);
        parsed = { ...parsed, ...obj };
        if (obj.notificationEmail) {
          setNotificationEmail(obj.notificationEmail);
        } else {
          setNotificationEmail(company.email || '');
        }
      } catch {
        setNotificationEmail(company.email || '');
      }
    } else if (company.notificationSettings) {
      const obj = company.notificationSettings as any;
      parsed = { ...parsed, ...obj };
      setNotificationEmail(obj.notificationEmail || company.email || '');
    } else {
      setNotificationEmail(company.email || '');
    }

    setSettings({
      emailBookings: parsed.emailBookings !== false,
      emailPayouts: parsed.emailPayouts !== false,
      smsAlerts: !!parsed.smsAlerts,
      marketingTips: !!parsed.marketingTips,
      whatsappAlerts: parsed.whatsappAlerts !== false,
      telegramAlerts: !!parsed.telegramAlerts,
      dailyDigest: parsed.dailyDigest !== false
    });
  }, [company]);

  const toggleSetting = (key: string) => {
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
        notificationSettings: {
          ...settings,
          notificationEmail
        } as any
      });

      setNotification({
        type: 'success',
        text: 'Bildiriş kanalları və tənzimləmələr uğurla yadda saxlanıldı!'
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
        {/* Destination Email Card */}
        <div className="form-card-section">
          <div className="section-title-wrap">
            <h3 className="section-title">Əsas Bildiriş E-poçt Ünvanı</h3>
            <p className="section-desc">Bütün vacib maliyyə və rezervasiya bildirişlərinin göndəriləcəyi ünvan</p>
          </div>

          <div className="form-field-group full-width">
            <label htmlFor="notificationEmail">Bildiriş E-poçtu</label>
            <input
              id="notificationEmail"
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="alerts@agentlik.az və ya info@agentlik.az"
            />
            <span className="field-hint">Boş qaldıqda şirkətin rəsmi e-poçt ünvanı istifadə olunur</span>
          </div>
        </div>

        {/* SECTION 1: BOOKING ALERTS */}
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
              <span className="notif-title">WhatsApp Rezervasiya Bildirişləri</span>
              <span className="notif-subtitle">
                Hər yeni sifarişdə şirkətin WhatsApp menecer nömrəsinə bilet detalları və turist adı mesajla gəlsin
              </span>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={!!settings.whatsappAlerts}
                onChange={() => toggleSetting('whatsappAlerts')}
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

          <div className="notification-item-row">
            <div className="notif-text-col">
              <span className="notif-title">Telegram Bot Bildirişləri</span>
              <span className="notif-subtitle">
                Agentlik komandanız üçün xüsusi TourSales Telegram botuna anlıq sifariş siqnalları
              </span>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={!!settings.telegramAlerts}
                onChange={() => toggleSetting('telegramAlerts')}
              />
              <span className="slider-round" />
            </label>
          </div>
        </div>

        {/* SECTION 2: FINANCE & MARKETING */}
        <div className="form-card-section">
          <div className="section-title-wrap">
            <h3 className="section-title">Maliyyə və Hesabat Bildirişləri</h3>
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
              <span className="notif-title">Gündəlik Satış Xülasəsi (Daily Digest)</span>
              <span className="notif-subtitle">
                Hər gün saat 20:00-da gün ərzində satılmış biletlər və ümumi gəlir xülasəsi e-poçtunuza göndərilsin
              </span>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={!!settings.dailyDigest}
                onChange={() => toggleSetting('dailyDigest')}
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
