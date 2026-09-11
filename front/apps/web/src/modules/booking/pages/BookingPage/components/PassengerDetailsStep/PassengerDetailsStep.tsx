import React from 'react';
import { PassengerInfo } from '@toursales/types';
import { PassengerForm } from '@/modules/booking/components/PassengerForm/PassengerForm';
import './PassengerDetailsStep.css';

interface PassengerDetailsStepProps {
  passengers: PassengerInfo[];
  onUpdatePassenger: (seatNumber: number, field: keyof PassengerInfo, value: string) => void;
  isForeignTour?: boolean;
}

export const PassengerDetailsStep: React.FC<PassengerDetailsStepProps> = ({
  passengers,
  onUpdatePassenger,
  isForeignTour = false,
}) => {
  return (
    <div className="web-passenger-step-wrapper">
      <div className="web-passenger-step-header">
        <h3 className="web-step-heading">Sərnişin Məlumatlarını Daxil Edin</h3>
        <p className="web-step-subheading">
          Sığorta və bilet qeydiyyatı üçün hər bir oturacaq sahibinin ad, soyad və əlaqə məlumatları tələb olunur.
        </p>
      </div>

      <PassengerForm
        passengers={passengers}
        onUpdatePassenger={onUpdatePassenger}
        isForeignTour={isForeignTour}
      />
    </div>
  );
};
