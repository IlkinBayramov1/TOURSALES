import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import {
  Eye,
  MousePointer,
  Zap,
  TrendingUp,
  Calendar,
  Layers,
  ExternalLink,
  DollarSign,
  Play,
  Pause,
  Trash2,
  Sparkles,
  BarChart3,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Ad } from '@toursales/types';
import './AdDetailModal.css';

interface AdDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: Ad | null;
  onToggleStatus: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const AdDetailModal: React.FC<AdDetailModalProps> = ({
  isOpen,
  onClose,
  ad,
  onToggleStatus,
  onDelete
}) => {
  const [actionLoading, setActionLoading] = useState(false);

  if (!isOpen || !ad) return null;

  const views = ad.viewCount || 0;
  const clicks = ad.clicksCount || 0;
  const bookings = ad.bookingCount || 0;
  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(2) : '0.00';
  const convRate = clicks > 0 ? ((bookings / clicks) * 100).toFixed(1) : '0.0';
  const amountPaid = Number(ad.amountPaid || 0);

  // Estimate revenue based on tour price or average 80 AZN
  const tourPrice = Number(ad.tour ? (ad.tour as any).basePrice || (ad.tour as any).price || 80 : 80);
  const estimatedRevenue = bookings * tourPrice;
  const netProfit = estimatedRevenue - amountPaid;
  const roi = amountPaid > 0 ? Math.round((netProfit / amountPaid) * 100) : 0;

  // Date calculations
  const startDate = new Date(ad.startDate);
  const endDate = new Date(ad.endDate);
  const now = new Date();
  const totalDurationMs = Math.max(1, endDate.getTime() - startDate.getTime());
  const elapsedMs = Math.max(0, Math.min(totalDurationMs, now.getTime() - startDate.getTime()));
  const progressPercent = Math.min(100, Math.round((elapsedMs / totalDurationMs) * 100));
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isExpired = ad.status === 'Expired' || endDate < now;

  let img = ad.imageUrl;
  if (!img && ad.tour?.images) {
    if (Array.isArray(ad.tour.images)) {
      img = ad.tour.images[0];
    } else if (typeof ad.tour.images === 'string') {
      try {
        const parsed = JSON.parse(ad.tour.images);
        img = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch {
        img = ad.tour.images;
      }
    }
  }
  const displayImage = img || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800';

  const handleToggle = async () => {
    try {
      setActionLoading(true);
      await onToggleStatus(ad.id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`"${ad.title}" reklamını silmək istədiyinizdən əminsiniz?`)) {
      try {
        setActionLoading(true);
        await onDelete(ad.id);
        onClose();
      } finally {
        setActionLoading(false);
      }
    }
  };

  const getPositionName = (pos: string) => {
    switch (pos) {
      case 'HERO':
        return 'Ana Səhifə Hero Banner';
      case 'VIP_LIST':
        return 'VIP Kataloq 1-ci Sıra';
      case 'SIDEBAR':
        return 'Yan Panel & Oxşar Turlar';
      case 'POPUP':
        return 'Xüsusi Təklif Pəncərəsi (Popup)';
      default:
        return pos;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-dialog-detail" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="detail-modal-header-left">
            <div className="detail-header-tag">
              <BarChart3 size={15} /> Reklam Analitikası & Performans
            </div>
            <h3>{ad.title || 'Ads Kampaniyası Detalları'}</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body detail-modal-body">
          {/* Status & Timeline Card */}
          <div className="detail-timeline-card">
            <div className="detail-timeline-top">
              <div className="detail-status-group">
                <span className={`ad-status-badge ${ad.status.toLowerCase()}`}>
                  <span className="ad-status-dot" />
                  {ad.status === 'Active' ? 'Aktiv Yayımda' : ad.status === 'Paused' ? 'Dayandırılıb' : 'Müddəti Bitib'}
                </span>
                <span className="detail-pos-badge">
                  <Layers size={13} /> {getPositionName(ad.position)}
                </span>
              </div>
              <div className="detail-days-remaining">
                <Clock size={15} />
                {isExpired ? (
                  <span className="expired-text">Kampaniya başa çatıb</span>
                ) : (
                  <span>Qalan müddət: <strong>{daysLeft} gün</strong></span>
                )}
              </div>
            </div>

            {/* Timeline Progress Bar */}
            <div className="timeline-progress-wrap">
              <div className="timeline-progress-bar">
                <div
                  className="timeline-progress-fill"
                  style={{
                    width: `${progressPercent}%`,
                    background: isExpired ? '#94a3b8' : progressPercent > 80 ? '#f59e0b' : '#2563eb'
                  }}
                />
              </div>
              <div className="timeline-dates">
                <span>Başlayıb: {startDate.toLocaleDateString('az-AZ')}</span>
                <span>{progressPercent}% tamamlandı</span>
                <span>Bitir: {endDate.toLocaleDateString('az-AZ')}</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics KPI Grid */}
          <div className="detail-kpi-grid">
            <div className="detail-kpi-card">
              <div className="kpi-icon-wrap views-icon">
                <Eye size={18} />
              </div>
              <div className="kpi-data">
                <span className="kpi-title">Baxış (Impressions)</span>
                <h4 className="kpi-val">{views.toLocaleString('az-AZ')}</h4>
                <span className="kpi-sub">Səhifə yüklənməsi</span>
              </div>
            </div>

            <div className="detail-kpi-card">
              <div className="kpi-icon-wrap clicks-icon">
                <MousePointer size={18} />
              </div>
              <div className="kpi-data">
                <span className="kpi-title">Klik Sayı</span>
                <h4 className="kpi-val">{clicks.toLocaleString('az-AZ')}</h4>
                <span className="kpi-sub highlight-green">CTR: {ctr}%</span>
              </div>
            </div>

            <div className="detail-kpi-card">
              <div className="kpi-icon-wrap bookings-icon">
                <Zap size={18} />
              </div>
              <div className="kpi-data">
                <span className="kpi-title">Rezervasiyalar</span>
                <h4 className="kpi-val">{bookings} sifariş</h4>
                <span className="kpi-sub highlight-purple">Konversiya: {convRate}%</span>
              </div>
            </div>

            <div className="detail-kpi-card">
              <div className="kpi-icon-wrap roi-icon">
                <TrendingUp size={18} />
              </div>
              <div className="kpi-data">
                <span className="kpi-title">Təxmini Gəlir & ROI</span>
                <h4 className="kpi-val">+{estimatedRevenue.toFixed(0)} AZN</h4>
                <span className="kpi-sub highlight-rose">ROI: ~{roi}% ({amountPaid} AZN xərc)</span>
              </div>
            </div>
          </div>

          {/* Live Mockup Visual Card */}
          <div className="detail-visual-section">
            <h4 className="detail-section-title">
              <Sparkles size={16} /> Canlı Banner Önizləməsi & Keçid Linki
            </h4>
            <div className="detail-visual-card">
              <div
                className="detail-banner-preview"
                style={{ backgroundImage: `url(${displayImage})` }}
              >
                <div className="detail-banner-overlay">
                  <span className="detail-banner-badge">VIP SPONSORLU TƏKLİF</span>
                  <h5>{ad.title}</h5>
                  <div className="detail-banner-bottom">
                    <span className="detail-banner-price">Qiymət: {tourPrice} AZN</span>
                    {ad.linkUrl && (
                      <a
                        href={ad.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="detail-banner-link-btn"
                      >
                        Səhifəyə Get <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {ad.tour && (
                <div className="detail-linked-tour">
                  <CheckCircle2 size={16} color="#059669" />
                  <div>
                    <span>Bağlantılı Tur:</span> <strong>{ad.tour.title}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions detail-modal-actions">
          <div className="actions-left">
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={actionLoading}
              className="delete-action-btn"
            >
              <Trash2 size={16} style={{ marginRight: 6 }} /> Reklamı Sil
            </Button>
          </div>

          <div className="actions-right">
            {!isExpired && (
              <Button
                variant={ad.status === 'Active' ? 'secondary' : 'primary'}
                onClick={handleToggle}
                isLoading={actionLoading}
                disabled={actionLoading}
              >
                {ad.status === 'Active' ? (
                  <>
                    <Pause size={16} style={{ marginRight: 6 }} /> Reklamı Dayandır (Pauza)
                  </>
                ) : (
                  <>
                    <Play size={16} style={{ marginRight: 6 }} /> Yenidən Aktivləşdir
                  </>
                )}
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              Bağla
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
