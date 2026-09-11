import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  Clock, 
  Bus, 
  AlertCircle, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { Card, Badge, Button, Spinner, Modal } from '@toursales/ui';
import { Booking } from '@toursales/types';
import { AccountSidebar } from '../../components/AccountSidebar/AccountSidebar';
import { VoucherDownloadButton } from '../../components/VoucherDownloadButton/VoucherDownloadButton';
import { accountApi } from '../../api/accountApi';
import { useToast } from '@/shared/context/ToastContext';
import './BookingHistoryPage.css';

export const BookingHistoryPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  
  // Cancel Modal state
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);

  const { addToast } = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await accountApi.getMyBookings();
      setBookings(res.data || []);
    } catch (err) {
      console.error('Sifarişlər yüklənərkən xəta:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    try {
      setIsSubmittingCancel(true);
      await accountApi.cancelBooking(cancellingBooking.id, cancelReason);
      addToast({ type: 'success', message: 'Sifarişiniz uğurla ləğv edildi.' });
      setCancellingBooking(null);
      setCancelReason('');
      await fetchBookings();
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.response?.data?.message || 'Sifariş ləğv edilərkən xəta baş verdi.',
      });
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    return b.status === activeTab;
  });

  return (
    <div className="web-account-layout-container">
      <div className="web-account-grid">
        <aside className="web-account-sidebar-col">
          <AccountSidebar />
        </aside>

        <main className="web-account-main-col">
          <div className="web-account-page-header">
            <h1>Sifarişlərim və Biletlər</h1>
            <p>Aldığınız bütün biletlərə baxın, canlı QR voucher-i açın və ya çap edin.</p>
          </div>

          <div className="web-booking-tabs">
            <button
              type="button"
              className={`web-booking-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              Hamısı ({bookings.length})
            </button>
            <button
              type="button"
              className={`web-booking-tab-btn ${activeTab === 'CONFIRMED' ? 'active' : ''}`}
              onClick={() => setActiveTab('CONFIRMED')}
            >
              Aktiv Biletlər ({bookings.filter((b) => b.status === 'CONFIRMED').length})
            </button>
            <button
              type="button"
              className={`web-booking-tab-btn ${activeTab === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setActiveTab('COMPLETED')}
            >
              Tamamlanmış ({bookings.filter((b) => b.status === 'COMPLETED').length})
            </button>
            <button
              type="button"
              className={`web-booking-tab-btn ${activeTab === 'CANCELLED' ? 'active' : ''}`}
              onClick={() => setActiveTab('CANCELLED')}
            >
              Ləğv Edilmiş ({bookings.filter((b) => b.status === 'CANCELLED').length})
            </button>
          </div>

          {loading ? (
            <div className="web-booking-loading">
              <Spinner size="lg" />
              <p>Sifarişləriniz yüklənir...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <Card variant="default" className="web-booking-empty-card">
              <Ticket size={48} className="web-empty-ticket-icon" />
              <h3>Bu bölmədə heç bir sifariş tapılmadı</h3>
              <p>Hələ ki hər hansı tur üçün rezervasiya etməmisiniz.</p>
              <Link to="/catalog">
                <Button variant="primary">Turları Kəşf Et</Button>
              </Link>
            </Card>
          ) : (
            <div className="web-booking-list">
              {filteredBookings.map((booking) => {
                const tour = booking.tour;
                const isCancellable = booking.status === 'CONFIRMED';

                return (
                  <Card key={booking.id} variant="default" className="web-booking-card">
                    <div className="web-booking-card-main">
                      <div className="web-booking-tour-thumb">
                        <img
                          src={tour?.images?.[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300'}
                          alt={tour?.title}
                        />
                      </div>

                      <div className="web-booking-card-info">
                        <div className="web-booking-card-top">
                          <span className="web-booking-number">№{booking.bookingNumber}</span>
                          <Badge
                            variant={
                              booking.status === 'CONFIRMED'
                                ? 'success'
                                : booking.status === 'COMPLETED'
                                ? 'neutral'
                                : 'error'
                            }
                            pill
                          >
                            {booking.status === 'CONFIRMED'
                              ? 'Aktiv / Təsdiqlənib'
                              : booking.status === 'COMPLETED'
                              ? 'Tamamlandı'
                              : 'Ləğv Edildi'}
                          </Badge>
                        </div>

                        <h3 className="web-booking-tour-title">{tour?.title || 'Tur'}</h3>

                        <div className="web-booking-meta-row">
                          <span className="web-meta-item">
                            <Calendar size={14} />
                            {tour?.startDate
                              ? new Date(tour.startDate).toLocaleDateString('az-AZ', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Tarix'}
                          </span>
                          <span className="web-meta-item">
                            <MapPin size={14} />
                            {tour?.location || 'Bakı'}
                          </span>
                          <span className="web-meta-item">
                            <Bus size={14} />
                            {booking.passengers?.length || 1} yer
                          </span>
                        </div>
                      </div>

                      <div className="web-booking-card-actions">
                        <div className="web-booking-card-price">
                          <span className="web-price-label">Ümumi:</span>
                          <span className="web-price-val">{booking.totalPrice} AZN</span>
                        </div>

                        <div className="web-action-buttons">
                          <VoucherDownloadButton
                            bookingId={booking.id}
                            variant="primary"
                            size="md"
                            showText={true}
                          />

                          {isCancellable && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="web-cancel-btn"
                              onClick={() => setCancellingBooking(booking)}
                            >
                              Ləğv Et
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancellingBooking && (
        <Modal
          isOpen={!!cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          title="Sifarişin Ləğvi"
          size="md"
        >
          <div className="web-cancel-modal-content">
            <AlertCircle size={40} className="web-cancel-modal-icon" />
            <p>
              <strong>{cancellingBooking.bookingNumber}</strong> nömrəli sifarişi ləğv etmək istədiyinizdən əminsiniz?
            </p>
            <p className="web-cancel-terms-hint">
              Qaydalara əsasən, turun çıxışına 48 saatdan az qalmış ləğvlərdə komissiya tutula bilər.
            </p>

            <div className="web-cancel-reason-wrap">
              <label>Ləğv etmə səbəbiniz (isteğe bağlı):</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Məs: Planlarım dəyişdi..."
                rows={3}
              />
            </div>

            <div className="web-modal-footer-actions">
              <Button
                variant="secondary"
                onClick={() => setCancellingBooking(null)}
              >
                Geri Qayıt
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmCancel}
                isLoading={isSubmittingCancel}
              >
                Sifarişi Ləğv Et
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
