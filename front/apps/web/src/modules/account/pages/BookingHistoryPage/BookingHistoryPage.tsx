import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  Clock, 
  Bus, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Star,
  Search,
  MessageSquarePlus,
  Info,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { Card, Badge, Button, Spinner, Modal } from '@toursales/ui';
import { Booking } from '@toursales/types';
import { AccountSidebar } from '../../components/AccountSidebar/AccountSidebar';
import { VoucherDownloadButton } from '../../components/VoucherDownloadButton/VoucherDownloadButton';
import { accountApi } from '../../api/accountApi';
import { tourApi } from '@/modules/tour/api/tourApi';
import { useCurrency } from '@/shared/context/CurrencyContext';
import { useToast } from '@/shared/context/ToastContext';
import './BookingHistoryPage.css';

export const BookingHistoryPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CONFIRMED' | 'PARTIALLY_PAID' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Cancel Modal state
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);

  // Review Modal state
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  const { formatPrice } = useCurrency();
  const { addToast } = useToast();
  const navigate = useNavigate();

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

  const getHoursLeft = (startDate?: string) => {
    if (!startDate) return 0;
    const diff = new Date(startDate).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  };

  const calculateCancellationDetails = (booking: Booking) => {
    const startDate = booking.tour?.startDate || booking.tourStartDate;
    const hours = getHoursLeft(startDate);
    let refundPercent = 0;
    if (hours >= 72) {
      refundPercent = 100;
    } else if (hours >= 24) {
      refundPercent = 70;
    } else if (hours > 0) {
      refundPercent = 30;
    } else {
      refundPercent = 0;
    }

    const paidAmount = Number(booking.paidAmount ?? booking.totalAmount ?? 0);
    const estimatedRefund = Number(((paidAmount * refundPercent) / 100).toFixed(2));
    const penaltyAmount = Number((paidAmount - estimatedRefund).toFixed(2));

    return { hours, refundPercent, estimatedRefund, penaltyAmount };
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    try {
      setIsSubmittingCancel(true);
      const res = await accountApi.cancelBooking(cancellingBooking.id, cancelReason);
      addToast({ 
        type: 'success', 
        message: (res as any).msg || res.message || 'Sifarişiniz uğurla ləğv edildi.' 
      });
      setCancellingBooking(null);
      setCancelReason('');
      await fetchBookings();
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.response?.data?.message || err.response?.data?.msg || 'Sifariş ləğv edilərkən xəta baş verdi.',
      });
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingBooking) return;
    if (!reviewComment.trim()) {
      addToast({ type: 'error', message: 'Zəhmət olmasa rəyinizi qeyd edin.' });
      return;
    }

    try {
      setIsSubmittingReview(true);
      await tourApi.addReview(reviewingBooking.tourId, {
        rating,
        comment: reviewComment.trim()
      });
      addToast({ type: 'success', message: 'Təşəkkür edirik! Rəyiniz uğurla əlavə edildi.' });
      setReviewingBooking(null);
      setReviewComment('');
      setRating(5);
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.response?.data?.message || err.response?.data?.msg || 'Rəy göndərilərkən xəta baş verdi.',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    // Status filter
    if (activeTab === 'PARTIALLY_PAID') {
      if (b.paymentStatus !== 'PARTIALLY_PAID' && b.status !== 'PARTIALLY_PAID') return false;
    } else if (activeTab !== 'ALL' && b.status !== activeTab) {
      return false;
    }
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const title = (b.tour?.title || b.tourTitle || '').toLowerCase();
      const id = (b.id || b.bookingNumber || '').toLowerCase();
      return title.includes(q) || id.includes(q);
    }
    return true;
  });

  const RATING_LABELS: Record<number, string> = {
    1: 'Çox pis təcrübə',
    2: 'Qənaətbəxş deyil',
    3: 'Orta səviyyə',
    4: 'Yaxşı və xoş təəssürat',
    5: 'Əla və unudulmaz!'
  };

  return (
    <div className="web-account-layout-container">
      <div className="web-account-grid">
        <aside className="web-account-sidebar-col">
          <AccountSidebar />
        </aside>

        <main className="web-account-main-col">
          <div className="web-account-page-header">
            <div>
              <h1>Sifarişlərim və Biletlər</h1>
              <p>Aldığınız bütün biletlərə baxın, canlı QR voucher-i açın, rəy yazın və ya ləğv edin.</p>
            </div>
          </div>

          {/* Search and Tabs Bar */}
          <div className="web-booking-controls-row">
            <div className="web-booking-search-wrap">
              <Search size={18} className="web-search-icon" />
              <input
                type="text"
                placeholder="Bilet № və ya Tur adı ilə axtar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="web-booking-search-input"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className="web-search-clear-btn"
                  onClick={() => setSearchQuery('')}
                >
                  &times;
                </button>
              )}
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
                Təsdiqlənmiş ({bookings.filter((b) => b.status === 'CONFIRMED').length})
              </button>
              <button
                type="button"
                className={`web-booking-tab-btn ${activeTab === 'PARTIALLY_PAID' ? 'active' : ''}`}
                onClick={() => setActiveTab('PARTIALLY_PAID')}
              >
                30% Depozit ({bookings.filter((b) => b.paymentStatus === 'PARTIALLY_PAID' || b.status === 'PARTIALLY_PAID').length})
              </button>
              <button
                type="button"
                className={`web-booking-tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
                onClick={() => setActiveTab('PENDING')}
              >
                Gözləyən ({bookings.filter((b) => b.status === 'PENDING').length})
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
              <p>
                {searchQuery 
                  ? `"${searchQuery}" sorğusuna uyğun heç bir rezervasiya tapılmadı.` 
                  : 'Hələ ki bu statusda rezervasiyanız mövcud deyil.'}
              </p>
              <Link to="/catalog">
                <Button variant="primary">Turları Kəşf Et</Button>
              </Link>
            </Card>
          ) : (
            <div className="web-booking-list">
              {filteredBookings.map((booking) => {
                const tour = booking.tour;
                const bookingId = booking.id || booking.bookingNumber;
                const isCancellable = (booking.status === 'CONFIRMED' || booking.status === 'PENDING' || booking.status === 'PARTIALLY_PAID');
                const isCompletedOrConfirmed = booking.status === 'COMPLETED' || booking.status === 'CONFIRMED';
                const totalAmount = Number(booking.totalAmount ?? booking.totalPrice ?? 0);
                const paidAmount = Number(booking.paidAmount ?? 0);
                const isPartiallyPaid = booking.paymentStatus === 'PARTIALLY_PAID' || booking.status === 'PARTIALLY_PAID';
                const remainingBalance = Math.max(0, totalAmount - paidAmount);
                
                // Parse tour images safely
                let tourImg = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300';
                if (tour?.images) {
                  try {
                    const parsed = typeof tour.images === 'string' ? JSON.parse(tour.images) : tour.images;
                    if (Array.isArray(parsed) && parsed.length > 0) tourImg = parsed[0];
                  } catch (e) {
                    if (typeof tour.images === 'string' && tour.images.startsWith('http')) tourImg = tour.images;
                  }
                }

                return (
                  <Card key={booking.id} variant="default" className="web-booking-card">
                    <div className="web-booking-card-main">
                      <div className="web-booking-tour-thumb">
                        <img
                          src={tourImg}
                          alt={tour?.title || 'Tur Şəkli'}
                        />
                      </div>

                      <div className="web-booking-card-info">
                        <div className="web-booking-card-top">
                          <span className="web-booking-number">№{bookingId}</span>
                          <Badge
                            variant={
                              booking.status === 'CONFIRMED'
                                ? 'success'
                                : booking.status === 'COMPLETED'
                                ? 'neutral'
                                : isPartiallyPaid
                                ? 'warning'
                                : booking.status === 'PENDING'
                                ? 'warning'
                                : 'error'
                            }
                            pill
                          >
                            {booking.status === 'CONFIRMED'
                              ? 'Aktiv / Təsdiqlənib'
                              : booking.status === 'COMPLETED'
                              ? 'Tamamlandı'
                              : isPartiallyPaid
                              ? '30% Depozit'
                              : booking.status === 'PENDING'
                              ? 'Ödəniş Gözlənilir'
                              : 'Ləğv Edildi'}
                          </Badge>

                          {isPartiallyPaid ? (
                            <Badge variant="warning" pill>
                              Qalıq: {formatPrice(remainingBalance)}
                            </Badge>
                          ) : booking.paymentStatus === 'PAID' ? (
                            <Badge variant="success" pill>
                              Ödənilib
                            </Badge>
                          ) : null}

                          {booking.paymentType === 'INSTALLMENT' && booking.installmentMonths && (
                            <Badge variant="neutral" pill>
                              {booking.installmentMonths} Ay Taksit
                            </Badge>
                          )}
                        </div>

                        <h3 className="web-booking-tour-title">
                          <Link to={`/tours/${booking.tourId}`}>
                            {tour?.title || booking.tourTitle || 'Tur'}
                          </Link>
                        </h3>

                        <div className="web-booking-meta-row">
                          <span className="web-meta-item">
                            <Calendar size={14} />
                            {tour?.startDate || booking.tourStartDate
                              ? new Date(tour?.startDate || booking.tourStartDate).toLocaleDateString('az-AZ', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Tarix Təyin Edilməyib'}
                          </span>
                          <span className="web-meta-item">
                            <MapPin size={14} />
                            {tour?.type === 'FOREIGN' ? 'Xarici Tur' : 'Daxili Tur'}
                          </span>
                          <span className="web-meta-item">
                            <Bus size={14} />
                            {booking.seats || booking.passengers?.length || 1} yer
                            {booking.busSeatNumber && ` (№${booking.busSeatNumber})`}
                          </span>
                        </div>

                        {isPartiallyPaid && remainingBalance > 0 && (
                          <div className="web-deposit-warning-box">
                            <AlertCircle size={15} className="web-deposit-alert-icon" />
                            <div className="web-deposit-warning-text">
                              <span>30% depozit ödənilib. Qalıq: <strong>{formatPrice(remainingBalance)}</strong></span>
                              {booking.depositDueDate && (
                                <span className="web-deposit-due-date">
                                  (Son tarix: {new Date(booking.depositDueDate).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short', year: 'numeric' })})
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="web-booking-card-actions">
                        <div className="web-booking-card-price">
                          <span className="web-price-label">Ümumi Məbləğ:</span>
                          <span className="web-price-val">{formatPrice(totalAmount)}</span>
                        </div>

                        <div className="web-action-buttons">
                          {/* Pay Remaining Balance Button */}
                          {isPartiallyPaid && remainingBalance > 0 && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate(`/pay/balance/${booking.id}${booking.balanceToken ? `?token=${booking.balanceToken}` : ''}`)}
                              className="web-btn-pay-balance"
                            >
                              <CreditCard size={15} />
                              <span>Qalıq Ödə</span>
                            </Button>
                          )}

                          {/* Voucher Button */}
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/booking/voucher/${booking.id}`)}
                            className="web-btn-voucher"
                          >
                            <Ticket size={16} />
                            <span>Bileti Aç / QR</span>
                          </Button>

                          {/* Write Review Button */}
                          {isCompletedOrConfirmed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReviewingBooking(booking)}
                              className="web-btn-review"
                              title="Təəssüratlarınızı bölüşün"
                            >
                              <MessageSquarePlus size={15} />
                              <span>Rəy Yaz</span>
                            </Button>
                          )}

                          {/* Dynamic Cancel Button */}
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

      {/* Dynamic Cancel Confirmation Modal */}
      {cancellingBooking && (() => {
        const { hours, refundPercent, estimatedRefund, penaltyAmount } = calculateCancellationDetails(cancellingBooking);
        return (
          <Modal
            isOpen={!!cancellingBooking}
            onClose={() => setCancellingBooking(null)}
            title="Rezervasiyanın Ləğv Qaydaları"
            size="md"
          >
            <div className="web-cancel-modal-content">
              <div className="web-cancel-modal-badge-row">
                <ShieldAlert size={36} className="web-cancel-modal-icon" />
              </div>

              <h4 className="web-cancel-modal-heading">
                №{cancellingBooking.id || cancellingBooking.bookingNumber} nömrəli bileti ləğv etmək istəyirsiniz?
              </h4>
              <p className="web-cancel-modal-tourname">
                {cancellingBooking.tour?.title || cancellingBooking.tourTitle}
              </p>

              {/* Dynamic Penalty Calculation Box */}
              <div className="web-cancellation-breakdown-box">
                <div className="web-breakdown-row">
                  <span className="web-bdown-label">
                    <Clock size={15} /> Tura qalan vaxt:
                  </span>
                  <span className="web-bdown-val">
                    <strong>{hours} saat</strong> ({Math.floor(hours / 24)} gün)
                  </span>
                </div>

                <div className="web-breakdown-row">
                  <span className="web-bdown-label">
                    <Info size={15} /> Geri qaytarılma faizi:
                  </span>
                  <span className={`web-bdown-percent ${refundPercent >= 70 ? 'good' : 'bad'}`}>
                    {refundPercent}%
                  </span>
                </div>

                <div className="web-breakdown-row">
                  <span className="web-bdown-label">Cərimə tutulması:</span>
                  <span className="web-bdown-penalty">
                    {100 - refundPercent}% ({penaltyAmount} AZN)
                  </span>
                </div>

                <div className="web-breakdown-row total-refund">
                  <span>Hesabınıza qaytarılacaq məbləğ:</span>
                  <strong className="web-bdown-refund-amount">{estimatedRefund} AZN</strong>
                </div>
              </div>

              <div className="web-cancel-terms-notice">
                <Info size={14} />
                <span>
                  Ləğv qaydaları: 72 saatdan çox qaldıqda 100% qaytarma, 24-72 saat arası 70%, 24 saatdan az qaldıqda 30% qaytarılır.
                </span>
              </div>

              <div className="web-cancel-reason-wrap">
                <label>Ləğvetmə səbəbiniz (məcburi deyil):</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Məsələn: Planlarım dəyişdi, səhhətimdə problem yarandı..."
                  rows={2}
                />
              </div>

              <div className="web-modal-footer-actions">
                <Button
                  variant="secondary"
                  onClick={() => setCancellingBooking(null)}
                >
                  İmtina Et
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirmCancel}
                  isLoading={isSubmittingCancel}
                >
                  Təsdiq Et və Ləğv Et
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Review Modal */}
      {reviewingBooking && (
        <Modal
          isOpen={!!reviewingBooking}
          onClose={() => setReviewingBooking(null)}
          title="Təcrübənizi Qiymətləndirin"
          size="md"
        >
          <form onSubmit={handleSubmitReview} className="web-review-modal-form">
            <div className="web-review-header">
              <Sparkles size={24} className="web-review-sparkle-icon" />
              <h4>{reviewingBooking.tour?.title || reviewingBooking.tourTitle}</h4>
              <p>Tur haqqında fikirləriniz digər səyahətçilər üçün olduqca dəyərlidir.</p>
            </div>

            {/* Interactive 5-Star Rating Selector */}
            <div className="web-star-rating-selector">
              <div className="web-stars-row">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = (hoverRating || rating) >= starVal;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      className={`web-star-btn ${isFilled ? 'filled' : ''}`}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starVal)}
                    >
                      <Star size={32} />
                    </button>
                  );
                })}
              </div>
              <span className="web-rating-label">
                {RATING_LABELS[hoverRating || rating]}
              </span>
            </div>

            <div className="web-review-comment-wrap">
              <label>Sizin rəyiniz və tövsiyələriniz:</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Bələdçi, nəqliyyat, otel və proqram haqqında təcrübənizi ətraflı qeyd edin..."
                rows={4}
                required
              />
            </div>

            <div className="web-modal-footer-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setReviewingBooking(null)}
              >
                Bağla
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isSubmittingReview}
              >
                Rəyi Dərc Et
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
