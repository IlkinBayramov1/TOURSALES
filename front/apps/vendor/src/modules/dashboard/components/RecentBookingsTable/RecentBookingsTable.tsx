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
      render: (b: Booking) => (
        <span className="vendor-booking-num font-mono font-bold">
          {b.bookingNumber}
        </span>
      ),
    },
    {
      key: 'tourTitle',
      header: 'Turun Adı',
      render: (b: Booking) => (
        <span className="vendor-booking-tour font-medium">
          {b.tourTitle || 'Tur'}
        </span>
      ),
    },
    {
      key: 'passengers',
      header: 'Sərnişinlər & Yerlər',
      render: (b: Booking) => (
        <div className="vendor-booking-passengers">
          <span>{b.passengers?.[0]?.fullName || 'Müştəri'}</span>
          <span className="vendor-seats-tag">
            {b.passengers?.map((p: any) => `№${p.seatNumber}`).join(', ')}
          </span>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Məbləğ',
      render: (b: Booking) => (
        <strong className="vendor-amount-text">
          {b.totalAmount || b.totalPrice || 0} {b.currency || 'AZN'}
        </strong>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (b: Booking) => (
        <Badge
          variant={
            b.status === 'CONFIRMED'
              ? 'success'
              : b.status === 'COMPLETED'
              ? 'neutral'
              : 'warning'
          }
          pill
        >
          {b.status === 'CONFIRMED' ? 'Təsdiqləndi' : b.status}
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
