import React, { useEffect, useState } from 'react';
import { Button, Spinner } from '@toursales/ui';
import { SubscriptionInvoice, vendorFinanceApi } from '../../vendorFinanceApi';
import { Printer, Download, CheckCircle2, Building2 } from 'lucide-react';
import './InvoicePrintModal.css';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string | null;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  paymentId,
}) => {
  const [invoice, setInvoice] = useState<SubscriptionInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && paymentId) {
      const fetchDetails = async () => {
        try {
          setLoading(true);
          const data = await vendorFinanceApi.getInvoiceDetails(paymentId);
          setInvoice(data);
        } catch (err) {
          console.error('Faktura detalları yüklənmədi:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }
  }, [isOpen, paymentId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div className="invoice-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="invoice-modal-top-bar no-print">
          <div className="invoice-top-title">Elektron Faktura / Qəbz</div>
          <div className="invoice-top-actions">
            <Button variant="outline" size="sm" onClick={onClose}>
              Bağla
            </Button>
            <Button variant="primary" size="sm" onClick={handlePrint}>
              <Printer size={15} />
              <span>Çap Et</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="invoice-loading-box">
            <Spinner size="lg" />
            <p>Faktura sənədi hazırlanır...</p>
          </div>
        ) : invoice ? (
          <div className="printable-invoice-paper" id="printable-invoice">
            {/* Header */}
            <div className="invoice-paper-header">
              <div>
                <div className="invoice-brand-title">TOURSALES</div>
                <div className="invoice-brand-sub">Turizm və Bilet Satışı Sistemi</div>
                <div className="invoice-doc-type">RƏSMİ ELEKTRON FAKTURA</div>
              </div>
              <div className="invoice-number-box">
                <div className="invoice-number-label">Faktura Nömrəsi:</div>
                <div className="invoice-number-val">{invoice.invoiceNumber}</div>
                <div className="invoice-status-tag">
                  <CheckCircle2 size={13} />
                  <span>{invoice.status === 'Paid' ? 'ÖDƏNİLİB' : 'GÖZLƏMƏDƏ'}</span>
                </div>
              </div>
            </div>

            {/* Parties Info */}
            <div className="invoice-parties-grid">
              <div className="invoice-party-col">
                <span className="party-title">XİDMƏT GÖSTƏRƏN:</span>
                <h4>{invoice.seller.name}</h4>
                <p><strong>VÖEN:</strong> {invoice.seller.voen}</p>
                <p><strong>Ünvan:</strong> {invoice.seller.address}</p>
                <p><strong>E-poçt:</strong> {invoice.seller.email}</p>
                <p><strong>Bank IBAN:</strong> {invoice.seller.iban}</p>
              </div>

              <div className="invoice-party-col">
                <span className="party-title">MÜŞTƏRİ (TƏRƏFDAŞ ŞİRKƏT):</span>
                <h4>{invoice.customer.name}</h4>
                <p><strong>Şirkət ID:</strong> {invoice.customer.id}</p>
                <p><strong>VÖEN:</strong> {invoice.customer.voen}</p>
                <p><strong>Ünvan:</strong> {invoice.customer.address}</p>
                <p><strong>Əlaqə:</strong> {invoice.customer.phone}</p>
              </div>
            </div>

            {/* Dates & Method */}
            <div className="invoice-meta-banner">
              <div>
                <span className="meta-lbl">Tərtib Tarixi:</span>
                <strong>
                  {new Date(invoice.issueDate).toLocaleDateString('az-AZ', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
              </div>
              <div>
                <span className="meta-lbl">Növbəti Yenilənmə:</span>
                <strong>
                  {new Date(invoice.dueDate).toLocaleDateString('az-AZ', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
              </div>
              <div>
                <span className="meta-lbl">Ödəniş Üsulu:</span>
                <strong>{invoice.paymentMethod}</strong>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th>Xidmətin Təsviri</th>
                  <th>Dövr</th>
                  <th style={{ textAlign: 'center' }}>Say</th>
                  <th style={{ textAlign: 'right' }}>Vahid Qiymət</th>
                  <th style={{ textAlign: 'right' }}>Cəmi Məbləğ</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td><strong>{item.description}</strong></td>
                    <td>{item.period}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{item.unitPrice.toFixed(2)} {invoice.currency}</td>
                    <td style={{ textAlign: 'right' }}><strong>{item.total.toFixed(2)} {invoice.currency}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="invoice-totals-row">
              <div className="invoice-stamp-box">
                <div className="invoice-stamp-inner">
                  <span>TOURSALES BILLING</span>
                  <span>TƏSDİQ EDİLDİ</span>
                  <span className="stamp-date">{new Date().toISOString().slice(0, 10)}</span>
                </div>
              </div>

              <div className="invoice-amounts-box">
                <div className="amount-line">
                  <span>Aralıq Cəm:</span>
                  <strong>{invoice.subtotal.toFixed(2)} {invoice.currency}</strong>
                </div>
                <div className="amount-line">
                  <span>ƏDV (0%):</span>
                  <strong>0.00 {invoice.currency}</strong>
                </div>
                <div className="amount-line grand-total">
                  <span>Yekun Ödənilən Məbləğ:</span>
                  <span className="grand-val">{invoice.total.toFixed(2)} {invoice.currency}</span>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="invoice-paper-footer">
              <p>Bu elektron faktura TOURSALES Partner portalı vasitəsilə avtomatik generasiya edilmişdir və hüquqi qüvvəyə malikdir.</p>
              <p>Hər hansı sualınız olduqda billing@toursales.az ünvanına müraciət edə bilərsiniz.</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
