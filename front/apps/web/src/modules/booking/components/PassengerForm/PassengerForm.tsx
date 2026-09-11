import React from 'react';
import { PassengerInfo } from '@toursales/types';
import { Card, Input } from '@toursales/ui';
import { User, Phone, CreditCard, Upload } from 'lucide-react';
import './PassengerForm.css';

interface PassengerFormProps {
  passengers: PassengerInfo[];
  onUpdatePassenger: (seatNumber: number, field: keyof PassengerInfo, value: string) => void;
  isForeignTour?: boolean;
}

export const PassengerForm: React.FC<PassengerFormProps> = ({
  passengers,
  onUpdatePassenger,
  isForeignTour = false,
}) => {
  return (
    <div className="web-passenger-form-list">
      {passengers.map((p, idx) => (
        <Card key={p.seatNumber} variant="default" className="web-passenger-card">
          <div className="web-passenger-card-header">
            <h4 className="web-passenger-title">
              Sərnişin #{idx + 1} — <span className="text-gradient">Oturacaq {p.seatNumber}</span>
            </h4>
          </div>

          <div className="web-passenger-inputs-grid">
            <Input
              label="Ad və Soyad"
              placeholder="Ad Soyad"
              value={p.fullName}
              onChange={(e) => onUpdatePassenger(p.seatNumber, 'fullName', e.target.value)}
              leftIcon={<User size={16} />}
              required
            />

            <Input
              label="Əlaqə Nömrəsi"
              placeholder="+994 50 123 45 67"
              value={p.phone}
              onChange={(e) => onUpdatePassenger(p.seatNumber, 'phone', e.target.value)}
              leftIcon={<Phone size={16} />}
              required
            />

            <Input
              label="Şəxsiyyət Vəsiqəsi / FİN Kod"
              placeholder="7 rəqəmli FİN kod"
              value={p.idNumber || ''}
              onChange={(e) => onUpdatePassenger(p.seatNumber, 'idNumber', e.target.value)}
              leftIcon={<CreditCard size={16} />}
              required
            />

            {isForeignTour && (
              <Input
                label="Xarici Pasport Şəkli (URL və ya Fayl)"
                placeholder="Pasport şəklinin linki"
                value={p.passportUrl || ''}
                onChange={(e) => onUpdatePassenger(p.seatNumber, 'passportUrl', e.target.value)}
                leftIcon={<Upload size={16} />}
              />
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
