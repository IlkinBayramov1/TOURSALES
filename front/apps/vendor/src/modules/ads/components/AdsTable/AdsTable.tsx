import React from 'react';
import { Play, Pause, Trash2, Megaphone, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Ad } from '@toursales/types';
import './AdsTable.css';

interface AdsTableProps {
  ads: Ad[];
  loading?: boolean;
  onToggleStatus: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const AdsTable: React.FC<AdsTableProps> = ({
  ads,
  loading,
  onToggleStatus,
  onDelete
}) => {
  if (loading) {
    return (
      <div className="ads-table-container">
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
          Reklam məlumatları yüklənir...
        </div>
      </div>
    );
  }

  if (!ads || ads.length === 0) {
    return (
      <div className="ads-table-container">
        <div className="ad-empty-state">
          <div className="ad-empty-icon">
            <Megaphone size={28} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Aktiv reklam tapılmadı
          </h3>
          <p style={{ fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto' }}>
            Turlarınızı platformanın ən görkəmli yerlərində önə çıxarmaq və satışlarınızı artırmaq üçün yeni reklam kampaniyası başladın.
          </p>
        </div>
      </div>
    );
  }

  const getPositionLabel = (pos: string) => {
    switch (pos) {
      case 'HERO':
        return { label: 'Ana Səhifə Hero', cls: 'hero' };
      case 'SIDEBAR':
        return { label: 'Yan Panel', cls: 'sidebar' };
      case 'VIP_LIST':
        return { label: 'VIP Vitrin', cls: 'viplist' };
      case 'POPUP':
        return { label: 'Xüsusi Popup', cls: 'popup' };
      default:
        return { label: pos, cls: 'hero' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="ad-status-badge active"><span className="ad-status-dot" />Aktiv</span>;
      case 'Paused':
        return <span className="ad-status-badge paused"><span className="ad-status-dot" />Dayandırılıb</span>;
      case 'Expired':
        return <span className="ad-status-badge expired"><span className="ad-status-dot" />Müddəti bitib</span>;
      default:
        return <span className="ad-status-badge expired">{status}</span>;
    }
  };

  return (
    <div className="ads-table-container">
      <table className="ads-table">
        <thead>
          <tr>
            <th>Banner & Reklam</th>
            <th>Mövqe</th>
            <th>Status</th>
            <th>Paket</th>
            <th>Göstərilmə</th>
            <th>Klik & CTR</th>
            <th>Sifarişlər</th>
            <th>Müddət</th>
            <th style={{ textAlign: 'right' }}>Əməliyyatlar</th>
          </tr>
        </thead>
        <tbody>
          {ads.map((ad) => {
            const imps = ad.viewCount || 0;
            const clicks = ad.clicksCount || 0;
            const ctr = imps > 0 ? ((clicks / imps) * 100).toFixed(2) : '0.00';
            const pos = getPositionLabel(ad.position);

            // Extract image
            let img = ad.imageUrl;
            if (!img && ad.tour?.images) {
              try {
                const parsed = JSON.parse(ad.tour.images);
                img = parsed[0];
              } catch {
                img = undefined;
              }
            }

            return (
              <tr key={ad.id}>
                {/* Media & Title */}
                <td>
                  <div className="ad-media-cell">
                    {img ? (
                      <img src={img} alt={ad.title} className="ad-thumb ad-media-thumb" />
                    ) : (
                      <div className="ad-media-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageIcon size={20} color="#9ca3af" />
                      </div>
                    )}
                    <div className="ad-media-info">
                      <span className="ad-media-title" title={ad.title}>
                        {ad.title}
                      </span>
                      {ad.linkUrl && (
                        <span className="ad-media-sub">
                          <ExternalLink size={12} />
                          {ad.linkUrl}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Position */}
                <td>
                  <span className={`ad-position-badge ${pos.cls}`}>
                    {pos.label}
                  </span>
                </td>

                {/* Status */}
                <td>
                  {getStatusBadge(ad.status)}
                </td>

                {/* Package */}
                <td>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    {ad.package?.name || `${ad.package?.durationDays || 0} Günlük`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {Number(ad.amountPaid || 0).toFixed(0)} AZN
                  </div>
                </td>

                {/* Impressions */}
                <td>
                  <span style={{ fontWeight: 600 }}>{imps.toLocaleString('az-AZ')}</span>
                </td>

                {/* Clicks & CTR */}
                <td>
                  <div style={{ fontWeight: 600 }}>{clicks.toLocaleString('az-AZ')} klik</div>
                  <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                    CTR {ctr}%
                  </div>
                </td>

                {/* Bookings */}
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                    {ad.bookingCount || 0} sifariş
                  </span>
                </td>

                {/* Date range */}
                <td>
                  <div style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                    {new Date(ad.startDate).toLocaleDateString('az-AZ')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                    Bitir: {new Date(ad.endDate).toLocaleDateString('az-AZ')}
                  </div>
                </td>

                {/* Actions */}
                <td>
                  <div className="ad-actions-cell" style={{ justifyContent: 'flex-end' }}>
                    {ad.status !== 'Expired' && (
                      <button
                        type="button"
                        className="ad-action-btn"
                        title={ad.status === 'Active' ? 'Reklamı Dayandır' : 'Reklamı Aktivləşdir'}
                        onClick={() => onToggleStatus(ad.id)}
                      >
                        {ad.status === 'Active' ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                    )}
                    <button
                      type="button"
                      className="ad-action-btn delete"
                      title="Reklamı Sil"
                      onClick={() => {
                        if (window.confirm('Bu reklamı silmək istədiyinizdən əminsiniz?')) {
                          onDelete(ad.id);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
