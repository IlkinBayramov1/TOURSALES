import React from 'react';
import { Check, Minus } from 'lucide-react';
import './PlanComparisonMatrix.css';

interface PlanComparisonMatrixProps {
  currentPlanId?: string | null;
}

export const PlanComparisonMatrix: React.FC<PlanComparisonMatrixProps> = ({ currentPlanId }) => {
  const featuresList = [
    {
      name: 'Maksimum Aktiv Tur Sayı',
      starter: '5 Tur',
      pro: '50 Tur',
      enterprise: 'Limitsiz',
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
      name: 'Kənar Sayt və Tərəfdaş API İnteqrasiyası',
      starter: false,
      pro: '2 API Açar',
      enterprise: 'Limitsiz Açar',
    },
    {
      name: 'Platforma Reklam Kampaniyalarında Endirim',
      starter: '0%',
      pro: '10% Endirim',
      enterprise: '25% Endirim',
    },
    {
      name: 'Müştəri və Partnyor Dəstəyi',
      starter: 'E-poçt (24 saat)',
      pro: '24/7 Prioritetli Çat',
      enterprise: 'Fərdi Hesab Meneceri',
    },
    {
      name: 'Maliyyə və Vergi e-Qaimə İnteqrasiyası',
      starter: false,
      pro: false,
      enterprise: true,
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
              <th className={`col-plan ${currentPlanId === 'SP-STARTER' ? 'active-col' : ''}`}>
                <div className="matrix-th-name">Başlanğıc (Starter)</div>
                <div className="matrix-th-price">0 AZN / ay</div>
              </th>
              <th className={`col-plan ${currentPlanId === 'SP-PRO' ? 'active-col' : ''}`}>
                <div className="matrix-th-name">Peşəkar (Pro)</div>
                <div className="matrix-th-price">49 AZN / ay</div>
              </th>
              <th className={`col-plan ${currentPlanId === 'SP-ENTERPRISE' ? 'active-col' : ''}`}>
                <div className="matrix-th-name">Korporativ (Enterprise)</div>
                <div className="matrix-th-price">149 AZN / ay</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {featuresList.map((row, idx) => (
              <tr key={idx}>
                <td className="col-feature font-medium">{row.name}</td>
                <td className={`col-plan ${currentPlanId === 'SP-STARTER' ? 'active-col' : ''}`}>
                  {renderVal(row.starter)}
                </td>
                <td className={`col-plan ${currentPlanId === 'SP-PRO' ? 'active-col' : ''}`}>
                  {renderVal(row.pro)}
                </td>
                <td className={`col-plan ${currentPlanId === 'SP-ENTERPRISE' ? 'active-col' : ''}`}>
                  {renderVal(row.enterprise)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
