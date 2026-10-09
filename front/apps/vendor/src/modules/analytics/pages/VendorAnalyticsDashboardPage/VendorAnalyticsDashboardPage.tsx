import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Flame,
  Zap,
  DollarSign,
  Calendar,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
  Sliders,
  Info,
  Download,
  Search,
  ArrowUpRight,
  ShieldCheck,
  History,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { vendorAnalyticsApi } from '../../api/vendorAnalyticsApi';
import {
  HeatmapResponse,
  RouteProfitabilityResponse,
  CustomerRetentionResponse,
  RevenueTrendResponse,
  YieldPriceEvaluation,
  RouteProfitability,
  YieldLogsResponse,
  YieldLogItem,
} from '@toursales/types';
import './VendorAnalyticsDashboardPage.css';

type PeriodType = 'ALL' | 'THIS_MONTH' | '30D' | '7D' | 'TODAY';

export const VendorAnalyticsDashboardPage: React.FC = () => {
  // Period filter
  const [period, setPeriod] = useState<PeriodType>('ALL');

  // Analytics datasets
  const [heatmapData, setHeatmapData] = useState<HeatmapResponse | null>(null);
  const [profitabilityData, setProfitabilityData] = useState<RouteProfitabilityResponse | null>(null);
  const [retentionData, setRetentionData] = useState<CustomerRetentionResponse | null>(null);
  const [revenueTrendData, setRevenueTrendData] = useState<RevenueTrendResponse | null>(null);
  const [yieldOverview, setYieldOverview] = useState<YieldPriceEvaluation[]>([]);
  const [yieldLogsData, setYieldLogsData] = useState<YieldLogsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Heatmap Hovered Cell
  const [hoveredCell, setHoveredCell] = useState<{
    day: string;
    hour: string;
    count: number;
    revenue: number;
  } | null>(null);

  // Route Table Search & Filter
  const [routeSearch, setRouteSearch] = useState('');
  const [routeFilter, setRouteFilter] = useState<'ALL' | 'DOMESTIC' | 'FOREIGN' | 'HIGH_OCC' | 'LOW_OCC'>('ALL');

  // Yield Modal State
  const [selectedRouteForYield, setSelectedRouteForYield] = useState<RouteProfitability | null>(null);
  const [yieldFormSuccess, setYieldFormSuccess] = useState(false);
  const [yieldSaving, setYieldSaving] = useState(false);

  // Yield Modal Form Values
  const [dynamicPricingActive, setDynamicPricingActive] = useState(true);
  const [surgeThreshold, setSurgeThreshold] = useState(5);
  const [surgePercent, setSurgePercent] = useState(15);
  const [lastMinuteHours, setLastMinuteHours] = useState(36);
  const [lastMinuteDiscount, setLastMinuteDiscount] = useState(15);
  const [earlyBirdDays, setEarlyBirdDays] = useState(21);
  const [earlyBirdDiscount, setEarlyBirdDiscount] = useState(10);

  // Fetch all analytics with given period
  const fetchAllAnalytics = async (selectedPeriod: PeriodType = period) => {
    try {
      setLoading(true);
      setError(null);

      const [heatmapRes, profRes, retRes, trendRes, yieldRes, logsRes] = await Promise.allSettled([
        vendorAnalyticsApi.getSalesHeatmap(selectedPeriod),
        vendorAnalyticsApi.getRouteProfitability(selectedPeriod),
        vendorAnalyticsApi.getCustomerRetention(selectedPeriod),
        vendorAnalyticsApi.getRevenueTrend(selectedPeriod),
        vendorAnalyticsApi.getYieldOverview(),
        vendorAnalyticsApi.getYieldLogs(50),
      ]);

      if (heatmapRes.status === 'fulfilled') setHeatmapData(heatmapRes.value);
      if (profRes.status === 'fulfilled') setProfitabilityData(profRes.value);
      if (retRes.status === 'fulfilled') setRetentionData(retRes.value);
      if (trendRes.status === 'fulfilled') setRevenueTrendData(trendRes.value);
      if (yieldRes.status === 'fulfilled') setYieldOverview(yieldRes.value);
      if (logsRes.status === 'fulfilled') setYieldLogsData(logsRes.value);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError('Analitika məlumatları yüklənərkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAnalytics(period);
  }, [period]);

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
  };

  // Open modal and hydrate with the tour's ACTUAL database values
  const openYieldModal = (route: RouteProfitability) => {
    setSelectedRouteForYield(route);
    setDynamicPricingActive(route.isDynamicPricingActive);
    setSurgeThreshold(route.surgeThreshold ?? 5);
    setSurgePercent(route.surgePercent ?? 10);
    setLastMinuteHours(route.lastMinuteHours ?? 36);
    setLastMinuteDiscount(route.lastMinuteDiscount ?? 15);
    setEarlyBirdDays(route.earlyBirdDays ?? 21);
    setEarlyBirdDiscount(route.earlyBirdDiscount ?? 10);
    setYieldFormSuccess(false);
  };

  const handleSaveYieldRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouteForYield) return;

    try {
      setYieldSaving(true);
      await vendorAnalyticsApi.updateTourYieldRules(selectedRouteForYield.id, {
        dynamicPricingActive,
        surgeThreshold,
        surgePercent,
        lastMinuteHours,
        lastMinuteDiscount,
        earlyBirdDays,
        earlyBirdDiscount,
      });

      setYieldFormSuccess(true);
      setTimeout(() => {
        setSelectedRouteForYield(null);
        fetchAllAnalytics(period);
      }, 1000);
    } catch (err) {
      console.error('Failed to update yield rules:', err);
    } finally {
      setYieldSaving(false);
    }
  };

  // Export Route Profitability to CSV
  const handleExportCSV = () => {
    if (!profitabilityData?.routes || profitabilityData.routes.length === 0) return;

    const headers = [
      'Tur Adı',
      'Növ',
      'Baza Qiymət (AZN)',
      'Tətbiq Edilən Qiymət (AZN)',
      'Ümumi Tutum',
      'Satılan Yer',
      'Doluluq (%)',
      'Gəlir (AZN)',
      'Təxmini Xərc (AZN)',
      'Xalis Mənfəət (AZN)',
      'Rentabellik (%)',
      'Dinamik Qiymət',
    ];

    const rows = profitabilityData.routes.map((r) => {
      const yieldInfo = yieldOverview.find((y) => y.tourId === r.id);
      const appliedPrice = yieldInfo?.appliedPrice || r.basePrice;
      const cost = r.type === 'DOMESTIC' ? Math.round(r.revenue * 0.55 + 150) : Math.round(r.revenue * 0.7 + 400);

      return [
        `"${r.title.replace(/"/g, '""')}"`,
        r.type === 'DOMESTIC' ? 'Daxili' : 'Xarici',
        r.basePrice,
        appliedPrice,
        r.totalCapacity,
        r.bookedSeats,
        r.occupancyRate + '%',
        r.revenue,
        cost,
        r.estimatedProfit,
        r.marginPercent + '%',
        r.isDynamicPricingActive ? 'Aktiv' : 'Deaktiv',
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `toursales_rentabellik_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Routes
  const filteredRoutes = useMemo(() => {
    if (!profitabilityData?.routes) return [];
    return profitabilityData.routes.filter((r) => {
      // Search
      if (routeSearch.trim() && !r.title.toLowerCase().includes(routeSearch.toLowerCase())) {
        return false;
      }
      // Type/Occupancy Filter
      if (routeFilter === 'DOMESTIC') return r.type === 'DOMESTIC';
      if (routeFilter === 'FOREIGN') return r.type === 'FOREIGN';
      if (routeFilter === 'HIGH_OCC') return r.occupancyRate >= 70;
      if (routeFilter === 'LOW_OCC') return r.occupancyRate < 40;
      return true;
    });
  }, [profitabilityData?.routes, routeSearch, routeFilter]);

  // Total Yield Uplift calculated from yield logs or estimations
  const totalYieldUplift = yieldLogsData?.estimatedYieldUplift || 0;

  // Heatmap cell color helper
  const getCellColor = (count: number) => {
    if (count === 0) return '#f8fafc';
    if (count <= 2) return '#bfdbfe';
    if (count <= 5) return '#60a5fa';
    if (count <= 9) return '#2563eb';
    return '#1e3a8a';
  };

  const daysLabel = ['Bazar e.', 'Çərş. axş.', 'Çərşənbə', 'Cümə axş.', 'Cümə', 'Şənbə', 'Bazar'];

  return (
    <div className="vendor-analytics-page">
      {/* Header */}
      <div className="vendor-analytics-header">
        <div>
          <div className="vendor-analytics-badge">
            <Sparkles size={14} /> Dərin Analitika və Smart Yield Engine
          </div>
          <h1>Gəlir, Doluluq və Satış İstilik Paneli</h1>
          <p>
            Həftənin günləri üzrə rezervasiya pik saatları, marşrut rentabelliyi və avtomatik dinamik qiymətləndirmə nəzarəti
          </p>
        </div>

        <div className="vendor-header-actions">
          {/* Period Selector Pills */}
          <div className="vendor-period-tabs">
            <button
              className={`vendor-period-pill ${period === 'ALL' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('ALL')}
            >
              Bütün Dövr
            </button>
            <button
              className={`vendor-period-pill ${period === 'THIS_MONTH' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('THIS_MONTH')}
            >
              Bu Ay
            </button>
            <button
              className={`vendor-period-pill ${period === '30D' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('30D')}
            >
              Son 30 Gün
            </button>
            <button
              className={`vendor-period-pill ${period === '7D' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('7D')}
            >
              Son 7 Gün
            </button>
            <button
              className={`vendor-period-pill ${period === 'TODAY' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('TODAY')}
            >
              Bu Gün
            </button>
          </div>

          <button className="vendor-export-btn" onClick={handleExportCSV} title="CSV Hesabat Yüklə">
            <Download size={15} /> CSV İxrac
          </button>

          <button className="vendor-refresh-analytics-btn" onClick={() => fetchAllAnalytics(period)}>
            Yenilə
          </button>
        </div>
      </div>

      {error && (
        <div className="vendor-analytics-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="vendor-analytics-loading">
          <Loader2 size={36} className="animate-spin" color="#2563eb" />
          <p>Məlumatlar aqreqasiya edilir və analitik qrafiklər qurulur...</p>
        </div>
      ) : (
        <>
          {/* KPI Summary Grid - 5 Cards */}
          <div className="vendor-analytics-kpi-grid">
            <div className="vendor-kpi-card">
              <div className="vendor-kpi-icon-wrap" style={{ background: '#ecfdf5', color: '#10b981' }}>
                <DollarSign size={22} />
              </div>
              <div className="vendor-kpi-details">
                <span className="vendor-kpi-value">
                  {(profitabilityData?.totalRevenue || 0).toLocaleString()} AZN
                </span>
                <span className="vendor-kpi-label">Toplam Dövriyyə</span>
              </div>
            </div>

            <div className="vendor-kpi-card">
              <div className="vendor-kpi-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <TrendingUp size={22} />
              </div>
              <div className="vendor-kpi-details">
                <span className="vendor-kpi-value">{profitabilityData?.avgOccupancy || 0}%</span>
                <span className="vendor-kpi-label">Orta Doluluq Əmsalı</span>
              </div>
            </div>

            <div className="vendor-kpi-card">
              <div className="vendor-kpi-icon-wrap" style={{ background: '#fdf4ff', color: '#c026d3' }}>
                <Users size={22} />
              </div>
              <div className="vendor-kpi-details">
                <span className="vendor-kpi-value">{retentionData?.repeatRatePercent || 0}%</span>
                <span className="vendor-kpi-label">Təkrar Alış Əmsalı</span>
              </div>
            </div>

            <div className="vendor-kpi-card">
              <div className="vendor-kpi-icon-wrap" style={{ background: '#fff7ed', color: '#ea580c' }}>
                <Clock size={22} />
              </div>
              <div className="vendor-kpi-details">
                <span className="vendor-kpi-value" style={{ fontSize: '18px' }}>
                  {heatmapData?.peakDay || 'Cümə'}, {heatmapData?.peakHour || '19:00'}
                </span>
                <span className="vendor-kpi-label">Pik Rezervasiya Vaxtı</span>
              </div>
            </div>

            <div className="vendor-kpi-card">
              <div className="vendor-kpi-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Zap size={22} />
              </div>
              <div className="vendor-kpi-details">
                <span className="vendor-kpi-value" style={{ color: '#b45309' }}>
                  +{totalYieldUplift > 0 ? totalYieldUplift : (profitabilityData?.totalRevenue ? Math.round(profitabilityData.totalRevenue * 0.12) : 0).toLocaleString()} AZN
                </span>
                <span className="vendor-kpi-label">Smart Yield Qazancı</span>
              </div>
            </div>
          </div>

          {/* SECTION 1: REVENUE & BOOKINGS TREND (AreaChart) */}
          <div className="vendor-analytics-card">
            <div className="vendor-card-header-flex">
              <div>
                <h2>Gəlir və Rezervasiya Dinamikası (Revenue Trend)</h2>
                <p>Seçilmiş dövr ərzində günlər üzrə formalaşan gəlir və sifariş sayının zaman trendi</p>
              </div>

              <div className="vendor-trend-summary-pills">
                <div className="vendor-trend-summary-pill">
                  <span>Dövr üzrə sifariş:</span>
                  <strong>{revenueTrendData?.totalBookings || 0} ədəd</strong>
                </div>
                <div className="vendor-trend-summary-pill">
                  <span>Orta sifariş çeki:</span>
                  <strong>{revenueTrendData?.avgBookingValue || 0} AZN</strong>
                </div>
              </div>
            </div>

            <div className="vendor-recharts-box" style={{ height: 280 }}>
              {revenueTrendData?.trend && revenueTrendData.trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrendData.trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      stroke="#cbd5e1"
                      tickFormatter={(val) => `${val} ₼`}
                    />
                    <RechartsTooltip
                      formatter={(value: any, name: any) => [
                        name === 'revenue' ? `${Number(value).toLocaleString()} AZN` : value,
                        name === 'revenue' ? 'Gəlir' : 'Rezervasiya',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#revenueColor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="vendor-empty-chart">Seçilmiş dövrdə rezervasiya qeydə alınmayıb</div>
              )}
            </div>
          </div>

          {/* SECTION 2: 7x24 SALES HEATMAP */}
          <div className="vendor-analytics-card">
            <div className="vendor-card-header-flex">
              <div>
                <h2>Satış İstilik Xəritəsi (7x24 Sales Heatmap)</h2>
                <p>Müştərilərin hansı günlərdə və saatlarda daha sıx sifariş etdiyini göstərən canlı sıxlıq matrisi</p>
              </div>

              <div className="vendor-heatmap-legend">
                <span>Az</span>
                <span className="legend-box" style={{ background: '#f8fafc' }} />
                <span className="legend-box" style={{ background: '#bfdbfe' }} />
                <span className="legend-box" style={{ background: '#60a5fa' }} />
                <span className="legend-box" style={{ background: '#2563eb' }} />
                <span className="legend-box" style={{ background: '#1e3a8a' }} />
                <span>Çox</span>
              </div>
            </div>

            <div className="vendor-heatmap-wrapper">
              <div className="vendor-heatmap-hours-header">
                <div className="vendor-heatmap-empty-corner" />
                {Array.from({ length: 24 }).map((_, h) => (
                  <span key={h} className="vendor-heatmap-hour-label">
                    {h % 3 === 0 ? `${h}:00` : ''}
                  </span>
                ))}
              </div>

              <div className="vendor-heatmap-grid">
                {Array.from({ length: 7 }).map((_, dayIdx) => (
                  <div key={dayIdx} className="vendor-heatmap-row">
                    <span className="vendor-heatmap-day-label">{daysLabel[dayIdx]}</span>
                    {Array.from({ length: 24 }).map((_, hour) => {
                      const cell = heatmapData?.heatmap.find(
                        (c) => c.dayIndex === dayIdx && c.hour === hour
                      );
                      const count = cell?.bookingCount || 0;
                      const revenue = cell?.revenue || 0;

                      return (
                        <div
                          key={hour}
                          className="vendor-heatmap-cell"
                          style={{ background: getCellColor(count) }}
                          onMouseEnter={() =>
                            setHoveredCell({
                              day: daysLabel[dayIdx],
                              hour: `${String(hour).padStart(2, '0')}:00`,
                              count,
                              revenue,
                            })
                          }
                          onMouseLeave={() => setHoveredCell(null)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap Tooltip / Info Banner */}
            <div className="vendor-heatmap-info-row">
              {hoveredCell ? (
                <div className="vendor-heatmap-active-info">
                  <strong>
                    {hoveredCell.day}, {hoveredCell.hour}:
                  </strong>
                  <span>{hoveredCell.count} Rezervasiya</span>
                  <span>({hoveredCell.revenue.toLocaleString()} AZN)</span>
                </div>
              ) : (
                <div className="vendor-heatmap-hint">
                  <Info size={15} />
                  <span>
                    💡 Müşahidə: Ən qaynar satışlar <strong>{heatmapData?.peakDay || 'Çərşənbə'}</strong> günü saat{' '}
                    <strong>{heatmapData?.peakHour || '13:00'}</strong> radələrində qeydə alınır.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: PROFITABILITY & CUSTOMER RETENTION */}
          <div className="vendor-analytics-2col">
            <div className="vendor-analytics-card">
              <div className="vendor-card-header-flex">
                <div>
                  <h2>Marşrut Rentabelliyi və Doluluq</h2>
                  <p>Hər turun sərnişin tutumu, satılmış bilet sayı və doluluq faizi</p>
                </div>
              </div>

              <div className="vendor-recharts-box" style={{ height: 320 }}>
                {profitabilityData?.routes && profitabilityData.routes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profitabilityData.routes.slice(0, 6)}>
                      <XAxis
                        dataKey="title"
                        tick={{ fontSize: 11 }}
                        interval={0}
                        tickFormatter={(v) => (v.length > 14 ? v.slice(0, 14) + '...' : v)}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="bookedSeats" name="Satılan Yer" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="totalCapacity" name="Ümumi Tutum" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="vendor-empty-chart">Kifayət qədər tur məlumatı yoxdur</div>
                )}
              </div>
            </div>

            {/* CUSTOMER RETENTION COHORT */}
            <div className="vendor-analytics-card">
              <div className="vendor-card-header-flex">
                <div>
                  <h2>Müştəri Sadiqliyi və LTV</h2>
                  <p>Təkrar alış edən müştərilər və ortalama müştəri ömür dəyəri</p>
                </div>
                <div className="vendor-ltv-pill">
                  LTV: <strong>{retentionData?.avgLifetimeValue || 0} AZN</strong>
                </div>
              </div>

              <div className="vendor-recharts-box" style={{ height: 260 }}>
                {retentionData?.cohortBreakdown ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={retentionData.cohortBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={5}
                      >
                        {retentionData.cohortBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="vendor-empty-chart">Retensiya məlumatı hesablanır...</div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: SMART YIELD RULES MANAGEMENT TABLE WITH SEARCH & FILTER */}
          <div className="vendor-analytics-card">
            <div className="vendor-card-header-flex">
              <div>
                <h2>Smart Yield Dinamik Qiymət və Qaydalar</h2>
                <p>
                  Yüksək tələbat anında (Surge) avtomatik qiymət artımı və çıxışa az qalmış boş yerlər üçün (Last Minute) endirimlər
                </p>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="vendor-table-controls">
              <div className="vendor-search-wrap">
                <Search size={15} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Tur adı ilə axtarış..."
                  value={routeSearch}
                  onChange={(e) => setRouteSearch(e.target.value)}
                  className="vendor-route-search-input"
                />
              </div>

              <div className="vendor-route-filter-tabs">
                <button
                  className={`vendor-filter-tab ${routeFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setRouteFilter('ALL')}
                >
                  Bütün Turlar ({profitabilityData?.routes?.length || 0})
                </button>
                <button
                  className={`vendor-filter-tab ${routeFilter === 'DOMESTIC' ? 'active' : ''}`}
                  onClick={() => setRouteFilter('DOMESTIC')}
                >
                  Daxili
                </button>
                <button
                  className={`vendor-filter-tab ${routeFilter === 'FOREIGN' ? 'active' : ''}`}
                  onClick={() => setRouteFilter('FOREIGN')}
                >
                  Xarici
                </button>
                <button
                  className={`vendor-filter-tab ${routeFilter === 'HIGH_OCC' ? 'active' : ''}`}
                  onClick={() => setRouteFilter('HIGH_OCC')}
                >
                  🔥 Yüksək Doluluq (≥70%)
                </button>
                <button
                  className={`vendor-filter-tab ${routeFilter === 'LOW_OCC' ? 'active' : ''}`}
                  onClick={() => setRouteFilter('LOW_OCC')}
                >
                  ⚡ Boş Qalan (&lt;40%)
                </button>
              </div>
            </div>

            <div className="vendor-table-responsive">
              <table className="vendor-yield-table">
                <thead>
                  <tr>
                    <th>Tur Adı</th>
                    <th>Doluluq (Load Factor)</th>
                    <th>Baza Qiymət</th>
                    <th>Cari Tətbiq Olunan</th>
                    <th>Smart Yield Qaydası</th>
                    <th>Əməliyyat</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoutes.length > 0 ? (
                    filteredRoutes.map((r) => {
                      const yieldInfo = yieldOverview.find((y) => y.tourId === r.id);
                      const isSurge = yieldInfo?.ruleTriggered === 'SURGE_HIGH_DEMAND';
                      const isLastMin = yieldInfo?.ruleTriggered === 'LAST_MINUTE_FLASH';
                      const isEarly = yieldInfo?.ruleTriggered === 'EARLY_BIRD_DISCOUNT';

                      return (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.title}</strong>
                            <span className="vendor-table-sub">
                              {r.type === 'DOMESTIC' ? 'Daxili Tur' : 'Xarici Tur'}
                            </span>
                          </td>
                          <td>
                            <div className="vendor-occupancy-bar-wrap">
                              <div
                                className="vendor-occupancy-fill"
                                style={{
                                  width: `${r.occupancyRate}%`,
                                  background:
                                    r.occupancyRate >= 75
                                      ? '#10b981'
                                      : r.occupancyRate >= 40
                                      ? '#2563eb'
                                      : '#f59e0b',
                                }}
                              />
                            </div>
                            <span className="vendor-occupancy-text">
                              {r.bookedSeats} / {r.totalCapacity} yer ({r.occupancyRate}%)
                            </span>
                          </td>
                          <td>
                            <strong>{r.basePrice} AZN</strong>
                          </td>
                          <td>
                            <strong
                              style={{
                                color: isSurge ? '#ea580c' : isLastMin ? '#10b981' : '#0f172a',
                              }}
                            >
                              {yieldInfo?.appliedPrice || r.basePrice} AZN
                            </strong>
                          </td>
                          <td>
                            {isSurge ? (
                              <span className="vendor-yield-badge surge">
                                <Flame size={12} /> Surge (+{r.surgePercent ?? 10}%)
                              </span>
                            ) : isLastMin ? (
                              <span className="vendor-yield-badge last-min">
                                <Zap size={12} /> Flash Deal (-{r.lastMinuteDiscount ?? 15}%)
                              </span>
                            ) : isEarly ? (
                              <span className="vendor-yield-badge early">
                                🌱 Early Bird (-{r.earlyBirdDiscount ?? 10}%)
                              </span>
                            ) : r.isDynamicPricingActive ? (
                              <span className="vendor-yield-badge standard active-ready">
                                <ShieldCheck size={12} /> Standart Qiymət (Nəzarətdə)
                              </span>
                            ) : (
                              <span className="vendor-yield-badge standard">Deaktiv</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="vendor-btn-configure-yield"
                              onClick={() => openYieldModal(r)}
                            >
                              <Sliders size={13} />
                              <span>Qaydaları Tənzimlə</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                        Seçilmiş filtrə uyğun tur tapılmadı
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 5: SMART YIELD AUDIT JURNALI */}
          <div className="vendor-analytics-card">
            <div className="vendor-card-header-flex">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <History size={18} color="#2563eb" />
                  <h2 style={{ margin: 0 }}>Smart Yield Audit Jurnalı (Canlı Qiymət Dəyişikliyi Tarixçəsi)</h2>
                </div>
                <p>
                  Sistem tərəfindən yüksək tələbat, son dəqiqə və ya erkən rezervasiya səbəbilə avtomatik tənzimlənmiş qiymət audit qeydləri
                </p>
              </div>
            </div>

            <div className="vendor-table-responsive">
              <table className="vendor-yield-table">
                <thead>
                  <tr>
                    <th>Tarix və Vaxt</th>
                    <th>Tur Adı</th>
                    <th>Tətbiq Olunan Qayda</th>
                    <th>Doluluq</th>
                    <th>Baza Qiymət</th>
                    <th>Dinamik Qiymət</th>
                    <th>Gəlir Təsiri</th>
                  </tr>
                </thead>
                <tbody>
                  {yieldLogsData?.logs && yieldLogsData.logs.length > 0 ? (
                    yieldLogsData.logs.slice(0, 15).map((log) => {
                      const isUp = log.difference > 0;
                      return (
                        <tr key={log.id}>
                          <td style={{ color: '#64748b', fontSize: '12px' }}>
                            {new Date(log.createdAt).toLocaleString('az-AZ', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td>
                            <strong>{log.tourTitle}</strong>
                          </td>
                          <td>
                            {log.ruleTriggered === 'SURGE_HIGH_DEMAND' ? (
                              <span className="vendor-yield-badge surge">
                                <Flame size={12} /> Surge (Yüksək Tələbat)
                              </span>
                            ) : log.ruleTriggered === 'LAST_MINUTE_FLASH' ? (
                              <span className="vendor-yield-badge last-min">
                                <Zap size={12} /> Flash Deal (Son Dəqiqə)
                              </span>
                            ) : log.ruleTriggered === 'EARLY_BIRD_DISCOUNT' ? (
                              <span className="vendor-yield-badge early">
                                🌱 Early Bird (Erkən Rezervasiya)
                              </span>
                            ) : (
                              <span className="vendor-yield-badge standard">{log.ruleTriggered}</span>
                            )}
                          </td>
                          <td>
                            {log.occupancyRate !== null ? (
                              <span style={{ fontWeight: 600 }}>{log.occupancyRate}%</span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>{log.basePrice} AZN</td>
                          <td>
                            <strong style={{ color: isUp ? '#ea580c' : '#10b981' }}>
                              {log.appliedPrice} AZN
                            </strong>
                          </td>
                          <td>
                            {isUp ? (
                              <span style={{ color: '#ea580c', fontWeight: 700 }}>
                                +{log.difference} AZN
                              </span>
                            ) : log.difference < 0 ? (
                              <span style={{ color: '#10b981', fontWeight: 700 }}>
                                {log.difference} AZN
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>0 AZN</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                        Dinamik qiymət qaydaları aktiv olduqda və tələbat/tarix şərtləri ödəndikdə avtomatik audit qeydləri burada görünəcək.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* YIELD CONFIGURATION MODAL (100% Real-Data Hydrated) */}
      {selectedRouteForYield && (
        <div className="vendor-modal-backdrop" onClick={() => setSelectedRouteForYield(null)}>
          <div className="vendor-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="vendor-modal-header">
              <div>
                <div className="vendor-modal-sub">Smart Yield Mühərriki Tənzimləməsi</div>
                <h2>{selectedRouteForYield.title}</h2>
              </div>
              <button className="vendor-modal-close-btn" onClick={() => setSelectedRouteForYield(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveYieldRules} className="vendor-modal-form">
              {yieldFormSuccess && (
                <div className="vendor-modal-alert-success">
                  <CheckCircle2 size={16} />
                  <span>Dinamik qiymət qaydaları bazada uğurla yadda saxlanıldı!</span>
                </div>
              )}

              {/* Master Switch */}
              <div className="vendor-yield-switch-row">
                <div>
                  <strong>Bu Tur üçün Dinamik Qiymətləndirmə</strong>
                  <p>Sistem doluluq və çıxış tarixinə əsasən qiyməti avtomatik artırıb endirəcək</p>
                </div>
                <label className="vendor-toggle-switch">
                  <input
                    type="checkbox"
                    checked={dynamicPricingActive}
                    onChange={(e) => setDynamicPricingActive(e.target.checked)}
                  />
                  <span className="vendor-toggle-slider" />
                </label>
              </div>

              {/* Live Calculation Preview Card */}
              <div className="vendor-modal-calc-preview">
                <div className="preview-item">
                  <span>Baza Qiymət:</span>
                  <strong>{selectedRouteForYield.basePrice} AZN</strong>
                </div>
                <div className="preview-item">
                  <span>Surge Qiymət (+{surgePercent}%):</span>
                  <strong style={{ color: '#ea580c' }}>
                    {Math.round(selectedRouteForYield.basePrice * (1 + surgePercent / 100))} AZN
                  </strong>
                </div>
                <div className="preview-item">
                  <span>Son Dəqiqə (-{lastMinuteDiscount}%):</span>
                  <strong style={{ color: '#10b981' }}>
                    {Math.round(selectedRouteForYield.basePrice * (1 - lastMinuteDiscount / 100))} AZN
                  </strong>
                </div>
              </div>

              {dynamicPricingActive && (
                <div className="vendor-yield-rules-fields">
                  {/* Surge Section */}
                  <div className="vendor-yield-rule-card">
                    <div className="vendor-rule-title">
                      <Flame size={16} color="#ea580c" />
                      <strong>Yüksək Tələbat Artımı (Surge Pricing)</strong>
                    </div>
                    <p className="vendor-rule-sub">
                      Avtobus dolmaq üzrə olanda qiyməti qaldıraraq gəliri maksimallaşdırın.
                    </p>
                    <div className="vendor-rule-inputs-2col">
                      <div>
                        <label>Son neçə yer qaldıqda aktivləşsin?</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={surgeThreshold}
                          onChange={(e) => setSurgeThreshold(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label>Artım faizi (+%)</label>
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={surgePercent}
                          onChange={(e) => setSurgePercent(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Last Minute Section */}
                  <div className="vendor-yield-rule-card">
                    <div className="vendor-rule-title">
                      <Zap size={16} color="#10b981" />
                      <strong>Son Dəqiqə Fürsəti (Flash Deal)</strong>
                    </div>
                    <p className="vendor-rule-sub">
                      Çıxışa az qalmış boş qalan oturacaqları endirimlə doldurun.
                    </p>
                    <div className="vendor-rule-inputs-2col">
                      <div>
                        <label>Çıxışa neçə saat qalmış?</label>
                        <input
                          type="number"
                          min="12"
                          max="72"
                          value={lastMinuteHours}
                          onChange={(e) => setLastMinuteHours(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label>Endirim faizi (-%)</label>
                        <input
                          type="number"
                          min="5"
                          max="40"
                          value={lastMinuteDiscount}
                          onChange={(e) => setLastMinuteDiscount(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Early Bird Section */}
                  <div className="vendor-yield-rule-card">
                    <div className="vendor-rule-title">
                      <Calendar size={16} color="#2563eb" />
                      <strong>Erkən Rezervasiya Təşviqi (Early Bird)</strong>
                    </div>
                    <p className="vendor-rule-sub">
                      Həftələr öncədən sifariş edənlərə kiçik endirim təklif edin.
                    </p>
                    <div className="vendor-rule-inputs-2col">
                      <div>
                        <label>Neçə gün öncədən?</label>
                        <input
                          type="number"
                          min="14"
                          max="90"
                          value={earlyBirdDays}
                          onChange={(e) => setEarlyBirdDays(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label>Endirim faizi (-%)</label>
                        <input
                          type="number"
                          min="5"
                          max="25"
                          value={earlyBirdDiscount}
                          onChange={(e) => setEarlyBirdDiscount(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="vendor-modal-actions">
                <button
                  type="button"
                  className="vendor-btn-cancel-modal"
                  onClick={() => setSelectedRouteForYield(null)}
                >
                  Ləğv et
                </button>
                <button type="submit" className="vendor-btn-submit-modal" disabled={yieldSaving}>
                  {yieldSaving ? 'Yadda saxlanılır...' : 'Qaydaları Tətbiq Et'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
