import React from 'react';
import { Link } from 'react-router-dom';
import { Booking } from '@toursales/types';
import { Badge, Button } from '@toursales/ui';
import { Eye, Clock } from 'lucide-react';
import { DataTable, Column } from '@/shared/components';
import './RecentBookingsTable.css';

interface RecentBookingsTableProps {
  bookings: Booking[];
  isLoading?: boolean;
}

export const RecentBookingsTable: React.FC<RecentBookingsTableProps> = ({
  bookings,
  isLoading,
}) => {
  const columns: Column<Booking>[] = [
    {
      key: 'bookingNumber',
      header: 'Sifariş №',
      render: (b: any) => (
        <span className="vendor-booking-num font-mono font-bold">
          {b.bookingNumber || b.id}
        </span>
      ),
    },
    {
      key: 'tourTitle',
      header: 'Turun Adı',
      render: (b: any) => (
        <span className="vendor-booking-tour font-medium">
          {b.tourTitle || b.tour?.title || 'Tur'}
        </span>
      ),
    },
    {
      key: 'passengers',
      header: 'Sərnişinlər & Yerlər',
      render: (b: any) => {
        const pName = b.passengerName || b.passengers?.[0]?.fullName || 'Müştəri';
        const seatInfo = b.busSeatNumber
          ? `Yer #${b.busSeatNumber}`
          : b.passengers?.length
          ? b.passengers.map((p: any) => `№${p.seatNumber}`).join(', ')
          : `${b.seats || 1} yer`;

        return (
          <div className="vendor-booking-passengers">
            <span>{pName}</span>
            <span className="vendor-seats-tag">{seatInfo}</span>
          </div>
        );
      },
    },
    {
      key: 'totalAmount',
      header: 'Məbləğ',
      render: (b: any) => (
        <strong className="vendor-amount-text">
          {Number(b.totalAmount || b.totalPrice || 0).toLocaleString()} {b.currency || 'AZN'}
        </strong>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (b: any) => {
        let variant: 'success' | 'neutral' | 'warning' | 'error' = 'neutral';
        let label = b.status;

        if (b.status === 'CONFIRMED') {
          variant = 'success';
          label = 'Təsdiqləndi';
        } else if (b.status === 'PENDING') {
          variant = 'warning';
          label = 'Gözləmədə';
        } else if (b.status === 'CANCELLED') {
          variant = 'error';
          label = 'Ləğv edildi';
        } else if (b.status === 'COMPLETED') {
          variant = 'neutral';
          label = 'Tamamlandı';
        }

        return (
          <Badge variant={variant} pill>
            {label}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (b: Booking) => (
        <Link to={`/bookings/${b.id}`}>
          <Button variant="ghost" size="sm">
            <Eye size={14} />
            <span>Bax</span>
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="vendor-recent-bookings-wrap">
      <div className="vendor-table-section-title">
        <Clock size={18} />
        <h3>Son Rezervasiyalar</h3>
      </div>

      <DataTable<Booking>
        columns={columns}
        data={bookings}
        isLoading={isLoading}
        pageSize={5}
        emptyMessage="Hələ ki heç bir sifariş qeydə alınmayıb"
      />
    </div>
  );
};
