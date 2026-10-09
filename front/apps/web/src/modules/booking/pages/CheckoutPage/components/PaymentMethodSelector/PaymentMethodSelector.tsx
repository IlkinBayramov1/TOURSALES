import React from 'react';
import { PaymentMethod, BinDetectionResult } from '@toursales/types';
import { CreditCard, QrCode, Building, Terminal, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { BinDetector } from '../../../../components/BinDetector/BinDetector';
import './PaymentMethodSelector.css';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  totalAmount?: number;
  currency?: string;
  selectedInstallment?: number;
  onSelectInstallment?: (months: number) => void;
  onCardDetected?: (detection: BinDetectionResult | null) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
  totalAmount = 0,
  currency = 'AZN',
  selectedInstallment = 1,
  onSelectInstallment,
  onCardDetected,
}) => {
  const methods = [
    {
      id: 'BIRBANK' as PaymentMethod,
      name: 'BirBank / Birkart (Kapital Bank)',
      badge: '0% Taksit + Keşbek',
      badgeType: 'highlight',
      bankCode: 'KAPITAL' as const,
      desc: 'Birkart ilə 2, 3, 6, 12, 18 ay faizsiz hissə-hissə ödəniş və ya BirBank QR ilə anında ödəniş',
      icon: <QrCode size={22} />,
      supportsInstallments: true,
    },
    {
      id: 'TAMKART' as PaymentMethod,
      name: 'Tamkart (ABB)',
      badge: '0% Faizsiz Taksit',
      badgeType: 'highlight',
      bankCode: 'ABB' as const,
      desc: 'ABB Tamkart ilə 2, 3, 6, 12, 18 ay faizsiz taksit imkanı və əlavə keşbek',
      icon: <CreditCard size={22} />,
      supportsInstallments: true,
    },
    {
      id: 'BOLKART' as PaymentMethod,
      name: 'Bolkart (Bank of Baku)',
      badge: '3, 6, 12 Ay Taksit',
      bankCode: 'BANK_OF_BAKU' as const,
      desc: 'Bolkart ilə səyahətinizi rahat aylıq hissələrə bölün',
      icon: <CreditCard size={22} />,
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

              {/* Taksit və BIN Detektoru Paneli */}
              {isSelected && m.supportsInstallments && onSelectInstallment && (
                <div
                  className="web-payment-installments-subpanel"
                  onClick={(e) => e.stopPropagation()}
                >
                  <BinDetector
                    totalAmount={totalAmount}
                    currency={currency}
                    selectedInstallment={selectedInstallment}
                    onSelectInstallment={onSelectInstallment}
                    onDetectionChange={onCardDetected}
                    defaultBank={m.bankCode}
                  />
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
