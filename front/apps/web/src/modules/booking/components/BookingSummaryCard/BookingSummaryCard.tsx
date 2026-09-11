import React from 'react';
import { Tour, PriceCalculationResult } from '@toursales/types';
import { Card, Badge } from '@toursales/ui';
import { MapPin, Calendar, Users } from 'lucide-react';
import { formatDate } from '@/shared/utils/formatters';
import { DynamicPriceBreakdown } from '../DynamicPriceBreakdown/DynamicPriceBreakdown';
import './BookingSummaryCard.css';

interface BookingSummaryCardProps {
  tour: Tour;
  selectedSeats: number[];
  priceBreakdown: PriceCalculationResult | null;
}

export const BookingSummaryCard: React.FC<BookingSummaryCardProps> = ({
  tour,
  selectedSeats,
  priceBreakdown,
}) => {
  const image = tour.images && tour.images.length > 0
    ? tour.images[0]
    : 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80';

  return (
    <Card variant="glass" className="web-booking-summary-card">
      <div className="web-summary-tour-preview">
        <img src={image} alt={tour.title} className="web-summary-img" />
        <div className="web-summary-tour-info">
          <Badge variant="primary" size="sm" pill>
            {tour.type === 'DOMESTIC' ? 'Daxili Tur' : 'Xarici Tur'}
          </Badge>
          <h4 className="web-summary-title">{tour.title}</h4>
          <span className="web-summary-region">
            <MapPin size={13} /> {tour.region}
          </span>
        </div>
      </div>

      <div className="web-summary-details">
        <div className="web-summary-row">
          <Calendar size={15} />
          <span>{formatDate(tour.startDate)}</span>
        </div>
        <div className="web-summary-row">
          <Users size={15} />
          <span>
            {selectedSeats.length > 0
              ? `Seçilən yerlər: ${selectedSeats.join(', ')}`
              : 'Oturacaq seçilməyib'}
          </span>
        </div>
      </div>

      <DynamicPriceBreakdown
        breakdown={priceBreakdown}
        seatsCount={selectedSeats.length}
      />
    </Card>
  );
};
