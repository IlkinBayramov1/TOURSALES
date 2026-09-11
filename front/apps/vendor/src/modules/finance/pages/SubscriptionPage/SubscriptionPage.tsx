import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { SubscriptionPlan } from '@toursales/types';
import { vendorFinanceApi } from '../../vendorFinanceApi';
import './SubscriptionPage.css';

const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Başlanğıc (Starter)',
    monthlyPrice: 0,
    currency: 'AZN',
    commissionRate: 8,
    maxTours: 5,
    features: [
      '5 aktiv tur elanı',
      '8% platform komissiyası',
      'Standart bilet satışı & QR vauçer',
      'E-poçt dəstəyi'
    ]
  },
  {
    id: 'pro',
    name: 'Peşəkar (Pro)',
    monthlyPrice: 49,
    currency: 'AZN',
    commissionRate: 5,
    maxTours: 50,
    isPopular: true,
    features: [
      '50 aktiv tur elanı',
      '5% güzəştli platform komissiyası',
      'Avtobus oturacaq interaktiv seçimi',
      'FİN kod ilə sərnişin siyahısı (roster)',
      'QR Bilet Yoxlama skaneri',
      'API Açar inteqrasiyası',
      '24/7 Prioritetli dəstək'
    ]
  },
  {
    id: 'enterprise',
    name: 'Korporativ (Enterprise)',
    monthlyPrice: 149,
    currency: 'AZN',
    commissionRate: 3,
    maxTours: -1,
    features: [
      'Limitsiz aktiv tur elanları',
      '3% minimum platform komissiyası',
      'Fərdi menecer dəstəyi',
      'Reklam bannerlərində 20% endirim',
      'Avtomatlaşdırılmış e-Qaimə integrasiyası',
      'Genişləndirilmiş komanda RBAC rolları'
    ]
  }
];

export const SubscriptionPage: React.FC = () => {
  const [currentPlanId, setCurrentPlanId] = useState<string>('pro');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    try {
      setLoadingId(planId);
      await vendorFinanceApi.changeSubscriptionPlan(planId);
      setCurrentPlanId(planId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="subscription-page">
      <div className="sub-header">
        <h1>Abunəlik Planları</h1>
        <p>Agentliyinizin ehtiyaclarına uyğun planı seçin və ən sərfəli komissiya dərəcələrindən faydalanın</p>
      </div>

      <div className="plans-grid">
        {MOCK_PLANS.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          return (
            <div
              key={plan.id}
              className={`plan-card ${plan.isPopular ? 'featured' : ''}`}
            >
              {plan.isPopular && <div className="popular-badge">Ən Çox Seçilən</div>}

              <h2 className="plan-name">{plan.name}</h2>
              <div className="plan-price">
                <span className="amount">{plan.monthlyPrice}</span>
                <span className="period">{plan.currency} / ay</span>
              </div>

              <ul className="plan-features">
                {plan.features.map((feat, idx) => (
                  <li key={idx}>
                    <span className="check">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={isCurrent ? 'secondary' : 'primary'}
                disabled={isCurrent}
                isLoading={loadingId === plan.id}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {isCurrent ? 'Hazırkı Planınız' : 'Bu Plana Keç'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
