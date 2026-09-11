import React from 'react';
import './RegionFilterTabs.css';

interface RegionFilterTabsProps {
  activeRegion: string;
  onSelectRegion: (region: string) => void;
}

const REGION_TABS = [
  { id: '', label: '🇦🇿 Bütün Daxili Turlar' },
  { id: 'Shusha', label: '👑 Şuşa & Qarabağ' },
  { id: 'Qusar', label: '⛷️ Qusar (Şahdağ)' },
  { id: 'Quba', label: '🌲 Quba Təbiət' },
  { id: 'Sheki', label: '🏺 Şəki & Qəbələ' },
  { id: 'Lankaran', label: '🍃 Lənkəran & Lerik' },
];

export const RegionFilterTabs: React.FC<RegionFilterTabsProps> = ({
  activeRegion,
  onSelectRegion,
}) => {
  return (
    <div className="web-region-tabs-container">
      <div className="web-region-tabs-scroll">
        {REGION_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`web-region-tab-btn ${activeRegion === tab.id ? 'active' : ''}`}
            onClick={() => onSelectRegion(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
