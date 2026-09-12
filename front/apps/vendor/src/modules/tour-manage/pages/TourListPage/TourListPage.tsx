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
  Percent,
  Check
} from 'lucide-react';
import { Badge, Button, Spinner } from '@toursales/ui';
import { Tour } from '@toursales/types';
import { DataTable, Column } from '@/shared/components';
import { tourManageApi } from '../../api/tourManageApi';
import { SeatMatrixModal } from '../../components/SeatMatrixModal/SeatMatrixModal';
import './TourListPage.css';

export const TourListPage: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'DOMESTIC' | 'FOREIGN'>('ALL');
  const [exporting, setExporting] = useState<boolean>(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  
  // Seat Matrix Modal State
  const [seatModalTour, setSeatModalTour] = useState<Tour | null>(null);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState<boolean>(false);

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

  const handleToggleStatus = async (t: Tour, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setTogglingId(t.id);
      const nextStatus = t.status === 'ACTIVE' ? 'Deactive' : 'Active';
      const res = await tourManageApi.toggleTourStatus(t.id, nextStatus);
      const updatedTour = res.data;

      setTours((prev) =>
        prev.map((item) =>
          item.id === t.id
            ? { ...item, status: (updatedTour?.status || (t.status === 'ACTIVE' ? 'DEACTIVE' : 'ACTIVE')) as any }
            : item
        )
      );
      showToast(
        `“${t.title}” turunun statusu ${t.status === 'ACTIVE' ? 'Deaktiv edildi' : 'Satışa çıxarıldı'}.`
      );
    } catch (err: any) {
      console.error('Status dəyişmə xətası:', err);
      showToast(err.response?.data?.message || 'Tur statusunu dəyişərkən xəta baş verdi.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

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
      showToast(`“${tourToDelete.title}” turu uğurla silindi.`);
      setTourToDelete(null);
    } catch (err: any) {
      console.error('Silinmə xətası:', err);
      setDeleteError(err.response?.data?.message || 'Turu silərkən xəta baş verdi.');
    } finally {
      setDeleting(false);
    }
  };

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

  const handleOpenSeatMatrix = (t: Tour, e: React.MouseEvent) => {
    e.stopPropagation();
    setSeatModalTour(t);
    setIsSeatModalOpen(true);
  };

  // Dinamik KPI Hesablamaları
  const totalTours = tours.length;
  const domesticCount = tours.filter((t) => (t.type || t.category) !== 'FOREIGN').length;
  const foreignCount = tours.filter((t) => (t.type || t.category) === 'FOREIGN').length;
  const activeToursCount = tours.filter((t) => t.status === 'ACTIVE').length;
  
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

  const filteredTours = tours.filter((t) => {
    if (categoryFilter === 'ALL') return true;
    const tourType = t.type || t.category || 'DOMESTIC';
    return tourType === categoryFilter;
  });

  const columns: Column<Tour>[] = [
    {
      key: 'title',
      header: 'Turun Adı & İstiqamət',
      render: (t: Tour) => {
        const isForeign = (t.type || t.category) === 'FOREIGN';
        return (
          <div className="vendor-tour-title-cell">
            <img
              src={t.images?.[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=120'}
              alt={t.title}
              className="vendor-tour-thumb"
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
            <Calendar size={13} />
            <span>
              {new Date(t.startDate).toLocaleDateString('az-AZ', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          {t.endDate && (
            <div className="date-row end">
              <span className="date-sub-arrow">↳ Dönüş:</span>
              <span>
                {new Date(t.endDate).toLocaleDateString('az-AZ', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
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
        const isActive = t.status === 'ACTIVE';
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
            <Link to={`/bookings?tourId=${t.id}`} title="Sərnişin Siyahısı (Roster)">
              <Button variant="ghost" size="sm">
                <Users size={15} />
              </Button>
            </Link>
            {isDomestic && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleOpenSeatMatrix(t, e)}
                title="Oturacaq Xəritəsi (Seat Map)"
              >
                <Bus size={15} />
              </Button>
            )}
            <Link to={`/tours/edit/${t.id}`} title="Redaktə Et">
              <Button variant="ghost" size="sm">
                <Edit3 size={15} />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleOpenDeleteModal(t, e)}
              className="vendor-delete-btn"
              title="Sil"
            >
              <Trash2 size={15} />
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
        <div className="vendor-tour-kpi-card">
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

        <div className="vendor-tour-kpi-card">
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

      {/* Category Filter Tabs */}
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
          emptyMessage="Seçilmiş kateqoriyada heç bir tur tapılmadı."
        />
      </div>

      {/* Seat Matrix Modal */}
      <SeatMatrixModal
        isOpen={isSeatModalOpen}
        onClose={() => setIsSeatModalOpen(false)}
        tour={seatModalTour}
      />

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
