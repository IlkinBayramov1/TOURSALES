import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ArrowLeft,
  Zap,
  Save,
  Lock,
  Unlock,
  Building,
  Loader2,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Percent,
  Plus,
  RefreshCw,
  Edit2,
  X,
  BedDouble,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { vendorHotelApi, CreateRoomPayload, CalendarBulkUpdateItem } from '../../api/vendorHotelApi';
import { Hotel, RoomType, RoomAvailabilityMatrixItem } from '@toursales/types';
import './RoomCalendarMatrixPage.css';

// Azerbaijani day names
const AZ_DAYS: Record<string, string> = {
  Monday: 'Bazar ertəsi',
  Tuesday: 'Çərşənbə axşamı',
  Wednesday: 'Çərşənbə',
  Thursday: 'Cümə axşamı',
  Friday: 'Cümə',
  Saturday: 'Şənbə',
  Sunday: 'Bazar',
  Mon: 'B.e',
  Tue: 'Ç.a',
  Wed: 'Çər',
  Thu: 'C.a',
  Fri: 'Cüm',
  Sat: 'Şən',
  Sun: 'Baz'
};

export const RoomCalendarMatrixPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [matrix, setMatrix] = useState<RoomAvailabilityMatrixItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Bulk Controls State
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');
  const [overridePrice, setOverridePrice] = useState<string>('');
  const [overrideCount, setOverrideCount] = useState<string>('');
  const [bulkBlock, setBulkBlock] = useState<boolean>(false);

  // Quick Inline Day Edit Modal
  const [editingDay, setEditingDay] = useState<RoomAvailabilityMatrixItem | null>(null);
  const [dayPrice, setDayPrice] = useState<string>('');
  const [dayCount, setDayCount] = useState<string>('');
  const [dayBlocked, setDayBlocked] = useState<boolean>(false);
  const [savingDay, setSavingDay] = useState(false);

  // Quick Add Room Modal State
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomBedType, setNewRoomBedType] = useState('DOUBLE');
  const [newRoomMealPlan, setNewRoomMealPlan] = useState('BB');
  const [newRoomBasePrice, setNewRoomBasePrice] = useState(140);
  const [newRoomTotalCount, setNewRoomTotalCount] = useState(8);
  const [creatingRoom, setCreatingRoom] = useState(false);

  // Load Hotel & Rooms
  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        const hotelData = await vendorHotelApi.getHotelById(id);
        setHotel(hotelData);
        const rList = hotelData.roomTypes || hotelData.rooms || [];
        setRooms(rList);
        if (rList.length > 0) {
          setSelectedRoomId(rList[0].id);
        }
      } catch (err) {
        console.error('Failed to load hotel rooms:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // Load Matrix for Selected Room
  const loadMatrix = useCallback(async () => {
    if (!id || !selectedRoomId) return;
    try {
      const res = await vendorHotelApi.getRoomCalendarMatrix(id, selectedRoomId);
      const list = res.matrix || [];
      setMatrix(list);
      if (list.length > 0) {
        setBulkStartDate(list[0].date);
        setBulkEndDate(list[list.length - 1].date);
      }
    } catch (err) {
      console.error('Failed to load calendar matrix:', err);
    }
  }, [id, selectedRoomId]);

  useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  const selectedRoom = useMemo(() => {
    return rooms.find((r) => r.id === selectedRoomId);
  }, [rooms, selectedRoomId]);

  // Bulk Apply Handler
  const handleApplyBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedRoomId || !bulkStartDate || !bulkEndDate) return;

    setUpdating(true);
    setFeedback(null);

    try {
      const start = new Date(bulkStartDate);
      const end = new Date(bulkEndDate);

      const targetDates = matrix.filter((item) => {
        const d = new Date(item.date);
        return d >= start && d <= end;
      });

      const updates: CalendarBulkUpdateItem[] = targetDates.map((item) => ({
        date: item.date,
        priceOverride: overridePrice ? Number(overridePrice) : undefined,
        availableCount: overrideCount ? Number(overrideCount) : undefined,
        isBlocked: bulkBlock,
      }));

      await vendorHotelApi.bulkUpdateCalendar(id, selectedRoomId, updates);
      setFeedback(`${updates.length} gün üçün otaq fondu və qiymətlər uğurla tətbiq edildi!`);
      await loadMatrix();
    } catch (err: any) {
      console.error('Bulk update error:', err);
      setFeedback('Yenilənmə zamanı xəta baş verdi.');
    } finally {
      setUpdating(false);
    }
  };

  // Smart Yield Preset: Weekend Surge (+20%)
  const handleApplyWeekendSurge = async () => {
    if (!id || !selectedRoomId || !selectedRoom) return;
    setUpdating(true);
    setFeedback(null);

    try {
      const weekendUpdates: CalendarBulkUpdateItem[] = matrix
        .filter((item) => {
          const d = new Date(item.date);
          const day = d.getDay();
          return day === 5 || day === 6; // Friday & Saturday
        })
        .map((item) => ({
          date: item.date,
          priceOverride: Math.round(Number(selectedRoom.basePrice) * 1.2),
          availableCount: item.availableCount,
          isBlocked: item.isBlocked,
        }));

      if (weekendUpdates.length === 0) {
        setFeedback('Həftəsonu günləri tapılmadı.');
        return;
      }

      await vendorHotelApi.bulkUpdateCalendar(id, selectedRoomId, weekendUpdates);
      setFeedback(`Həftəsonu günləri üçün +20% Smart Yield qiymət artımı (${weekendUpdates.length} gün) uğurla tətbiq edildi!`);
      await loadMatrix();
    } catch (err) {
      console.error('Weekend surge error:', err);
      setFeedback('Həftəsonu tarifi tətbiq edilərkən xəta baş verdi.');
    } finally {
      setUpdating(false);
    }
  };

  // Smart Yield Preset: Last-Minute Discount (-15% on next 4 days)
  const handleApplyLastMinuteDiscount = async () => {
    if (!id || !selectedRoomId || !selectedRoom) return;
    setUpdating(true);
    setFeedback(null);

    try {
      const targetDays = matrix.slice(0, 4).map((item) => ({
        date: item.date,
        priceOverride: Math.round(Number(selectedRoom.basePrice) * 0.85),
        availableCount: item.availableCount,
        isBlocked: item.isBlocked,
      }));

      await vendorHotelApi.bulkUpdateCalendar(id, selectedRoomId, targetDays);
      setFeedback(`Yaxın 4 gün üçün -15% Son Dəqiqə endirimi tətbiq edildi!`);
      await loadMatrix();
    } catch (err) {
      console.error('Last minute discount error:', err);
      setFeedback('Endirim tətbiq edilərkən xəta baş verdi.');
    } finally {
      setUpdating(false);
    }
  };

  // Reset all to Base Price
  const handleResetToBasePrice = async () => {
    if (!id || !selectedRoomId || !selectedRoom) return;
    if (!window.confirm('Bütün xüsusi qiymət artımlarını silib otağın baza qiymətinə qayıtmaq istədiyinizə əminsiniz?')) return;

    setUpdating(true);
    setFeedback(null);

    try {
      const resetUpdates: CalendarBulkUpdateItem[] = matrix.map((item) => ({
        date: item.date,
        priceOverride: Number(selectedRoom.basePrice),
        availableCount: selectedRoom.totalRoomsCount,
        isBlocked: false,
      }));

      await vendorHotelApi.bulkUpdateCalendar(id, selectedRoomId, resetUpdates);
      setFeedback(`Bütün 30 günlük təqvim baza qiymətinə (${selectedRoom.basePrice} ₼) sıfırlandı və açıldı!`);
      await loadMatrix();
    } catch (err) {
      console.error('Reset error:', err);
      setFeedback('Sıfırlama zamanı xəta baş verdi.');
    } finally {
      setUpdating(false);
    }
  };

  // Toggle Block on Single Day
  const handleToggleBlockDay = async (date: string, currentBlocked: boolean) => {
    if (!id || !selectedRoomId) return;
    try {
      await vendorHotelApi.bulkUpdateCalendar(id, selectedRoomId, [
        {
          date,
          isBlocked: !currentBlocked,
        },
      ]);
      await loadMatrix();
    } catch (err) {
      console.error('Toggle block error:', err);
    }
  };

  // Open Day Edit Modal
  const handleOpenDayEdit = (item: RoomAvailabilityMatrixItem) => {
    setEditingDay(item);
    setDayPrice(String(item.effectivePrice));
    setDayCount(String(item.availableCount));
    setDayBlocked(item.isBlocked);
  };

  // Save Day Edit
  const handleSaveDayEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedRoomId || !editingDay) return;

    setSavingDay(true);
    try {
      await vendorHotelApi.bulkUpdateCalendar(id, selectedRoomId, [
        {
          date: editingDay.date,
          priceOverride: dayPrice ? Number(dayPrice) : undefined,
          availableCount: dayCount ? Number(dayCount) : undefined,
          isBlocked: dayBlocked,
        },
      ]);
      setEditingDay(null);
      await loadMatrix();
      setFeedback(`${editingDay.date} tarixi üçün məlumatlar uğurla yeniləndi!`);
    } catch (err) {
      console.error('Save day edit error:', err);
      alert('Yeniləmə zamanı xəta baş verdi.');
    } finally {
      setSavingDay(false);
    }
  };

  // Quick Add Room Handler
  const handleCreateNewRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newRoomName.trim()) return;

    setCreatingRoom(true);
    try {
      const payload: CreateRoomPayload = {
        name: newRoomName.trim(),
        bedType: newRoomBedType,
        mealPlan: newRoomMealPlan,
        capacityAdults: 2,
        capacityChildren: 1,
        basePrice: Number(newRoomBasePrice),
        totalRoomsCount: Number(newRoomTotalCount),
        amenities: ['Kondisioner', 'Smart TV', 'Wi-Fi'],
        images: hotel?.images ? hotel.images.slice(0, 2) : [],
      };

      const created = await vendorHotelApi.createRoom(id, payload);
      setRooms((prev) => [...prev, created]);
      setSelectedRoomId(created.id);
      setShowAddRoomModal(false);
      setNewRoomName('');
      setFeedback(`"${created.name}" otaq növü yaradıldı və təqvimi açıldı!`);
    } catch (err: any) {
      console.error('Create room error:', err);
      alert('Otaq yaradılarkən xəta baş verdi.');
    } finally {
      setCreatingRoom(false);
    }
  };

  if (loading) {
    return (
      <div className="vendor-calendar-page" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Loader2 size={40} className="animate-spin" color="#2563eb" />
        <span style={{ marginTop: 12, color: '#64748b', fontWeight: 600 }}>Təqvim və otaq inventarı yüklənir...</span>
      </div>
    );
  }

  return (
    <div className="vendor-calendar-page">
      {/* 1. Page Header */}
      <div className="vendor-hotel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/hotels" className="vendor-hotel-btn-secondary" style={{ padding: '10px 14px' }}>
            <ArrowLeft size={16} />
            <span>Otellərə Qayıt</span>
          </Link>
          <div className="vendor-hotel-title-wrap">
            <h1>Otaq Fondu Təqvimi və Smart Yield İdarəetməsi</h1>
            <p><strong>{hotel?.name}</strong> — 30 günlük otaq inventarı, dinamik tariflər və satış bloklama matrisi</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="vendor-hotel-btn-primary"
            onClick={() => setShowAddRoomModal(true)}
          >
            <Plus size={18} />
            <span>Yeni Otaq Növü Əlavə Et</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="vendor-calendar-feedback-bar">
          <CheckCircle2 size={18} />
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', color: '#16a34a' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. Room Switcher Tabs */}
      {rooms.length > 0 ? (
        <div className="vendor-calendar-room-tabs-wrap">
          <div className="vendor-calendar-room-tabs">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className={`vendor-room-tab-btn ${selectedRoomId === room.id ? 'active' : ''}`}
                onClick={() => setSelectedRoomId(room.id)}
              >
                <BedDouble size={16} />
                <span>{room.name}</span>
                <span className="vendor-room-tab-price">{room.basePrice} ₼/gecə</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="vendor-calendar-empty-rooms">
          <Building size={32} color="#d97706" />
          <div>
            <h4>Bu otel üçün hələ otaq kateqoriyası yoxdur</h4>
            <p>Satış həyata keçirmək və təqvimi idarə etmək üçün ilk otaq növünüzü əlavə edin.</p>
          </div>
          <button
            type="button"
            className="vendor-hotel-btn-primary"
            onClick={() => setShowAddRoomModal(true)}
            style={{ marginLeft: 'auto' }}
          >
            <Plus size={16} />
            <span>İlk Otağı Əlavə Et</span>
          </button>
        </div>
      )}

      {selectedRoom && (
        <>
          {/* 3. Smart Yield Quick Actions Bar */}
          <div className="vendor-smart-yield-presets-card">
            <div className="vendor-presets-header">
              <Sparkles size={18} color="#2563eb" />
              <span>Smart Yield Sürətli Əməliyyatlar:</span>
            </div>

            <div className="vendor-presets-buttons">
              <button
                type="button"
                disabled={updating}
                onClick={handleApplyWeekendSurge}
                className="vendor-preset-btn weekend"
                title="Bütün Cümə və Şənbə günlərinin qiymətinə +20% artım tətbiq et"
              >
                <TrendingUp size={14} />
                <span>Həftəsonu Artımı (+20%)</span>
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={handleApplyLastMinuteDiscount}
                className="vendor-preset-btn discount"
                title="Yaxın 4 gün üçün -15% son dəqiqə endirimi təyin et"
              >
                <Percent size={14} />
                <span>Son Dəqiqə Endirimi (-15%)</span>
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={handleResetToBasePrice}
                className="vendor-preset-btn reset"
                title="Bütün xüsusi qiymətləri sıfırlayıb standart baza qiymətinə qaytar"
              >
                <RefreshCw size={14} />
                <span>Baza Qiymətə Sıfırla</span>
              </button>
            </div>
          </div>

          {/* 4. Bulk Control Panel */}
          <form onSubmit={handleApplyBulk} className="vendor-calendar-bulk-panel">
            <div className="vendor-bulk-heading">
              <Sliders size={18} color="#2563eb" />
              <span>Tarix Aralığı üzrə Kütləvi Yeniləmə ({selectedRoom.name})</span>
            </div>

            <div className="vendor-bulk-controls-row">
              <div className="vendor-bulk-field">
                <label>Başlanğıc Tarixi</label>
                <input
                  type="date"
                  required
                  value={bulkStartDate}
                  onChange={(e) => setBulkStartDate(e.target.value)}
                />
              </div>

              <div className="vendor-bulk-field">
                <label>Son Tarix</label>
                <input
                  type="date"
                  required
                  value={bulkEndDate}
                  onChange={(e) => setBulkEndDate(e.target.value)}
                />
              </div>

              <div className="vendor-bulk-field">
                <label>Qiymət (AZN / gecə)</label>
                <input
                  type="number"
                  placeholder={`Baza: ${selectedRoom.basePrice}`}
                  value={overridePrice}
                  onChange={(e) => setOverridePrice(e.target.value)}
                />
              </div>

              <div className="vendor-bulk-field">
                <label>Otaq Sayı (İnventar)</label>
                <input
                  type="number"
                  placeholder={`Maks: ${selectedRoom.totalRoomsCount}`}
                  value={overrideCount}
                  onChange={(e) => setOverrideCount(e.target.value)}
                />
              </div>

              <div className="vendor-bulk-field" style={{ justifyContent: 'center' }}>
                <label className="vendor-checkbox-label">
                  <input
                    type="checkbox"
                    checked={bulkBlock}
                    onChange={(e) => setBulkBlock(e.target.checked)}
                  />
                  <span>Tarixləri Blokla (Stop-Sale)</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="vendor-hotel-btn-primary"
                style={{ padding: '10px 18px' }}
              >
                {updating ? 'Yenilənir...' : 'Kütləvi Tətbiq Et'}
              </button>
            </div>
          </form>

          {/* 5. 30-Day Matrix Table */}
          <div className="vendor-calendar-matrix-card">
            <table className="vendor-matrix-table">
              <thead>
                <tr>
                  <th>Tarix və Gün</th>
                  <th>Dinamik Qiymət</th>
                  <th>Smart Yield Rejimi</th>
                  <th>Mövcud Otaq Sayı</th>
                  <th>Satış Statusu</th>
                  <th style={{ textAlign: 'right' }}>Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => {
                  const dObj = new Date(row.date);
                  const dayNum = dObj.getDay();
                  const isWeekend = dayNum === 5 || dayNum === 6; // Friday & Saturday
                  const azDay = AZ_DAYS[row.dayOfWeek] || row.dayOfWeek;

                  return (
                    <tr
                      key={row.date}
                      className={`vendor-matrix-row ${row.isBlocked ? 'blocked' : ''}`}
                    >
                      <td>
                        <div className="vendor-matrix-date-col">
                          <CalendarIcon size={15} color="#64748b" />
                          <span>{row.date}</span>
                          <span className={`vendor-matrix-day-badge ${isWeekend ? 'weekend' : ''}`}>
                            {azDay}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="vendor-matrix-price-wrap">
                          <span className="vendor-matrix-effective-price">
                            {row.effectivePrice} ₼
                          </span>
                          {row.effectivePrice !== row.basePrice && (
                            <span className="vendor-matrix-base-price">
                              {row.basePrice} ₼
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        {row.isSurge && (
                          <span className="vendor-yield-surge-tag surge">
                            <TrendingUp size={12} />
                            <span>Yüksək Tələbat Artımı</span>
                          </span>
                        )}
                        {row.isDiscount && (
                          <span className="vendor-yield-surge-tag discount">
                            <Percent size={12} />
                            <span>Son Dəqiqə Fürsəti (-15%)</span>
                          </span>
                        )}
                        {!row.isSurge && !row.isDiscount && isWeekend && (
                          <span className="vendor-yield-surge-tag weekend">
                            <Zap size={12} />
                            <span>Həftəsonu Tarifi</span>
                          </span>
                        )}
                        {!row.isSurge && !row.isDiscount && !isWeekend && (
                          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Standart Tarif</span>
                        )}
                      </td>

                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 4 }}>
                          {row.availableCount} / {row.totalRoomsCount} Otaq
                        </div>
                        <div className="vendor-inventory-bar-wrap">
                          <div
                            className="vendor-inventory-bar-fill"
                            style={{
                              width: `${Math.min(100, (row.availableCount / (row.totalRoomsCount || 1)) * 100)}%`,
                              backgroundColor: row.availableCount <= 2 ? '#ef4444' : row.availableCount <= 5 ? '#f59e0b' : '#16a34a',
                            }}
                          />
                        </div>
                      </td>

                      <td>
                        {row.isBlocked ? (
                          <span className="vendor-status-badge blocked">
                            <Lock size={12} />
                            <span>Bağlı (Stop-Sale)</span>
                          </span>
                        ) : (
                          <span className="vendor-status-badge active">
                            <CheckCircle2 size={12} />
                            <span>Satışda Açıq</span>
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleOpenDayEdit(row)}
                            className="vendor-cell-action-btn edit"
                            title="Bu günün qiymət və otaq sayını fərdi dəyiş"
                          >
                            <Edit2 size={13} />
                            <span>Dəyiş</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleBlockDay(row.date, row.isBlocked)}
                            className={`vendor-cell-action-btn ${row.isBlocked ? 'unlock' : 'lock'}`}
                            title={row.isBlocked ? 'Satışı aç' : 'Satışı bağla'}
                          >
                            {row.isBlocked ? (
                              <>
                                <Unlock size={13} color="#16a34a" />
                                <span>Aç</span>
                              </>
                            ) : (
                              <>
                                <Lock size={13} color="#dc2626" />
                                <span>Blokla</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 6. Inline Single Day Edit Modal */}
      {editingDay && (
        <div className="vendor-modal-backdrop">
          <div className="vendor-modal-card">
            <div className="vendor-modal-header">
              <h3>Günün Tarifini Dəyiş: {editingDay.date}</h3>
              <button type="button" onClick={() => setEditingDay(null)} className="vendor-modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDayEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="vendor-form-field">
                <label>Gecəlik Qiymət (AZN) *</label>
                <input
                  type="number"
                  required
                  value={dayPrice}
                  onChange={(e) => setDayPrice(e.target.value)}
                />
              </div>

              <div className="vendor-form-field">
                <label>Satışda Olan Otaq Sayı *</label>
                <input
                  type="number"
                  required
                  value={dayCount}
                  onChange={(e) => setDayCount(e.target.value)}
                />
              </div>

              <div className="vendor-form-field">
                <label className="vendor-checkbox-label">
                  <input
                    type="checkbox"
                    checked={dayBlocked}
                    onChange={(e) => setDayBlocked(e.target.checked)}
                  />
                  <span>Bu tarixi tamamilə blokla (Stop-Sale)</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  className="vendor-hotel-btn-secondary"
                  onClick={() => setEditingDay(null)}
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  disabled={savingDay}
                  className="vendor-hotel-btn-primary"
                >
                  {savingDay ? 'Yadda saxlanılır...' : 'Təsdiqlə'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Quick Add Room Modal */}
      {showAddRoomModal && (
        <div className="vendor-modal-backdrop">
          <div className="vendor-modal-card">
            <div className="vendor-modal-header">
              <h3>Yeni Otaq Növü Əlavə Et</h3>
              <button type="button" onClick={() => setShowAddRoomModal(false)} className="vendor-modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewRoom} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="vendor-form-field">
                <label>Otaq Kateqoriyası və Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="məs: Family Suite Balkonlu Panorama"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="vendor-form-field">
                  <label>Çarpayı Növü</label>
                  <select value={newRoomBedType} onChange={(e) => setNewRoomBedType(e.target.value)}>
                    <option value="DOUBLE">1 Geniş İkinefərlik (Double King)</option>
                    <option value="TWIN">2 Təknefərlik (Twin)</option>
                    <option value="KING">King Size Lüks</option>
                    <option value="FAMILY">Ailəvi Çarpayılar</option>
                  </select>
                </div>

                <div className="vendor-form-field">
                  <label>Qidalanma Planı</label>
                  <select value={newRoomMealPlan} onChange={(e) => setNewRoomMealPlan(e.target.value)}>
                    <option value="BB">Səhər yeməyi daxil (BB)</option>
                    <option value="HB">Yarım pansion (HB)</option>
                    <option value="FB">Tam pansion (FB)</option>
                    <option value="ALL_INCLUSIVE">Hər şey daxil (AI)</option>
                    <option value="RO">Yalnız otaq (RO)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="vendor-form-field">
                  <label>Baza Qiyməti (AZN / gecə) *</label>
                  <input
                    type="number"
                    required
                    value={newRoomBasePrice}
                    onChange={(e) => setNewRoomBasePrice(Number(e.target.value))}
                  />
                </div>

                <div className="vendor-form-field">
                  <label>Ümumi Otaq Sayı (İnventar) *</label>
                  <input
                    type="number"
                    required
                    value={newRoomTotalCount}
                    onChange={(e) => setNewRoomTotalCount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  className="vendor-hotel-btn-secondary"
                  onClick={() => setShowAddRoomModal(false)}
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  disabled={creatingRoom}
                  className="vendor-hotel-btn-primary"
                >
                  {creatingRoom ? 'Yaradılır...' : 'Otağı Yarat və Təqvim Aç'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
