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
  ChevronDown,
  Send,
  CreditCard
} from 'lucide-react';
import { Badge, Button, Spinner, Card } from '@toursales/ui';
import { Booking, Tour } from '@toursales/types';
import { DataTable, Column } from '@/shared/components';
import { QrScannerModal } from '../../components/QrScannerModal/QrScannerModal';
import { PassengerRosterTable } from '../../components/PassengerRosterTable/PassengerRosterTable';
import { BookingDetailModal } from '../../components/BookingDetailModal/BookingDetailModal';
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
  const [modalBooking, setModalBooking] = useState<Booking | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [reminderSuccessId, setReminderSuccessId] = useState<string | null>(null);

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

  const handleBulkCheckIn = async (tourIdToProcess: string) => {
    try {
      setLoading(true);
      await vendorBookingApi.bulkCheckIn(tourIdToProcess);
      await fetchData();
    } catch (err: any) {
      console.error('Kütləvi minik xətası:', err);
      alert(err.response?.data?.msg || err.response?.data?.message || 'Kütləvi minik icra edilə bilmədi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendBalanceReminder = async (booking: Booking) => {
    try {
      setSendingReminderId(booking.id);
      await vendorBookingApi.sendBalanceReminderWhatsApp(booking.id);
      setReminderSuccessId(booking.id);
      setTimeout(() => setReminderSuccessId(null), 3000);
    } catch (err: any) {
      console.error('Qalıq bildirişi göndərilərkən xəta:', err);
      alert(err.response?.data?.message || 'Qalıq bildirişi göndərilə bilmədi.');
    } finally {
      setSendingReminderId(null);
    }
  };

  const currentTourTitle = tours.find((t) => t.id === selectedTourId)?.title || 'Tur';

  const bookingColumns: Column<Booking>[] = [
    {
      key: 'bookingNumber',
      header: 'Bilet №',
      render: (b: Booking) => (
        <button
          type="button"
          onClick={() => setModalBooking(b)}
          className="font-mono font-bold text-primary-600 hover:underline cursor-pointer text-left bg-transparent border-0 p-0"
          title="Təfərrüatlara bax"
        >
          {b.bookingNumber}
        </button>
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
          <div className="font-medium">{b.passengers?.[0]?.fullName || `${b.passengerName || ''} ${b.passengerSurname || ''}`.trim()}</div>
          <small className="text-secondary">{b.passengers?.[0]?.phone || b.contactNumber || b.userId}</small>
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
      header: 'Məbləğ / Qalıq',
      render: (b: Booking) => {
        const total = Number(b.totalAmount || b.totalPrice || 0);
        const paid = Number(b.paidAmount || 0);
        const remaining = Number(
          b.remainingAmount !== undefined && b.remainingAmount !== null
            ? b.remainingAmount
            : Math.max(0, total - paid)
        );
        const isPartiallyPaid =
          b.paymentStatus === 'PARTIALLY_PAID' ||
          b.status === 'PARTIALLY_PAID' ||
          (b.paymentType === 'DEPOSIT' && remaining > 0);

        return (
          <div>
            <strong>{total} AZN</strong>
            {isPartiallyPaid && remaining > 0 && (
              <div className="text-xs text-amber-600 font-semibold mt-0.5">
                Qalıq: {remaining} AZN
              </div>
            )}
            {b.paymentType === 'INSTALLMENT' && b.installmentMonths && (
              <div className="text-xs text-blue-600 mt-0.5">
                {b.installmentMonths} taksit
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Bilet Statusu',
      render: (b: Booking) => {
        const total = Number(b.totalAmount || b.totalPrice || 0);
        const paid = Number(b.paidAmount || 0);
        const remaining = Number(
          b.remainingAmount !== undefined && b.remainingAmount !== null
            ? b.remainingAmount
            : Math.max(0, total - paid)
        );
        const isPartiallyPaid =
          b.paymentStatus === 'PARTIALLY_PAID' ||
          b.status === 'PARTIALLY_PAID' ||
          (b.paymentType === 'DEPOSIT' && remaining > 0);

        return (
          <Badge
            variant={
              b.status === 'CONFIRMED'
                ? 'success'
                : b.status === 'CANCELLED'
                ? 'error'
                : isPartiallyPaid
                ? 'warning'
                : 'warning'
            }
            pill
          >
            {b.status === 'CONFIRMED'
              ? 'Təsdiqlənib'
              : b.status === 'CANCELLED'
              ? 'Ləğv edilib'
              : isPartiallyPaid
              ? '30% Depozit'
              : b.status}
          </Badge>
        );
      },
    },
    {
      key: 'paymentStatus',
      header: 'Ödəniş',
      render: (b: Booking) => {
        const total = Number(b.totalAmount || b.totalPrice || 0);
        const paid = Number(b.paidAmount || 0);
        const remaining = Number(
          b.remainingAmount !== undefined && b.remainingAmount !== null
            ? b.remainingAmount
            : Math.max(0, total - paid)
        );
        const isPartiallyPaid =
          b.paymentStatus === 'PARTIALLY_PAID' ||
          b.status === 'PARTIALLY_PAID' ||
          (b.paymentType === 'DEPOSIT' && remaining > 0);

        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge
              variant={
                b.paymentStatus === 'PAID'
                  ? 'success'
                  : isPartiallyPaid
                  ? 'warning'
                  : 'neutral'
              }
              pill
            >
              {b.paymentStatus === 'PAID'
                ? 'Ödənilib'
                : isPartiallyPaid
                ? 'Depozit (30%)'
                : b.paymentStatus}
            </Badge>
            {b.depositDueDate && remaining > 0 && (
              <span className="text-[11px] text-gray-500 font-mono">
                Son: {new Date(b.depositDueDate).toLocaleDateString('az-AZ')}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (b: Booking) => {
        const total = Number(b.totalAmount || b.totalPrice || 0);
        const paid = Number(b.paidAmount || 0);
        const remaining = Number(
          b.remainingAmount !== undefined && b.remainingAmount !== null
            ? b.remainingAmount
            : Math.max(0, total - paid)
        );
        const isPartiallyPaid =
          b.paymentStatus === 'PARTIALLY_PAID' ||
          b.status === 'PARTIALLY_PAID' ||
          (b.paymentType === 'DEPOSIT' && remaining > 0);

        return (
          <div className="flex items-center gap-2">
            {isPartiallyPaid && remaining > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSendBalanceReminder(b)}
                isLoading={sendingReminderId === b.id}
                title="Müştəriyə WhatsApp ilə Qalıq Ödəniş linki göndər"
                className="vendor-whatsapp-reminder-btn"
              >
                <Send size={13} />
                <span>{reminderSuccessId === b.id ? 'Göndərildi!' : 'Qalıq Linki'}</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModalBooking(b)}
              title="Sürətli baxış"
            >
              <Eye size={14} />
              <span>Ətraflı</span>
            </Button>
          </div>
        );
      },
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
              className={`vendor-filter-pill ${statusFilter === 'PARTIALLY_PAID' ? 'active' : ''}`}
              onClick={() => setStatusFilter('PARTIALLY_PAID')}
            >
              30% Depozitlər
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
            tourId={selectedTourId}
            tourMeta={{
              title: currentTourTitle,
              startDate: tours.find((t) => t.id === selectedTourId)?.startDate,
              meetingPointAddress: (tours.find((t) => t.id === selectedTourId) as any)?.meetingPointAddress,
              busPlateNumber: (tours.find((t) => t.id === selectedTourId) as any)?.busPlateNumber,
              driverName: (tours.find((t) => t.id === selectedTourId) as any)?.driverName,
              driverPhone: (tours.find((t) => t.id === selectedTourId) as any)?.driverPhone,
            }}
            onToggleCheckIn={handleToggleCheckIn}
            onBulkCheckIn={handleBulkCheckIn}
            onExportExcel={handleExportRoster}
          />
        ) : (
          <DataTable<Booking>
            columns={bookingColumns}
            data={bookings}
            isLoading={loading}
            searchPlaceholder="Bilet №, sərnişin adı, telefon və ya FİN ilə axtarın..."
            searchField={(b: Booking) => `${b.bookingNumber} ${b.tourTitle || ''} ${b.passengerName || ''} ${b.passengerSurname || ''} ${b.contactNumber || ''} ${b.passengers?.map((p: any) => `${p.fullName} ${p.phone} ${p.finCode || ''}`).join(' ') || ''}`}
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

      {/* Interactive Quick Booking Detail Modal */}
      <BookingDetailModal
        booking={modalBooking}
        isOpen={!!modalBooking}
        onClose={() => setModalBooking(null)}
        onStatusUpdated={() => fetchData()}
      />
    </div>
  );
};
