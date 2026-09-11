import React, { useState } from 'react';
import { ForeignHeroBanner } from './components/ForeignHeroBanner/ForeignHeroBanner';
import { CountryDestinationCards } from './components/CountryDestinationCards/CountryDestinationCards';
import { VisaSupportNotice } from './components/VisaSupportNotice/VisaSupportNotice';
import { FlightInclusionFilter } from './components/FlightInclusionFilter/FlightInclusionFilter';
import { SeasonDealsGrid } from './components/SeasonDealsGrid/SeasonDealsGrid';
import { TourGridList } from '../TourCatalogPage/components/TourGridList/TourGridList';
import { useTours } from '../../hooks/useTours';
import { Spinner } from '@toursales/ui';
import './ForeignToursPage.css';

export const ForeignToursPage: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [flightOnly, setFlightOnly] = useState(false);
  const [hotelOnly, setHotelOnly] = useState(false);

  const { tours, loading, error } = useTours({
    type: 'FOREIGN',
    region: selectedCountry || undefined,
  });

  const seasonalTours = tours.slice(0, 3);

  return (
    <div className="web-foreign-page">
      <div className="web-container">
        <ForeignHeroBanner />

        {/* Popular Destination Countries */}
        <CountryDestinationCards
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
        />

        {/* Visa & Travel Advice Card */}
        <VisaSupportNotice />

        {/* Flight & Hotel Inclusions Filter */}
        <div className="web-foreign-catalog-section">
          <div className="web-foreign-section-header">
            <h2 className="web-foreign-section-title">
              {selectedCountry ? `${selectedCountry} Turları` : 'Bütün Beynəlxalq Turlar'}
            </h2>
            <FlightInclusionFilter
              flightOnly={flightOnly}
              onToggleFlight={setFlightOnly}
              hotelOnly={hotelOnly}
              onToggleHotel={setHotelOnly}
            />
          </div>

          {loading ? (
            <div className="web-foreign-loading">
              <Spinner size="lg" />
              <p>Xarici turlar axtarılır...</p>
            </div>
          ) : error ? (
            <div className="web-foreign-error">{error}</div>
          ) : (
            <TourGridList tours={tours} />
          )}
        </div>

        {/* Seasonal Deals */}
        <SeasonDealsGrid tours={seasonalTours} />
      </div>
    </div>
  );
};
