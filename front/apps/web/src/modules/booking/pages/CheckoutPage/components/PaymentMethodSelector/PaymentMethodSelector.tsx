import React, { useState } from 'react';
import { PaymentMethod } from '@toursales/types';
import { CreditCard, QrCode, Building, Terminal, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import './PaymentMethodSelector.css';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  totalAmount?: number;
  currency?: string;
  selectedInstallment?: number;
  onSelectInstallment?: (months: number) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
  totalAmount = 0,
  currency = 'AZN',
  selectedInstallment = 1,
  onSelectInstallment,
}) => {
  const methods = [
    {
      id: 'BIRBANK' as PaymentMethod,
      name: 'BirBank / Birkart',
      badge: '0% Komissiya + Cashback',
      badgeType: 'highlight',
      desc: 'Birkart taksit kartı ilə faizsiz hissə-hissə ödəniş və ya BirBank tətbiqi ilə anında QR kod',
      icon: <QrCode size={22} />,
      supportsInstallments: true,
    },
    {
      id: 'KAPITAL_BANK' as PaymentMethod,
      name: 'Kapital Bank (Visa / Mastercard)',
      badge: 'Yerli Kartlar',
      desc: 'İstənilən yerli bank kartı ilə 3D Secure təhlükəsiz birbaşa ödəniş',
      icon: <Building size={22} />,
    },
    {
      id: 'STRIPE' as PaymentMethod,
      name: 'Beynəlxalq Kartlar (Stripe)',
      badge: 'Apple & Google Pay',
      desc: 'Xarici bank kartları (Visa, Mastercard, Amex), Apple Pay və Google Pay ilə sürətli ödəniş',
      icon: <CreditCard size={22} />,
    },
    {
      id: 'EMANAT' as PaymentMethod,
      name: 'eManat Terminalı',
      badge: 'Nağd Ödəniş',
      desc: 'Unikal rezervasiya kodu ilə sizə ən yaxın eManat terminalında 12 saat ərzində nağd ödəyin',
      icon: <Terminal size={22} />,
    },
    {
      id: 'MILLION' as PaymentMethod,
      name: 'MilliÖN Terminalı',
      badge: 'Nağd Ödəniş',
      desc: 'MilliÖN terminallarında "Turizm və Səyahət" bölməsindən rezervasiya kodu ilə ödəniş',
      icon: <Terminal size={22} />,
    },
  ];

  const installmentOptions = [
    { months: 1, label: 'Tam ödəniş (1 dəfə)' },
    { months: 2, label: '2 ay faizsiz' },
    { months: 3, label: '3 ay faizsiz' },
    { months: 6, label: '6 ay faizsiz' },
  ];

  return (
    <div className="web-payment-selector-wrapper">
      <div className="web-payment-selector-heading-wrap">
        <h3 className="web-step-heading">Ödəniş Üsulunu Seçin</h3>
        <span className="web-payment-secure-badge">
          <ShieldCheck size={16} /> 256-Bit SSL Şifrələnmə
        </span>
      </div>

      <div className="web-payment-cards-list">
        {methods.map((m) => {
          const isSelected = selectedMethod === m.id;

          return (
            <div
              key={m.id}
              className={`web-payment-option-card ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectMethod(m.id)}
            >
              <div className="web-payment-option-main">
                <div className="web-payment-option-icon">{m.icon}</div>
                <div className="web-payment-option-body">
                  <div className="web-payment-option-header">
                    <strong>{m.name}</strong>
                    {m.badge && (
                      <span className={`web-payment-badge ${m.badgeType || ''}`}>
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <p className="web-payment-option-desc">{m.desc}</p>
                </div>
                <div className="web-payment-radio-circle">
                  {isSelected && <div className="web-radio-dot" />}
                </div>
              </div>

              {/* Birkart Taksit Options Sub-Panel */}
              {isSelected && m.supportsInstallments && onSelectInstallment && (
                <div
                  className="web-payment-installments-subpanel"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="installments-header">
                    <Sparkles size={15} className="installments-icon" />
                    <span>Birkart Taksit Müddətini Seçin:</span>
                  </div>
                  <div className="installments-pills-row">
                    {installmentOptions.map((opt) => {
                      const isOptActive = selectedInstallment === opt.months;
                      const monthlyCost =
                        totalAmount > 0
                          ? (totalAmount / opt.months).toFixed(2)
                          : '0.00';

                      return (
                        <button
                          key={opt.months}
                          type="button"
                          className={`installment-pill-btn ${isOptActive ? 'active' : ''}`}
                          onClick={() => onSelectInstallment(opt.months)}
                        >
                          <span className="pill-months-label">{opt.label}</span>
                          {opt.months > 1 && totalAmount > 0 && (
                            <span className="pill-cost-preview">
                              {monthlyCost} {currency}/ay
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Terminal Notice */}
              {isSelected && (m.id === 'EMANAT' || m.id === 'MILLION') && (
                <div
                  className="web-payment-terminal-instruction"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CheckCircle2 size={16} className="terminal-note-icon" />
                  <span>
                    Sifarişi təsdiqlədikdə 12 saatlıq xüsusi rezervasiya ödəniş kodu alacaqsınız.
                    Həmin kodu terminalda daxil edərək nağd ödəniş edə bilərsiniz.
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
