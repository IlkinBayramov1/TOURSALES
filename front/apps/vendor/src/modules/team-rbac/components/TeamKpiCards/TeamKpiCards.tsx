import React from 'react';
import { TeamKpis } from '../../teamApi';
import { Users, ShieldCheck, Calculator, Compass } from 'lucide-react';
import './TeamKpiCards.css';

interface TeamKpiCardsProps {
  kpis: TeamKpis;
}

export const TeamKpiCards: React.FC<TeamKpiCardsProps> = ({ kpis }) => {
  return (
    <div className="team-kpis-grid">
      <div className="team-kpi-card total">
        <div className="team-kpi-header">
          <span className="team-kpi-title">Cəmi Əməkdaşlar</span>
          <div className="team-kpi-icon total">
            <Users size={20} />
          </div>
        </div>
        <div className="team-kpi-val">{kpis.total}</div>
        <div className="team-kpi-sub">Şirkətin aktiv heyəti</div>
      </div>

      <div className="team-kpi-card manager">
        <div className="team-kpi-header">
          <span className="team-kpi-title">Menecerlər (Manager)</span>
          <div className="team-kpi-icon manager">
            <ShieldCheck size={20} />
          </div>
        </div>
        <div className="team-kpi-val">{kpis.managers}</div>
        <div className="team-kpi-sub">Tur & sifariş idarəetməsi</div>
      </div>

      <div className="team-kpi-card accountant">
        <div className="team-kpi-header">
          <span className="team-kpi-title">Mühasiblər (Accountant)</span>
          <div className="team-kpi-icon accountant">
            <Calculator size={20} />
          </div>
        </div>
        <div className="team-kpi-val">{kpis.accountants}</div>
        <div className="team-kpi-sub">Maliyyə, çıxarış & fakturalar</div>
      </div>

      <div className="team-kpi-card guide">
        <div className="team-kpi-header">
          <span className="team-kpi-title">Bələdçilər (Guide)</span>
          <div className="team-kpi-icon guide">
            <Compass size={20} />
          </div>
        </div>
        <div className="team-kpi-val">{kpis.guides}</div>
        <div className="team-kpi-sub">QR bilet yoxlanışı & minik</div>
      </div>
    </div>
  );
};
