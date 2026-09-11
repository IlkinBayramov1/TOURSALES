import React from 'react';
import { Clock } from 'lucide-react';
import { ItineraryItem } from '@toursales/types';
import './ItineraryList.css';

interface ItineraryListProps {
  items?: ItineraryItem[];
}

export const ItineraryList: React.FC<ItineraryListProps> = ({ items = [] }) => {
  if (!items || items.length === 0) {
    return (
      <p className="web-itinerary-empty">
        Bu tur üçün ətraflı günbəgün proqram tezliklə əlavə olunacaqdır.
      </p>
    );
  }

  // Group items by day
  const grouped = items.reduce((acc, item) => {
    const day = item.day || 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {} as Record<number, ItineraryItem[]>);

  return (
    <div className="web-itinerary-timeline">
      {Object.entries(grouped).map(([day, dayItems]) => (
        <div key={day} className="web-itinerary-day-group">
          <div className="web-itinerary-day-header">
            <span className="web-itinerary-day-badge">Gün {day}</span>
          </div>

          <div className="web-itinerary-step-list">
            {dayItems.map((item, idx) => (
              <div key={idx} className="web-itinerary-step">
                <div className="web-itinerary-step-marker" />
                <div className="web-itinerary-step-content">
                  <div className="web-itinerary-time">
                    <Clock size={14} /> {item.time}
                  </div>
                  <h4 className="web-itinerary-step-title">{item.title}</h4>
                  <p className="web-itinerary-step-desc">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
