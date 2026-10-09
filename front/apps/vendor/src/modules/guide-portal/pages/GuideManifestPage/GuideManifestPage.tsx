import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Bus,
  Phone,
  MessageCircle,
  Camera,
  Search,
  CheckCircle2,
  Clock,
  LayoutGrid,
  ListFilter,
  RefreshCw,
  UserCheck,
  AlertTriangle,
  FileSpreadsheet,
  CheckCheck
} from 'lucide-react';
import { guideApi } from '../../guideApi';
import { GuideManifestResponse, GuidePassenger, GuideSeatItem } from '@toursales/types';
import { CameraQrScannerModal } from '../../components/CameraQrScannerModal/CameraQrScannerModal';
import { OfflineSyncBanner } from '../../components/OfflineSyncBanner/OfflineSyncBanner';
import './GuideManifestPage.css';

const formatAzDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
      'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, saat ${hours}:${mins}`;
  } catch {
    return dateStr;
  }
};

export const GuideManifestPage: React.FC = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const [manifest, setManifest] = useState<GuideManifestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'SEATS' | 'LIST'>('LIST');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CHECKED' | 'PENDING' | 'DEBT'>('ALL');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isBulkCheckingIn, setIsBulkCheckingIn] = useState(false);
  const [, setSelectedSeatPassenger] = useState<GuidePassenger | null>(null);

  const fetchManifest = async () => {
    if (!tourId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await guideApi.getGuideManifest(tourId);
      setManifest(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Manifest yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManifest();
  }, [tourId]);

  // Toggle single passenger check-in
  const handleToggle = async (bookingId: string, seatNumber?: number) => {
    try {
      const res = await guideApi.toggleGuideCheckIn(bookingId, seatNumber);
      if (manifest) {
        // Optimistic UI update
        const updatedPassengers = manifest.passengers.map((p) => {
          if (p.bookingId === bookingId && (seatNumber === undefined || p.seatNumber === seatNumber)) {
            return { ...p, isCheckedIn: res.isCheckedIn };
          }
          return p;
        });

        const updatedSeatMap = manifest.seatMap.map((s) => {
          if (s.passenger && s.passenger.bookingId === bookingId && (seatNumber === undefined || s.seatNumber === seatNumber)) {
            return {
              ...s,
              status: (res.isCheckedIn ? 'CHECKED_IN' : 'RESERVED') as any,
              passenger: { ...s.passenger, isCheckedIn: res.isCheckedIn }
            };
          }
          return s;
        });

        const checkedInCount = updatedPassengers.filter((p) => p.isCheckedIn).length;
        const total = updatedPassengers.length;

        setManifest({
          ...manifest,
          passengers: updatedPassengers,
          seatMap: updatedSeatMap,
          stats: {
            ...manifest.stats,
            checkedInCount,
            pendingCount: Math.max(0, total - checkedInCount),
            progressPercentage: total > 0 ? Math.round((checkedInCount / total) * 100) : 0
          }
        });
      }
    } catch (err: any) {
      alert('Minik statusu dəyişdirilərkən xəta: ' + (err?.response?.data?.message || err.message || ''));
    }
  };

  // Bulk check-in handler
  const handleBulkCheckIn = async () => {
    if (!manifest || !tourId) return;
    const pendingTotal = manifest.stats.pendingCount;
    if (pendingTotal === 0) {
      alert('Bütün sərnişinlər artıq mindirilib!');
      return;
    }

    const confirmed = window.confirm(
      `Diqqət: Gözləyən ${pendingTotal} sərnişinin hamısını mindirilmiş kimi qeyd etmək istəyirsiniz?`
    );
    if (!confirmed) return;

    try {
      setIsBulkCheckingIn(true);
      await guideApi.bulkCheckIn(tourId);

      // Optimistically update all passengers to checked in
      const updatedPassengers = manifest.passengers.map((p) => ({ ...p, isCheckedIn: true }));
      const updatedSeatMap = manifest.seatMap.map((s) => ({
        ...s,
        status: (s.passenger ? 'CHECKED_IN' : s.status) as any,
        passenger: s.passenger ? { ...s.passenger, isCheckedIn: true } : s.passenger
      }));

      const total = updatedPassengers.length;
      setManifest({
        ...manifest,
        passengers: updatedPassengers,
        seatMap: updatedSeatMap,
        stats: {
          ...manifest.stats,
          checkedInCount: total,
          pendingCount: 0,
          progressPercentage: 100
        }
      });
      alert('✅ Bütün sərnişinlər uğurla mindirildi!');
    } catch (err: any) {
      alert('Kütləvi minik zamanı xəta: ' + (err?.response?.data?.message || err.message || ''));
    } finally {
      setIsBulkCheckingIn(false);
    }
  };

  // Excel export handler
  const handleExportExcel = async () => {
    if (!tourId || !manifest) return;
    try {
      setIsExportingExcel(true);
      const filename = `${manifest.tour.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}_manifest.xlsx`;
      await guideApi.exportGuideManifestExcel(tourId, filename);
    } catch (err: any) {
      alert('Excel sənədi endirilərkən xəta: ' + (err?.response?.data?.message || err.message || ''));
    } finally {
      setIsExportingExcel(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
        <RefreshCw size={32} className="spin" style={{ margin: '0 auto 1rem auto' }} />
        <p>Sərnişin manifesti hazırlanır...</p>
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div className="manifest-container">
        <Link to="/guide" className="manifest-back-link">
          <ArrowLeft size={16} />
          <span>Turlara Qayıt</span>
        </Link>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1.25rem', borderRadius: '0.75rem', marginTop: '1rem' }}>
          <h3>Xəta Baş Verdi</h3>
          <p>{error || 'Manifest tapılmadı'}</p>
        </div>
      </div>
    );
  }

  const { tour, stats, seatMap, passengers } = manifest;

  // Filter passengers for list view
  const filteredPassengers = passengers.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.seatNumber.toString().includes(q) ||
      p.phone.includes(q) ||
      (p.finCode && p.finCode.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (filterStatus === 'CHECKED') return p.isCheckedIn;
    if (filterStatus === 'PENDING') return !p.isCheckedIn;
    if (filterStatus === 'DEBT') return !!p.hasRemainingDebt && (p.remainingBalance ?? 0) > 0;
    return true;
  });

  const getWhatsAppLink = (p: GuidePassenger) => {
    const cleanPhone = p.phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('994') ? cleanPhone : '994' + cleanPhone.replace(/^0/, '');
    let msg = `Salam hörmətli ${p.fullName}. Sizi "${tour.title}" turunun toplanış nöqtəsində (${tour.meetingPointAddress}) gözləyirik. `;
    if (p.hasRemainingDebt && (p.remainingBalance ?? 0) > 0) {
      msg += `Xatırladırıq ki, qalan ödənişiniz ${p.remainingBalance} AZN təşkil edir. `;
    }
    msg += `Zəhmət olmasa yaxınlaşın. Bələdçiniz: ${tour.guide?.name || ''}`;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`;
  };

  // Group seats into 2+2 rows for realistic bus view
  const totalCapacity = stats.totalCapacity || 20;
  const rowCount = Math.ceil(totalCapacity / 4);
  const busRows: { left: (GuideSeatItem | null)[]; right: (GuideSeatItem | null)[] }[] = [];

  for (let r = 0; r < rowCount; r++) {
    const s1Num = r * 4 + 1;
    const s2Num = r * 4 + 2;
    const s3Num = r * 4 + 3;
    const s4Num = r * 4 + 4;

    const s1 = seatMap.find((s) => s.seatNumber === s1Num) || null;
    const s2 = seatMap.find((s) => s.seatNumber === s2Num) || null;
    const s3 = seatMap.find((s) => s.seatNumber === s3Num) || null;
    const s4 = seatMap.find((s) => s.seatNumber === s4Num) || null;

    busRows.push({
      left: [s1, s2],
      right: [s3, s4]
    });
  }

  const guidePhone = tour.guide?.phoneNumber || (tour.guide as any)?.phone;

  return (
    <div className="manifest-container">
      {/* Top Nav & Action Toolbar */}
      <div className="manifest-nav-bar">
        <Link to="/guide" className="manifest-back-link">
          <ArrowLeft size={16} />
          <span>Bütün Turlar</span>
        </Link>

        <div className="manifest-nav-actions">
          <button
            className="manifest-action-btn bulk-btn"
            onClick={handleBulkCheckIn}
            disabled={isBulkCheckingIn || stats.pendingCount === 0}
            title="Bütün gözləyən sərnişinləri bir kliklə mindir"
          >
            {isBulkCheckingIn ? <RefreshCw size={14} className="spin" /> : <CheckCheck size={15} />}
            <span>Hamısını Mindir</span>
          </button>

          <button
            className="manifest-action-btn excel-btn"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            title="Sərnişin siyahısını Excel formatında endir"
          >
            {isExportingExcel ? <RefreshCw size={14} className="spin" /> : <FileSpreadsheet size={15} />}
            <span>Excel Manifest</span>
          </button>

          <button
            className="manifest-action-btn refresh-btn"
            onClick={fetchManifest}
            title="Manifesti yenilə"
          >
            <RefreshCw size={14} />
            <span>Yenilə</span>
          </button>
        </div>
      </div>

      <OfflineSyncBanner tourId={tour.id} onSyncCompleted={fetchManifest} />

      {/* Tour Header Card */}
      <div className="manifest-header-card">
        <div className="manifest-header-top">
          <h1 className="manifest-tour-title">{tour.title}</h1>
          {tour.guide && (
            <div className="manifest-guide-chip">
              <UserCheck size={14} color="#059669" />
              <span>Bələdçi: <strong>{tour.guide.name}</strong></span>
              {guidePhone && (
                <a href={`tel:${guidePhone}`} className="guide-phone-link" title="Bələdçiyə zəng et">
                  <Phone size={12} />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="manifest-tour-meta-row">
          <div className="manifest-meta-item">
            <Calendar size={16} color="#0284c7" />
            <span>{formatAzDate(tour.startDate)}</span>
          </div>
          <div className="manifest-meta-item">
            <MapPin size={16} color="#ef4444" />
            <span>{tour.meetingPointAddress}</span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tour.meetingPointAddress)}`}
              target="_blank"
              rel="noreferrer"
              className="manifest-map-link"
            >
              (Xəritədə Aç)
            </a>
          </div>
          {tour.busPlateNumber && (
            <div className="manifest-meta-item">
              <Bus size={16} color="#8b5cf6" />
              <span>Avtobus: <strong>{tour.busPlateNumber}</strong> {tour.driverName ? `(${tour.driverName})` : ''}</span>
              {tour.driverPhone && (
                <a href={`tel:${tour.driverPhone}`} className="guide-phone-link" title="Sürücüyə zəng et">
                  <Phone size={12} />
                </a>
              )}
            </div>
          )}
        </div>

        {tour.departureNotes && (
          <div className="manifest-departure-notes">
            <strong>Bələdçi üçün Qeyd:</strong> {tour.departureNotes}
          </div>
        )}

        {/* 5-KPI Stats Grid */}
        <div className="manifest-stats-grid-5">
          <div className="manifest-stat-card checked">
            <div className="manifest-stat-num">{stats.checkedInCount}</div>
            <div className="manifest-stat-label">Mindirildi</div>
          </div>
          <div className="manifest-stat-card pending">
            <div className="manifest-stat-num">{stats.pendingCount}</div>
            <div className="manifest-stat-label">Gözlənilir</div>
          </div>
          <div className="manifest-stat-card total">
            <div className="manifest-stat-num">{stats.totalBookedSeats}</div>
            <div className="manifest-stat-label">Cəmi Sərnişin ({stats.progressPercentage}%)</div>
          </div>
          <div
            className={`manifest-stat-card debt ${stats.debtorCount && stats.debtorCount > 0 ? 'has-debt' : ''}`}
            onClick={() => {
              if (stats.debtorCount && stats.debtorCount > 0) {
                setActiveTab('LIST');
                setFilterStatus('DEBT');
              }
            }}
            title="Borclu sərnişinləri süzgəcdən keçir"
          >
            <div className="manifest-stat-num">{stats.totalDebtAmount ?? 0} ₼</div>
            <div className="manifest-stat-label">
              Qalıq Borc ({stats.debtorCount ?? 0} nəfər)
            </div>
          </div>
          <div className="manifest-stat-card revenue">
            <div className="manifest-stat-num">{stats.totalRevenue ?? 0} ₼</div>
            <div className="manifest-stat-label">Toplam Dəyər</div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="manifest-tab-bar">
        <button
          className={`manifest-tab-btn ${activeTab === 'LIST' ? 'active' : ''}`}
          onClick={() => setActiveTab('LIST')}
        >
          <ListFilter size={18} />
          <span>Sərnişin Siyahısı ({passengers.length})</span>
        </button>
        <button
          className={`manifest-tab-btn ${activeTab === 'SEATS' ? 'active' : ''}`}
          onClick={() => setActiveTab('SEATS')}
        >
          <LayoutGrid size={18} />
          <span>Avtobus Sxemi (2+2 Dəhlizli Sxem)</span>
        </button>
      </div>

      {activeTab === 'SEATS' ? (
        <div className="bus-layout-card">
          {/* Cockpit & Legend Area */}
          <div className="bus-cockpit-header">
            <div className="bus-driver-bay">
              <div className="bus-cockpit-icon">🚌</div>
              <div>
                <div className="bus-driver-title">Sürücü Kabinəsi</div>
                <div className="bus-driver-sub">
                  {tour.driverName || 'Sürücü qeyd edilməyib'}
                  {tour.busPlateNumber ? ` • ${tour.busPlateNumber}` : ''}
                </div>
              </div>
            </div>

            <div className="bus-door-bay">
              <span className="bus-door-label">🚪 Ön Giriş Qapısı</span>
            </div>
          </div>

          {/* Seat Status Legend */}
          <div className="bus-legend-row">
            <span className="legend-item">
              <span className="legend-dot checked" /> Mindirildi
            </span>
            <span className="legend-item">
              <span className="legend-dot pending" /> Gözlənilir
            </span>
            <span className="legend-item">
              <span className="legend-dot debt" /> Qalıq Borclu
            </span>
            <span className="legend-item">
              <span className="legend-dot empty" /> Boş Yer
            </span>
          </div>

          {/* Realistic 2+2 Bus Grid with Central Aisle */}
          <div className="bus-body-container">
            <div className="bus-rows-wrapper">
              {busRows.map((row, rIdx) => (
                <div key={rIdx} className="bus-aisle-row">
                  {/* Left Pair */}
                  <div className="bus-seat-pair">
                    {row.left.map((seat, sIdx) => {
                      if (!seat) return <div key={sIdx} className="bus-seat-slot empty-slot" />;
                      const isChecked = seat.status === 'CHECKED_IN';
                      const isReserved = seat.status === 'RESERVED';
                      const passenger = seat.passenger;
                      const hasDebt = passenger && passenger.hasRemainingDebt && (passenger.remainingBalance ?? 0) > 0;

                      return (
                        <button
                          key={seat.seatNumber}
                          className={`bus-seat-unit ${
                            isChecked ? 'checked-in' : isReserved ? 'reserved' : 'empty'
                          } ${hasDebt ? 'debtor-seat' : ''}`}
                          onClick={() => {
                            if (passenger) {
                              setSelectedSeatPassenger(passenger);
                              handleToggle(passenger.bookingId, seat.seatNumber);
                            }
                          }}
                          title={
                            passenger
                              ? `${passenger.fullName} (#${seat.seatNumber})\nStatus: ${
                                  isChecked ? 'Mindirildi' : 'Gözləyir'
                                }${hasDebt ? `\n⚠️ Borc: ${passenger.remainingBalance} AZN` : '\nÖdənilib'}`
                              : `Yer #${seat.seatNumber} (Boş)`
                          }
                        >
                          <div className="seat-badge-top">#{seat.seatNumber}</div>
                          {hasDebt && <div className="seat-debt-dot" title="Qalıq borcu var">!</div>}
                          {passenger ? (
                            <div className="seat-passenger-abbr">{passenger.fullName.split(' ')[0]}</div>
                          ) : (
                            <div className="seat-empty-text">Boş</div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Central Aisle / Dəhliz */}
                  <div className="bus-center-aisle">
                    <span className="aisle-row-marker">{rIdx + 1}</span>
                  </div>

                  {/* Right Pair */}
                  <div className="bus-seat-pair">
                    {row.right.map((seat, sIdx) => {
                      if (!seat) return <div key={sIdx} className="bus-seat-slot empty-slot" />;
                      const isChecked = seat.status === 'CHECKED_IN';
                      const isReserved = seat.status === 'RESERVED';
                      const passenger = seat.passenger;
                      const hasDebt = passenger && passenger.hasRemainingDebt && (passenger.remainingBalance ?? 0) > 0;

                      return (
                        <button
                          key={seat.seatNumber}
                          className={`bus-seat-unit ${
                            isChecked ? 'checked-in' : isReserved ? 'reserved' : 'empty'
                          } ${hasDebt ? 'debtor-seat' : ''}`}
                          onClick={() => {
                            if (passenger) {
                              setSelectedSeatPassenger(passenger);
                              handleToggle(passenger.bookingId, seat.seatNumber);
                            }
                          }}
                          title={
                            passenger
                              ? `${passenger.fullName} (#${seat.seatNumber})\nStatus: ${
                                  isChecked ? 'Mindirildi' : 'Gözləyir'
                                }${hasDebt ? `\n⚠️ Borc: ${passenger.remainingBalance} AZN` : '\nÖdənilib'}`
                              : `Yer #${seat.seatNumber} (Boş)`
                          }
                        >
                          <div className="seat-badge-top">#{seat.seatNumber}</div>
                          {hasDebt && <div className="seat-debt-dot" title="Qalıq borcu var">!</div>}
                          {passenger ? (
                            <div className="seat-passenger-abbr">{passenger.fullName.split(' ')[0]}</div>
                          ) : (
                            <div className="seat-empty-text">Boş</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Rear of bus */}
            <div className="bus-rear-banner">
              <span>💺 Avtobusun Arxa Hissəsi / Baqaj Bölməsi</span>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Passenger Filter & Search Bar */}
          <div className="passenger-filter-bar">
            <div className="passenger-search-wrapper">
              <Search size={16} color="#94a3b8" className="search-icon-pos" />
              <input
                type="text"
                className="passenger-search-input"
                placeholder="Ad, soyad, oturacaq nömrəsi, telefon və ya FİN kod..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="passenger-filter-buttons">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`filter-pill-btn ${filterStatus === 'ALL' ? 'active-all' : ''}`}
              >
                Hamısı ({passengers.length})
              </button>
              <button
                onClick={() => setFilterStatus('CHECKED')}
                className={`filter-pill-btn ${filterStatus === 'CHECKED' ? 'active-checked' : ''}`}
              >
                Mindirildi ({stats.checkedInCount})
              </button>
              <button
                onClick={() => setFilterStatus('PENDING')}
                className={`filter-pill-btn ${filterStatus === 'PENDING' ? 'active-pending' : ''}`}
              >
                Gözlənilir ({stats.pendingCount})
              </button>
              <button
                onClick={() => setFilterStatus('DEBT')}
                className={`filter-pill-btn ${filterStatus === 'DEBT' ? 'active-debt' : ''}`}
              >
                Borclu ({stats.debtorCount ?? 0})
              </button>
            </div>
          </div>

          {/* Passenger Cards List */}
          {filteredPassengers.length === 0 ? (
            <div className="passenger-empty-state">
              Uyğun sərnişin tapılmadı
            </div>
          ) : (
            filteredPassengers.map((p) => {
              const hasDebt = p.hasRemainingDebt && (p.remainingBalance ?? 0) > 0;

              return (
                <div
                  key={`${p.bookingId}-${p.seatNumber}`}
                  className={`passenger-card ${p.isCheckedIn ? 'checked-in' : 'pending'} ${
                    hasDebt ? 'has-debt-card' : ''
                  }`}
                >
                  <div className="passenger-info">
                    <div className={`passenger-seat-badge ${p.isCheckedIn ? 'checked' : ''}`}>
                      #{p.seatNumber}
                    </div>

                    <div className="passenger-details-col">
                      <div className="passenger-name-row">
                        <span className="passenger-name-text">{p.fullName}</span>

                        {/* Financial Debt / Payment Badges */}
                        {hasDebt ? (
                          <span className="passenger-debt-badge warning">
                            <AlertTriangle size={12} />
                            <span>Qalıq Borc: {p.remainingBalance} ₼</span>
                          </span>
                        ) : (
                          <span className="passenger-debt-badge paid">
                            <CheckCircle2 size={12} />
                            <span>Ödənilib ({p.paidAmount ?? p.totalAmount} ₼)</span>
                          </span>
                        )}
                      </div>

                      <div className="passenger-meta-sub">
                        <span>{p.phone}</span>
                        {p.finCode && <span>• FİN: {p.finCode}</span>}
                        {p.totalAmount !== undefined && (
                          <span>
                            • Ödəniş: {p.paidAmount ?? 0} / {p.totalAmount} ₼
                          </span>
                        )}
                      </div>

                      {p.specialNotes && (
                        <div className="passenger-notes-badge">
                          <strong>Qeyd:</strong> {p.specialNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="passenger-actions">
                    <a
                      href={getWhatsAppLink(p)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-icon-round wa"
                      title={hasDebt ? 'WhatsApp-la borc və toplanış bildirişi göndər' : 'WhatsApp-la toplanış yeri göndər'}
                    >
                      <MessageCircle size={18} />
                    </a>

                    <a
                      href={`tel:${p.phone}`}
                      className="btn-icon-round tel"
                      title="Zəng et"
                    >
                      <Phone size={18} />
                    </a>

                    <button
                      className={`btn-toggle-checkin ${p.isCheckedIn ? 'checked' : 'pending'}`}
                      onClick={() => handleToggle(p.bookingId, p.seatNumber)}
                    >
                      {p.isCheckedIn ? (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Mindirildi</span>
                        </>
                      ) : (
                        <>
                          <Clock size={16} />
                          <span>Gözləyir</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Floating Action Button for Camera QR Scanner */}
      <button
        className="floating-qr-scan-btn"
        onClick={() => setIsScannerOpen(true)}
      >
        <Camera size={22} />
        <span>Kamera ilə Skan</span>
      </button>

      {/* Camera QR Scanner Modal */}
      <CameraQrScannerModal
        tourId={tour.id}
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={() => {
          fetchManifest();
        }}
      />
    </div>
  );
};
