import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Bus, 
  Users, 
  CreditCard, 
  CheckCircle2, 
  Building2,
  FileCheck2,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { Card, Badge } from '@toursales/ui';
import { Booking } from '@toursales/types';
import './VoucherDetailsCard.css';

interface VoucherDetailsCardProps {
  booking: Booking;
}

export const VoucherDetailsCard: React.FC<VoucherDetailsCardProps> = ({ booking }) => {
  const tour = booking.tour;
  const company = (booking as any).company || tour?.company;

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case 'BIRBANK':
        return 'BirBank / Birkart (Taksit/Debet)';
      case 'KAPITAL_BANK':
        return 'Kapital Bank (Visa / Mastercard)';
      case 'STRIPE':
        return 'Stripe (Beynəlxalq Kart / Apple Pay)';
      case 'EMANAT':
        return 'eManat Ödəniş Terminalı (Nağd)';
      case 'MILLION':
        return 'MilliÖN Ödəniş Terminalı (Nağd)';
      default:
        return method || 'Onlayn Kart Ödənişi';
    }
  };

  const totalPrice = Number((booking as any).totalAmount ?? booking.totalPrice ?? 0);
  const busSeats = (booking as any).busSeatNumber
    ? String((booking as any).busSeatNumber).split(',').filter(Boolean)
    : booking.passengers?.map((p) => p.seatNumber) || [];

  return (
    <Card variant="default" className="web-voucher-details-card">
      <div className="web-voucher-header">
        <div className="web-voucher-type">
          <FileCheck2 size={20} className="web-voucher-icon" />
          <span>RƏSMİ ELEKTRON TUR BİLETİ (VOUCHER)</span>
        </div>
        <Badge
          variant={booking.paymentStatus === 'PAID' || booking.status === 'CONFIRMED' ? 'success' : 'primary'}
          pill
        >
          {booking.paymentStatus === 'PAID' || booking.status === 'CONFIRMED'
            ? '✓ ÖDƏNİLİB VƏ TƏSDİQLƏNİB'
            : booking.paymentStatus === 'PENDING'
            ? 'ÖDƏNİŞ GÖZLƏNİLİR'
            : booking.status}
        </Badge>
      </div>

      <div className="web-voucher-tour-info">
        <h2 className="web-voucher-tour-title">{tour?.title || 'Tur Məlumatı'}</h2>
        {company && (
          <div className="web-voucher-agency">
            <Building2 size={16} />
            <span>
              Təşkilatçı Agentlik: <strong>{company.name}</strong>
            </span>
            {company.phoneNumber && (
              <span className="web-agency-phone">
                <Phone size={13} /> {company.phoneNumber}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="web-voucher-grid">
        <div className="web-voucher-item">
          <div className="web-voucher-item-label">
            <Calendar size={16} />
            <span>Tur Tarixi:</span>
          </div>
          <div className="web-voucher-item-value">
            {tour?.startDate
              ? new Date(tour.startDate).toLocaleDateString('az-AZ', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : 'Qeyd olunmayıb'}
          </div>
        </div>

        <div className="web-voucher-item">
          <div className="web-voucher-item-label">
            <Clock size={16} />
            <span>Toplanış Saatı:</span>
          </div>
          <div className="web-voucher-item-value">
            06:30 (Çıxış: 07:00)
          </div>
        </div>

        <div className="web-voucher-item">
          <div className="web-voucher-item-label">
            <MapPin size={16} />
            <span>Toplanış Yeri:</span>
          </div>
          <div className="web-voucher-item-value">
            {tour?.location || 'Gənclik m/s, Caspian Shopping qarşısı'}
          </div>
        </div>

        <div className="web-voucher-item">
          <div className="web-voucher-item-label">
            <Bus size={16} />
            <span>Nəqliyyat & Oturacaq:</span>
          </div>
          <div className="web-voucher-item-value web-voucher-seats">
            {busSeats.length > 0 ? (
              busSeats.map((seatNum: any, idx: number) => (
                <span key={idx} className="web-seat-badge">
                  №{seatNum}
                </span>
              ))
            ) : (
              <span>Avtomatik bölüşdürülüb</span>
            )}
          </div>
        </div>
      </div>

      <div className="web-voucher-passengers-section">
        <h4 className="web-voucher-section-title">
          <Users size={16} />
          <span>Sərnişin Manifesti ({booking.passengers?.length || 1} nəfər)</span>
        </h4>
        <div className="web-passengers-table-wrap">
          <table className="web-passengers-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Ad, Soyad</th>
                <th>Ş/V FİN Kodu</th>
                <th>Əlaqə Nömrəsi</th>
                <th>Oturacaq</th>
              </tr>
            </thead>
            <tbody>
              {booking.passengers && booking.passengers.length > 0 ? (
                booking.passengers.map((passenger, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td className="web-passenger-name">{passenger.fullName}</td>
                    <td className="web-passenger-fin">{passenger.finCode || passenger.idNumber || '—'}</td>
                    <td>{passenger.phone || '—'}</td>
                    <td>
                      <span className="web-table-seat">№{passenger.seatNumber || (index + 1)}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>1</td>
                  <td className="web-passenger-name">
                    {(booking as any).passengerName
                      ? `${(booking as any).passengerName} ${(booking as any).passengerSurname || ''}`
                      : booking.user?.name || 'Müştəri'}
                  </td>
                  <td className="web-passenger-fin">{(booking as any).passengerPassport || '—'}</td>
                  <td>{(booking as any).contactNumber || booking.user?.phone || '—'}</td>
                  <td>
                    <span className="web-table-seat">№{(booking as any).busSeatNumber || 1}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="web-voucher-payment-summary">
        <div className="web-payment-detail">
          <span className="web-payment-label">Ödəniş Üsulu:</span>
          <span className="web-payment-value">
            <CreditCard size={15} /> {getPaymentMethodLabel(booking.paymentMethod)}
          </span>
        </div>
        <div className="web-payment-detail">
          <span className="web-payment-label">Ümumi Məbləğ:</span>
          <span className="web-payment-price">{totalPrice} {booking.currency || 'AZN'}</span>
        </div>
      </div>
    </Card>
  );
};
