import React from 'react';
import { RouteMapCard } from '@/modules/tour/components/RouteMapCard/RouteMapCard';
import { AlertCircle } from 'lucide-react';
import './TourMeetingLocation.css';

interface TourMeetingLocationProps {
  meetingPoint: string;
  meetingLat?: number;
  meetingLng?: number;
}

export const TourMeetingLocation: React.FC<TourMeetingLocationProps> = ({
  meetingPoint,
  meetingLat,
  meetingLng,
}) => {
  return (
    <div className="web-tour-meeting-location-wrapper">
      <h3 className="web-section-heading">Toplanış və Yola Düşmə</h3>

      <div className="web-meeting-notice">
        <AlertCircle size={20} className="notice-icon" />
        <p>
          Zəhmət olmasa yola düşmə saatından ən azı <strong>30 dəqiqə əvvəl</strong> toplanış məntəqəsində olun. Bələdçi sizi xüsusi lövhə ilə qarşılayacaqdır.
        </p>
      </div>

      <RouteMapCard
        meetingPoint={meetingPoint}
        meetingLat={meetingLat}
        meetingLng={meetingLng}
      />
    </div>
  );
};
