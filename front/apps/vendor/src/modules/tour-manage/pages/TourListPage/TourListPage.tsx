import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  Calendar, 
  MapPin, 
  Bus, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Compass, 
  TrendingUp, 
  Eye, 
  Copy, 
  CheckCheck,
  Flame,
  Layers
} from 'lucide-react';
import { Badge, Button, Spinner } from '@toursales/ui';
import { Tour } from '@toursales/types';
import { DataTable, Column } from '@/shared/components';
import { tourManageApi } from '../../api/tourManageApi';
import { SeatMatrixModal } from '../../components/SeatMatrixModal/SeatMatrixModal';
import './TourListPage.css';

// Az-AZ formatında tarixi zərif göstərən köməkçi (ICU 2026 M04 10 xətasını aradan qaldırır)
const formatAzDate = (dateStr?: string | Date | null) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
      'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return String(dateStr);
  }
};

// Şəkil URL-lərini təhlükəsiz və tam formatda həll edən köməkçi
const getImageUrl = (url?: string) => {
  if (!url) return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=200';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
    : 'http://localhost:5000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const TourListPage: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'DOMESTIC' | 'FOREIGN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DEACTIVE' | 'NEAR_FULL'>('ALL');
  const [exporting, setExporting] = useState<boolean>(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Bulk Selection State
  const [selectedTourIds, setSelectedTourIds] = useState<string[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState<boolean>(false);
  
  // Seat Matrix Modal State
  const [seatModalTour, setSeatModalTour] = useState<Tour | null>(null);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState<boolean>(false);

  // Quick Preview Modal State (Stage 3 preview)
  const [previewTour, setPreviewTour] = useState<Tour | null>(null);

  // Clone Tour Modal State (Stage 3 clone)
  const [cloneTourTarget, setCloneTourTarget] = useState<Tour | null>(null);
  const [cloneStartDate, setCloneStartDate] = useState<string>('');
  const [cloneTitle, setCloneTitle] = useState<string>('');
  const [isCloning, setIsCloning] = useState<boolean>(false);

  // Delete Confirm Modal State
  const [tourToDelete, setTourToDelete] = useState<Tour | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Notification Toast State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const navigate = useNavigate();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchTours = async () => {
    try {
      setLoading(true);
      const res = await tourManageApi.getMyTours();
      setTours(res.data || []);
    } catch (err) {
      console.error('Turların yüklənməsində xəta:', err);
      showToast('Turların siyahısını yükləmək mümkün olmadı.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  // Status Toggle
  const handleToggleStatus = async (t: Tour, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setTogglingId(t.id);
      const isCurrentlyActive = t.status === 'ACTIVE' || t.status === 'Active';
      const nextStatus = isCurrentlyActive ? 'Deactive' : 'Active';
      const res = await tourManageApi.toggleTourStatus(t.id, nextStatus);
      const updatedTour = res.data;

      setTours((prev) =>
        prev.map((item) =>
          item.id === t.id
            ? { ...item, status: (updatedTour?.status || (isCurrentlyActive ? 'DEACTIVE' : 'ACTIVE')) as any }
            : item
        )
      );
      showToast(
        `“${t.title}” turunun statusu ${isCurrentlyActive ? 'Deaktiv edildi' : 'Satışa çıxarıldı'}.`
      );
    } catch (err: any) {
      console.error('Status dəyişmə xətası:', err);
      showToast(err.response?.data?.message || 'Tur statusunu dəyişərkən xəta baş verdi.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // Bulk Status Update
  const handleBulkStatus = async (targetStatus: 'Active' | 'Deactive') => {
    if (selectedTourIds.length === 0) return;
    try {
      setBulkUpdating(true);
      const res = await tourManageApi.bulkToggleStatus(selectedTourIds, targetStatus);
      const count = res.data?.count ?? selectedTourIds.length;
      
      setTours((prev) =>
        prev.map((item) =>
          selectedTourIds.includes(item.id)
            ? { ...item, status: (targetStatus === 'Active' ? 'ACTIVE' : 'DEACTIVE') as any }
            : item
        )
      );

      showToast(
        `${count} tur uğurla ${targetStatus === 'Active' ? 'Satışa çıxarıldı' : 'Deaktiv edildi'}.`
      );
      setSelectedTourIds([]);
    } catch (err: any) {
      console.error('Toplu status dəyişmə xətası:', err);
      showToast(err.response?.data?.message || 'Toplu əməliyyat zamanı xəta baş verdi.', 'error');
    } finally {
      setBulkUpdating(false);
    }
  };

  // Toggle single item selection
  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTourIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Delete Handlers
  const handleOpenDeleteModal = (t: Tour, e: React.MouseEvent) => {
    e.stopPropagation();
    setTourToDelete(t);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!tourToDelete) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await tourManageApi.deleteTour(tourToDelete.id);
      setTours((prev) => prev.filter((t) => t.id !== tourToDelete.id));
      setSelectedTourIds((prev) => prev.filter((id) => id !== tourToDelete.id));
      showToast(`“${tourToDelete.title}” turu uğurla silindi.`);
      setTourToDelete(null);
    } catch (err: any) {
      console.error('Silinmə xətası:', err);
      setDeleteError(err.response?.data?.message || 'Turu silərkən xəta baş verdi.');
    } finally {
      setDeleting(false);
    }
  };

  // Excel Export
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      await tourManageApi.exportToursExcel();
      showToast('Turlar hesabatı Excel formatında uğurla endirildi.');
    } catch (err) {
      console.error('Excel ixrac xətası:', err);
      showToast('Excel faylını generasiya edərkən xəta baş verdi.', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Seat Matrix Modal Handler
  const handleOpenSeatMatrix = (t: Tour, e: React.MouseEvent) => {
    e.stopPropagation();
    setSeatModalTour(t);
    setIsSeatModalOpen(true);
  };

  // Clone Tour Handler
  const handleOpenCloneModal = (t: Tour, e: React.MouseEvent) => {
    e.stopPropagation();
    setCloneTourTarget(t);
    setCloneTitle(`${t.title} (Yeni Qrup)`);
    // Default: 7 days after current start date
    const d = new Date(t.startDate);
    d.setDate(d.getDate() + 7);
    setCloneStartDate(d.toISOString().split('T')[0]);
  };

  const handleConfirmClone = async () => {
    if (!cloneTourTarget || !cloneStartDate) return;
    try {
      setIsCloning(true);
      const res = await tourManageApi.cloneTour(cloneTourTarget.id, {
        startDate: cloneStartDate,
        title: cloneTitle || undefined
      });
      if (res.data) {
        setTours((prev) => [res.data, ...prev]);
        showToast(`“${res.data.title}” turu uğurla nüsxələndi və əlavə olundu.`);
      }
      setCloneTourTarget(null);
    } catch (err: any) {
      console.error('Klonlama xətası:', err);
      showToast(err.response?.data?.message || 'Turu klonlayarkən xəta baş verdi.', 'error');
    } finally {
      setIsCloning(false);
    }
  };

  // Quick Preview Handler
  const handleOpenPreview = (t: Tour, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewTour(t);
  };

  // Dynamic KPI Calculations
  const totalTours = tours.length;
  const domesticCount = tours.filter((t) => (t.type || t.category) !== 'FOREIGN').length;
  const foreignCount = tours.filter((t) => (t.type || t.category) === 'FOREIGN').length;
  const activeToursCount = tours.filter((t) => t.status === 'ACTIVE' || t.status === 'Active').length;
  const deactiveToursCount = totalTours - activeToursCount;

  const totalSoldSeats = tours.reduce((sum, t) => {
    const cap = t.capacity || 48;
    const sold = (t as any).soldSeats !== undefined ? (t as any).soldSeats : Math.max(0, cap - (t.availableSeats ?? cap));
    return sum + sold;
  }, 0);

  const avgOccupancy = totalTours > 0
    ? Math.round(
        tours.reduce((sum, t) => {
          const cap = t.capacity || 48;
          const sold = (t as any).soldSeats !== undefined ? (t as any).soldSeats : Math.max(0, cap - (t.availableSeats ?? cap));
          return sum + (cap > 0 ? (sold / cap) * 100 : 0);
        }, 0) / totalTours
      )
    : 0;

  const nearFullCount = tours.filter((t) => {
    const cap = t.capacity || 48;
    const sold = (t as any).soldSeats !== undefined ? (t as any).soldSeats : Math.max(0, cap - (t.availableSeats ?? cap));
    const fill = cap > 0 ? (sold / cap) * 100 : 0;
    return fill >= 80;
  }).length;

  // Filtered Tours according to both category and status filters
  const filteredTours = tours.filter((t) => {
    // 1. Category filter
    const tourType = t.type || t.category || 'DOMESTIC';
    if (categoryFilter !== 'ALL' && tourType !== categoryFilter) return false;

    // 2. Status filter
    const isActive = t.status === 'ACTIVE' || t.status === 'Active';
    if (statusFilter === 'ACTIVE' && !isActive) return false;
    if (statusFilter === 'DEACTIVE' && isActive) return false;
    if (statusFilter === 'NEAR_FULL') {
      const cap = t.capacity || 48;
      const sold = (t as any).soldSeats !== undefined ? (t as any).soldSeats : Math.max(0, cap - (t.availableSeats ?? cap));
      const fill = cap > 0 ? (sold / cap) * 100 : 0;
      if (fill < 80) return false;
    }

    return true;
  });

  const isAllFilteredSelected =
    filteredTours.length > 0 &&
    filteredTours.every((t) => selectedTourIds.includes(t.id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredTours.map((t) => t.id));
      setSelectedTourIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newSelected = new Set([...selectedTourIds, ...filteredTours.map((t) => t.id)]);
      setSelectedTourIds(Array.from(newSelected));
    }
  };

  const columns: Column<Tour>[] = [
    {
      key: 'select',
      width: '44px',
      header: (
        <input
          type="checkbox"
          className="vendor-table-checkbox"
          checked={isAllFilteredSelected}
          onChange={handleToggleSelectAll}
          title="Bütün səhifəni seç / seçimi qaldır"
        />
      ),
      render: (t: Tour) => (
        <input
          type="checkbox"
          className="vendor-table-checkbox"
          checked={selectedTourIds.includes(t.id)}
          onChange={(e) => handleToggleSelect(t.id, e as any)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'title',
      header: 'Turun Adı & İstiqamət',
      render: (t: Tour) => {
        const isForeign = (t.type || t.category) === 'FOREIGN';
        const imgUrl = getImageUrl(t.images?.[0]);

        return (
          <div className="vendor-tour-title-cell">
            <img
              src={imgUrl}
              alt={t.title}
              className="vendor-tour-thumb"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=200';
              }}
            />
            <div className="vendor-tour-info-col">
              <div className="vendor-tour-tag-row">
                {isForeign ? (
                  <Badge variant="info" pill>✈️ Xarici Tur</Badge>
                ) : (
                  <Badge variant="success" pill>🇦🇿 Daxili Tur</Badge>
                )}
                {t.isKarabakh && <Badge variant="warning" pill>Qarabağ</Badge>}
                {isForeign && t.flightIncluded && <Badge variant="neutral" pill>Uçuş daxildir</Badge>}
              </div>
              <span className="vendor-tour-name font-bold">{t.title}</span>
              <div className="vendor-tour-region-row">
                <MapPin size={12} />
                <span>{t.destinationCountry ? `${t.destinationCountry} - ${t.region}` : t.region}</span>
                {isForeign && t.hotelName && (
                  <span className="vendor-tour-hotel-tag">
                    🏨 {t.hotelName} {t.hotelCategory ? `(${t.hotelCategory})` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'startDate',
      header: 'Çıxış & Dönüş',
      render: (t: Tour) => (
        <div className="vendor-date-cell">
          <div className="date-row start">
            <Calendar size={13} color="#0284c7" />
            <span className="date-main-text">{formatAzDate(t.startDate)}</span>
          </div>
          {t.endDate && (
            <div className="date-row end">
              <span className="date-sub-arrow">↳ Dönüş:</span>
              <span>{formatAzDate(t.endDate)}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'basePrice',
      header: 'Qiymət',
      render: (t: Tour) => (
        <div className="vendor-price-cell">
          <strong className="price-main">{t.basePrice || (t as any).price || 0} {t.currency || 'AZN'}</strong>
          {(t as any).dynamicPrice && (t as any).dynamicPrice !== t.basePrice && (
            <span className="price-dynamic-tag" title="Erkən rezervasiya və ya tələbat qiyməti">
              Dinamik: {(t as any).dynamicPrice} {t.currency || 'AZN'}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'availableSeats',
      header: 'Yerlər & Doluluq',
      render: (t: Tour) => {
        const capacity = t.capacity || 48;
        const available = t.availableSeats ?? 48;
        const booked = (t as any).soldSeats !== undefined ? (t as any).soldSeats : capacity - available;
        const fillPercent = Math.min(100, Math.round((booked / capacity) * 100));
        const isDomestic = (t.type || t.category) !== 'FOREIGN';

        return (
          <div 
            className={`vendor-occupancy-cell ${isDomestic ? 'clickable' : ''}`}
            onClick={isDomestic ? (e) => handleOpenSeatMatrix(t, e) : undefined}
            title={isDomestic ? 'Avtobus oturacaq planına baxmaq üçün klikləyin' : undefined}
          >
            <div className="vendor-occupancy-text">
              <span>{booked} / {capacity} yer</span>
              <strong>%{fillPercent}</strong>
            </div>
            <div className="vendor-occupancy-track">
              <div
                className={`vendor-occupancy-fill ${fillPercent >= 90 ? 'danger' : fillPercent >= 60 ? 'warning' : 'normal'}`}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
            {isDomestic && (
              <span className="seat-plan-quick-link">
                <Bus size={11} />
                <span>Oturacaq planı</span>
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Satış Statusu',
      render: (t: Tour) => {
        const isActive = t.status === 'ACTIVE' || t.status === 'Active';
        const isToggling = togglingId === t.id;

        return (
          <div className="vendor-status-toggle-cell">
            <button
              type="button"
              className={`status-toggle-pill ${isActive ? 'active' : 'deactive'}`}
              onClick={(e) => handleToggleStatus(t, e)}
              disabled={isToggling}
              title={`Statusu dəyişmək üçün klikləyin (${isActive ? 'Deaktiv et' : 'Satışa çıxar'})`}
            >
              {isToggling ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <span className="status-toggle-knob" />
                  <span className="status-toggle-text">{isActive ? 'Satışda' : 'Deaktiv'}</span>
                </>
              )}
            </button>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Əməliyyatlar',
      render: (t: Tour) => {
        const isDomestic = (t.type || t.category) !== 'FOREIGN';
        return (
          <div className="vendor-row-actions">
            {/* Quick Preview Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleOpenPreview(t, e)}
              title="Sürətli Baxış (Preview)"
            >
              <Eye size={15} color="#0284c7" />
            </Button>

            {/* Clone / Duplicate Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleOpenCloneModal(t, e)}
              title="Turu Nüsxələ (Klonla)"
            >
              <Copy size={15} color="#8b5cf6" />
            </Button>

            {/* Passenger Roster */}
            <Link to={`/bookings?tourId=${t.id}`} title="Sərnişin Siyahısı (Roster)">
              <Button variant="ghost" size="sm">
                <Users size={15} color="#059669" />
              </Button>
            </Link>

            {/* Seat Map */}
            {isDomestic && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleOpenSeatMatrix(t, e)}
                title="Oturacaq Xəritəsi (Seat Map)"
              >
                <Bus size={15} color="#3b82f6" />
              </Button>
            )}

            {/* Edit */}
            <Link to={`/tours/edit/${t.id}`} title="Redaktə Et">
              <Button variant="ghost" size="sm">
                <Edit3 size={15} color="#d97706" />
              </Button>
            </Link>

            {/* Delete */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleOpenDeleteModal(t, e)}
              className="vendor-delete-btn"
              title="Sil"
            >
              <Trash2 size={15} color="#dc2626" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="vendor-tour-list-page">
      {/* Toast Notification */}
      {toast && (
        <div className={`vendor-toast-banner ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="vendor-page-header">
        <div>
          <h1 className="vendor-page-title">Turların İdarəsi</h1>
          <p className="vendor-page-subtitle">
            Agentliyinizin bütün turları, oturacaq planları, yer doluluğu və operativ satış nəzarəti
          </p>
        </div>
        <div className="vendor-header-btn-group">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            isLoading={exporting}
            className="vendor-excel-btn"
          >
            <Download size={16} />
            <span>Excel İxrac</span>
          </Button>
          <Button variant="primary" onClick={() => navigate('/tours/create')}>
            <Plus size={16} />
            <span>Yeni Tur Yarat</span>
          </Button>
        </div>
      </div>

      {/* Dynamic KPI Cards Section */}
      <div className="vendor-tour-kpi-grid">
        <div className="vendor-tour-kpi-card" onClick={() => setStatusFilter('ALL')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-wrap blue">
            <Compass size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Cəmi Turlar</span>
            <div className="kpi-val-row">
              <strong className="kpi-value">{totalTours}</strong>
              <span className="kpi-sub-badge">
                {domesticCount} daxili, {foreignCount} xarici
              </span>
            </div>
          </div>
        </div>

        <div className="vendor-tour-kpi-card" onClick={() => setStatusFilter('ACTIVE')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-wrap green">
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Aktiv Satışda Olanlar</span>
            <div className="kpi-val-row">
              <strong className="kpi-value">{activeToursCount}</strong>
              <span className="kpi-sub-badge live">🟢 Canlı Satış</span>
            </div>
          </div>
        </div>

        <div className="vendor-tour-kpi-card">
          <div className="kpi-icon-wrap orange">
            <TrendingUp size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Orta Yer Doluluğu</span>
            <div className="kpi-val-row">
              <strong className="kpi-value">%{avgOccupancy}</strong>
              <span className="kpi-sub-badge">Agentlik ortalaması</span>
            </div>
          </div>
        </div>

        <div className="vendor-tour-kpi-card">
          <div className="kpi-icon-wrap purple">
            <Users size={22} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">Cəmi Satılmış Yer</span>
            <div className="kpi-val-row">
              <strong className="kpi-value">{totalSoldSeats}</strong>
              <span className="kpi-sub-badge">Bron edilmiş sərnişin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Category Tabs */}
      <div className="vendor-filter-tabs">
        <button
          type="button"
          className={`vendor-filter-tab ${categoryFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('ALL')}
        >
          Bütün Turlar ({tours.length})
        </button>
        <button
          type="button"
          className={`vendor-filter-tab ${categoryFilter === 'DOMESTIC' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('DOMESTIC')}
        >
          🇦🇿 Daxili Turlar ({domesticCount})
        </button>
        <button
          type="button"
          className={`vendor-filter-tab ${categoryFilter === 'FOREIGN' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('FOREIGN')}
        >
          ✈️ Xarici Turlar ({foreignCount})
        </button>
      </div>

      {/* Sub-Status Filter Bar */}
      <div className="vendor-sub-status-bar">
        <div className="status-pill-group">
          <button
            type="button"
            className={`status-filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            Hamısı ({totalTours})
          </button>
          <button
            type="button"
            className={`status-filter-btn active-btn ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ACTIVE')}
          >
            🟢 Satışda ({activeToursCount})
          </button>
          <button
            type="button"
            className={`status-filter-btn deactive-btn ${statusFilter === 'DEACTIVE' ? 'active' : ''}`}
            onClick={() => setStatusFilter('DEACTIVE')}
          >
            ⚪ Deaktiv ({deactiveToursCount})
          </button>
          <button
            type="button"
            className={`status-filter-btn flame-btn ${statusFilter === 'NEAR_FULL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('NEAR_FULL')}
          >
            🔥 Dolmaq Üzrə ({nearFullCount})
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="vendor-page-content">
        <DataTable<Tour>
          columns={columns}
          data={filteredTours}
          isLoading={loading}
          searchPlaceholder="Tur adına və ya istiqamətə görə axtarın..."
          searchField={(t: Tour) => `${t.title} ${t.region} ${t.destinationCountry || ''}`}
          headerActions={
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/tours/create')}
            >
              <Plus size={16} />
              <span>Yeni Tur Yarat</span>
            </Button>
          }
          pageSize={10}
          emptyMessage="Seçilmiş kateqoriyada və süzgəcdə heç bir tur tapılmadı."
        />
      </div>

      {/* Docked Floating Bulk Action Toolbar */}
      {selectedTourIds.length > 0 && (
        <div className="vendor-bulk-toolbar-dock">
          <div className="bulk-toolbar-inner">
            <div className="bulk-info">
              <span className="bulk-badge">{selectedTourIds.length}</span>
              <span className="bulk-label">tur seçildi</span>
            </div>

            <div className="bulk-actions-btns">
              <button
                className="bulk-btn activate"
                onClick={() => handleBulkStatus('Active')}
                disabled={bulkUpdating}
              >
                {bulkUpdating ? <Spinner size="sm" /> : <CheckCircle2 size={15} />}
                <span>Satışa Çıxar</span>
              </button>

              <button
                className="bulk-btn deactivate"
                onClick={() => handleBulkStatus('Deactive')}
                disabled={bulkUpdating}
              >
                {bulkUpdating ? <Spinner size="sm" /> : <X size={15} />}
                <span>Deaktiv Et</span>
              </button>

              <button
                className="bulk-btn clear"
                onClick={() => setSelectedTourIds([])}
              >
                <span>Seçimi Ləğv Et</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seat Matrix Modal */}
      <SeatMatrixModal
        isOpen={isSeatModalOpen}
        onClose={() => setIsSeatModalOpen(false)}
        tour={seatModalTour}
      />

      {/* Quick Preview Modal (Stage 3) */}
      {previewTour && (
        <div className="vendor-preview-modal-overlay" onClick={() => setPreviewTour(null)}>
          <div className="vendor-preview-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <div className="preview-title-wrap">
                <Badge variant={previewTour.type === 'FOREIGN' ? 'info' : 'success'} pill>
                  {previewTour.type === 'FOREIGN' ? '✈️ Xarici Tur' : '🇦🇿 Daxili Tur'}
                </Badge>
                <h3>{previewTour.title}</h3>
              </div>
              <button className="preview-close-btn" onClick={() => setPreviewTour(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="preview-modal-body">
              <div className="preview-hero-img-wrap">
                <img
                  src={getImageUrl(previewTour.images?.[0])}
                  alt={previewTour.title}
                  className="preview-hero-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600';
                  }}
                />
                <div className="preview-hero-overlay">
                  <span className="preview-price-tag">
                    {previewTour.basePrice || (previewTour as any).price} {previewTour.currency || 'AZN'}
                  </span>
                </div>
              </div>

              <div className="preview-details-grid">
                <div className="preview-detail-item">
                  <Calendar size={16} color="#0284c7" />
                  <div>
                    <strong>Tarix:</strong>
                    <p>{formatAzDate(previewTour.startDate)} — {formatAzDate(previewTour.endDate)}</p>
                  </div>
                </div>

                <div className="preview-detail-item">
                  <MapPin size={16} color="#ef4444" />
                  <div>
                    <strong>Toplanış Məntəqəsi:</strong>
                    <p>{previewTour.meetingPoint || 'Məlumat qeyd edilməyib'}</p>
                  </div>
                </div>

                <div className="preview-detail-item">
                  <Bus size={16} color="#8b5cf6" />
                  <div>
                    <strong>Nəqliyyat & Tutum:</strong>
                    <p>{previewTour.busType || 'Avtobus'} ({previewTour.capacity || 48} yer)</p>
                  </div>
                </div>

                <div className="preview-detail-item">
                  <CheckCheck size={16} color="#10b981" />
                  <div>
                    <strong>Satış Statusu:</strong>
                    <p>{previewTour.status === 'ACTIVE' || previewTour.status === 'Active' ? '🟢 Satışda' : '⚪ Deaktiv'}</p>
                  </div>
                </div>
              </div>

              {previewTour.description && (
                <div className="preview-desc-section">
                  <strong>Tur Haqqında:</strong>
                  <p>{previewTour.description}</p>
                </div>
              )}

              {previewTour.inclusions && previewTour.inclusions.length > 0 && (
                <div className="preview-inclusions-section">
                  <strong>Qiymətə Daxildir:</strong>
                  <ul>
                    {previewTour.inclusions.map((inc, i) => (
                      <li key={i}>✓ {inc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="preview-modal-footer">
              <Button variant="secondary" onClick={() => setPreviewTour(null)}>
                Bağla
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const id = previewTour.id;
                  setPreviewTour(null);
                  navigate(`/tours/edit/${id}`);
                }}
              >
                <Edit3 size={15} />
                <span>Turu Redaktə Et</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Tour Modal (Stage 3) */}
      {cloneTourTarget && (
        <div className="vendor-clone-modal-overlay" onClick={() => setCloneTourTarget(null)}>
          <div className="vendor-clone-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="clone-modal-header">
              <div className="clone-icon-wrap">
                <Copy size={22} />
              </div>
              <div>
                <h3>Turu Nüsxələ (Klonla)</h3>
                <p className="clone-modal-sub">
                  “<strong>{cloneTourTarget.title}</strong>” turunun bütün marşrut və xidmətləri kopyalanacaq.
                </p>
              </div>
            </div>

            <div className="clone-modal-body">
              <div className="clone-input-group">
                <label className="clone-input-label">Yeni Turun Başlığı:</label>
                <input
                  type="text"
                  className="clone-text-input"
                  value={cloneTitle}
                  onChange={(e) => setCloneTitle(e.target.value)}
                  placeholder="Turun adı..."
                />
              </div>

              <div className="clone-input-group">
                <label className="clone-input-label">Yeni Çıxış Tarixi:</label>
                <input
                  type="date"
                  className="clone-date-input"
                  value={cloneStartDate}
                  onChange={(e) => setCloneStartDate(e.target.value)}
                />
              </div>

              <p className="clone-notice-note">
                💡 Qeyd: Yeni tur avtomatik olaraq 'Active' statusunda yaradılacaq və təkrar proqram doldurmağa ehtiyac qalmayacaq.
              </p>
            </div>

            <div className="clone-modal-footer">
              <Button
                variant="secondary"
                onClick={() => setCloneTourTarget(null)}
                disabled={isCloning}
              >
                İmtina Et
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmClone}
                isLoading={isCloning}
                disabled={!cloneStartDate || !cloneTitle.trim()}
              >
                <Copy size={15} />
                <span>Nüsxələ və Yarat</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {tourToDelete && (
        <div className="vendor-delete-modal-overlay" onClick={() => setTourToDelete(null)}>
          <div className="vendor-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <div className="delete-warning-icon">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3>Turu Silmək İstəyirsiniz?</h3>
                <p className="delete-modal-sub">
                  “<strong>{tourToDelete.title}</strong>” turunu silmək üzrəsiniz.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="delete-modal-error">
                <AlertTriangle size={16} />
                <span>{deleteError}</span>
              </div>
            )}

            <p className="delete-modal-notice">
              Diqqət: Əgər bu tur üzrə təsdiqlənmiş sərnişin rezervasiyaları varsa, təhlükəsizlik məqsədilə tur silinməyəcək. Belə halda turun statusunu sadəcə “Deaktiv” edə bilərsiniz.
            </p>

            <div className="delete-modal-actions">
              <Button
                variant="secondary"
                onClick={() => setTourToDelete(null)}
                disabled={deleting}
              >
                İmtina Et
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                isLoading={deleting}
              >
                Bəli, Turu Sil
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourListPage;
