import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  Mail,
  User,
  Calendar,
  Users,
  Car,
  Building,
  MapPin,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowLeft,
  Edit3,
  Trash2,
  X,
  Send,
  Search,
  RotateCcw,
  DollarSign,
  Award,
  FileCheck
} from 'lucide-react';
import { vendorCustomTourApi } from '../../api/vendorCustomTourApi';
import { CustomTourBid, SubmitBidPayload } from '@toursales/types';
import { vendorSocketService, playNotificationSound } from '../../../../shared/services/vendorSocketService';
import './VendorMyBidsPage.css';

const DEFAULT_INCLUDED_SERVICES = [
  'Komfortlu nəqliyyat və peşəkar sürücü',
  'Bütün yanacaq və yol xərcləri',
  'Oteldə gecələmə və səhər yeməyi',
  'Peşəkar sertifikatlı bələdçi',
  'Milli park və muzeylərə giriş biletləri',
  'Səyahət sığortası',
  'Yol boyu limitsiz içməli su',
  'Hava limanından transfer'
];

export const VendorMyBidsPage: React.FC = () => {
  const [bids, setBids] = useState<CustomTourBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACCEPTED' | 'PENDING' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Bid Modal State
  const [editingBid, setEditingBid] = useState<CustomTourBid | null>(null);
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editVehicle, setEditVehicle] = useState('');
  const [editHotel, setEditHotel] = useState('');
  const [editItinerary, setEditItinerary] = useState('');
  const [editIncluded, setEditIncluded] = useState<string[]>([]);
  const [editExcluded, setEditExcluded] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editValidDays, setEditValidDays] = useState(3);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Withdraw Modal State
  const [withdrawingBid, setWithdrawingBid] = useState<CustomTourBid | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchMyBids = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vendorCustomTourApi.getMyBids();
      setBids(data);
    } catch (err: any) {
      console.error('Failed to load my bids:', err);
      setError('Təklifləriniz yüklənərkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBids();

    vendorSocketService.connect();
    const unsubBidAccepted = vendorSocketService.onTenderBidAccepted(() => {
      playNotificationSound();
      setNotification({
        type: 'success',
        text: 'Təbriklər! Sifarişçi sizin göndərdiyiniz təklifi qəbul etdi!'
      });
      fetchMyBids();
    });

    return () => {
      unsubBidAccepted();
    };
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVoucher(text);
    setTimeout(() => setCopiedVoucher(null), 2000);
  };

  // Filter & Search Bids
  const filteredBids = useMemo(() => {
    return bids.filter((bid) => {
      // 1. Tab filter
      const isAccepted = bid.status === 'ACCEPTED' || bid.request?.status === 'PAID_CONFIRMED' || bid.request?.status === 'ACCEPTED';
      if (activeTab === 'ACCEPTED' && !isAccepted) return false;
      if (activeTab === 'PENDING' && bid.status !== 'PENDING') return false;
      if (activeTab === 'REJECTED' && bid.status !== 'REJECTED') return false;

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const req = bid.request;
        const matchesBidNumber = bid.bidNumber.toLowerCase().includes(q);
        const matchesReqNumber = req?.requestNumber?.toLowerCase().includes(q);
        const matchesTitle = req?.title?.toLowerCase().includes(q);
        const matchesDest = req?.destinations?.some(d => d.toLowerCase().includes(q));
        const matchesCustomer = req?.user?.name?.toLowerCase().includes(q);
        if (!matchesBidNumber && !matchesReqNumber && !matchesTitle && !matchesDest && !matchesCustomer) {
          return false;
        }
      }

      return true;
    });
  }, [bids, activeTab, searchQuery]);

  // Statistics
  const acceptedBids = bids.filter(
    (b) => b.status === 'ACCEPTED' || b.request?.status === 'PAID_CONFIRMED' || b.request?.status === 'ACCEPTED'
  );
  const pendingBidsCount = bids.filter((b) => b.status === 'PENDING').length;
  const rejectedBidsCount = bids.filter((b) => b.status === 'REJECTED').length;
  const totalWonRevenue = acceptedBids.reduce((sum, b) => sum + (Number(b.offeredPrice) || 0), 0);

  // Open Edit Modal
  const openEditModal = (bid: CustomTourBid) => {
    setEditingBid(bid);
    setEditPrice(Number(bid.offeredPrice) || '');
    setEditVehicle(bid.vehicleDetails || '');
    setEditHotel(bid.hotelDetails || '');
    setEditItinerary(bid.itineraryProgram || '');
    setEditIncluded(Array.isArray(bid.includedServices) ? bid.includedServices : []);
    setEditExcluded(Array.isArray(bid.excludedServices) ? bid.excludedServices.join(', ') : '');
    setEditNotes(bid.vendorNotes || '');
    setEditValidDays(3);
    setEditError(null);
  };

  const handleToggleIncluded = (srv: string) => {
    if (editIncluded.includes(srv)) {
      setEditIncluded(editIncluded.filter(s => s !== srv));
    } else {
      setEditIncluded([...editIncluded, srv]);
    }
  };

  // Submit Edit Bid
  const handleUpdateBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBid) return;

    if (!editPrice || Number(editPrice) <= 0) {
      setEditError('Zəhmət olmasa təklif qiymətini daxil edin.');
      return;
    }

    try {
      setSubmittingEdit(true);
      setEditError(null);

      const payload: Partial<SubmitBidPayload> = {
        offeredPrice: Number(editPrice),
        vehicleDetails: editVehicle.trim() || undefined,
        hotelDetails: editHotel.trim() || undefined,
        itineraryProgram: editItinerary.trim(),
        includedServices: editIncluded,
        excludedServices: editExcluded.split(',').map(s => s.trim()).filter(Boolean),
        vendorNotes: editNotes.trim() || undefined,
        validDays: Number(editValidDays) || 3,
      };

      await vendorCustomTourApi.updateBid(editingBid.id, payload);

      setNotification({
        type: 'success',
        text: `#${editingBid.bidNumber} nömrəli təklifiniz uğurla yeniləndi!`
      });
      setTimeout(() => setNotification(null), 4000);

      setEditingBid(null);
      await fetchMyBids();
    } catch (err: any) {
      console.error('Update bid failed:', err);
      setEditError(err.response?.data?.message || 'Təklif yenilənərkən xəta baş verdi.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Withdraw Bid Action
  const handleConfirmWithdraw = async () => {
    if (!withdrawingBid) return;

    try {
      setIsWithdrawing(true);
      await vendorCustomTourApi.withdrawBid(withdrawingBid.id);

      setNotification({
        type: 'success',
        text: `#${withdrawingBid.bidNumber} nömrəli təklifiniz uğurla geri çəkildi.`
      });
      setTimeout(() => setNotification(null), 4000);

      setWithdrawingBid(null);
      await fetchMyBids();
    } catch (err: any) {
      console.error('Withdraw bid failed:', err);
      setNotification({
        type: 'error',
        text: err.response?.data?.message || 'Təklif geri çəkilərkən xəta baş verdi.'
      });
      setTimeout(() => setNotification(null), 4000);
      setWithdrawingBid(null);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="vendor-bids-page">
      {/* Header */}
      <div className="vendor-bids-header">
        <div>
          <Link to="/tenders" className="vendor-back-link">
            <ArrowLeft size={16} /> Tender Masasına Qayıt
          </Link>
          <h1>Təqdim Etdiyiniz Tender Təklifləri</h1>
          <p>
            Müştərilərin fərdi tur sorğularına göndərdiyiniz qiymət təklifləri, nəticələr və qazanılmış səfərlər
          </p>
        </div>

        <div className="vendor-bids-header-actions">
          <button onClick={fetchMyBids} className="vendor-btn-refresh-bids" title="Siyahını yenilə">
            <RotateCcw size={16} /> Yenilə
          </button>
          <Link to="/tenders" className="vendor-btn-new-bid">
            <Sparkles size={16} /> Yeni Tenderlərdə İştirak Et
          </Link>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="vendor-bids-kpi-strip">
        <div className="vendor-bids-kpi-item">
          <span className="vendor-bids-kpi-val">{bids.length}</span>
          <span className="vendor-bids-kpi-label">Cəmi Təkliflər</span>
        </div>
        <div className="vendor-bids-kpi-item won">
          <span className="vendor-bids-kpi-val text-emerald">{acceptedBids.length}</span>
          <span className="vendor-bids-kpi-label">Qazanılmış Qalib Turlar</span>
        </div>
        <div className="vendor-bids-kpi-item pending">
          <span className="vendor-bids-kpi-val text-amber">{pendingBidsCount}</span>
          <span className="vendor-bids-kpi-label">Baxışda Olan Təkliflər</span>
        </div>
        <div className="vendor-bids-kpi-item revenue">
          <span className="vendor-bids-kpi-val text-purple">{totalWonRevenue.toLocaleString()} ₼</span>
          <span className="vendor-bids-kpi-label">Qazanılan Ümumi Dövriyyə</span>
        </div>
      </div>

      {/* Global Toast / Notification */}
      {notification && (
        <div className={`vendor-bids-toast ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)}><X size={14} /></button>
        </div>
      )}

      {/* Filter Tabs and Search Toolbar */}
      <div className="vendor-bids-toolbar">
        <div className="vendor-bids-tabs">
          <button
            className={`vendor-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            Bütün Təkliflər ({bids.length})
          </button>
          <button
            className={`vendor-tab-btn tab-accepted ${activeTab === 'ACCEPTED' ? 'active' : ''}`}
            onClick={() => setActiveTab('ACCEPTED')}
          >
            Qazanılmış ({acceptedBids.length})
          </button>
          <button
            className={`vendor-tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDING')}
          >
            Gözləmədə ({pendingBidsCount})
          </button>
          <button
            className={`vendor-tab-btn ${activeTab === 'REJECTED' ? 'active' : ''}`}
            onClick={() => setActiveTab('REJECTED')}
          >
            Seçilməyən ({rejectedBidsCount})
          </button>
        </div>

        <div className="vendor-bids-search-box">
          <Search size={16} className="vendor-search-icon" />
          <input
            type="text"
            placeholder="Təklif №, sorğu №, istiqamət..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="vendor-clear-search" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Error & Loading */}
      {error && (
        <div className="vendor-bids-alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={fetchMyBids}>Yenidən yüklə</button>
        </div>
      )}

      {loading ? (
        <div className="vendor-bids-loading-state">
          <Loader2 size={36} className="animate-spin" color="#2563eb" />
          <p>Təklifləriniz yüklənir...</p>
        </div>
      ) : filteredBids.length === 0 ? (
        <div className="vendor-bids-empty-state">
          <Briefcase size={48} color="#94a3b8" />
          <h3>Bu bölmədə heç bir təklif tapılmadı</h3>
          <p>Açıq tenderləri nəzərdən keçirin və ilk qiymət təklifinizi təqdim edin.</p>
          <Link to="/tenders" className="vendor-empty-action-btn">
            Tender Masasına Keç
          </Link>
        </div>
      ) : (
        <div className="vendor-bids-list">
          {filteredBids.map((bid) => {
            const req = bid.request;
            const isAccepted = bid.status === 'ACCEPTED' || req?.status === 'PAID_CONFIRMED' || req?.status === 'ACCEPTED';
            const isRejected = bid.status === 'REJECTED';
            const isPending = bid.status === 'PENDING';
            const booking = req?.booking;

            // Generate WhatsApp Link
            const clientPhone = req?.user?.phoneNumber?.replace(/[^0-9]/g, '') || '';
            const waMessage = encodeURIComponent(
              `Salam ${req?.user?.name || 'Müştəri'}! TOURSALES platformasında #${req?.requestNumber} nömrəli "${req?.title}" fərdi tur sorğunuz üzrə təklifimizi qəbul etdiyiniz üçün təşəkkür edirik. Səfərin təfərrüatlarını dəqiqləşdirmək üçün sizinlə əlaqə saxlayırıq.`
            );
            const waUrl = clientPhone ? `https://wa.me/${clientPhone}?text=${waMessage}` : null;

            return (
              <div key={bid.id} className={`vendor-bid-card ${isAccepted ? 'is-winner' : isRejected ? 'is-rejected' : ''}`}>
                {/* Top bar */}
                <div className="vendor-bid-card-header">
                  <div className="vendor-bid-ref-info">
                    <span className="vendor-bid-number">{bid.bidNumber}</span>
                    <span className="vendor-bid-date">
                      {new Date(bid.createdAt).toLocaleDateString('az-AZ', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="vendor-bid-header-right">
                    {/* Action buttons for Pending bids */}
                    {isPending && (
                      <div className="vendor-bid-action-buttons">
                        <button
                          type="button"
                          className="vendor-btn-action-edit"
                          onClick={() => openEditModal(bid)}
                          title="Təklifi Redaktə Et"
                        >
                          <Edit3 size={13} />
                          <span>Redaktə et</span>
                        </button>
                        <button
                          type="button"
                          className="vendor-btn-action-withdraw"
                          onClick={() => setWithdrawingBid(bid)}
                          title="Təklifi Geri Çək"
                        >
                          <Trash2 size={13} />
                          <span>Geri çək</span>
                        </button>
                      </div>
                    )}

                    <div className="vendor-bid-status-pill">
                      {isAccepted ? (
                        <span className="status-badge-won">
                          <CheckCircle2 size={14} /> Qalib Təklif / Qəbul Edildi
                        </span>
                      ) : isRejected ? (
                        <span className="status-badge-lost">
                          <XCircle size={14} /> Başqa Agentlik Seçildi
                        </span>
                      ) : (
                        <span className="status-badge-pending">
                          <Clock size={14} /> Müştəri Baxışında
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* WINNER CUSTOMER REVEAL BANNER (Only if ACCEPTED) */}
                {isAccepted && (
                  <div className="vendor-winner-reveal-banner">
                    <div className="vendor-winner-banner-title">
                      <Award size={22} color="#16a34a" />
                      <div>
                        <h4>Təbriklər! Müştəri sizin agentliyin təklifini seçdi.</h4>
                        <p>Rezervasiya qeydiyyata alınıb və sistem üzərindən təsdiq edilib. Müştəri ilə dərhal əlaqə yarada bilərsiniz.</p>
                      </div>
                    </div>

                    <div className="vendor-winner-grid-meta">
                      {/* Voucher Box */}
                      {booking?.voucherCode && (
                        <div className="vendor-voucher-box">
                          <span className="vendor-voucher-label">Rəsmi Elektron Vauçer Kodu:</span>
                          <div className="vendor-voucher-copy-row">
                            <strong className="vendor-voucher-code">{booking.voucherCode}</strong>
                            <button
                              type="button"
                              className="vendor-btn-copy-code"
                              onClick={() => copyToClipboard(booking.voucherCode)}
                              title="Kodu kopyala"
                            >
                              {copiedVoucher === booking.voucherCode ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                            </button>
                          </div>
                          <span className="vendor-voucher-hint">
                            Ödəniş: {booking.paidAmount} AZN ödənilib ({booking.paymentType === 'DEPOSIT_30' ? '30% İlkin Depozit' : '100% Tam Ödəniş'})
                          </span>
                        </div>
                      )}

                      {/* Customer Contact Details */}
                      {req?.user && (
                        <div className="vendor-customer-contact-box">
                          <span className="vendor-customer-box-label">Sifarişçinin Birbaşa Əlaqə Məlumatları:</span>
                          <div className="vendor-customer-name">
                            <User size={15} /> <strong>{req.user.name || 'Fərdi Səyahətçi'}</strong>
                          </div>
                          {req.user.phoneNumber && (
                            <div className="vendor-customer-phone-row">
                              <Phone size={14} />
                              <a href={`tel:${req.user.phoneNumber}`}>{req.user.phoneNumber}</a>
                              {waUrl && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="vendor-btn-wa"
                                  title="WhatsApp ilə əlaqə saxla"
                                >
                                  <MessageSquare size={13} /> WhatsApp
                                </a>
                              )}
                            </div>
                          )}
                          {req.user.email && (
                            <div className="vendor-customer-email-row">
                              <Mail size={14} />
                              <a href={`mailto:${req.user.email}`}>{req.user.email}</a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Main Card Body */}
                <div className="vendor-bid-main-body">
                  {/* Left: Request Recap */}
                  {req && (
                    <div className="vendor-bid-request-col">
                      <div className="vendor-bid-req-badge">
                        Sorğu: <strong>{req.requestNumber}</strong>
                      </div>
                      <h3 className="vendor-bid-req-title">{req.title}</h3>

                      <div className="vendor-bid-req-route">
                        {req.destinations.map((d, i) => (
                          <span key={i} className="vendor-bid-req-stop">
                            <MapPin size={12} /> {d}
                          </span>
                        ))}
                      </div>

                      <div className="vendor-bid-req-stats">
                        <div className="vendor-bid-mini-stat">
                          <Calendar size={14} />
                          <span>{new Date(req.startDate).toLocaleDateString('az-AZ')} ({req.durationDays} gün)</span>
                        </div>
                        <div className="vendor-bid-mini-stat">
                          <Users size={14} />
                          <span>{req.totalPassengers} Sərnişin ({req.adultsCount}B / {req.childrenCount}U)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Right: Offered Bid Breakdown */}
                  <div className="vendor-bid-offered-col">
                    <div className="vendor-bid-price-header">
                      <div>
                        <span className="vendor-offered-label">Təklif Etdiyiniz Ümumi Qiymət:</span>
                        <div className="vendor-offered-amount">
                          {Number(bid.offeredPrice).toLocaleString()} AZN
                        </div>
                      </div>
                      <div className="vendor-offered-pax">
                        <span>~{Math.round(Number(bid.pricePerPerson) || (Number(bid.offeredPrice) / (req?.totalPassengers || 1)))} AZN / nəfər</span>
                        <span className="vendor-bid-validity">
                          <Clock size={12} /> {new Date(bid.validUntil).toLocaleDateString('az-AZ')} tarixinədək keçərlidir
                        </span>
                      </div>
                    </div>

                    {/* Specs Provided by Vendor */}
                    <div className="vendor-offered-details-box">
                      {bid.vehicleDetails && (
                        <div className="vendor-offered-detail-row">
                          <Car size={14} />
                          <div>
                            <strong>Nəqliyyat:</strong> {bid.vehicleDetails}
                          </div>
                        </div>
                      )}

                      {bid.hotelDetails && (
                        <div className="vendor-offered-detail-row">
                          <Building size={14} />
                          <div>
                            <strong>Qonaqlama:</strong> {bid.hotelDetails}
                          </div>
                        </div>
                      )}

                      <div className="vendor-offered-program-row">
                        <strong>Təklif olunan marşrut proqramı:</strong>
                        <p>{bid.itineraryProgram}</p>
                      </div>

                      {bid.includedServices && bid.includedServices.length > 0 && (
                        <div className="vendor-offered-services-row">
                          <strong>Qiymətə daxildir:</strong>
                          <div className="vendor-offered-services-tags">
                            {bid.includedServices.map((s, idx) => (
                              <span key={idx} className="vendor-service-tag">
                                <CheckCircle2 size={12} color="#16a34a" /> {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {bid.vendorNotes && (
                        <div className="vendor-offered-notes-row">
                          <strong>Agentlik qeydi / Bonus:</strong>
                          <span>"{bid.vendorNotes}"</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT BID MODAL */}
      {editingBid && (
        <div className="vendor-modal-backdrop" onClick={() => !submittingEdit && setEditingBid(null)}>
          <div className="vendor-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="vendor-modal-header">
              <div>
                <div className="vendor-modal-sub">{editingBid.bidNumber} üzrə Redaktə</div>
                <h2>Tender Təklifini Yeniləyin</h2>
              </div>
              <button
                className="vendor-modal-close-btn"
                onClick={() => !submittingEdit && setEditingBid(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateBidSubmit} className="vendor-modal-form">
              {editError && (
                <div className="vendor-modal-alert-error">
                  <AlertCircle size={16} />
                  <span>{editError}</span>
                </div>
              )}

              {/* Price Row */}
              <div className="vendor-form-section">
                <label className="vendor-form-label">Təklif Qiyməti (Ümumi AZN) *</label>
                <div className="vendor-price-input-wrap">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value ? Number(e.target.value) : '')}
                    className="vendor-price-input"
                  />
                  <span className="vendor-currency-addon">AZN</span>
                </div>
              </div>

              {/* Vehicle & Hotel */}
              <div className="vendor-form-row-2col">
                <div className="vendor-form-col">
                  <label className="vendor-form-label">Nəqliyyat Detalları</label>
                  <input
                    type="text"
                    value={editVehicle}
                    onChange={(e) => setEditVehicle(e.target.value)}
                  />
                </div>
                <div className="vendor-form-col">
                  <label className="vendor-form-label">Qonaqlama (Otel)</label>
                  <input
                    type="text"
                    value={editHotel}
                    onChange={(e) => setEditHotel(e.target.value)}
                  />
                </div>
              </div>

              {/* Itinerary */}
              <div className="vendor-form-section">
                <label className="vendor-form-label">Marşrut və Ekskursiya Proqramı *</label>
                <textarea
                  rows={4}
                  required
                  value={editItinerary}
                  onChange={(e) => setEditItinerary(e.target.value)}
                />
              </div>

              {/* Included Services */}
              <div className="vendor-form-section">
                <label className="vendor-form-label">Qiymətə Daxil Olan Xidmətlər</label>
                <div className="vendor-services-checklist">
                  {DEFAULT_INCLUDED_SERVICES.map((srv, idx) => {
                    const isChecked = editIncluded.includes(srv);
                    return (
                      <button
                        type="button"
                        key={idx}
                        className={`vendor-service-check-pill ${isChecked ? 'checked' : ''}`}
                        onClick={() => handleToggleIncluded(srv)}
                      >
                        {isChecked ? <CheckCircle2 size={14} color="#10b981" /> : <div className="vendor-check-circle-empty" />}
                        <span>{srv}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Excluded & Validity */}
              <div className="vendor-form-row-2col">
                <div className="vendor-form-col">
                  <label className="vendor-form-label">Daxil Olmayan Xidmətlər</label>
                  <input
                    type="text"
                    value={editExcluded}
                    onChange={(e) => setEditExcluded(e.target.value)}
                  />
                </div>
                <div className="vendor-form-col">
                  <label className="vendor-form-label">Etibarlılıq Müddəti (gün)</label>
                  <select
                    value={editValidDays}
                    onChange={(e) => setEditValidDays(Number(e.target.value))}
                  >
                    <option value={2}>2 Gün</option>
                    <option value={3}>3 Gün</option>
                    <option value={5}>5 Gün</option>
                    <option value={7}>7 Gün</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="vendor-form-section">
                <label className="vendor-form-label">Əlavə Qeyd və ya Şirkət Bonusu</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              {/* Modal Actions */}
              <div className="vendor-modal-actions">
                <button
                  type="button"
                  className="vendor-btn-cancel-modal"
                  disabled={submittingEdit}
                  onClick={() => setEditingBid(null)}
                >
                  Bağla
                </button>
                <button
                  type="submit"
                  className="vendor-btn-submit-modal"
                  disabled={submittingEdit}
                >
                  {submittingEdit ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Yenilənir...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Yenilənmiş Təklifi Saxla</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WITHDRAW CONFIRMATION MODAL */}
      {withdrawingBid && (
        <div className="vendor-modal-backdrop" onClick={() => !isWithdrawing && setWithdrawingBid(null)}>
          <div className="vendor-modal-container withdraw-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vendor-modal-header">
              <div>
                <div className="vendor-modal-sub text-rose">{withdrawingBid.bidNumber} üzrə İmtina</div>
                <h2>Təklifi Geri Çəkmək İstəyirsiniz?</h2>
              </div>
              <button
                className="vendor-modal-close-btn"
                onClick={() => !isWithdrawing && setWithdrawingBid(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="vendor-withdraw-modal-body">
              <div className="vendor-withdraw-warning-box">
                <AlertCircle size={24} color="#e11d48" />
                <div>
                  <h4>Bu əməliyyat geri qaytarılmır!</h4>
                  <p>
                    Təklifiniz geri çəkildikdə tender siyahısından tamamilə silinəcək və müştəri bu təklifi artıq görə bilməyəcək.
                  </p>
                </div>
              </div>

              <div className="vendor-withdraw-bid-details">
                <div>Sorğu: <strong>{withdrawingBid.request?.title || withdrawingBid.requestId}</strong></div>
                <div>Təklif Edilmiş Məbləğ: <strong>{withdrawingBid.offeredPrice} AZN</strong></div>
              </div>
            </div>

            <div className="vendor-modal-actions">
              <button
                type="button"
                className="vendor-btn-cancel-modal"
                disabled={isWithdrawing}
                onClick={() => setWithdrawingBid(null)}
              >
                Vazkeç
              </button>
              <button
                type="button"
                className="vendor-btn-danger-confirm"
                disabled={isWithdrawing}
                onClick={handleConfirmWithdraw}
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Silinir...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Bəli, Təklifi Geri Çək</span>
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
