import React, { useEffect, useState } from 'react';
import { Button, Badge } from '@toursales/ui';
import { Plus, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import { PlanModal } from '../../components/PlanModal/PlanModal';
import { subscriptionsAdminApi } from '../../subscriptionsAdminApi';
import { SubscriptionPlan } from '@toursales/types';
import './SubscriptionPlansPage.css';

export const SubscriptionPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await subscriptionsAdminApi.getPlans();
      setPlans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu abunəlik planını silmək istədiyinizə əminsiniz?')) return;
    try {
      await subscriptionsAdminApi.deletePlan(id);
      loadPlans();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-sub-page">
      <div className="admin-sub-header">
        <div>
          <h1>Abunəlik Planları & Tarif Siyasəti</h1>
          <p>Tərəfdaş agentliklərin aylıq paketləri, komissiya endirimləri və tur limitləri</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setSelectedPlan(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={16} />
          <span>Yeni Plan Yarat</span>
        </Button>
      </div>

      <div className="admin-plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className="admin-plan-card">
            <div className="admin-plan-head">
              <h3 className="admin-plan-name">{plan.name}</h3>
              {plan.isPopular && <Badge variant="primary">Məşhur</Badge>}
            </div>

            <div className="admin-plan-price">
              {plan.monthlyPrice} AZN <span>/ ay</span>
            </div>

            <div className="admin-plan-rates">
              <div>Komissiya: <strong>{plan.commissionRate}%</strong></div>
              <div>Tur Limiti: <strong>{plan.maxTours === -1 ? 'Limitsiz' : plan.maxTours}</strong></div>
            </div>

            <ul className="admin-plan-feats">
              {plan.features.map((f, i) => (
                <li key={i}>
                  <CheckCircle2 size={14} color="var(--color-success)" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="admin-plan-actions">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedPlan(plan);
                  setIsModalOpen(true);
                }}
                style={{ flex: 1 }}
              >
                <Edit3 size={14} />
                <span>Redaktə Et</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(plan.id)}
                style={{ color: 'var(--color-error)' }}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <PlanModal
        plan={selectedPlan}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadPlans}
      />
    </div>
  );
};
