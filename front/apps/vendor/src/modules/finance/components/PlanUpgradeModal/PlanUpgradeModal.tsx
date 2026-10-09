import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { SubscriptionPlan } from '@toursales/types';
import { CurrentSubscriptionInfo, vendorFinanceApi } from '../../vendorFinanceApi';
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  Wallet, 
  AlertCircle, 
  CreditCard, 
  Building2, 
  ShieldCheck,
  AlertTriangle,
  Info
} from 'lucide-react';
import './PlanUpgradeModal.css';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan: SubscriptionPlan | null;
  currentSubscription: CurrentSubscriptionInfo | null;
  billingCycle: 'MONTHLY' | 'YEARLY';
  onSuccess: (message: string) => void;
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  targetPlan,
  currentSubscription,
  billingCycle,
  onSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'BALANCE' | 'CARD' | 'BANK_TRANSFER'>('BALANCE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Card payment mock inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  if (!isOpen || !targetPlan) return null;

  const monthlyPrice = targetPlan.monthlyPrice;
  const chargeAmount = monthlyPrice > 0
    ? billingCycle === 'YEARLY'
      ? Math.round(monthlyPrice * 12 * 0.8)
      : monthlyPrice
    : 0;

  const availableBalance = currentSubscription?.availableBalance || 0;
  const canAffordWithBalance = availableBalance >= chargeAmount;

  // Downgrade Guard Check
  const activeTours = currentSubscription?.activeToursCount || 0;
  const targetMaxTours = targetPlan.name?.includes('Starter') ? 5 : targetPlan.name?.includes('Pro') ? 50 : -1;
  const isDowngradeBlocked = targetMaxTours !== -1 && activeTours > targetMaxTours;
  const excessToursCount = isDowngradeBlocked ? activeTours - targetMaxTours : 0;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (chargeAmount > 0 && paymentMethod === 'BALANCE' && !canAffordWithBalance) {
        setError('Platforma balansınızda kifayət qədər vəsait yoxdur. Zəhmət olmasa Bank Kartı və ya B2B Faktura seçin.');
        setLoading(false);
        return;
      }

      if (chargeAmount > 0 && paymentMethod === 'CARD') {
        const cleanCard = cardNumber.replace(/\s+/g, '');
        if (cleanCard.length < 16) {
          setError('Düzgün 16 rəqəmli bank kartı nömrəsi daxil edin.');
          setLoading(false);
          return;
        }
      }

      const res = await vendorFinanceApi.changeSubscriptionPlan({
        planId: targetPlan.id,
        billingCycle,
        paymentMethod,
        payFromBalance: paymentMethod === 'BALANCE',
      });

      onSuccess(res?.message || `'${targetPlan.name}' planına uğurla keçid edildi!`);
      onClose();
    } catch (err: any) {
      console.error('Plan upgrade error:', err);
      setError(
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        'Plan dəyişdirilərkən xəta baş verdi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upgrade-modal-overlay" onClick={onClose}>
      <div className="upgrade-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="upgrade-modal-header">
          <div className="upgrade-header-badge">
            <Sparkles size={14} />
            <span>Abunəlik Planının Yenilənməsi</span>
          </div>
          <h3>Plan Keçidini Təsdiqləyin</h3>
          <button type="button" className="upgrade-close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="upgrade-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Downgrade Limit Warning */}
        {isDowngradeBlocked && (
          <div className="upgrade-downgrade-warning">
            <AlertTriangle size={18} className="text-warning-600" />
            <div>
              <strong>Tur Limiti Xəbərdarlığı!</strong>
              <p>
                Sizin hal-hazırda <strong>{activeTours} aktiv turunuz</strong> var, lakin '{targetPlan.name}' planı ən çox <strong>{targetMaxTours} aktiv tura</strong> icazə verir. 
                Keçid etmək üçün əvvəlcə ən azı <strong>{excessToursCount} turu</strong> deaktiv etməlisiniz.
              </p>
            </div>
          </div>
        )}

        {/* Transition Overview */}
        <div className="upgrade-transition-row">
          <div className="upgrade-plan-box current">
            <span className="upgrade-box-label">Hazırkı Plan</span>
            <div className="upgrade-box-title">{currentSubscription?.planName || 'Başlanğıc'}</div>
            <div className="upgrade-box-comm">Komissiya: {currentSubscription?.commissionRate || 8}%</div>
          </div>

          <div className="upgrade-arrow-divider">
            <ArrowRight size={20} />
          </div>

          <div className="upgrade-plan-box target">
            <span className="upgrade-box-label">Yeni Seçilən Plan</span>
            <div className="upgrade-box-title">{targetPlan.name}</div>
            <div className="upgrade-box-comm text-success font-bold">
              Komissiya: {targetPlan.commissionRate ?? 5}%
            </div>
          </div>
        </div>

        {/* Financial Charge Summary */}
        <div className="upgrade-price-summary">
          <div className="upgrade-price-row">
            <span>Hesablaşma Dövrü:</span>
            <strong>{billingCycle === 'YEARLY' ? 'İllik (20% Qənaətlə)' : 'Aylıq'}</strong>
          </div>
          <div className="upgrade-price-row total">
            <span>Ödəniləcək Məbləğ:</span>
            <strong className="upgrade-total-amount">
              {chargeAmount > 0 ? `${chargeAmount} AZN` : 'Ödənişsiz (0 AZN)'}
            </strong>
          </div>
        </div>

        {/* 3 Payment Methods Selection (If chargeAmount > 0) */}
        {chargeAmount > 0 && !isDowngradeBlocked && (
          <div className="upgrade-payment-section">
            <div className="upgrade-section-title">Ödəniş Üsulunu Seçin:</div>

            <div className="upgrade-methods-tabs">
              {/* Option 1: Balance */}
              <button
                type="button"
                className={`upgrade-method-tab ${paymentMethod === 'BALANCE' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('BALANCE')}
              >
                <Wallet size={16} />
                <span>Balansdan Çıxılma</span>
              </button>

              {/* Option 2: Card */}
              <button
                type="button"
                className={`upgrade-method-tab ${paymentMethod === 'CARD' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('CARD')}
              >
                <CreditCard size={16} />
                <span>Bank Kartı</span>
              </button>

              {/* Option 3: B2B Bank Transfer */}
              <button
                type="button"
                className={`upgrade-method-tab ${paymentMethod === 'BANK_TRANSFER' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
              >
                <Building2 size={16} />
                <span>B2B Faktura</span>
              </button>
            </div>

            {/* TAB CONTENT 1: BALANCE */}
            {paymentMethod === 'BALANCE' && (
              <div className={`upgrade-tab-content balance ${canAffordWithBalance ? 'ok' : 'insufficient'}`}>
                <div className="upgrade-balance-row">
                  <div>
                    <div className="upgrade-balance-label">Platforma Mövcud Çıxarış Balansı</div>
                    <div className="upgrade-balance-num">{availableBalance.toFixed(2)} AZN</div>
                  </div>
                  {canAffordWithBalance ? (
                    <span className="upgrade-badge-pill success">
                      <Check size={13} /> Kifayətdir
                    </span>
                  ) : (
                    <span className="upgrade-badge-pill error">Yetərsiz Balans</span>
                  )}
                </div>

                {!canAffordWithBalance ? (
                  <p className="upgrade-balance-hint error">
                    Balansınızda kifayət qədər vəsait yoxdur. Zəhmət olmasa yuxarıdakı tablardan <strong>Bank Kartı</strong> və ya <strong>B2B Faktura</strong> üsulunu seçin.
                  </p>
                ) : (
                  <p className="upgrade-balance-hint success">
                    Təsdiq etdikdən sonra <strong>{chargeAmount} AZN</strong> məbləğ mövcud balansınızdan dərhal silinəcək və plan aktivləşəcək.
                  </p>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: CARD */}
            {paymentMethod === 'CARD' && (
              <div className="upgrade-tab-content card">
                <div className="upgrade-card-desc">
                  <ShieldCheck size={16} className="text-success" />
                  <span>Azərbaycan bank kartları (Birkart, Tamkart, Visa, Mastercard) ilə 3D Secure təhlükəsiz ödəniş.</span>
                </div>

                <div className="upgrade-card-form">
                  <div className="upgrade-form-group">
                    <label>Kart Nömrəsi</label>
                    <input
                      type="text"
                      placeholder="4169 •••• •••• ••••"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                        setCardNumber(val);
                      }}
                    />
                  </div>

                  <div className="upgrade-form-row">
                    <div className="upgrade-form-group">
                      <label>Bitmə Tarixi</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                      />
                    </div>
                    <div className="upgrade-form-group">
                      <label>CVV / CVC</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={3}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: B2B BANK TRANSFER */}
            {paymentMethod === 'BANK_TRANSFER' && (
              <div className="upgrade-tab-content transfer">
                <div className="upgrade-transfer-info">
                  <div className="transfer-header">
                    <Info size={16} className="text-primary-600" />
                    <span>Hüquqi Şəxslər üçün Rəsmi Hesablaşma Fakturası</span>
                  </div>
                  <p>
                    Təsdiq etdikdən sonra şirkətiniz adına <strong>#{chargeAmount} AZN</strong> məbləğində rəsmi ödəniş fakturası tərtib ediləcək. Bank rekvizitlərimizə köçürmə etdikdən sonra abunəliyiniz dərhal təsdiqlənir.
                  </p>
                  <div className="transfer-details-box">
                    <div><span>Hesablaşma Bankı:</span> <strong>ABB ASC</strong></div>
                    <div><span>VÖEN:</span> <strong>1405987121</strong></div>
                    <div><span>IBAN:</span> <strong>AZ45IBAZ38010000000000123456</strong></div>
                    <div><span>Təyinat Kodu:</span> <strong>TS-SUB-PAY</strong></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Benefits List */}
        <div className="upgrade-benefits">
          <div className="upgrade-benefits-title">Bu planla əldə edəcəyiniz üstünlüklər:</div>
          <ul>
            {targetPlan.features?.slice(0, 4).map((feat, idx) => (
              <li key={idx}>
                <Check size={14} className="upgrade-check" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Modal Actions */}
        <div className="upgrade-actions">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Bağla
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            isLoading={loading}
            disabled={
              isDowngradeBlocked || 
              (chargeAmount > 0 && paymentMethod === 'BALANCE' && !canAffordWithBalance)
            }
          >
            {isDowngradeBlocked 
              ? 'Limit Aşıldı (Keçid Bloklanıb)'
              : chargeAmount > 0
                ? paymentMethod === 'BANK_TRANSFER'
                  ? 'Faktura Tərtib Et və Təsdiqlə'
                  : `${chargeAmount} AZN Ödə və Təsdiqlə`
                : 'Planı Təsdiqlə'}
          </Button>
        </div>
      </div>
    </div>
  );
};
