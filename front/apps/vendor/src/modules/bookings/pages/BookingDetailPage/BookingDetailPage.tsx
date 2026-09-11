import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Ticket, 
  Calendar, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  Printer, 
  Bus, 
  User 
} from 'lucide-react';
import { Card, Badge, Button, Spinner } from '@toursales/ui';
import { Booking } from '@toursales/types';

import { vendorBookingApi } from '../../api/vendorBookingApi';
import './BookingDetailPage.css';

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await vendorBookingApi.getBookingById(id);
        setBooking(res.data);
      } catch (err) {
        console.error('Bilet tapılmadı:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="vendor-booking-detail-page">
      <div className="vendor-page-header">
        <div>
          <h1 className="vendor-page-title">Rezervasiya Təfərrüatları</h1>
          <p className="vendor-page-subtitle">{booking ? `Bilet №${booking.bookingNumber}` : 'Bilet məlumatları'}</p>
        </div>
      </div>

      <div className="vendor-page-content">
        <div className="vendor-detail-top-bar">
          <Link to="/bookings" className="vendor-back-link">
            <ArrowLeft size={16} />
            <span>Sifarişlərə Qayıt</span>
          </Link>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer size={15} />
            <span>Çap Et</span>
          </Button>
        </div>

        {loading ? (
          <div className="vendor-detail-loading">
            <Spinner size="lg" />
            <p>Məlumatlar hazırlanır...</p>
          </div>
        ) : !booking ? (
          <div className="vendor-detail-error">Bilet tapılmadı.</div>
        ) : (
          <div className="vendor-detail-grid">
            {/* Left: General & Tour Info */}
            <div className="vendor-detail-left-col">
              <Card variant="default" className="vendor-detail-card">
                <div className="vendor-detail-header-row">
                  <div>
                    <span className="vendor-detail-booking-num">
                      №{booking.bookingNumber}
                    </span>
                    <h2>{booking.tourTitle || 'Tur'}</h2>
                  </div>
                  <Badge
                    variant={
                      booking.status === 'CONFIRMED'
                        ? 'success'
                        : booking.status === 'COMPLETED'
                        ? 'neutral'
                        : 'warning'
                    }
                    pill
                  >
                    {booking.status}
                  </Badge>
                </div>

                <div className="vendor-detail-info-grid">
                  <div className="vendor-info-box">
                    <span className="vendor-info-label">Sifariş Tarixi:</span>
                    <strong>
                      {new Date(booking.createdAt).toLocaleDateString('az-AZ')}
                    </strong>
                  </div>

                  <div className="vendor-info-box">
                    <span className="vendor-info-label">Ödəniş Metodu:</span>
                    <strong>{booking.paymentMethod}</strong>
                  </div>

                  <div className="vendor-info-box">
                    <span className="vendor-info-label">Ödəniş Statusu:</span>
                    <strong>{booking.paymentStatus}</strong>
                  </div>

                  <div className="vendor-info-box">
                    <span className="vendor-info-label">Ümumi Məbləğ:</span>
                    <strong className="vendor-detail-total-price">
                      {booking.totalAmount} {booking.currency || 'AZN'}
                    </strong>
                  </div>
                </div>
              </Card>

              {/* Passengers list table */}
              <Card variant="default" className="vendor-detail-card">
                <h3 className="vendor-detail-section-title">
                  <User size={18} />
                  <span>Sərnişinlər ({booking.passengers?.length || 1})</span>
                </h3>

                <div className="vendor-passengers-table-wrap">
                  <table className="vendor-passengers-table">
                    <thead>
                      <tr>
                        <th>Yer №</th>
                        <th>Ad, Soyad</th>
                        <th>Əlaqə</th>
                        <th>FİN Kod</th>
                      </tr>
                    </thead>
                    <tbody>
                      {booking.passengers?.map((p: any, idx: number) => (
                        <tr key={idx}>
                          <td>
                            <span className="vendor-roster-seat">№{p.seatNumber}</span>
                          </td>
                          <td><strong>{p.fullName}</strong></td>
                          <td>{p.phone}</td>
                          <td>
                            <span className="vendor-roster-fin">{p.finCode || '—'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Right: QR Code ticket visual */}
            <div className="vendor-detail-right-col">
              <Card variant="default" className="vendor-qr-card-box">
                <h4>Canlı Bilet QR Kodu</h4>
                <div className="vendor-qr-img-frame">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      booking.qrToken || booking.bookingNumber
                    )}`}
                    alt="QR"
                  />
                </div>
                <span className="vendor-qr-token font-mono">{booking.bookingNumber}</span>
                <p className="vendor-qr-desc">
                  Minik qapısında skanerlə oxudularaq dərhal təsdiqlənir.
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
