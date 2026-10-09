import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Building,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BedDouble
} from 'lucide-react';
import { vendorHotelApi, CreateHotelPayload, CreateRoomPayload } from '../../api/vendorHotelApi';
import { Hotel } from '@toursales/types';
import './VendorHotelFormPage.css';

const DEFAULT_AMENITIES = [
  'Açıq Hovuz',
  'Bağlı Hovuz',
  'SPA & Sağlamlıq Mərkəzi',
  'Pulsuz Yüksəksürətli Wi-Fi',
  'Restoran & Bar',
  'Qapalı / Açıq Parkinq',
  'Fitnes və İdman Zalı',
  'Uşaq Əyləncə Mərkəzi',
  'Konfrans və Tədbir Zalı',
  'Kondisioner və Smart TV',
  'Dağ Mənzərəsi',
  'Otaq Xidməti (Room Service)'
];

export const VendorHotelFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('RESORT');
  const [starRating, setStarRating] = useState(5);
  const [city, setCity] = useState('Qəbələ');
  const [region, setRegion] = useState('Qəbələ rayonu');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('12:00');
  const [amenities, setAmenities] = useState<string[]>(['Pulsuz Yüksəksürətli Wi-Fi', 'Restoran & Bar', 'Açıq Hovuz']);
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
  ]);

  // FinTech & Smart Yield Policies
  const [allowDeposit, setAllowDeposit] = useState(true);
  const [allowInstallments, setAllowInstallments] = useState(true);
  const [dynamicPricingActive, setDynamicPricingActive] = useState(true);

  // New Room Modal State (if editing existing hotel)
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomName, setRoomName] = useState('Deluxe Dağ Mənzərəli Otaq');
  const [roomBedType, setRoomBedType] = useState('DOUBLE');
  const [roomMealPlan, setRoomMealPlan] = useState('BB');
  const [roomCapacityAdults, setRoomCapacityAdults] = useState(2);
  const [roomCapacityChildren, setRoomCapacityChildren] = useState(1);
  const [roomBasePrice, setRoomBasePrice] = useState(160);
  const [roomTotalCount, setRoomTotalCount] = useState(10);
  const [addingRoom, setAddingRoom] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      const loadHotel = async () => {
        try {
          const hotel = await vendorHotelApi.getHotelById(id);
          if (hotel) {
            setName(hotel.name);
            setCategory(hotel.category || 'RESORT');
            setStarRating(hotel.starRating || 5);
            setCity(hotel.city || 'Qəbələ');
            setRegion(hotel.region || '');
            setAddress(hotel.address || '');
            setDescription(hotel.description || '');
            setCheckInTime(hotel.checkInTime || '14:00');
            setCheckOutTime(hotel.checkOutTime || '12:00');
            setAmenities(hotel.amenities || []);
            setImages(hotel.images && hotel.images.length > 0 ? hotel.images : []);
            setAllowDeposit(Boolean(hotel.allowDeposit));
            setAllowInstallments(Boolean(hotel.allowInstallments));
            setDynamicPricingActive(Boolean(hotel.dynamicPricingActive));
          }
        } catch (err: any) {
          console.error('Failed to load hotel:', err);
          setError('Otel məlumatları yüklənərkən xəta baş verdi.');
        } finally {
          setLoading(false);
        }
      };
      loadHotel();
    }
  }, [isEdit, id]);

  const toggleAmenity = (item: string) => {
    if (amenities.includes(item)) {
      setAmenities(amenities.filter((a) => a !== item));
    } else {
      setAmenities([...amenities, item]);
    }
  };

  const addImage = () => {
    if (imageUrl.trim()) {
      setImages([...images, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSaveHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim() || !address.trim()) {
      setError('Zəhmət olmasa tələb olunan sahələri doldurun.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload: CreateHotelPayload = {
        name: name.trim(),
        category,
        starRating: Number(starRating),
        city: city.trim(),
        region: region.trim() || undefined,
        address: address.trim(),
        description: description.trim(),
        checkInTime,
        checkOutTime,
        amenities,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'],
        allowDeposit,
        allowInstallments,
        dynamicPricingActive,
      };

      if (isEdit && id) {
        await vendorHotelApi.updateHotel(id, payload);
        setSuccessMsg('Otel məlumatları uğurla yeniləndi!');
      } else {
        const created = await vendorHotelApi.createHotel(payload);
        setSuccessMsg('Otel uğurla yaradıldı!');
        setTimeout(() => {
          navigate(`/hotels/${created.id}/calendar`);
        }, 1200);
      }
    } catch (err: any) {
      console.error('Save hotel error:', err);
      setError(err.response?.data?.message || 'Yadda saxlanılarkən xəta baş verdi.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setAddingRoom(true);
    try {
      const payload: CreateRoomPayload = {
        name: roomName,
        bedType: roomBedType,
        mealPlan: roomMealPlan,
        capacityAdults: roomCapacityAdults,
        capacityChildren: roomCapacityChildren,
        basePrice: roomBasePrice,
        totalRoomsCount: roomTotalCount,
        amenities: ['Kondisioner', 'Smart TV', 'Wi-Fi'],
        images: images.slice(0, 2),
      };

      await vendorHotelApi.createRoom(id, payload);
      setShowRoomModal(false);
      setSuccessMsg('Yeni otaq növü və 30 günlük təqvim matrisi yaradıldı!');
      setTimeout(() => {
        navigate(`/hotels/${id}/calendar`);
      }, 1000);
    } catch (err: any) {
      console.error('Add room error:', err);
      alert('Otaq əlavə edilərkən xəta baş verdi.');
    } finally {
      setAddingRoom(false);
    }
  };

  if (loading) {
    return (
      <div className="vendor-hotel-page" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <Loader2 size={36} className="animate-spin" color="#2563eb" />
      </div>
    );
  }

  return (
    <div className="vendor-hotel-page">
      {/* Header */}
      <div className="vendor-hotel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/hotels" className="vendor-hotel-btn-secondary" style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} />
            <span>Geri</span>
          </Link>
          <div className="vendor-hotel-title-wrap">
            <h1>{isEdit ? 'Otel Məlumatlarına Düzəliş' : 'Yeni Otel Qeydiyyatı'}</h1>
            <p>Qonaqlama parametrləri, FinTech siyasətləri və Smart Yield konfiqurasiyası</p>
          </div>
        </div>

        {isEdit && (
          <button
            type="button"
            className="vendor-hotel-btn-primary"
            onClick={() => setShowRoomModal(true)}
          >
            <BedDouble size={18} />
            <span>+ Yeni Otaq Növü Əlavə Et</span>
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveHotel} className="vendor-hotel-form-card">
        {/* Section 1: Basic Info */}
        <div className="vendor-form-section">
          <h2 className="vendor-form-section-title">
            <Building size={20} color="#2563eb" />
            <span>Əsas Otel Parametrləri</span>
          </h2>

          <div className="vendor-form-grid-2">
            <div className="vendor-form-field">
              <label>Otel Adı *</label>
              <input
                type="text"
                required
                placeholder="Məs: Qafqaz Riverside Resort & Spa"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="vendor-form-field">
              <label>Kateqoriya *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="LUXURY">Lüks və Premium</option>
                <option value="RESORT">Kurort və Dağ İstirahəti</option>
                <option value="BOUTIQUE">Butik Otel</option>
                <option value="SPA">Sağlamlıq və SPA</option>
                <option value="BUSINESS">Biznes və Şəhər</option>
                <option value="BUDGET">Büdcəli / Ailəvi</option>
              </select>
            </div>

            <div className="vendor-form-field">
              <label>Ulduz Dərəcəsi</label>
              <select value={starRating} onChange={(e) => setStarRating(Number(e.target.value))}>
                <option value={5}>5 Ulduzlu</option>
                <option value={4}>4 Ulduzlu</option>
                <option value={3}>3 Ulduzlu</option>
                <option value={2}>2 Ulduzlu</option>
              </select>
            </div>

            <div className="vendor-form-field">
              <label>Şəhər / Rayon *</label>
              <input
                type="text"
                required
                placeholder="Məs: Qəbələ"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="vendor-form-field" style={{ gridColumn: 'span 2' }}>
              <label>Dəqiq Ünvan və ya Lokasiya *</label>
              <input
                type="text"
                required
                placeholder="Məs: Qəbələ şəhəri, Dəmiraparan çayının sahili"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="vendor-form-field">
              <label>Giriş Vaxtı (Check-in)</label>
              <input
                type="text"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
              />
            </div>

            <div className="vendor-form-field">
              <label>Çıxış Vaxtı (Check-out)</label>
              <input
                type="text"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              />
            </div>

            <div className="vendor-form-field" style={{ gridColumn: 'span 2' }}>
              <label>Otel Təsviri</label>
              <textarea
                rows={3}
                placeholder="Otel haqqında ətraflı məlumat..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Amenities */}
        <div className="vendor-form-section">
          <h2 className="vendor-form-section-title">
            <span>Otel Təminatları və Xidmətlər</span>
          </h2>

          <div className="vendor-amenities-selector">
            {DEFAULT_AMENITIES.map((am) => (
              <button
                type="button"
                key={am}
                className={`vendor-amenity-chip ${amenities.includes(am) ? 'active' : ''}`}
                onClick={() => toggleAmenity(am)}
              >
                {am}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Smart Yield & FinTech Toggles */}
        <div className="vendor-form-section">
          <h2 className="vendor-form-section-title">
            <span>Smart Yield və FinTech Ödəniş Siyasətləri</span>
          </h2>

          <div className="vendor-toggle-group">
            <label className="vendor-toggle-card">
              <input
                type="checkbox"
                checked={dynamicPricingActive}
                onChange={(e) => setDynamicPricingActive(e.target.checked)}
              />
              <div>
                <strong>Smart Yield Dinamik Qiymətləndirmə</strong>
                <p>Tələbat yüksək olduqda (+15%), son 48 saatda (-15%) və həftəsonu (+10%) avtomatik tənzimləmə</p>
              </div>
            </label>

            <label className="vendor-toggle-card">
              <input
                type="checkbox"
                checked={allowDeposit}
                onChange={(e) => setAllowDeposit(e.target.checked)}
              />
              <div>
                <strong>30% İlkin Depozit Modeli</strong>
                <p>Müştərilər 30% depozitlə bronlaşdırır, qalan 70% qalıq linklə və ya oteldə ödənilir</p>
              </div>
            </label>

            <label className="vendor-toggle-card">
              <input
                type="checkbox"
                checked={allowInstallments}
                onChange={(e) => setAllowInstallments(e.target.checked)}
              />
              <div>
                <strong>Birkart və Tamkart Taksit İnteqrasiyası</strong>
                <p>Müştərilər 3, 6 və ya 12 ay faizsiz taksitlə nağdsız ödəniş edə bilərlər</p>
              </div>
            </label>
          </div>
        </div>

        <button type="submit" disabled={saving} className="vendor-hotel-btn-primary" style={{ alignSelf: 'flex-start', padding: '14px 28px' }}>
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Yadda saxlanılır...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>{isEdit ? 'Dəyişiklikləri Saxla' : 'Oteli Qeydiyyatdan Keçir'}</span>
            </>
          )}
        </button>
      </form>

      {/* Add Room Modal */}
      {showRoomModal && (
        <div className="vendor-modal-backdrop">
          <div className="vendor-modal-card">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 16 }}>Yeni Otaq Növü Əlavə Et</h2>

            <form onSubmit={handleAddRoom} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="vendor-form-field">
                <label>Otaq Adı *</label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="vendor-form-field">
                  <label>Çarpayı Növü</label>
                  <select value={roomBedType} onChange={(e) => setRoomBedType(e.target.value)}>
                    <option value="DOUBLE">1 Geniş İkinefərlik (Double)</option>
                    <option value="TWIN">2 Təknefərlik (Twin)</option>
                    <option value="KING">King Size</option>
                    <option value="FAMILY">Ailəvi (Family)</option>
                  </select>
                </div>

                <div className="vendor-form-field">
                  <label>Qidalanma Planı</label>
                  <select value={roomMealPlan} onChange={(e) => setRoomMealPlan(e.target.value)}>
                    <option value="BB">Səhər yeməyi (BB)</option>
                    <option value="HB">Yarım pansion (HB)</option>
                    <option value="FB">Tam pansion (FB)</option>
                    <option value="ALL_INCLUSIVE">Hər şey daxil</option>
                    <option value="RO">Qidalanma daxil deyil (RO)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="vendor-form-field">
                  <label>Baza Qiyməti (AZN / gecə) *</label>
                  <input
                    type="number"
                    required
                    value={roomBasePrice}
                    onChange={(e) => setRoomBasePrice(Number(e.target.value))}
                  />
                </div>

                <div className="vendor-form-field">
                  <label>Ümumi Otaq Sayı *</label>
                  <input
                    type="number"
                    required
                    value={roomTotalCount}
                    onChange={(e) => setRoomTotalCount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  className="vendor-hotel-btn-secondary"
                  onClick={() => setShowRoomModal(false)}
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  disabled={addingRoom}
                  className="vendor-hotel-btn-primary"
                >
                  {addingRoom ? 'Əlavə edilir...' : 'Otağı Yarat və Təqvim Aç'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
