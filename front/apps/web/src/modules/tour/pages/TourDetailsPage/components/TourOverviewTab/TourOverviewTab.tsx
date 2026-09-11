import React from 'react';
import { Clock, Globe, Bus, Users, ShieldCheck, Building } from 'lucide-react';
import { Tour } from '@toursales/types';
import { Card, Badge } from '@toursales/ui';
import './TourOverviewTab.css';

interface TourOverviewTabProps {
  tour: Tour;
}

export const TourOverviewTab: React.FC<TourOverviewTabProps> = ({ tour }) => {
  return (
    <div className="web-tour-overview-tab">
      {/* Key Features Grid */}
      <div className="web-tour-features-grid">
        <Card variant="glass" className="web-feature-card">
          <Clock className="feature-icon" size={24} />
          <div>
            <span className="feature-title">Müddət</span>
            <strong className="feature-value">
              {tour.type === 'DOMESTIC' ? '1-2 Günlük Səfər' : '4 Gün / 3 Gecə'}
            </strong>
          </div>
        </Card>

        <Card variant="glass" className="web-feature-card">
          <Bus className="feature-icon" size={24} />
          <div>
            <span className="feature-title">Nəqliyyat</span>
            <strong className="feature-value">
              Komfortlu Mercedes Tur Avtobusu
            </strong>
          </div>
        </Card>

        <Card variant="glass" className="web-feature-card">
          <Users className="feature-icon" size={24} />
          <div>
            <span className="feature-title">Qrup Ölçüsü</span>
            <strong className="feature-value">{tour.capacity} nəfərlik yer</strong>
          </div>
        </Card>

        <Card variant="glass" className="web-feature-card">
          <Globe className="feature-icon" size={24} />
          <div>
            <span className="feature-title">Bələdçi Dili</span>
            <strong className="feature-value">Azərbaycan, İngilis</strong>
          </div>
        </Card>
      </div>

      {/* Main Description */}
      <div className="web-tour-description-box">
        <h3 className="web-section-heading">Tur Haqqında</h3>
        <p className="web-tour-desc-text">{tour.description}</p>
      </div>

      {/* Organizer Agency Card */}
      <Card variant="default" className="web-organizer-card">
        <div className="web-organizer-info">
          <div className="web-organizer-icon">
            <Building size={24} />
          </div>
          <div>
            <span className="web-organizer-label">Təşkilatçı Rəsmi Tur Şirkəti</span>
            <h4 className="web-organizer-name">{tour.companyName || 'Caspian Travel MMC'}</h4>
          </div>
        </div>
        <div className="web-organizer-badge">
          <Badge variant="success" pill>
            <ShieldCheck size={14} /> Lisenziyalı Partnyor
          </Badge>
        </div>
      </Card>
    </div>
  );
};
