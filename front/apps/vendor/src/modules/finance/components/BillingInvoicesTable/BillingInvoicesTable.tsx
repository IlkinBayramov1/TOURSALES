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

  const formatAzeriDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
      'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const mapPaymentMethod = (method: string | null | undefined): string => {
    if (!method) return '—';
    const upper = method.toUpperCase();
    if (upper === 'BALANCE') return 'Platforma Balansı';
    if (upper === 'CARD') return 'Bank Kartı';
    if (upper === 'BANK_TRANSFER') return 'B2B Bank Köçürməsi';
    return method;
  };

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
              <span className="text-sm font-medium text-slate-700">
                {formatAzeriDate(inv.paymentDate)}
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
              <span className="text-secondary text-sm font-medium">
                {mapPaymentMethod(inv.paymentMethod)}
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
