import React, { useEffect, useState } from 'react';
import { Button, Badge } from '@toursales/ui';
import { MetricCard, DataTable } from '@/shared/components';
import { AdCampaignModal } from '../../components/AdCampaignModal/AdCampaignModal';
import { vendorAdsApi } from '../../vendorAdsApi';
import { Ad } from '@toursales/types';
import './AdsDashboardPage.css';

export const AdsDashboardPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await vendorAdsApi.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressionsCount || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicksCount || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  return (
    <div className="ads-dashboard-page">
      <div className="ads-header">
        <div>
          <h1>Reklam & Tanıtım Kampaniyaları</h1>
          <p>Turlarınızı platformada ön sıralara çıxarın və daha çox səyahətçiyə çatın</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + Yeni Kampaniya Başlat
        </Button>
      </div>

      <div className="ads-metrics-grid">
        <MetricCard
          title="Ümumi Baxış (İmpressions)"
          value={totalImpressions.toLocaleString('az-AZ')}
          change="+24% bu ay"
          isPositive={true}
          icon={<span style={{ fontSize: '1.25rem' }}>👁️</span>}
        />
        <MetricCard
          title="Ümumi Keçid (Clicks)"
          value={totalClicks.toLocaleString('az-AZ')}
          change="+18% bu ay"
          isPositive={true}
          icon={<span style={{ fontSize: '1.25rem' }}>🖱️</span>}
        />
        <MetricCard
          title="Orta Klikləmə Nisbəti (CTR)"
          value={`${avgCtr}%`}
          change="Sənaye ortalamasından yüksək"
          isPositive={true}
          icon={<span style={{ fontSize: '1.25rem' }}>📈</span>}
        />
      </div>

      <div className="ads-table-card">
        <DataTable
          data={campaigns}
          columns={[
            {
              header: 'Banner & Kampaniya',
              accessor: (c: Ad) => (
                <div className="ad-table-cell">
                  <img src={c.imageUrl} alt={c.title} className="ad-thumb" />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.title}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      {c.linkUrl || 'Keçid yoxdur'}
                    </div>
                  </div>
                </div>
              )
            },
            {
              header: 'Mövqe',
              accessor: (c: Ad) => (
                <Badge variant={c.position === 'HERO' ? 'primary' : 'neutral'}>
                  {c.position}
                </Badge>
              )
            },
            {
              header: 'Status',
              accessor: (c: Ad) => (
                <Badge variant={c.isActive ? 'success' : 'neutral'}>
                  {c.isActive ? 'Aktiv' : 'Deaktiv'}
                </Badge>
              )
            },
            {
              header: 'Baxış',
              accessor: (c: Ad) => (c.impressionsCount || 0).toLocaleString('az-AZ')
            },
            {
              header: 'Keçid',
              accessor: (c: Ad) => (c.clicksCount || 0).toLocaleString('az-AZ')
            },
            {
              header: 'CTR',
              accessor: (c: Ad) => {
                const imps = c.impressionsCount || 0;
                const clicks = c.clicksCount || 0;
                return imps > 0 ? `${((clicks / imps) * 100).toFixed(2)}%` : '0.00%';
              }
            },
            {
              header: 'Tarix Aralığı',
              accessor: (c: Ad) => (
                <span style={{ fontSize: '0.8125rem' }}>
                  {new Date(c.startDate).toLocaleDateString('az-AZ')} - {new Date(c.endDate).toLocaleDateString('az-AZ')}
                </span>
              )
            }
          ]}
        />
      </div>

      <AdCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
