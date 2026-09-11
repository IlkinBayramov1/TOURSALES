import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  Ticket, 
  Map, 
  TrendingUp, 
  Calendar, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  Globe, 
  Bus, 
  CheckCircle2, 
  Clock,
  Activity
} from 'lucide-react';
import { Spinner } from '@toursales/ui';
import { RevenueChart } from '../../components/RevenueChart/RevenueChart';
import { SalesDistributionChart } from '../../components/SalesDistributionChart/SalesDistributionChart';
import { RecentBookingsTable } from '../../components/RecentBookingsTable/RecentBookingsTable';
import { vendorDashboardApi, VendorStats } from '../../api/vendorDashboardApi';
import './DashboardPage.css';

const POPULAR_DESTINATIONS = [
  { name: 'İstanbul (Macəra)', type: 'xarici', tickets: 342, revenue: '12,500 ₼', percent: 85, color: '#635bff' },
  { name: 'Şahdağ (Həftəsonu)', type: 'daxili', tickets: 415, revenue: '8,300 ₼', percent: 65, color: '#0ea5e9' },
  { name: 'Avropa Turu', type: 'xarici', tickets: 120, revenue: '9,400 ₼', percent: 50, color: '#10b981' },
  { name: 'Qəbələ - Oğuz', type: 'daxili', tickets: 290, revenue: '4,200 ₼', percent: 35, color: '#f59e0b' },
];

