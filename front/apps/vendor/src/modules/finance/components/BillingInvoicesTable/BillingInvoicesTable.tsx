import React, { useEffect, useState } from 'react';
import { Badge, Button } from '@toursales/ui';
import { DataTable } from '@/shared/components';
import { SubscriptionPaymentItem, vendorFinanceApi } from '../../vendorFinanceApi';
import { FileText, Printer, CheckCircle2, Clock } from 'lucide-react';
import './BillingInvoicesTable.css';

interface BillingInvoicesTableProps {
  onViewInvoice: (paymentId: string) => void;
  refreshKey?: number;
}

export const BillingInvoicesTable: React.FC<BillingInvoicesTableProps> = ({
  onViewInvoice,
  refreshKey,
}) => {
  const [invoices, setInvoices] = useState<SubscriptionPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await vendorFinanceApi.getBillingHistory();
      setInvoices(data);
    } catch (err) {
      console.error('Fakturalar yüklənmədi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [refreshKey]);

  return (
    <div className="invoices-section-card">
      <div className="invoices-header-row">
        <div>
          <h3>Fakturalar və Ödəniş Tarixçəsi</h3>
          <p>Şirkətinizin bütün rəsmi abunəlik invoysları və ödəniş qəbzləri</p>
        </div>
        <span className="invoices-count-badge">{invoices.length} Faktura</span>
      </div>

      <DataTable<SubscriptionPaymentItem>
        data={invoices}
        isLoading={loading}
        columns={[
          {
            header: 'Faktura №',
            render: (inv: SubscriptionPaymentItem) => (
              <span className="font-mono font-bold text-primary">
                {inv.invoiceNumber}
              </span>
            ),
          },
          {
            header: 'Tarix',
            render: (inv: SubscriptionPaymentItem) => (
              <span>
                {new Date(inv.paymentDate).toLocaleDateString('az-AZ', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            ),
          },
          {
            header: 'Abunəlik Planı',
            render: (inv: SubscriptionPaymentItem) => (
              <span className="font-semibold text-slate-800">
                {inv.planName}
              </span>
            ),
          },
          {
            header: 'Məbləğ',
            render: (inv: SubscriptionPaymentItem) => (
              <strong>
                {inv.amount.toFixed(2)} {inv.currency}
              </strong>
            ),
          },
          {
            header: 'Ödəniş Üsulu',
            render: (inv: SubscriptionPaymentItem) => (
              <span className="text-secondary text-sm">
                {inv.paymentMethod}
              </span>
            ),
          },
          {
            header: 'Status',
            render: (inv: SubscriptionPaymentItem) => (
              <Badge
                variant={inv.status?.toUpperCase() === 'PAID' ? 'success' : 'warning'}
                pill
              >
                {inv.status?.toUpperCase() === 'PAID' ? 'Ödənilib' : 'Gözləmədə'}
              </Badge>
            ),
          },
          {
            header: 'Əməliyyat',
            render: (inv: SubscriptionPaymentItem) => (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewInvoice(inv.id)}
              >
                <Printer size={14} />
                <span>Bax / Çap</span>
              </Button>
            ),
          },
        ]}
        emptyMessage="Hələ heç bir faktura qeydə alınmayıb."
      />
    </div>
  );
};
