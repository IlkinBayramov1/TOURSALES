import React, { useState } from 'react';
import { RosterPassenger } from '../../api/vendorBookingApi';
import { Badge, Button } from '@toursales/ui';
import { 
  Printer, 
  Phone, 
  User, 
  Download, 
  CheckCircle, 
  Clock, 
  CheckCheck,
  AlertTriangle,
  CreditCard
} from 'lucide-react';
import { DataTable, Column } from '@/shared/components';
import './PassengerRosterTable.css';

export interface TourPrintMeta {
  title?: string;
  startDate?: string;
  endDate?: string;
  meetingPointAddress?: string;
  busPlateNumber?: string;
  driverName?: string;
  driverPhone?: string;
  guideName?: string;
}

interface PassengerRosterTableProps {
  passengers: RosterPassenger[];
  isLoading?: boolean;
  tourTitle?: string;
  tourId?: string;
  tourMeta?: TourPrintMeta;
  onToggleCheckIn?: (passenger: RosterPassenger) => void;
  onBulkCheckIn?: (tourId: string) => Promise<void> | void;
  onExportExcel?: () => void;
}

export const PassengerRosterTable: React.FC<PassengerRosterTableProps> = ({
  passengers,
  isLoading,
  tourTitle,
  tourId,
  tourMeta,
  onToggleCheckIn,
  onBulkCheckIn,
  onExportExcel,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CHECKED_IN' | 'PENDING' | 'DEBT'>('ALL');
  const [bulkLoading, setBulkLoading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const totalCount = passengers.length;
  const checkedInCount = passengers.filter((p) => p.isCheckedIn).length;
  const pendingCount = Math.max(0, totalCount - checkedInCount);
  const debtCount = passengers.filter(
    (p) => (p.remainingAmount && p.remainingAmount > 0) || p.hasRemainingDebt
  ).length;
  const percentage = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  const handleBulkCheckInClick = async () => {
    if (!tourId || !onBulkCheckIn) return;
    const confirm = window.confirm(
      `Avtobusdakı bütün ${pendingCount} nəfər sərnişini mindirilmiş olaraq təsdiqləmək istəyirsiniz?`
    );
    if (!confirm) return;

    try {
      setBulkLoading(true);
      await onBulkCheckIn(tourId);
    } catch (err) {
      console.error('Kütləvi minik xətası:', err);
    } finally {
      setBulkLoading(false);
    }
  };

  const filteredPassengers = passengers.filter((p) => {
    if (filter === 'CHECKED_IN') return p.isCheckedIn;
    if (filter === 'PENDING') return !p.isCheckedIn;
    if (filter === 'DEBT') return (p.remainingAmount && p.remainingAmount > 0) || p.hasRemainingDebt;
    return true;
  });

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
      header: 'Ş/V FİN Kodu',
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
      key: 'paymentStatus',
      header: 'Ödəniş / Borc',
      render: (p: RosterPassenger) => {
        const hasDebt = (p.remainingAmount && p.remainingAmount > 0) || p.hasRemainingDebt;
        return (
          <div>
            {hasDebt ? (
              <div className="flex flex-col items-start gap-0.5">
                <Badge variant="warning" pill>
                  Borc Var
                </Badge>
                <span className="text-[11px] font-bold text-amber-600 font-mono">
                  {p.remainingAmount} AZN
                </span>
              </div>
            ) : (
              <Badge variant="success" pill>
                Tam Ödənilib
              </Badge>
            )}
          </div>
        );
      },
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
          {pendingCount > 0 && onBulkCheckIn && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleBulkCheckInClick}
              isLoading={bulkLoading}
              title="Bütün sərnişinləri bir kliklə mindir"
              className="vendor-roster-bulk-btn"
            >
              <CheckCheck size={16} />
              <span>Hamısını Mindir ({pendingCount})</span>
            </Button>
          )}

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
          {debtCount > 0 && (
            <div className="vendor-roster-stat-item text-amber-600">
              <AlertTriangle size={15} />
              <span>Qalıq Borclu:</span>
              <strong>{debtCount} nəfər</strong>
            </div>
          )}
          <div className="vendor-roster-progress-bar-wrap">
            <div
              className="vendor-roster-progress-bar-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Roster Quick Filter Tabs */}
      <div className="vendor-roster-filter-pills">
        <button
          type="button"
          className={`vendor-roster-pill ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          Hamısı ({totalCount})
        </button>
        <button
          type="button"
          className={`vendor-roster-pill ${filter === 'CHECKED_IN' ? 'active' : ''}`}
          onClick={() => setFilter('CHECKED_IN')}
        >
          Mindirilib ({checkedInCount})
        </button>
        <button
          type="button"
          className={`vendor-roster-pill ${filter === 'PENDING' ? 'active' : ''}`}
          onClick={() => setFilter('PENDING')}
        >
          Gözləyir ({pendingCount})
        </button>
        {debtCount > 0 && (
          <button
            type="button"
            className={`vendor-roster-pill warning ${filter === 'DEBT' ? 'active' : ''}`}
            onClick={() => setFilter('DEBT')}
          >
            Borcu Qalanlar ({debtCount})
          </button>
        )}
      </div>

      <DataTable<RosterPassenger>
        columns={columns}
        data={filteredPassengers}
        isLoading={isLoading}
        searchPlaceholder="Sərnişin adı, telefon və ya FİN kodla axtarın..."
        searchField={(p: RosterPassenger) => `${p.fullName} ${p.phone} ${p.finCode || ''} ${p.bookingNumber}`}
        pageSize={50}
        emptyMessage="Bu filtrə uyğun sərnişin tapılmadı."
      />

      {/* Dedicated Printable Run-Sheet (A4 Official Driver / Guide Manifest) */}
      <div className="vendor-printable-run-sheet">
        <div className="vprs-header">
          <div className="vprs-branding">
            <h2>TOURSALES — RƏSMİ AVTOBUS SƏRNİŞİN MANİFESTİ</h2>
            <p>Sürücü, Bələdçi və Minik Nəzarəti üçün Yol Vərəqəsi</p>
          </div>
          <div className="vprs-print-date">
            <span>Çap tarixi: {new Date().toLocaleString('az-AZ')}</span>
          </div>
        </div>

        <div className="vprs-meta-grid">
          <div className="vprs-meta-item">
            <strong>Tur:</strong> {tourTitle || '—'}
          </div>
          <div className="vprs-meta-item">
            <strong>Tarix:</strong> {tourMeta?.startDate ? new Date(tourMeta.startDate).toLocaleDateString('az-AZ') : '—'}
          </div>
          <div className="vprs-meta-item">
            <strong>Toplanış Yeri:</strong> {tourMeta?.meetingPointAddress || 'Gənclik m/s'}
          </div>
          <div className="vprs-meta-item">
            <strong>Avtobus Q/N:</strong> {tourMeta?.busPlateNumber || '99-XX-000'}
          </div>
          <div className="vprs-meta-item">
            <strong>Sürücü:</strong> {tourMeta?.driverName || 'Təyin olunub'} {tourMeta?.driverPhone ? `(${tourMeta.driverPhone})` : ''}
          </div>
          <div className="vprs-meta-item">
            <strong>Bələdçi:</strong> {tourMeta?.guideName || 'Təyin olunub'}
          </div>
          <div className="vprs-meta-item">
            <strong>Sərnişin Sayı:</strong> {totalCount} nəfər (Mindirilib: {checkedInCount})
          </div>
        </div>

        <table className="vprs-table">
          <thead>
            <tr>
              <th style={{ width: '35px' }}>№</th>
              <th style={{ width: '45px' }}>Yer</th>
              <th>Sərnişinin Adı, Soyadı</th>
              <th>Əlaqə Telefonu</th>
              <th>Ş/V FİN Kodu</th>
              <th>Bilet №</th>
              <th>Ödəniş Vəziyyəti</th>
              <th style={{ width: '100px' }}>Qonaq İmzası</th>
            </tr>
          </thead>
          <tbody>
            {passengers.map((p, idx) => {
              const hasDebt = (p.remainingAmount && p.remainingAmount > 0) || p.hasRemainingDebt;
              return (
                <tr key={idx}>
                  <td className="text-center">{idx + 1}</td>
                  <td className="text-center font-bold">№{p.seatNumber}</td>
                  <td><strong>{p.fullName}</strong></td>
                  <td>{p.phone}</td>
                  <td className="font-mono">{p.finCode || '—'}</td>
                  <td className="font-mono">{p.bookingNumber}</td>
                  <td>
                    {hasDebt ? (
                      <span className="vprs-debt-text">BORC: {p.remainingAmount} AZN</span>
                    ) : (
                      'Tam Ödənilib'
                    )}
                  </td>
                  <td className="vprs-sign-cell"></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="vprs-signatures">
          <div className="vprs-sig-block">
            <span>Sürücünün İmzası: ______________________</span>
          </div>
          <div className="vprs-sig-block">
            <span>Bələdçinin İmzası: ______________________</span>
          </div>
        </div>
      </div>
    </div>
  );
};
