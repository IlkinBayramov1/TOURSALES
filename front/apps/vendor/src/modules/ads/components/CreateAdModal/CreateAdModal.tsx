import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@toursales/ui';
import {
  Compass,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Zap,
  CreditCard,
  Wallet,
  FileText,
  Eye,
  MousePointer,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Layers
} from 'lucide-react';
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

type PaymentMethodType = 'BALANCE' | 'CARD' | 'INVOICE';

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('BALANCE');

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

  // Check balance and set initial payment method
  const currentPackage = packages.find((p) => p.id === selectedPackageId);
  const packagePrice = Number(currentPackage?.price || 0);
  const hasEnoughBalance = availableBalance >= packagePrice;

  useEffect(() => {
    if (!hasEnoughBalance && paymentMethod === 'BALANCE') {
      // Auto-suggest CARD if balance is insufficient
      setPaymentMethod('CARD');
    }
  }, [hasEnoughBalance, packagePrice]);

  // Dynamic Forecasting Estimator
  const estimates = useMemo(() => {
    const days = currentPackage?.durationDays || 7;
    const multiplier = position === 'HERO' ? 1.6 : position === 'VIP_LIST' ? 1.3 : position === 'POPUP' ? 1.4 : 1.0;
    const minViews = Math.round(days * 1800 * multiplier);
    const maxViews = Math.round(days * 4200 * multiplier);
    const minClicks = Math.round(minViews * 0.028);
    const maxClicks = Math.round(maxViews * 0.038);
    const minBookings = Math.max(3, Math.round(minClicks * 0.038));
    const maxBookings = Math.max(8, Math.round(maxClicks * 0.052));
    const estROI = (2.8 * multiplier).toFixed(1);

    return {
      minViews: minViews.toLocaleString(),
      maxViews: maxViews.toLocaleString(),
      minClicks: minClicks.toLocaleString(),
      maxClicks: maxClicks.toLocaleString(),
      minBookings,
      maxBookings,
      estROI
    };
  }, [currentPackage, position]);

  const selectedTour = tours.find((t) => t.id === selectedTourId);
  const displayTitle = title.trim() || selectedTour?.title || 'Seçilmiş VIP Ekskursiya Turu';
  const displayPrice = selectedTour ? (selectedTour.basePrice || (selectedTour as any).price || 85) : 120;
  const displayImage =
    imageUrl.trim() ||
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800';

  if (!isOpen) return null;

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

    if (paymentMethod === 'BALANCE' && !hasEnoughBalance) {
      setError(
        `Platforma balansınızda kifayət qədər vəsait yoxdur (${availableBalance} AZN). Zəhmət olmasa Bank Kartı və ya B2B Faktura ilə ödəyin.`
      );
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
        linkUrl: linkUrl.trim() || undefined,
        paymentMethod
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.msg ||
          err?.response?.data?.message ||
          err?.message ||
          'Reklam yaradılarkən xəta baş verdi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-dialog-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-header-badge">
              <Sparkles size={14} /> VIP Reklam & Vitrin Kampaniyası
            </div>
            <h3>Yeni Reklam Kampaniyası Başlat</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body create-ad-modal-grid">
            {/* SOL SÜTUN: Parametrlər və Seçimlər */}
            <div className="ad-config-col">
              {error && (
                <div className="balance-warning alert-box" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {/* Hədəf Tipi */}
              <div className="form-group">
                <label>Reklam Hədəfi Tipi</label>
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
                      <div className="target-type-desc">Mövcud turunuzu birbaşa vitrinə qaldırın</div>
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
                      <div className="target-type-desc">Xüsusi qrafika və keçid linki ilə</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tur Seçimi */}
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

              {/* Fərdi Banner Sahələri */}
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

              {/* Yerləşmə Mövqeyi */}
              <div className="form-group">
                <label>Platformada Yerləşmə Mövqeyi</label>
                <div className="position-select-grid">
                  {[
                    { id: 'HERO', label: 'Ana Səhifə Hero Banner', desc: 'Ən yüksək görünürlük, ən böyük vizual banner' },
                    { id: 'VIP_LIST', label: 'VIP Kataloq 1-ci Sıra', desc: 'Axtarışda və kataloqda qızıl çərçivəli prioritet' },
                    { id: 'SIDEBAR', label: 'Yan Panel & Oxşar Turlar', desc: 'Tur səhifələrində tövsiyə edilən hədəfli blok' },
                    { id: 'POPUP', label: 'Xüsusi Təklif Pəncərəsi (Popup)', desc: 'Giriş və ya çıxış anında diqqətçəkən pəncərə' }
                  ].map((pos) => (
                    <div
                      key={pos.id}
                      className={`position-chip ${position === pos.id ? 'active' : ''}`}
                      onClick={() => setPosition(pos.id)}
                    >
                      <div className="position-chip-header">
                        <Layers size={15} />
                        <span className="position-chip-title">{pos.label}</span>
                      </div>
                      <span className="position-chip-desc">{pos.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paket Seçimi */}
              <div className="form-group">
                <label>VIP Reklam Paketi</label>
                <div className="package-select-grid">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`package-select-card ${selectedPackageId === pkg.id ? 'active' : ''}`}
                      onClick={() => setSelectedPackageId(pkg.id)}
                    >
                      <div className="package-select-name">{pkg.name || `${pkg.durationDays} Günlük`}</div>
                      <div className="package-select-price">{Number(pkg.price).toFixed(0)} AZN</div>
                      <div className="package-select-duration">{pkg.durationDays} gün aktiv yayım</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-Metod Ödəniş Seçimi */}
              <div className="form-group">
                <label>Ödəniş Metodu</label>
                <div className="payment-method-selector">
                  {/* Platforma Balansı */}
                  <div
                    className={`payment-method-card ${paymentMethod === 'BALANCE' ? 'active' : ''} ${!hasEnoughBalance ? 'disabled-balance' : ''}`}
                    onClick={() => setPaymentMethod('BALANCE')}
                  >
                    <div className="payment-method-header">
                      <div className="payment-method-icon">
                        <Wallet size={18} />
                      </div>
                      <div className="payment-method-info">
                        <div className="payment-method-name">Platforma Balansı</div>
                        <div className="payment-method-sub">
                          Mövcud: <strong>{availableBalance.toFixed(2)} AZN</strong>
                        </div>
                      </div>
                    </div>
                    {hasEnoughBalance ? (
                      <span className="payment-badge success">Kifayətdir</span>
                    ) : (
                      <span className="payment-badge danger">Qeyri-kafi</span>
                    )}
                  </div>

                  {/* Onlayn Bank Kartı */}
                  <div
                    className={`payment-method-card ${paymentMethod === 'CARD' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('CARD')}
                  >
                    <div className="payment-method-header">
                      <div className="payment-method-icon card-icon">
                        <CreditCard size={18} />
                      </div>
                      <div className="payment-method-info">
                        <div className="payment-method-name">Bank Kartı (Onlayn)</div>
                        <div className="payment-method-sub">Visa, MasterCard, Birkart (0% komissiya)</div>
                      </div>
                    </div>
                    <span className="payment-badge info">Dərhal</span>
                  </div>

                  {/* B2B Hesab-Faktura */}
                  <div
                    className={`payment-method-card ${paymentMethod === 'INVOICE' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('INVOICE')}
                  >
                    <div className="payment-method-header">
                      <div className="payment-method-icon invoice-icon">
                        <FileText size={18} />
                      </div>
                      <div className="payment-method-info">
                        <div className="payment-method-name">B2B Hesab-Faktura</div>
                        <div className="payment-method-sub">Rəsmi VÖEN & Bank köçürməsi üçün</div>
                      </div>
                    </div>
                    <span className="payment-badge neutral">Faktura</span>
                  </div>
                </div>
              </div>

              {/* Maliyyə Xülasəsi Qutusu */}
              <div className="balance-check-card">
                <div className="balance-row">
                  <span>Seçilmiş Paket Qiyməti:</span>
                  <span className="price-tag-value">{packagePrice.toFixed(2)} AZN</span>
                </div>
                {paymentMethod === 'BALANCE' && (
                  <>
                    <div className="balance-row">
                      <span>Mövcud Balans:</span>
                      <span>{availableBalance.toFixed(2)} AZN</span>
                    </div>
                    <div className="balance-row total">
                      <span>Ödənişdən Sonrakı Qalıq:</span>
                      <span style={{ color: hasEnoughBalance ? '#059669' : '#dc2626' }}>
                        {(availableBalance - packagePrice).toFixed(2)} AZN
                      </span>
                    </div>
                  </>
                )}
                {paymentMethod === 'CARD' && (
                  <div className="balance-row total">
                    <span>Kartdan çıxılacaq məbləğ:</span>
                    <span style={{ color: '#2563eb' }}>{packagePrice.toFixed(2)} AZN (Dərhal)</span>
                  </div>
                )}
                {paymentMethod === 'INVOICE' && (
                  <div className="balance-row total">
                    <span>Faktura Məbləği:</span>
                    <span style={{ color: '#7c3aed' }}>{packagePrice.toFixed(2)} AZN (Ödəniş tapşırığı)</span>
                  </div>
                )}
              </div>
            </div>

            {/* SAĞ SÜTUN: Canlı Banner Mockup & Proqnozlaşdırma */}
            <div className="ad-preview-col">
              <div className="preview-sticky-wrap">
                {/* 1. Canlı Banner Önizləməsi */}
                <div className="preview-container">
                  <div className="preview-header">
                    <div className="preview-title">
                      <Eye size={16} /> Canlı Reklam Mockup Önizləməsi
                    </div>
                    <span className="preview-position-tag">{position} REJİMİ</span>
                  </div>

                  {/* HERO Mockup */}
                  {position === 'HERO' && (
                    <div className="mockup-hero-banner" style={{ backgroundImage: `url(${displayImage})` }}>
                      <div className="mockup-hero-overlay">
                        <div className="mockup-hero-badge">
                          <Sparkles size={13} /> 🔥 ƏN ÇOX BAXILAN TƏKLİF
                        </div>
                        <h4 className="mockup-hero-title">{displayTitle}</h4>
                        <div className="mockup-hero-footer">
                          <div className="mockup-hero-price">
                            <span className="price-label">Başlanğıc:</span>
                            <span className="price-val">{displayPrice} AZN</span>
                          </div>
                          <button type="button" className="mockup-hero-btn">
                            İndi Rezerv Et <ExternalLink size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VIP_LIST Mockup */}
                  {position === 'VIP_LIST' && (
                    <div className="mockup-vip-card">
                      <div className="mockup-vip-badge">⭐ VIP SPONSORLU TUR</div>
                      <div className="mockup-vip-img-box">
                        <img src={displayImage} alt={displayTitle} />
                        <div className="mockup-vip-price-tag">{displayPrice} AZN</div>
                      </div>
                      <div className="mockup-vip-content">
                        <h5>{displayTitle}</h5>
                        <p className="mockup-vip-agency">✨ Rəsmi Təsdiqlənmiş Turizm Agentliyi</p>
                        <div className="mockup-vip-rating">★★★★★ <span>(4.9 / 5 • 84 rəy)</span></div>
                      </div>
                    </div>
                  )}

                  {/* SIDEBAR Mockup */}
                  {position === 'SIDEBAR' && (
                    <div className="mockup-sidebar-card">
                      <div className="mockup-sidebar-badge">TÖVSİYƏ EDİLƏN</div>
                      <div className="mockup-sidebar-inner">
                        <img src={displayImage} alt={displayTitle} />
                        <div className="mockup-sidebar-info">
                          <h6>{displayTitle}</h6>
                          <div className="mockup-sidebar-price">{displayPrice} AZN-dən</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* POPUP Mockup */}
                  {position === 'POPUP' && (
                    <div className="mockup-popup-box">
                      <div className="mockup-popup-close">✕</div>
                      <img src={displayImage} alt={displayTitle} className="mockup-popup-img" />
                      <div className="mockup-popup-body">
                        <span className="mockup-popup-tag">XÜSUSİ FÜRSƏT</span>
                        <h6>{displayTitle}</h6>
                        <div className="mockup-popup-price">{displayPrice} AZN</div>
                        <button type="button" className="mockup-popup-btn">
                          Yerinizi Ayırın
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Proqnozlaşdırma Kalkulyatoru (Forecasting Estimator) */}
                <div className="estimator-card">
                  <div className="estimator-header">
                    <div className="estimator-title">
                      <TrendingUp size={16} /> Kampaniya Proqnozlaşdırma Göstəriciləri
                    </div>
                    <span className="estimator-badge">Süni İntellekt Analizi</span>
                  </div>

                  <div className="estimator-grid">
                    <div className="estimator-metric">
                      <div className="metric-icon views-icon">
                        <Eye size={16} />
                      </div>
                      <div className="metric-details">
                        <span className="metric-label">Təxmini Baxış Sayı</span>
                        <strong className="metric-value">{estimates.minViews} - {estimates.maxViews}</strong>
                      </div>
                    </div>

                    <div className="estimator-metric">
                      <div className="metric-icon clicks-icon">
                        <MousePointer size={16} />
                      </div>
                      <div className="metric-details">
                        <span className="metric-label">Təxmini Klik Sayı</span>
                        <strong className="metric-value">{estimates.minClicks} - {estimates.maxClicks}</strong>
                      </div>
                    </div>

                    <div className="estimator-metric">
                      <div className="metric-icon bookings-icon">
                        <Zap size={16} />
                      </div>
                      <div className="metric-details">
                        <span className="metric-label">Gözlənilən Rezervasiya</span>
                        <strong className="metric-value">{estimates.minBookings} - {estimates.maxBookings} sifariş</strong>
                      </div>
                    </div>

                    <div className="estimator-metric">
                      <div className="metric-icon roi-icon">
                        <TrendingUp size={16} />
                      </div>
                      <div className="metric-details">
                        <span className="metric-label">Orta Gəlir Artımı (ROI)</span>
                        <strong className="metric-value">{estimates.estROI}x təxmini gəlir</strong>
                      </div>
                    </div>
                  </div>

                  <div className="estimator-note">
                    <ShieldCheck size={14} />
                    <span>Statistika platformanın son 90 günlük alqoritmik ziyarətçi analitikasına əsaslanır.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Ləğv et
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={loading}
              disabled={loading || (paymentMethod === 'BALANCE' && !hasEnoughBalance)}
            >
              <Zap size={16} style={{ marginRight: 6 }} />
              {paymentMethod === 'BALANCE' && `Balansdan Ödə və Başlat (${packagePrice} AZN)`}
              {paymentMethod === 'CARD' && `Kartla Ödə və Dərhal Başlat (${packagePrice} AZN)`}
              {paymentMethod === 'INVOICE' && `Hesab-Faktura Tərtib Et (${packagePrice} AZN)`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
