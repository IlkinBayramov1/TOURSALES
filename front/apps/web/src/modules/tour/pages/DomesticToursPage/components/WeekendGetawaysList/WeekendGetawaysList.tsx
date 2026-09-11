import React from 'react';
import { Tour } from '@toursales/types';
import { TourCard } from '@/modules/tour/components/TourCard/TourCard';
import { Sparkles } from 'lucide-react';
import './WeekendGetawaysList.css';

interface WeekendGetawaysListProps {
  tours: Tour[];
}

export const WeekendGetawaysList: React.FC<WeekendGetawaysListProps> = ({ tours }) => {
  if (tours.length === 0) return null;

  return (
    <section className="web-weekend-getaways">
      <div className="web-weekend-header">
        <div className="web-weekend-title-group">
          <Sparkles className="text-gradient" size={24} />
          <div>
            <h3 className="web-weekend-title">1 Günlük Həftəsonu Səyahətləri</h3>
            <p className="web-weekend-subtitle">
              Şənbə və Bazar günləri Bakıdan birbaşa çıxışlı, istirahət və təbiət qoynunda turlar
            </p>
          </div>
        </div>
      </div>

      <div className="web-weekend-grid">
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>
    </section>
  );
};
