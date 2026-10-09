import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Filter,
  Calendar,
  Users,
  Car,
  Building,
  Utensils,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Loader2,
  DollarSign,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Compass,
  FileText,
  Eye,
  Award
} from 'lucide-react';
import { vendorCustomTourApi, VendorTenderStats } from '../../api/vendorCustomTourApi';
import { CustomTourRequest, SubmitBidPayload, CustomTourBid } from '@toursales/types';
import { vendorSocketService, playNotificationSound } from '../../../../shared/services/vendorSocketService';
import './VendorTenderBoardPage.css';

const DEFAULT_INCLUDED_SERVICES = [
  'Komfortlu nəqliyyat və peşəkar sürücü',
  'Bütün yanacaq və yol xərcləri',
  'Oteldə gecələmə və səhər yeməyi',
  'Peşəkar sertifikatlı bələdçi',
  'Milli park və muzeylərə giriş biletləri',
  'Səyahət sığortası',
  'Yol boyu limitsiz içməli su',
  'Hava limanından transfer',
  'Qrup fotosessiyası xidməti'
];

const TEMPLATE_PRESETS: { [key: string]: { itinerary: string; vehicle: string; hotel: string; notes: string } } = {
  general: {
    itinerary: '1-ci Gün: Bakıdan yola düşmə, marşrut boyu tarixi məkanlar və fotosessiya. Otelə yerləşmə və axşam ziyafəti.\n2-ci Gün: Görməli yerlərə və təbiət abidələrinə ekskursiya, yerli mətbəx naharı.\n3-cü Gün: Asudə vaxt, suvenir alış-verişi və Bakıya komfortlu qayıdış.',
    vehicle: 'Mercedes-Benz Sprinter 2022 / Vito VIP, kondisioner, audio-bələdçi, WiFi',
    hotel: '4* / 5* Lüks Dağ və ya Şəhər Oteli, səhər yeməyi daxil',
    notes: 'Bütün qrup üçün 24/7 tur meneceri dəstəyi və fərdi xidmət təmin edilir.'
  },
  karabakh: {
    itinerary: '1-ci Gün: Füzuli - Zəfər Yolu ilə Şuşaya gediş. Cıdır Düzü, Vaqifin məqbərəsi, Yuxarı Gövhər Ağa Məscidi. Qonaqlama.\n2-ci Gün: İsa Bulağı, Gəncə Qapısı, Şuşa Qalası. Ağdam İmarət kompleksi və Xankəndi şəhər turu.\n3-cü Gün: Suqovuşan gölü kənarı piknik fasiləsi və Bakıya qayıdış.',
    vehicle: 'Mercedes-Benz Sprinter VIP 18 yerlik, kondisioner, mikrofon, peşəkar dağ sürücüsü',
    hotel: 'Şuşa Otel və ya Qarabağ Hotel 4* (Bütün şəraitlə təmin olunmuş)',
    notes: 'Qarabağ portal icazələri və rəsmi giriş prosedurları agentliyimiz tərəfindən həyata keçirilir.'
  },
  gabala: {
    itinerary: '1-ci Gün: Bakı-Qəbələ, Nohurgöl və Tufandağ kanat xətti. Otelə yerləşmə.\n2-ci Gün: Şəki Xan Sarayı, Karvansaray, Şəki halvası dequstasiyası və Kiş Alban Məbədi.\n3-cü Gün: Qəbələnd Əyləncə Mərkəzi və Bakıya rahat dönüş.',
    vehicle: 'Mercedes Vito 2022 / Mercedes Sprinter, premium dəri salon',
    hotel: 'Qəbələ 5* Resort Hotel (Spa və qapalı hovuz daxil)',
    notes: 'Xüsusi qastronomik Şəki pitisi naharı hədiyyə olunur.'
  }
};

