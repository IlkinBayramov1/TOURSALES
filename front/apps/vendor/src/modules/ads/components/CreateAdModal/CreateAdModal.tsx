import React, { useState, useEffect } from 'react';
import { Button } from '@toursales/ui';
import { Compass, Image as ImageIcon, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { AdPackage, Tour } from '@toursales/types';
import { tourManageApi } from '../../../tour-manage/api/tourManageApi';
import { vendorAdsApi } from '../../vendorAdsApi';
import './CreateAdModal.css';

interface CreateAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  packages: AdPackage[];
  preselectedPackageId?: string | null;
  availableBalance?: number;
}

export const CreateAdModal: React.FC<CreateAdModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  packages,
  preselectedPackageId,
  availableBalance = 0
}) => {
  const [targetType, setTargetType] = useState<'TOUR' | 'CUSTOM'>('TOUR');
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [position, setPosition] = useState<string>('HERO');
  
  // Custom ad fields
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch company active tours
      tourManageApi.getMyTours().then((res) => {
        const tourList = res.data || [];
        setTours(tourList);
        if (tourList.length > 0 && !selectedTourId) {
          setSelectedTourId(tourList[0].id);
        }
      });

      if (preselectedPackageId) {
        setSelectedPackageId(preselectedPackageId);
      } else if (packages.length > 0 && !selectedPackageId) {
        setSelectedPackageId(packages[0].id);
      }
    }
  }, [isOpen, preselectedPackageId, packages]);

  // When tour changes, update defaults
  useEffect(() => {
    if (targetType === 'TOUR' && selectedTourId) {
      const tour = tours.find((t) => t.id === selectedTourId);
      if (tour) {
        setTitle(tour.title);
        if (tour.images && typeof tour.images === 'string') {
          try {
            const parsed = JSON.parse(tour.images);
            setImageUrl(parsed[0] || '');
          } catch {
            setImageUrl('');
          }
        }
        setLinkUrl(`/tours/${tour.id}`);
      }
    }
  }, [selectedTourId, targetType, tours]);

  if (!isOpen) return null;

  const currentPackage = packages.find((p) => p.id === selectedPackageId);
  const packagePrice = Number(currentPackage?.price || 0);
  const hasEnoughBalance = availableBalance >= packagePrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackageId) {
      setError('Zəhmət olmasa bir reklam paketi seçin.');
      return;
    }

    if (targetType === 'TOUR' && !selectedTourId) {
      setError('Zəhmət olmasa reklam üçün tur seçin.');
      return;
    }

    if (targetType === 'CUSTOM' && (!title.trim() || !imageUrl.trim())) {
      setError('Fərdi banner üçün başlıq və şəkil URL-i mütləqdir.');
      return;
    }

    if (!hasEnoughBalance) {
      setError(`Balansda kifayət qədər vəsait yoxdur. Tələb olunan: ${packagePrice} AZN, mövcud: ${availableBalance} AZN.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await vendorAdsApi.purchaseAd({
        tourId: targetType === 'TOUR' ? selectedTourId : undefined,
        packageId: selectedPackageId,
        position,
        title: title.trim(),
        imageUrl: imageUrl.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.msg || err?.response?.data?.message || err?.message || 'Reklam yaradılarkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Yeni Reklam Kampaniyası Başlat</h3>
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

            {/* Target Type Selector */}
            <div className="target-type-selector">
              <div
                className={`target-type-option ${targetType === 'TOUR' ? 'active' : ''}`}
                onClick={() => setTargetType('TOUR')}
              >
                <input
                  type="radio"
                  name="targetType"
                  className="target-type-radio"
                  checked={targetType === 'TOUR'}
                  onChange={() => setTargetType('TOUR')}
                />
                <div>
                  <div className="target-type-label">Turu Önə Çıxar (VIP Boost)</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Mövcud aktiv turunuzu vitrinə qaldırın</div>
                </div>
              </div>

              <div
                className={`target-type-option ${targetType === 'CUSTOM' ? 'active' : ''}`}
                onClick={() => setTargetType('CUSTOM')}
              >
                <input
                  type="radio"
                  name="targetType"
                  className="target-type-radio"
                  checked={targetType === 'CUSTOM'}
                  onChange={() => setTargetType('CUSTOM')}
                />
                <div>
                  <div className="target-type-label">Fərdi Brend Banneri</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Xüsusi başlıq və banner şəkli ilə</div>
                </div>
              </div>
            </div>

            {/* Tour Selection if targetType === 'TOUR' */}
            {targetType === 'TOUR' && (
              <div className="form-group">
                <label>Reklam Ediləcək Tur</label>
                <select
                  value={selectedTourId}
                  onChange={(e) => setSelectedTourId(e.target.value)}
                  required
                >
                  {tours.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.basePrice || (t as any).price || 0} AZN)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Banner Inputs */}
            {targetType === 'CUSTOM' && (
              <>
                <div className="form-group">
                  <label>Kampaniya Başlığı</label>
                  <input
                    type="text"
                    placeholder="Məsələn: Payız Fürsətləri Şahdağ Turları"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Banner Şəkil URL-i</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Keçid Linki (Target URL)</label>
                  <input
                    type="text"
                    placeholder="/tours/shahdag-winter"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Placement Position */}
            <div className="form-group">
              <label>Yerləşmə Mövqeyi</label>
              <select value={position} onChange={(e) => setPosition(e.target.value)}>
                <option value="HERO">Ana Səhifə Hero Banner (Geniş Vitrin)</option>
                <option value="VIP_LIST">VIP Turlar Bölməsi (Kataloqda 1-ci sıra)</option>
                <option value="SIDEBAR">Yan Panel və Bənzər Turlar (Hədəfli Baxış)</option>
                <option value="POPUP">Xüsusi Təklif Açılan Pəncərə (Popup)</option>
              </select>
            </div>

            {/* Package Selection */}
            <div className="form-group">
              <label>VIP Reklam Paketi</label>
              <div className="package-select-grid">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`package-select-card ${selectedPackageId === pkg.id ? 'active' : ''}`}
                    onClick={() => setSelectedPackageId(pkg.id)}
                  >
                    <div className="package-select-name">{pkg.name || `${pkg.durationDays} Gün`}</div>
                    <div className="package-select-price">{Number(pkg.price).toFixed(0)} AZN</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {pkg.durationDays} gün aktiv yayım
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Balance & Payment Summary */}
            <div className="balance-check-card">
              <div className="balance-row">
                <span>Mövcud Şirkət Balansı:</span>
                <span style={{ fontWeight: 600 }}>{availableBalance.toFixed(2)} AZN</span>
              </div>
              <div className="balance-row">
                <span>Paket Qiyməti:</span>
                <span style={{ fontWeight: 600, color: '#dc2626' }}>-{packagePrice.toFixed(2)} AZN</span>
              </div>
              <div className="balance-row total">
                <span>Ödənişdən Sonrakı Qalıq:</span>
                <span style={{ color: hasEnoughBalance ? '#059669' : '#dc2626' }}>
                  {(availableBalance - packagePrice).toFixed(2)} AZN
                </span>
              </div>
            </div>

            {!hasEnoughBalance && (
              <div className="balance-warning">
                Balansınızda kifayət qədər vəsait yoxdur. Zəhmət olmasa "Maliyyə & Balans" bölməsindən balansınızı artırın.
              </div>
            )}
          </div>

          <div className="modal-actions">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Ləğv et
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={loading}
              disabled={loading || !hasEnoughBalance}
            >
              <Zap size={16} style={{ marginRight: 6 }} />
              Balansdan Ödə və Başlat ({packagePrice} AZN)
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
