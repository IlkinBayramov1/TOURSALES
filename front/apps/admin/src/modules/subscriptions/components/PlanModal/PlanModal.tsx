import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { SubscriptionPlan } from '@toursales/types';
import { subscriptionsAdminApi } from '../../subscriptionsAdminApi';
import './PlanModal.css';

interface PlanModalProps {
  plan: SubscriptionPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PlanModal: React.FC<PlanModalProps> = ({
  plan,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState(plan?.name || '');
  const [monthlyPrice, setMonthlyPrice] = useState(plan?.monthlyPrice?.toString() || '0');
  const [commissionRate, setCommissionRate] = useState(plan?.commissionRate?.toString() || '5');
  const [maxTours, setMaxTours] = useState(plan?.maxTours?.toString() || '20');
  const [features, setFeatures] = useState(plan?.features?.join('\n') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const payload = {
        name,
        monthlyPrice: parseFloat(monthlyPrice) || 0,
        currency: 'AZN',
        commissionRate: parseFloat(commissionRate) || 5,
        maxTours: parseInt(maxTours, 10) || 10,
        features: features.split('\n').map((f) => f.trim()).filter(Boolean),
      };

      if (plan) {
        await subscriptionsAdminApi.updatePlan(plan.id, payload);
      } else {
        await subscriptionsAdminApi.createPlan(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Plan saxlanılarkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="plan-modal-overlay" onClick={onClose}>
      <div className="plan-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="plan-modal-header">
          <h3>{plan ? 'Abunəlik Planını Redaktə Et' : 'Yeni Abunəlik Planı Yarat'}</h3>
          <button type="button" className="plan-close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="plan-form-group">
            <label>Planın Adı</label>
            <input
              type="text"
              placeholder="Məs: Qızıl Tərəfdaş (Gold)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="plan-grid-2">
            <div className="plan-form-group">
              <label>Aylıq Qiymət (AZN)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                required
              />
            </div>
            <div className="plan-form-group">
              <label>Platforma Komissiyası (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="plan-form-group">
            <label>Maksimum Aktiv Tur Limiti (-1 limitsiz)</label>
            <input
              type="number"
              value={maxTours}
              onChange={(e) => setMaxTours(e.target.value)}
              required
            />
          </div>

          <div className="plan-form-group">
            <label>Funksiyalar (Hər sətirdə bir maddə)</label>
            <textarea
              rows={4}
              placeholder="50 aktiv tur&#10;Prioritet dəstək&#10;Avtomatlaşdırılmış e-Qaimə"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              required
            />
          </div>

          <div className="plan-modal-actions">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Ləğv et
            </Button>
            <Button variant="primary" type="submit" isLoading={loading}>
              Yadda Saxla
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
