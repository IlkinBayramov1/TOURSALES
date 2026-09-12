import React, { useState } from 'react';
import { Copy, Check, Trash2, Ticket, Percent } from 'lucide-react';
import { CampaignPromo } from '@toursales/types';
import './PromoCodesTable.css';

interface PromoCodesTableProps {
  promos: CampaignPromo[];
  loading?: boolean;
  onDelete: (id: string) => Promise<void>;
}

export const PromoCodesTable: React.FC<PromoCodesTableProps> = ({
  promos,
  loading,
  onDelete
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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
            const percentageUsed = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;
            const isCopied = copiedCode === promo.promoCode;

            const isExpired = new Date(promo.endDate) < new Date() || promo.status === 'Expired';

            return (
              <tr key={promo.id}>
                {/* Code with Copy */}
                <td>
                  <button
                    type="button"
                    className={`promo-code-pill ${isCopied ? 'copied' : ''}`}
                    onClick={() => handleCopy(promo.promoCode)}
                    title="Kopyalamaq üçün klikləyin"
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
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', maxWidth: '280px' }}>
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
                            background: percentageUsed >= 90 ? '#ef4444' : '#2563eb'
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
                  ) : (
                    <span className="ad-status-badge active">
                      <span className="ad-status-dot" />
                      Aktiv
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td>
                  <div className="ad-actions-cell" style={{ justifyContent: 'flex-end' }}>
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
