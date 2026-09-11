import React from 'react';
import { Tour } from '@toursales/types';
import { TourCard } from '@/modules/tour/components/TourCard/TourCard';
import './TourGridList.css';

interface TourGridListProps {
  tours: Tour[];
}

export const TourGridList: React.FC<TourGridListProps> = ({ tours }) => {
  return (
    <div className="web-tour-grid-list">
      {tours.map((tour) => (
        <TourCard key={tour.id} tour={tour} />
      ))}
    </div>
  );
};
