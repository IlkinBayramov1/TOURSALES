import React from 'react';
import { ItineraryItem } from '@toursales/types';
import { ItineraryList } from '@/modules/tour/components/ItineraryList/ItineraryList';
import './TourItineraryTimeline.css';

interface TourItineraryTimelineProps {
  itinerary?: ItineraryItem[];
}

export const TourItineraryTimeline: React.FC<TourItineraryTimelineProps> = ({ itinerary }) => {
  return (
    <div className="web-tour-itinerary-timeline-wrapper">
      <div className="web-itinerary-intro">
        <h3 className="web-section-heading">Səyahət Qrafiki və Proqramı</h3>
        <p className="web-itinerary-subtitle">
          Tur zamanı ziyarət ediləcək tarixi məkanlar, istirahət saatları və yemək fasilələri günbəgün qeyd olunmuşdur.
        </p>
      </div>

      <ItineraryList items={itinerary} />
    </div>
  );
};
