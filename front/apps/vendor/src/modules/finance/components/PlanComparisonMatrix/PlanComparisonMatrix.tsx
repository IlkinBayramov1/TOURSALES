import React from 'react';
import { Check, Minus, ArrowRight, ShieldCheck } from 'lucide-react';
import './PlanComparisonMatrix.css';

interface PlanComparisonMatrixProps {
  currentPlanId?: string | null;
  onSelectPlan?: (planId: string) => void;
}

export const PlanComparisonMatrix: React.FC<PlanComparisonMatrixProps> = ({
  currentPlanId,
  onSelectPlan,
}) => {
  const featuresList = [
    {
      name: 'Maksimum Aktiv Tur Sayı',
      starter: '5 Tur',
      pro: '50 Tur',
      enterprise: 'Limitsiz',
    },
    {
      name: 'Komanda Əməkdaş Hesabları',
      starter: '1 Əməkdaş',
      pro: '5 Əməkdaş',
      enterprise: 'Limitsiz Əməkdaş',
    },
    {
      name: 'Kənar Sayt və Tərəfdaş API İnteqrasiyası',
      starter: false,
      pro: '2 API Açar',
      enterprise: 'Limitsiz Açar',
    },
    {
      name: 'Platforma Komissiyası (Daxili / Xarici)',
      starter: '8% / 10%',
      pro: '5% / 7%',
      enterprise: '3% / 5%',
    },
    {
      name: 'Avtobus İnteraktiv Oturacaq Seçimi',
      starter: false,
      pro: true,
      enterprise: true,
    },
    {
      name: 'FİN Kod ilə Sərnişin Manifesti (Roster)',
      starter: false,
      pro: true,
      enterprise: true,
    },
    {
      name: 'QR Bilet Canlı Minik Skaneri',
      starter: false,
      pro: true,
      enterprise: true,
    },
    {
      name: 'Platforma Reklam Kampaniyalarında Endirim',
      starter: '0%',
      pro: '10% Endirim',
      enterprise: '25% Endirim',
    },
    {
      name: 'Maliyyə və Vergi e-Qaimə İnteqrasiyası',
      starter: false,
      pro: false,
      enterprise: true,
    },
    {
      name: 'Müştəri və Partnyor Dəstəyi',
      starter: 'E-poçt (24 saat)',
      pro: '24/7 Prioritetli Çat',
      enterprise: 'Fərdi Hesab Meneceri',
    },
  ];

  const renderVal = (val: string | boolean) => {
    if (typeof val === 'boolean') {
      return val ? (
        <span className="matrix-check"><Check size={18} /></span>
      ) : (
        <span className="matrix-dash"><Minus size={16} /></span>
      );
    }
    return <span className="matrix-text-val">{val}</span>;
  };

  const isStarter = currentPlanId === 'SP-STARTER';
  const isPro = currentPlanId === 'SP-PRO';
  const isEnterprise = currentPlanId === 'SP-ENTERPRISE';

  return (
    <div className="plan-matrix-card">
      <div className="plan-matrix-header">
        <h3>Planların Müqayisə Cədvəli</h3>
        <p>Bütün texniki və kommersiya imkanlarını müqayisə edin və ən uyğun paketi seçin</p>
      </div>

      <div className="plan-matrix-table-wrap">
        <table className="plan-matrix-table">
          <thead>
            <tr>
              <th className="col-feature">Funksionallıq & İmkan</th>
              <th className={`col-plan ${isStarter ? 'active-col' : ''}`}>
                <div className="matrix-th-name">Başlanğıc (Starter)</div>
                <div className="matrix-th-price">0 AZN / ay</div>
              </th>
              <th className={`col-plan ${isPro ? 'active-col' : ''}`}>
                <div className="matrix-th-name">Peşəkar (Pro)</div>
                <div className="matrix-th-price">49 AZN / ay</div>
              </th>
              <th className={`col-plan ${isEnterprise ? 'active-col' : ''}`}>
                <div className="matrix-th-name">Korporativ (Enterprise)</div>
                <div className="matrix-th-price">149 AZN / ay</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {featuresList.map((row, idx) => (
              <tr key={idx}>
                <td className="col-feature font-medium">{row.name}</td>
                <td className={`col-plan ${isStarter ? 'active-col' : ''}`}>
                  {renderVal(row.starter)}
                </td>
                <td className={`col-plan ${isPro ? 'active-col' : ''}`}>
                  {renderVal(row.pro)}
                </td>
                <td className={`col-plan ${isEnterprise ? 'active-col' : ''}`}>
                  {renderVal(row.enterprise)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="matrix-actions-row">
              <td className="col-feature">
                <span className="matrix-tfoot-label">Paketi Dəyişdir:</span>
              </td>
              <td className={`col-plan ${isStarter ? 'active-col' : ''}`}>
                <button
                  type="button"
                  className={`matrix-select-btn ${isStarter ? 'current' : 'outline'}`}
                  disabled={isStarter}
                  onClick={() => onSelectPlan?.('SP-STARTER')}
                >
                  {isStarter ? 'Hazırkı Plan' : 'Başlanğıca Keç'}
                </button>
              </td>
              <td className={`col-plan ${isPro ? 'active-col' : ''}`}>
                <button
                  type="button"
                  className={`matrix-select-btn ${isPro ? 'current' : 'primary'}`}
                  disabled={isPro}
                  onClick={() => onSelectPlan?.('SP-PRO')}
                >
                  {isPro ? 'Hazırkı Plan' : 'Pro-ya Yüksəlt'}
                </button>
              </td>
              <td className={`col-plan ${isEnterprise ? 'active-col' : ''}`}>
                <button
                  type="button"
                  className={`matrix-select-btn ${isEnterprise ? 'current' : 'enterprise'}`}
                  disabled={isEnterprise}
                  onClick={() => onSelectPlan?.('SP-ENTERPRISE')}
                >
                  {isEnterprise ? 'Hazırkı Plan' : 'Korporativə Keç'}
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
