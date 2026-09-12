import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { SubscriptionPlan } from '@toursales/types';
import { CurrentSubscriptionInfo, vendorFinanceApi } from '../../vendorFinanceApi';
import { Sparkles, Check, ArrowRight, Wallet, AlertCircle } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !targetPlan) return null;

  const monthlyPrice = targetPlan.monthlyPrice;
  const chargeAmount = monthlyPrice > 0
    ? billingCycle === 'YEARLY'
      ? Math.round(monthlyPrice * 12 * 0.8)
      : monthlyPrice
    : 0;

  const availableBalance = currentSubscription?.availableBalance || 0;
  const canAffordWithBalance = availableBalance >= chargeAmount;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await vendorFinanceApi.changeSubscriptionPlan({
        planId: targetPlan.id,
        billingCycle,
        payFromBalance: true,
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
            <span>Seçilmiş Hesablaşma Dövrü:</span>
            <strong>{billingCycle === 'YEARLY' ? 'İllik (20% Endirimlə)' : 'Aylıq'}</strong>
          </div>
          <div className="upgrade-price-row total">
            <span>Ödəniləcək Məbləğ:</span>
            <strong className="upgrade-total-amount">
              {chargeAmount > 0 ? `${chargeAmount} AZN` : 'Ödənişsiz (0 AZN)'}
            </strong>
          </div>
        </div>

        {/* Payment Source Selection */}
        {chargeAmount > 0 && (
          <div className="upgrade-payment-method">
            <div className="upgrade-method-title">Ödəniş Üsulu:</div>
            <div className={`upgrade-balance-box ${canAffordWithBalance ? 'sufficient' : 'insufficient'}`}>
              <div className="upgrade-balance-info">
                <Wallet size={18} />
                <div>
                  <div className="upgrade-balance-name">Platforma Hesablaşma Balansı</div>
                  <div className="upgrade-balance-val">Mövcud: {availableBalance.toFixed(2)} AZN</div>
                </div>
              </div>

              {canAffordWithBalance ? (
                <span className="upgrade-status-badge ok">Kifayətdir (Balansdan çıxılacaq)</span>
              ) : (
                <span className="upgrade-status-badge fail">Yetərsiz Balans</span>
              )}
            </div>

            {!canAffordWithBalance && (
              <small className="upgrade-balance-warning">
                Balansınız bu məbləğ üçün kifayət etmir. Zəhmət olmasa əvvəlcə balansınızı artırın və ya dəstək xidməti ilə əlaqə saxlayın.
              </small>
            )}
          </div>
        )}

        {/* Benefits List */}
        <div className="upgrade-benefits">
          <div className="upgrade-benefits-title">Bu planla əldə edəcəyiniz imkanlar:</div>
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
            Ləğv et
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            isLoading={loading}
            disabled={chargeAmount > 0 && !canAffordWithBalance}
          >
            {chargeAmount > 0 ? `${chargeAmount} AZN Ödə və Təsdiqlə` : 'Planı Təsdiqlə'}
          </Button>
        </div>
      </div>
    </div>
  );
};
