import React, { useState, useRef } from 'react';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  Sparkles, 
  MapPin, 
  Bus, 
  Calendar, 
  FileText,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  FolderOpen,
  AlertCircle,
  Link2,
  Loader2,
  CheckCircle2,
  Plane,
  ShieldCheck,
  Building2,
  Utensils,
  Users
} from 'lucide-react';
import { Card, Button, Input } from '@toursales/ui';
import { ItineraryItem } from '@toursales/types';
import { BusConfigurator, BusType } from '../BusConfigurator/BusConfigurator';
import { ItineraryBuilder } from '../ItineraryBuilder/ItineraryBuilder';
import { CreateTourPayload } from '../../api/tourManageApi';
import { uploadApi } from '@/shared/api/uploadApi';
import './TourFormWizard.css';

export interface RegionOption {
  value: string;
  label: string;
}

export interface RegionGroup {
  group: string;
  options: RegionOption[];
}

export const DOMESTIC_REGION_GROUPS: RegionGroup[] = [
  {
    group: 'Qarabağ və Şərqi Zəngəzur',
    options: [
      { value: 'Shusha', label: 'Şuşa' },
      { value: 'Lachin', label: 'Laçın' },
      { value: 'Khankendi', label: 'Xankəndi' },
      { value: 'Aghdam', label: 'Ağdam' },
      { value: 'Kalbajar', label: 'Kəlbəcər' },
      { value: 'Fuzuli', label: 'Füzuli' },
      { value: 'Jabrayil', label: 'Cəbrayıl' },
      { value: 'Zangilan', label: 'Zəngilan' },
      { value: 'Khojaly', label: 'Xocalı' },
      { value: 'Sugovushan', label: 'Suqovuşan' },
    ],
  },
  {
    group: 'Şimal (Quba - Qusar)',
    options: [
      { value: 'Quba', label: 'Quba / Qəçrəş' },
      { value: 'Qusar', label: 'Qusar / Şahdağ' },
      { value: 'Khachmaz', label: 'Xaçmaz / Nabran' },
      { value: 'Shabran', label: 'Şabran' },
    ],
  },
  {
    group: 'Şimal-Qərb (İpək Yolu)',
    options: [
      { value: 'Sheki', label: 'Şəki / Kiş kəndi' },
      { value: 'Gabala', label: 'Qəbələ / Tufandağ' },
      { value: 'Qakh', label: 'Qax / İlisu' },
      { value: 'Zaqatala', label: 'Zaqatala' },
      { value: 'Ismayilli', label: 'İsmayıllı / Lahıc' },
      { value: 'Shamakhi', label: 'Şamaxı / Dəmirçi' },
    ],
  },
  {
    group: 'Cənub (Lənkəran - Lerik)',
    options: [
      { value: 'Lankaran', label: 'Lənkəran' },
      { value: 'Lerik', label: 'Lerik' },
      { value: 'Astara', label: 'Astara' },
      { value: 'Masalli', label: 'Masallı' },
    ],
  },
  {
    group: 'Qərb (Gəncə - Göygöl)',
    options: [
      { value: 'Ganja', label: 'Gəncə' },
      { value: 'Goygol', label: 'Göygöl / Maralgöl' },
      { value: 'Dashkasan', label: 'Daşkəsən' },
      { value: 'Tovuz', label: 'Tovuz' },
      { value: 'Gazakh', label: 'Qazax' },
      { value: 'Gadabay', label: 'Gədəbəy' },
    ],
  },
  {
    group: 'Bakı & Abşeron / Naxçıvan',
    options: [
      { value: 'Baku', label: 'Bakı və Abşeron' },
      { value: 'Nakhchivan', label: 'Naxçıvan MR' },
    ],
  },
];

