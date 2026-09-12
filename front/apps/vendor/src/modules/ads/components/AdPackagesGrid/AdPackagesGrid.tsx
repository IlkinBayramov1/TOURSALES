import React from 'react';
import { Check, Sparkles, Zap } from 'lucide-react';
import { AdPackage } from '@toursales/types';
import './AdPackagesGrid.css';

interface AdPackagesGridProps {
  packages: AdPackage[];
  loading?: boolean;
  onSelectPackage: (pkg: AdPackage) => void;
}

export const AdPackagesGrid: React.FC<AdPackagesGridProps> = ({
  packages,
  loading,
  onSelectPackage
}) => {
  if (loading) {
    return (
      <div className="packages-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="package-card" style={{ opacity: 0.6 }}>
            <div style={{ height: 24, width: '70%', background: '#e5e7eb', borderRadius: 4, marginBottom: 12 }} />
            <div style={{ height: 40, width: '50%', background: '#e5e7eb', borderRadius: 4, marginBottom: 20 }} />
            <div style={{ height: 16, width: '90%', background: '#e5e7eb', borderRadius: 4, marginBottom: 10 }} />
            <div style={{ height: 16, width: '80%', background: '#e5e7eb', borderRadius: 4, marginBottom: 10 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="packages-grid">
      {packages.map((pkg) => {
        const isVip = pkg.id === 'ADP-14D' || pkg.durationDays === 14;
        const features = Array.isArray(pkg.features) ? pkg.features : [];

        return (
          <div key={pkg.id} className={`package-card ${isVip ? 'highlighted' : ''}`}>
            {isVip && (
              <div className="package-badge-popular">
                <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
                Ən Populyar VIP
              </div>
            )}

            <div className="package-header">
              <h3 className="package-name">{pkg.name || `${pkg.durationDays} Günlük Vitrin`}</h3>
              <div className="package-duration">
                {pkg.durationDays} gün aktiv yayım müddəti
              </div>
            </div>

            <div className="package-pricing">
              <span className="package-price">{Number(pkg.price).toFixed(0)}</span>
              <span className="package-currency">AZN / kampaniya</span>
            </div>

            <ul className="package-features-list">
              {features.map((feature, idx) => (
                <li key={idx} className="package-feature-item">
                  <div className="package-check-icon">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={`package-action-btn ${isVip ? 'vip' : 'primary'}`}
              onClick={() => onSelectPackage(pkg)}
            >
              <Zap size={16} />
              <span>Paketi Seç və Başlat</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
