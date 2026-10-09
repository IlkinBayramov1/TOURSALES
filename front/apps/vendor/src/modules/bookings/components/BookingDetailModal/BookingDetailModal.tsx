import React, { useState } from 'react';
import { 
  Ticket, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Send, 
  CheckCircle2, 
  Clock, 
  Printer, 
  ExternalLink,
  Bus, 
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react';
import { Modal, Badge, Button } from '@toursales/ui';
import { Booking } from '@toursales/types';
import { vendorBookingApi } from '../../api/vendorBookingApi';
import './BookingDetailModal.css';

interface BookingDetailModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  isOpen,
  onClose,
  onStatusUpdated,
}) => {
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [togglingSeat, setTogglingSeat] = useState<number | null>(null);

  if (!booking) return null;

  const total = Number(booking.totalAmount || booking.totalPrice || 0);
  const paid = Number(booking.paidAmount || 0);
  const remaining = Number(
    booking.remainingAmount !== undefined && booking.remainingAmount !== null
      ? booking.remainingAmount
      : Math.max(0, total - paid)
  );
  const isPartiallyPaid = 
    booking.paymentStatus === 'PARTIALLY_PAID' || 
    booking.status === 'PARTIALLY_PAID' ||
    (booking.paymentType === 'DEPOSIT' && remaining > 0);

  const handleCopyId = () => {
    navigator.clipboard.writeText(booking.id || booking.bookingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendReminder = async () => {
    try {
      setSendingReminder(true);
      await vendorBookingApi.sendBalanceReminderWhatsApp(booking.id);
      setReminderSuccess(true);
      setTimeout(() => setReminderSuccess(false), 3500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Qalıq bildirişi göndərilə bilmədi.');
    } finally {
      setSendingReminder(false);
    }
  };

  const handleToggleCheckIn = async (seatNumber?: number) => {
    try {
      if (seatNumber) setTogglingSeat(seatNumber);
      await vendorBookingApi.toggleCheckIn(booking.id, seatNumber);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      console.error('Minik statusu dəyişdirilərkən xəta:', err);
    } finally {
      setTogglingSeat(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Rezervasiya Təfərrüatları: ${booking.bookingNumber}`}
      size="lg"
    >
      <div className="vendor-detail-modal-root">
        {/* Header Bar with ID, Badges and Quick Copy */}
        <div className="vdm-header-banner">
          <div className="vdm-id-group">
            <span className="vdm-label">Bilet №:</span>
            <strong className="vdm-booking-num font-mono">{booking.bookingNumber}</strong>
            <button 
              type="button" 
              className="vdm-copy-btn" 
              onClick={handleCopyId}
              title="Bilet nömrəsini kopyala"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>

          <div className="vdm-badge-cluster">
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
                ? '✓ Təsdiqlənib'
                : booking.status === 'CANCELLED'
                ? 'Ləğv edilib'
                : isPartiallyPaid
                ? '30% Depozit'
                : booking.status}
            </Badge>

            <Badge
              variant={booking.isCheckedIn ? 'success' : 'neutral'}
              pill
            >
              {booking.isCheckedIn ? '✓ Minikdən Keçib' : 'Minik Gözləyir'}
            </Badge>

            {booking.paymentStatus === 'PAID' ? (
              <Badge variant="success" pill>Tam Ödənilib</Badge>
            ) : isPartiallyPaid ? (
              <Badge variant="warning" pill>Qalıq Borc Var</Badge>
            ) : (
              <Badge variant="neutral" pill>{booking.paymentStatus}</Badge>
            )}
          </div>
        </div>

        {/* 2-Column Info Layout */}
        <div className="vdm-content-grid">
          {/* Left Column: Tour & Financial Info */}
          <div className="vdm-main-pane">
            {/* Tour Meta Card */}
            <div className="vdm-card">
              <h4 className="vdm-card-title">
                <Calendar size={16} />
                <span>Tur və Marşrut</span>
              </h4>
              <div className="vdm-tour-name">{booking.tourTitle || 'Tur'}</div>
              
              <div className="vdm-meta-grid">
                <div className="vdm-meta-item">
                  <span className="vdm-meta-key">Başlama Tarixi:</span>
                  <strong>
                    {booking.tourStartDate 
                      ? new Date(booking.tourStartDate).toLocaleDateString('az-AZ', { day: '2-digit', month: 'long', year: 'numeric' })
                      : '—'}
                  </strong>
                </div>

                <div className="vdm-meta-item">
                  <span className="vdm-meta-key">Toplanış Yeri:</span>
                  <strong>{booking.tour?.meetingPointAddress || (booking as any).meetingPointAddress || 'Gənclik m/s'}</strong>
                </div>

                <div className="vdm-meta-item">
                  <span className="vdm-meta-key">Nəqliyyat / Sürücü:</span>
                  <strong>
                    {booking.tour?.busPlateNumber || (booking as any).busPlateNumber || '99-XX-000'}
                    {booking.tour?.driverPhone && ` (${booking.tour.driverPhone})`}
                  </strong>
                </div>

                <div className="vdm-meta-item">
                  <span className="vdm-meta-key">Sifariş Tarixi:</span>
                  <strong>{new Date(booking.createdAt).toLocaleDateString('az-AZ')}</strong>
                </div>
              </div>
            </div>

            {/* Financial Status Card */}
            <div className="vdm-card">
              <h4 className="vdm-card-title">
                <CreditCard size={16} />
                <span>Maliyyə və Ödəniş Vəziyyəti</span>
              </h4>

              <div className="vdm-finance-strip">
                <div className="vdm-finance-box">
                  <span className="vdm-fin-label">Ümumi Məbləğ</span>
                  <span className="vdm-fin-val">{total} AZN</span>
                </div>
                <div className="vdm-finance-box text-emerald-600">
                  <span className="vdm-fin-label">Ödənilən</span>
                  <span className="vdm-fin-val font-semibold">{paid} AZN</span>
                </div>
                <div className={`vdm-finance-box ${remaining > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                  <span className="vdm-fin-label">Qalıq Borc</span>
                  <span className="vdm-fin-val font-bold">{remaining} AZN</span>
                </div>
              </div>

              {isPartiallyPaid && remaining > 0 && (
                <div className="vdm-balance-alert-box">
                  <div className="vdm-balance-alert-text">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    <div>
                      <strong>30% Depozit Qaydası:</strong>
                      <span> Qalan {remaining} AZN məbləğ tur başlamazdan əvvəl ödənilməlidir.</span>
                      {booking.depositDueDate && (
                        <div className="text-xs text-amber-700 font-semibold mt-0.5">
                          Son ödəniş tarixi: {new Date(booking.depositDueDate).toLocaleDateString('az-AZ')}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSendReminder}
                    isLoading={sendingReminder}
                    className="vdm-whatsapp-btn"
                  >
                    <Send size={14} />
                    <span>{reminderSuccess ? 'Göndərildi! ✓' : 'WhatsApp ilə Link Göndər'}</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Passengers Table Card */}
            <div className="vdm-card">
              <h4 className="vdm-card-title">
                <User size={16} />
                <span>Sərnişin Heyəti ({booking.passengers?.length || 1} nəfər)</span>
              </h4>

              <div className="vdm-passengers-table-wrap">
                <table className="vdm-passengers-table">
                  <thead>
                    <tr>
                      <th>Yer №</th>
                      <th>Ad, Soyad</th>
                      <th>Əlaqə</th>
                      <th>FİN Kod</th>
                      <th>Minik</th>
                      <th>Nəzarət</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booking.passengers?.map((p: any, idx: number) => (
                      <tr key={idx}>
                        <td>
                          <span className="vdm-seat-pill">№{p.seatNumber}</span>
                        </td>
                        <td>
                          <strong>{p.fullName}</strong>
                        </td>
                        <td>
                          <a href={`tel:${p.phone || booking.contactNumber}`} className="vdm-phone-link">
                            <Phone size={12} />
                            <span>{p.phone || booking.contactNumber || '—'}</span>
                          </a>
                        </td>
                        <td>
                          <span className="font-mono text-xs">{p.finCode || (booking as any).passengerPassport || '—'}</span>
                        </td>
                        <td>
                          <Badge variant={p.isCheckedIn ? 'success' : 'neutral'} pill>
                            {p.isCheckedIn ? 'Mindirilib' : 'Gözləyir'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant={p.isCheckedIn ? 'ghost' : 'secondary'}
                            size="sm"
                            isLoading={togglingSeat === p.seatNumber}
                            onClick={() => handleToggleCheckIn(p.seatNumber)}
                            className="vdm-toggle-btn"
                          >
                            {p.isCheckedIn ? 'Ləğv Et' : 'Mindir'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: QR Code & Quick Actions */}
          <div className="vdm-side-pane">
            <div className="vdm-qr-card">
              <h4>Bilet QR Kodu</h4>
              <div className="vdm-qr-frame">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    booking.qrToken || booking.bookingNumber
                  )}`}
                  alt="QR"
                />
              </div>
              <span className="vdm-qr-token font-mono">{booking.bookingNumber}</span>
              <p className="vdm-qr-hint">
                Avtobusa minik zamanı oxudularaq dərhal qeydiyyata alınır.
              </p>

              <div className="vdm-actions-stack">
                <Button variant="outline" size="sm" onClick={handlePrint} className="w-full">
                  <Printer size={15} />
                  <span>Vauçeri Çap Et</span>
                </Button>

                <a 
                  href={`/vendor/bookings/${booking.id}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="vdm-fullpage-link"
                >
                  <ExternalLink size={14} />
                  <span>Tam Detal Səhifəsini Aç</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="vdm-footer">
          <Button variant="secondary" onClick={onClose}>
            Bağla
          </Button>
        </div>
      </div>
    </Modal>
  );
};
