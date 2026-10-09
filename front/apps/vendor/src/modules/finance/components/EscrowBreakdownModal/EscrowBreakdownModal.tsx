import React, { useEffect, useState } from 'react';
import { Button, Spinner, Badge } from '@toursales/ui';
import { 
  Clock, 
  ShieldCheck, 
  Calendar, 
  User, 
  Compass, 
  Info, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { EscrowTourItem, vendorFinanceApi } from '../../vendorFinanceApi';
import './EscrowBreakdownModal.css';

interface EscrowBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingBalance: number;
  currency: string;
}

export const EscrowBreakdownModal: React.FC<EscrowBreakdownModalProps> = ({
  isOpen,
  onClose,
  pendingBalance,
  currency,
}) => {
  const [items, setItems] = useState<EscrowTourItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchEscrow = async () => {
        try {
          setLoading(true);
          const data = await vendorFinanceApi.getEscrowDetails();
          setItems(data);
        } catch (err) {
          console.error('Escrow detalları yüklənmədi:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchEscrow();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="escrow-modal-overlay" onClick={onClose}>
      <div className="escrow-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="escrow-modal-header">
          <div className="escrow-title-group">
            <div className="escrow-icon-wrap">
              <Clock size={22} />
            </div>
            <div>
              <h3>Gözləmədəki Balans (Escrow) İzahı</h3>
              <p>Aktiv və gələcək turların müştəri ödənişləri və buraxılış cədvəli</p>
            </div>
          </div>
          <button type="button" className="escrow-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Hero Card */}
        <div className="escrow-hero-card">
          <div className="escrow-hero-left">
            <span className="escrow-hero-lbl">Cəmi Bloklanmış Escrow Vəsaiti</span>
            <div className="escrow-hero-val">{pendingBalance.toFixed(2)} {currency}</div>
          </div>
          <div className="escrow-hero-right">
            <span className="escrow-hero-tag">
              <ShieldCheck size={14} />
              <span>Avtomatik Təhlükəsizlik Fondu</span>
            </span>
          </div>
        </div>

        {/* Rules note */}
        <div className="escrow-rule-banner">
          <Info size={18} className="rule-icon" />
          <p>
            Turizm standartlarına uyğun olaraq, müştəri ödənişləri turun bitiş tarixinədək etibarlı şəkildə saxlanılır. 
            Tur uğurla başa çatdıqda məbləğ avtomatik olaraq <strong>Mövcud Balansınıza</strong> köçürülür və çıxarışa hazır olur.
          </p>
        </div>

        {/* List / Table */}
        <div className="escrow-items-section">
          <div className="escrow-items-title">
            <span>Turlar Üzrə Gözləyən Vəsaitlər</span>
            <span className="escrow-count-pill">{items.length} Rezervasiya</span>
          </div>

          {loading ? (
            <div className="escrow-loading-box">
              <Spinner size="md" />
              <span>Gözləmədə olan turlar yüklənir...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="escrow-empty-box">
              <CheckCircle2 size={32} className="text-success" />
              <h4>Bütün turlar artıq başa çatıb!</h4>
              <p>Hazırda bloklanmış gələcək tur ödənişi yoxdur. Əldə olunan gəlirlər birbaşa mövcud balansınızdadır.</p>
            </div>
          ) : (
            <div className="escrow-table-wrap">
              <table className="escrow-table">
                <thead>
                  <tr>
                    <th>Tur / Rezervasiya</th>
                    <th>Sərnişin</th>
                    <th>Bitiş Tarixi</th>
                    <th>Qalan Vaxt</th>
                    <th style={{ textAlign: 'right' }}>Məbləğ</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.bookingId}>
                      <td>
                        <div className="escrow-tour-name">{it.tourTitle}</div>
                        <span className="font-mono text-xs text-secondary">#{it.bookingId}</span>
                      </td>
                      <td>
                        <span className="escrow-passenger-name">{it.passengerName}</span>
                      </td>
                      <td>
                        <span className="escrow-date">
                          {it.tourEndDate 
                            ? new Date(it.tourEndDate).toLocaleDateString('az-AZ', { day: '2-digit', month: 'short', year: 'numeric' })
                            : it.releaseDate}
                        </span>
                      </td>
                      <td>
                        <Badge variant={it.daysLeft <= 1 ? 'warning' : 'neutral'} pill>
                          {it.daysLeft === 0 ? 'Bu gün' : `${it.daysLeft} gün sonra`}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong className="text-primary-700">+{it.amount.toFixed(2)} {currency}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="escrow-modal-footer">
          <Button variant="secondary" onClick={onClose}>
            Bağla
          </Button>
        </div>
      </div>
    </div>
  );
};
