import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Copy, Check, ArrowRight } from 'lucide-react';
import { Button, Badge } from '@toursales/ui';
import { CampaignOffer } from '../../api/campaignApi';
import './CampaignBanner.css';

interface CampaignBannerProps {
  offer: CampaignOffer;
  onOpenDetails?: () => void;
}

export const CampaignBanner: React.FC<CampaignBannerProps> = ({
  offer,
  onOpenDetails,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(offer.promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="web-campaign-banner">
      <div
        className="web-campaign-banner-bg"
        style={{ backgroundImage: `url(${offer.imageUrl})` }}
      />
      <div className="web-campaign-banner-overlay" />

      <div className="web-campaign-banner-content">
        <div className="web-campaign-top-tags">
          <Badge variant="warning" pill>
            <Sparkles size={13} />
            <span>%{offer.discountPercentage} ENDİRİM</span>
          </Badge>
          <span className="web-campaign-dates">
            Bitmə tarixi: {new Date(offer.endDate).toLocaleDateString('az-AZ')}
          </span>
        </div>

        <h3 className="web-campaign-title">{offer.title}</h3>
        <p className="web-campaign-subtitle">{offer.subtitle}</p>

        <div className="web-campaign-action-row">
          <div className="web-campaign-promo-box" onClick={handleCopyCode}>
            <span className="web-promo-text">{offer.promoCode}</span>
            <button
              type="button"
              className="web-promo-copy-btn"
              title="Kodu Kopyala"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          <div className="web-campaign-cta-buttons">
            <Link to="/catalog">
              <Button variant="primary" size="md">
                <span>Turlara Bax</span>
                <ArrowRight size={16} />
              </Button>
            </Link>

            {onOpenDetails && (
              <Button
                variant="outline"
                size="md"
                className="web-terms-btn"
                onClick={onOpenDetails}
              >
                Qaydalar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
