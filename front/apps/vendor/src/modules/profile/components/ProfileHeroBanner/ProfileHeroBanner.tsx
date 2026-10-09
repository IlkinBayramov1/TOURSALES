import React, { useRef, useState, useEffect } from 'react';
import { Company, CompanyProfileStats } from '@toursales/types';
import './ProfileHeroBanner.css';

interface ProfileHeroBannerProps {
  company: Company;
  stats?: CompanyProfileStats | null;
  onLogoUpload: (file: File) => Promise<void>;
  onCoverUpload: (file: File) => Promise<void>;
  uploadingLogo: boolean;
  uploadingCover: boolean;
}

export const ProfileHeroBanner: React.FC<ProfileHeroBannerProps> = ({
  company,
  stats,
  onLogoUpload,
  onCoverUpload,
  uploadingLogo,
  uploadingCover
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [previewCover, setPreviewCover] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    setPreviewLogo(null);
  }, [company.logoUrl]);

  useEffect(() => {
    setPreviewCover(null);
  }, [company.coverUrl]);

  const defaultCover =
    previewCover ||
    company.coverUrl ||
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80';
  const defaultLogo =
    previewLogo ||
    company.logoUrl ||
    'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80';

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return 'Yalnız JPG, PNG və WEBP formatında şəkillər dəstəklənir.';
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'Şəkil həcmi çox böyükdür (Maksimum 5 MB yüklənə bilər).';
    }
    return null;
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        setTimeout(() => setUploadError(null), 5000);
        return;
      }
      const localUrl = URL.createObjectURL(file);
      setPreviewLogo(localUrl);
      try {
        await onLogoUpload(file);
      } catch {
        setPreviewLogo(null);
        setUploadError('Loqo yüklənərkən xəta baş verdi. Yenidən cəhd edin.');
        setTimeout(() => setUploadError(null), 5000);
      }
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        setTimeout(() => setUploadError(null), 5000);
        return;
      }
      const localUrl = URL.createObjectURL(file);
      setPreviewCover(localUrl);
      try {
        await onCoverUpload(file);
      } catch {
        setPreviewCover(null);
        setUploadError('Örtük şəkli yüklənərkən xəta baş verdi. Yenidən cəhd edin.');
        setTimeout(() => setUploadError(null), 5000);
      }
    }
  };

  const memberDate = company.createdAt
    ? new Date(company.createdAt).toLocaleDateString('az-AZ', {
        year: 'numeric',
        month: 'long'
      })
    : 'Sentyabr 2026';

  return (
    <div className="profile-hero-card">
      {/* Upload Error Banner */}
      {uploadError && (
        <div className="banner-upload-error-pill">
          <span>⚠️ {uploadError}</span>
          <button type="button" onClick={() => setUploadError(null)}>✕</button>
        </div>
      )}

      {/* Cover Image */}
      <div
        className="profile-hero-cover"
        style={{ backgroundImage: `url(${defaultCover})` }}
      >
        <div className="profile-hero-cover-overlay" />
        <input
          type="file"
          ref={coverInputRef}
          style={{ display: 'none' }}
          accept="image/jpeg,image/png,image/webp"
          onChange={handleCoverChange}
        />
        <button
          type="button"
          className="cover-upload-btn"
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
        >
          {uploadingCover ? (
            'Yüklənir...'
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>Örtüyü Dəyiş</span>
            </>
          )}
        </button>
      </div>

      {/* Main Info Row */}
      <div className="profile-hero-body">
        <div className="profile-avatar-wrapper">
          <img
            src={defaultLogo}
            alt={company.name}
            className={`profile-avatar-img ${uploadingLogo ? 'is-uploading' : ''}`}
          />
          <input
            type="file"
            ref={logoInputRef}
            style={{ display: 'none' }}
            accept="image/jpeg,image/png,image/webp"
            onChange={handleLogoChange}
          />
          <button
            type="button"
            className="avatar-upload-badge"
            title="Loqonu yenilə (JPG, PNG, WEBP max 5MB)"
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo}
          >
            {uploadingLogo ? (
              <span className="mini-spinner" />
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            )}
          </button>
        </div>

        <div className="profile-title-col">
          <div className="profile-title-header">
            <h1 className="profile-company-name">{company.name}</h1>
            <span className="profile-verified-badge" title="Rəsmi qeydiyyatdan keçmiş lisenziyalı turizm tərəfdaşı">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span>Rəsmi Tərəfdaş</span>
            </span>
          </div>
          <div className="profile-company-sub">
            <span>{company.legalName || 'Turizm və Ekskursiya Xidmətləri'}</span>
            <span className="sub-divider">•</span>
            <span>Üzvlük: {memberDate}</span>
          </div>
        </div>
      </div>

      {/* 4 Mini Stat Pills */}
      <div className="profile-stats-grid">
        <div className="profile-stat-pill">
          <div className="stat-pill-icon star-icon">★</div>
          <div className="stat-pill-content">
            <span className="stat-pill-val">{company.rating ? `${Number(company.rating).toFixed(1)}` : '4.9'} / 5.0</span>
            <span className="stat-pill-lbl">Müştəri Reytinqi</span>
          </div>
        </div>

        <div className="profile-stat-pill">
          <div className="stat-pill-icon plan-icon">👑</div>
          <div className="stat-pill-content">
            <span className="stat-pill-val">{company.plan?.name || stats?.planName || 'Peşəkar (Pro)'}</span>
            <span className="stat-pill-lbl">Aktiv Abunəlik</span>
          </div>
        </div>

        <div className="profile-stat-pill">
          <div className="stat-pill-icon voen-icon">📋</div>
          <div className="stat-pill-content">
            <span className="stat-pill-val">{company.voen || '1702948591'}</span>
            <span className="stat-pill-lbl">Rəsmi VÖEN</span>
          </div>
        </div>

        <div className="profile-stat-pill">
          <div className="stat-pill-icon tour-icon">🏕️</div>
          <div className="stat-pill-content">
            <span className="stat-pill-val">{stats?.activeTours !== undefined ? stats.activeTours : 5} Tur</span>
            <span className="stat-pill-lbl">Canlı Satışda</span>
          </div>
        </div>
      </div>
    </div>
  );
};
