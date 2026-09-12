import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { Ticket, Percent, Coins, AlertCircle } from 'lucide-react';
import { vendorAdsApi } from '../../vendorAdsApi';
import '../CreateAdModal/CreateAdModal.css';

interface CreatePromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreatePromoModal: React.FC<CreatePromoModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [usageLimit, setUsageLimit] = useState<number>(50);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) {
      setError('Promokod adını daxil edin.');
      return;
    }
    if (discountValue <= 0) {
      setError('Endirim dəyəri 0-dan böyük olmalıdır.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await vendorAdsApi.createPromoCode({
        promoCode: promoCode.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        usageLimit: Number(usageLimit || 0),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        description: description.trim() || undefined
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.msg || err?.response?.data?.message || err?.message || 'Promokod yaradılarkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Yeni Endirim Promokodu Yarat</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="balance-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Promo Code Input */}
            <div className="form-group">
              <label>Promokod Adı</label>
              <input
                type="text"
                placeholder="Məsələn: YAY2026, VIP15, QONAQLAR10"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}
                required
              />
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Müştərilərin rezervasiya zamanı tətbiq edəcəyi kupon kodu (avtomatik böyük hərflərlə)
              </span>
            </div>

            {/* Discount Type Selector */}
            <div className="form-group">
              <label>Endirim Növü</label>
              <div className="target-type-selector">
                <div
                  className={`target-type-option ${discountType === 'PERCENTAGE' ? 'active' : ''}`}
                  onClick={() => setDiscountType('PERCENTAGE')}
                >
                  <Percent size={18} color="#059669" />
                  <div>
                    <div className="target-type-label">Faizlə (%)</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Məsələn: 15% endirim</div>
                  </div>
                </div>

                <div
                  className={`target-type-option ${discountType === 'FIXED' ? 'active' : ''}`}
                  onClick={() => setDiscountType('FIXED')}
                >
                  <Coins size={18} color="#2563eb" />
                  <div>
                    <div className="target-type-label">Sabit Məbləğlə (AZN)</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Məsələn: 20 AZN birbaşa çıxılma</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Discount Value */}
            <div className="form-group">
              <label>
                {discountType === 'PERCENTAGE' ? 'Endirim Faizi (%)' : 'Endirim Məbləği (AZN)'}
              </label>
              <input
                type="number"
                min="1"
                max={discountType === 'PERCENTAGE' ? 90 : 1000}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                required
              />
            </div>

            {/* Usage Limit */}
            <div className="form-group">
              <label>Maksimum İstifadə Limiti (Kupon Sayı)</label>
              <input
                type="number"
                min="0"
                placeholder="50 (0 daxil edilsə limitsiz olacaq)"
                value={usageLimit}
                onChange={(e) => setUsageLimit(Number(e.target.value))}
              />
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Kuponu cəmi neçə fərqli sifarişçi istifadə edə bilər (0 = limitsiz)
              </span>
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Başlama Tarixi</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Bitmə Tarixi</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Təsvir və ya Qeyd (İstəyə bağlı)</label>
              <input
                type="text"
                placeholder="Məsələn: Sosial şəbəkə izləyiciləri üçün xüsusi təklif"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Ləğv et
            </Button>
            <Button variant="primary" type="submit" isLoading={loading}>
              <Ticket size={16} style={{ marginRight: 6 }} />
              Promokodu Yarat
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
