import React from 'react';
import { Button } from '@toursales/ui';
import { useNavigate } from 'react-router-dom';
import './SubscriptionStatusCard.css';

interface SubscriptionStatusCardProps {
  planName?: string;
  commissionRate?: number;
  maxTours?: number;
  activeToursCount?: number;
}

export const SubscriptionStatusCard: React.FC<SubscriptionStatusCardProps> = ({
  planName = 'Pro Plan',
  commissionRate = 5,
  maxTours = 50,
  activeToursCount = 12
}) => {
  const navigate = useNavigate();

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
