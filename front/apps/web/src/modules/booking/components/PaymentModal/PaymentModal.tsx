import React, { useState } from 'react';
import { Modal, Button } from '@toursales/ui';
import { CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PaymentMethod } from '@toursales/types';
import './PaymentModal.css';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  currency: string;
  onConfirmPayment: (method: PaymentMethod) => Promise<void>;
  isLoading: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  currency,
  onConfirmPayment,
  isLoading,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('BIRBANK');

  const handlePay = async () => {
    await onConfirmPayment(method);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ödəniş Üsulunu Seçin"
      size="md"
    >
      <div className="web-payment-modal-content">
        <div className="web-payment-amount-header">
          <span>Ödəniləcək məbləğ:</span>
          <strong>{totalAmount} {currency}</strong>
        </div>

        <div className="web-payment-methods-grid">
          <button
            type="button"
            className={`web-payment-method-card ${method === 'BIRBANK' ? 'active' : ''}`}
            onClick={() => setMethod('BIRBANK')}
          >
            <div className="web-method-radio">
              {method === 'BIRBANK' && <div className="web-radio-dot" />}
            </div>
            <div>
              <strong className="web-method-name">BirBank ilə Ödəniş</strong>
              <small className="web-method-desc">QR kod və ya BirBank tətbiqi ilə dərhal ödə</small>
            </div>
          </button>

          <button
            type="button"
            className={`web-payment-method-card ${method === 'KAPITAL_BANK' ? 'active' : ''}`}
            onClick={() => setMethod('KAPITAL_BANK')}
          >
            <div className="web-method-radio">
              {method === 'KAPITAL_BANK' && <div className="web-radio-dot" />}
            </div>
            <div>
              <strong className="web-method-name">Kapital Bank (Birkart)</strong>
              <small className="web-method-desc">Birkart taksit və ya debet kartı ilə</small>
            </div>
          </button>

          <button
            type="button"
            className={`web-payment-method-card ${method === 'STRIPE' ? 'active' : ''}`}
            onClick={() => setMethod('STRIPE')}
          >
            <div className="web-method-radio">
              {method === 'STRIPE' && <div className="web-radio-dot" />}
            </div>
            <div>
              <strong className="web-method-name">Beynəlxalq Bank Kartı (VISA / MC)</strong>
              <small className="web-method-desc">Bütün xarici və yerli bank kartları</small>
            </div>
          </button>
        </div>

        <div className="web-payment-security-note">
          <ShieldCheck size={18} className="security-icon" />
          <span>Ödəniş 256-bit SSL və 3D Secure protokol ilə şifrələnir.</span>
        </div>

        <div className="web-payment-actions">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Ləğv et
          </Button>
          <Button variant="primary" size="lg" onClick={handlePay} isLoading={isLoading}>
            Ödənişi Təsdiqlə
          </Button>
        </div>
      </div>
    </Modal>
  );
};
