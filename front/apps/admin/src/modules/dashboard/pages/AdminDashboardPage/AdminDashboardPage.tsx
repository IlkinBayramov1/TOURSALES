import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge, Spinner } from '@toursales/ui';
import {
  DollarSign,
  TrendingUp,
  Building2,
  Users,
  ShieldCheck,
  MoreHorizontal,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Award
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { StatCard } from '@/shared/components';
import { adminDashboardApi, AdminStats } from '../../adminDashboardApi';
import './AdminDashboardPage.css';

const DUAL_CHART_DATA = [
  { month: 'Yan', gmv: 42000, commission: 4200 },
  { month: 'Fev', gmv: 58000, commission: 5800 },
  { month: 'Mar', gmv: 74000, commission: 7400 },
  { month: 'Apr', gmv: 96000, commission: 9600 },
  { month: 'May', gmv: 135000, commission: 13500 },
  { month: 'İyn', gmv: 184000, commission: 18400 },
  { month: 'İyl', gmv: 240000, commission: 24000 },
];

const TOP_OPERATORS = [
  { id: 1, name: 'Baku Global Elite Travel', gmv: '124,500 ₼', commission: '12,450 ₼', tours: 42, status: 'VERIFIED' },
  { id: 2, name: 'TechTrade Solutions MMC', gmv: '98,200 ₼', commission: '9,820 ₼', tours: 28, status: 'VERIFIED' },
  { id: 3, name: 'EuroPassport Premium', gmv: '84,000 ₼', commission: '8,400 ₼', tours: 18, status: 'VERIFIED' },
  { id: 4, name: 'Eco Tourism Azerbaijan', gmv: '46,300 ₼', commission: '4,630 ₼', tours: 34, status: 'VERIFIED' },
];

const AdminCustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="admin-chart-tooltip">
        <span className="admin-tooltip-month">{label}</span>
        <div className="admin-tooltip-row">
          <span className="dot-gmv" />
          <span>Ümumi Dövriyyə:</span>
          <strong>{payload[0].value?.toLocaleString()} ₼</strong>
        </div>
        <div className="admin-tooltip-row">
          <span className="dot-comm" />
          <span>Xalis Komissiya:</span>
          <strong>{payload[1]?.value?.toLocaleString()} ₼</strong>
        </div>
      </div>
    );
  }
  return null;
};

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await adminDashboardApi.getStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="admin-dashboard-page">

      {/* 1. Global KPI Metrics */}
      <div className="admin-stats-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Ümumi Dövriyyə (GMV)</span>
            <div className="admin-kpi-icon box-blue"><DollarSign size={20} /></div>
          </div>
          <h2 className="admin-kpi-val">
            {(stats?.totalTurnover || 684200).toLocaleString('az-AZ')} <span>₼</span>
          </h2>
          <div className="admin-kpi-badge trend-up">
            <ArrowUpRight size={14} /> +18.4% bu ay
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Platforma Xalis Komissiyası</span>
            <div className="admin-kpi-icon box-emerald"><TrendingUp size={20} /></div>
          </div>
          <h2 className="admin-kpi-val">
            {(stats?.totalCommissions || 68420).toLocaleString('az-AZ')} <span>₼</span>
          </h2>
          <div className="admin-kpi-badge trend-up">
            <ArrowUpRight size={14} /> +14.2% xalis gəlir
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Aktiv Turizm Agentlikləri</span>
            <div className="admin-kpi-icon box-purple"><Building2 size={20} /></div>
          </div>
          <h2 className="admin-kpi-val">{stats?.activeCompanies || 48}</h2>
          <div className="admin-kpi-badge trend-neutral">
            <ShieldCheck size={14} /> 48 lisenziyalı partnyor
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Ümumi Satılmış Biletlər</span>
            <div className="admin-kpi-icon box-orange"><Users size={20} /></div>
          </div>
          <h2 className="admin-kpi-val">
            {(stats?.totalBookings || 8920).toLocaleString('az-AZ')}
          </h2>
          <div className="admin-kpi-badge trend-neutral">
            186 aktiv tur üzrə
          </div>
        </div>
      </div>

      {/* 2. Urgent Action Banners */}
      <div className="admin-alerts-banner">
        <div className="alert-action-card warning">
          <div className="alert-action-info">
            <div className="alert-badge-pill warning">Təcili Verifikasiya</div>
            <h4>Təsdiq Gözləyən Agentliklər ({stats?.pendingVerifications || 3})</h4>
            <p>Yeni turizm şirkətləri VÖEN və lisenziya yoxlanışı üçün müraciət edib.</p>
          </div>
          <Link to="/companies">
            <Button variant="primary" size="sm">
              Nəzərdən Keçir <ChevronRight size={14} />
            </Button>
          </Link>
        </div>

        <div className="alert-action-card danger">
          <div className="alert-action-info">
            <div className="alert-badge-pill danger">Maliyyə Çıxarışı</div>
            <h4>Gözləmədəki Pul Çıxarışları ({stats?.pendingPayoutsCount || 5})</h4>
            <p>
              Cəmi {(stats?.pendingPayoutsAmount || 18450).toLocaleString()} AZN məbləğində bank çıxarışı təsdiq gözləyir.
            </p>
          </div>
          <Link to="/finance-audit">
            <Button variant="secondary" size="sm">
              Çıxarışları İdarə Et <ChevronRight size={14} />
            </Button>
          </Link>
        </div>
      </div>

      {/* 3. Recharts Dual AreaChart (GMV vs Net Commission) */}
      <div className="admin-chart-section-card">
        <div className="admin-chart-header">
          <div>
            <h3 className="admin-chart-title">Platforma Dövriyyəsi & Gəlir Dinamikası</h3>
            <p className="admin-chart-sub">Ümumi bilet satışı (GMV) və 10% platforma komissiyasının müqayisəli qrafiki</p>
          </div>
          <div className="admin-chart-legend-pills">
            <span className="legend-pill gmv"><span className="legend-dot gmv" /> Ümumi Dövriyyə</span>
            <span className="legend-pill comm"><span className="legend-dot comm" /> Xalis Komissiya</span>
          </div>
        </div>

        <div className="admin-recharts-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={DUAL_CHART_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="adminColorGMV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#635bff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#635bff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="adminColorComm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k₼`} />
              <RechartsTooltip content={<AdminCustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="gmv" stroke="#635bff" strokeWidth={3} fillOpacity={1} fill="url(#adminColorGMV)" />
              <Area type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#adminColorComm)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Top Operators Leaderboard */}
      <div className="admin-leaderboard-card">
        <div className="admin-card-header">
          <div>
            <h3 className="admin-card-title">Top Tərəfdaş Turizm Agentlikləri</h3>
            <p className="admin-card-sub">Bilet dövriyyəsi və komissiya payına görə ən aktiv şirkətlər</p>
          </div>
          <Link to="/companies" className="admin-link-all">
            Bütün Agentliklər ({stats?.activeCompanies || 48})
          </Link>
        </div>

        <div className="admin-leaderboard-table-wrap">
          <table className="admin-leaderboard-table">
            <thead>
              <tr>
                <th>Agentlik Adı</th>
                <th>Aktiv Turlar</th>
                <th>Ümumi Dövriyyə</th>
                <th>Komissiya Gəliri</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {TOP_OPERATORS.map((op) => (
                <tr key={op.id}>
                  <td>
                    <div className="admin-op-cell">
                      <div className="admin-op-avatar"><Building2 size={16} /></div>
                      <span className="admin-op-name">{op.name}</span>
                    </div>
                  </td>
                  <td><strong>{op.tours} tur</strong></td>
                  <td><strong className="text-gmv">{op.gmv}</strong></td>
                  <td><strong className="text-comm">{op.commission}</strong></td>
                  <td>
                    <span className="admin-verified-tag">
                      <ShieldCheck size={12} /> Təsdiqlənib
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
