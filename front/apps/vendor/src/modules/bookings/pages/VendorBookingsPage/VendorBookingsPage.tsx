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
  Clock 
} from 'lucide-react';
import { Badge, Button, Spinner } from '@toursales/ui';
import { Booking } from '@toursales/types';
import { DataTable, Column } from '@/shared/components';
import { QrScannerModal } from '../../components/QrScannerModal/QrScannerModal';
import { PassengerRosterTable } from '../../components/PassengerRosterTable/PassengerRosterTable';
import { vendorBookingApi, RosterPassenger } from '../../api/vendorBookingApi';
import './VendorBookingsPage.css';

export const VendorBookingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTourId = searchParams.get('tourId');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [roster, setRoster] = useState<RosterPassenger[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'roster'>(
    selectedTourId ? 'roster' : 'all'
  );
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'roster' && selectedTourId) {
        const rosterData = await vendorBookingApi.getRoster(selectedTourId);
        setRoster(rosterData.data || []);
      } else {
        const listData = await vendorBookingApi.getBookings();
        setBookings(listData.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedTourId]);

  const handleToggleCheckIn = async (passenger: RosterPassenger) => {
    setRoster((prev) =>
      prev.map((p) =>
        (p.id && p.id === passenger.id) || p.seatNumber === passenger.seatNumber
          ? { ...p, isCheckedIn: !p.isCheckedIn }
          : p
      )
    );
  };

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
      render: (b: Booking) => <strong className="vendor-booking-title">{b.tourTitle || 'Tur'}</strong>,
    },
    {
      key: 'passengers',
      header: 'Sərnişin & Əlaqə',
      render: (b: Booking) => (
        <div>
          <div>{b.passengers?.[0]?.fullName}</div>
          <small className="text-secondary">{b.passengers?.[0]?.phone}</small>
        </div>
      ),
    },
    {
      key: 'seats',
      header: 'Oturacaqlar',
      render: (b: Booking) => (
        <div className="vendor-seat-tags">
          {b.passengers?.map((p: any) => (
            <span key={p.seatNumber} className="vendor-seat-pill">
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
      <div className="vendor-page-header">
        <div>
          <h1 className="vendor-page-title">Sifarişlər & Minik</h1>
          <p className="vendor-page-subtitle">Bilet sifarişləri, QR yoxlanış və sərnişin manifestləri</p>
        </div>
      </div>

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

        <div className="vendor-bookings-actions">
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

      <div className="vendor-bookings-content">
        {activeTab === 'roster' ? (
          <PassengerRosterTable
            passengers={roster}
            isLoading={loading}
            tourTitle={selectedTourId ? 'Quba — Şahdağ Macəra Turu' : undefined}
            onToggleCheckIn={handleToggleCheckIn}
          />
        ) : (
          <DataTable<Booking>
            columns={bookingColumns}
            data={bookings}
            isLoading={loading}
            searchPlaceholder="Bilet №, sərnişin adı ilə axtarın..."
            searchField={(b: Booking) => `${b.bookingNumber} ${b.passengers?.[0]?.fullName || ''}`}
            emptyMessage="Rezervasiya tapılmadı."
          />
        )}
      </div>

      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={() => fetchData()}
      />
    </div>
  );
};
