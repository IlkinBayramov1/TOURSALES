import React from 'react';
import { PaymentMethod } from '@toursales/types';
import { CreditCard, QrCode, Building, Terminal } from 'lucide-react';
import './PaymentMethodSelector.css';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
}) => {
  const methods = [
    {
      id: 'BIRBANK' as PaymentMethod,
      name: 'BirBank ilə Ödəniş',
      badge: 'Tövsiyə olunur',
      desc: 'BirBank mobil tətbiqi və ya QR kodla komissiyasız sürətli ödəniş',
      icon: <QrCode size={22} />,
    },
    {
      id: 'KAPITAL_BANK' as PaymentMethod,
      name: 'Kapital Bank (Birkart)',
      desc: 'Birkart taksit kartı və ya digər Kapital Bank kartları ilə',
      icon: <Building size={22} />,
    },
    {
      id: 'STRIPE' as PaymentMethod,
      name: 'Bank Kartı (VISA / Mastercard)',
      desc: 'İstənilən yerli və ya xarici bankın debet və kredit kartları',
      icon: <CreditCard size={22} />,
    },
    {
      id: 'EMANAT' as PaymentMethod,
      name: 'eManat / MilliÖn Terminalı',
      desc: 'Xüsusi rezervasiya kodu ilə 2 saat ərzində terminaldan nağd ödəniş',
      icon: <Terminal size={22} />,
    },
  ];

  return (
    <div className="web-payment-selector-wrapper">
      <h3 className="web-step-heading">Ödəniş Üsulunu Seçin</h3>

      <div className="web-payment-cards-list">
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`web-payment-option-btn ${selectedMethod === m.id ? 'active' : ''}`}
            onClick={() => onSelectMethod(m.id)}
          >
            <div className="web-payment-option-icon">{m.icon}</div>
            <div className="web-payment-option-body">
              <div className="web-payment-option-header">
                <strong>{m.name}</strong>
                {m.badge && <span className="web-payment-badge">{m.badge}</span>}
              </div>
              <p className="web-payment-option-desc">{m.desc}</p>
            </div>
            <div className="web-payment-radio-circle">
              {selectedMethod === m.id && <div className="web-radio-dot" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
