import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Compass, ShieldCheck } from 'lucide-react';
import { Button } from '@toursales/ui';
import './HeroSection.css';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [tourType, setTourType] = useState<'ALL' | 'DOMESTIC' | 'FOREIGN'>('ALL');
  const [date, setDate] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set('search', destination);
    if (tourType !== 'ALL') params.set('type', tourType);
    if (date) params.set('startDate', date);
    navigate(`/tours?${params.toString()}`);
  };

  const quickTags = [
    { label: '🏔️ Şuşa Qalası', query: 'Shusha' },
    { label: '🏰 Xankəndi & Ağdam', query: 'Khankendi' },
    { label: '⛷️ Qusar Şahdağ', query: 'Qusar' },
    { label: '🌿 Quba Təbiət', query: 'Quba' },
    { label: '🏺 Şəki Xan Sarayı', query: 'Sheki' },
    { label: '✈️ Tbilisi & Batumi', query: 'Georgia' },
  ];

  return (
    <div className="web-hero">
      <div className="web-hero-backdrop">
        <div className="web-hero-glow-1" />
        <div className="web-hero-glow-2" />
      </div>

      <div className="web-hero-content">
        <div className="web-hero-badge">
          <ShieldCheck size={16} />
          <span>Rəsmi Tur Şirkətləri & Canlı Oturacaq Seçimi</span>
        </div>

        <h1 className="web-hero-title">
          Unudulmaz Səyahətləri <br />
          <span className="text-gradient">Canlı Biletlə Kəşf Edin</span>
        </h1>

        <p className="web-hero-subtitle">
          Qarabağın tarixi torpaqlarından Şahdağın zirvələrinə, daxili və xarici turlarda
          avtobus yerinizi onlayn seçin və dərhal QR bilet əldə edin.
        </p>

        {/* Immersive Search Box */}
        <form className="web-hero-search-card" onSubmit={handleSearch}>
          <div className="web-hero-search-field">
            <label className="web-hero-field-label">
              <MapPin size={16} /> Haraya səyahət?
            </label>
            <input
              type="text"
              placeholder="Məs: Şuşa, Quba, Qusar, Tbilisi..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="web-hero-input"
            />
          </div>

          <div className="web-hero-search-field">
            <label className="web-hero-field-label">
              <Compass size={16} /> Tur Növü
            </label>
            <select
              value={tourType}
              onChange={(e) => setTourType(e.target.value as any)}
              className="web-hero-select"
            >
              <option value="ALL">Bütün Turlar</option>
              <option value="DOMESTIC">🇦🇿 Daxili & Qarabağ</option>
              <option value="FOREIGN">✈️ Xarici Turlar</option>
            </select>
          </div>

          <div className="web-hero-search-field">
            <label className="web-hero-field-label">
              <Calendar size={16} /> Çıxış Tarixi
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="web-hero-input"
            />
          </div>

          <div className="web-hero-search-btn-wrapper">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              leftIcon={<Search size={18} />}
              style={{ width: '100%' }}
            >
              Axtar
            </Button>
          </div>
        </form>

        {/* Quick Tag Chips */}
        <div className="web-hero-quick-tags">
          <span className="web-quick-tags-title">Populyar:</span>
          {quickTags.map((tag, idx) => (
            <button
              key={idx}
              type="button"
              className="web-quick-tag-btn"
              onClick={() => navigate(`/tours?search=${tag.query}`)}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
