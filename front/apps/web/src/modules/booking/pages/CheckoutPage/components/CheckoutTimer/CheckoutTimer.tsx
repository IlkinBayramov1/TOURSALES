import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import './CheckoutTimer.css';

interface CheckoutTimerProps {
  initialSeconds?: number;
  onExpire: () => void;
}

export const CheckoutTimer: React.FC<CheckoutTimerProps> = ({
  initialSeconds = 300,
  onExpire,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onExpire]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isCritical = secondsLeft <= 60;

  return (
    <div className={`web-checkout-timer-card ${isCritical ? 'critical' : ''}`}>
      <div className="web-timer-icon-box">
        {isCritical ? <AlertTriangle size={20} /> : <Clock size={20} />}
      </div>
      <div>
        <span className="web-timer-label">Oturacaqların Kilid Müddəti</span>
        <div className="web-timer-digits">
          {mins}:{secs < 10 ? '0' : ''}{secs}
        </div>
      </div>
      <p className="web-timer-hint">
        Bu müddət ərzində ödəniş tamamlanmadıqda seçilmiş yerlər digər müştərilər üçün açılacaqdır.
      </p>
    </div>
  );
};
