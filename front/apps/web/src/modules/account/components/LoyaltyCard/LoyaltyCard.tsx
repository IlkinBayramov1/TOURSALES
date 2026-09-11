import React from 'react';
import { Award, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { Card } from '@toursales/ui';
import './LoyaltyCard.css';

interface LoyaltyCardProps {
  points: number;
  tier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  tierDiscount?: number;
}

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({
  points,
  tier = 'BRONZE',
  tierDiscount = 3,
}) => {
  const tierConfig = {
    BRONZE: { name: 'Bürünc Üzv', nextTier: 'Gümüş', target: 500, colorClass: 'tier-bronze' },
    SILVER: { name: 'Gümüş Üzv', nextTier: 'Qızıl', target: 1500, colorClass: 'tier-silver' },
    GOLD: { name: 'Qızıl Üzv', nextTier: 'Platin', target: 3000, colorClass: 'tier-gold' },
    PLATINUM: { name: 'Platin VIP', nextTier: 'Maksimum', target: 5000, colorClass: 'tier-platinum' },
  }[tier];

  const progress = Math.min(100, Math.round((points / tierConfig.target) * 100));

  return (
    <div className={`web-loyalty-card ${tierConfig.colorClass}`}>
      <div className="web-loyalty-top">
        <div className="web-loyalty-badge">
          <Award size={20} />
          <span>{tierConfig.name}</span>
        </div>
        <div className="web-loyalty-discount-tag">
          %{tierDiscount} Hər Turda Endirim
        </div>
      </div>

      <div className="web-loyalty-middle">
        <span className="web-loyalty-label">Mövcud Bonus Balı</span>
        <div className="web-loyalty-balance">
          <h2>{points.toLocaleString()}</h2>
          <span className="web-loyalty-unit">XAL (= {(points * 0.1).toFixed(1)} AZN)</span>
        </div>
      </div>

      <div className="web-loyalty-progress-box">
        <div className="web-progress-text">
          <span>Növbəti pillə: <strong>{tierConfig.nextTier}</strong></span>
          <span>{points} / {tierConfig.target} Xal</span>
        </div>
        <div className="web-progress-track">
          <div
            className="web-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="web-loyalty-perks">
        <div className="web-perk-item">
          <Sparkles size={14} />
          <span>Bütün sifarişlərdən keşbek</span>
        </div>
        <div className="web-perk-item">
          <ShieldCheck size={14} />
          <span>Prioritet avtobus oturacaq seçimi</span>
        </div>
      </div>
    </div>
  );
};
