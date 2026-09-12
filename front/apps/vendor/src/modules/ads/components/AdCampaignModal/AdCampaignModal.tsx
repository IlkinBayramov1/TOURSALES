import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { vendorAdsApi } from '../../vendorAdsApi';
import './AdCampaignModal.css';

interface AdCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdCampaignModal: React.FC<AdCampaignModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [position, setPosition] = useState<'HERO' | 'SIDEBAR' | 'POPUP'>('HERO');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      setError('Zəhmət olmasa tələb olunan sahələri doldurun');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await vendorAdsApi.purchaseAd({
        title,
        imageUrl,
        linkUrl,
        position,
        packageId: 'ADP-7D'
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Kampaniya yaradılarkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ad-modal-overlay" onClick={onClose}>
      <div className="ad-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ad-modal-header">
          <h3>Yeni Reklam Kampaniyası Yarat</h3>
          <button type="button" className="ad-close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="ad-form-group">
            <label>Kampaniya Başlığı</label>
            <input
              type="text"
              placeholder="Məsələn: Payız Fürsətləri Şamaxı Turu"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="ad-form-group">
            <label>Banner Şəkil URL-i</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
            />
          </div>

          {imageUrl && (
            <div className="ad-preview-box">
              <img src={imageUrl} alt="Banner Preview" />
            </div>
          )}

          <div className="ad-form-group" style={{ marginTop: '1rem' }}>
            <label>Keçid Linki (Target URL)</label>
            <input
              type="text"
              placeholder="/tours/samaxi-autumn"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>

          <div className="ad-form-group">
            <label>Yerləşmə Mövqeyi</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as any)}
            >
              <option value="HERO">Ana Səhifə Hero Banner (Geniş vitrin)</option>
              <option value="SIDEBAR">Tur Detalı və Yan Panel (Hədəfli baxış)</option>
              <option value="POPUP">Xüsusi Təklif Açılan Pəncərə (Popup)</option>
            </select>
          </div>

          <div className="ad-date-row">
            <div className="ad-form-group">
              <label>Başlama Tarixi</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="ad-form-group">
              <label>Bitmə Tarixi</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="ad-modal-actions">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Ləğv et
            </Button>
            <Button variant="primary" type="submit" isLoading={loading}>
              Kampaniyanı Başlat
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
