import React from 'react';
import { Tour } from '@toursales/types';
import { TourCard } from '@/modules/tour/components/TourCard/TourCard';
import { Flame } from 'lucide-react';
import './SeasonDealsGrid.css';

interface SeasonDealsGridProps {
  tours: Tour[];
}

export const SeasonDealsGrid: React.FC<SeasonDealsGridProps> = ({ tours }) => {
  if (tours.length === 0) return null;

  return (
    <section className="web-season-deals">
      <div className="web-season-deals-header">
        <div className="web-season-deals-title-group">
          <Flame className="text-gradient" size={24} />
          <div>
            <h3 className="web-season-deals-title">Mövsümi Qaynar Təkliflər</h3>
            <p className="web-season-deals-subtitle">
              Erkən rezervasiya və xüsusi endirimlərlə təklif olunan beynəlxalq səyahət paketləri
            </p>
          </div>
        </div>
      </div>

      <div className="web-season-deals-grid">
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>
    </section>
  );
};
