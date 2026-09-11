import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Download } from 'lucide-react';
import { Button } from '@toursales/ui';
import './VoucherDownloadButton.css';

interface VoucherDownloadButtonProps {
  bookingId: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const VoucherDownloadButton: React.FC<VoucherDownloadButtonProps> = ({
  bookingId,
  variant = 'outline',
  size = 'sm',
  showText = true,
}) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/booking/voucher/${bookingId}`);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className="web-voucher-download-btn"
      title="Bileti Göstər / Çap Et"
    >
      <Ticket size={size === 'sm' ? 14 : 16} />
      {showText && <span>Bileti Aç</span>}
    </Button>
  );
};
