import React, { useState } from 'react';
import { Company, CompanySocialLinks } from '@toursales/types';
import './CompanyPublicPreviewModal.css';

interface CompanyPublicPreviewModalProps {
  company: Company;
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyPublicPreviewModal: React.FC<CompanyPublicPreviewModalProps> = ({
  company,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

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

  const defaultCover =
    company.coverUrl ||
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80';
  const defaultLogo =
    company.logoUrl ||
    'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80';

  const handleCopyLink = () => {
    const url = `${window.location.origin}/agencies/${company.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Nümunəvi tur kartları (müştəri vitrini üçün)
  const sampleTours = [
    {
      id: 'tour-sample-1',
      title: 'Quba - Qusar - Şahdağ Dağ İstirahəti',
      price: 45,
      duration: '1 gün',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'tour-sample-2',
      title: 'Qəbələ - Şəki Xan Sarayı Mədəni Turu',
      price: 85,
      duration: '2 gün / 1 gecə',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'tour-sample-3',
      title: 'Lənkəran - Lerik Təbiət və Çay Turu',
      price: 55,
      duration: '1 gün',
      image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format&fit=crop&q=80'
    }
  ];

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Bar */}
        <div className="preview-modal-topbar">
          <div className="preview-badge-group">
            <span className="live-preview-tag">👁️ Müştəri Gözü ilə Canlı Baxış</span>
            <span className="preview-mode-tag">İctimai Profil Vitrini</span>
          </div>
          <div className="preview-actions-group">
            <button
              type="button"
              className="copy-public-link-btn"
              onClick={handleCopyLink}
              title="Müştərilərlə paylaşmaq üçün ictimai linki kopyala"
            >
              {copied ? '✓ Link Kopyalandı' : '🔗 Linki Kopyala'}
            </button>
            <button
              type="button"
              className="preview-close-btn"
              onClick={onClose}
              aria-label="Bağla"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="preview-modal-scroll">
          {/* Public Agency Hero Header */}
          <div
            className="public-preview-hero"
            style={{ backgroundImage: `url(${defaultCover})` }}
          >
            <div className="public-hero-overlay" />
            <div className="public-hero-content">
              <img src={defaultLogo} alt={company.name} className="public-agency-logo" />
              <div className="public-agency-info">
                <div className="public-agency-title-row">
                  <h2 className="public-agency-name">{company.name}</h2>
                  <span className="public-verified-pill">
                    ✓ Lisenziyalı Turoperator
                  </span>
                </div>
                <p className="public-agency-legal">{company.legalName || 'Rəsmi Turizm və Səyahət Agentliyi'}</p>
                <div className="public-meta-chips">
                  <span className="meta-chip">★ {company.rating ? Number(company.rating).toFixed(1) : '4.9'} (140+ Rəy)</span>
                  <span className="meta-chip">📍 {company.city || 'Bakı, Azərbaycan'}</span>
                  {social.dtaRegistry && <span className="meta-chip">🏛️ {social.dtaRegistry}</span>}
                  <span className="meta-chip">📋 VÖEN: {company.voen}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid: Info + Contact + Tours */}
          <div className="public-preview-grid">
            {/* Left Column: Bio & Active Tours */}
            <div className="public-left-col">
              <div className="public-card">
                <h3 className="public-card-title">Agentlik Haqqında</h3>
                <p className="public-bio-text">
                  {company.description ||
                    'Azərbaycanın dilbər guşələrinə yüksək komfortlu və peşəkar turlar təşkil edən aparıcı turizm şirkəti. Müştərilərimizə unudulmaz təcrübə, təhlükəsiz nəqliyyat və sertifikatlı bələdçi xidməti təqdim edirik.'}
                </p>
              </div>

              <div className="public-card">
                <div className="card-header-between">
                  <h3 className="public-card-title">Aktiv Satışda Olan Turlar</h3>
                  <span className="tour-count-badge">3 Populyar Tur</span>
                </div>

                <div className="preview-tours-list">
                  {sampleTours.map((t) => (
                    <div key={t.id} className="preview-tour-item">
                      <img src={t.image} alt={t.title} className="preview-tour-thumb" />
                      <div className="preview-tour-details">
                        <h4 className="preview-tour-name">{t.title}</h4>
                        <div className="preview-tour-meta">
                          <span>⏱️ {t.duration}</span>
                          <span>•</span>
                          <span className="preview-tour-price">{t.price} ₼ / nəfər</span>
                        </div>
                      </div>
                      <button type="button" className="preview-book-mock-btn" disabled>
                        Bilet Al
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Contact, Working Hours & Socials */}
            <div className="public-right-col">
              <div className="public-card">
                <h3 className="public-card-title">Əlaqə & Qəbul Saatları</h3>
                
                <div className="contact-list">
                  <div className="contact-entry">
                    <span className="entry-icon">📞</span>
                    <div>
                      <span className="entry-label">Əsas Telefon</span>
                      <strong className="entry-val">{company.phone || company.phoneNumber || '+994 50 123 45 67'}</strong>
                    </div>
                  </div>

                  {social.hotline && (
                    <div className="contact-entry">
                      <span className="entry-icon">🚨</span>
                      <div>
                        <span className="entry-label">24/7 Qaynar Xətt</span>
                        <strong className="entry-val hotline-highlight">{social.hotline}</strong>
                      </div>
                    </div>
                  )}

                  <div className="contact-entry">
                    <span className="entry-icon">✉️</span>
                    <div>
                      <span className="entry-label">Rəsmi E-poçt</span>
                      <span className="entry-val">{company.email || 'info@aztour.az'}</span>
                    </div>
                  </div>

                  <div className="contact-entry">
                    <span className="entry-icon">🏢</span>
                    <div>
                      <span className="entry-label">Ofis Ünvanı</span>
                      <span className="entry-val">{company.address || 'Nizami küçəsi 48, Bakı'}</span>
                    </div>
                  </div>

                  <div className="contact-entry">
                    <span className="entry-icon">🕒</span>
                    <div>
                      <span className="entry-label">İş Rejimi</span>
                      <span className="entry-val">{company.workingHours || '09:00 - 19:00 (B.e - Şənbə)'}</span>
                    </div>
                  </div>

                  {company.website && (
                    <div className="contact-entry">
                      <span className="entry-icon">🌐</span>
                      <div>
                        <span className="entry-label">Vebsayt</span>
                        <a href={company.website} target="_blank" rel="noreferrer" className="entry-link">
                          {company.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Social Networks Row */}
                <div className="public-socials-section">
                  <span className="socials-label">Sosial Şəbəkələr:</span>
                  <div className="socials-btns-row">
                    {social.instagram && (
                      <a href={social.instagram} target="_blank" rel="noreferrer" className="social-pill-btn ig">
                        📸 Instagram
                      </a>
                    )}
                    {social.whatsapp && (
                      <a href={`https://wa.me/${social.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="social-pill-btn wa">
                        💬 WhatsApp
                      </a>
                    )}
                    {social.facebook && (
                      <a href={social.facebook} target="_blank" rel="noreferrer" className="social-pill-btn fb">
                        📘 Facebook
                      </a>
                    )}
                    {social.telegram && (
                      <a href={social.telegram} target="_blank" rel="noreferrer" className="social-pill-btn tg">
                        ✈️ Telegram
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CompanyPublicPreviewModal;
