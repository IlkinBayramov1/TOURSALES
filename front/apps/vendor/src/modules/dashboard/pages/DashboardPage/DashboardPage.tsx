import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Activity,
  RefreshCw,
  PlusCircle,
  QrCode,
  Wallet,
  Users,
  Percent
} from 'lucide-react';
import { Spinner } from '@toursales/ui';
import { RevenueChart } from '../../components/RevenueChart/RevenueChart';
import { SalesDistributionChart } from '../../components/SalesDistributionChart/SalesDistributionChart';
import { RecentBookingsTable } from '../../components/RecentBookingsTable/RecentBookingsTable';
import { vendorDashboardApi, VendorStats } from '../../api/vendorDashboardApi';
import './DashboardPage.css';

const PERIOD_MAP: Record<string, string> = {
  'Bu Gün': 'today',
  'Bu Həftə': 'week',
  'Bu Ay': 'month',
  'Bu İl': 'year',
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState('Bu Ay');

  const fetchStats = useCallback(async (period: string, isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const res = await vendorDashboardApi.getStats(period);
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Statistika yüklənərkən xəta:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const period = PERIOD_MAP[dateRange] || 'month';
    fetchStats(period);
  }, [dateRange, fetchStats]);

  const handleRefresh = () => {
    const period = PERIOD_MAP[dateRange] || 'month';
    fetchStats(period, true);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const period = PERIOD_MAP[dateRange] || 'month';
      await vendorDashboardApi.exportReport(period);
    } catch (err) {
      console.error('Hesabat ixrac xətası:', err);
      alert('Hesabat ixrac edilərkən xəta baş verdi');
    } finally {
      setIsExporting(false);
    }
  };

  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalBookings = stats?.totalBookingsCount ?? 0;
  const activeTours = stats?.activeToursCount ?? 0;
  const availableBalance = stats?.availableBalance ?? 0;
  const pendingDeposits = stats?.pendingDeposits ?? 0;
  const occupancyRate = stats?.occupancyRate ?? 0;

  return (
    <div className="vendor-dashboard-container">
      {/* Top Filter & Actions Bar */}
      <div className="vendor-dashboard-topbar">
        <div>
          <div className="vendor-title-badge-row">
            <h1 className="vendor-dash-title">
              {stats?.companyName ? `${stats.companyName} — İdarəetmə Paneli` : 'İdarəetmə Paneli'}
            </h1>
            <div className="vendor-occupancy-pill">
              <Percent size={14} />
              <span>Doluluq: <strong>{occupancyRate}%</strong></span>
            </div>
          </div>
          <p className="vendor-dash-subtitle">
            Canlı satış dinamikası, real rezervasiyalar və maliyyə statistikası
          </p>
        </div>

        <div className="vendor-topbar-actions">
          {/* Refresh Button */}
          <button 
            type="button" 
            className={`vendor-btn-refresh ${refreshing ? 'is-spinning' : ''}`}
            onClick={handleRefresh}
            title="Məlumatları yenilə"
            disabled={refreshing || loading}
          >
            <RefreshCw size={15} />
          </button>

          {/* Date Selector */}
          <div className="vendor-date-selector">
            <Calendar size={16} className="vendor-date-icon" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="vendor-date-select"
              disabled={loading}
            >
              <option>Bu Gün</option>
              <option>Bu Həftə</option>
              <option>Bu Ay</option>
              <option>Bu İl</option>
            </select>
          </div>

          {/* Export Button */}
          <button 
            type="button" 
            className="vendor-btn-export"
            onClick={handleExport}
            disabled={isExporting || loading}
          >
            <Download size={15} />
            <span>{isExporting ? 'İxrac olunur...' : 'İxrac Et (Excel)'}</span>
          </button>
        </div>
      </div>

      {/* Quick Action Shortcuts Bar */}
      <div className="vendor-quick-actions-bar">
        <button 
          type="button" 
          className="vendor-quick-action-card" 
          onClick={() => navigate('/tours/create')}
        >
          <div className="quick-action-icon qa-purple">
            <PlusCircle size={20} />
          </div>
          <div className="quick-action-text">
            <strong>Yeni Tur Yarat</strong>
            <span>Daxili və ya xarici tur əlavə et</span>
          </div>
        </button>

        <button 
          type="button" 
          className="vendor-quick-action-card" 
          onClick={() => navigate('/bookings')}
        >
          <div className="quick-action-icon qa-blue">
            <QrCode size={20} />
          </div>
          <div className="quick-action-text">
            <strong>Bilet Yoxlanışı (Minik)</strong>
            <span>QR kod ilə sərnişin qeydiyyatı</span>
          </div>
        </button>

        <button 
          type="button" 
          className="vendor-quick-action-card" 
          onClick={() => navigate('/finance')}
        >
          <div className="quick-action-icon qa-green">
            <Wallet size={20} />
          </div>
          <div className="quick-action-text">
            <strong>Balans və Çıxarış</strong>
            <span>Mövcud: {availableBalance.toLocaleString()} ₼</span>
          </div>
        </button>

        <button 
          type="button" 
          className="vendor-quick-action-card" 
          onClick={() => navigate('/bookings')}
        >
          <div className="quick-action-icon qa-orange">
            <Users size={20} />
          </div>
          <div className="quick-action-text">
            <strong>Sərnişin Manifesti</strong>
            <span>{stats?.totalSeatsSold ?? 0} satılmış yer</span>
          </div>
        </button>
      </div>

      {loading ? (
        <div className="vendor-dashboard-loading">
          <Spinner size="lg" />
          <p>Məlumatlar bazadan hesablanır...</p>
        </div>
      ) : (
        <div className="vendor-dash-content-grid">
          {/* 1. TOP KPI CARDS */}
          <div className="vendor-kpi-grid">
            {/* KPI 1: Ümumi Gəlir */}
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
                <div className={`vendor-kpi-trend ${(stats?.revenueGrowth ?? 0) >= 0 ? 'trend-up' : 'trend-down'}`}>
                  {(stats?.revenueGrowth ?? 0) >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                  <span>{(stats?.revenueGrowth ?? 0) > 0 ? `+${stats?.revenueGrowth}` : `${stats?.revenueGrowth ?? 0}`}%</span>
                  <span className="trend-text">
                    {dateRange === 'Bu Gün'
                      ? 'dünənə nisbətən'
                      : dateRange === 'Bu Həftə'
                      ? 'keçən həftəyə nisbətən'
                      : dateRange === 'Bu İl'
                      ? 'keçən ilə nisbətən'
                      : 'keçən aya nisbətən'}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 2: Satılmış Biletlər */}
            <div className="vendor-kpi-card">
              <div className="vendor-kpi-header">
                <span className="vendor-kpi-label">Satılmış Biletlər</span>
                <div className="vendor-kpi-iconbox box-green">
                  <Ticket size={20} />
                </div>
              </div>
              <div className="vendor-kpi-body">
                <h2 className="vendor-kpi-value">{totalBookings.toLocaleString()}</h2>
                <div className={`vendor-kpi-trend ${(stats?.bookingsGrowth ?? 0) >= 0 ? 'trend-up' : 'trend-down'}`}>
                  {(stats?.bookingsGrowth ?? 0) >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                  <span>{(stats?.bookingsGrowth ?? 0) > 0 ? `+${stats?.bookingsGrowth}` : `${stats?.bookingsGrowth ?? 0}`}%</span>
                  <span className="trend-text">
                    ({stats?.totalSeatsSold ?? 0} sərnişin yeri)
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 3: Aktiv Turlar */}
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
                  <span className="trend-text">
                    {stats?.domesticToursCount ?? 0} Daxili, {stats?.foreignToursCount ?? 0} Xarici
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 4: Mövcud Balans */}
            <div className="vendor-kpi-card">
              <div className="vendor-kpi-header">
                <span className="vendor-kpi-label">Mövcud Balans</span>
                <div className="vendor-kpi-iconbox box-orange">
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="vendor-kpi-body">
                <h2 className="vendor-kpi-value">
                  {availableBalance.toLocaleString()} <span className="vendor-currency">₼</span>
                </h2>
                <div className="vendor-kpi-trend trend-neutral">
                  <Clock size={15} />
                  <span className="trend-text">
                    Gözləyən: {pendingDeposits.toLocaleString()} ₼
                  </span>
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
              <SalesDistributionChart 
                data={stats?.salesDistribution || []} 
                totalTickets={stats?.totalSeatsSold || totalBookings} 
              />
            </div>
          </div>

          {/* 3. BOTTOM SECTION: POPULAR DESTINATIONS & LIVE ACTIVITY STREAM */}
          <div className="vendor-bottom-content-grid">
            {/* Top Destinations */}
            <div className="vendor-destinations-card">
              <div className="vendor-card-header">
                <div>
                  <h3 className="vendor-card-title">Ən Populyar Turlarınız</h3>
                  <p className="vendor-card-subtitle">Real bilet satışı və gəlirə görə sıralama</p>
                </div>
              </div>

              {stats?.popularDestinations && stats.popularDestinations.length > 0 ? (
                <div className="vendor-bar-list">
                  {stats.popularDestinations.map((item) => (
                    <div key={item.id} className="vendor-bar-item">
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
                      <span className="vendor-bar-subtext">
                        {item.tickets} bilet satılıb ({item.percent}% doluluq)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="vendor-destinations-empty">
                  <Map size={32} className="vendor-empty-icon" />
                  <p>Hələ ki bilet satışı olan tur qeydə alınmayıb</p>
                  <button 
                    type="button" 
                    onClick={() => navigate('/tours/create')}
                    className="vendor-empty-action-btn"
                  >
                    İlk Turunuzu Yaradın
                  </button>
                </div>
              )}
            </div>

            {/* Live Activity Stream */}
            <div className="vendor-activity-card">
              <div className="vendor-card-header">
                <div>
                  <h3 className="vendor-card-title">Canlı Fəaliyyət Axını</h3>
                  <p className="vendor-card-subtitle">Son sifariş, ödəniş və əməliyyat hadisələri</p>
                </div>
                <span className="vendor-live-pill">Real-time</span>
              </div>

              {stats?.activities && stats.activities.length > 0 ? (
                <div className="vendor-activity-stream">
                  {stats.activities.map((act) => {
                    const IconComp =
                      act.iconType === 'dollar'
                        ? DollarSign
                        : act.iconType === 'ticket'
                        ? Ticket
                        : CheckCircle2;

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
              ) : (
                <div className="vendor-destinations-empty">
                  <Clock size={32} className="vendor-empty-icon" />
                  <p>Bu dövr üçün yeni əməliyyat hadisəsi qeydə alınmayıb</p>
                </div>
              )}
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
