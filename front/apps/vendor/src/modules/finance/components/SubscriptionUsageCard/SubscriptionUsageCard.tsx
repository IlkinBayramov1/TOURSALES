import React, { useState } from 'react';
import { CurrentSubscriptionInfo, vendorFinanceApi } from '../../vendorFinanceApi';
import { ShieldCheck, Calendar, Sparkles, RefreshCw, AlertCircle, Wallet } from 'lucide-react';
import './SubscriptionUsageCard.css';

interface SubscriptionUsageCardProps {
  subscription: CurrentSubscriptionInfo;
  onRefresh?: () => void;
}

export const SubscriptionUsageCard: React.FC<SubscriptionUsageCardProps> = ({
  subscription,
  onRefresh,
}) => {
  const [autoRenew, setAutoRenew] = useState<boolean>(subscription.autoRenewSubscription ?? true);
  const [toggling, setToggling] = useState(false);

  const maxTours = subscription.maxTours;
  const activeTours = subscription.activeToursCount;
  const isUnlimited = maxTours === -1;
  const usagePercentage = isUnlimited ? 15 : Math.min(100, Math.round((activeTours / maxTours) * 100));

  const handleToggleAutoRenew = async () => {
    try {
      setToggling(true);
      const nextVal = !autoRenew;
      setAutoRenew(nextVal);
      await vendorFinanceApi.toggleAutoRenewal(nextVal);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Auto renewal toggle error:', err);
      setAutoRenew(!autoRenew); // rollback
    } finally {
      setToggling(false);
    }
  };

  const formattedDate = subscription.nextBillingDate
    ? new Date(subscription.nextBillingDate).toLocaleDateString('az-AZ', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Təyin edilməyib';

  return (
    <div className="sub-usage-card">
      <div className="sub-usage-header">
        <div className="sub-usage-badge-wrap">
          <span className="sub-usage-badge">
            <Sparkles size={13} />
            Aktiv Abunəlik
          </span>
          <h2 className="sub-usage-plan-name">{subscription.planName}</h2>
        </div>

        <div className="sub-usage-meta-actions">
          {/* Next Billing Date */}
          <div className="sub-meta-pill">
            <Calendar size={15} />
            <span>Növbəti hesablaşma: <strong>{formattedDate}</strong></span>
          </div>

          {/* Auto Renew Switch */}
          <label className="sub-auto-renew-toggle" title="Balansdan avtomatik yenilənmə">
            <input
              type="checkbox"
              checked={autoRenew}
              onChange={handleToggleAutoRenew}
              disabled={toggling}
            />
            <span className="sub-toggle-slider" />
            <span className="sub-toggle-label">
              {autoRenew ? 'Avtomatik Yenilənmə Aktivdir' : 'Avtomatik Yenilənmə Qapalıdır'}
            </span>
          </label>
        </div>
      </div>

      <div className="sub-usage-body">
        {/* Usage Progress Bar */}
        <div className="sub-progress-section">
          <div className="sub-progress-label-row">
            <span className="sub-progress-title">Aktiv Tur Limiti İstifadəsi</span>
            <span className="sub-progress-val">
              <strong>{activeTours}</strong> / {isUnlimited ? 'Limitsiz' : maxTours} Tur
              {!isUnlimited && ` (${usagePercentage}%)`}
            </span>
          </div>

          <div className="sub-progress-track">
            <div
              className={`sub-progress-bar ${usagePercentage >= 90 ? 'warning' : ''}`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>

          {usagePercentage >= 80 && !isUnlimited && (
            <div className="sub-progress-hint">
              <AlertCircle size={14} />
              <span>Tur limitiniz dolmaq üzrədir. Daha çox tur elanı üçün planınızı yüksəldin.</span>
            </div>
          )}
        </div>

        {/* Financial Badges / Perks Grid */}
        <div className="sub-perks-grid">
          <div className="sub-perk-item">
            <span className="sub-perk-label">Daxili Tur Komissiyası</span>
            <span className="sub-perk-val">{subscription.domesticCommission}%</span>
          </div>
          <div className="sub-perk-item">
            <span className="sub-perk-label">Xarici Tur Komissiyası</span>
            <span className="sub-perk-val">{subscription.foreignCommission}%</span>
          </div>
          <div className="sub-perk-item">
            <span className="sub-perk-label">Aylıq Plan Haqqı</span>
            <span className="sub-perk-val">{subscription.monthlyPrice} AZN</span>
          </div>
          <div className="sub-perk-item balance">
            <span className="sub-perk-label">Mövcud Çıxarış Balansı</span>
            <span className="sub-perk-val text-primary">
              <Wallet size={15} />
              {(subscription.availableBalance || 0).toFixed(2)} AZN
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