export const FOREIGN_DESTINATION_GROUPS: RegionGroup[] = [
  {
    group: 'Türkiyə',
    options: [
      { value: 'Turkey-Istanbul', label: 'İstanbul (Türkiyə)' },
      { value: 'Turkey-Antalya', label: 'Antalya / Alanya (Türkiyə)' },
      { value: 'Turkey-Cappadocia', label: 'Kapadokya (Türkiyə)' },
      { value: 'Turkey-Trabzon', label: 'Trabzon & Rize (Türkiyə)' },
      { value: 'Turkey-Bodrum', label: 'Bodrum & Marmaris (Türkiyə)' },
      { value: 'Turkey-Izmir', label: 'İzmir & Çeşme (Türkiyə)' },
    ],
  },
  {
    group: 'Gürcüstan',
    options: [
      { value: 'Georgia-Tbilisi', label: 'Tbilisi (Gürcüstan)' },
      { value: 'Georgia-Batumi', label: 'Batumi (Gürcüstan)' },
      { value: 'Georgia-Kazbegi', label: 'Kazbegi & Qudauri (Gürcüstan)' },
      { value: 'Georgia-Borjomi', label: 'Borjomi & Bakuriani (Gürcüstan)' },
    ],
  },
  {
    group: 'BƏƏ və Körfəz Ölkələri',
    options: [
      { value: 'UAE-Dubai', label: 'Dubay (BƏƏ)' },
      { value: 'UAE-AbuDhabi', label: 'Əbu-Dabi (BƏƏ)' },
      { value: 'UAE-Sharjah', label: 'Şarja (BƏƏ)' },
      { value: 'Qatar-Doha', label: 'Doha (Qətər)' },
    ],
  },
  {
    group: 'Avropa',
    options: [
      { value: 'Europe-Italy', label: 'İtaliya (Roma, Milan, Venesiya)' },
      { value: 'Europe-France', label: 'Fransa (Paris, Nitsa)' },
      { value: 'Europe-Czech', label: 'Çexiya (Praqa)' },
      { value: 'Europe-Hungary', label: 'Macarıstan (Budapeşt)' },
      { value: 'Europe-Spain', label: 'İspaniya (Barselona, Madrid)' },
      { value: 'Europe-Austria', label: 'Avstriya (Vyana)' },
    ],
  },
  {
    group: 'Misir',
    options: [
      { value: 'Egypt-Sharm', label: 'Şarm əl-Şeyx (Misir)' },
      { value: 'Egypt-Hurghada', label: 'Hurqada (Misir)' },
      { value: 'Egypt-Cairo', label: 'Qahirə (Misir)' },
    ],
  },
  {
    group: 'Ekzotik & Digər Beynəlxalq',
    options: [
      { value: 'Maldives', label: 'Maldiv Adaları' },
      { value: 'Indonesia-Bali', label: 'Bali (İndoneziya)' },
      { value: 'Thailand', label: 'Tailand (Banqkok, Pxuket)' },
      { value: 'Malaysia', label: 'Malayziya (Kuala-Lumpur)' },
      { value: 'Russia-Moscow', label: 'Moskva & Sankt-Peterburq (Rusiya)' },
      { value: 'Other-Foreign', label: 'Digər Xarici İstiqamət' },
    ],
  },
];

interface TourFormWizardProps {
  initialData?: Partial<CreateTourPayload>;
  onSubmit: (data: CreateTourPayload) => Promise<void>;
  isLoading?: boolean;
}

