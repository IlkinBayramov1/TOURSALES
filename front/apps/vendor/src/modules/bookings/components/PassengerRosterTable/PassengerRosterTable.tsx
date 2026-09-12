import React from 'react';
import { RosterPassenger } from '../../api/vendorBookingApi';
import { Badge, Button } from '@toursales/ui';
import { Printer, Phone, User, Download, CheckCircle, Clock } from 'lucide-react';
import { DataTable, Column } from '@/shared/components';
import './PassengerRosterTable.css';

interface PassengerRosterTableProps {
  passengers: RosterPassenger[];
  isLoading?: boolean;
  tourTitle?: string;
  onToggleCheckIn?: (passenger: RosterPassenger) => void;
  onExportExcel?: () => void;
}

export const PassengerRosterTable: React.FC<PassengerRosterTableProps> = ({
  passengers,
  isLoading,
  tourTitle,
  onToggleCheckIn,
  onExportExcel,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const totalCount = passengers.length;
  const checkedInCount = passengers.filter((p) => p.isCheckedIn).length;
  const pendingCount = totalCount - checkedInCount;
  const percentage = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  const columns: Column<RosterPassenger>[] = [
    {
      key: 'seatNumber',
      header: 'Yer №',
      render: (p: RosterPassenger) => (
        <span className="vendor-roster-seat">№{p.seatNumber}</span>
      ),
      width: '80px',
    },
    {
      key: 'fullName',
      header: 'Sərnişinin Adı, Soyadı',
      render: (p: RosterPassenger) => (
        <div className="vendor-roster-name-cell">
          <User size={14} className="vendor-user-icon-subtle" />
          <strong className="vendor-roster-name">{p.fullName}</strong>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Əlaqə Nömrəsi',
      render: (p: RosterPassenger) => (
        <a href={`tel:${p.phone}`} className="vendor-roster-phone">
          <Phone size={12} />
          <span>{p.phone}</span>
        </a>
      ),
    },
    {
      key: 'finCode',
      header: 'Ş/V FİN Kodu (İcazə)',
      render: (p: RosterPassenger) => (
        <span className="vendor-roster-fin font-mono">{p.finCode || '—'}</span>
      ),
    },
    {
      key: 'bookingNumber',
      header: 'Bilet №',
      render: (p: RosterPassenger) => (
        <span className="vendor-roster-booking-no font-mono">{p.bookingNumber}</span>
      ),
    },
    {
      key: 'isCheckedIn',
      header: 'Minik Statusu',
      render: (p: RosterPassenger) => (
        <Badge
          variant={p.isCheckedIn ? 'success' : 'neutral'}
          pill
        >
          {p.isCheckedIn ? '✓ Mindirildi' : 'Gözləyir'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Nəzarət',
      render: (p: RosterPassenger) => (
        <Button
          variant={p.isCheckedIn ? 'ghost' : 'secondary'}
          size="sm"
          onClick={() => onToggleCheckIn && onToggleCheckIn(p)}
        >
          {p.isCheckedIn ? 'Ləğv Et' : 'Mindir'}
        </Button>
      ),
    },
  ];

  return (
    <div className="vendor-roster-wrapper">
      <div className="vendor-roster-header">
        <div>
          <h3>Sərnişin Manifesti (Roster)</h3>
          {tourTitle && <p className="vendor-roster-tour-name">{tourTitle}</p>}
        </div>

        <div className="vendor-roster-actions">
          {onExportExcel && (
            <Button variant="outline" size="sm" onClick={onExportExcel}>
              <Download size={15} />
              <span>Excel Manifest</span>
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handlePrint}>
            <Printer size={15} />
            <span>Siyahını Çap Et</span>
          </Button>
        </div>
      </div>

      {/* Boarding Progress Bar & Stats */}
      {totalCount > 0 && (
        <div className="vendor-roster-stats-strip">
          <div className="vendor-roster-stat-item">
            <span className="text-secondary">Cəmi Sərnişin:</span>
            <strong>{totalCount} nəfər</strong>
          </div>
          <div className="vendor-roster-stat-item text-success">
            <CheckCircle size={15} />
            <span>Mindirildi:</span>
            <strong>{checkedInCount} ({percentage}%)</strong>
          </div>
          <div className="vendor-roster-stat-item text-secondary">
            <Clock size={15} />
            <span>Gözləyir:</span>
            <strong>{pendingCount} nəfər</strong>
          </div>
          <div className="vendor-roster-progress-bar-wrap">
            <div
              className="vendor-roster-progress-bar-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      <DataTable<RosterPassenger>
        columns={columns}
        data={passengers}
        isLoading={isLoading}
        searchPlaceholder="Sərnişin adı və ya FİN kodla axtarın..."
        searchField={(p: RosterPassenger) => `${p.fullName} ${p.finCode || ''} ${p.bookingNumber}`}
        pageSize={50}
        emptyMessage="Bu tur üçün hələ heç bir bilet satılmayıb."
      />
    </div>
  );
};