export const VendorTenderBoardPage: React.FC = () => {
  const [requests, setRequests] = useState<CustomTourRequest[]>([]);
  const [myBids, setMyBids] = useState<CustomTourBid[]>([]);
  const [stats, setStats] = useState<VendorTenderStats>({
    totalOpenTenders: 0,
    mySubmittedBids: 0,
    myWonBids: 0,
    myPendingBids: 0,
    myRejectedBids: 0,
    totalWonAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [bidStatusFilter, setBidStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'BUDGET_HIGH' | 'BUDGET_LOW' | 'DURATION'>('NEWEST');

  // Preview Drawer Modal
  const [previewRequest, setPreviewRequest] = useState<CustomTourRequest | null>(null);

  // Bid submission Modal state
  const [selectedRequest, setSelectedRequest] = useState<CustomTourRequest | null>(null);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidFormError, setBidFormError] = useState<string | null>(null);
  const [bidSuccessMessage, setBidSuccessMessage] = useState<string | null>(null);

  // Bid form state
  const [offeredPrice, setOfferedPrice] = useState<number | ''>('');
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [hotelDetails, setHotelDetails] = useState('');
  const [itineraryProgram, setItineraryProgram] = useState('');
  const [includedServices, setIncludedServices] = useState<string[]>([
    'Komfortlu nəqliyyat və peşəkar sürücü',
    'Bütün yanacaq və yol xərcləri',
    'Oteldə gecələmə və səhər yeməyi'
  ]);
  const [excludedServices, setExcludedServices] = useState('Şəxsi xərclər, menyudan kənar spirtli içkilər');
  const [vendorNotes, setVendorNotes] = useState('');
  const [validDays, setValidDays] = useState(3);

  const loadTenderData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [boardRes, bidsRes, statsRes] = await Promise.allSettled([
        vendorCustomTourApi.getTenderBoard(),
        vendorCustomTourApi.getMyBids(),
        vendorCustomTourApi.getStats(),
      ]);

      if (boardRes.status === 'fulfilled') {
        setRequests(boardRes.value || []);
      }
      if (bidsRes.status === 'fulfilled') {
        setMyBids(bidsRes.value || []);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
    } catch (err: any) {
      console.error('Failed to load tender data:', err);
      setError('Tender məlumatları yüklənərkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenderData();

    vendorSocketService.connect();
    const unsubNewReq = vendorSocketService.onTenderNewRequest((tender) => {
      playNotificationSound();
      loadTenderData();
    });

    const unsubBidAccepted = vendorSocketService.onTenderBidAccepted(() => {
      playNotificationSound();
      loadTenderData();
    });

    return () => {
      unsubNewReq();
      unsubBidAccepted();
    };
  }, []);

  // Filter & Sort requests
  const filteredRequests = useMemo(() => {
    let result = requests.filter(req => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        req.requestNumber.toLowerCase().includes(q) ||
        (req.destinations && req.destinations.some(d => d.toLowerCase().includes(q))) ||
        (req.title && req.title.toLowerCase().includes(q)) ||
        (req.specialNotes && req.specialNotes.toLowerCase().includes(q));

      // 2. Type Filter
      const matchesType = typeFilter === 'ALL' || req.type === typeFilter;

      // 3. Vehicle Filter
      const matchesVehicle = vehicleFilter === 'ALL' || req.vehicleType === vehicleFilter;

      // 4. Bid Status Filter
      const hasMyBid = req.hasMyBid || myBids.some(b => b.requestId === req.id);
      const myBidObj = req.myBid || myBids.find(b => b.requestId === req.id);
      const isWon = myBidObj?.status === 'ACCEPTED' || req.status === 'ACCEPTED';

      let matchesBidStatus = true;
      if (bidStatusFilter === 'UNBID') matchesBidStatus = !hasMyBid;
      if (bidStatusFilter === 'BIDDED') matchesBidStatus = hasMyBid;
      if (bidStatusFilter === 'WON') matchesBidStatus = isWon;

      return matchesSearch && matchesType && matchesVehicle && matchesBidStatus;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'BUDGET_HIGH') {
        const bBudget = b.budgetMax || b.budgetMin || 0;
        const aBudget = a.budgetMax || a.budgetMin || 0;
        return bBudget - aBudget;
      }
      if (sortBy === 'BUDGET_LOW') {
        const bBudget = b.budgetMax || b.budgetMin || 0;
        const aBudget = a.budgetMax || a.budgetMin || 0;
        return aBudget - bBudget;
      }
      if (sortBy === 'DURATION') {
        return b.durationDays - a.durationDays;
      }
      return 0;
    });

    return result;
  }, [requests, myBids, searchQuery, typeFilter, vehicleFilter, bidStatusFilter, sortBy]);

  const openBidModal = (req: CustomTourRequest) => {
    setSelectedRequest(req);
    setBidFormError(null);
    setBidSuccessMessage(null);

    // Initial price calculation: middle of budget or estimate
    const defaultPrice = req.budgetMax
      ? Math.round((Number(req.budgetMin || 0) + Number(req.budgetMax)) / 2)
      : req.budgetMin
      ? Number(req.budgetMin)
      : 1200;
    setOfferedPrice(defaultPrice);

    // Contextual template selection
    const isKarabakh = req.destinations.some(d => d.toLowerCase().includes('şuşa') || d.toLowerCase().includes('qarabağ'));
    const isGabala = req.destinations.some(d => d.toLowerCase().includes('qəbələ') || d.toLowerCase().includes('şəki'));
    const template = isKarabakh ? TEMPLATE_PRESETS.karabakh : isGabala ? TEMPLATE_PRESETS.gabala : TEMPLATE_PRESETS.general;

    setVehicleDetails(template.vehicle);
    setHotelDetails(template.hotel);
    setItineraryProgram(template.itinerary);
    setVendorNotes(template.notes);
  };

  const applyTemplate = (key: 'general' | 'karabakh' | 'gabala') => {
    const t = TEMPLATE_PRESETS[key];
    if (t) {
      setItineraryProgram(t.itinerary);
      setVehicleDetails(t.vehicle);
      setHotelDetails(t.hotel);
      setVendorNotes(t.notes);
    }
  };

  const handleToggleService = (service: string) => {
    if (includedServices.includes(service)) {
      setIncludedServices(includedServices.filter(s => s !== service));
    } else {
      setIncludedServices([...includedServices, service]);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (!offeredPrice || Number(offeredPrice) <= 0) {
      setBidFormError('Zəhmət olmasa təklif qiymətini daxil edin.');
      return;
    }

    if (!itineraryProgram.trim()) {
      setBidFormError('Zəhmət olmasa marşrut və proqramı qeyd edin.');
      return;
    }

    try {
      setSubmittingBid(true);
      setBidFormError(null);

      const payload: SubmitBidPayload = {
        offeredPrice: Number(offeredPrice),
        vehicleDetails: vehicleDetails.trim() || undefined,
        hotelDetails: hotelDetails.trim() || undefined,
        itineraryProgram: itineraryProgram.trim(),
        includedServices,
        excludedServices: excludedServices.split(',').map(s => s.trim()).filter(Boolean),
        vendorNotes: vendorNotes.trim() || undefined,
        validDays: Number(validDays) || 3,
      };

      await vendorCustomTourApi.submitBid(selectedRequest.id, payload);

      setBidSuccessMessage('Təklifiniz uğurla göndərildi! Müştəri panelində dərhal görünəcək.');
      setTimeout(() => {
        setSelectedRequest(null);
        loadTenderData();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to submit bid:', err);
      setBidFormError(err.response?.data?.message || 'Təklif göndərilərkən xəta baş verdi.');
    } finally {
      setSubmittingBid(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setVehicleFilter('ALL');
    setBidStatusFilter('ALL');
    setSortBy('NEWEST');
  };

  const getRemainingDaysText = (expiresAt: string) => {
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return { text: 'Müddət bitib', isUrgent: true };
    if (diffDays <= 2) return { text: `Son ${diffDays} gün!`, isUrgent: true };
    return { text: `${diffDays} gün qalıb`, isUrgent: false };
  };

  return (
    <div className="vendor-tender-page">
      {/* Header */}
      <div className="vendor-tender-header">
        <div className="vendor-tender-title-wrap">
          <div className="vendor-tender-badge">
            <Sparkles size={14} /> B2B Tender & Bidding Platforması
          </div>
          <h1>Fərdi və Qrup Turları Tender Masası</h1>
          <p>
            Müştərilərin və korporativ şirkətlərin platformada tərtib etdiyi fərdi səyahət sorğularına ən optimal qiymət və tur proqramınızı təqdim edin.
          </p>
        </div>

        <div className="vendor-tender-header-actions">
          <button onClick={loadTenderData} className="vendor-btn-refresh-board" title="Məlumatları yenilə">
            <RotateCcw size={16} />
            <span>Yenilə</span>
          </button>
          <Link to="/tenders/my-bids" className="vendor-tender-my-bids-btn">
            <Briefcase size={16} />
            <span>Təkliflərim ({stats.mySubmittedBids})</span>
            {stats.myWonBids > 0 && <span className="vendor-won-count-pill">{stats.myWonBids} Qazanıldı</span>}
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards (4 Cards) */}
      <div className="vendor-tender-stats-grid">
        <div className="vendor-tender-stat-card">
          <div className="vendor-stat-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Briefcase size={22} />
          </div>
          <div className="vendor-stat-info">
            <span className="vendor-stat-num">{stats.totalOpenTenders || requests.length}</span>
            <span className="vendor-stat-label">Aktiv Açıq Tenderlər</span>
          </div>
        </div>

        <div className="vendor-tender-stat-card">
          <div className="vendor-stat-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Send size={22} />
          </div>
          <div className="vendor-stat-info">
            <span className="vendor-stat-num">{stats.mySubmittedBids}</span>
            <span className="vendor-stat-label">Təqdim Edilmiş Təkliflər</span>
          </div>
        </div>

        <div className="vendor-tender-stat-card">
          <div className="vendor-stat-icon-wrap" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <Award size={22} />
          </div>
          <div className="vendor-stat-info">
            <span className="vendor-stat-num">{stats.myWonBids}</span>
            <span className="vendor-stat-label">Qazanılmış Tenderlər</span>
          </div>
        </div>

        <div className="vendor-tender-stat-card">
          <div className="vendor-stat-icon-wrap" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <TrendingUp size={22} />
          </div>
          <div className="vendor-stat-info">
            <span className="vendor-stat-num">{(stats.totalWonAmount || 0).toLocaleString()} ₼</span>
            <span className="vendor-stat-label">Qazanılan Dövriyyə</span>
          </div>
        </div>
      </div>

      {/* Multi-Filter Toolbar */}
      <div className="vendor-tender-toolbar">
        <div className="vendor-tender-search-box">
          <Search size={18} className="vendor-search-icon" />
          <input
            type="text"
            placeholder="İstiqamət (məs: Şuşa, Quba), sorğu № (#CTR-...), qeydlər..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="vendor-clear-search" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tour Type Filter */}
        <div className="vendor-tender-type-filter">
          <button
            className={`vendor-filter-pill ${typeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setTypeFilter('ALL')}
          >
            Hamısı
          </button>
          <button
            className={`vendor-filter-pill ${typeFilter === 'INDIVIDUAL' ? 'active' : ''}`}
            onClick={() => setTypeFilter('INDIVIDUAL')}
          >
            Fərdi
          </button>
          <button
            className={`vendor-filter-pill ${typeFilter === 'FAMILY' ? 'active' : ''}`}
            onClick={() => setTypeFilter('FAMILY')}
          >
            Ailəvi
          </button>
          <button
            className={`vendor-filter-pill ${typeFilter === 'CORPORATE' ? 'active' : ''}`}
            onClick={() => setTypeFilter('CORPORATE')}
          >
            Korporativ
          </button>
        </div>

        {/* Dropdowns */}
        <div className="vendor-tender-dropdowns-group">
          <select
            className="vendor-filter-select"
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
          >
            <option value="ALL">Bütün Nəqliyyatlar</option>
            <option value="SEDAN_4">Sedan (4 yerlik)</option>
            <option value="MINIVAN_MERCEDES_VITO_7">Minivan (Vito 7 yer)</option>
            <option value="MINIBUS_MERCEDES_SPRINTER_18">Sprinter (18 yer)</option>
            <option value="BUS_NEOPLAN_50">Avtobus (50 yer)</option>
          </select>

          <select
            className="vendor-filter-select"
            value={bidStatusFilter}
            onChange={(e) => setBidStatusFilter(e.target.value)}
          >
            <option value="ALL">Bütün Statuslar</option>
            <option value="UNBID">Təklif vermədiklərim</option>
            <option value="BIDDED">Təklif verdiklərim</option>
            <option value="WON">Qalib gəldiklərim</option>
          </select>

          <select
            className="vendor-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="NEWEST">Ən yeni sorğular</option>
            <option value="BUDGET_HIGH">Büdcə: Yüksəkdən aşağıya</option>
            <option value="BUDGET_LOW">Büdcə: Aşağıdan yuxarıya</option>
            <option value="DURATION">Müddət (Uzun turlar)</option>
          </select>

          {(searchQuery || typeFilter !== 'ALL' || vehicleFilter !== 'ALL' || bidStatusFilter !== 'ALL' || sortBy !== 'NEWEST') && (
            <button className="vendor-btn-reset-filters" onClick={resetFilters} title="Filtrləri sıfırla">
              <RotateCcw size={14} /> Sıfırla
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="vendor-tender-alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={loadTenderData}>Yenidən yoxla</button>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="vendor-tender-loading-state">
          <Loader2 size={36} className="animate-spin" color="#2563eb" />
          <p>Aktiv tender sorğuları yüklənir...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="vendor-tender-empty-state">
          <Briefcase size={48} color="#94a3b8" />
          <h3>Axtarışınıza uyğun heç bir tender tapılmadı</h3>
          <p>Filtrləri dəyişərək və ya sıfırlayaraq bütün aktiv tenderləri yenidən nəzərdən keçirin.</p>
          <button className="vendor-btn-reset-large" onClick={resetFilters}>
            Bütün Filtrləri Sıfırla
          </button>
        </div>
      ) : (
        <div className="vendor-tender-cards-list">
          {filteredRequests.map((req) => {
            const hasSubmitted = req.hasMyBid || myBids.some(b => b.requestId === req.id);
            const mySubmittedBid = req.myBid || myBids.find(b => b.requestId === req.id);
            const isWinner = mySubmittedBid?.status === 'ACCEPTED' || (req.status === 'ACCEPTED' && mySubmittedBid?.status === 'ACCEPTED');
            const expiry = getRemainingDaysText(req.expiresAt);

            return (
              <div key={req.id} className={`vendor-tender-card ${isWinner ? 'winner-card' : ''}`}>
                {/* Top Bar */}
                <div className="vendor-card-top-row">
                  <div className="vendor-card-ref-box">
                    <span className="vendor-card-req-number">{req.requestNumber}</span>
                    <span className={`vendor-badge-type type-${req.type.toLowerCase()}`}>
                      {req.type === 'INDIVIDUAL' ? 'Fərdi Tur' : req.type === 'FAMILY' ? 'Ailəvi Tur' : req.type === 'CORPORATE' ? 'Korporativ Qrup' : 'Xüsusi Qrup'}
                    </span>
                    {isWinner && (
                      <span className="vendor-winner-badge">
                        <CheckCircle2 size={14} /> Sizin Təklif Qalib Seçildi!
                      </span>
                    )}
                  </div>

                  <div className="vendor-card-meta-right">
                    <span className="vendor-bids-count-tag">
                      <strong>{req.bidsCount || 0}</strong> agentlik təklif verib
                    </span>
                    <span className={`vendor-expiry-tag ${expiry.isUrgent ? 'urgent' : ''}`}>
                      <Clock size={13} /> {expiry.text} ({new Date(req.expiresAt).toLocaleDateString('az-AZ')})
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="vendor-card-body">
                  <div className="vendor-card-title-row">
                    <h3 className="vendor-card-title">{req.title || 'Fərdi Marşrut Sorğusu'}</h3>
                    <button
                      className="vendor-btn-quick-preview"
                      onClick={() => setPreviewRequest(req)}
                      title="Ətraflı Bax"
                    >
                      <Eye size={15} /> Detallara bax
                    </button>
                  </div>

                  {/* Route Destinations */}
                  <div className="vendor-route-chain">
                    {req.destinations.map((dest, idx) => (
                      <React.Fragment key={idx}>
                        <span className="vendor-route-stop">
                          <MapPin size={13} /> {dest}
                        </span>
                        {idx < req.destinations.length - 1 && <span className="vendor-route-arrow">➔</span>}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Specs Grid */}
                  <div className="vendor-specs-grid">
                    <div className="vendor-spec-item">
                      <Calendar size={15} />
                      <div>
                        <strong>{new Date(req.startDate).toLocaleDateString('az-AZ')} — {new Date(req.endDate).toLocaleDateString('az-AZ')}</strong>
                        <span>{req.durationDays} Gün / {req.durationDays > 1 ? req.durationDays - 1 : 0} Gecə</span>
                      </div>
                    </div>

                    <div className="vendor-spec-item">
                      <Users size={15} />
                      <div>
                        <strong>{req.adultsCount} Böyük {req.childrenCount > 0 ? `, ${req.childrenCount} Uşaq` : ''}</strong>
                        <span>Cəmi: {req.totalPassengers} Sərnişin</span>
                      </div>
                    </div>

                    <div className="vendor-spec-item">
                      <Car size={15} />
                      <div>
                        <strong>
                          {req.vehicleType === 'SEDAN_4' ? 'Sedan (4 yer)' :
                           req.vehicleType === 'MINIVAN_MERCEDES_VITO_7' ? 'Minivan (Vito 7 yer)' :
                           req.vehicleType === 'MINIBUS_MERCEDES_SPRINTER_18' ? 'Mikroavtobus (18 yer)' :
                           req.vehicleType === 'BUS_NEOPLAN_50' ? 'Böyük Avtobus (50 yer)' : 'Təyin edilməyib'}
                        </strong>
                        <span>Tələb Olunan Nəqliyyat</span>
                      </div>
                    </div>

                    <div className="vendor-spec-item">
                      <Building size={15} />
                      <div>
                        <strong>
                          {req.hotelPreference === 'NONE' ? 'Otel Tələb Olunmur' :
                           req.hotelPreference === 'HOTEL_3_STAR' ? '3* Standart Otel' :
                           req.hotelPreference === 'HOTEL_4_STAR' ? '4* Komfortlu Otel' :
                           req.hotelPreference === 'HOTEL_5_STAR' ? '5* Premium Lüks' :
                           req.hotelPreference === 'COTTAGES' ? 'Ailəvi Kotteclər' : 'Butik Otel'}
                        </strong>
                        <span>Qonaqlama Növü</span>
                      </div>
                    </div>

                    <div className="vendor-spec-item">
                      <Utensils size={15} />
                      <div>
                        <strong>
                          {req.mealPreference === 'NONE' ? 'Yeməksiz' :
                           req.mealPreference === 'BREAKFAST_ONLY' ? 'Yalnız Səhər Yeməyi' :
                           req.mealPreference === 'HALF_BOARD' ? 'Yarım Pansion (2 dəfə)' :
                           req.mealPreference === 'FULL_BOARD' ? 'Tam Pansion (3 dəfə)' : 'Xüsusi Menyu'}
                        </strong>
                        <span>Qidalanma Planı</span>
                      </div>
                    </div>

                    <div className="vendor-spec-item">
                      <DollarSign size={15} />
                      <div>
                        <strong className="vendor-budget-highlight">
                          {req.budgetMin || req.budgetMax ? (
                            `${(req.budgetMin || 0).toLocaleString()} - ${(req.budgetMax || 0).toLocaleString()} AZN`
                          ) : (
                            'Açıq büdcə'
                          )}
                        </strong>
                        <span>Müştərinin Büdcəsi</span>
                      </div>
                    </div>
                  </div>

                  {/* Attractions */}
                  {req.attractions && req.attractions.length > 0 && (
                    <div className="vendor-attractions-row">
                      <span className="vendor-attract-label">Görüləcək məkanlar:</span>
                      <div className="vendor-attract-chips">
                        {req.attractions.map((att, i) => (
                          <span key={i} className="vendor-attract-chip">{att}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Notes */}
                  {req.specialNotes && (
                    <div className="vendor-special-notes">
                      <strong>Müştəri istəyi:</strong> "{req.specialNotes}"
                    </div>
                  )}
                </div>

                {/* Footer Action Bar */}
                <div className="vendor-card-footer">
                  {hasSubmitted ? (
                    <div className="vendor-submitted-status-box">
                      <div className="vendor-submitted-info">
                        <CheckCircle2 size={18} color="#10b981" />
                        <div>
                          <strong>
                            Təklifiniz Təqdim Edilib: {Number(mySubmittedBid?.offeredPrice || 0).toLocaleString()} AZN
                            <span className="vendor-per-person-muted">
                              (~{Math.round(Number(mySubmittedBid?.offeredPrice || 0) / req.totalPassengers)} AZN / nəfər)
                            </span>
                          </strong>
                          <span>
                            Status: {mySubmittedBid?.status === 'ACCEPTED' ? '✅ Qalib Seçildi' : mySubmittedBid?.status === 'REJECTED' ? '❌ Başqa təklif seçildi' : '⏳ Müştəri baxışında'}
                          </span>
                        </div>
                      </div>
                      <Link to="/tenders/my-bids" className="vendor-btn-view-my-bid">
                        Təklifə bax & İdarə et <ChevronRight size={14} />
                      </Link>
                    </div>
                  ) : (
                    <button
                      className="vendor-btn-submit-tender-bid"
                      onClick={() => openBidModal(req)}
                    >
                      <Send size={16} />
                      <span>Bu Sorğuya Qiymət və Proqram Təklif Et</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK PREVIEW MODAL */}
      {previewRequest && (
        <div className="vendor-modal-backdrop" onClick={() => setPreviewRequest(null)}>
          <div className="vendor-modal-container preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vendor-modal-header">
              <div>
                <div className="vendor-modal-sub">{previewRequest.requestNumber}</div>
                <h2>{previewRequest.title || 'Fərdi Tur Detalları'}</h2>
              </div>
              <button className="vendor-modal-close-btn" onClick={() => setPreviewRequest(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="vendor-preview-modal-body">
              <div className="vendor-preview-banner">
                <div className="vendor-preview-banner-item">
                  <span>Müştəri</span>
                  <strong>{previewRequest.user?.name || 'Fərdi Müştəri'}</strong>
                </div>
                <div className="vendor-preview-banner-item">
                  <span>Tarixlər</span>
                  <strong>{new Date(previewRequest.startDate).toLocaleDateString('az-AZ')} — {new Date(previewRequest.endDate).toLocaleDateString('az-AZ')}</strong>
                </div>
                <div className="vendor-preview-banner-item">
                  <span>Müddət</span>
                  <strong>{previewRequest.durationDays} Gün ({previewRequest.durationDays - 1} Gecə)</strong>
                </div>
                <div className="vendor-preview-banner-item">
                  <span>Sərnişinlər</span>
                  <strong>{previewRequest.adultsCount} Böyük + {previewRequest.childrenCount} Uşaq</strong>
                </div>
                <div className="vendor-preview-banner-item">
                  <span>Büdcə</span>
                  <strong className="text-emerald">{previewRequest.budgetMin || 0} - {previewRequest.budgetMax || 0} AZN</strong>
                </div>
              </div>

              <div className="vendor-preview-section">
                <h4>Marşrut Şəbəkəsi</h4>
                <div className="vendor-route-chain">
                  {previewRequest.destinations.map((d, i) => (
                    <span key={i} className="vendor-route-stop"><MapPin size={12} /> {d}</span>
                  ))}
                </div>
              </div>

              {previewRequest.attractions && previewRequest.attractions.length > 0 && (
                <div className="vendor-preview-section">
                  <h4>Ziyarət Olunması Arzu Olunan Məkanlar</h4>
                  <div className="vendor-attract-chips">
                    {previewRequest.attractions.map((a, i) => (
                      <span key={i} className="vendor-attract-chip">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="vendor-preview-section">
                <h4>Xüsusi Tələblər</h4>
                <div className="vendor-preview-requirements-grid">
                  <div><strong>Nəqliyyat:</strong> {previewRequest.vehicleType}</div>
                  <div><strong>Qonaqlama:</strong> {previewRequest.hotelPreference}</div>
                  <div><strong>Qidalanma:</strong> {previewRequest.mealPreference}</div>
                  <div><strong>Bələdçi:</strong> {previewRequest.guideRequired ? `Bəli (${previewRequest.guideLanguage || 'Azərbaycan dili'})` : 'Xeyr'}</div>
                </div>
              </div>

              {previewRequest.specialNotes && (
                <div className="vendor-preview-section">
                  <h4>Sifarişçinin Əlavə Qeydləri</h4>
                  <div className="vendor-special-notes">"{previewRequest.specialNotes}"</div>
                </div>
              )}
            </div>

            <div className="vendor-modal-actions">
              <button className="vendor-btn-cancel-modal" onClick={() => setPreviewRequest(null)}>
                Bağla
              </button>
              <button
                className="vendor-btn-submit-modal"
                onClick={() => {
                  const req = previewRequest;
                  setPreviewRequest(null);
                  openBidModal(req);
                }}
              >
                <Send size={15} /> Təklif Göndər
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMART BID SUBMISSION MODAL */}
      {selectedRequest && (
        <div className="vendor-modal-backdrop" onClick={() => !submittingBid && setSelectedRequest(null)}>
          <div className="vendor-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="vendor-modal-header">
              <div>
                <div className="vendor-modal-sub">{selectedRequest.requestNumber} üzrə Qiymət və Proqram</div>
                <h2>Ağıllı Tender Təklifi Təqdimatı</h2>
              </div>
              <button
                className="vendor-modal-close-btn"
                onClick={() => !submittingBid && setSelectedRequest(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitBid} className="vendor-modal-form">
              {bidFormError && (
                <div className="vendor-modal-alert-error">
                  <AlertCircle size={16} />
                  <span>{bidFormError}</span>
                </div>
              )}

              {bidSuccessMessage && (
                <div className="vendor-modal-alert-success">
                  <CheckCircle2 size={16} />
                  <span>{bidSuccessMessage}</span>
                </div>
              )}

              {/* Request Recap Card */}
              <div className="vendor-recap-box">
                <div className="vendor-recap-route">
                  <strong>Marşrut:</strong> {selectedRequest.destinations.join(' ➔ ')}
                </div>
                <div className="vendor-recap-specs">
                  <span>📅 {selectedRequest.durationDays} Gün</span>
                  <span>👥 {selectedRequest.totalPassengers} Sərnişin</span>
                  <span>💰 Müştəri Büdcəsi: {selectedRequest.budgetMin || 0} - {selectedRequest.budgetMax || 0} AZN</span>
                </div>
              </div>

              {/* Smart Template Quick-Select Bar */}
              <div className="vendor-template-bar">
                <span className="vendor-template-label">Sürətli Şablon Doldur:</span>
                <div className="vendor-template-btns">
                  <button type="button" onClick={() => applyTemplate('general')}>Ümumi Tur</button>
                  <button type="button" onClick={() => applyTemplate('karabakh')}>Qarabağ / Şuşa VIP</button>
                  <button type="button" onClick={() => applyTemplate('gabala')}>Qəbələ / Şəki</button>
                </div>
              </div>

              {/* Price Row */}
              <div className="vendor-form-section">
                <label className="vendor-form-label">
                  Ümumi Təklif Qiyməti (Bütün xidmətlər və qrup üçün cəmi AZN) *
                </label>
                <div className="vendor-price-input-wrap">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="Məsələn: 3600"
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(e.target.value ? Number(e.target.value) : '')}
                    className="vendor-price-input"
                  />
                  <span className="vendor-currency-addon">AZN</span>
                </div>
                {offeredPrice && Number(offeredPrice) > 0 && (
                  <div className="vendor-price-metrics-row">
                    <span className="vendor-per-person-calc">
                      Hər sərnişin üçün: ~{Math.round(Number(offeredPrice) / selectedRequest.totalPassengers)} AZN
                    </span>
                    {selectedRequest.budgetMax && Number(offeredPrice) <= selectedRequest.budgetMax && (
                      <span className="vendor-budget-match-badge">
                        ✅ Müştərinin büdcə tələbinə tam uyğundur!
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Transport & Hotel Details */}
              <div className="vendor-form-row-2col">
                <div className="vendor-form-col">
                  <label className="vendor-form-label">Təklif etdiyiniz Nəqliyyat Vəsaiti</label>
                  <input
                    type="text"
                    placeholder="Məs: Mercedes Vito 2022, kondisioner, WiFi"
                    value={vehicleDetails}
                    onChange={(e) => setVehicleDetails(e.target.value)}
                  />
                </div>

                <div className="vendor-form-col">
                  <label className="vendor-form-label">Təklif etdiyiniz Qonaqlama (Otel)</label>
                  <input
                    type="text"
                    placeholder="Məs: Qəbələ 5* Resort Hotel, Standart DBL"
                    value={hotelDetails}
                    onChange={(e) => setHotelDetails(e.target.value)}
                  />
                </div>
              </div>

              {/* Day-by-Day Itinerary */}
              <div className="vendor-form-section">
                <label className="vendor-form-label">
                  Günbəgün Marşrut və Ekskursiya Proqramı *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Məsələn:&#10;1-ci gün: Bakıdan çıxış, Şamaxı Cümə Məscidi ziyarəti, Şəkidə otelə yerləşmə...&#10;2-ci gün: Şəki Xan Sarayı, Karvansaray, Kiş kilsəsi..."
                  value={itineraryProgram}
                  onChange={(e) => setItineraryProgram(e.target.value)}
                />
              </div>

              {/* Included Services Selector */}
              <div className="vendor-form-section">
                <label className="vendor-form-label">Təklif Qiymətinə Daxil Olan Xidmətlər</label>
                <div className="vendor-services-checklist">
                  {DEFAULT_INCLUDED_SERVICES.map((srv, idx) => {
                    const isChecked = includedServices.includes(srv);
                    return (
                      <button
                        type="button"
                        key={idx}
                        className={`vendor-service-check-pill ${isChecked ? 'checked' : ''}`}
                        onClick={() => handleToggleService(srv)}
                      >
                        {isChecked ? <CheckCircle2 size={14} color="#10b981" /> : <div className="vendor-check-circle-empty" />}
                        <span>{srv}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Excluded Services & Validity */}
              <div className="vendor-form-row-2col">
                <div className="vendor-form-col">
                  <label className="vendor-form-label">Daxil Olmayan Xidmətlər</label>
                  <input
                    type="text"
                    placeholder="Şəxsi xərclər, menyudan kənar içkilər..."
                    value={excludedServices}
                    onChange={(e) => setExcludedServices(e.target.value)}
                  />
                </div>

                <div className="vendor-form-col">
                  <label className="vendor-form-label">Təklifin Etibarlılıq Müddəti (gün)</label>
                  <select
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value))}
                  >
                    <option value={2}>2 Gün</option>
                    <option value={3}>3 Gün</option>
                    <option value={5}>5 Gün</option>
                    <option value={7}>7 Gün</option>
                    <option value={10}>10 Gün</option>
                  </select>
                </div>
              </div>

              {/* Vendor Notes */}
              <div className="vendor-form-section">
                <label className="vendor-form-label">Müştəriyə Əlavə Qeyd və ya Şirkət Bonusu (İstəyə görə)</label>
                <input
                  type="text"
                  placeholder="Məs: Qrup üçün pulsuz çay dəsgahı və professional fotosessiya hədiyyə olunur."
                  value={vendorNotes}
                  onChange={(e) => setVendorNotes(e.target.value)}
                />
              </div>

              {/* Modal Buttons */}
              <div className="vendor-modal-actions">
                <button
                  type="button"
                  className="vendor-btn-cancel-modal"
                  disabled={submittingBid}
                  onClick={() => setSelectedRequest(null)}
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="vendor-btn-submit-modal"
                  disabled={submittingBid}
                >
                  {submittingBid ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Təklif Təsdiqlənir...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Təklifi Müştəriyə Göndər</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
