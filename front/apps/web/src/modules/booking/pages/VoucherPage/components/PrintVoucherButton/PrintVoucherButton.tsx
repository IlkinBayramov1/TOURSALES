import React, { useState } from 'react';
import { Printer, Download, Share2, Check } from 'lucide-react';
import { Button } from '@toursales/ui';
import { bookingApi } from '@/modules/booking/api/bookingApi';
import { useToast } from '@/shared/context/ToastContext';
import './PrintVoucherButton.css';

interface PrintVoucherButtonProps {
  bookingId?: string;
  bookingNumber: string;
  pdfUrl?: string;
}

export const PrintVoucherButton: React.FC<PrintVoucherButtonProps> = ({
  bookingId,
  bookingNumber,
  pdfUrl,
}) => {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const id = bookingId || bookingNumber;
    const directUrl = pdfUrl
      ? (pdfUrl.startsWith('http') ? pdfUrl : `http://127.0.0.1:5000${pdfUrl}`)
      : bookingApi.getPdfVoucherUrl(id);
    window.open(directUrl, '_blank');
    addToast({ type: 'success', message: 'Rəsmi PDF vauçer endirilir...' });
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
      setCopied(true);
      addToast({ type: 'success', message: 'Bilet linki kopyalandı!' });
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="web-voucher-actions">
      <Button
        variant="primary"
        onClick={handleDownloadPdf}
        className="web-pdf-btn"
        leftIcon={<Download size={18} />}
      >
        PDF Endir
      </Button>

      <Button
        variant="secondary"
        onClick={handlePrint}
        className="web-print-btn"
        leftIcon={<Printer size={18} />}
      >
        Çap Et
      </Button>

      <Button
        variant="ghost"
        onClick={handleShare}
        className="web-share-btn"
        leftIcon={copied ? <Check size={18} /> : <Share2 size={18} />}
      >
        {copied ? 'Kopyalandı' : 'Paylaş'}
      </Button>
    </div>
  );
};
