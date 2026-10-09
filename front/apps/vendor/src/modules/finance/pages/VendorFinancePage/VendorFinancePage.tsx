import React, { useEffect, useState } from 'react';
import { Button, Badge } from '@toursales/ui';
import { DataTable } from '@/shared/components';
import { PayoutRequestModal } from '../../components/PayoutRequestModal/PayoutRequestModal';
import { BankDetailsModal } from '../../components/BankDetailsModal/BankDetailsModal';
import { TransactionDetailModal } from '../../components/TransactionDetailModal/TransactionDetailModal';
import { EscrowBreakdownModal } from '../../components/EscrowBreakdownModal/EscrowBreakdownModal';
import { SubscriptionStatusCard } from '../../components/SubscriptionStatusCard/SubscriptionStatusCard';
import { 
  FinancialAnalyticsCard, 
  AnalyticsPeriod 
} from '../../components/FinancialAnalyticsCard/FinancialAnalyticsCard';
import { 
  vendorFinanceApi, 
  VendorCompanyBalance, 
  CurrentSubscriptionInfo,
  ExtendedLedgerEntry
} from '../../vendorFinanceApi';
import { PayoutRequest } from '@toursales/types';
import { 
  Download, 
  Wallet, 
  Clock, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle2, 
  TrendingUp, 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  RotateCcw,
  AlertCircle,
  Search,
  FileCode,
  FileText,
  Eye
} from 'lucide-react';
import './VendorFinancePage.css';

