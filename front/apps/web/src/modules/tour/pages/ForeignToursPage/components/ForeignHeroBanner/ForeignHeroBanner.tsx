import React from 'react';
import { Plane, Globe } from 'lucide-react';
import './ForeignHeroBanner.css';

export const ForeignHeroBanner: React.FC = () => {
  return (
    <div className="web-foreign-hero">
      <div className="web-foreign-hero-content">
        <div className="web-foreign-badge">
          <Plane size={16} />
          <span>Dünyanı Bizimlə Kəşf Edin</span>
        </div>

        <h1 className="web-foreign-title">
          Beynəlxalq & <span className="text-gradient">Xarici Tur Paketləri</span>
        </h1>

        <p className="web-foreign-subtitle">
          Gürcüstan və Türkiyənin füsunkar şəhərlərindən Dubay və Avropanın məşhur paytaxtlarına qədər
          aviabilet, otel, sığorta və viza dəstəkli unudulmaz səyahət turları.
        </p>
      </div>
    </div>
  );
};
