import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Calendar,
  MapPin,
  Users,
  Bus,
  ArrowRight,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  Phone,
  ExternalLink,
  Settings,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { guideApi } from '../../guideApi';
import { GuideTourItem, GuideStaffItem, AssignGuidePayload } from '@toursales/types';
import './GuideToursPage.css';

// Helper for clean Azerbaijani date formatting (No M04 / M10 bugs)
export const formatAzDate = (dateStr?: string | Date): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';

  const monthsAz = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
    'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
  ];

  const day = d.getDate();
  const month = monthsAz[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

export const GuideToursPage: React.FC = () => {
  const [tours, setTours] = useState<GuideTourItem[]>([]);
  const [staff, setStaff] = useState<GuideStaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'UPCOMING' | 'UNASSIGNED' | 'COMPLETED'>('ALL');

  // Modal State for Assigning Guide & Operational Details
  const [selectedTourForAssign, setSelectedTourForAssign] = useState<GuideTourItem | null>(null);
  const [assignGuideId, setAssignGuideId] = useState('');
  const [assignDriverName, setAssignDriverName] = useState('');
  const [assignDriverPhone, setAssignDriverPhone] = useState('');
  const [assignBusPlate, setAssignBusPlate] = useState('');
  const [assignMeetingPoint, setAssignMeetingPoint] = useState('');
  const [assignDepartureNotes, setAssignDepartureNotes] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  const fetchToursAndStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const [toursData, staffData] = await Promise.all([
        guideApi.getGuideTours(),
        guideApi.getCompanyGuides().catch(() => []),
      ]);
      setTours(toursData);
      setStaff(staffData);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Turlar yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToursAndStaff();
  }, []);

  // Open modal with current tour values
  const handleOpenAssignModal = (tour: GuideTourItem) => {
    setSelectedTourForAssign(tour);
    setAssignGuideId(tour.guideId || tour.guide?.id || '');
    setAssignDriverName(tour.driverName || '');
    setAssignDriverPhone(tour.driverPhone || '');
    setAssignBusPlate(tour.busPlateNumber || '');
    setAssignMeetingPoint(tour.meetingPointAddress || '');
    setAssignDepartureNotes(tour.departureNotes || '');
    setAssignSuccess(false);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTourForAssign) return;

    try {
      setAssignSaving(true);
      const payload: AssignGuidePayload = {
        guideId: assignGuideId || null,
        driverName: assignDriverName.trim(),
        driverPhone: assignDriverPhone.trim(),
        busPlateNumber: assignBusPlate.trim(),
        meetingPointAddress: assignMeetingPoint.trim(),
        departureNotes: assignDepartureNotes.trim(),
      };

      await guideApi.assignGuideToTour(selectedTourForAssign.id, payload);
      setAssignSuccess(true);
      setTimeout(() => {
        setSelectedTourForAssign(null);
        fetchToursAndStaff();
      }, 900);
    } catch (err: any) {
      alert('Təyinat zamanı xəta: ' + (err?.response?.data?.message || err.message));
    } finally {
      setAssignSaving(false);
    }
  };

  // Filtered tours
  const filteredTours = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tours.filter((t) => {
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.meetingPointAddress.toLowerCase().includes(q) ||
        (t.busPlateNumber && t.busPlateNumber.toLowerCase().includes(q)) ||
        (t.guide?.name && t.guide.name.toLowerCase().includes(q)) ||
        (t.driverName && t.driverName.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterTab === 'UNASSIGNED') {
        return !t.guideId && !t.guide;
      }
      if (filterTab === 'COMPLETED') {
        return t.progressPercent === 100 && t.totalBookedSeats > 0;
      }
      if (filterTab === 'UPCOMING') {
        return new Date(t.startDate).getTime() >= Date.now();
      }

      return true;
    });
  }, [tours, searchQuery, filterTab]);

  // Overall statistics
  const totalToursCount = tours.length;
  const totalBookedCount = tours.reduce((sum, t) => sum + (t.totalBookedSeats || 0), 0);
  const totalCheckedInCount = tours.reduce((sum, t) => sum + (t.checkedInCount || 0), 0);
  const unassignedCount = tours.filter((t) => !t.guideId && !t.guide).length;
  const overallCheckInPercent = totalBookedCount > 0 ? Math.round((totalCheckedInCount / totalBookedCount) * 100) : 0;

  return (
    <div className="guide-tours-container">
      {/* Page Header */}
      <div className="guide-tours-header">
        <div>
          <div className="guide-portal-badge">
            <Compass size={14} /> Bələdçi və Minik Portalı
          </div>
          <h1 className="guide-tours-title">Bələdçi İdarəetmə Portalı</h1>
          <p className="guide-tours-subtitle">
            Sizə təhkim olunmuş turlar üzrə sərnişin manifestləri, minik qeydiyyatı və bələdçi təyinatı
          </p>
        </div>

        <button className="guide-refresh-btn" onClick={fetchToursAndStaff} title="Yenilə">
          <RefreshCw size={15} /> Yenilə
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="guide-kpi-grid">
        <div className="guide-kpi-card">
          <div className="guide-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Compass size={20} />
          </div>
          <div>
            <span className="guide-kpi-value">{totalToursCount}</span>
            <span className="guide-kpi-label">Aktiv Turlar</span>
          </div>
        </div>

        <div className="guide-kpi-card">
          <div className="guide-kpi-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <Users size={20} />
          </div>
          <div>
            <span className="guide-kpi-value">{totalBookedCount}</span>
            <span className="guide-kpi-label">Cəmi Sərnişin</span>
          </div>
        </div>

        <div className="guide-kpi-card">
          <div className="guide-kpi-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="guide-kpi-value">{totalCheckedInCount} ({overallCheckInPercent}%)</span>
            <span className="guide-kpi-label">Minik Tamamlanıb</span>
          </div>
        </div>

        <div className="guide-kpi-card">
          <div className="guide-kpi-icon" style={{ background: unassignedCount > 0 ? '#fff7ed' : '#f8fafc', color: unassignedCount > 0 ? '#ea580c' : '#64748b' }}>
            <UserX size={20} />
          </div>
          <div>
            <span className="guide-kpi-value" style={{ color: unassignedCount > 0 ? '#ea580c' : '#0f172a' }}>
              {unassignedCount}
            </span>
            <span className="guide-kpi-label">Bələdçisiz Qalan</span>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Filter Tabs */}
      <div className="guide-controls-bar">
        <div className="guide-search-box">
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Tur adı, bələdçi, sürücü və ya toplanış yeri..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="guide-filter-tabs">
          <button
            className={`guide-tab-pill ${filterTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterTab('ALL')}
          >
            Hamısı ({tours.length})
          </button>
          <button
            className={`guide-tab-pill ${filterTab === 'UPCOMING' ? 'active' : ''}`}
            onClick={() => setFilterTab('UPCOMING')}
          >
            Yaxınlaşan
          </button>
          <button
            className={`guide-tab-pill ${filterTab === 'UNASSIGNED' ? 'active' : ''}`}
            onClick={() => setFilterTab('UNASSIGNED')}
          >
            Bələdçisiz ({unassignedCount})
          </button>
          <button
            className={`guide-tab-pill ${filterTab === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilterTab('COMPLETED')}
          >
            Mindirildi
          </button>
        </div>
      </div>

      {/* Content State */}
      {loading ? (
        <div className="guide-state-box">
          <RefreshCw size={28} className="spin" color="#0284c7" />
          <p>Turlar və sərnişin manifestləri yüklənir...</p>
        </div>
      ) : error ? (
        <div className="guide-error-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={fetchToursAndStaff}>Yenidən Cəhd Et</button>
        </div>
      ) : filteredTours.length === 0 ? (
        <div className="guide-empty-box">
          <Compass size={44} color="#94a3b8" />
          <h3>Uyğun Tur Tapılmadı</h3>
          <p>Axtarış meyarlarınıza və ya seçilmiş filtrə uyğun tur mövcud deyil.</p>
        </div>
      ) : (
        <div className="guide-tour-grid">
          {filteredTours.map((t) => {
            const hasGuide = Boolean(t.guide?.name || t.guideId);
            const isCompleted = t.progressPercent === 100 && t.totalBookedSeats > 0;
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              t.meetingPointAddress || 'Baku'
            )}`;

            return (
              <div key={t.id} className="guide-tour-card">
                <div>
                  {/* Card Header */}
                  <div className="guide-tour-card-header">
                    <div>
                      <h2 className="guide-tour-title">{t.title}</h2>
                      <span className="guide-tour-type-badge" style={{
                        background: t.type === 'DOMESTIC' ? '#ecfdf5' : '#eff6ff',
                        color: t.type === 'DOMESTIC' ? '#047857' : '#1d4ed8'
                      }}>
                        {t.type === 'DOMESTIC' ? 'Daxili Tur' : 'Xarici Tur'}
                      </span>
                    </div>

                    <button
                      className="guide-btn-gear"
                      onClick={() => handleOpenAssignModal(t)}
                      title="Bələdçi və Nəqliyyat Tənzimləməsi"
                    >
                      <Settings size={15} />
                    </button>
                  </div>

                  {/* Meta items */}
                  <div className="guide-tour-meta">
                    <div className="guide-tour-meta-item">
                      <Calendar size={15} color="#0284c7" />
                      <span>{formatAzDate(t.startDate)}</span>
                    </div>

                    <div className="guide-tour-meta-item">
                      <MapPin size={15} color="#ef4444" />
                      <span className="meeting-point-text">{t.meetingPointAddress}</span>
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="guide-map-link"
                        title="Google Maps-də aç"
                      >
                        <ExternalLink size={12} /> Xəritə
                      </a>
                    </div>

                    {/* Assigned Guide Row */}
                    <div className="guide-tour-meta-item guide-row">
                      {hasGuide ? (
                        <div className="guide-assigned-chip">
                          <UserCheck size={14} color="#059669" />
                          <span>Bələdçi: <strong>{t.guide?.name}</strong></span>
                          {t.guide?.phoneNumber && (
                            <a href={`tel:${t.guide.phoneNumber}`} className="guide-call-icon" title="Bələdçiyə zəng et">
                              <Phone size={11} />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div
                          className="guide-unassigned-chip"
                          onClick={() => handleOpenAssignModal(t)}
                          role="button"
                          tabIndex={0}
                        >
                          <UserX size={14} color="#ea580c" />
                          <span>Bələdçi təyin edilməyib</span>
                          <span className="chip-action-btn">+ Təyin Et</span>
                        </div>
                      )}
                    </div>

                    {/* Bus & Driver Row */}
                    <div className="guide-tour-meta-item">
                      <Bus size={15} color="#8b5cf6" />
                      <span>
                        Avtobus: <strong>{t.busPlateNumber || '99-XX-000'}</strong>{' '}
                        {t.driverName && `(${t.driverName})`}
                      </span>
                      {t.driverPhone && (
                        <a href={`tel:${t.driverPhone}`} className="guide-call-icon" title="Sürücüyə zəng et">
                          <Phone size={11} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Check-In Progress Box */}
                  <div className="guide-progress-box">
                    <div className="guide-progress-label">
                      <span className="progress-title">
                        <Users size={14} />
                        <span>Minik Qeydiyyatı</span>
                      </span>
                      <span className="progress-counts">
                        <strong>{t.checkedInCount}</strong> / {t.totalBookedSeats} sərnişin ({t.progressPercent}%)
                      </span>
                    </div>

                    <div className="guide-progress-bar-track">
                      <div
                        className="guide-progress-bar-fill"
                        style={{
                          width: `${t.progressPercent}%`,
                          background: isCompleted ? '#10b981' : 'linear-gradient(90deg, #0284c7, #10b981)'
                        }}
                      />
                    </div>

                    {isCompleted && (
                      <div className="guide-all-checked-notice">
                        <CheckCircle2 size={12} /> Bütün sərnişinlər uğurla mindirildi
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="guide-card-actions">
                  <Link to={`/guide/manifest/${t.id}`} className="guide-action-btn">
                    <span>Sərnişin Manifestini Aç</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ASSIGN GUIDE & OPERATIONAL DETAILS MODAL */}
      {selectedTourForAssign && (
        <div className="guide-modal-backdrop" onClick={() => setSelectedTourForAssign(null)}>
          <div className="guide-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="guide-modal-header">
              <div>
                <span className="modal-sub-label">Tur Əməliyyat Tənzimləməsi</span>
                <h2>{selectedTourForAssign.title}</h2>
              </div>
              <button
                className="guide-modal-close"
                onClick={() => setSelectedTourForAssign(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="guide-modal-form">
              {assignSuccess && (
                <div className="guide-alert-success">
                  <CheckCircle2 size={16} />
                  <span>Bələdçi və nəqliyyat məlumatları uğurla yadda saxlanıldı!</span>
                </div>
              )}

              {/* Guide Selection Dropdown */}
              <div className="guide-form-group">
                <label>Bələdçi Təyini</label>
                <select
                  value={assignGuideId}
                  onChange={(e) => setAssignGuideId(e.target.value)}
                  className="guide-form-select"
                >
                  <option value="">— Bələdçi Təyin Edilməyib —</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.agencyRole || s.role}) {s.phoneNumber ? `— ${s.phoneNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver & Bus Plate Row */}
              <div className="guide-form-row-2col">
                <div className="guide-form-group">
                  <label>Sürücünün Adı</label>
                  <input
                    type="text"
                    placeholder="Məs: Əhməd Kərimov"
                    value={assignDriverName}
                    onChange={(e) => setAssignDriverName(e.target.value)}
                  />
                </div>

                <div className="guide-form-group">
                  <label>Sürücünün Telefonu</label>
                  <input
                    type="text"
                    placeholder="+994 50 123 45 67"
                    value={assignDriverPhone}
                    onChange={(e) => setAssignDriverPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Bus Plate & Meeting Point */}
              <div className="guide-form-row-2col">
                <div className="guide-form-group">
                  <label>Avtobus Qeydiyyat Nömrəsi</label>
                  <input
                    type="text"
                    placeholder="Məs: 99-JH-784"
                    value={assignBusPlate}
                    onChange={(e) => setAssignBusPlate(e.target.value)}
                  />
                </div>

                <div className="guide-form-group">
                  <label>Toplanış Nöqtəsi Ünvanı</label>
                  <input
                    type="text"
                    placeholder="Məs: Gənclik m/s, Caspian Shopping qarşısı"
                    value={assignMeetingPoint}
                    onChange={(e) => setAssignMeetingPoint(e.target.value)}
                  />
                </div>
              </div>

              {/* Departure Notes */}
              <div className="guide-form-group">
                <label>Çıxış Qeydləri və Təlimatlar</label>
                <textarea
                  rows={2}
                  placeholder="Sərnişinlərə və bələdçiyə çıxış öncəsi xüsusi qeydlər..."
                  value={assignDepartureNotes}
                  onChange={(e) => setAssignDepartureNotes(e.target.value)}
                />
              </div>

              <div className="guide-modal-actions">
                <button
                  type="button"
                  className="guide-btn-cancel"
                  onClick={() => setSelectedTourForAssign(null)}
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="guide-btn-submit"
                  disabled={assignSaving}
                >
                  {assignSaving ? 'Yadda saxlanılır...' : 'Təsdiq Et və Yadda Saxla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
