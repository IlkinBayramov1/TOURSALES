import React from 'react';
import { Printer, Download, Share2 } from 'lucide-react';
import { Button } from '@toursales/ui';
import './PrintVoucherButton.css';

interface PrintVoucherButtonProps {
  bookingNumber: string;
}

export const PrintVoucherButton: React.FC<PrintVoucherButtonProps> = ({ bookingNumber }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tur Bileti - ${bookingNumber}`,
          text: `TOURSALES vasitəsilə təsdiqlənmiş bilet: ${bookingNumber}`,
          url: window.location.href,
        });
      } catch (err) {
        // Ignored if cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Bilet linki kopyalandı!');
    }
  };

  return (
    <div className="web-voucher-actions">
      <Button
        variant="primary"
        onClick={handlePrint}
        className="web-print-btn"
      >
        <Printer size={18} />
        <span>Çap Et / PDF Yüklə</span>
      </Button>

      <Button
        variant="secondary"
        onClick={handleShare}
        className="web-share-btn"
      >
        <Share2 size={18} />
        <span>Paylaş</span>
      </Button>
    </div>
  );
};
