import React from 'react';
import { Card } from '@toursales/ui';
import './CountryDestinationCards.css';

interface CountryDestinationCardsProps {
  selectedCountry: string;
  onSelectCountry: (country: string) => void;
}

const COUNTRIES = [
  {
    id: 'Georgia',
    name: 'Gürcüstan',
    cities: 'Tbilisi, Batumi, Kazbegi',
    flag: '🇬🇪',
    image: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'Turkey',
    name: 'Türkiyə',
    cities: 'İstanbul, Kapadokya, Trabzon',
    flag: '🇹🇷',
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'UAE',
    name: 'BƏƏ (Dubay)',
    cities: 'Dubay, Abu Dabi',
    flag: '🇦🇪',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'Europe',
    name: 'Avropa Şengen',
    cities: 'İtaliya, Fransa, Çexiya',
    flag: '🇪🇺',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=600&q=80',
  },
];

export const CountryDestinationCards: React.FC<CountryDestinationCardsProps> = ({
  selectedCountry,
  onSelectCountry,
}) => {
  return (
    <div className="web-country-cards-wrapper">
      <div className="web-country-cards-header">
        <h3 className="web-section-heading">Populyar Ölkələr</h3>
        <button
          className="web-country-all-btn"
          onClick={() => onSelectCountry('')}
        >
          Bütün Ölkələr
        </button>
      </div>

      <div className="web-country-cards-grid">
        {COUNTRIES.map((c) => (
          <Card
            key={c.id}
            variant="default"
            hoverable
            className={`web-country-card ${selectedCountry === c.id ? 'active' : ''}`}
            onClick={() => onSelectCountry(selectedCountry === c.id ? '' : c.id)}
          >
            <div className="web-country-card-img-box">
              <img src={c.image} alt={c.name} />
              <span className="web-country-flag">{c.flag}</span>
            </div>
            <div className="web-country-card-info">
              <h4 className="web-country-name">{c.name}</h4>
              <span className="web-country-cities">{c.cities}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
