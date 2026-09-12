import React from 'react';
import { Eye, MousePointerClick, TicketCheck, TrendingUp } from 'lucide-react';
import { VendorAdsKPI } from '@toursales/types';
import './AdsKpiCards.css';

interface AdsKpiCardsProps {
  kpi?: VendorAdsKPI['summary'];
  loading?: boolean;
}

export const AdsKpiCards: React.FC<AdsKpiCardsProps> = ({ kpi, loading }) => {
  if (loading) {
    return (
      <div className="ads-kpi-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="ads-kpi-card" style={{ opacity: 0.6 }}>
            <div className="ads-kpi-icon impressions" />
            <div className="ads-kpi-content">
              <div style={{ height: 14, width: '60%', background: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 28, width: '40%', background: '#e5e7eb', borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const impressions = kpi?.totalImpressions || 0;
  const clicks = kpi?.totalClicks || 0;
  const bookings = kpi?.totalBookings || 0;
  const revenue = kpi?.totalRevenueGenerated || 0;
  const ctr = kpi?.avgCtr || '0.00%';
  const roi = kpi?.roi || '0.0%';

  return (
    <div className="ads-kpi-grid">
      {/* 1. Impressions */}
      <div className="ads-kpi-card">
        <div className="ads-kpi-icon impressions">
          <Eye size={24} />
        </div>
        <div className="ads-kpi-content">
          <div className="ads-kpi-title">Ümumi Baxış (İmpressions)</div>
          <div className="ads-kpi-value">{impressions.toLocaleString('az-AZ')}</div>
          <div className="ads-kpi-subtitle">
            <span className="ads-kpi-badge info">{kpi?.activeAdsCount || 0} aktiv vitrin</span>
            <span>platformada göstərim</span>
          </div>
        </div>
      </div>

      {/* 2. Clicks & CTR */}
      <div className="ads-kpi-card">
        <div className="ads-kpi-icon clicks">
          <MousePointerClick size={24} />
        </div>
        <div className="ads-kpi-content">
          <div className="ads-kpi-title">Ümumi Keçid (Clicks)</div>
          <div className="ads-kpi-value">{clicks.toLocaleString('az-AZ')}</div>
          <div className="ads-kpi-subtitle">
            <span className="ads-kpi-badge success">CTR {ctr}</span>
            <span>klikləmə nisbəti</span>
          </div>
        </div>
      </div>

      {/* 3. Bookings from Ads */}
      <div className="ads-kpi-card">
        <div className="ads-kpi-icon bookings">
          <TicketCheck size={24} />
        </div>
        <div className="ads-kpi-content">
          <div className="ads-kpi-title">Reklam Sifarişləri</div>
          <div className="ads-kpi-value">{bookings.toLocaleString('az-AZ')}</div>
          <div className="ads-kpi-subtitle">
            <span>Təsdiqlənmiş rezervasiya</span>
          </div>
        </div>
      </div>

      {/* 4. Revenue & ROI */}
      <div className="ads-kpi-card">
        <div className="ads-kpi-icon roi">
          <TrendingUp size={24} />
        </div>
        <div className="ads-kpi-content">
          <div className="ads-kpi-title">Reklam Gəliri & ROI</div>
          <div className="ads-kpi-value">{revenue.toLocaleString('az-AZ')} AZN</div>
          <div className="ads-kpi-subtitle">
            <span className="ads-kpi-badge success">ROI +{roi}</span>
            <span>investisiya gəlirliyi</span>
          </div>
        </div>
      </div>
    </div>
  );
};
