import React, { useEffect, useState } from 'react';
import { Tag, Sparkles, AlertCircle } from 'lucide-react';
import { Spinner, Card } from '@toursales/ui';
import { campaignApi, CampaignOffer } from '../../api/campaignApi';
import { CampaignBanner } from '../../components/CampaignBanner/CampaignBanner';
import { PromoCodeModal } from '../../components/PromoCodeModal/PromoCodeModal';
import './SpecialOffersPage.css';

export const SpecialOffersPage: React.FC = () => {
  const [offers, setOffers] = useState<CampaignOffer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'DOMESTIC' | 'FOREIGN'>('ALL');
  const [selectedOffer, setSelectedOffer] = useState<CampaignOffer | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const res = await campaignApi.getSpecialOffers();
        setOffers(res.data || []);
      } catch (err) {
        console.error('Kampaniyalar yüklənərkən xəta:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  const filteredOffers = offers.filter((offer) => {
    if (activeTab === 'ALL') return true;
    return offer.targetCategory === activeTab || offer.targetCategory === 'ALL';
  });

  return (
    <div className="web-offers-page">
      <div className="web-offers-hero">
        <div className="web-offers-hero-badge">
          <Sparkles size={16} />
          <span>FURSƏTLƏR VƏ ENDİRİMLƏR</span>
        </div>
        <h1>Xüsusi Təkliflər və Kampaniyalar</h1>
        <p>
          Mövsümi endirimlərdən və xüsusi promo kodlardan faydalanaraq ən sərfəli qiymətlərlə səyahət edin.
        </p>
      </div>

      <div className="web-offers-container">
        <div className="web-offers-filter-row">
          <button
            type="button"
            className={`web-offer-tab ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            Bütün Kampaniyalar
          </button>
          <button
            type="button"
            className={`web-offer-tab ${activeTab === 'DOMESTIC' ? 'active' : ''}`}
            onClick={() => setActiveTab('DOMESTIC')}
          >
            Daxili Turlar (Qarabağ & Bölgələr)
          </button>
          <button
            type="button"
            className={`web-offer-tab ${activeTab === 'FOREIGN' ? 'active' : ''}`}
            onClick={() => setActiveTab('FOREIGN')}
          >
            Xarici Turlar & Erkən Rezervasiya
          </button>
        </div>

        {loading ? (
          <div className="web-offers-loading">
            <Spinner size="lg" />
            <p>Aktiv kampaniyalar yüklənir...</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <Card variant="default" className="web-offers-empty">
            <Tag size={40} />
            <h3>Aktiv kampaniya tapılmadı</h3>
            <p>Hazırda bu kateqoriyada aktiv kampaniya yoxdur. Tezliklə yeni fürsətlər əlavə ediləcək.</p>
          </Card>
        ) : (
          <div className="web-offers-grid">
            {filteredOffers.map((offer) => (
              <CampaignBanner
                key={offer.id}
                offer={offer}
                onOpenDetails={() => setSelectedOffer(offer)}
              />
            ))}
          </div>
        )}
      </div>

      <PromoCodeModal
        isOpen={!!selectedOffer}
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
      />
    </div>
  );
};
