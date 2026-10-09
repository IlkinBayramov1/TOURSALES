import React, { useState } from 'react';
import { Copy, Check, Trash2, Ticket, Percent, Play, Pause, Share2, Sparkles, AlertCircle } from 'lucide-react';
import { CampaignPromo } from '@toursales/types';
import './PromoCodesTable.css';

interface PromoCodesTableProps {
  promos: CampaignPromo[];
  loading?: boolean;
  onDelete: (id: string) => Promise<void>;
  onToggleStatus?: (id: string) => Promise<void>;
}

export const PromoCodesTable: React.FC<PromoCodesTableProps> = ({
  promos,
  loading,
  onDelete,
  onToggleStatus
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [sharedCode, setSharedCode] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleShareTemplate = (promo: CampaignPromo) => {
    const discountText =
      promo.discountType === 'PERCENTAGE'
        ? `${promo.discountValue}% ENDİRİM`
        : `${promo.discountValue} AZN ENDİRİM`;

    const templateText = `🎉 TOURSALES ÖZƏL FÜRSƏT!
🔥 "${promo.promoCode}" promokodu ilə bütün turlarımızda ${discountText} əldə edin!
📅 Qüvvədə olma müddəti: ${new Date(promo.endDate).toLocaleDateString('az-AZ')}-dək
📲 Rezervasiya üçün: https://toursales.az`;

    navigator.clipboard.writeText(templateText);
    setSharedCode(promo.id);
    setTimeout(() => setSharedCode(null), 2500);
  };

  const handleToggle = async (id: string) => {
    if (!onToggleStatus) return;
    try {
      setTogglingId(id);
      await onToggleStatus(id);
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="promos-table-container">
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
          Promokodlar yüklənir...
        </div>
      </div>
    );
  }

  if (!promos || promos.length === 0) {
    return (
      <div className="promos-table-container">
        <div className="ad-empty-state">
          <div className="ad-empty-icon">
            <Ticket size={28} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Aktiv promokod tapılmadı
          </h3>
          <p style={{ fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto' }}>
            Müştərilərinizə xüsusi endirim təklif etmək və rezervasiyaları sürətləndirmək üçün yeni promokod yaradın.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="promos-table-container">
      <table className="ads-table">
        <thead>
          <tr>
            <th>Promokod</th>
            <th>Endirim Məbləği</th>
            <th>Təsvir</th>
            <th>İstifadə Göstəricisi</th>
            <th>Qüvvədə Olma Müddəti</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Əməliyyatlar</th>
          </tr>
        </thead>
        <tbody>
          {promos.map((promo) => {
            const limit = promo.usageLimit || 0;
            const used = promo.usedCount || 0;
            const percentageUsed = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
            const isCopied = copiedCode === promo.promoCode;
            const isShared = sharedCode === promo.id;

            const isExpired = new Date(promo.endDate) < new Date() || promo.status === 'Expired';
            const isPaused = promo.status === 'Paused';
            const isToggling = togglingId === promo.id;

            return (
              <tr key={promo.id}>
                {/* Code with Copy */}
                <td>
                  <button
                    type="button"
                    className={`promo-code-pill ${isCopied ? 'copied' : ''}`}
                    onClick={() => handleCopy(promo.promoCode)}
                    title="Kodu kopyalamaq üçün klikləyin"
                  >
                    <span>{promo.promoCode}</span>
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </td>

                {/* Discount */}
                <td>
                  <span className={`promo-discount-badge ${promo.discountType === 'PERCENTAGE' ? 'percentage' : 'fixed'}`}>
                    {promo.discountType === 'PERCENTAGE' ? (
                      <>
                        <Percent size={13} style={{ marginRight: 4 }} />
                        {promo.discountValue}% Endirim
                      </>
                    ) : (
                      <>{promo.discountValue} AZN Nağd</>
                    )}
                  </span>
                </td>

                {/* Description */}
                <td>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', maxWidth: '260px' }}>
                    {promo.description || 'Xüsusi kampaniya endirimi'}
                  </div>
                </td>

                {/* Usage progress */}
                <td>
                  <div className="promo-progress-wrap">
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{used} istifadə</span>
                      <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        {limit > 0 ? `/ ${limit}` : '(limitsiz)'}
                      </span>
                    </div>
                    {limit > 0 && (
                      <div className="promo-progress-bar">
                        <div
                          className="promo-progress-fill"
                          style={{
                            width: `${percentageUsed}%`,
                            background: percentageUsed >= 90 ? '#ef4444' : percentageUsed >= 70 ? '#f59e0b' : '#2563eb'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </td>

                {/* Dates */}
                <td>
                  <div style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                    {new Date(promo.startDate).toLocaleDateString('az-AZ')} - {new Date(promo.endDate).toLocaleDateString('az-AZ')}
                  </div>
                </td>

                {/* Status */}
                <td>
                  {isExpired ? (
                    <span className="ad-status-badge expired">
                      <span className="ad-status-dot" />
                      Müddəti bitib
                    </span>
                  ) : isPaused ? (
                    <span className="ad-status-badge paused">
                      <span className="ad-status-dot" />
                      Dayandırılıb
                    </span>
                  ) : (
                    <span className="ad-status-badge active">
                      <span className="ad-status-dot" />
                      Aktiv
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td>
                  <div className="ad-actions-cell" style={{ justifyContent: 'flex-end', gap: '0.375rem' }}>
                    {/* Share on Social / WhatsApp */}
                    <button
                      type="button"
                      className={`ad-action-btn share-btn ${isShared ? 'shared' : ''}`}
                      title="WhatsApp & Sosial Media üçün Paylaşım Mətnini Kopyala"
                      onClick={() => handleShareTemplate(promo)}
                    >
                      {isShared ? <Check size={14} color="#059669" /> : <Share2 size={14} />}
                    </button>

                    {/* 1-Click Status Toggle */}
                    {onToggleStatus && !isExpired && (
                      <button
                        type="button"
                        className="ad-action-btn"
                        title={isPaused ? 'Promokodu Yenidən Aktivləşdir' : 'Promokodu Dayandır (Pauza)'}
                        disabled={isToggling}
                        onClick={() => handleToggle(promo.id)}
                      >
                        {isPaused ? <Play size={14} /> : <Pause size={14} />}
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      className="ad-action-btn delete"
                      title="Promokodu Sil"
                      onClick={() => {
                        if (window.confirm(`"${promo.promoCode}" promokodunu silmək istədiyinizdən əminsiniz?`)) {
                          onDelete(promo.id);
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
