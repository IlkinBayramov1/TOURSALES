import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { VendorSidebar } from '../shared/components/VendorSidebar/VendorSidebar';
import { VendorHeader } from '../shared/components/VendorHeader/VendorHeader';
import { QrScannerModal } from '../modules/bookings/components/QrScannerModal/QrScannerModal';
import './VendorLayout.css';

export const VendorLayout: React.FC = () => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <div className="vendor-layout">
      <VendorSidebar />

      <div className="vendor-layout-main">
        <VendorHeader onOpenScanner={() => setIsScannerOpen(true)} />

        <main className="vendor-layout-content">
          <Outlet />
        </main>
      </div>

      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={(booking) => {
          alert(`Sərnişin qeydiyyatdan keçdi: ${booking.passengerNames?.join(', ') || booking.bookingNumber} (Oturacaq #${booking.seatNumbers?.join(', ')})`);
          setIsScannerOpen(false);
        }}
      />
    </div>
  );
};
