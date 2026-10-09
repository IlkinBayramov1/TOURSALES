import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Car,
  Hotel,
  Coffee,
  Compass,
  Check,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Info,
  ShieldCheck,
  Send,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { customTourApi } from '../../api/customTourApi';
import {
  CustomTourType,
  CustomTourVehicleType,
  CustomHotelPreference,
  CustomMealPreference,
  CustomTourEstimateResponse
} from '@toursales/types';
import './CustomTourWizardPage.css';

interface RegionOption {
  name: string;
  sub: string;
  image: string;
}

const REGIONS: RegionOption[] = [
  {
    name: 'Qəbələ',
    sub: 'Tufandağ, Nohurgöl, Şəlalə',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Şəki',
    sub: 'Xan Sarayı, Karvansaray, Şirniyyat',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Quba',
    sub: 'Qəçrəş meşəsi, Qırmızı Qəsəbə',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Şahdağ',
    sub: 'Qusar, Qış və Yay Dağ Kurortu',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Lənkəran & Lerik',
    sub: 'Talış dağları, Sitrus bağı, Termal su',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'İsmayıllı & Lahıc',
    sub: 'Qədim sənətkarlıq, Asma körpü',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Şuşa & Xankəndi',
    sub: 'Cıdır düzü, Gövhər Ağa məscidi',
    image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Naxçıvan',
    sub: 'Əlincə qalası, Duzdağ, Möminə Xatun',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=500&q=80',
  },
];

const VEHICLES = [
  {
    type: 'SEDAN_4' as CustomTourVehicleType,
    title: 'Komfortlu Sedan',
    desc: '1-3 nəfər • Baqaj tutumu 2 çanta • Kondisioner',
    seats: '1-3 sərnişin',
  },
  {
    type: 'MINIVAN_MERCEDES_VITO_7' as CustomTourVehicleType,
    title: 'Mercedes Vito VIP Minivan (Ən Çox Seçilən)',
    desc: '4-7 nəfər • Dəri salon • Wi-Fi • Soyuducu • Böyük baqaj',
    seats: '4-7 sərnişin',
  },
  {
    type: 'MINIBUS_MERCEDES_SPRINTER_18' as CustomTourVehicleType,
    title: 'Mercedes Sprinter Minibus',
    desc: '8-18 nəfər • Hündür tavan • Mikrofon sistemi • Kondisioner',
    seats: '8-18 sərnişin',
  },
  {
    type: 'BUS_NEOPLAN_50' as CustomTourVehicleType,
    title: 'Turist Avtobusu (Neoplan / Travego)',
    desc: '20-50 nəfər • Korporativ və məktəbli qrupları üçün tam audio-video',
    seats: '20-50 sərnişin',
  },
  {
    type: 'OWN_TRANSPORT' as CustomTourVehicleType,
    title: 'Öz Şəxsi Avtomobilimiz Var',
    desc: 'Nəqliyyat xidməti tələb olunmur, yalnız otel və bələdçi təklifləri',
    seats: 'Nəqliyyatsız',
  },
];

const ATTRACTIONS = [
  'Tufandağ Kanat',
  'Şahdağ Roller Coaster',
  'Şəki Xan Sarayı',
  'Qəbələ Atçılıq',
  'Nohurgöl Qayıq',
  'Atəşgah & Yanardağ',
  'Qəbələnd Əyləncə',
  'Lənkəran Çay Plantasiyası',
];

