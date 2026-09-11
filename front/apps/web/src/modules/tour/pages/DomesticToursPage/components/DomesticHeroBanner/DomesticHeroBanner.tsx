import React from 'react';
import { Mountain, MapPin } from 'lucide-react';
import './DomesticHeroBanner.css';

export const DomesticHeroBanner: React.FC = () => {
  return (
    <div className="web-domestic-hero">
      <div className="web-domestic-hero-content">
        <div className="web-domestic-badge">
          <Mountain size={16} />
          <span>Doğma Vətənimizi Kəşf Edin</span>
        </div>

        <h1 className="web-domestic-title">
          Azərbaycanın Ən Gözəl <br />
          <span className="text-gold-gradient">Daxili & Qarabağ Turları</span>
        </h1>

        <p className="web-domestic-subtitle">
          Şuşa qalası və Cıdır düzündən, Qusar Şahdağın qarlı zirvələrinə və Şəkinin qədim memarlığına qədər
          ən güvənli nəqliyyat və sertifikatlı bələdçilərlə səyahət edin.
        </p>
      </div>
    </div>
  );
};
