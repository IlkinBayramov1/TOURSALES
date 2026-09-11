import React from 'react';
import { Plane, Building, Check } from 'lucide-react';
import './FlightInclusionFilter.css';

interface FlightInclusionFilterProps {
  flightOnly: boolean;
  onToggleFlight: (val: boolean) => void;
  hotelOnly: boolean;
  onToggleHotel: (val: boolean) => void;
}

export const FlightInclusionFilter: React.FC<FlightInclusionFilterProps> = ({
  flightOnly,
  onToggleFlight,
  hotelOnly,
  onToggleHotel,
}) => {
  return (
    <div className="web-flight-filter-box">
      <button
        type="button"
        className={`web-flight-toggle-btn ${flightOnly ? 'active' : ''}`}
        onClick={() => onToggleFlight(!flightOnly)}
      >
        <Plane size={16} />
        <span>Aviabilet Daxil</span>
        {flightOnly && <Check size={14} className="toggle-check" />}
      </button>

      <button
        type="button"
        className={`web-flight-toggle-btn ${hotelOnly ? 'active' : ''}`}
        onClick={() => onToggleHotel(!hotelOnly)}
      >
        <Building size={16} />
        <span>4-5★ Otel Yerləşməsi</span>
        {hotelOnly && <Check size={14} className="toggle-check" />}
      </button>
    </div>
  );
};
