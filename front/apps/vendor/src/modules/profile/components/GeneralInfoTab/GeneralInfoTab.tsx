import React, { useState, useEffect } from 'react';
import { Company, CompanySocialLinks } from '@toursales/types';
import { Button } from '@toursales/ui';
import './GeneralInfoTab.css';

interface GeneralInfoTabProps {
  company: Company;
  onSave: (data: Partial<Company>) => Promise<void>;
  saving: boolean;
}

export const GeneralInfoTab: React.FC<GeneralInfoTabProps> = ({
  company,
  onSave,
  saving
}) => {
  const [formData, setFormData] = useState({
    name: company.name || '',
    legalName: company.legalName || '',
    voen: company.voen || '',
    email: company.email || '',
    phone: company.phone || company.phoneNumber || '',
    hotline: '',
    dtaRegistry: '',
    city: company.city || 'Bakı',
    address: company.address || '',
    website: company.website || '',
    workingHours: company.workingHours || 'B.e - Şənbə: 09:00 - 19:00',
    description: company.description || '',
    instagram: '',
    whatsapp: '',
    facebook: '',
    telegram: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let social: CompanySocialLinks = {};
    if (typeof company.socialLinks === 'string') {
      try {
        social = JSON.parse(company.socialLinks);
      } catch {
        social = {};
      }
    } else if (company.socialLinks) {
      social = company.socialLinks;
    }

    setFormData({
      name: company.name || '',
      legalName: company.legalName || '',
      voen: company.voen || '',
      email: company.email || '',
      phone: company.phone || company.phoneNumber || '',
      hotline: social.hotline || '+994 12 599 00 00',
      dtaRegistry: social.dtaRegistry || `DTA-TR-2026/${company.id.replace(/\D/g, '').slice(0, 4) || '8941'}`,
      city: company.city || 'Bakı',
      address: company.address || '',
      website: company.website || '',
      workingHours: company.workingHours || 'B.e - Şənbə: 09:00 - 19:00',
      description: company.description || '',
      instagram: social.instagram || '',
      whatsapp: social.whatsapp || '',
      facebook: social.facebook || '',
      telegram: social.telegram || ''
    });
    setErrors({});
  }, [company]);

  // Validasiya yoxlanışı
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Şirkət adı ən azı 2 simvol olmalıdır';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Düzgün e-poçt ünvanı daxil edin (məs: info@agentlik.az)';
    }

    const phoneClean = formData.phone.replace(/[\s\-\(\)]/g, '');
    if (!phoneClean || phoneClean.length < 9) {
      newErrors.phone = 'Düzgün əlaqə nömrəsi daxil edin (məs: +994 50 123 45 67)';
    }

    if (formData.website.trim() && !/^https?:\/\/.+/i.test(formData.website.trim())) {
      newErrors.website = 'Vebsayt ünvanı http:// və ya https:// ilə başlamalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!validate()) {
      setNotification({
        type: 'error',
        text: 'Zəhmət olmasa tələb olunan sahələrdəki xətaları düzəldin.'
      });
      return;
    }

    const socialLinks: CompanySocialLinks = {
      instagram: formData.instagram.trim(),
      whatsapp: formData.whatsapp.trim(),
      facebook: formData.facebook.trim(),
      telegram: formData.telegram.trim(),
      hotline: formData.hotline.trim(),
      dtaRegistry: formData.dtaRegistry.trim()
    };

    try {
      await onSave({
        name: formData.name.trim(),
        legalName: formData.legalName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        phoneNumber: formData.phone.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        website: formData.website.trim(),
        workingHours: formData.workingHours.trim(),
        description: formData.description.trim(),
        socialLinks
      });

      setNotification({
        type: 'success',
        text: 'Əsas şirkət məlumatları və rəsmi qeydiyyat detalları uğurla yadda saxlanıldı!'
      });
      setTimeout(() => setNotification(null), 4000);
    } catch {
      setNotification({
        type: 'error',
        text: 'Məlumatları yeniləyərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.'
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
        {/* Section 1: Official Identity */}
        <div className="form-card-section">
          <div className="section-title-wrap">
            <div className="title-with-badge">
              <h3 className="section-title">Hüquqi və Brend İdentikliyi</h3>
              <span className="dta-verified-chip" title="Dövlət Turizm Agentliyinin reyestrində qeydiyyatdan keçmişdir">
                🛡️ DTA Lisenziyalı
              </span>
            </div>
            <p className="section-desc">Turizm portalında və müştəri biletlərində görünəcək rəsmi ad və vergi rekvizitləri</p>
          </div>

          <div className="form-row-2">
            <div className={`form-field-group ${errors.name ? 'has-error' : ''}`}>
              <label htmlFor="name">
                Agentliyin İctimai Adı <span className="req-star">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Məs: AzTour Travel"
              />
              {errors.name ? (
                <span className="field-error-text">{errors.name}</span>
              ) : (
                <span className="field-hint">Müştərilərin kataloqda və axtarışda gördüyü brend adı</span>
              )}
            </div>

            <div className="form-field-group">
              <label htmlFor="legalName">Rəsmi Hüquqi Adı</label>
              <input
                id="legalName"
                name="legalName"
                type="text"
                value={formData.legalName}
                onChange={handleChange}
                placeholder="Məs: AzTour Turizm və Səyahət MMC"
              />
              <span className="field-hint">Müqavilə və rəsmi invoyslarda istifadə edilən hüquqi forma</span>
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-field-group">
              <label htmlFor="voen">
                VÖEN (Vergi Nömrəsi) <span className="badge-locked">Kilidli</span>
              </label>
              <div className="input-locked-wrap">
                <input
                  id="voen"
                  name="voen"
                  type="text"
                  value={formData.voen}
                  disabled
                />
                <span className="locked-icon">🔒</span>
              </div>
              <span className="field-hint">Dövlət Vergi Xidməti tərəfindən təsdiqlənib</span>
            </div>

            <div className="form-field-group">
              <label htmlFor="dtaRegistry">DTA Turizm Reyestr Kodu</label>
              <div className="input-locked-wrap">
                <input
                  id="dtaRegistry"
                  name="dtaRegistry"
                  type="text"
                  value={formData.dtaRegistry}
                  onChange={handleChange}
                  placeholder="DTA-TR-2026/8941"
                />
                <span className="locked-icon" title="Reyestr qeydiyyatı">🏛️</span>
              </div>
              <span className="field-hint">Dövlət Turizm Agentliyinin rəsmi reyestr nömrəsi</span>
            </div>

            <div className={`form-field-group ${errors.website ? 'has-error' : ''}`}>
              <label htmlFor="website">Rəsmi Vebsayt</label>
              <input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://aztour.az"
              />
              {errors.website ? (
                <span className="field-error-text">{errors.website}</span>
              ) : (
                <span className="field-hint">Agentliyinizin rəsmi internet səhifəsi</span>
              )}
            </div>
          </div>

          <div className="form-field-group full-width">
            <label htmlFor="description">Agentlik Haqqında Təsvir (Bio)</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Şirkətinizin fəaliyyəti, təcrübəsi və xidmət fəlsəfəsi haqqında qısa təqdimat..."
            />
            <span className="field-hint">Müştərilər tur detay səhifəsində agentliyiniz haqqında bu mətni oxuyacaq</span>
          </div>
        </div>

        {/* Section 2: Contact & Location */}
        <div className="form-card-section">
          <div className="section-title-wrap">
            <h3 className="section-title">Əlaqə və Ofis Ünvanı</h3>
            <p className="section-desc">Müştərilərin və bələdçilərin sizinlə əlaqə saxlayacağı kanallar</p>
          </div>

          <div className="form-row-3">
            <div className={`form-field-group ${errors.email ? 'has-error' : ''}`}>
              <label htmlFor="email">
                Rəsmi E-poçt <span className="req-star">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="info@aztour.az"
              />
              {errors.email && <span className="field-error-text">{errors.email}</span>}
            </div>

            <div className={`form-field-group ${errors.phone ? 'has-error' : ''}`}>
              <label htmlFor="phone">
                Əsas Telefon <span className="req-star">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+994 50 123 45 67"
              />
              {errors.phone && <span className="field-error-text">{errors.phone}</span>}
            </div>

            <div className="form-field-group">
              <label htmlFor="hotline">24/7 Turist Qaynar Xətti</label>
              <input
                id="hotline"
                name="hotline"
                type="tel"
                value={formData.hotline}
                onChange={handleChange}
                placeholder="+994 12 599 00 00 və ya *8899"
              />
              <span className="field-hint">Turlar zamanı təcili əlaqə nömrəsi</span>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-field-group">
              <label htmlFor="city">Şəhər / Region</label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                placeholder="Bakı"
              />
            </div>

            <div className="form-field-group">
              <label htmlFor="workingHours">İş Rejimi & Qəbul Saatları</label>
              <input
                id="workingHours"
                name="workingHours"
                type="text"
                value={formData.workingHours}
                onChange={handleChange}
                placeholder="B.e - Şənbə: 09:00 - 19:00"
              />
            </div>
          </div>

          <div className="form-field-group full-width">
            <label htmlFor="address">Faktiki Ofis Ünvanı</label>
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              placeholder="Bakı şəhəri, Səbail rayonu, Nizami küçəsi 48, AF Business House"
            />
          </div>
        </div>

        {/* Section 3: Social Media */}
        <div className="form-card-section">
          <div className="section-title-wrap">
            <h3 className="section-title">Sosial Şəbəkələr və Əlaqə Kanalları</h3>
            <p className="section-desc">Müştəriləriniz üçün birbaşa sosial media keçidləri</p>
          </div>

          <div className="form-row-2">
            <div className="form-field-group">
              <label htmlFor="instagram">Instagram Profili</label>
              <div className="social-input-wrap">
                <span className="social-prefix">instagram.com/</span>
                <input
                  id="instagram"
                  name="instagram"
                  type="text"
                  value={formData.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\/?/, '')}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      instagram: e.target.value ? `https://instagram.com/${e.target.value.replace(/^@/, '')}` : ''
                    }))
                  }
                  placeholder="aztour_official"
                />
              </div>
            </div>

            <div className="form-field-group">
              <label htmlFor="whatsapp">WhatsApp Dəstək Nömrəsi</label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="text"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="+994501234567"
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-field-group">
              <label htmlFor="facebook">Facebook Səhifəsi</label>
              <input
                id="facebook"
                name="facebook"
                type="text"
                value={formData.facebook}
                onChange={handleChange}
                placeholder="https://facebook.com/aztour.az"
              />
            </div>

            <div className="form-field-group">
              <label htmlFor="telegram">Telegram Kanalı / Qrupu</label>
              <input
                id="telegram"
                name="telegram"
                type="text"
                value={formData.telegram}
                onChange={handleChange}
                placeholder="https://t.me/aztour_baku"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="form-actions-bar">
          <Button variant="primary" type="submit" isLoading={saving}>
            Yadda Saxla & Yenilə
          </Button>
        </div>
      </form>
    </div>
  );
};
