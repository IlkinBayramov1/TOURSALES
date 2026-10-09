import React, { useState } from 'react';
import { CurrentSubscriptionInfo, vendorFinanceApi } from '../../vendorFinanceApi';
import { 
  ShieldCheck, 
  Calendar, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  Wallet, 
  Clock, 
  Users, 
  Key, 
  Compass,
  CheckCircle2
} from 'lucide-react';
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

  // Quotas
  const maxTours = subscription.maxTours;
  const activeTours = subscription.activeToursCount;
  const isUnlimitedTours = maxTours === -1;
  const toursPercentage = isUnlimitedTours ? 15 : Math.min(100, Math.round((activeTours / maxTours) * 100));

  const maxMembers = subscription.maxMembers ?? 5;
  const activeMembers = subscription.activeMembersCount ?? 1;
  const isUnlimitedMembers = maxMembers === -1;
  const membersPercentage = isUnlimitedMembers ? 20 : Math.min(100, Math.round((activeMembers / maxMembers) * 100));

  const maxApiKeys = subscription.maxApiKeys ?? 2;
  const activeApiKeys = subscription.activeApiKeysCount ?? 0;
  const isUnlimitedApiKeys = maxApiKeys === -1;
  const apiKeysPercentage = isUnlimitedApiKeys ? 10 : (maxApiKeys > 0 ? Math.min(100, Math.round((activeApiKeys / maxApiKeys) * 100)) : 0);

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

  // Safe Azerbaijani Date Formatter (Prevents "2026 M10 12" Windows glitch)
  const formatAzeriDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'Təyin edilməyib';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Təyin edilməyib';
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
      'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];
    const day = d.getDate().toString().padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formattedDate = formatAzeriDate(subscription.nextBillingDate);
  const daysLeft = subscription.daysLeft ?? (subscription.nextBillingDate 
    ? Math.max(0, Math.ceil((new Date(subscription.nextBillingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) 
    : 0);

  const isRenewalNear = daysLeft <= 3;

  return (
    <div className="sub-usage-card">
      <div className="sub-usage-header">
        <div className="sub-usage-badge-wrap">
          <div className="sub-badge-row">
            <span className="sub-usage-badge">
              <Sparkles size={13} />
              Aktiv Abunəlik
            </span>
            <span className={`sub-days-pill ${isRenewalNear ? 'warning' : 'ok'}`}>
              <Clock size={12} />
              <span>{daysLeft} gün qalıb</span>
            </span>
          </div>
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
        {/* Multi-Quota Progress Bars Grid */}
        <div className="sub-quotas-grid">
          {/* Quota 1: Active Tours */}
          <div className="sub-quota-box">
            <div className="sub-quota-title-row">
              <span className="sub-quota-title">
                <Compass size={14} className="text-primary-600" />
                <span>Aktiv Tur Kvotası</span>
              </span>
              <span className="sub-quota-numbers">
                <strong>{activeTours}</strong> / {isUnlimitedTours ? 'Limitsiz' : maxTours}
              </span>
            </div>
            <div className="sub-progress-track">
              <div
                className={`sub-progress-bar ${toursPercentage >= 90 ? 'warning' : ''}`}
                style={{ width: `${toursPercentage}%` }}
              />
            </div>
            <div className="sub-quota-footer">
              <small>{isUnlimitedTours ? 'Limitsiz elan' : `${toursPercentage}% istifadə olunub`}</small>
            </div>
          </div>

          {/* Quota 2: Team Members */}
          <div className="sub-quota-box">
            <div className="sub-quota-title-row">
              <span className="sub-quota-title">
                <Users size={14} className="text-info-600" />
                <span>Komanda Kvotası</span>
              </span>
              <span className="sub-quota-numbers">
                <strong>{activeMembers}</strong> / {isUnlimitedMembers ? 'Limitsiz' : maxMembers}
              </span>
            </div>
            <div className="sub-progress-track">
              <div
                className="sub-progress-bar info"
                style={{ width: `${membersPercentage}%` }}
              />
            </div>
            <div className="sub-quota-footer">
              <small>{isUnlimitedMembers ? 'Limitsiz əməkdaş' : `${membersPercentage}% dolub`}</small>
            </div>
          </div>

          {/* Quota 3: API Keys */}
          <div className="sub-quota-box">
            <div className="sub-quota-title-row">
              <span className="sub-quota-title">
                <Key size={14} className="text-warning-600" />
                <span>API Açar Kvotası</span>
              </span>
              <span className="sub-quota-numbers">
                <strong>{activeApiKeys}</strong> / {isUnlimitedApiKeys ? 'Limitsiz' : maxApiKeys}
              </span>
            </div>
            <div className="sub-progress-track">
              <div
                className="sub-progress-bar warning"
                style={{ width: `${apiKeysPercentage}%` }}
              />
            </div>
            <div className="sub-quota-footer">
              <small>{maxApiKeys === 0 ? 'Dəstəklənmir' : isUnlimitedApiKeys ? 'Limitsiz açar' : `${apiKeysPercentage}% istifadə`}</small>
            </div>
          </div>
        </div>

        {/* Warning hint if tours almost full */}
        {toursPercentage >= 80 && !isUnlimitedTours && (
          <div className="sub-progress-hint">
            <AlertCircle size={15} />
            <span>Aktiv tur limitiniz dolmaq üzrədir ({activeTours}/{maxTours}). Daha çox tur dərc etmək üçün planınızı yüksəldin.</span>
          </div>
        )}

        {/* Financial Badges / Commercial Rates Grid */}
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
