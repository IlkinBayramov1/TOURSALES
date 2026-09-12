import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Ticket, 
  Calendar, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  Printer, 
  Bus, 
  User,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { Card, Badge, Button, Spinner, Modal } from '@toursales/ui';
import { Booking } from '@toursales/types';

import { vendorBookingApi } from '../../api/vendorBookingApi';
import './BookingDetailPage.css';

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);

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

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmCancel = async () => {
    if (!booking) return;
    try {
      setCancelling(true);
      const res = await vendorBookingApi.cancelBooking(booking.id);
      setCancelMsg((res as any).msg || res.message || 'Rezervasiya uğurla ləğv edildi.');
      setTimeout(() => {
        setCancelModalOpen(false);
        fetchDetail();
      }, 1500);
    } catch (err: any) {
      console.error('Ləğv etmə xətası:', err);
      alert(err.response?.data?.msg || 'Ləğv edilərkən xəta baş verdi.');
    } finally {
      setCancelling(false);
    }
  };

  const handleTogglePassengerCheckIn = async (seatNumber: number) => {
    if (!booking) return;
    try {
      await vendorBookingApi.toggleCheckIn(booking.id, seatNumber);
      fetchDetail();
    } catch (err) {
      console.error('Minik statusu dəyişdirilərkən xəta:', err);
    }
  };

  // Calculate refund policy preview
  const getRefundPreview = () => {
    if (!booking?.tourStartDate) return null;
    const now = new Date();
    const start = new Date(booking.tourStartDate);
    const diffHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return { percent: 0, text: 'Tur artıq başlayıb. Geri qaytarılma məbləği: 0 AZN (0%)' };
    } else if (diffHours < 24) {
      return { percent: 0, text: 'Tura 24 saatdan az qalıb. Qaydalara əsasən geri ödəmə: 0 AZN (0%)' };
    } else if (diffHours < 72) {
      const refund = ((booking.totalAmount || 0) * 0.5).toFixed(2);
      return { percent: 50, text: `Tura 72 saatdan az qalıb. 50% cərimə tətbiq olunur. Geri ödəmə: ${refund} AZN` };
    } else {
      return { percent: 100, text: `Tura 72 saatdan çox var. 100% tam geri qaytarılma: ${booking.totalAmount} AZN` };
    }
  };

  const refundPreview = getRefundPreview();

  return (
    <div className="vendor-booking-detail-page">
      <div className="vendor-page-header">
        <div>
          <h1 className="vendor-page-title">Rezervasiya Təfərrüatları</h1>
          <p className="vendor-page-subtitle">{booking ? `Bilet №${booking.bookingNumber}` : 'Bilet məlumatları'}</p>
        </div>
      </div>

      <div className="vendor-page-content">
        <div className="vendor-detail-top-bar no-print">
          <Link to="/bookings" className="vendor-back-link">
            <ArrowLeft size={16} />
            <span>Sifarişlərə Qayıt</span>
          </Link>
          <div className="vendor-detail-actions">
            {booking && booking.status === 'CONFIRMED' && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setCancelModalOpen(true)}
              >
                <XCircle size={15} />
                <span>Rezervasiyanı Ləğv Et</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer size={15} />
              <span>Çap Et</span>
            </Button>
          </div>
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
                  <div className="vendor-badge-group">
                    <Badge
                      variant={
                        booking.status === 'CONFIRMED'
                          ? 'success'
                          : booking.status === 'CANCELLED'
                          ? 'error'
                          : 'warning'
                      }
                      pill
                    >
                      {booking.status === 'CONFIRMED'
                        ? 'Təsdiqlənib'
                        : booking.status === 'CANCELLED'
                        ? 'Ləğv Edilib'
                        : booking.status}
                    </Badge>

                    <Badge
                      variant={booking.isCheckedIn ? 'success' : 'neutral'}
                      pill
                    >
                      {booking.isCheckedIn ? '✓ Minikdən Keçib' : 'Minik Gözləyir'}
                    </Badge>
                  </div>
                </div>

                <div className="vendor-detail-info-grid">
                  <div className="vendor-info-box">
                    <span className="vendor-info-label">Sifariş Tarixi:</span>
                    <strong>
                      {new Date(booking.createdAt).toLocaleDateString('az-AZ', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </strong>
                  </div>

                  <div className="vendor-info-box">
                    <span className="vendor-info-label">Tur Başlanğıcı:</span>
                    <strong>
                      {booking.tourStartDate
                        ? new Date(booking.tourStartDate).toLocaleDateString('az-AZ', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '—'}
                    </strong>
                  </div>

                  <div className="vendor-info-box">
                    <span className="vendor-info-label">Ödəniş Metodu:</span>
                    <strong>{booking.paymentMethod || 'Onlayn Kart'}</strong>
                  </div>

                  <div className="vendor-info-box">
                    <span className="vendor-info-label">Ödəniş Statusu:</span>
                    <strong className={booking.paymentStatus === 'PAID' ? 'text-success' : 'text-warning'}>
                      {booking.paymentStatus === 'PAID' ? 'Tam Ödənilib' : booking.paymentStatus}
                    </strong>
                  </div>

                  <div className="vendor-info-box">
                    <span className="vendor-info-label">Ümumi Məbləğ:</span>
                    <strong className="vendor-detail-total-price">
                      {booking.totalAmount} {booking.currency || 'AZN'}
                    </strong>
                  </div>

                  <div className="vendor-info-box">
                    <span className="vendor-info-label">Minik Vaxtı:</span>
                    <strong>
                      {booking.checkedInAt
                        ? new Date(booking.checkedInAt).toLocaleString('az-AZ')
                        : 'Gözləmədə'}
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
                        <th>Minik</th>
                        <th className="no-print">Nəzarət</th>
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
                          <td>
                            <Badge
                              variant={p.isCheckedIn ? 'success' : 'neutral'}
                              pill
                            >
                              {p.isCheckedIn ? '✓ Mindirildi' : 'Gözləyir'}
                            </Badge>
                          </td>
                          <td className="no-print">
                            {booking.status === 'CONFIRMED' && (
                              <Button
                                variant={p.isCheckedIn ? 'ghost' : 'secondary'}
                                size="sm"
                                onClick={() => handleTogglePassengerCheckIn(p.seatNumber)}
                              >
                                {p.isCheckedIn ? 'Ləğv Et' : 'Mindir'}
                              </Button>
                            )}
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
                <h4>Rəsmi Bilet QR Kodu</h4>
                <div className="vendor-qr-img-frame">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                      booking.qrToken || booking.bookingNumber
                    )}`}
                    alt="QR"
                  />
                </div>
                <span className="vendor-qr-token font-mono">{booking.bookingNumber}</span>
                <p className="vendor-qr-desc">
                  Minik zamanı skanerlə oxudularaq dərhal təsdiqlənir və status avtomatik yenilənir.
                </p>

                <div className="vendor-ticket-meta">
                  <div className="vendor-meta-row">
                    <span>Avtobus Yerləri:</span>
                    <strong>
                      {booking.passengers?.map((p: any) => `№${p.seatNumber}`).join(', ') || '1'}
                    </strong>
                  </div>
                  <div className="vendor-meta-row">
                    <span>Platforma:</span>
                    <strong>TOURSALES Bilet Nəzarət Sistemi</strong>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Rezervasiyanın Ləğv Edilməsi"
        size="md"
      >
        <div className="vendor-cancel-modal-content">
          <AlertTriangle size={48} className="vendor-cancel-warn-icon" />
          <h3>Bu rezervasiyanı ləğv etmək istədiyinizdən əminsiniz?</h3>
          
          {refundPreview && (
            <div className="vendor-cancel-policy-card">
              <h4>Ləğvetmə və Qaytarılma Siyasəti:</h4>
              <p>{refundPreview.text}</p>
            </div>
          )}

          {cancelMsg ? (
            <div className="vendor-cancel-success-msg text-success">
              <CheckCircle2 size={20} />
              <span>{cancelMsg}</span>
            </div>
          ) : (
            <div className="vendor-cancel-actions">
              <Button
                variant="ghost"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelling}
              >
                Geri Qayıt
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmCancel}
                isLoading={cancelling}
              >
                Ləğvi Təsdiqlə
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
