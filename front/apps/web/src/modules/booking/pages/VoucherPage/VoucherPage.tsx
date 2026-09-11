import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Spinner, Button } from '@toursales/ui';
import { Booking } from '@toursales/types';
import { bookingApi } from '../../api/bookingApi';
import { LiveQrCodeCard } from './components/LiveQrCodeCard/LiveQrCodeCard';
import { VoucherDetailsCard } from './components/VoucherDetailsCard/VoucherDetailsCard';
import { PrintVoucherButton } from './components/PrintVoucherButton/PrintVoucherButton';
import './VoucherPage.css';

export const VoucherPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await bookingApi.getBookingById(id);
        setBooking(res.data);
      } catch (err: any) {
        console.error('Bilet tapılmadı:', err);
        setError('Bilet məlumatları yüklənərkən xəta baş verdi və ya bilet mövcud deyil.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="web-voucher-loading">
        <Spinner size="lg" />
        <p>Bilet məlumatları hazırlanır...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="web-voucher-error-wrap">
        <AlertCircle size={48} className="web-voucher-error-icon" />
        <h2>Bilet Tapılmadı</h2>
        <p>{error || 'Axtardığınız bilet qeydiyyatı mövcud deyil.'}</p>
        <Link to="/account/bookings">
          <Button variant="primary">Sifarişlərimə Qayıt</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="web-voucher-container">
      <div className="web-voucher-top-bar">
        <Link to="/account/bookings" className="web-voucher-back-link">
          <ArrowLeft size={18} />
          <span>Sifarişlərimə Qayıt</span>
        </Link>
        <PrintVoucherButton bookingNumber={booking.bookingNumber} />
      </div>

      <div className="web-voucher-banner">
        <div className="web-voucher-banner-icon">
          <CheckCircle2 size={32} />
        </div>
        <div className="web-voucher-banner-content">
          <h1>Sifarişiniz Uğurla Təsdiqləndi!</h1>
          <p>
            Tur biletiniz hazırdır. Həmçinin elektron qəbz və bilet təsdiqi e-poçt ünvanınıza göndərildi.
          </p>
        </div>
      </div>

      <div className="web-voucher-main-layout">
        <div className="web-voucher-left-col">
          <LiveQrCodeCard
            bookingNumber={booking.bookingNumber}
            isCheckedIn={booking.status === 'COMPLETED'}
          />
        </div>

        <div className="web-voucher-right-col">
          <VoucherDetailsCard booking={booking} />
        </div>
      </div>
    </div>
  );
};
