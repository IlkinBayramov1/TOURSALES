import React, { useEffect, useState } from 'react';
import { Button, Spinner, Badge } from '@toursales/ui';
import { SubscriptionPlan } from '@toursales/types';
import { vendorFinanceApi, CurrentSubscriptionInfo } from '../../vendorFinanceApi';
import { SubscriptionUsageCard } from '../../components/SubscriptionUsageCard/SubscriptionUsageCard';
import { PlanUpgradeModal } from '../../components/PlanUpgradeModal/PlanUpgradeModal';
import { PlanComparisonMatrix } from '../../components/PlanComparisonMatrix/PlanComparisonMatrix';
import { BillingInvoicesTable } from '../../components/BillingInvoicesTable/BillingInvoicesTable';
import { InvoicePrintModal } from '../../components/InvoicePrintModal/InvoicePrintModal';
import { SubscriptionFaq } from '../../components/SubscriptionFaq/SubscriptionFaq';
import { CheckCircle2, ArrowLeft, Sparkles, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import './SubscriptionPage.css';

export const SubscriptionPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<CurrentSubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Billing Cycle Toggle
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  // Modals state
  const [selectedTargetPlan, setSelectedTargetPlan] = useState<SubscriptionPlan | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, subData] = await Promise.all([
        vendorFinanceApi.getSubscriptions(),
        vendorFinanceApi.getCurrentSubscription(),
      ]);
      setPlans(plansData);
      setCurrentSub(subData);
    } catch (err) {
      console.error('Abunəlik planları yüklənmədi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenUpgradeModal = (plan: SubscriptionPlan) => {
    setSelectedTargetPlan(plan);
    setIsUpgradeModalOpen(true);
  };

  const currentPlanId = currentSub?.planId;

  return (
    <div className="subscription-page">
      {/* Top Breadcrumb Navigation */}
      <div className="sub-top-nav">
        <Link to="/finance" className="sub-back-link">
          <ArrowLeft size={16} />
          <span>Maliyyə & Hesablaşma Səhifəsinə Qayıt</span>
        </Link>
      </div>

      {/* Main Header */}
      <div className="sub-header">
        <div className="sub-header-badge">
          <Sparkles size={16} />
          <span>Şirkət Tarifləri & Hesablaşma Sistemi</span>
        </div>
        <h1>Abunəlik və Hesablaşma İdarəetməsi</h1>
        <p>
          Agentliyinizin biznes miqyasına uyğun planı seçin, istifadə limitlərinizi izləyin və rəsmi fakturalarınızı idarə edin
        </p>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="sub-success-banner">
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="sub-loading-wrap">
          <Spinner size="lg" />
          <p>Məlumatlar hazırlanır...</p>
        </div>
      ) : (
        <>
          {/* 1. Current Subscription & Usage Widget */}
          {currentSub && (
            <SubscriptionUsageCard
              subscription={currentSub}
              onRefresh={() => {
                loadData();
                setRefreshCounter((c) => c + 1);
              }}
            />
          )}

          {/* 2. Billing Cycle Toggle (Monthly vs Yearly) */}
          <div className="sub-billing-toggle-container">
            <div className="sub-billing-toggle-pill">
              <button
                type="button"
                className={`sub-cycle-btn ${billingCycle === 'MONTHLY' ? 'active' : ''}`}
                onClick={() => setBillingCycle('MONTHLY')}
              >
                Aylıq Hesablaşma
              </button>
              <button
                type="button"
                className={`sub-cycle-btn ${billingCycle === 'YEARLY' ? 'active' : ''}`}
                onClick={() => setBillingCycle('YEARLY')}
              >
                <span>İllik Hesablaşma</span>
                <span className="sub-save-badge">20% Qənaət</span>
              </button>
            </div>
          </div>

          {/* 3. Subscription Plans Grid */}
          <div className="plans-grid">
            {plans.map((plan) => {
              const isCurrent = currentPlanId === plan.id;
              const monthly = plan.monthlyPrice;
              const displayMonthly =
                billingCycle === 'YEARLY' && monthly > 0
                  ? Math.round(monthly * 0.8)
                  : monthly;
              const annualTotal = Math.round(monthly * 12 * 0.8);

              return (
                <div
                  key={plan.id}
                  className={`plan-card ${plan.isPopular ? 'featured' : ''} ${isCurrent ? 'active-plan' : ''}`}
                >
                  {plan.isPopular && <div className="popular-badge">Ən Çox Seçilən</div>}
                  {isCurrent && <div className="current-badge">Hazırkı Planınız</div>}

                  <h2 className="plan-name">{plan.name}</h2>
                  <div className="plan-price">
                    <span className="amount">{displayMonthly}</span>
                    <span className="period">{plan.currency || 'AZN'} / ay</span>
                  </div>

                  {billingCycle === 'YEARLY' && monthly > 0 && (
                    <div className="plan-annual-sub">
                      İllik cəmi: <strong>{annualTotal} AZN</strong> (2 ay pulsuz)
                    </div>
                  )}

                  <div className="plan-comm-tag">
                    Daxili Komissiya: <strong>{plan.commissionRate ?? 5}%</strong>
                  </div>

                  <ul className="plan-features">
                    {plan.features?.map((feat, idx) => (
                      <li key={idx}>
                        <Check size={16} className="check" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={isCurrent ? 'secondary' : plan.isPopular ? 'primary' : 'outline'}
                    style={{ width: '100%' }}
                    disabled={isCurrent}
                    onClick={() => handleOpenUpgradeModal(plan)}
                  >
                    {isCurrent ? 'Hazırkı Planınız' : 'Bu Plana Keç'}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* 4. Full Feature Comparison Matrix */}
          <PlanComparisonMatrix currentPlanId={currentPlanId} />

          {/* 5. Invoices & Billing History Table */}
          <BillingInvoicesTable
            onViewInvoice={(paymentId) => setSelectedPaymentId(paymentId)}
            refreshKey={refreshCounter}
          />

          {/* 6. FAQ Accordion */}
          <SubscriptionFaq />
        </>
      )}

      {/* Upgrade / Confirmation Modal */}
      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        targetPlan={selectedTargetPlan}
        currentSubscription={currentSub}
        billingCycle={billingCycle}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSuccess={(msg) => {
          setSuccessMsg(msg);
          loadData();
          setRefreshCounter((c) => c + 1);
          setTimeout(() => setSuccessMsg(null), 5000);
        }}
      />

      {/* Printable Invoice Modal */}
      <InvoicePrintModal
        isOpen={!!selectedPaymentId}
        paymentId={selectedPaymentId}
        onClose={() => setSelectedPaymentId(null)}
      />
    </div>
  );
};
