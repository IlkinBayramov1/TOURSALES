import React, { useState } from 'react';
import { Button, Badge } from '@toursales/ui';
import { 
  FileText, 
  Download, 
  Printer, 
  User, 
  Calendar, 
  Compass, 
  CheckCircle2, 
  Building2, 
  Phone, 
  CreditCard,
  Percent,
  Layers,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { ExtendedLedgerEntry, vendorFinanceApi } from '../../vendorFinanceApi';
import './TransactionDetailModal.css';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: ExtendedLedgerEntry | null;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const [downloadingXml, setDownloadingXml] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleDownloadXml = async () => {
    if (!transaction.bookingId) return;
    try {
      setDownloadingXml(true);
      await vendorFinanceApi.downloadEQaimeXML(transaction.bookingId);
    } catch (err) {
      console.error('e-Qaimə XML endirmə xətası:', err);
      alert('e-Qaimə XML faylı hazırlanarkən xəta baş verdi.');
    } finally {
      setDownloadingXml(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!transaction.bookingId) return;
    try {
      setDownloadingPdf(true);
      await vendorFinanceApi.downloadInvoicePdf(transaction.bookingId);
    } catch (err) {
      console.error('PDF faktura endirmə xətası:', err);
      alert('PDF faktura hazırlanarkən xəta baş verdi.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isIncome = transaction.credit > 0;

  return (
    <div className="tx-modal-overlay" onClick={onClose}>
      <div className="tx-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tx-modal-header no-print">
          <div className="tx-modal-title-group">
            <div className={`tx-modal-badge-icon ${isIncome ? 'income' : 'expense'}`}>
              {isIncome ? <ArrowDownRight size={22} /> : <ArrowUpRight size={22} />}
            </div>
            <div>
              <h3>Əməliyyat Təfərrüatları</h3>
              <p className="font-mono text-sm">Tranzaksiya #{transaction.id}</p>
            </div>
          </div>
          <button type="button" className="tx-modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="tx-modal-body">
          {/* Main Amount Card */}
          <div className={`tx-amount-hero ${isIncome ? 'income' : 'expense'}`}>
            <span className="tx-amount-sub">{transaction.account}</span>
            <div className="tx-amount-val">
              {isIncome ? '+' : '-'}{transaction.amount.toFixed(2)} {transaction.currency}
            </div>
            <div className="tx-status-pill">
              <CheckCircle2 size={13} />
              <span>Status: {transaction.status === 'Completed' ? 'Tamamlandı' : transaction.status}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="tx-details-grid">
            <div className="tx-detail-item">
              <span className="tx-lbl"><Calendar size={14} /> Tarix & Vaxt</span>
              <strong className="tx-val">
                {new Date(transaction.createdAt).toLocaleString('az-AZ', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </div>

            <div className="tx-detail-item">
              <span className="tx-lbl"><Layers size={14} /> Əməliyyat Tipi</span>
              <strong className="tx-val">{transaction.type}</strong>
            </div>

            {transaction.tourTitle && (
              <div className="tx-detail-item full-width">
                <span className="tx-lbl"><Compass size={14} /> Əlaqəli Tur / Xidmət</span>
                <strong className="tx-val text-primary-600">{transaction.tourTitle}</strong>
              </div>
            )}

            {transaction.passengerName && (
              <div className="tx-detail-item">
                <span className="tx-lbl"><User size={14} /> Sərnişin / Müştəri</span>
                <strong className="tx-val">{transaction.passengerName}</strong>
              </div>
            )}

            {transaction.passengerPhone && (
              <div className="tx-detail-item">
                <span className="tx-lbl"><Phone size={14} /> Əlaqə Nömrəsi</span>
                <strong className="tx-val font-mono">{transaction.passengerPhone}</strong>
              </div>
            )}

            {transaction.bookingId && (
              <div className="tx-detail-item">
                <span className="tx-lbl"><CreditCard size={14} /> Rezervasiya Kodu</span>
                <strong className="tx-val font-mono text-primary-600">#{transaction.bookingId}</strong>
              </div>
            )}
          </div>

          {/* Financial Breakdown Table */}
          <div className="tx-breakdown-card">
            <div className="tx-breakdown-title">
              <Percent size={15} />
              <span>Maliyyə Dağılımı və Vergi Uçotu</span>
            </div>

            <div className="tx-breakdown-row">
              <span>Ümumi Əməliyyat Məbləği:</span>
              <strong>{transaction.amount.toFixed(2)} {transaction.currency}</strong>
            </div>

            <div className="tx-breakdown-row">
              <span>Platforma Komissiyası:</span>
              <span className="text-secondary">
                {transaction.commission ? `-${transaction.commission.toFixed(2)} ${transaction.currency}` : '0.00 AZN (0%)'}
              </span>
            </div>

            <div className="tx-breakdown-row">
              <span>ƏDV Dərəcəsi:</span>
              <span className="text-success font-semibold">0% (Turizm Xidmətləri Güzəşti)</span>
            </div>

            <div className="tx-breakdown-row grand-total">
              <span>Vendor Xalis Məbləğ (Net):</span>
              <strong className="text-primary-700">
                {(transaction.netAmount || (isIncome ? transaction.credit : -transaction.debit)).toFixed(2)} {transaction.currency}
              </strong>
            </div>
          </div>

          {/* Description */}
          {transaction.description && (
            <div className="tx-desc-box">
              <span className="tx-desc-lbl">Təsvir / Qeyd:</span>
              <p>{transaction.description}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="tx-modal-footer no-print">
          <div className="tx-footer-left">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer size={15} />
              <span>Çap Et</span>
            </Button>
          </div>

          <div className="tx-footer-right">
            {transaction.bookingId && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadXml} 
                  isLoading={downloadingXml}
                  title="Azərbaycan Dövlət Vergi Xidməti (taxes.gov.az) üçün e-Qaimə XML faylı"
                >
                  <FileText size={15} />
                  <span>e-Qaimə (XML)</span>
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleDownloadPdf} 
                  isLoading={downloadingPdf}
                >
                  <Download size={15} />
                  <span>Faktura (PDF)</span>
                </Button>
              </>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Bağla
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
