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
  FileCheck2
} from 'lucide-react';
import { Card, Badge } from '@toursales/ui';
import { Booking } from '@toursales/types';
import './VoucherDetailsCard.css';

interface VoucherDetailsCardProps {
  booking: Booking;
}

export const VoucherDetailsCard: React.FC<VoucherDetailsCardProps> = ({ booking }) => {
  const tour = booking.tour;

  return (
    <Card variant="default" className="web-voucher-details-card">
      <div className="web-voucher-header">
        <div className="web-voucher-type">
          <FileCheck2 size={20} className="web-voucher-icon" />
          <span>RƏSMİ ELEKTRON TUR BİLETİ (VOUCHER)</span>
        </div>
        <Badge variant={booking.status === 'CONFIRMED' ? 'success' : 'primary'} pill>
          {booking.status === 'CONFIRMED' ? 'ÖDƏNİLİB VƏ TƏSDİQLƏNİB' : booking.status}
        </Badge>
      </div>

      <div className="web-voucher-tour-info">
        <h2 className="web-voucher-tour-title">{tour?.title || 'Tur Məlumatı'}</h2>
        {tour?.company && (
          <div className="web-voucher-agency">
            <Building2 size={16} />
            <span>Təşkilatçı Agentlik: <strong>{tour.company.name}</strong></span>
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
            {tour?.startDate ? new Date(tour.startDate).toLocaleDateString('az-AZ', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }) : 'Qeyd olunmayıb'}
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
            {booking.passengers && booking.passengers.length > 0 ? (
              booking.passengers.map((p, idx) => (
                <span key={idx} className="web-seat-badge">
                  №{p.seatNumber || (idx + 1)}
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
          <span>Sərnişin Siyahısı ({booking.passengers?.length || 1} nəfər)</span>
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
                    <td className="web-passenger-fin">{passenger.finCode || '—'}</td>
                    <td>{passenger.phone || '—'}</td>
                    <td>
                      <span className="web-table-seat">№{passenger.seatNumber || (index + 1)}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>1</td>
                  <td className="web-passenger-name">{booking.user?.name || 'Müştəri'}</td>
                  <td className="web-passenger-fin">—</td>
                  <td>{booking.user?.phone || '—'}</td>
                  <td><span className="web-table-seat">№1</span></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="web-voucher-payment-summary">
        <div className="web-payment-detail">
          <span className="web-payment-label">Ödəniş Metodu:</span>
          <span className="web-payment-value">
            <CreditCard size={15} /> Onlayn Kart (BirBank/Kapital)
          </span>
        </div>
        <div className="web-payment-detail">
          <span className="web-payment-label">Ödənilən Məbləğ:</span>
          <span className="web-payment-price">{booking.totalPrice} AZN</span>
        </div>
      </div>
    </Card>
  );
};
