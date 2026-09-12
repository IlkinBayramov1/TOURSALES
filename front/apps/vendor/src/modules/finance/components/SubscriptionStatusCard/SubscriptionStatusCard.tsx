import React, { useEffect, useState } from 'react';
import { Button } from '@toursales/ui';
import { useNavigate } from 'react-router-dom';
import { vendorFinanceApi, CurrentSubscriptionInfo } from '../../vendorFinanceApi';
import './SubscriptionStatusCard.css';

interface SubscriptionStatusCardProps {
  subscription?: CurrentSubscriptionInfo | null;
}

export const SubscriptionStatusCard: React.FC<SubscriptionStatusCardProps> = ({ subscription }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<CurrentSubscriptionInfo | null>(subscription || null);

  useEffect(() => {
    if (subscription) {
      setData(subscription);
    } else {
      const fetchSub = async () => {
        try {
          const res = await vendorFinanceApi.getCurrentSubscription();
          setData(res);
        } catch (err) {
          console.error('Abunəlik məlumatı yüklənmədi:', err);
        }
      };
      fetchSub();
    }
  }, [subscription]);

  const planName = data?.planName || 'Peşəkar (Pro)';
  const commissionRate = data?.commissionRate ?? 5;
  const maxTours = data?.maxTours ?? 50;
  const activeToursCount = data?.activeToursCount ?? 0;

  return (
    <div className="sub-card">
      <div className="sub-card-left">
        <span className="sub-badge">Aktiv Abunəlik</span>
        <h3 className="sub-title">{planName}</h3>
        <div className="sub-details">
          <div className="sub-detail-item">
            Platform Komissiyası: <strong>{commissionRate}%</strong>
          </div>
          <div className="sub-detail-item">
            Aktiv Turlar: <strong>{activeToursCount} / {maxTours === -1 ? 'Limitsiz' : maxTours}</strong>
          </div>
        </div>
      </div>
      <div className="sub-card-right">
        <Button variant="primary" onClick={() => navigate('/subscription')}>
          Planı Dəyiş / Yenilə
        </Button>
      </div>
    </div>
  );
};
