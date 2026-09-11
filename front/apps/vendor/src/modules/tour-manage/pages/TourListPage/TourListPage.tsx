import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  Calendar, 
  MapPin 
} from 'lucide-react';
import { Badge, Button } from '@toursales/ui';
import { Tour } from '@toursales/types';
import { DataTable, Column } from '@/shared/components';
import { tourManageApi } from '../../api/tourManageApi';
import './TourListPage.css';

export const TourListPage: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'DOMESTIC' | 'FOREIGN'>('ALL');
  const navigate = useNavigate();

  const fetchTours = async () => {
    try {
      setLoading(true);
      const res = await tourManageApi.getMyTours();
      setTours(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Bu turu silmək istədiyinizə əminsiniz?')) return;

    try {
      await tourManageApi.deleteTour(id);
      setTours((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert('Turu silərkən xəta baş verdi.');
    }
  };

  const domesticCount = tours.filter((t) => (t.type || t.category) !== 'FOREIGN').length;
  const foreignCount = tours.filter((t) => (t.type || t.category) === 'FOREIGN').length;

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
      header: 'Çıxış Tarixi',
      render: (t: Tour) => (
        <div className="vendor-date-cell">
          <Calendar size={13} />
          <span>
            {new Date(t.startDate).toLocaleDateString('az-AZ', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'basePrice',
      header: 'Qiymət',
      render: (t: Tour) => <strong>{t.basePrice} {t.currency || 'AZN'}</strong>,
    },
    {
      key: 'availableSeats',
      header: 'Yerlər & Doluluq',
      render: (t: Tour) => {
        const capacity = t.capacity || 48;
        const available = t.availableSeats ?? 48;
        const booked = capacity - available;
        const fillPercent = Math.round((booked / capacity) * 100);

        return (
          <div className="vendor-occupancy-cell">
            <div className="vendor-occupancy-text">
              <span>{booked} / {capacity} yer</span>
              <strong>%{fillPercent}</strong>
            </div>
            <div className="vendor-occupancy-track">
              <div
                className="vendor-occupancy-fill"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (t: Tour) => (
        <Badge
          variant={t.status === 'ACTIVE' ? 'success' : 'neutral'}
          pill
        >
          {t.status === 'ACTIVE' ? 'Satışda' : t.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Əməliyyatlar',
      render: (t: Tour) => (
        <div className="vendor-row-actions">
          <Link to={`/bookings?tourId=${t.id}`} title="Sərnişin Siyahısı (Roster)">
            <Button variant="ghost" size="sm">
              <Users size={15} />
            </Button>
          </Link>
          <Link to={`/tours/edit/${t.id}`} title="Redaktə Et">
            <Button variant="ghost" size="sm">
              <Edit3 size={15} />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleDelete(t.id, e)}
            className="vendor-delete-btn"
            title="Sil"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="vendor-tour-list-page">
      <div className="vendor-page-header">
        <div>
          <h1 className="vendor-page-title">Turların İdarəsi</h1>
          <p className="vendor-page-subtitle">Agentliyinizin yaratdığı bütün daxili və xarici turlar, yer doluluğu və qiymətlər</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/tours/create')}>
          <Plus size={16} />
          <span>Yeni Tur Yarat</span>
        </Button>
      </div>

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
    </div>
  );
};
