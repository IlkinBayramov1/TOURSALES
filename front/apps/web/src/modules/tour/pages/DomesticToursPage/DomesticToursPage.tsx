import React, { useState } from 'react';
import { DomesticHeroBanner } from './components/DomesticHeroBanner/DomesticHeroBanner';
import { KarabakhSpotlight } from './components/KarabakhSpotlight/KarabakhSpotlight';
import { RegionFilterTabs } from './components/RegionFilterTabs/RegionFilterTabs';
import { WeekendGetawaysList } from './components/WeekendGetawaysList/WeekendGetawaysList';
import { TourGridList } from '../TourCatalogPage/components/TourGridList/TourGridList';
import { useTours } from '../../hooks/useTours';
import { Spinner } from '@toursales/ui';
import './DomesticToursPage.css';

export const DomesticToursPage: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const { tours, loading, error } = useTours({
    type: 'DOMESTIC',
    region: selectedRegion || undefined,
  });

  const weekendTours = tours.filter((t) => !t.isKarabakh).slice(0, 4);

  return (
    <div className="web-domestic-page">
      <div className="web-container">
        <DomesticHeroBanner />

        {/* Karabakh Historic Spotlight Section */}
        <KarabakhSpotlight tours={tours} />

        {/* Region Filter Tabs */}
        <div className="web-domestic-catalog-section">
          <h2 className="web-domestic-section-heading">Bütün Daxili İstiqamətlər</h2>
          <RegionFilterTabs
            activeRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
          />

          {loading ? (
            <div className="web-domestic-loading">
              <Spinner size="lg" />
              <p>Daxili turlar yüklənir...</p>
            </div>
          ) : error ? (
            <div className="web-domestic-error">{error}</div>
          ) : (
            <TourGridList tours={tours} />
          )}
        </div>

        {/* Weekend Tours Section */}
        <WeekendGetawaysList tours={weekendTours} />
      </div>
    </div>
  );
};
