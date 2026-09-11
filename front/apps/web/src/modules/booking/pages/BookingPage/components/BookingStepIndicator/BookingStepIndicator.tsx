import React from 'react';
import { Check } from 'lucide-react';
import './BookingStepIndicator.css';

interface BookingStepIndicatorProps {
  currentStep: number;
}

export const BookingStepIndicator: React.FC<BookingStepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { num: 1, title: 'Oturacaq Seçimi' },
    { num: 2, title: 'Sərnişin Məlumatları' },
    { num: 3, title: 'Ödəniş və Bilet' },
  ];

  return (
    <div className="web-step-indicator">
      {steps.map((s, idx) => {
        const isPassed = currentStep > s.num;
        const isCurrent = currentStep === s.num;

        return (
          <React.Fragment key={s.num}>
            <div className={`web-step-item ${isPassed ? 'passed' : ''} ${isCurrent ? 'current' : ''}`}>
              <div className="web-step-circle">
                {isPassed ? <Check size={16} /> : s.num}
              </div>
              <span className="web-step-title">{s.title}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`web-step-line ${currentStep > s.num ? 'passed' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