const ACTIVITIES = [
  {
    id: 1,
    title: 'Yeni Bilet Satışı',
    time: '2 dəq əvvəl',
    desc: 'Cavid Əliyev "İstanbul Turu" üçün bilet aldı.',
    type: 'success',
    icon: CheckCircle2,
  },
  {
    id: 2,
    title: 'Beh Ödənişi',
    time: '15 dəq əvvəl',
    desc: 'Aysel M. "Şahdağ Turu" üçün 5 AZN beh ödədi.',
    type: 'warning',
    icon: Clock,
  },
  {
    id: 3,
    title: 'Check-in Təsdiqi',
    time: '1 saat əvvəl',
    desc: 'Bələdçi (T-809) Quba turu üçün sərnişinləri bortda qeyd etdi.',
    type: 'primary',
    icon: Ticket,
  },
  {
    id: 4,
    title: 'Payout Göndərildi',
    time: 'Dünən',
    desc: 'Platformadan rəsmi hesabınıza 4,250 AZN köçürüldü.',
    type: 'success',
    icon: DollarSign,
  },
];

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState('Bu Ay');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await vendorDashboardApi.getStats();
        setStats(res.data);
      } catch (err) {
        console.error('Statistika yüklənərkən xəta:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const totalRevenue = stats?.totalRevenue || 24590;
  const totalBookings = stats?.totalBookingsCount || 1284;
  const activeTours = stats?.activeToursCount || 36;
  const pendingDeposits = 3450;

  return (
    <div className="vendor-dashboard-container">
      {/* Top Filter Bar */}
      <div className="vendor-dashboard-topbar">
        <div>
          <h1 className="vendor-dash-title">Analitika və İdarəetmə Paneli</h1>
          <p className="vendor-dash-subtitle">
            Real vaxt (real-time) satış dinamikası, gəlir statistikası və fəaliyyət xülasəniz.
          </p>
        </div>

        <div className="vendor-topbar-actions">
          <div className="vendor-date-selector">
            <Calendar size={16} className="vendor-date-icon" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="vendor-date-select"
            >
              <option>Bu Gün</option>
              <option>Bu Həftə</option>
              <option>Bu Ay</option>
              <option>Bu İl</option>
            </select>
          </div>

          <button type="button" className="vendor-btn-export">
            <Download size={15} />
            <span>İxrac Et</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="vendor-dashboard-loading">
          <Spinner size="lg" />
          <p>Məlumatlar hesablanır...</p>
        </div>
      ) : (
        <div className="vendor-dash-content-grid">
          {/* 1. TOP KPI CARDS */}
          <div className="vendor-kpi-grid">
            <div className="vendor-kpi-card">
              <div className="vendor-kpi-header">
                <span className="vendor-kpi-label">Ümumi Gəlir</span>
                <div className="vendor-kpi-iconbox box-blue">
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="vendor-kpi-body">
                <h2 className="vendor-kpi-value">
                  {totalRevenue.toLocaleString()} <span className="vendor-currency">₼</span>
                </h2>
                <div className="vendor-kpi-trend trend-up">
                  <ArrowUpRight size={15} />
                  <span>+12.5%</span>
                  <span className="trend-text">keçən aya nisbətən</span>
                </div>
              </div>
            </div>

            <div className="vendor-kpi-card">
              <div className="vendor-kpi-header">
                <span className="vendor-kpi-label">Satılmış Biletlər</span>
                <div className="vendor-kpi-iconbox box-green">
                  <Ticket size={20} />
                </div>
              </div>
              <div className="vendor-kpi-body">
                <h2 className="vendor-kpi-value">{totalBookings.toLocaleString()}</h2>
                <div className="vendor-kpi-trend trend-up">
                  <ArrowUpRight size={15} />
                  <span>+8.2%</span>
                  <span className="trend-text">keçən aya nisbətən</span>
                </div>
              </div>
            </div>

            <div className="vendor-kpi-card">
              <div className="vendor-kpi-header">
                <span className="vendor-kpi-label">Aktiv Turlar</span>
                <div className="vendor-kpi-iconbox box-purple">
                  <Map size={20} />
                </div>
              </div>
              <div className="vendor-kpi-body">
                <h2 className="vendor-kpi-value">{activeTours}</h2>
                <div className="vendor-kpi-trend trend-neutral">
                  <Activity size={15} />
                  <span className="trend-text">12 Daxili, 24 Xarici</span>
                </div>
              </div>
            </div>

            <div className="vendor-kpi-card">
              <div className="vendor-kpi-header">
                <span className="vendor-kpi-label">Gözləyən Behlər</span>
                <div className="vendor-kpi-iconbox box-orange">
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="vendor-kpi-body">
                <h2 className="vendor-kpi-value">
                  {pendingDeposits.toLocaleString()} <span className="vendor-currency">₼</span>
                </h2>
                <div className="vendor-kpi-trend trend-down">
                  <ArrowDownRight size={15} />
                  <span>-2.1%</span>
                  <span className="trend-text">ödənişlər tamamlanır</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. RECHARTS MIDDLE SECTION */}
          <div className="vendor-middle-chart-grid">
            <div className="vendor-chart-area-left">
              <RevenueChart data={stats?.monthlyRevenue || []} />
            </div>
            <div className="vendor-chart-donut-right">
              <SalesDistributionChart totalTickets={totalBookings} />
            </div>
          </div>

          {/* 3. BOTTOM SECTION: POPULAR DESTINATIONS & LIVE ACTIVITY STREAM */}
          <div className="vendor-bottom-content-grid">
            {/* Top Destinations */}
            <div className="vendor-destinations-card">
              <div className="vendor-card-header">
                <div>
                  <h3 className="vendor-card-title">Ən Populyar İstiqamətlər</h3>
                  <p className="vendor-card-subtitle">Gəlir və bilet sayına görə sıralama</p>
                </div>
              </div>

              <div className="vendor-bar-list">
                {POPULAR_DESTINATIONS.map((item, i) => (
                  <div key={i} className="vendor-bar-item">
                    <div className="vendor-bar-header">
                      <div className="vendor-bar-title-group">
                        {item.type === 'xarici' ? (
                          <Globe size={14} className="vendor-bar-type-icon" />
                        ) : (
                          <Bus size={14} className="vendor-bar-type-icon" />
                        )}
                        <span className="vendor-bar-name">{item.name}</span>
                      </div>
                      <span className="vendor-bar-revenue">{item.revenue}</span>
                    </div>
                    <div className="vendor-bar-track">
                      <div
                        className="vendor-bar-fill"
                        style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                      />
                    </div>
                    <span className="vendor-bar-subtext">{item.tickets} bilet satılıb</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Stream */}
            <div className="vendor-activity-card">
              <div className="vendor-card-header">
                <h3 className="vendor-card-title">Canlı Fəaliyyət Axını</h3>
                <span className="vendor-live-pill">Real-time</span>
              </div>

              <div className="vendor-activity-stream">
                {ACTIVITIES.map((act) => {
                  const IconComp = act.icon;
                  return (
                    <div key={act.id} className="vendor-stream-item">
                      <div className={`vendor-stream-icon icon-${act.type}`}>
                        <IconComp size={15} />
                      </div>
                      <div className="vendor-stream-content">
                        <p className="vendor-stream-title">
                          {act.title} <span className="vendor-stream-time">{act.time}</span>
                        </p>
                        <p className="vendor-stream-desc">{act.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. RECENT BOOKINGS TABLE */}
          <div className="vendor-recent-bookings-block">
            <RecentBookingsTable
              bookings={stats?.recentBookings || []}
              isLoading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
};