export const CustomTourWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [tourType, setTourType] = useState<CustomTourType>('FAMILY');
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(['Qəbələ']);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 9);
    return d.toISOString().split('T')[0];
  });

  const [adultsCount, setAdultsCount] = useState(4);
  const [childrenCount, setChildrenCount] = useState(1);
  const [vehicleType, setVehicleType] = useState<CustomTourVehicleType>('MINIVAN_MERCEDES_VITO_7');

  const [hotelPreference, setHotelPreference] = useState<CustomHotelPreference>('HOTEL_4_STAR');
  const [mealPreference, setMealPreference] = useState<CustomMealPreference>('HALF_BOARD');
  const [guideRequired, setGuideRequired] = useState(true);
  const [guideLanguage, setGuideLanguage] = useState('AZ');
  const [selectedAttractions, setSelectedAttractions] = useState<string[]>([
    'Tufandağ Kanat',
    'Şəki Xan Sarayı',
  ]);

  const [title, setTitle] = useState('');
  const [budgetMin, setBudgetMin] = useState<string>('600');
  const [budgetMax, setBudgetMax] = useState<string>('1200');
  const [specialNotes, setSpecialNotes] = useState('');
  const [expiresHours, setExpiresHours] = useState(48);

  // Estimate state
  const [estimate, setEstimate] = useState<CustomTourEstimateResponse | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Calculate live estimate
  const updateEstimate = useCallback(async () => {
    setEstimateLoading(true);
    try {
      const res = await customTourApi.calculateEstimate({
        startDate,
        endDate,
        adultsCount,
        childrenCount,
        vehicleType,
        hotelPreference,
        mealPreference,
        guideRequired,
        guideLanguage,
        attractions: selectedAttractions,
      });
      setEstimate(res);
    } catch (err) {
      console.error('Failed to estimate price:', err);
    } finally {
      setEstimateLoading(false);
    }
  }, [
    startDate,
    endDate,
    adultsCount,
    childrenCount,
    vehicleType,
    hotelPreference,
    mealPreference,
    guideRequired,
    guideLanguage,
    selectedAttractions,
  ]);

  useEffect(() => {
    updateEstimate();
  }, [updateEstimate]);

  const toggleDestination = (dest: string) => {
    if (selectedDestinations.includes(dest)) {
      if (selectedDestinations.length > 1) {
        setSelectedDestinations(selectedDestinations.filter((d) => d !== dest));
      }
    } else {
      setSelectedDestinations([...selectedDestinations, dest]);
    }
  };

  const toggleAttraction = (attr: string) => {
    if (selectedAttractions.includes(attr)) {
      setSelectedAttractions(selectedAttractions.filter((a) => a !== attr));
    } else {
      setSelectedAttractions([...selectedAttractions, attr]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await customTourApi.createRequest({
        type: tourType,
        title: title.trim() || `${selectedDestinations.join(' & ')} Fərdi Səyahət`,
        destinations: selectedDestinations,
        startDate,
        endDate,
        adultsCount,
        childrenCount,
        vehicleType,
        hotelPreference,
        mealPreference,
        guideRequired,
        guideLanguage,
        attractions: selectedAttractions,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        specialNotes,
        expiresHours,
      });
      navigate(`/custom-tour/${created.id}`);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Sorğu göndərilərkən xəta baş verdi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="custom-wizard-page">
      {/* Header */}
      <div className="custom-wizard-header">
        <h1 className="custom-wizard-title">Öz Səyahətini Quraşdır</h1>
        <p className="custom-wizard-subtitle">
          İstədiyiniz marşrut, nəqliyyat və qonaqlamanı seçin. Təsdiqlənmiş tərəfdaş turizm şirkətləri ən
          sərfəli qiymət və proqram təkliflərini göndərsin!
        </p>
      </div>

      {/* Stepper Header */}
      <div className="custom-stepper">
        <div
          className={`custom-step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}
          onClick={() => setCurrentStep(1)}
        >
          <div className="custom-step-circle">1</div>
          <span>Format & Marşrut</span>
        </div>
        <div className="custom-stepper-line" />
        <div
          className={`custom-step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}
          onClick={() => setCurrentStep(2)}
        >
          <div className="custom-step-circle">2</div>
          <span>Nəqliyyat & Sərnişin</span>
        </div>
        <div className="custom-stepper-line" />
        <div
          className={`custom-step-item ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`}
          onClick={() => setCurrentStep(3)}
        >
          <div className="custom-step-circle">3</div>
          <span>Qonaqlama & Xidmətlər</span>
        </div>
        <div className="custom-stepper-line" />
        <div
          className={`custom-step-item ${currentStep === 4 ? 'active' : ''}`}
          onClick={() => setCurrentStep(4)}
        >
          <div className="custom-step-circle">4</div>
          <span>Büdcə & Tender</span>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="custom-wizard-layout">
        {/* Left Column: Current Step Content */}
        <div className="custom-step-card">
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div>
              <div className="custom-section-title">
                <Compass size={22} color="#2563eb" />
                <span>1. Səyahət Növü və İstiqamətlər</span>
              </div>
              <p className="custom-section-desc">
                Kimlərlə səyahət edəcəksiniz və hansı bölgələrə baş çəkmək istərdiniz?
              </p>

              {/* Type Select */}
              <label className="custom-input-label">Səyahət Formatı</label>
              <div className="custom-type-grid">
                {[
                  { type: 'FAMILY', label: 'Ailəvi İstirahət' },
                  { type: 'FRIENDS_GROUP', label: 'Dostlar Qrupu' },
                  { type: 'CORPORATE', label: 'Korporativ / Təlim' },
                  { type: 'INDIVIDUAL', label: 'Fərdi / Cütlük' },
                  { type: 'SCHOOL_STUDENT', label: 'Məktəbli / Tələbə' },
                ].map(item => (
                  <div
                    key={item.type}
                    className={`custom-type-card ${tourType === item.type ? 'selected' : ''}`}
                    onClick={() => setTourType(item.type as CustomTourType)}
                  >
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Destinations Grid */}
              <label className="custom-input-label">
                Bölgələr (Birdən çox seçə bilərsiniz)
              </label>
              <div className="custom-dest-grid">
                {REGIONS.map(reg => {
                  const isSelected = selectedDestinations.includes(reg.name);
                  return (
                    <div
                      key={reg.name}
                      className={`custom-dest-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleDestination(reg.name)}
                    >
                      <img src={reg.image} alt={reg.name} className="custom-dest-img" />
                      <div className="custom-dest-overlay">
                        <span className="custom-dest-name">{reg.name}</span>
                        <span className="custom-dest-sub">{reg.sub}</span>
                      </div>
                      {isSelected && (
                        <div className="custom-dest-check">
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dates */}
              <div className="custom-dates-row">
                <div>
                  <label className="custom-input-label">Gediş Tarixi</label>
                  <input
                    type="date"
                    className="custom-input-field"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="custom-input-label">Dönüş Tarixi</label>
                  <input
                    type="date"
                    className="custom-input-field"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="custom-wizard-btns">
                <div />
                <button
                  type="button"
                  className="custom-btn-next"
                  onClick={() => setCurrentStep(2)}
                >
                  <span>Nəqliyyat Seçiminə Keç</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div>
              <div className="custom-section-title">
                <Car size={22} color="#2563eb" />
                <span>2. Sərnişin Heyəti və Nəqliyyat Vasitəsi</span>
              </div>
              <p className="custom-section-desc">
                Qrupda neçə nəfər olacaq və hansı komfortda nəqliyyat istəyirsiniz?
              </p>

              {/* Counters */}
              <div className="custom-passengers-grid">
                <div className="custom-counter-box">
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Böyüklər (12+ yaş)</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Əsas oturacaqlar</div>
                  </div>
                  <div className="custom-counter-actions">
                    <button
                      type="button"
                      className="custom-counter-btn"
                      onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', minWidth: 24, textAlign: 'center' }}>
                      {adultsCount}
                    </span>
                    <button
                      type="button"
                      className="custom-counter-btn"
                      onClick={() => setAdultsCount(adultsCount + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="custom-counter-box">
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Uşaqlar (0-11 yaş)</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Endirimli yerlər</div>
                  </div>
                  <div className="custom-counter-actions">
                    <button
                      type="button"
                      className="custom-counter-btn"
                      onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', minWidth: 24, textAlign: 'center' }}>
                      {childrenCount}
                    </span>
                    <button
                      type="button"
                      className="custom-counter-btn"
                      onClick={() => setChildrenCount(childrenCount + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Vehicle Options */}
              <label className="custom-input-label">Nəqliyyat Növü</label>
              <div className="custom-vehicles-grid">
                {VEHICLES.map(v => {
                  const isSelected = vehicleType === v.type;
                  return (
                    <div
                      key={v.type}
                      className={`custom-vehicle-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setVehicleType(v.type)}
                    >
                      <div className="custom-vehicle-left">
                        <div className="custom-vehicle-icon-wrap">
                          <Car size={24} />
                        </div>
                        <div>
                          <div className="custom-vehicle-title">{v.title}</div>
                          <div className="custom-vehicle-desc">{v.desc}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? '#2563eb' : '#64748b' }}>
                        {v.seats}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="custom-wizard-btns">
                <button
                  type="button"
                  className="custom-btn-back"
                  onClick={() => setCurrentStep(1)}
                >
                  <ArrowLeft size={16} />
                  <span>Geri</span>
                </button>
                <button
                  type="button"
                  className="custom-btn-next"
                  onClick={() => setCurrentStep(3)}
                >
                  <span>Qonaqlama Seçiminə Keç</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div>
              <div className="custom-section-title">
                <Hotel size={22} color="#2563eb" />
                <span>3. Qonaqlama, Qidalanma və Bələdçi</span>
              </div>
              <p className="custom-section-desc">
                Gecələmə səviyyəsini, menyunu və xüsusi attraksion biletlərini müəyyən edin.
              </p>

              {/* Hotel Preference */}
              <label className="custom-input-label">Otel / Qonaqlama Növü</label>
              <div className="custom-options-grid">
                {[
                  { key: 'NONE', label: 'Qonaqlamasız (1 Günlük)' },
                  { key: 'HOTEL_3_STAR', label: '3★ Rahat Otel' },
                  { key: 'HOTEL_4_STAR', label: '4★ Premium Otel & Spa' },
                  { key: 'HOTEL_5_STAR', label: '5★ Lüks Resort' },
                  { key: 'COTTAGES', label: 'A-Frame Kotteclər' },
                  { key: 'BOUTIQUE', label: 'Butik Dağ Evi' },
                ].map(opt => (
                  <div
                    key={opt.key}
                    className={`custom-option-pill ${hotelPreference === opt.key ? 'selected' : ''}`}
                    onClick={() => setHotelPreference(opt.key as CustomHotelPreference)}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>

              {/* Meal Preference */}
              <label className="custom-input-label">Qidalanma Rejimi</label>
              <div className="custom-options-grid">
                {[
                  { key: 'NONE', label: 'Yeməksiz' },
                  { key: 'BREAKFAST_ONLY', label: 'Yalnız Səhər (BB)' },
                  { key: 'HALF_BOARD', label: 'Səhər + Şam (HB)' },
                  { key: 'FULL_BOARD', label: '3 Dəfə Tam (FB)' },
                  { key: 'CORPORATE_BANQUET', label: 'Qala Banket' },
                ].map(opt => (
                  <div
                    key={opt.key}
                    className={`custom-option-pill ${mealPreference === opt.key ? 'selected' : ''}`}
                    onClick={() => setMealPreference(opt.key as CustomMealPreference)}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>

              {/* Guide Support */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  marginBottom: 24,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Peşəkar Bələdçi Dəstəyi</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Tarixi abidələr və ekskursiyalar üzrə sertifikatlı bələdçi
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <select
                    className="custom-input-field"
                    style={{ width: 'auto', padding: '6px 12px' }}
                    value={guideLanguage}
                    onChange={e => setGuideLanguage(e.target.value)}
                    disabled={!guideRequired}
                  >
                    <option value="AZ">Azərbaycan dili</option>
                    <option value="EN">İngilis dili</option>
                    <option value="RU">Rus dili</option>
                    <option value="AR">Ərəb dili</option>
                  </select>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={guideRequired}
                      onChange={e => setGuideRequired(e.target.checked)}
                      style={{ width: 18, height: 18 }}
                    />
                    <span>Lazımdır</span>
                  </label>
                </div>
              </div>

              {/* Attractions Checklist */}
              <label className="custom-input-label">
                Daxil Ediləcək Əyləncə & Attraksion Biletləri
              </label>
              <div className="custom-attractions-grid">
                {ATTRACTIONS.map(attr => {
                  const isSelected = selectedAttractions.includes(attr);
                  return (
                    <div
                      key={attr}
                      className={`custom-attraction-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleAttraction(attr)}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          border: isSelected ? 'none' : '1px solid #cbd5e1',
                          background: isSelected ? '#2563eb' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                        }}
                      >
                        {isSelected && <Check size={12} />}
                      </div>
                      <span>{attr}</span>
                    </div>
                  );
                })}
              </div>

              <div className="custom-wizard-btns">
                <button
                  type="button"
                  className="custom-btn-back"
                  onClick={() => setCurrentStep(2)}
                >
                  <ArrowLeft size={16} />
                  <span>Geri</span>
                </button>
                <button
                  type="button"
                  className="custom-btn-next"
                  onClick={() => setCurrentStep(4)}
                >
                  <span>Büdcə və Tender İcmalına Keç</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div>
              <div className="custom-section-title">
                <DollarSign size={22} color="#2563eb" />
                <span>4. Büdcə və Tenderin Başladılması</span>
              </div>
              <p className="custom-section-desc">
                Sorğunuz üçün hədəf büdcəni və tender müddətini təyin edin.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label className="custom-input-label">Səyahətin Xüsusi Başlığı (İstəyə görə)</label>
                <input
                  type="text"
                  className="custom-input-field"
                  placeholder="Məsələn: Əliyevlər Ailəsinin Qəbələ-Şəki Turu"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              {/* Budget Range */}
              <div className="custom-dates-row">
                <div>
                  <label className="custom-input-label">Gözlədiyiniz Minimum Büdcə (AZN)</label>
                  <input
                    type="number"
                    className="custom-input-field"
                    placeholder="Məsələn: 500"
                    value={budgetMin}
                    onChange={e => setBudgetMin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="custom-input-label">Maksimum Büdcə Həddi (AZN)</label>
                  <input
                    type="number"
                    className="custom-input-field"
                    placeholder="Məsələn: 900"
                    value={budgetMax}
                    onChange={e => setBudgetMax(e.target.value)}
                  />
                </div>
              </div>

              {/* Tender Expiry */}
              <div style={{ marginBottom: 16 }}>
                <label className="custom-input-label">Təkliflərin Toplanma Müddəti</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { hours: 24, label: '24 Saat (Təcili Tender)' },
                    { hours: 48, label: '48 Saat (Tövsiyə olunur)' },
                    { hours: 72, label: '72 Saat (Daha çox təklif)' },
                  ].map(item => (
                    <div
                      key={item.hours}
                      className={`custom-option-pill ${expiresHours === item.hours ? 'selected' : ''}`}
                      onClick={() => setExpiresHours(item.hours)}
                      style={{ flex: 1 }}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Notes */}
              <div style={{ marginBottom: 20 }}>
                <label className="custom-input-label">Əlavə Qeydlər və Xüsusi Arzular</label>
                <textarea
                  rows={3}
                  className="custom-input-field"
                  placeholder="Məsələn: Ad günü münasibətilə tort təşkili, dağ mənzərəli otaqlar, vegeterian menyu..."
                  value={specialNotes}
                  onChange={e => setSpecialNotes(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="custom-wizard-btns">
                <button
                  type="button"
                  className="custom-btn-back"
                  onClick={() => setCurrentStep(3)}
                >
                  <ArrowLeft size={16} />
                  <span>Geri</span>
                </button>
                <button
                  type="button"
                  className="custom-btn-next"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Tender Başladılır...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Tenderi Başlat və Təklifləri Qəbul Et</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Estimator Card */}
        <div className="custom-estimator-card">
          <div className="custom-estimator-header">
            <Sparkles size={16} />
            <span>Canlı Bazar Təxmini</span>
          </div>

          <div className="custom-estimator-price-wrap">
            {estimateLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
                <Loader2 size={24} className="animate-spin" color="#2563eb" />
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Hesablanır...</span>
              </div>
            ) : estimate ? (
              <div>
                <div className="custom-estimator-price">
                  {estimate.estimatedMin} — {estimate.estimatedMax} ₼
                </div>
                <div className="custom-estimator-sub">
                  Təxmini ümumi büdcə ({estimate.totalPassengers} nəfər / {estimate.durationDays} gün)
                </div>
              </div>
            ) : (
              <div style={{ color: '#94a3b8' }}>Məlumat toplanır...</div>
            )}
          </div>

          {estimate && (
            <div className="custom-estimator-breakdown">
              <div className="custom-est-row">
                <span>Nəqliyyat ({estimate.durationDays} gün):</span>
                <strong>{estimate.breakdown.vehicle} ₼</strong>
              </div>
              <div className="custom-est-row">
                <span>Qonaqlama ({estimate.nights} gecə):</span>
                <strong>{estimate.breakdown.hotel} ₼</strong>
              </div>
              <div className="custom-est-row">
                <span>Qidalanma:</span>
                <strong>{estimate.breakdown.meal} ₼</strong>
              </div>
              {estimate.breakdown.guide > 0 && (
                <div className="custom-est-row">
                  <span>Peşəkar Bələdçi:</span>
                  <strong>{estimate.breakdown.guide} ₼</strong>
                </div>
              )}
              {estimate.breakdown.attractions > 0 && (
                <div className="custom-est-row">
                  <span>Attraksion Biletləri:</span>
                  <strong>{estimate.breakdown.attractions} ₼</strong>
                </div>
              )}
            </div>
          )}

          <div className="custom-estimator-info">
            <div style={{ fontWeight: 700, marginBottom: 2 }}>B2B Tender Zəmanəti:</div>
            Bu qiymət platformanın orta göstəricisidir. Tender başladıqdan sonra təsdiqlənmiş agentliklər
            rəqabət apararaq sizə daha endirimli təkliflər verə bilər.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem', color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} color="#16a34a" />
              <span>Yalnız lisenziyalı turizm şirkətləri</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="#16a34a" />
              <span>30% depozitlə təsdiq imkanı</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="#16a34a" />
              <span>Birkart & Tamkart ilə 12 ay faizsiz</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
