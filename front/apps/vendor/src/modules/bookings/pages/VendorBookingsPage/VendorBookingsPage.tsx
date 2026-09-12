import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Users, 
  QrCode, 
  Ticket, 
  Eye, 
  Calendar, 
  Download, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { Badge, Button, Spinner, Card } from '@toursales/ui';
import { Booking, Tour } from '@toursales/types';
import { DataTable, Column } from '@/shared/components';
import { QrScannerModal } from '../../components/QrScannerModal/QrScannerModal';
import { PassengerRosterTable } from '../../components/PassengerRosterTable/PassengerRosterTable';
import { vendorBookingApi, RosterPassenger, BookingStats } from '../../api/vendorBookingApi';
import { tourManageApi } from '../../../tour-manage/api/tourManageApi';
import './VendorBookingsPage.css';

export const VendorBookingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTourIdFromUrl = searchParams.get('tourId');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [roster, setRoster] = useState<RosterPassenger[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string>(selectedTourIdFromUrl || '');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    totalPassengers: 0,
    checkedInCount: 0,
    checkedInRate: 0,
    totalRevenue: 0,
  });

  const [activeTab, setActiveTab] = useState<'all' | 'roster'>(
    selectedTourIdFromUrl ? 'roster' : 'all'
  );
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Initial load of tours & stats
  useEffect(() => {
    const initData = async () => {
      try {
        const [toursRes, statsRes] = await Promise.all([
          tourManageApi.getMyTours(),
          vendorBookingApi.getStats(),
        ]);
        if (toursRes.data) {
          setTours(toursRes.data);
          if (!selectedTourId && toursRes.data.length > 0) {
            setSelectedTourId(toursRes.data[0].id);
          }
        }
        if (statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (err) {
        console.error('İlkin məlumatların yüklənməsi xətası:', err);
      }
    };
    initData();
  }, []);

  // Fetch bookings or roster based on tab & filters
  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'roster') {
        const activeId = selectedTourId || (tours.length > 0 ? tours[0].id : '');
        if (activeId) {
          const rosterRes = await vendorBookingApi.getRoster(activeId);
          setRoster(rosterRes.data || []);
        }
      } else {
        const params: { status?: string } = {};
        if (statusFilter !== 'ALL') {
          params.status = statusFilter;
        }
        const listRes = await vendorBookingApi.getBookings(params);
        setBookings(listRes.data || []);
      }
      // Also refresh stats
      const updatedStats = await vendorBookingApi.getStats();
      if (updatedStats.data) {
        setStats(updatedStats.data);
      }
    } catch (err) {
      console.error('Məlumatların yüklənməsi xətası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedTourId, statusFilter]);

  const handleToggleCheckIn = async (passenger: RosterPassenger) => {
    if (!passenger.bookingId && !passenger.bookingNumber) return;
    const bId = passenger.bookingId || passenger.bookingNumber;
    try {
      // Optimistic update in state
      setRoster((prev) =>
        prev.map((p) =>
          p.id === passenger.id || (p.bookingNumber === passenger.bookingNumber && p.seatNumber === passenger.seatNumber)
            ? { ...p, isCheckedIn: !p.isCheckedIn }
            : p
        )
      );

      await vendorBookingApi.toggleCheckIn(bId, passenger.seatNumber);
      // Refresh stats
      const updatedStats = await vendorBookingApi.getStats();
      if (updatedStats.data) {
        setStats(updatedStats.data);
      }
    } catch (err) {
      console.error('Minik statusu dəyişdirilərkən xəta:', err);
      // Revert on failure
      fetchData();
    }
  };

  const handleExportBookings = async () => {
    try {
      setExporting(true);
      await vendorBookingApi.exportBookingsExcel({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
    } catch (err) {
      console.error('Excel ixrac xətası:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportRoster = async () => {
    if (!selectedTourId) return;
    try {
      await vendorBookingApi.exportRosterExcel(selectedTourId);
    } catch (err) {
      console.error('Roster Excel ixrac xətası:', err);
    }
  };

  const currentTourTitle = tours.find((t) => t.id === selectedTourId)?.title || 'Tur';

  const bookingColumns: Column<Booking>[] = [
    {
      key: 'bookingNumber',
      header: 'Bilet №',
      render: (b: Booking) => (
        <span className="font-mono font-bold text-primary-600">
          {b.bookingNumber}
        </span>
      ),
    },
    {
      key: 'tourTitle',
      header: 'Tur',
      render: (b: Booking) => (
        <div>
          <strong className="vendor-booking-title">{b.tourTitle || 'Tur'}</strong>
          {b.tourStartDate && (
            <div className="text-secondary text-xs mt-1">
              {new Date(b.tourStartDate).toLocaleDateString('az-AZ')}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'passengers',
      header: 'Sərnişin & Əlaqə',
      render: (b: Booking) => (
        <div>
          <div className="font-medium">{b.passengers?.[0]?.fullName}</div>
          <small className="text-secondary">{b.passengers?.[0]?.phone || b.userId}</small>
          {b.passengers && b.passengers.length > 1 && (
            <span className="text-xs text-primary-600 block mt-0.5">
              +{b.passengers.length - 1} digər sərnişin
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'seats',
      header: 'Oturacaqlar',
      render: (b: Booking) => (
        <div className="vendor-seat-tags">
          {b.passengers?.map((p: any, idx: number) => (
            <span
              key={idx}
              className={`vendor-seat-pill ${p.isCheckedIn ? 'checked' : ''}`}
              title={p.isCheckedIn ? 'Mindirildi' : 'Gözləyir'}
            >
              №{p.seatNumber}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Məbləğ',
      render: (b: Booking) => <strong>{b.totalAmount || b.totalPrice || 0} AZN</strong>,
    },
    {
      key: 'status',
      header: 'Bilet Statusu',
      render: (b: Booking) => (
        <Badge
          variant={
            b.status === 'CONFIRMED'
              ? 'success'
              : b.status === 'CANCELLED'
              ? 'error'
              : 'warning'
          }
          pill
        >
          {b.status === 'CONFIRMED'
            ? 'Təsdiqlənib'
            : b.status === 'CANCELLED'
            ? 'Ləğv edilib'
            : b.status}
        </Badge>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Ödəniş',
      render: (b: Booking) => (
        <Badge
          variant={b.paymentStatus === 'PAID' ? 'success' : 'warning'}
          pill
        >
          {b.paymentStatus === 'PAID' ? 'Ödənilib' : b.paymentStatus}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (b: Booking) => (
        <Link to={`/bookings/${b.id}`}>
          <Button variant="ghost" size="sm">
            <Eye size={14} />
            <span>Ətraflı</span>
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="vendor-bookings-page">
      {/* Page Header */}
      <div className="vendor-page-header">
        <div>
          <h1 className="vendor-page-title">Sifarişlər & Minik Nəzarəti</h1>
          <p className="vendor-page-subtitle">Real-vaxt bilet satışı, QR yoxlanış və avtobus sərnişin manifestləri</p>
        </div>
      </div>

      {/* KPI Metrics Dashboard Cards */}
      <div className="vendor-bookings-kpi-grid">
        <div className="vendor-booking-kpi-card">
          <div className="vendor-kpi-icon-wrap primary">
            <Ticket size={22} />
          </div>
          <div className="vendor-kpi-info">
            <span className="vendor-kpi-label">Ümumi Sifarişlər</span>
            <strong className="vendor-kpi-val">{stats.totalBookings}</strong>
            <small className="vendor-kpi-sub">Bazada qeydiyyatdan keçən</small>
          </div>
        </div>

        <div className="vendor-booking-kpi-card">
          <div className="vendor-kpi-icon-wrap info">
            <Users size={22} />
          </div>
          <div className="vendor-kpi-info">
            <span className="vendor-kpi-label">Cəmi Sərnişinlər</span>
            <strong className="vendor-kpi-val">{stats.totalPassengers} nəfər</strong>
            <small className="vendor-kpi-sub">Bütün aktiv yerlər</small>
          </div>
        </div>

        <div className="vendor-booking-kpi-card">
          <div className="vendor-kpi-icon-wrap success">
            <CheckCircle2 size={22} />
          </div>
          <div className="vendor-kpi-info">
            <span className="vendor-kpi-label">Minik Nisbəti</span>
            <strong className="vendor-kpi-val">
              {stats.checkedInCount} / {stats.totalPassengers} ({stats.checkedInRate}%)
            </strong>
            <small className="vendor-kpi-sub">Avtobusa minikdən keçən</small>
          </div>
        </div>

        <div className="vendor-booking-kpi-card">
          <div className="vendor-kpi-icon-wrap warning">
            <TrendingUp size={22} />
          </div>
          <div className="vendor-kpi-info">
            <span className="vendor-kpi-label">Cəmi Dövriyyə</span>
            <strong className="vendor-kpi-val">{stats.totalRevenue} AZN</strong>
            <small className="vendor-kpi-sub">Təsdiqlənmiş biletlərdən</small>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Navigation */}
      <div className="vendor-bookings-toolbar">
        <div className="vendor-tabs">
          <button
            type="button"
            className={`vendor-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('all');
              setSearchParams({});
            }}
          >
            <Ticket size={16} />
            <span>Bütün Rezervasiyalar</span>
          </button>
          <button
            type="button"
            className={`vendor-tab-btn ${activeTab === 'roster' ? 'active' : ''}`}
            onClick={() => setActiveTab('roster')}
          >
            <Users size={16} />
            <span>Sərnişin Manifesti (Roster)</span>
          </button>
        </div>

        {/* Tour Selector Dropdown for Roster Tab */}
        {activeTab === 'roster' && tours.length > 0 && (
          <div className="vendor-tour-selector-box">
            <label htmlFor="tour-select">Tur:</label>
            <select
              id="tour-select"
              className="vendor-tour-select"
              value={selectedTourId}
              onChange={(e) => {
                setSelectedTourId(e.target.value);
                setSearchParams({ tourId: e.target.value });
              }}
            >
              {tours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({new Date(t.startDate).toLocaleDateString('az-AZ')})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter for All Bookings Tab */}
        {activeTab === 'all' && (
          <div className="vendor-status-filter-pills">
            <button
              type="button"
              className={`vendor-filter-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Hamısı
            </button>
            <button
              type="button"
              className={`vendor-filter-pill ${statusFilter === 'CONFIRMED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('CONFIRMED')}
            >
              Təsdiqlənib
            </button>
            <button
              type="button"
              className={`vendor-filter-pill ${statusFilter === 'CANCELLED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('CANCELLED')}
            >
              Ləğv edilib
            </button>
          </div>
        )}

        <div className="vendor-bookings-actions">
          {activeTab === 'all' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportBookings}
              isLoading={exporting}
            >
              <Download size={16} />
              <span>Excel İxrac</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsScannerOpen(true)}
          >
            <QrCode size={16} />
            <span>QR Check-in Skaner</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="vendor-bookings-content">
        {activeTab === 'roster' ? (
          <PassengerRosterTable
            passengers={roster}
            isLoading={loading}
            tourTitle={currentTourTitle}
            onToggleCheckIn={handleToggleCheckIn}
            onExportExcel={handleExportRoster}
          />
        ) : (
          <DataTable<Booking>
            columns={bookingColumns}
            data={bookings}
            isLoading={loading}
            searchPlaceholder="Bilet №, sərnişin adı və ya telefonla axtarın..."
            searchField={(b: Booking) => `${b.bookingNumber} ${b.passengers?.[0]?.fullName || ''} ${b.passengers?.[0]?.phone || ''}`}
            emptyMessage="Axtarışa uyğun rezervasiya tapılmadı."
          />
        )}
      </div>

      {/* Real QR Scanner & Check-in Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={() => fetchData()}
      />
    </div>
  );
};
