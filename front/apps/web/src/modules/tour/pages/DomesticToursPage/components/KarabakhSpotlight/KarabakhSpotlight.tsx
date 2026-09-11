import React from 'react';
import { Tour } from '@toursales/types';
import { TourCard } from '@/modules/tour/components/TourCard/TourCard';
import { ShieldCheck, Award } from 'lucide-react';
import './KarabakhSpotlight.css';

interface KarabakhSpotlightProps {
  tours: Tour[];
}

export const KarabakhSpotlight: React.FC<KarabakhSpotlightProps> = ({ tours }) => {
  const karabakhTours = tours.filter((t) => t.isKarabakh || ['Shusha', 'Khankendi', 'Lachin', 'Aghdam'].includes(t.region));

  if (karabakhTours.length === 0) return null;

  return (
    <section className="web-karabakh-spotlight">
      <div className="web-karabakh-spotlight-header">
        <div className="web-karabakh-header-left">
          <div className="web-karabakh-icon-badge">
            <Award size={20} />
          </div>
          <div>
            <h2 className="web-karabakh-section-title">Qarabağ Tarixi & Zəfər Marşrutları</h2>
            <p className="web-karabakh-section-desc">
              Şuşa, Xankəndi, Ağdam və Laçına rəsmi portaldan qeydiyyat və icazə dəstəyi ilə təşkil olunan turlar.
            </p>
          </div>
        </div>

        <div className="web-karabakh-permit-note">
          <ShieldCheck size={18} />
          <span>Rəsmi Giriş İcazəsi Dəstəyi Daxildir</span>
        </div>
      </div>

      <div className="web-karabakh-grid">
        {karabakhTours.slice(0, 3).map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>
    </section>
  );
};