export const VendorFinancePage: React.FC = () => {
  const [balance, setBalance] = useState<VendorCompanyBalance | null>(null);
  const [subscription, setSubscription] = useState<CurrentSubscriptionInfo | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [ledger, setLedger] = useState<ExtendedLedgerEntry[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [payoutFilter, setPayoutFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isEscrowModalOpen, setIsEscrowModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ExtendedLedgerEntry | null>(null);
  const [exporting, setExporting] = useState(false);
  const [payoutToCancel, setPayoutToCancel] = useState<PayoutRequest | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>('ALL');

  const getPeriodDate = (period: AnalyticsPeriod): string | undefined => {
    const now = new Date();
    if (period === 'TODAY') {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
    if (period === 'LAST_7_DAYS') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d.toISOString();
    }
    if (period === 'LAST_30_DAYS') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString();
    }
    if (period === 'THIS_MONTH') {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
    return undefined;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balData, payoutsData, ledgerData, subData] = await Promise.all([
        vendorFinanceApi.getBalance(),
        vendorFinanceApi.getPayoutRequests(),
        vendorFinanceApi.getLedger({
          type: typeFilter !== 'ALL' ? typeFilter : undefined,
          search: debouncedSearch || undefined,
        }),
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
  }, [typeFilter, debouncedSearch]);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const startDate = getPeriodDate(analyticsPeriod);
      await vendorFinanceApi.exportTransactionsExcel({
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        startDate,
      });
    } catch (err) {
      console.error('Excel export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleConfirmCancelPayout = async () => {
    if (!payoutToCancel) return;
    try {
      setCanceling(true);
      await vendorFinanceApi.cancelPayoutRequest(payoutToCancel.id);
      setActionNotice({
        type: 'success',
        message: `#${payoutToCancel.id} nömrəli çıxarış sorğusu ləğv edildi və ${payoutToCancel.amount.toFixed(2)} ${payoutToCancel.currency} balansa qaytarıldı.`
      });
      setPayoutToCancel(null);
      await loadData();
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err?.response?.data?.msg || err?.response?.data?.message || 'Sorğu ləğv edilərkən xəta baş verdi.'
      });
    } finally {
      setCanceling(false);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
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
      case 'CANCELLED': return 'Ləğv edildi';
      case 'FAILED':
      case 'REJECTED': return 'İmtina edildi';
      default: return status;
    }
  };

  const filteredPayouts = payouts.filter((p) => {
    if (payoutFilter === 'ALL') return true;
    return p.status?.toUpperCase() === payoutFilter;
  });

  return (
    <div className="vendor-finance-page">
      {/* Header */}
      <div className="finance-header">
        <div>
          <h1>Maliyyə & Hesablaşma</h1>
          <p>Şirkətinizin balansını, gəlirlərini və pul çıxarışlarını idarə edin</p>
        </div>
        <div className="finance-header-actions">
          <Button variant="outline" onClick={() => setIsBankModalOpen(true)}>
            <Building2 size={16} />
            <span>Bank Rekvizitləri</span>
          </Button>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            + Pul Çıxarışı Sorğusu
          </Button>
        </div>
      </div>

      {actionNotice && (
        <div className={`finance-action-toast ${actionNotice.type}`}>
          {actionNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{actionNotice.message}</span>
        </div>
      )}

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
          <div className="finance-metric-sub text-secondary justify-between">
            <span>Aktiv turlar başa çatdıqda köçürülür</span>
            <button 
              type="button" 
              className="finance-escrow-breakdown-link"
              onClick={() => setIsEscrowModalOpen(true)}
            >
              Təfərrüatlar →
            </button>
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

      {/* Official Bank Account & Payout Details Card */}
      <div className="finance-bank-details-card">
        <div className="bank-card-left">
          <div className="bank-card-icon-wrap">
            <CreditCard size={24} />
          </div>
          <div className="bank-card-info">
            <div className="bank-card-badge">
              <ShieldCheck size={13} />
              <span>Əsas Çıxarış Hesabı</span>
            </div>
            <h4>{balance?.bankName || 'Azərbaycan Beynəlxalq Bankı (ABB)'}</h4>
            <div className="bank-card-iban-row">
              <span className="bank-card-lbl">IBAN:</span>
              <strong className="font-mono">{balance?.iban || 'Qeyd edilməyib'}</strong>
              {balance?.voen && (
                <>
                  <span className="bank-card-divider">•</span>
                  <span className="bank-card-lbl">VÖEN:</span>
                  <strong className="font-mono">{balance.voen}</strong>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="bank-card-right">
          <Button variant="outline" size="sm" onClick={() => setIsBankModalOpen(true)}>
            Rekvizitləri Dəyiş
          </Button>
        </div>
      </div>

      {/* Active Subscription Status Banner */}
      <SubscriptionStatusCard subscription={subscription} />

      {/* Financial Analytics & Turnover Dynamics Card (Stage 4) */}
      <FinancialAnalyticsCard
        ledger={ledger}
        balance={balance}
        selectedPeriod={analyticsPeriod}
        onPeriodChange={setAnalyticsPeriod}
      />

      {/* Main Finance Sections */}
      <div className="finance-sections">
        {/* Payout Requests Section */}
        <div className="finance-section-card">
          <div className="finance-card-title-row">
            <div>
              <h3>Pul Çıxarışı Sorğuları</h3>
              <p className="finance-card-subtitle">Bank hesabınıza köçürmə tələbləri və icra statusları</p>
            </div>

            <div className="finance-payout-filter-group">
              <div className="finance-filter-pills">
                <button
                  type="button"
                  className={`finance-pill ${payoutFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setPayoutFilter('ALL')}
                >
                  Hamısı ({payouts.length})
                </button>
                <button
                  type="button"
                  className={`finance-pill ${payoutFilter === 'PENDING' ? 'active' : ''}`}
                  onClick={() => setPayoutFilter('PENDING')}
                >
                  Gözləmədə ({payouts.filter(p => p.status?.toUpperCase() === 'PENDING').length})
                </button>
                <button
                  type="button"
                  className={`finance-pill ${payoutFilter === 'COMPLETED' ? 'active' : ''}`}
                  onClick={() => setPayoutFilter('COMPLETED')}
                >
                  Tamamlandı ({payouts.filter(p => p.status?.toUpperCase() === 'COMPLETED').length})
                </button>
                <button
                  type="button"
                  className={`finance-pill ${payoutFilter === 'CANCELLED' ? 'active' : ''}`}
                  onClick={() => setPayoutFilter('CANCELLED')}
                >
                  Ləğv edildi ({payouts.filter(p => p.status?.toUpperCase() === 'CANCELLED').length})
                </button>
              </div>
            </div>
          </div>

          <DataTable<PayoutRequest>
            data={filteredPayouts}
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
                  <strong className="text-primary-700 text-base">
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
              {
                header: 'Əməliyyat',
                render: (p: PayoutRequest) =>
                  p.status?.toUpperCase() === 'PENDING' ? (
                    <button
                      type="button"
                      className="finance-payout-cancel-action-btn"
                      onClick={() => setPayoutToCancel(p)}
                      title="Sorğunu ləğv et və pulu balansa qaytar"
                    >
                      <RotateCcw size={13} />
                      <span>Ləğv et</span>
                    </button>
                  ) : (
                    <span className="text-muted text-xs">—</span>
                  ),
              },
            ]}
            emptyMessage="Bu filtrə uyğun heç bir pul çıxarışı sorğusu tapılmadı."
          />
        </div>

        {/* Transactions / Ledger Section */}
        <div className="finance-section-card">
          <div className="finance-card-title-row">
            <div>
              <h3>Maliyyə Əməliyyat Tarixçəsi (Ledger)</h3>
              <p className="finance-card-subtitle">Bütün satışlar, komissiyalar, çıxarışlar və vergi sənədləri</p>
            </div>

            <div className="finance-transactions-actions">
              {/* Search Bar */}
              <div className="finance-ledger-search-box">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  placeholder="Tur, sərnişin və ya TX axtar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    className="finance-search-clear" 
                    onClick={() => setSearchQuery('')}
                  >
                    ×
                  </button>
                )}
              </div>

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
                  className={`finance-pill ${typeFilter === 'TICKET_SALE_DEPOSIT' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('TICKET_SALE_DEPOSIT')}
                >
                  Depozit
                </button>
                <button
                  type="button"
                  className={`finance-pill ${typeFilter === 'PAYOUT' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('PAYOUT')}
                >
                  Çıxarış
                </button>
                <button
                  type="button"
                  className={`finance-pill ${typeFilter === 'SUBSCRIPTION' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('SUBSCRIPTION')}
                >
                  Abunəlik / Xərc
                </button>
                <button
                  type="button"
                  className={`finance-pill ${typeFilter === 'REFUND' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('REFUND')}
                >
                  Qaytarılma
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

          <DataTable<ExtendedLedgerEntry>
            data={ledger}
            columns={[
              {
                header: 'Tarix',
                render: (l: ExtendedLedgerEntry) => (
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
                render: (l: ExtendedLedgerEntry) => (
                  <span className="font-semibold text-primary-700">
                    {l.account}
                  </span>
                ),
              },
              {
                header: 'Təsvir & Tur',
                render: (l: ExtendedLedgerEntry) => (
                  <div className="finance-tx-desc-cell">
                    <span className="finance-tx-main-desc">{l.description}</span>
                    {l.tourTitle && (
                      <span className="finance-tx-sub-info">
                        Tur: <strong>{l.tourTitle}</strong> {l.passengerName ? `• ${l.passengerName}` : ''}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                header: 'Mədaxil (Kredit)',
                render: (l: ExtendedLedgerEntry) =>
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
                render: (l: ExtendedLedgerEntry) =>
                  l.debit > 0 ? (
                    <span className="text-danger font-bold flex items-center gap-1" style={{ color: '#dc2626' }}>
                      <ArrowUpRight size={14} />
                      -{l.debit.toFixed(2)} {l.currency}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  ),
              },
              {
                header: 'Status',
                render: (l: ExtendedLedgerEntry) => (
                  <Badge variant={getStatusBadgeVariant(l.status)} pill>
                    {getStatusLabel(l.status)}
                  </Badge>
                ),
              },
              {
                header: 'Əməliyyatlar',
                render: (l: ExtendedLedgerEntry) => (
                  <div className="finance-row-actions">
                    <button
                      type="button"
                      className="finance-action-icon-btn"
                      onClick={() => setSelectedTransaction(l)}
                      title="Əməliyyat təfərrüatları"
                    >
                      <Eye size={15} />
                    </button>
                    {l.bookingId && (
                      <>
                        <button
                          type="button"
                          className="finance-action-icon-btn xml"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await vendorFinanceApi.downloadEQaimeXML(l.bookingId!);
                            } catch (err) {
                              console.error(err);
                              alert('e-Qaimə XML endirilmədi.');
                            }
                          }}
                          title="Azərbaycan DVX e-Qaimə (XML) Endir"
                        >
                          <FileCode size={15} />
                        </button>
                        <button
                          type="button"
                          className="finance-action-icon-btn pdf"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await vendorFinanceApi.downloadInvoicePdf(l.bookingId!);
                            } catch (err) {
                              console.error(err);
                              alert('Faktura PDF endirilmədi.');
                            }
                          }}
                          title="Rəsmi Faktura (PDF) Endir"
                        >
                          <FileText size={15} />
                        </button>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
            emptyMessage="Axtarışa və ya filtrə uyğun heç bir maliyyə əməliyyatı qeydə alınmayıb."
          />
        </div>
      </div>

      {/* Payout Request Modal */}
      <PayoutRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableBalance={balance?.availableBalance || 0}
        initialIban={balance?.iban}
        initialBankName={balance?.bankName}
        currency={balance?.currency || 'AZN'}
        onSuccess={loadData}
      />

      {/* Bank Details Modal */}
      <BankDetailsModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        initialData={{
          iban: balance?.iban,
          bankName: balance?.bankName,
          voen: balance?.voen,
          swiftBic: balance?.swiftBic,
          bankCode: balance?.bankCode,
        }}
        onSuccess={loadData}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />

      {/* Escrow Breakdown Modal */}
      <EscrowBreakdownModal
        isOpen={isEscrowModalOpen}
        onClose={() => setIsEscrowModalOpen(false)}
        pendingBalance={balance?.pendingBalance || 0}
        currency={balance?.currency || 'AZN'}
      />

      {/* Payout Cancellation Confirmation Modal */}
      {payoutToCancel && (
        <div className="finance-cancel-modal-overlay" onClick={() => setPayoutToCancel(null)}>
          <div className="finance-cancel-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cancel-modal-header">
              <div className="cancel-modal-icon">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3>Çıxarış Sorğusunu Ləğv Et?</h3>
                <p className="cancel-modal-sub">
                  #{payoutToCancel.id} nömrəli sorğu ləğv ediləcək və məbləğ dərhal balansınıza bərpa olunacaq.
                </p>
              </div>
            </div>

            <div className="cancel-modal-summary">
              <div className="cancel-summary-row">
                <span>Sorğu Məbləği:</span>
                <strong>{payoutToCancel.amount.toFixed(2)} {payoutToCancel.currency}</strong>
              </div>
              <div className="cancel-summary-row">
                <span>Bank Hesabı:</span>
                <span className="font-mono text-xs">{payoutToCancel.bankAccount}</span>
              </div>
              <div className="cancel-summary-row highlight">
                <span>Balansa Qayıdacaq Məbləğ:</span>
                <strong className="text-success">+{payoutToCancel.amount.toFixed(2)} {payoutToCancel.currency}</strong>
              </div>
            </div>

            <div className="cancel-modal-actions">
              <Button variant="secondary" onClick={() => setPayoutToCancel(null)} disabled={canceling}>
                Bağla
              </Button>
              <Button variant="danger" onClick={handleConfirmCancelPayout} isLoading={canceling}>
                Bəli, Sorğunu Ləğv Et
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
