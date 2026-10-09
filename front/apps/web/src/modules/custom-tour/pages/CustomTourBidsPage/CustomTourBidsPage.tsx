import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Car,
  Hotel,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Star,
  MessageCircle,
  CreditCard,
  QrCode,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
  Check,
  AlertTriangle
} from 'lucide-react';
import { customTourApi } from '../../api/customTourApi';
import { CustomTourRequest, CustomTourBid, CustomTourBooking } from '@toursales/types';
import './CustomTourBidsPage.css';

export const CustomTourBidsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<CustomTourRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // Itinerary modal
  const [selectedItineraryBid, setSelectedItineraryBid] = useState<CustomTourBid | null>(null);

  // Checkout modal
  const [checkoutBid, setCheckoutBid] = useState<CustomTourBid | null>(null);
  const [paymentType, setPaymentType] = useState<'FULL' | 'DEPOSIT_30' | 'INSTALLMENT'>('DEPOSIT_30');
  const [installmentMonths, setInstallmentMonths] = useState(3);
  const [paying, setPaying] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<CustomTourBooking | null>(null);

  const fetchRequest = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await customTourApi.getRequestDetails(id);
      setRequest(data);
    } catch (err) {
      console.error('Failed to load custom tour request:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleOpenChat = (companyId?: string) => {
    if (!companyId) return;
    window.dispatchEvent(
      new CustomEvent('open-chat', {
        detail: {
          companyId,
          contextType: 'TOUR',
        },
      })
    );
  };

  const handleAcceptAndPay = async () => {
    if (!request || !checkoutBid || paying) return;

    setPaying(true);
    try {
      // 1. Accept bid first if not already accepted
      if (request.acceptedBidId !== checkoutBid.id) {
        await customTourApi.acceptBid(request.id, checkoutBid.id);
      }

      // 2. Checkout booking
      const booking = await customTourApi.checkoutBooking(request.id, checkoutBid.id, {
        paymentType,
        installmentMonths: paymentType === 'INSTALLMENT' ? installmentMonths : undefined,
      });

      setConfirmedBooking(booking);
      fetchRequest();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Ödəniş zamanı xəta baş verdi.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="custom-bids-page" style={{ textAlign: 'center', padding: '100px 0' }}>
        <Loader2 size={40} className="animate-spin" color="#2563eb" />
        <p style={{ marginTop: 14, color: '#64748b' }}>Fərdi tur məlumatları və təkliflər yüklənir...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="custom-bids-page" style={{ textAlign: 'center', padding: '80px 0' }}>
        <h2>Sorğu tapılmadı</h2>
        <Link to="/custom-tour" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
          Yeni Fərdi Tur Quraşdır
        </Link>
      </div>
    );
  }

  const isConfirmed = request.status === 'PAID_CONFIRMED';
  const bids = request.bids || [];

  return (
    <div className="custom-bids-page">
      {/* Top Request Specification Card */}
      <div className="custom-bids-header-card">
        <div className="custom-bids-top-row">
          <div>
            <span className="custom-bids-req-num">Sorğu №: {request.requestNumber}</span>
            <h1 className="custom-bids-title">{request.title}</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <span
                style={{
                  background: isConfirmed ? '#ecfdf5' : '#eff6ff',
                  color: isConfirmed ? '#059669' : '#2563eb',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  padding: '3px 10px',
                  borderRadius: 6,
                }}
              >
                {request.status === 'OPEN_FOR_BIDS'
                  ? 'Tender Açıqdır'
                  : request.status === 'BIDS_REVIEW'
                  ? 'Təkliflər Nəzərdən Keçirilir'
                  : request.status === 'ACCEPTED'
                  ? 'Təklif Seçildi (Ödəniş Gözlənilir)'
                  : isConfirmed
                  ? 'Sifariş Təsdiqləndi (Ödənildi)'
                  : request.status}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Yaradıldı: {new Date(request.createdAt).toLocaleDateString('az-AZ')}
              </span>
            </div>
          </div>

          {!isConfirmed && (
            <div className="custom-countdown-badge">
              <Clock size={16} />
              <span>Tender aktivdir • 48 saatlıq rəqabət</span>
            </div>
          )}
        </div>

        {/* Specs Chips Grid */}
        <div className="custom-specs-grid">
          <div className="custom-spec-item">
            <div className="custom-spec-icon">
              <MapPin size={18} />
            </div>
            <div>
              <div className="custom-spec-label">İstiqamət</div>
              <div className="custom-spec-val">{request.destinations.join(' & ')}</div>
            </div>
          </div>

          <div className="custom-spec-item">
            <div className="custom-spec-icon">
              <Calendar size={18} />
            </div>
            <div>
              <div className="custom-spec-label">Tarixlər & Müddət</div>
              <div className="custom-spec-val">
                {request.durationDays} gün ({new Date(request.startDate).toLocaleDateString('az-AZ')})
              </div>
            </div>
          </div>

          <div className="custom-spec-item">
            <div className="custom-spec-icon">
              <Users size={18} />
            </div>
            <div>
              <div className="custom-spec-label">Sərnişin Heyəti</div>
              <div className="custom-spec-val">{request.totalPassengers} nəfər</div>
            </div>
          </div>

          <div className="custom-spec-item">
            <div className="custom-spec-icon">
              <Car size={18} />
            </div>
            <div>
              <div className="custom-spec-label">Nəqliyyat Növü</div>
              <div className="custom-spec-val">{request.vehicleType.replace(/_/g, ' ')}</div>
            </div>
          </div>

          <div className="custom-spec-item">
            <div className="custom-spec-icon">
              <Hotel size={18} />
            </div>
            <div>
              <div className="custom-spec-label">Qonaqlama</div>
              <div className="custom-spec-val">{request.hotelPreference.replace(/_/g, ' ')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmed Booking Banner */}
      {isConfirmed && (
        <div
          style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: '2px solid #6ee7b7',
            borderRadius: 16,
            padding: 24,
            marginBottom: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#065f46', fontWeight: 800, fontSize: '1.2rem' }}>
              <CheckCircle2 size={24} color="#059669" />
              <span>Fərdi Tur Rezervasiyanız Rəsmiləşdirildi!</span>
            </div>
            <p style={{ margin: '6px 0 0', color: '#047857', fontSize: '0.9rem' }}>
              QR Vauçeriniz hazırlandı və WhatsApp vasitəsilə sizə və partnyor şirkətə göndərildi.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: '#065f46' }}>Vauçer Kodu:</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: '#065f46' }}>
              {request.booking?.voucherCode || 'VOUCHER-CONFIRMED'}
            </div>
          </div>
        </div>
      )}

      {/* Bids Section */}
      <div>
        <div className="custom-bids-section-title">
          <span>Daxil Olmuş Qiymət və Proqram Təklifləri</span>
          <span className="custom-bids-count-pill">{bids.length} Təklif</span>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
          Təsdiqlənmiş tərəfdaş turizm şirkətləri tərəfindən göndərilmiş fərdi təkliflər. Ən uyğununu seçərək dərhal
          30% depozitlə təsdiqləyə bilərsiniz.
        </p>

        {bids.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              padding: '60px 20px',
              textAlign: 'center',
              marginTop: 20,
            }}
          >
            <Clock size={40} color="#94a3b8" style={{ marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px', color: '#0f172a' }}>Tender aktivdir, təkliflər toplanır</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 460, margin: '0 auto' }}>
              Sorğunuz lisenziyalı turizm agentliklərinə göndərildi. İlk təkliflər daxil olduqda sizə WhatsApp və
              SMS bildirişi gələcəkdir.
            </p>
          </div>
        ) : (
          <div className="custom-bids-grid">
            {bids.map(bid => {
              const isAccepted = request.acceptedBidId === bid.id;
              const isRejected = bid.status === 'REJECTED';

              return (
                <div
                  key={bid.id}
                  className={`custom-bid-card ${isAccepted ? 'accepted' : isRejected ? 'rejected' : ''}`}
                >
                  <div>
                    {/* Company info */}
                    <div className="custom-bid-company-row">
                      <div className="custom-bid-company-avatar">
                        {bid.company?.name ? bid.company.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="custom-bid-company-name">
                          <span>{bid.company?.name}</span>
                          <ShieldCheck size={16} color="#059669" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#f59e0b' }}>
                          <Star size={13} fill="#f59e0b" />
                          <span>{(bid.company?.rating || 4.9).toFixed(1)} / 5.0 Reytinq</span>
                        </div>
                      </div>
                    </div>

                    {/* Price box */}
                    <div className="custom-bid-price-box">
                      <div>
                        <div className="custom-bid-price-amount">{bid.offeredPrice} ₼</div>
                        <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                          İlkin 30% Depozit: {(bid.offeredPrice * 0.3).toFixed(1)} ₼
                        </div>
                      </div>
                      <div className="custom-bid-price-pax">
                        <div>Adambaşı</div>
                        <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>
                          {bid.pricePerPerson ? `${bid.pricePerPerson.toFixed(1)} ₼` : ''}
                        </strong>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="custom-bid-features">
                      {bid.vehicleDetails && (
                        <div className="custom-bid-feature-item">
                          <Car size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>{bid.vehicleDetails}</span>
                        </div>
                      )}
                      {bid.hotelDetails && (
                        <div className="custom-bid-feature-item">
                          <Hotel size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>{bid.hotelDetails}</span>
                        </div>
                      )}
                    </div>

                    {/* Included services */}
                    <div className="custom-bid-included-wrap">
                      {bid.includedServices &&
                        bid.includedServices.slice(0, 4).map((inc, i) => (
                          <span key={i} className="custom-bid-included-pill">
                            ✓ {inc}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="custom-bid-actions">
                    <button
                      type="button"
                      className="custom-bid-btn-chat"
                      title="Proqrama Ətraflı Bax"
                      onClick={() => setSelectedItineraryBid(bid)}
                    >
                      Proqram
                    </button>

                    <button
                      type="button"
                      className="custom-bid-btn-chat"
                      title="Agentliklə Çatda Danış"
                      onClick={() => handleOpenChat(bid.companyId)}
                    >
                      <MessageCircle size={16} />
                    </button>

                    {!isConfirmed && (
                      <button
                        type="button"
                        className="custom-bid-btn-accept"
                        onClick={() => setCheckoutBid(bid)}
                      >
                        <span>{isAccepted ? 'Ödəniş Et' : 'Təklifi Seç'}</span>
                        <ArrowRight size={16} />
                      </button>
                    )}

                    {isConfirmed && isAccepted && (
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          color: '#059669',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                        }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Seçilmiş Qalib Təklif</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Itinerary Modal */}
      {selectedItineraryBid && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setSelectedItineraryBid(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 28,
              width: 540,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>
                {selectedItineraryBid.company?.name} — Fərdi Proqram
              </h3>
              <button
                type="button"
                onClick={() => setSelectedItineraryBid(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>
                GÜNBƏGÜN SƏYAHƏT PROQRAMI:
              </div>
              <div style={{ lineHeight: 1.6, color: '#1e293b', whiteSpace: 'pre-line', fontSize: '0.9rem' }}>
                {selectedItineraryBid.itineraryProgram}
              </div>
            </div>

            {selectedItineraryBid.vendorNotes && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                  Agentlik Menecerinin Qeydləri:
                </div>
                <div style={{ fontSize: '0.88rem', color: '#475569' }}>
                  {selectedItineraryBid.vendorNotes}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="custom-btn-back"
                onClick={() => setSelectedItineraryBid(null)}
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Booking Modal */}
      {checkoutBid && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => setCheckoutBid(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 18,
              padding: 28,
              width: 500,
              maxWidth: '92vw',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem' }}>Təklifi Qəbul Et və Təsdiqlə</h3>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {checkoutBid.company?.name} • Ümumi Qiymət: {checkoutBid.offeredPrice} ₼
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutBid(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Payment Type Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: 12,
                  border: `2px solid ${paymentType === 'DEPOSIT_30' ? '#2563eb' : '#e2e8f0'}`,
                  background: paymentType === 'DEPOSIT_30' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="paymentType"
                  checked={paymentType === 'DEPOSIT_30'}
                  onChange={() => setPaymentType('DEPOSIT_30')}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    30% İlkin Depozit ({(checkoutBid.offeredPrice * 0.3).toFixed(1)} ₼)
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Qalan 70% ({(checkoutBid.offeredPrice * 0.7).toFixed(1)} ₼) səfərə 5 gün qalmışadək ödənilir
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: 12,
                  border: `2px solid ${paymentType === 'FULL' ? '#2563eb' : '#e2e8f0'}`,
                  background: paymentType === 'FULL' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="paymentType"
                  checked={paymentType === 'FULL'}
                  onChange={() => setPaymentType('FULL')}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>100% Tam Nağdsız Ödəniş</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Bütün məbləğ dərhal ödənilir ({checkoutBid.offeredPrice} ₼)
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: 12,
                  border: `2px solid ${paymentType === 'INSTALLMENT' ? '#2563eb' : '#e2e8f0'}`,
                  background: paymentType === 'INSTALLMENT' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="paymentType"
                  checked={paymentType === 'INSTALLMENT'}
                  onChange={() => setPaymentType('INSTALLMENT')}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Birkart / Tamkart Taksitlə</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    12 ayadək faizsiz bərabər hissələrə böl
                  </div>
                </div>
              </label>
            </div>

            {paymentType === 'INSTALLMENT' && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[3, 6, 12].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setInstallmentMonths(m)}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: `1px solid ${installmentMonths === m ? '#2563eb' : '#cbd5e1'}`,
                      background: installmentMonths === m ? '#eff6ff' : '#fff',
                      fontWeight: 700,
                      color: installmentMonths === m ? '#2563eb' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    {m} Ay ({(checkoutBid.offeredPrice / m).toFixed(1)} ₼/ay)
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="custom-btn-back"
                onClick={() => setCheckoutBid(null)}
              >
                Ləğv et
              </button>
              <button
                type="button"
                disabled={paying}
                onClick={handleAcceptAndPay}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#16a34a',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {paying ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <CreditCard size={16} />
                    <span>
                      {paymentType === 'DEPOSIT_30'
                        ? `${(checkoutBid.offeredPrice * 0.3).toFixed(1)} ₼ Ödə və Təsdiqlə`
                        : `${checkoutBid.offeredPrice} ₼ Ödə və Təsdiqlə`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
