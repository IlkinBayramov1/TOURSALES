import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Card, Button } from '@toursales/ui';
import './RouteMapCard.css';

interface RouteMapCardProps {
  meetingPoint: string;
  meetingLat?: number;
  meetingLng?: number;
}

export const RouteMapCard: React.FC<RouteMapCardProps> = ({
  meetingPoint,
  meetingLat,
  meetingLng,
}) => {
  const mapUrl = meetingLat && meetingLng
    ? `https://www.google.com/maps/search/?api=1&query=${meetingLat},${meetingLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingPoint)}`;

  return (
    <Card variant="default" className="web-route-map-card">
      <div className="web-route-map-header">
        <div className="web-route-map-icon">
          <MapPin size={22} />
        </div>
        <div>
          <h4 className="web-route-map-title">Toplanış və Görüş Yeri</h4>
          <p className="web-route-map-address">{meetingPoint}</p>
        </div>
      </div>

      <div className="web-route-map-preview">
        <div className="web-route-map-visual">
          <div className="web-route-map-pin-pulse" />
          <MapPin size={32} className="web-route-map-pin" />
          <span className="web-route-map-tag">{meetingPoint}</span>
        </div>
      </div>

      <div className="web-route-map-actions">
        <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <Button variant="outline" size="sm" leftIcon={<Navigation size={16} />}>
            Xəritədə Naviqasiya Aç
          </Button>
        </a>
      </div>
    </Card>
  );
};
