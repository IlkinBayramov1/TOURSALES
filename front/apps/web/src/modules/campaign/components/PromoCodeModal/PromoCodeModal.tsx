import React, { useState } from 'react';
import { Copy, Check, Calendar, Info, ShieldCheck } from 'lucide-react';
import { Modal, Button, Badge } from '@toursales/ui';
import { CampaignOffer } from '../../api/campaignApi';
import './PromoCodeModal.css';

interface PromoCodeModalProps {
  offer: CampaignOffer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PromoCodeModal: React.FC<PromoCodeModalProps> = ({
  offer,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!offer) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(offer.promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kampaniya Təfərrüatları və Qaydaları"
      size="md"
    >
      <div className="web-promo-modal-body">
        <div className="web-promo-modal-header">
          <Badge variant="warning" pill>
            %{offer.discountPercentage} Xüsusi Endirim
          </Badge>
          <h3>{offer.title}</h3>
          <p>{offer.subtitle}</p>
        </div>

        <div className="web-promo-code-card">
          <div className="web-code-label">Promo Kodunuz:</div>
          <div className="web-code-copy-row">
            <span className="web-modal-code">{offer.promoCode}</span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopy}
              className="web-modal-copy-btn"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Kopyalandı' : 'Kodu Kopyala'}</span>
            </Button>
          </div>
        </div>

        <div className="web-promo-terms-box">
          <h4>İstifadə Qaydaları və Şərtlər:</h4>
          <ul>
            {offer.terms.map((term, i) => (
              <li key={i}>
                <ShieldCheck size={14} className="web-term-check" />
                <span>{term}</span>
              </li>
            ))}
            {offer.minOrderAmount && (
              <li>
                <Info size={14} className="web-term-check" />
                <span>Minimum sifariş məbləği: {offer.minOrderAmount} AZN</span>
              </li>
            )}
            <li>
              <Calendar size={14} className="web-term-check" />
              <span>
                Keçərlilik müddəti:{' '}
                {new Date(offer.startDate).toLocaleDateString('az-AZ')} —{' '}
                {new Date(offer.endDate).toLocaleDateString('az-AZ')}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};