export const TourFormWizard: React.FC<TourFormWizardProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const [step, setStep] = useState<number>(1);

  // Form State
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState<'DOMESTIC' | 'FOREIGN'>(initialData?.type || 'DOMESTIC');
  
  // Initial region selection safe check
  const initialRegion = initialData?.region || (initialData?.type === 'FOREIGN' ? 'Turkey-Istanbul' : 'Shusha');
  const [region, setRegion] = useState(initialRegion);
  const [destinationCountry, setDestinationCountry] = useState(
    initialData?.destinationCountry || (initialData?.type === 'FOREIGN' ? 'Türkiyə, İstanbul' : '')
  );
  const [basePrice, setBasePrice] = useState(initialData?.basePrice?.toString() || '65');
  const [startDate, setStartDate] = useState(initialData?.startDate?.split('T')[0] || '2026-04-10');
  const [endDate, setEndDate] = useState(initialData?.endDate?.split('T')[0] || '2026-04-11');
  const [meetingPoint, setMeetingPoint] = useState(
    initialData?.meetingPoint || (initialData?.type === 'FOREIGN' ? 'Heydər Əliyev Beynəlxalq Hava Limanı (GYD), Terminal 1' : 'Gənclik m/s, Caspian Shopping qarşısı')
  );
  
  // Domestic Transport
  const [busType, setBusType] = useState<BusType>(initialData?.busType || 'STANDARD_48');
  const [capacity, setCapacity] = useState<number>(initialData?.capacity || (initialData?.type === 'FOREIGN' ? 25 : 48));

  // Foreign Tour Specifics
  const [hotelName, setHotelName] = useState(initialData?.hotelName || '');
  const [hotelCategory, setHotelCategory] = useState(initialData?.hotelCategory || '4*');
  const [mealPlan, setMealPlan] = useState('Səhər yeməyi (BB)');
  const [flightIncluded, setFlightIncluded] = useState<boolean>(
    initialData?.flightIncluded ?? (initialData?.hasFlight ?? true)
  );
  const [passportVisaRequired, setPassportVisaRequired] = useState<boolean>(
    initialData?.passportVisaRequired ?? (initialData?.hasVisaSupport ?? true)
  );
  const [hasVisaSupport, setHasVisaSupport] = useState<boolean>(
    initialData?.hasVisaSupport ?? true
  );

  // Itinerary
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(initialData?.itinerary || []);

  // Inclusions & Media
  const [inclusionsText, setInclusionsText] = useState(
    initialData?.inclusions?.join('\n') || (type === 'FOREIGN' 
      ? 'Gediş-dönüş aviabiletləri\n4* Oteldə gecələmə\nSəhər yeməyi\nHava limanı transferi\nSəyahət sığortası' 
      : 'Komfortlu nəqliyyat\nBələdçi xidməti\nSəyahət sığortası')
  );
  const [exclusionsText, setExclusionsText] = useState(
    initialData?.exclusions?.join('\n') || (type === 'FOREIGN' 
      ? 'Viza rüsumu (tələb olunarsa)\nNahar və şam yeməkləri\nŞəxsi xərclər və muzey biletləri' 
      : 'Nahar və şam yeməyi\nŞəxsi xərclər')
  );
  const [imageUrl, setImageUrl] = useState(initialData?.images?.[0] || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleTypeChange = (newType: 'DOMESTIC' | 'FOREIGN') => {
    setType(newType);
    if (newType === 'FOREIGN') {
      // Switch region to foreign default if currently domestic
      const isDomestic = DOMESTIC_REGION_GROUPS.some(g => g.options.some(o => o.value === region));
      if (isDomestic || !region) {
        setRegion('Turkey-Istanbul');
        setDestinationCountry('Türkiyə, İstanbul');
      }
      if (meetingPoint === 'Gənclik m/s, Caspian Shopping qarşısı') {
        setMeetingPoint('Heydər Əliyev Beynəlxalq Hava Limanı (GYD), Terminal 1');
      }
      if (capacity === 48) {
        setCapacity(25);
      }
      if (!hotelName) {
        setHotelName('Ramada Plaza / 4* Şəhər Oteli');
      }
      if (inclusionsText === 'Komfortlu nəqliyyat\nBələdçi xidməti\nSəyahət sığortası') {
        setInclusionsText('Gediş-dönüş aviabiletləri\n4* Oteldə gecələmə\nSəhər yeməyi\nHava limanı transferi\nSəyahət sığortası');
      }
      if (exclusionsText === 'Nahar və şam yeməyi\nŞəxsi xərclər') {
        setExclusionsText('Viza rüsumu (tələb olunarsa)\nNahar və şam yeməkləri\nŞəxsi xərclər və muzey biletləri');
      }
    } else {
      // Switch region to domestic default if currently foreign
      const isForeign = FOREIGN_DESTINATION_GROUPS.some(g => g.options.some(o => o.value === region));
      if (isForeign || !region) {
        setRegion('Shusha');
        setDestinationCountry('');
      }
      if (meetingPoint === 'Heydər Əliyev Beynəlxalq Hava Limanı (GYD), Terminal 1') {
        setMeetingPoint('Gənclik m/s, Caspian Shopping qarşısı');
      }
      if (capacity === 25) {
        setCapacity(48);
      }
      if (inclusionsText.includes('aviabilet')) {
        setInclusionsText('Komfortlu nəqliyyat\nBələdçi xidməti\nSəyahət sığortası');
      }
      if (exclusionsText.includes('Viza')) {
        setExclusionsText('Nahar və şam yeməyi\nŞəxsi xərclər');
      }
    }
  };

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    if (type === 'FOREIGN') {
      for (const group of FOREIGN_DESTINATION_GROUPS) {
        const opt = group.options.find(o => o.value === newRegion);
        if (opt) {
          setDestinationCountry(opt.label);
          break;
        }
      }
    }
  };

  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    if (!file.type.startsWith('image/')) {
      setUploadError('Yalnız şəkil faylları (JPG, PNG, WEBP, AVIF və s.) qəbul olunur.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Şəkil ölçüsü maksimum 5MB ola bilər.');
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadApi.uploadImage(file);
      if (res && res.url) {
        setImageUrl(res.url);
        setUploadSuccess('Şəkil uğurla kompüterinizdən yükləndi!');
      }
    } catch (err: any) {
      console.error('Şəkil yüklənmə xətası:', err);
      setUploadError(err.response?.data?.message || 'Şəkil yüklənərkən xəta baş verdi. Yenidən cəhd edin.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setUploadError(null);
    setUploadSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getDisplayImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    return url.startsWith('/') ? url : `/${url}`;
  };

  const steps = [
    { num: 1, label: 'Əsas Məlumatlar' },
    { num: 2, label: type === 'DOMESTIC' ? 'Avtobus & Yerlər' : 'Otel & Uçuş' },
    { num: 3, label: 'Marşrut Qrafiki' },
    { num: 4, label: 'Təminatlar & Şəkillər' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Yalnız 4-cü mərhələdə form submit oluna bilər
    if (step < 4) {
      setStep((s) => s + 1);
      return;
    }
    if (!imageUrl) {
      alert('Zəhmət olmasa 4-cü mərhələdə turun əsas şəklini kompüterinizdən yükləyin və ya URL daxil edin.');
      setStep(4);
      return;
    }

    const isForeign = type === 'FOREIGN';
    const payload: CreateTourPayload = {
      title,
      description,
      type,
      region,
      destinationCountry: isForeign ? destinationCountry : undefined,
      basePrice: parseFloat(basePrice) || 0,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      meetingPoint,
      images: [imageUrl],
      capacity: parseInt(capacity.toString(), 10) || (isForeign ? 20 : 48),
      busType: isForeign ? undefined : busType,
      hotelName: isForeign ? (hotelName || destinationCountry || 'Standart Otel') : undefined,
      hotelCategory: isForeign ? hotelCategory : undefined,
      flightIncluded: isForeign ? flightIncluded : false,
      passportVisaRequired: isForeign ? passportVisaRequired : false,
      hasFlight: isForeign ? flightIncluded : false,
      hasVisaSupport: isForeign ? hasVisaSupport : false,
      inclusions: inclusionsText.split('\n').filter((s) => s.trim().length > 0),
      exclusions: exclusionsText.split('\n').filter((s) => s.trim().length > 0),
      itinerary,
      isKarabakh: !isForeign && (region.toLowerCase().includes('shusha') || region.toLowerCase().includes('lachin') || region.toLowerCase().includes('khankendi')),
    };
    await onSubmit(payload);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      onKeyDown={(e) => {
        // Input sahələrində Enter basıldıqda səhvən submit olmasının qarşısını alırıq
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
          e.preventDefault();
        }
      }}
      className="vendor-wizard-form"
    >
      {/* Step Indicator Header */}
      <div className="vendor-wizard-steps">
        {steps.map((s) => (
          <div
            key={s.num}
            className={`vendor-wizard-step-item ${step === s.num ? 'active' : ''} ${
              step > s.num ? 'completed' : ''
            }`}
            onClick={() => s.num < step && setStep(s.num)}
          >
            <div className="vendor-step-bubble">
              {step > s.num ? <Check size={14} /> : s.num}
            </div>
            <span className="vendor-step-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Core Details */}
      {step === 1 && (
        <Card variant="default" className="vendor-wizard-card">
          <div className="vendor-wizard-card-header">
            <FileText size={20} className="vendor-wizard-header-icon" />
            <div>
              <h3>1. Əsas Tur Təfərrüatları</h3>
              <p className="vendor-wizard-header-sub">Turun növünü, istiqamətini və əsas qiymətini təyin edin</p>
            </div>
          </div>

          <div className="vendor-wizard-grid">
            {/* Category Selector Cards */}
            <div className="vendor-grid-full">
              <label className="vendor-field-label">Tur Kateqoriyasını Seçin</label>
              <div className="vendor-category-selector">
                <div
                  className={`vendor-category-card ${type === 'DOMESTIC' ? 'selected' : ''}`}
                  onClick={() => handleTypeChange('DOMESTIC')}
                >
                  <div className="vendor-category-icon-wrap domestic">
                    <MapPin size={22} />
                  </div>
                  <div className="vendor-category-text">
                    <div className="vendor-category-header-row">
                      <span className="vendor-category-title">Daxili Tur</span>
                      <span className="vendor-category-flag">🇦🇿</span>
                    </div>
                    <p className="vendor-category-desc">Azərbaycan və Qarabağ bölgələrinə avtobus və mikroavtobus səfərləri</p>
                  </div>
                  <div className="vendor-category-radio">
                    <div className="vendor-category-radio-inner" />
                  </div>
                </div>

                <div
                  className={`vendor-category-card ${type === 'FOREIGN' ? 'selected' : ''}`}
                  onClick={() => handleTypeChange('FOREIGN')}
                >
                  <div className="vendor-category-icon-wrap foreign">
                    <Plane size={22} />
                  </div>
                  <div className="vendor-category-text">
                    <div className="vendor-category-header-row">
                      <span className="vendor-category-title">Xarici Tur</span>
                      <span className="vendor-category-flag">✈️</span>
                    </div>
                    <p className="vendor-category-desc">Beynəlxalq ölkələrə, otel qonaqlamalı və aviabiletli paket turlar</p>
                  </div>
                  <div className="vendor-category-radio">
                    <div className="vendor-category-radio-inner" />
                  </div>
                </div>
              </div>
            </div>

            <div className="vendor-grid-full">
              <Input
                label="Turun Başlığı"
                placeholder={type === 'DOMESTIC' ? "Məs: Şuşa Zəfər Turu (2 Gün / 1 Gecə)" : "Məs: İstanbul Möcüzələri (4 Gün / 3 Gecə)"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Dynamic Region Dropdown */}
            <div className="vendor-grid-half">
              <label className="vendor-field-label">
                {type === 'DOMESTIC' ? 'Region / İstiqamət (Azərbaycan)' : 'Xarici Ölkə / İstiqamət'}
              </label>
              <select
                className="vendor-select-field"
                value={region}
                onChange={(e) => handleRegionChange(e.target.value)}
              >
                {type === 'DOMESTIC'
                  ? DOMESTIC_REGION_GROUPS.map((group) => (
                      <optgroup key={group.group} label={group.group}>
                        {group.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                    ))
                  : FOREIGN_DESTINATION_GROUPS.map((group) => (
                      <optgroup key={group.group} label={group.group}>
                        {group.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
              </select>
            </div>

            {type === 'FOREIGN' ? (
              <div className="vendor-grid-half">
                <Input
                  label="Dəqiq Ölkə və Şəhər"
                  placeholder="Məs: Türkiyə, İstanbul və ya BƏƏ, Dubay"
                  value={destinationCountry}
                  onChange={(e) => setDestinationCountry(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="vendor-grid-half">
                <Input
                  label="Baza Qiymət (AZN / 1 nəfər)"
                  type="number"
                  min="1"
                  step="any"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  required
                />
              </div>
            )}

            {type === 'FOREIGN' && (
              <div className="vendor-grid-half">
                <Input
                  label="Paket Qiyməti (AZN / 1 nəfər)"
                  type="number"
                  min="1"
                  step="any"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="vendor-grid-half">
              <Input
                label="Başlama Tarixi"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="vendor-grid-half">
              <Input
                label="Bitmə Tarixi"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>

            <div className="vendor-grid-full">
              <Input
                label={type === 'FOREIGN' ? "Toplanış və Uçuş Yeri" : "Toplanış və Minik Yeri"}
                placeholder={type === 'FOREIGN' ? "Məs: Heydər Əliyev Beynəlxalq Hava Limanı (GYD), Terminal 1" : "Məs: Gənclik m/s, Caspian Shopping qarşısı"}
                value={meetingPoint}
                onChange={(e) => setMeetingPoint(e.target.value)}
                required
              />
            </div>

            <div className="vendor-grid-full">
              <label className="vendor-field-label">Tur Haqqında Ətraflı Məlumat</label>
              <textarea
                className="vendor-textarea-field"
                rows={4}
                placeholder="Tur haqqında ümumi məlumat, görməli yerlər, üstünlüklər və qaydalar..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Transport & Seats (Domestic) */}
      {step === 2 && type === 'DOMESTIC' && (
        <Card variant="default" className="vendor-wizard-card">
          <div className="vendor-wizard-card-header">
            <Bus size={20} className="vendor-wizard-header-icon" />
            <div>
              <h3>2. Nəqliyyat və Oturacaq Konfiqurasiyası</h3>
              <p className="vendor-wizard-header-sub">Avtobus növünü və sərnişin yerlərinin sayını seçin</p>
            </div>
          </div>

          <BusConfigurator
            selectedType={busType}
            onChange={(b: BusType, c: number) => {
              setBusType(b);
              setCapacity(c);
            }}
          />
        </Card>
      )}

      {/* Step 2: Hotel, Flight & Visa (Foreign) */}
      {step === 2 && type === 'FOREIGN' && (
        <Card variant="default" className="vendor-wizard-card">
          <div className="vendor-wizard-card-header">
            <Plane size={20} className="vendor-wizard-header-icon" />
            <div>
              <h3>2. Otel, Uçuş və Viza Təfərrüatları</h3>
              <p className="vendor-wizard-header-sub">Beynəlxalq səyahət üçün qonaqlama və nəqliyyat paketini tərtib edin</p>
            </div>
          </div>

          <div className="vendor-wizard-grid">
            <div className="vendor-grid-half">
              <Input
                label="Otel Adı"
                placeholder="Məs: Rixos Premium Belek və ya Ramada Plaza"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                required
              />
            </div>

            <div className="vendor-grid-half">
              <label className="vendor-field-label">Otel Kateqoriyası / Ulduz</label>
              <select
                className="vendor-select-field"
                value={hotelCategory}
                onChange={(e) => setHotelCategory(e.target.value)}
              >
                <option value="5*">⭐⭐⭐⭐⭐ 5 Ulduz (Lüks / 5*)</option>
                <option value="4*">⭐⭐⭐⭐ 4 Ulduz (Komfort / 4*)</option>
                <option value="3*">⭐⭐⭐ 3 Ulduz (Standart / 3*)</option>
                <option value="Resort">🏖️ Resort / Çimərlik Oteli</option>
                <option value="Boutique">🏰 Butik / Tarixi Otel</option>
                <option value="Apart">🏢 Apart-Otel</option>
              </select>
            </div>

            <div className="vendor-grid-half">
              <label className="vendor-field-label">Qidalanma Rejimi</label>
              <select
                className="vendor-select-field"
                value={mealPlan}
                onChange={(e) => setMealPlan(e.target.value)}
              >
                <option value="Səhər yeməyi (BB)">🍳 Səhər yeməyi (BB - Bed & Breakfast)</option>
                <option value="Yarım pansion (HB)">🍽️ Yarım pansion (HB - Səhər və Şam yeməyi)</option>
                <option value="Tam pansion (FB)">🍲 Tam pansion (FB - 3 dəfə yemək)</option>
                <option value="Hər şey daxil (All Inclusive)">🍹 Hər şey daxil (All Inclusive)</option>
                <option value="Ultra All Inclusive (UAI)">👑 Ultra All Inclusive (UAI - 24 saat)</option>
                <option value="Yeməksiz (RO)">❌ Yeməksiz (RO - Yalnız otaq)</option>
              </select>
            </div>

            <div className="vendor-grid-half">
              <Input
                label="Maksimum Qrup Tutumu (Nəfər sayı)"
                type="number"
                min="1"
                max="500"
                value={capacity.toString()}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 20)}
                required
              />
            </div>

            {/* Foreign Package Features (Flight, Visa, Support) */}
            <div className="vendor-grid-full">
              <label className="vendor-field-label">Xarici Tur Paketinin Şərtləri</label>
              <div className="vendor-foreign-features-grid">
                <div 
                  className={`vendor-feature-toggle-card ${flightIncluded ? 'active' : ''}`}
                  onClick={() => setFlightIncluded(!flightIncluded)}
                >
                  <div className="vendor-feature-icon">
                    <Plane size={20} />
                  </div>
                  <div className="vendor-feature-content">
                    <span className="vendor-feature-title">Aviabilet / Uçuş Daxildir</span>
                    <span className="vendor-feature-desc">Bakıdan birbaşa və ya tranzit gediş-dönüş uçuş biletləri daxildir</span>
                  </div>
                  <div className={`vendor-switch ${flightIncluded ? 'on' : 'off'}`}>
                    <div className="vendor-switch-knob" />
                  </div>
                </div>

                <div 
                  className={`vendor-feature-toggle-card ${passportVisaRequired ? 'active' : ''}`}
                  onClick={() => setPassportVisaRequired(!passportVisaRequired)}
                >
                  <div className="vendor-feature-icon">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="vendor-feature-content">
                    <span className="vendor-feature-title">Xarici Pasport / Viza Tələb Olunur</span>
                    <span className="vendor-feature-desc">Səyahətçilər etibarlı xarici pasport və ya giriş vizasına sahib olmalıdır</span>
                  </div>
                  <div className={`vendor-switch ${passportVisaRequired ? 'on' : 'off'}`}>
                    <div className="vendor-switch-knob" />
                  </div>
                </div>

                <div 
                  className={`vendor-feature-toggle-card ${hasVisaSupport ? 'active' : ''}`}
                  onClick={() => setHasVisaSupport(!hasVisaSupport)}
                >
                  <div className="vendor-feature-icon">
                    <Sparkles size={20} />
                  </div>
                  <div className="vendor-feature-content">
                    <span className="vendor-feature-title">Agentlik Viza Dəstəyi Təmin Edir</span>
                    <span className="vendor-feature-desc">Müştərilərə viza müraciəti və sənədlərin hazırlanmasında dəstək verilir</span>
                  </div>
                  <div className={`vendor-switch ${hasVisaSupport ? 'on' : 'off'}`}>
                    <div className="vendor-switch-knob" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Itinerary */}
      {step === 3 && (
        <Card variant="default" className="vendor-wizard-card">
          <div className="vendor-wizard-card-header">
            <Calendar size={20} className="vendor-wizard-header-icon" />
            <div>
              <h3>3. Günbəgün Tur Qrafiki</h3>
              <p className="vendor-wizard-header-sub">Səyahətçilər üçün günbəgün və saatbasaat planlanan tədbirləri əlavə edin</p>
            </div>
          </div>

          <ItineraryBuilder items={itinerary} onChange={setItinerary} />
        </Card>
      )}

      {/* Step 4: Inclusions & Media */}
      {step === 4 && (
        <Card variant="default" className="vendor-wizard-card">
          <div className="vendor-wizard-card-header">
            <ImageIcon size={20} className="vendor-wizard-header-icon" />
            <div>
              <h3>4. Daxildir / Daxil Deyil və Şəkillər</h3>
              <p className="vendor-wizard-header-sub">Qiymətə daxil olan xidmətləri qeyd edin və kompüterinizdən şəkil əlavə edin</p>
            </div>
          </div>

          <div className="vendor-wizard-grid">
            <div className="vendor-grid-full">
              <label className="vendor-field-label">Turun Əsas Şəkli (Kompüterdən və ya URL)</label>
              
              {imageUrl ? (
                <div className="vendor-image-preview-card">
                  <div className="vendor-image-preview-wrapper">
                    <img 
                      src={getDisplayImageUrl(imageUrl)} 
                      alt="Tur Şəkli" 
                      className="vendor-image-preview-img"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800';
                      }}
                    />
                    <div className="vendor-image-preview-badge">Əsas Şəkil</div>
                  </div>
                  <div className="vendor-image-preview-info">
                    <div className="vendor-image-preview-meta">
                      <span className="vendor-image-preview-title">Seçilmiş Şəkil</span>
                      <span className="vendor-image-preview-path" title={imageUrl}>{imageUrl}</span>
                      {uploadSuccess && (
                        <div className="vendor-upload-success-inline">
                          <CheckCircle2 size={13} />
                          <span>{uploadSuccess}</span>
                        </div>
                      )}
                    </div>
                    <div className="vendor-image-preview-actions">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <FolderOpen size={14} />
                        <span>Kompüterdən Dəyişdir</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="vendor-remove-img-btn"
                        onClick={handleRemoveImage}
                        disabled={isUploading}
                      >
                        <Trash2 size={14} />
                        <span>Sil</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className={`vendor-upload-dropzone ${dragOver ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <div className="vendor-upload-loading">
                      <Loader2 size={36} className="vendor-spin-icon" />
                      <p className="vendor-upload-loading-text">Şəkil kompüterdən serverə yüklənir...</p>
                      <span className="vendor-upload-subtext">Zəhmət olmasa gözləyin</span>
                    </div>
                  ) : (
                    <div className="vendor-upload-placeholder">
                      <div className="vendor-upload-icon-circle">
                        <UploadCloud size={28} />
                      </div>
                      <p className="vendor-upload-title">
                        Kompüterinizin diskindən şəkil seçmək üçün <span>klikləyin</span> və ya bura sürükləyin
                      </p>
                      <p className="vendor-upload-hint">PNG, JPG, WEBP və ya AVIF (Maksimum 5 MB)</p>
                      <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm" 
                        className="vendor-file-select-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        <FolderOpen size={14} />
                        <span>Kompüterdən Şəkil Seç</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Native file input for local computer disk picker */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg,image/avif"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              {uploadError && (
                <div className="vendor-upload-error">
                  <AlertCircle size={14} />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Collapsible option for direct external URL input */}
              <div className="vendor-url-input-accordion">
                <button
                  type="button"
                  className="vendor-toggle-url-btn"
                  onClick={() => setShowManualUrl(!showManualUrl)}
                >
                  <Link2 size={13} />
                  <span>{showManualUrl ? 'Xarici URL daxiletməsini bağla' : 'Və ya birbaşa xarici şəkil linki (URL) daxil edin'}</span>
                </button>
                {showManualUrl && (
                  <div className="vendor-url-field-wrap">
                    <Input
                      label="Xarici Şəkil URL-i"
                      placeholder="https://images.unsplash.com/..."
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setUploadSuccess(null);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="vendor-grid-half">
              <label className="vendor-field-label">Qiymətə Daxildir (Hər sətirdə biri):</label>
              <textarea
                className="vendor-textarea-field"
                rows={5}
                value={inclusionsText}
                onChange={(e) => setInclusionsText(e.target.value)}
              />
            </div>

            <div className="vendor-grid-half">
              <label className="vendor-field-label">Qiymətə Daxil Deyil (Hər sətirdə biri):</label>
              <textarea
                className="vendor-textarea-field"
                rows={5}
                value={exclusionsText}
                onChange={(e) => setExclusionsText(e.target.value)}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Wizard Footer Navigation Actions */}
      <div className="vendor-wizard-actions">
        {step > 1 && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStep((s) => s - 1)}
          >
            <ArrowLeft size={16} />
            <span>Əvvəlki</span>
          </Button>
        )}

        <div className="vendor-wizard-actions-right">
          {step < 4 ? (
            <Button
              key={`wizard-next-step-${step}`}
              type="button"
              variant="primary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setStep((s) => Math.min(4, s + 1));
              }}
            >
              <span>Növbəti</span>
              <ArrowRight size={16} />
            </Button>
          ) : (
            <Button
              key="wizard-submit-tour-btn"
              type="submit"
              variant="primary"
              isLoading={isLoading}
            >
              <Save size={16} />
              <span>Turu Dərc Et və Satışa Burax</span>
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
