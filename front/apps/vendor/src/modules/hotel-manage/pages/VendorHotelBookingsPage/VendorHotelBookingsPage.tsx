import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Building,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ArrowLeft,
  DollarSign,
  Search,
  Download,
  MessageCircle,
  Eye,
  X,
  Phone,
  Mail,
  BedDouble,
  ShieldCheck
} from 'lucide-react';
import { vendorHotelApi } from '../../api/vendorHotelApi';
import { HotelBooking } from '@toursales/types';
import './VendorHotelBookingsPage.css';

export const VendorHotelBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DEPOSIT' | 'FULL' | 'CONFIRMED'>('ALL');

  // Selected Booking Modal
  const [selectedBooking, setSelectedBooking] = useState<HotelBooking | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await vendorHotelApi.getHotelBookings();
        setBookings(data);
      } catch (err: any) {
        console.error('Failed to load hotel bookings:', err);
        setError('Rezervasiyalar yüklənərkən xəta baş verdi.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const gName = b.primaryGuestName || (b as any).guestName || '';
      const gPhone = b.primaryGuestPhone || (b as any).guestPhone || '';
      const bNum = b.bookingNumber || '';
      const hName = b.hotel?.name || '';

      const matchesSearch =
        gName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gPhone.includes(searchQuery) ||
        bNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hName.toLowerCase().includes(searchQuery.toLowerCase());

      const isDeposit = b.paymentType === 'DEPOSIT_30' || b.paymentStatus === 'PARTIALLY_PAID';
      const isFull = b.paymentType === 'FULL' || b.paymentStatus === 'PAID';

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'DEPOSIT' && isDeposit) ||
        (statusFilter === 'FULL' && isFull) ||
        (statusFilter === 'CONFIRMED' && b.status === 'CONFIRMED');

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalRev = bookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    const totalPaid = bookings.reduce((sum, b) => sum + (Number(b.paidAmount) || 0), 0);
    const totalPending = bookings.reduce((sum, b) => {
      const rem = b.remainingAmount ?? (b.remainingBalance ?? Math.max(0, Number(b.totalAmount) - Number(b.paidAmount)));
      return sum + (b.paymentType === 'DEPOSIT_30' || b.paymentStatus === 'PARTIALLY_PAID' ? rem : 0);
    }, 0);
    const totalNights = bookings.reduce((sum, b) => sum + (Number(b.nightsCount) || 1), 0);

    return { totalRev, totalPaid, totalPending, totalNights };
  }, [bookings]);

  // CSV Export
  const handleExportCSV = () => {
    if (filteredBookings.length === 0) return;

    const headers = [
      'Sifariş Nömrəsi',
      'Qonağın Adı',
      'Əlaqə Telefonu',
      'E-poçt',
      'Otel',
      'Otaq Növü',
      'Giriş Tarixi',
      'Çıxış Tarixi',
      'Gecə Sayı',
      'Ümumi Məbləğ (AZN)',
      'Ödənilmiş (AZN)',
      'Qalıq (AZN)',
      'Ödəniş Tipi',
      'Status'
    ];

    const rows = filteredBookings.map((b) => {
      const gName = b.primaryGuestName || (b as any).guestName || '';
      const gPhone = b.primaryGuestPhone || (b as any).guestPhone || '';
      const gEmail = b.primaryGuestEmail || (b as any).guestEmail || '';
      const rem = b.remainingAmount ?? (b.remainingBalance ?? Math.max(0, Number(b.totalAmount) - Number(b.paidAmount)));

      return [
        `"${b.bookingNumber}"`,
        `"${gName}"`,
        `"${gPhone}"`,
        `"${gEmail}"`,
        `"${b.hotel?.name || ''}"`,
        `"${b.roomType?.name || ''}"`,
        `"${new Date(b.checkInDate).toLocaleDateString('az-AZ')}"`,
        `"${new Date(b.checkOutDate).toLocaleDateString('az-AZ')}"`,
        b.nightsCount,
        b.totalAmount,
        b.paidAmount,
        rem,
        `"${b.paymentType}"`,
        `"${b.status}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Otel_Qonaq_Siyahisi_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // WhatsApp Reminder Link
  const getWhatsAppLink = (b: HotelBooking) => {
    const gName = b.primaryGuestName || (b as any).guestName || 'Hörmətli müştəri';
    const gPhone = (b.primaryGuestPhone || (b as any).guestPhone || '').replace(/[^0-9]/g, '');
    const rem = b.remainingAmount ?? (b.remainingBalance ?? Math.max(0, Number(b.totalAmount) - Number(b.paidAmount)));
    const hotelName = b.hotel?.name || 'otel';

    const text = `Salam ${gName}! TOURSALES vasitəsilə ${hotelName} üçün etdiyiniz rezervasiya üzrə qalıq məbləğ ${rem} AZN təşkil edir. Qalıq ödənişinizi tamamlamaq üçün link: http://localhost:5173/hotels/bookings/${b.id}/pay-balance`;

    return `https://wa.me/${gPhone}?text=${encodeURIComponent(text)}`;
  };

  if (loading) {
    return (
      <div className="vendor-bookings-page-wrap" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Loader2 size={40} className="animate-spin" color="#2563eb" />
        <span style={{ marginTop: 12, color: '#64748b', fontWeight: 600 }}>Rezervasiyalar yüklənir...</span>
      </div>
    );
  }

  return (
    <div className="vendor-bookings-page-wrap">
      {/* 1. Header */}
      <div className="vendor-hotel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/hotels" className="vendor-hotel-btn-secondary" style={{ padding: '10px 14px' }}>
            <ArrowLeft size={16} />
            <span>Otellərə Qayıt</span>
          </Link>
          <div className="vendor-hotel-title-wrap">
            <h1>Otel Rezervasiyaları və Qonaq İdarəetməsi</h1>
            <p>Qonaqlama obyektləri üzrə sifarişlər, 30% depozit izlənməsi və qonaq manifesti</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredBookings.length === 0}
            className="vendor-hotel-btn-secondary"
            style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Download size={16} />
            <span>Excel / CSV İxrac</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: 16, borderRadius: 12 }}>
          {error}
        </div>
      )}

      {/* 2. Stats Row */}
      <div className="vendor-bookings-stats-row">
        <div className="vendor-booking-stat-card">
          <div className="vendor-stat-icon">
            <Users size={22} />
          </div>
          <div>
            <div className="vendor-stat-val">{bookings.length}</div>
            <div className="vendor-stat-label">Ümumi Rezervasiya</div>
          </div>
        </div>

        <div className="vendor-booking-stat-card">
          <div className="vendor-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div className="vendor-stat-val">{stats.totalPaid.toLocaleString()} ₼</div>
            <div className="vendor-stat-label">Ödənilmiş Depozit / Tam</div>
          </div>
        </div>

        <div className="vendor-booking-stat-card">
          <div className="vendor-stat-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="vendor-stat-val">{stats.totalPending.toLocaleString()} ₼</div>
            <div className="vendor-stat-label">Gözlənilən Qalıq Məbləğ</div>
          </div>
        </div>

        <div className="vendor-booking-stat-card">
          <div className="vendor-stat-icon" style={{ background: '#faf5ff', color: '#9333ea' }}>
            <BedDouble size={22} />
          </div>
          <div>
            <div className="vendor-stat-val">{stats.totalNights} Gecə</div>
            <div className="vendor-stat-label">Ümumi Qonaqlama Müddəti</div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="vendor-hotel-filter-bar">
        <div className="vendor-hotel-search-box">
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Qonaq adı, nömrəsi, sifariş kodu və ya otel axtar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="vendor-hotel-category-tabs">
          {[
            { id: 'ALL', label: 'Bütün Rezervasiyalar' },
            { id: 'DEPOSIT', label: '30% Depozitli (Qalıq Gözləyən)' },
            { id: 'FULL', label: '100% Tam Ödənilmiş' },
            { id: 'CONFIRMED', label: 'Təsdiqlənmiş' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`vendor-hotel-tab-btn ${statusFilter === tab.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Bookings Table */}
      <div className="vendor-bookings-table-card">
        {filteredBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <Building size={40} color="#94a3b8" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
              {bookings.length === 0 ? 'Hələ heç bir rezervasiya daxil olmayıb' : 'Axtarışa uyğun rezervasiya tapılmadı'}
            </h3>
            <p style={{ fontSize: '0.85rem' }}>Müştərilər otel otaqlarını bron etdikdə burada əks olunacaq.</p>
          </div>
        ) : (
          <table className="vendor-matrix-table">
            <thead>
              <tr>
                <th>Sifariş Kodu</th>
                <th>Qonaq Məlumatı</th>
                <th>Otel & Otaq</th>
                <th>Giriş / Çıxış</th>
                <th>Məbləğ & Depozit</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => {
                const gName = b.primaryGuestName || (b as any).guestName || 'Qonaq';
                const gPhone = b.primaryGuestPhone || (b as any).guestPhone || '-';
                const rem = b.remainingAmount ?? (b.remainingBalance ?? Math.max(0, Number(b.totalAmount) - Number(b.paidAmount)));
                const hasPendingBalance = (b.paymentType === 'DEPOSIT_30' || b.paymentStatus === 'PARTIALLY_PAID') && rem > 0;

                return (
                  <tr key={b.id} className="vendor-matrix-row">
                    <td>
                      <span className="vendor-booking-number-pill">
                        {b.bookingNumber}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{gName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={12} />
                        <span>{gPhone}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{b.hotel?.name || 'Otel'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{b.roomType?.name || 'Otaq'}</div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {new Date(b.checkInDate).toLocaleDateString('az-AZ')} — {new Date(b.checkOutDate).toLocaleDateString('az-AZ')}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{b.nightsCount} gecə qonaqlama</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{b.totalAmount} ₼</div>
                      <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
                        Ödənilib: {b.paidAmount} ₼
                      </div>
                      {hasPendingBalance ? (
                        <div style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 700 }}>
                          Qalıq: {rem} ₼ (30% Depozit)
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
                          Tam Ödənilib (100%)
                        </div>
                      )}
                    </td>

                    <td>
                      <span className={`vendor-booking-status-tag ${b.status === 'CONFIRMED' ? 'confirmed' : 'pending'}`}>
                        <ShieldCheck size={13} />
                        <span>{b.status === 'CONFIRMED' ? 'Təsdiqləndi' : b.status}</span>
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        {hasPendingBalance && (
                          <a
                            href={getWhatsAppLink(b)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="vendor-whatsapp-btn"
                            title="Müştəriyə WhatsApp ilə qalıq ödəniş xatırlatması göndər"
                          >
                            <MessageCircle size={14} />
                            <span>WhatsApp Xatırlat</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className="vendor-cell-action-btn"
                          title="Bütün detallara bax"
                        >
                          <Eye size={14} />
                          <span>Detallar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 5. Booking Details Modal */}
      {selectedBooking && (
        <div className="vendor-modal-backdrop">
          <div className="vendor-modal-card" style={{ maxWidth: 540 }}>
            <div className="vendor-modal-header">
              <h3>Rezervasiya Detalları: {selectedBooking.bookingNumber}</h3>
              <button type="button" onClick={() => setSelectedBooking(null)} className="vendor-modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 6 }}>Qonaq Məlumatları</h4>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                  {selectedBooking.primaryGuestName || (selectedBooking as any).guestName}
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: '0.85rem', color: '#475569' }}>
                  <span>📞 {selectedBooking.primaryGuestPhone || (selectedBooking as any).guestPhone || '-'}</span>
                  <span>✉️ {selectedBooking.primaryGuestEmail || (selectedBooking as any).guestEmail || '-'}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10 }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Otel</span>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{selectedBooking.hotel?.name}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10 }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Otaq Kateqoriyası</span>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{selectedBooking.roomType?.name}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10 }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Giriş / Çıxış Tarixləri</span>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    {new Date(selectedBooking.checkInDate).toLocaleDateString('az-AZ')} —{' '}
                    {new Date(selectedBooking.checkOutDate).toLocaleDateString('az-AZ')}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedBooking.nightsCount} gecə</span>
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10 }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Ödəniş Məlumatı</span>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                    {selectedBooking.totalAmount} AZN
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#16a34a' }}>
                    Ödənilib: {selectedBooking.paidAmount} AZN
                  </div>
                </div>
              </div>

              {selectedBooking.paymentType === 'DEPOSIT_30' && (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: 12, borderRadius: 10, color: '#9a3412', fontSize: '0.85rem' }}>
                  <strong>30% Depozit Rezervasiyası:</strong> Müştəri girişə 48 saat qalmışadək qalan 70% (
                  {(Number(selectedBooking.totalAmount) - Number(selectedBooking.paidAmount)).toFixed(2)} AZN) məbləği ödəməlidir.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="vendor-hotel-btn-secondary"
                  onClick={() => setSelectedBooking(null)}
                >
                  Bağla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
