import React, { useEffect, useState } from 'react';
import { Button, Badge } from '@toursales/ui';
import { MetricCard, DataTable } from '@/shared/components';
import { PayoutRequestModal } from '../../components/PayoutRequestModal/PayoutRequestModal';
import { SubscriptionStatusCard } from '../../components/SubscriptionStatusCard/SubscriptionStatusCard';
import { vendorFinanceApi } from '../../vendorFinanceApi';
import { CompanyBalance, PayoutRequest, LedgerEntry } from '@toursales/types';
import './VendorFinancePage.css';

export const VendorFinancePage: React.FC = () => {
  const [balance, setBalance] = useState<CompanyBalance | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balData, payoutsData, ledgerData] = await Promise.all([
        vendorFinanceApi.getBalance(),
        vendorFinanceApi.getPayoutRequests(),
        vendorFinanceApi.getLedger()
      ]);
      setBalance(balData);
      setPayouts(payoutsData);
      setLedger(ledgerData);
    } catch (err) {
      console.error('Failed to load finance data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Tamamlandı';
      case 'APPROVED': return 'Təsdiqləndi';
      case 'PENDING': return 'Gözləmədə';
      case 'REJECTED': return 'İmtina edildi';
      default: return status;
    }
  };

  return (
    <div className="vendor-finance-page">
      <div className="finance-header">
        <div>
          <h1>Maliyyə & Hesablaşma</h1>
          <p>Şirkətinizin balansını, gəlirlərini və pul çıxarışlarını idarə edin</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + Pul Çıxarışı Sorğusu
        </Button>
      </div>

      <div className="finance-metrics-grid">
        <MetricCard
          title="Mövcud Balans"
          value={`${balance?.availableBalance?.toFixed(2) || '0.00'} ${balance?.currency || 'AZN'}`}
          change="+14.2% bu həftə"
          isPositive={true}
          icon={<span style={{ fontSize: '1.25rem' }}>💰</span>}
        />
        <MetricCard
          title="Gözləmədəki Balans (Escrow)"
          value={`${balance?.pendingBalance?.toFixed(2) || '0.00'} ${balance?.currency || 'AZN'}`}
          change="Aktiv turlar başa çatdıqda"
          isPositive={true}
          icon={<span style={{ fontSize: '1.25rem' }}>⏳</span>}
        />
        <MetricCard
          title="Ümumi Çıxarılmış Məbləğ"
          value={`${balance?.totalWithdrawn?.toFixed(2) || '0.00'} ${balance?.currency || 'AZN'}`}
          change="Bank hesabınıza köçürülən"
          isPositive={true}
          icon={<span style={{ fontSize: '1.25rem' }}>🏦</span>}
        />
      </div>

      <SubscriptionStatusCard />

      <div className="finance-sections">
        <div className="finance-section-card">
          <h3>Pul Çıxarışı Sorğuları</h3>
          <DataTable
            data={payouts}
            columns={[
              { header: 'Sorğu ID', accessor: (p: PayoutRequest) => `#${p.id.slice(0, 8)}` },
              {
                header: 'Məbləğ',
                accessor: (p: PayoutRequest) => (
                  <span style={{ fontWeight: 700 }}>
                    {p.amount.toFixed(2)} {p.currency}
                  </span>
                )
              },
              { header: 'Bank Hesabı', accessor: 'bankAccount' },
              {
                header: 'Tarix',
                accessor: (p: PayoutRequest) => new Date(p.requestedAt).toLocaleDateString('az-AZ')
              },
              {
                header: 'Status',
                accessor: (p: PayoutRequest) => (
                  <Badge variant={getStatusBadgeVariant(p.status)}>
                    {getStatusLabel(p.status)}
                  </Badge>
                )
              }
            ]}
          />
        </div>

        <div className="finance-section-card">
          <h3>Maliyyə Əməliyyat Tarixçəsi (Ledger)</h3>
          <DataTable
            data={ledger}
            columns={[
              { header: 'Tarix', accessor: (l: LedgerEntry) => new Date(l.createdAt).toLocaleDateString('az-AZ') },
              { header: 'Hesab / Kateqoriya', accessor: 'account' },
              { header: 'Təsvir', accessor: 'description' },
              {
                header: 'Mədaxil (Kredit)',
                accessor: (l: LedgerEntry) => (
                  l.credit > 0 ? (
                    <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                      +{l.credit.toFixed(2)} {l.currency}
                    </span>
                  ) : '-'
                )
              },
              {
                header: 'Məxaric (Debet)',
                accessor: (l: LedgerEntry) => (
                  l.debit > 0 ? (
                    <span style={{ color: 'var(--color-error)', fontWeight: 600 }}>
                      -{l.debit.toFixed(2)} {l.currency}
                    </span>
                  ) : '-'
                )
              }
            ]}
          />
        </div>
      </div>

      <PayoutRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableBalance={balance?.availableBalance || 0}
        currency={balance?.currency || 'AZN'}
        onSuccess={loadData}
      />
    </div>
  );
};
