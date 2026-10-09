import React from 'react';
import { 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight, 
  Percent, 
  PieChart, 
  Compass, 
  Building2, 
  Layers, 
  CreditCard,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { ExtendedLedgerEntry, VendorCompanyBalance } from '../../vendorFinanceApi';
import './FinancialAnalyticsCard.css';

export type AnalyticsPeriod = 'ALL' | 'THIS_MONTH' | 'LAST_30_DAYS' | 'LAST_7_DAYS' | 'TODAY';

interface FinancialAnalyticsCardProps {
  ledger: ExtendedLedgerEntry[];
  balance: VendorCompanyBalance | null;
  selectedPeriod: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
}

export const FinancialAnalyticsCard: React.FC<FinancialAnalyticsCardProps> = ({
  ledger,
  balance,
  selectedPeriod,
  onPeriodChange,
}) => {
  // Period filter logic for client-side analytics
  const now = new Date();
  const getStartDate = (period: AnalyticsPeriod): Date | null => {
    switch (period) {
      case 'TODAY': {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
      }
      case 'LAST_7_DAYS': {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d;
      }
      case 'LAST_30_DAYS': {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
      }
      case 'THIS_MONTH': {
        return new Date(now.getFullYear(), now.getMonth(), 1);
      }
      case 'ALL':
      default:
        return null;
    }
  };

  const startDate = getStartDate(selectedPeriod);

  const filteredEntries = ledger.filter((item) => {
    if (!startDate) return true;
    const itemDate = new Date(item.createdAt);
    return itemDate >= startDate;
  });

  // KPI Calculations
  let totalInflow = 0;
  let totalOutflow = 0;
  let totalCommissions = 0;
  let ticketSalesCount = 0;
  let ticketSalesSum = 0;
  let hotelSalesCount = 0;
  let hotelSalesSum = 0;
  let customTourSalesCount = 0;
  let customTourSalesSum = 0;
  let payoutSum = 0;
  let payoutCount = 0;

  for (const item of filteredEntries) {
    totalInflow += item.credit || 0;
    totalOutflow += item.debit || 0;
    totalCommissions += item.commission || 0;

    if (item.type === 'TICKET_SALE' || item.type === 'TICKET_SALE_DEPOSIT') {
      ticketSalesCount++;
      ticketSalesSum += item.amount || item.credit || 0;
    } else if (item.type === 'HOTEL_SALE') {
      hotelSalesCount++;
      hotelSalesSum += item.amount || item.credit || 0;
    } else if (item.type === 'CUSTOM_TOUR_SALE') {
      customTourSalesCount++;
      customTourSalesSum += item.amount || item.credit || 0;
    } else if (item.type === 'PAYOUT') {
      payoutCount++;
      payoutSum += item.amount || item.debit || 0;
    }
  }

  const netCashFlow = totalInflow - totalOutflow;
  const netEarningsRatio = totalInflow > 0 
    ? Math.min(100, Math.max(0, ((totalInflow - totalCommissions) / totalInflow) * 100))
    : 95;
  const commissionRatio = totalInflow > 0 ? (100 - netEarningsRatio) : 5;

  return (
    <div className="finance-analytics-wrapper">
      <div className="analytics-card-header">
        <div className="analytics-title-group">
          <div className="analytics-icon-badge">
            <PieChart size={20} />
          </div>
          <div>
            <h3>Maliyyə Analitikası & Dövriyyə Dinamikası</h3>
            <p>Seçilmiş dövr üzrə mədaxil, xalis gəlir marjası və xidmət bölgüsü</p>
          </div>
        </div>

        {/* Dynamic Period Selector Pills */}
        <div className="analytics-period-selector">
          <button
            type="button"
            className={`period-pill ${selectedPeriod === 'ALL' ? 'active' : ''}`}
            onClick={() => onPeriodChange('ALL')}
          >
            Bütün Dövr
          </button>
          <button
            type="button"
            className={`period-pill ${selectedPeriod === 'THIS_MONTH' ? 'active' : ''}`}
            onClick={() => onPeriodChange('THIS_MONTH')}
          >
            Bu Ay
          </button>
          <button
            type="button"
            className={`period-pill ${selectedPeriod === 'LAST_30_DAYS' ? 'active' : ''}`}
            onClick={() => onPeriodChange('LAST_30_DAYS')}
          >
            Son 30 Gün
          </button>
          <button
            type="button"
            className={`period-pill ${selectedPeriod === 'LAST_7_DAYS' ? 'active' : ''}`}
            onClick={() => onPeriodChange('LAST_7_DAYS')}
          >
            Son 7 Gün
          </button>
          <button
            type="button"
            className={`period-pill ${selectedPeriod === 'TODAY' ? 'active' : ''}`}
            onClick={() => onPeriodChange('TODAY')}
          >
            Bu Gün
          </button>
        </div>
      </div>

      {/* 4 Analytics Highlight Cards */}
      <div className="analytics-stats-grid">
        <div className="analytics-stat-item inflow">
          <div className="stat-label-row">
            <span>Dövrün Ümumi Mədaxili</span>
            <ArrowDownRight size={16} className="text-success" />
          </div>
          <div className="stat-value text-success">
            +{totalInflow.toFixed(2)} AZN
          </div>
          <div className="stat-sub">
            <span>{filteredEntries.filter(i => i.credit > 0).length} mədaxil əməliyyatı</span>
          </div>
        </div>

        <div className="analytics-stat-item net">
          <div className="stat-label-row">
            <span>Xalis Maliyyə Nəticəsi</span>
            <TrendingUp size={16} className="text-primary-600" />
          </div>
          <div className={`stat-value ${netCashFlow >= 0 ? 'text-primary-700' : 'text-danger'}`}>
            {netCashFlow >= 0 ? '+' : ''}{netCashFlow.toFixed(2)} AZN
          </div>
          <div className="stat-sub">
            <span>Mədaxil və məxaric fərqi</span>
          </div>
        </div>

        <div className="analytics-stat-item fee">
          <div className="stat-label-row">
            <span>Platforma Haqqı (5-7%)</span>
            <Percent size={16} className="text-secondary" />
          </div>
          <div className="stat-value text-secondary">
            -{totalCommissions.toFixed(2)} AZN
          </div>
          <div className="stat-sub">
            <span>Ödənilmiş komissiya həcmi</span>
          </div>
        </div>

        <div className="analytics-stat-item outflow">
          <div className="stat-label-row">
            <span>Çıxarış & Xərclər</span>
            <ArrowUpRight size={16} className="text-danger" />
          </div>
          <div className="stat-value text-danger">
            -{totalOutflow.toFixed(2)} AZN
          </div>
          <div className="stat-sub">
            <span>{payoutCount} bank çıxarışı daxil</span>
          </div>
        </div>
      </div>

      {/* Visual Dynamic Ratio & Service Distribution Bar */}
      <div className="analytics-visual-section">
        <div className="visual-bar-header">
          <div className="visual-bar-title">
            <ShieldCheck size={16} className="text-primary-600" />
            <span>Gəlir və Komissiya Bölgüsü Nisbəti</span>
          </div>
          <div className="visual-bar-values">
            <span className="text-success font-semibold">Vendor Qazancı: {netEarningsRatio.toFixed(1)}%</span>
            <span className="visual-divider">•</span>
            <span className="text-secondary font-medium">Platforma: {commissionRatio.toFixed(1)}%</span>
          </div>
        </div>

        <div className="analytics-ratio-bar">
          <div 
            className="ratio-bar-segment vendor-net" 
            style={{ width: `${netEarningsRatio}%` }} 
            title={`Vendor Xalis Qazancı: ${netEarningsRatio.toFixed(1)}%`}
          />
          <div 
            className="ratio-bar-segment platform-commission" 
            style={{ width: `${commissionRatio}%` }} 
            title={`Platforma Komissiyası: ${commissionRatio.toFixed(1)}%`}
          />
        </div>

        {/* Breakdown by Revenue Category */}
        <div className="analytics-channels-grid">
          <div className="channel-box">
            <div className="channel-header">
              <Compass size={14} className="text-primary-600" />
              <span>Tur Biletləri</span>
            </div>
            <strong>{ticketSalesSum.toFixed(2)} AZN</strong>
            <small>{ticketSalesCount} rezervasiya</small>
          </div>

          <div className="channel-box">
            <div className="channel-header">
              <Building2 size={14} className="text-info-600" />
              <span>Otel Satışları</span>
            </div>
            <strong>{hotelSalesSum.toFixed(2)} AZN</strong>
            <small>{hotelSalesCount} sifariş</small>
          </div>

          <div className="channel-box">
            <div className="channel-header">
              <Layers size={14} className="text-warning-600" />
              <span>Fərdi Turlar</span>
            </div>
            <strong>{customTourSalesSum.toFixed(2)} AZN</strong>
            <small>{customTourSalesCount} tender satışı</small>
          </div>

          <div className="channel-box">
            <div className="channel-header">
              <CreditCard size={14} className="text-success-600" />
              <span>Köçürülmüş Vəsait</span>
            </div>
            <strong>{payoutSum.toFixed(2)} AZN</strong>
            <small>{payoutCount} çıxarış icra edilib</small>
          </div>
        </div>
      </div>
    </div>
  );
};
