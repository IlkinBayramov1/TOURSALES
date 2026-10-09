import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  Coffee,
  ArrowRight,
  Clock,
  CreditCard,
  Building,
  Loader2,
  ChevronRight,
  MessageCircle
} from 'lucide-react';
import { hotelApi } from '../../api/hotelApi';
import { Hotel, RoomType } from '@toursales/types';
import './HotelDetailsPage.css';

// Helper to format ISO dates to YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getMealPlanLabel = (plan: string): string => {
  switch (plan) {
    case 'BB':
      return 'Səhər yeməyi daxildir (BB)';
    case 'HB':
      return 'Yarım pansion: Səhər və Axşam (HB)';
    case 'FB':
      return 'Tam pansion: 3 dəfə qidalanma (FB)';
    case 'ALL_INCLUSIVE':
      return 'Hər şey daxildir (All Inclusive)';
    case 'RO':
    default:
      return 'Yalnız otaq (Qidalanma daxil deyil)';
  }
};

export const HotelDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default dates: tomorrow to 3 days after
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const afterThreeDays = new Date();
  afterThreeDays.setDate(afterThreeDays.getDate() + 3);

  const [checkInDate, setCheckInDate] = useState<string>(formatDate(tomorrow));
  const [checkOutDate, setCheckOutDate] = useState<string>(formatDate(afterThreeDays));

  // Nights calculation
  const calculateNights = (inDate: string, outDate: string) => {
    const d1 = new Date(inDate);
    const d2 = new Date(outDate);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 1;
  };

  const nights = calculateNights(checkInDate, checkOutDate);

  const loadHotel = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await hotelApi.getHotelDetails(id, {
        checkInDate,
        checkOutDate,
      });
      setHotel(data);
    } catch (err: any) {
      console.error('Failed to load hotel details:', err);
      setError('Otel məlumatları yüklənərkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  }, [id, checkInDate, checkOutDate]);

  useEffect(() => {
    loadHotel();
  }, [loadHotel]);

  if (loading) {
    return (
      <div className="web-hotel-details-page" style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <Loader2 size={40} className="animate-spin" color="#2563eb" />
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="web-hotel-details-page">
        <div className="web-catalog-error-state">
          {error || 'Otel tapılmadı.'}
          <div style={{ marginTop: 16 }}>
            <Link to="/hotels" className="web-room-book-btn">
              Otellər Kataloquna Qayıt
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const galleryImages =
    hotel.images && hotel.images.length > 0
      ? hotel.images
      : [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
        ];

  return (
    <div className="web-hotel-details-page">
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#64748b', marginBottom: 16 }}>
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Ana Səhifə</Link>
        <ChevronRight size={14} />
        <Link to="/hotels" style={{ color: '#64748b', textDecoration: 'none' }}>Otellər</Link>
        <ChevronRight size={14} />
        <span style={{ color: '#0f172a', fontWeight: 600 }}>{hotel.name}</span>
      </div>

      {/* Header Info */}
      <div className="web-hotel-header-wrap">
        <div className="web-hotel-header-meta">
          <div style={{ display: 'flex', gap: 2 }}>
            {Array.from({ length: hotel.starRating || 5 }).map((_, i) => (
              <Star key={i} size={16} fill="#facc15" color="#facc15" />
            ))}
          </div>
          <span className="web-hotel-badge-category">{hotel.category}</span>
          {hotel.allowDeposit && (
            <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
              30% İlkin Ödənişlə
            </span>
          )}
          {hotel.allowInstallments && (
            <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
              Birkart / Tamkart Taksit
            </span>
          )}
        </div>

        <h1 className="web-hotel-details-title">{hotel.name}</h1>
        <div className="web-hotel-details-address">
          <MapPin size={16} color="#2563eb" />
          <span>{hotel.address || `${hotel.city}, ${hotel.region || 'Azərbaycan'}`}</span>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="web-hotel-gallery-grid">
        <div className="web-hotel-gallery-main">
          <img src={galleryImages[0]} alt={hotel.name} className="web-hotel-gallery-img" />
        </div>
        {galleryImages.slice(1, 5).map((img, idx) => (
          <div key={idx} className="web-hotel-gallery-item">
            <img src={img} alt={`${hotel.name} - ${idx + 1}`} className="web-hotel-gallery-img" />
          </div>
        ))}
      </div>

      {/* 2-Column Content Layout */}
      <div className="web-hotel-content-layout">
        {/* Left Column: Dates Bar & Room List */}
        <div>
          {/* Date Selector Box */}
          <div className="web-hotel-date-filter-box">
            <div className="web-hotel-dates-inputs">
              <div className="web-hotel-date-field">
                <label>Giriş Tarixi</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                />
              </div>

              <div className="web-hotel-date-field">
                <label>Çıxış Tarixi</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                />
              </div>
            </div>

            <div className="web-hotel-nights-badge">
              <Calendar size={14} style={{ display: 'inline', marginRight: 6 }} />
              {nights} Gecə Qonaqlama
            </div>
          </div>

          {/* Room Types List */}
          <div className="web-hotel-rooms-section">
            <h2 className="web-hotel-section-title">
              <Building size={22} color="#2563eb" />
              <span>Mövcud Otaq Seçimləri</span>
            </h2>

            {hotel.roomTypes && hotel.roomTypes.length > 0 ? (
              <div className="web-hotel-rooms-list">
                {hotel.roomTypes.map((room: RoomType) => {
                  const effectivePrice = (room as any).calculatedNightlyRate || room.basePrice;
                  const totalPrice = (room as any).calculatedTotalPrice || effectivePrice * nights;
                  const isSurged = effectivePrice > room.basePrice;
                  const isDiscounted = effectivePrice < room.basePrice;

                  const roomPhoto =
                    room.images && room.images.length > 0
                      ? room.images[0]
                      : galleryImages[1] || galleryImages[0];

                  return (
                    <div key={room.id} className="web-room-card">
                      <div className="web-room-photo-wrap">
                        <img src={roomPhoto} alt={room.name} className="web-room-photo" />
                      </div>

                      <div className="web-room-info">
                        <h3 className="web-room-title">{room.name}</h3>

                        <div className="web-room-meta-tags">
                          <span className="web-room-tag">
                            <Users size={13} />
                            {room.capacityAdults} Böyük {room.capacityChildren > 0 ? `+ ${room.capacityChildren} Uşaq` : ''}
                          </span>
                          <span className="web-room-tag">
                            {room.bedType} Yataq
                          </span>
                          <span className="web-room-tag web-room-tag-meal">
                            <Coffee size={13} />
                            {getMealPlanLabel(room.mealPlan)}
                          </span>
                        </div>

                        {room.description && (
                          <p className="web-room-desc">{room.description}</p>
                        )}

                        {room.amenities && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                            {room.amenities.slice(0, 4).map((am: string, i: number) => (
                              <span key={i} style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                • {am}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="web-room-pricing-actions">
                        {isSurged && (
                          <span className="web-room-yield-tag">Yüksək Tələbat</span>
                        )}
                        {isDiscounted && (
                          <span className="web-room-yield-tag" style={{ background: '#dcfce7', color: '#15803d' }}>
                            Son Dəqiqə Fürsəti
                          </span>
                        )}

                        <div className="web-room-price-total">
                          {totalPrice} ₼
                        </div>
                        <div className="web-room-price-nightly">
                          {effectivePrice} ₼ / gecə ({nights} gecə)
                        </div>

                        {hotel.allowDeposit && (
                          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                            İndi sadəcə {(totalPrice * 0.3).toFixed(1)} ₼ ödə
                          </span>
                        )}

                        <Link
                          to={`/hotels/checkout/${room.id}?checkIn=${checkInDate}&checkOut=${checkOutDate}&nights=${nights}`}
                          className="web-room-book-btn"
                        >
                          <span>Rezerv Et</span>
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="web-hotel-empty-state">
                <p className="web-hotel-empty-desc">Bu otel üçün hələ otaq təyin edilməyib.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Hotel Details & Policies */}
        <div className="web-hotel-sidebar-card">
          <div className="web-hotel-sidebar-box">
            <h3 className="web-hotel-sidebar-title">Otel Təminatları</h3>
            <div className="web-hotel-amenities-cloud">
              {hotel.amenities && hotel.amenities.map((am, i) => (
                <span key={i} className="web-hotel-amenity-pill">
                  {am}
                </span>
              ))}
            </div>
          </div>

          <div className="web-hotel-sidebar-box">
            <h3 className="web-hotel-sidebar-title">Gəliş və Çıxış Qaydaları</h3>
            <div className="web-hotel-policy-item">
              <span>Qeydiyyat (Check-in):</span>
              <strong>{hotel.checkInTime || '14:00'} - dan</strong>
            </div>
            <div className="web-hotel-policy-item">
              <span>Çıxış (Check-out):</span>
              <strong>{hotel.checkOutTime || '12:00'} - dək</strong>
            </div>
          </div>

          <div className="web-hotel-sidebar-box">
            <h3 className="web-hotel-sidebar-title">Ödəniş Üstünlükləri</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span>30% İlkin depozitlə bronlaşdırma</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span>Birkart və Tamkart ilə 12 ayadək faizsiz taksit</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span>Ani WhatsApp Vəçeri və QR bilet</span>
              </div>
            </div>
          </div>

          <div className="web-hotel-sidebar-box" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid #bae6fd' }}>
            <h3 className="web-hotel-sidebar-title" style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageCircle size={18} />
              <span>Otel Operatoru ilə Canlı Çat</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#0284c7', margin: '6px 0 14px' }}>
              Otaq şərtləri, transfer və ya xüsusi istəklərinizlə bağlı dərhal canlı operatora yazın.
            </p>
            <button
              type="button"
              className="web-room-book-btn"
              style={{ width: '100%', justifyContent: 'center', background: '#0284c7' }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-chat', {
                  detail: {
                    companyId: hotel.companyId,
                    contextType: 'HOTEL',
                    contextHotelId: hotel.id,
                  }
                }));
              }}
            >
              <MessageCircle size={16} />
              <span>Onlayn Çat Başlat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
