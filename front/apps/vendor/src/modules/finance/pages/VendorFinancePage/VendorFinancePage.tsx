import React, { useEffect, useState } from 'react';
import { Button, Badge } from '@toursales/ui';
import { MetricCard, DataTable, Column } from '@/shared/components';
import { PayoutRequestModal } from '../../components/PayoutRequestModal/PayoutRequestModal';
import { SubscriptionStatusCard } from '../../components/SubscriptionStatusCard/SubscriptionStatusCard';
import { 
  vendorFinanceApi, 
  VendorCompanyBalance, 
  CurrentSubscriptionInfo 
} from '../../vendorFinanceApi';
import { PayoutRequest, LedgerEntry } from '@toursales/types';
import { Download, Wallet, Clock, ArrowDownRight, ArrowUpRight, CheckCircle2, TrendingUp, Building2 } from 'lucide-react';
import './VendorFinancePage.css';

export const VendorFinancePage: React.FC = () => {
  const [balance, setBalance] = useState<VendorCompanyBalance | null>(null);
  const [subscription, setSubscription] = useState<CurrentSubscriptionInfo | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balData, payoutsData, ledgerData, subData] = await Promise.all([
        vendorFinanceApi.getBalance(),
        vendorFinanceApi.getPayoutRequests(),
        vendorFinanceApi.getLedger(typeFilter !== 'ALL' ? { type: typeFilter } : undefined),
        vendorFinanceApi.getCurrentSubscription(),
      ]);
      setBalance(balData);
      setPayouts(payoutsData);
      setLedger(ledgerData);
      setSubscription(subData);
    } catch (err) {
      console.error('Failed to load finance data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter]);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      await vendorFinanceApi.exportTransactionsExcel(typeFilter !== 'ALL' ? { type: typeFilter } : undefined);
    } catch (err) {
      console.error('Excel export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
      case 'REJECTED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'Tamamlandı';
      case 'APPROVED': return 'Təsdiqləndi';
      case 'PENDING': return 'Gözləmədə';
      case 'FAILED':
      case 'REJECTED': return 'İmtina edildi';
      default: return status;
    }
  };

  return (
    <div className="vendor-finance-page">
      {/* Header */}
      <div className="finance-header">
        <div>
          <h1>Maliyyə & Hesablaşma</h1>
          <p>Şirkətinizin balansını, gəlirlərini və pul çıxarışlarını idarə edin</p>
        </div>
        <div className="finance-header-actions">
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            + Pul Çıxarışı Sorğusu
          </Button>
        </div>
      </div>

      {/* 4 Dynamic Financial KPI Cards */}
      <div className="finance-metrics-grid">
        <div className="finance-metric-card primary">
          <div className="finance-metric-header">
            <span className="finance-metric-title">Mövcud Balans</span>
            <div className="finance-metric-icon primary">
              <Wallet size={20} />
            </div>
          </div>
          <div className="finance-metric-val">
            {balance?.availableBalance?.toFixed(2) || '0.00'} {balance?.currency || 'AZN'}
          </div>
          <div className="finance-metric-sub text-success">
            <CheckCircle2 size={14} />
            <span>Çıxarışa tam hazır xalis məbləğ</span>
          </div>
        </div>

        <div className="finance-metric-card info">
          <div className="finance-metric-header">
            <span className="finance-metric-title">Gözləmədəki Balans (Escrow)</span>
            <div className="finance-metric-icon info">
              <Clock size={20} />
            </div>
          </div>
          <div className="finance-metric-val">
            {balance?.pendingBalance?.toFixed(2) || '0.00'} {balance?.currency || 'AZN'}
          </div>
          <div className="finance-metric-sub text-secondary">
            <span>Aktiv turlar başa çatdıqda köçürülür</span>
          </div>
        </div>

        <div className="finance-metric-card success">
          <div className="finance-metric-header">
            <span className="finance-metric-title">Ümumi Çıxarılmış Məbləğ</span>
            <div className="finance-metric-icon success">
              <Building2 size={20} />
            </div>
          </div>
          <div className="finance-metric-val">
            {balance?.totalWithdrawn?.toFixed(2) || '0.00'} {balance?.currency || 'AZN'}
          </div>
          <div className="finance-metric-sub text-secondary">
            <span>Bank hesabınıza uğurla köçürülən</span>
          </div>
        </div>

        <div className="finance-metric-card warning">
          <div className="finance-metric-header">
            <span className="finance-metric-title">Cəmi Bilet Satışı Dövriyyəsi</span>
            <div className="finance-metric-icon warning">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="finance-metric-val">
            {balance?.totalTurnover?.toFixed(2) || '0.00'} {balance?.currency || 'AZN'}
          </div>
          <div className="finance-metric-sub text-secondary">
            <span>Platforma komissiyası: {balance?.totalCommissions?.toFixed(2) || '0.00'} AZN</span>
          </div>
        </div>
      </div>

      {/* Active Subscription Status Banner */}
      <SubscriptionStatusCard subscription={subscription} />

      {/* Main Finance Sections */}
      <div className="finance-sections">
        {/* Payout Requests Section */}
        <div className="finance-section-card">
          <div className="finance-card-title-row">
            <h3>Pul Çıxarışı Sorğuları</h3>
            <span className="finance-card-badge">{payouts.length} sorğu</span>
          </div>

          <DataTable<PayoutRequest>
            data={payouts}
            columns={[
              {
                header: 'Sorğu ID',
                render: (p: PayoutRequest) => (
                  <span className="font-mono font-bold text-primary-600">
                    #{p.id}
                  </span>
                ),
              },
              {
                header: 'Məbləğ',
                render: (p: PayoutRequest) => (
                  <strong className="text-primary-700">
                    {p.amount.toFixed(2)} {p.currency}
                  </strong>
                ),
              },
              {
                header: 'Bank Hesabı (IBAN)',
                render: (p: PayoutRequest) => (
                  <span className="font-mono text-secondary text-sm">
                    {p.bankAccount}
                  </span>
                ),
              },
              {
                header: 'Sorğu Tarixi',
                render: (p: PayoutRequest) => (
                  <span>
                    {new Date(p.requestedAt).toLocaleDateString('az-AZ', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                ),
              },
              {
                header: 'Status',
                render: (p: PayoutRequest) => (
                  <Badge variant={getStatusBadgeVariant(p.status)} pill>
                    {getStatusLabel(p.status)}
                  </Badge>
                ),
              },
            ]}
            emptyMessage="Hələ heç bir pul çıxarışı sorğusu göndərilməyib."
          />
        </div>

        {/* Transactions / Ledger Section */}
        <div className="finance-section-card">
          <div className="finance-card-title-row">
            <div>
              <h3>Maliyyə Əməliyyat Tarixçəsi (Ledger)</h3>
              <p className="finance-card-subtitle">Bütün satışlar, komissiyalar və çıxarışlar</p>
            </div>

            <div className="finance-transactions-actions">
              {/* Type Filter Pills */}
              <div className="finance-filter-pills">
                <button
                  type="button"
                  className={`finance-pill ${typeFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('ALL')}
                >
                  Hamısı
                </button>
                <button
                  type="button"
                  className={`finance-pill ${typeFilter === 'TICKET_SALE' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('TICKET_SALE')}
                >
                  Bilet Satışı
                </button>
                <button
                  type="button"
                  className={`finance-pill ${typeFilter === 'PAYOUT' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('PAYOUT')}
                >
                  Çıxarış
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                isLoading={exporting}
              >
                <Download size={15} />
                <span>Excel Hesabat</span>
              </Button>
            </div>
          </div>

          <DataTable<LedgerEntry>
            data={ledger}
            columns={[
              {
                header: 'Tarix',
                render: (l: LedgerEntry) => (
                  <span>
                    {new Date(l.createdAt).toLocaleDateString('az-AZ', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                ),
              },
              {
                header: 'Kateqoriya',
                render: (l: LedgerEntry) => (
                  <span className="font-semibold text-primary-700">
                    {l.account}
                  </span>
                ),
              },
              {
                header: 'Təsvir',
                render: (l: LedgerEntry) => (
                  <span className="text-secondary text-sm">
                    {l.description}
                  </span>
                ),
              },
              {
                header: 'Mədaxil (Kredit)',
                render: (l: LedgerEntry) =>
                  l.credit > 0 ? (
                    <span className="text-success font-bold flex items-center gap-1">
                      <ArrowDownRight size={14} />
                      +{l.credit.toFixed(2)} {l.currency}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  ),
              },
              {
                header: 'Məxaric (Debet)',
                render: (l: LedgerEntry) =>
                  l.debit > 0 ? (
                    <span className="text-danger font-bold flex items-center gap-1" style={{ color: '#dc2626' }}>
                      <ArrowUpRight size={14} />
                      -{l.debit.toFixed(2)} {l.currency}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  ),
              },
            ]}
            emptyMessage="Maliyyə əməliyyatı qeydə alınmayıb."
          />
        </div>
      </div>

      {/* Payout Request Modal */}
      <PayoutRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableBalance={balance?.availableBalance || 0}
        initialIban={balance?.iban}
        currency={balance?.currency || 'AZN'}
        onSuccess={loadData}
      />
    </div>
  );
};
