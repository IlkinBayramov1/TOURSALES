import React, { useEffect, useState } from 'react';
import { Button, Badge } from '@toursales/ui';
import { DollarSign, TrendingUp, Scale, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { StatCard } from '../../../../shared/components/StatCard/StatCard';
import { DataTable } from '../../../../shared/components/DataTable/DataTable';
import { ProcessPayoutModal } from '../../components/ProcessPayoutModal/ProcessPayoutModal';
import { financeAuditApi } from '../../financeAuditApi';
import { PlatformFinancialSummary, PayoutRequest, LedgerEntry } from '@toursales/types';
import './FinanceAuditPage.css';

export const FinanceAuditPage: React.FC = () => {
  const [summary, setSummary] = useState<PlatformFinancialSummary | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumData, payData, ledData] = await Promise.all([
        financeAuditApi.getSummary(),
        financeAuditApi.getPayouts(),
        financeAuditApi.getLedger()
      ]);
      setSummary(sumData);
      setPayouts(payData);
      setLedger(ledData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="finance-audit-page">
      <div className="audit-header">
        <div>
          <h1>Maliyyə Auditi & Çıxarış Nəzarəti</h1>
          <p>Bütün platforma əməliyyatlarının ikiqat mühasibat uçotu (double-entry ledger) və bank köçürmələri</p>
        </div>

        <div className={`balance-status-badge ${summary?.isLedgerBalanced ? 'balanced' : 'unbalanced'}`}>
          {summary?.isLedgerBalanced ? (
            <>
              <CheckCircle2 size={16} />
              <span>Ledger Balansı Dəqiqdir (Balanced)</span>
            </>
          ) : (
            <>
              <AlertTriangle size={16} />
              <span>Diqqət: Ledger Balansı Pozulub</span>
            </>
          )}
        </div>
      </div>

      <div className="audit-metrics-grid">
        <StatCard
          title="Ümumi Bilet Dövriyyəsi (Turnover)"
          value={`${summary?.totalTurnover.toLocaleString('az-AZ') || '0'} ${summary?.currency || 'AZN'}`}
          icon={<DollarSign size={20} />}
          subtext="Müştərilərdən daxil olan ümumi məbləğ"
        />
        <StatCard
          title="Platforma Xalis Komissiyası"
          value={`${summary?.totalCommissions.toLocaleString('az-AZ') || '0'} ${summary?.currency || 'AZN'}`}
          icon={<TrendingUp size={20} />}
          subtext="Platformanın xalis qazancı"
        />
        <StatCard
          title="Agentliklərə Köçürülən (Payouts)"
          value={`${summary?.totalPayouts.toLocaleString('az-AZ') || '0'} ${summary?.currency || 'AZN'}`}
          icon={<ArrowUpRight size={20} />}
          subtext="Təsdiqlənmiş bank köçürmələri"
        />
        <StatCard
          title="Gözləyən Çıxarış Sayı"
          value={summary?.pendingPayoutsCount || 0}
          icon={<Scale size={20} />}
          subtext="Admin təsdiqi gözləyən sorğular"
        />
      </div>

      <div className="audit-section-card">
        <h3>Agentliklərin Pul Çıxarışı Sorğuları</h3>
        <DataTable
          data={payouts}
          columns={[
            { header: 'Sorğu ID', accessor: (p: PayoutRequest) => `#${p.id}` },
            { header: 'Agentlik', accessor: (p: PayoutRequest) => p.companyName || p.companyId },
            {
              header: 'Məbləğ',
              accessor: (p: PayoutRequest) => (
                <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {p.amount.toFixed(2)} {p.currency}
                </span>
              )
            },
            { header: 'Bank Hesabı (IBAN)', accessor: (p: PayoutRequest) => <span style={{ fontFamily: 'monospace' }}>{p.bankAccount}</span> },
            { header: 'Tarix', accessor: (p: PayoutRequest) => new Date(p.requestedAt).toLocaleDateString('az-AZ') },
            {
              header: 'Status',
              accessor: (p: PayoutRequest) => (
                <Badge variant={p.status === 'COMPLETED' ? 'success' : p.status === 'PENDING' ? 'warning' : 'error'}>
                  {p.status === 'COMPLETED' ? 'Ödənilib' : p.status === 'PENDING' ? 'Gözləmədə' : 'İmtina'}
                </Badge>
              )
            },
            {
              header: 'Əməliyyat',
              accessor: (p: PayoutRequest) => (
                p.status === 'PENDING' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedPayout(p)}
                  >
                    İcra Et
                  </Button>
                ) : (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Tamamlanıb</span>
                )
              )
            }
          ]}
        />
      </div>

      <div className="audit-section-card">
        <h3>Baş Mühasibat Ledger Qeydləri (Double-Entry Audit)</h3>
        <DataTable
          data={ledger}
          columns={[
            { header: 'Tarix', accessor: (l: LedgerEntry) => new Date(l.createdAt).toLocaleString('az-AZ') },
            { header: 'Uçot Hesabı', accessor: 'account' },
            { header: 'Əməliyyat Təsviri', accessor: 'description' },
            {
              header: 'Debet',
              accessor: (l: LedgerEntry) => l.debit > 0 ? (
                <span style={{ color: 'var(--color-error)', fontWeight: 600 }}>
                  -{l.debit.toFixed(2)} {l.currency}
                </span>
              ) : '—'
            },
            {
              header: 'Kredit',
              accessor: (l: LedgerEntry) => l.credit > 0 ? (
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                  +{l.credit.toFixed(2)} {l.currency}
                </span>
              ) : '—'
            }
          ]}
        />
      </div>

      <ProcessPayoutModal
        payout={selectedPayout}
        isOpen={!!selectedPayout}
        onClose={() => setSelectedPayout(null)}
        onSuccess={loadData}
      />
    </div>
  );
};
