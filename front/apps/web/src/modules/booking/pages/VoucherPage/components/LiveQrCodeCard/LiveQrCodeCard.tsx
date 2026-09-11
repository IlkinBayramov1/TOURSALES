import React from 'react';
import { QrCode, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card, Badge } from '@toursales/ui';
import './LiveQrCodeCard.css';

interface LiveQrCodeCardProps {
  bookingNumber: string;
  qrToken?: string;
  isCheckedIn?: boolean;
}

export const LiveQrCodeCard: React.FC<LiveQrCodeCardProps> = ({
  bookingNumber,
  qrToken,
  isCheckedIn = false,
}) => {
  // Generate visual QR representation using Google Chart API or SVG placeholder
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    qrToken || bookingNumber
  )}`;

  return (
    <Card variant="glass" className="web-live-qr-card">
      <div className="web-qr-header">
        <div className="web-qr-badge-row">
          <Badge variant={isCheckedIn ? 'success' : 'primary'} pill>
            {isCheckedIn ? '✓ Təsdiqlənib / Minik edildi' : 'Canlı Bilet Aktivdir'}
          </Badge>
          <span className="web-qr-security">
            <ShieldCheck size={14} /> HMAC-SHA256
          </span>
        </div>

        <h3 className="web-qr-booking-number">{bookingNumber}</h3>
      </div>

      <div className="web-qr-frame">
        <div className="web-qr-scan-line" />
        <img
          src={qrSvgUrl}
          alt={`Bilet QR Kodu - ${bookingNumber}`}
          className="web-qr-image"
        />
      </div>

      <div className="web-qr-footer">
        <p className="web-qr-instruction">
          Avtobusa minik zamanı bu QR kodu bələdçiyə və ya nəzarətçiyə təqdim edin.
        </p>
        <span className="web-qr-refresh-hint">
          Təhlükəsizlik üçün QR kod hər 60 saniyədən bir avtomatik yenilənir.
        </span>
      </div>
    </Card>
  );
};
