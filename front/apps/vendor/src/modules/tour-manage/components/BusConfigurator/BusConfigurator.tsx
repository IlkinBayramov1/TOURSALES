import React from 'react';
import { Bus, Check, ShieldCheck } from 'lucide-react';
import { Card, Badge } from '@toursales/ui';
import './BusConfigurator.css';

export type BusType = 'SPRINTER' | 'STANDARD_48' | 'VIP_30';

interface BusConfiguratorProps {
  selectedType: BusType;
  onChange: (type: BusType, capacity: number) => void;
}

export const BusConfigurator: React.FC<BusConfiguratorProps> = ({
  selectedType,
  onChange,
}) => {
  const busOptions: Array<{
    type: BusType;
    title: string;
    capacity: number;
    description: string;
    badge: string;
  }> = [
    {
      type: 'STANDARD_48',
      title: 'Standart Tur Avtobusu (2+2)',
      capacity: 48,
      description: '48 nəfərlik Mercedes Travego / Neoplan. Uzun məsafəli böyük qruplar üçün.',
      badge: 'Ən Populyar',
    },
    {
      type: 'VIP_30',
      title: 'VIP Komfort Avtobus (2+1)',
      capacity: 30,
      description: '30 nəfərlik geniş ayaq məsafəli biznes sinif turlar üçün.',
      badge: 'VIP Komfort',
    },
    {
      type: 'SPRINTER',
      title: 'Mercedes Sprinter (1+2)',
      capacity: 18,
      description: '18-20 nəfərlik çevik mikroavtobus. Dağ və həftəsonu turları üçün.',
      badge: 'Kompakt',
    },
  ];

  return (
    <div className="vendor-bus-configurator">
      <div className="vendor-bus-options-grid">
        {busOptions.map((opt) => {
          const isSelected = selectedType === opt.type;

          return (
            <div
              key={opt.type}
              className={`vendor-bus-option-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onChange(opt.type, opt.capacity)}
            >
              <div className="vendor-bus-option-header">
                <div className="vendor-bus-icon">
                  <Bus size={22} />
                </div>
                <Badge variant={isSelected ? 'primary' : 'neutral'} pill>
                  {opt.badge}
                </Badge>
              </div>

              <h4>{opt.title}</h4>
              <p>{opt.description}</p>

              <div className="vendor-bus-capacity-row">
                <span className="vendor-bus-seats-tag">
                  <strong>{opt.capacity}</strong> Oturacaq
                </span>
                {isSelected && (
                  <span className="vendor-selected-check">
                    <Check size={16} /> Seçildi
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
