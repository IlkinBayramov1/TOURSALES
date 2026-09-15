import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, MapPin, Calendar, Users, Star, ShieldCheck, Gift,
  ArrowRight, ChevronRight, ChevronLeft, Percent, PlaneTakeoff, 
  Bus, Flame, Crown, Sparkles, Coffee, Umbrella, HelpCircle, 
  Heart, Copy, Check, Building2, Tag
} from 'lucide-react';
import { Tour, Ad, CompanyPublic, CampaignPromo } from '@toursales/types';
import { tourApi } from '../../modules/tour/api/tourApi';
import { adsApi } from '../../modules/ads/api/adsApi';
import { companyApi } from '../../modules/company/api/companyApi';
import { campaignApi } from '../../modules/campaign/api/campaignApi';
import { useCurrency } from '../../shared/context/CurrencyContext';
import { useToast } from '../../shared/context/ToastContext';
import { useFavorites } from '../../shared/context/FavoritesContext';
import { formatDate } from '../../shared/utils/formatters';
import './HomePage.css';

// Fallback high-res platform banners when vendor ads are initializing
const DEFAULT_HERO_SLIDES = [
  {
    id: 'default-1',
    title: 'Yay tətili planlarına <span>indidən başlayın.</span>',
    subtitle: 'Bütün beynəlxalq istiqamətlərdə 30%-dək qənaət və lisenziyalı agentlik zəmanəti.',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=2000',
    badge: 'Erkən Rezervasiya',
    link: '/tours?category=FOREIGN',
    isAd: false,
  },
  {
    id: 'default-2',
    title: 'Dağların zirvəsində <span>unudulmaz anlar.</span>',
    subtitle: 'Şahdağ, Quba və Qəbələ turlarında canlı oturacaq seçimi ilə yerinizi zəmanətə alın.',
    image: 'https://images.unsplash.com/photo-1548777123-e216912df7d8?auto=format&fit=crop&q=80&w=2000',
    badge: 'Daxili Turlar',
    link: '/tours?category=DOMESTIC',
    isAd: false,
  },
  {
    id: 'default-3',
    title: 'Kapadokyanın <span>sehrli səması.</span>',
    subtitle: 'Hava şarları, yeraltı şəhərlər və premium otellərdə qrup və fərdi səyahətlər.',
    image: 'https://images.unsplash.com/photo-1506459225024-1428097a7e18?auto=format&fit=crop&q=80&w=2000',
    badge: 'Kəşf Et',
    link: '/tours',
    isAd: false,
  },
];

// Curated destinations for Bento navigation
const TRENDING_DESTINATIONS = [
  { id: 'd1', name: 'İstanbul, Türkiyə', count: 'Populyar', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80&w=600', link: '/tours?q=Istanbul' },
  { id: 'd2', name: 'Quba & Şahdağ', count: 'Həftəsonu', image: 'https://images.unsplash.com/photo-1548777123-e216912df7d8?auto=format&fit=crop&q=80&w=600', link: '/tours?q=Quba' },
  { id: 'd3', name: 'Dubay, BƏƏ', count: 'VIP İstiqamət', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=600', link: '/tours?q=Dubay' },
  { id: 'd4', name: 'Qəbələ & İsmayıllı', count: 'Təbiət', image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80&w=600', link: '/tours?q=Qebele' },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { success } = useToast();

  // Dynamic States from Backend APIs
  const [heroSlides, setHeroSlides] = useState<any[]>(DEFAULT_HERO_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [tours, setTours] = useState<Tour[]>([]);
  const [companies, setCompanies] = useState<CompanyPublic[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<CampaignPromo | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Global Wishlist & Favorites
  const { isFavorite, toggleFavorite } = useFavorites();

  // Search Engine State
  const [searchDestination, setSearchDestination] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchPax, setSearchPax] = useState('');

  // 1. Fetch Dynamic Data from APIs
  useEffect(() => {
    let isMounted = true;

    const loadAllHomeData = async () => {
      try {
        setLoading(true);

        // Fetch vendor ads, tours, companies and active campaigns in parallel
        const [adsRes, toursRes, companiesRes, campaignsRes] = await Promise.allSettled([
          adsApi.getPublicAds('HERO', 5),
          tourApi.getTours({ limit: 20 }),
          companyApi.getPublicCompanies(8),
          campaignApi.getActiveCampaigns(),
        ]);

        if (!isMounted) return;

        // Process Hero Ads
        if (adsRes.status === 'fulfilled' && adsRes.value && adsRes.value.length > 0) {
          const dynamicAdSlides = adsRes.value.map((ad: Ad) => {
            let img = ad.imageUrl;
            if (!img && ad.tour?.images) {
              img = Array.isArray(ad.tour.images) ? ad.tour.images[0] : ad.tour.images;
            }
            return {
              id: ad.id,
              title: `${ad.title} <span>${ad.companyName ? `• ${ad.companyName}` : ''}</span>`,
              subtitle: ad.tour ? `${ad.tour.title} — Xüsusi partnyor təklifi` : 'Lisenziyalı turizm agentliyindən eksklüziv səyahət.',
              image: img || 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=2000',
              badge: ad.companyName ? `Sponsorlu • ${ad.companyName}` : 'Sponsorlu Təklif',
              link: ad.tourId ? `/tours/${ad.tourId}` : (ad.linkUrl || '/tours'),
              isAd: true,
              ad,
            };
          });

          // If vendor ads exist, show them first, supplementing with default slides if needed
          const combinedSlides = dynamicAdSlides.length < 3 
            ? [...dynamicAdSlides, ...DEFAULT_HERO_SLIDES.slice(0, 3 - dynamicAdSlides.length)]
            : dynamicAdSlides;
          setHeroSlides(combinedSlides);
        }

        // Process Tours
        if (toursRes.status === 'fulfilled' && toursRes.value?.data) {
          setTours(toursRes.value.data);
        }

        // Process Companies
        if (companiesRes.status === 'fulfilled' && companiesRes.value) {
          setCompanies(companiesRes.value);
        }

        // Process Active Campaigns
        if (campaignsRes.status === 'fulfilled' && campaignsRes.value?.data && campaignsRes.value.data.length > 0) {
          setActiveCampaign(campaignsRes.value.data[0]);
        }
      } catch (err) {
        console.error('Failed to load home page dynamic data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAllHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Slayder avtomatik keçidi (6 saniyə)
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));

  // Click handler for Hero Slide (records vendor ad click)
  const handleSlideClick = (slide: any) => {
    if (slide.isAd && slide.ad?.id) {
      adsApi.recordClick(slide.ad.id);
    }
    if (slide.link) {
      if (slide.link.startsWith('http')) {
        window.open(slide.link, '_blank');
      } else {
        navigate(slide.link);
      }
    }
  };

  // Search execution
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchDestination.trim()) params.append('q', searchDestination.trim());
    if (searchDate.trim()) params.append('date', searchDate.trim());
    if (searchPax.trim()) params.append('pax', searchPax.trim());
    navigate(`/tours?${params.toString()}`);
  };

  // Promo code copy handler
  const handleCopyPromo = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    success(`"${code}" promo kodu kopyalandı! Rezervasiya zamanı tətbiq edin.`, 'Kupon Aktivdir');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Image extraction helper
  const getTourImage = (images?: string[] | string): string => {
    if (Array.isArray(images) && images.length > 0 && images[0]) return images[0];
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      } catch {
        if (images.startsWith('http')) return images;
      }
    }
    return 'https://images.unsplash.com/photo-1548777123-e216912df7d8?auto=format&fit=crop&q=80&w=800';
  };

  // Segmented Tour Lists
  const vipTours = tours.filter((t) => t.isVIP || (t.company?.rating && t.company.rating >= 4.8)).slice(0, 4);
  const domesticTours = tours.filter((t) => t.type === 'DOMESTIC' || !t.destinationCountry || t.destinationCountry.toLowerCase().includes('az')).slice(0, 4);
  const foreignTours = tours.filter((t) => t.type === 'FOREIGN' || (t.destinationCountry && !t.destinationCountry.toLowerCase().includes('az'))).slice(0, 4);

  // Fallback subset if categories are not yet differentiated in database
  const finalVipTours = vipTours.length > 0 ? vipTours : tours.slice(0, 4);
  const finalDomesticTours = domesticTours.length > 0 ? domesticTours : tours.slice(0, 4);
  const finalForeignTours = foreignTours.length > 0 ? foreignTours : tours.slice(2, 6);

  // Card Renderer for Dynamic Tour
  const renderTourCard = (tour: Tour, isDomestic = false, isVIP = false) => {
    const tourImage = getTourImage(tour.images);
    const companyName = tour.company?.name || tour.company?.legalName || 'Rəsmi Partnyor';
    const rating = tour.company?.rating || 5.0;
    const tourPrice = tour.price ?? tour.basePrice ?? 0;
    const loyaltyPoints = Math.max(15, Math.round(tourPrice * 0.05));
    const isSaved = isFavorite(tour.id);
    const isVipCard = isVIP || Boolean(tour.isVIP);

    return (
      <div 
        key={tour.id} 
        className={`web-tour-product-card ${isVipCard ? 'web-vip-tour-card' : ''}`}
        onClick={() => navigate(`/tours/${tour.id}`)}
      >
        <div className="web-tour-thumbnail-wrapper">
          <img src={tourImage} alt={tour.title} className="web-tour-img" loading="lazy" />
          
          {isVipCard && (
            <div className="web-vip-badge">
              <Crown size={14} /> VIP Paket
            </div>
          )}
          {!isVipCard && tour.availableSeats !== undefined && tour.availableSeats <= 5 && (
            <span className="web-floating-card-badge">Son {tour.availableSeats} yer!</span>
          )}
          
          <button 
            className={`web-wishlist-btn ${isSaved ? 'web-wishlist-active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(tour);
            }}
            aria-label={isSaved ? "Seçilmişlərdən çıxar" : "Sevimlilərə əlavə et"}
          >
            <Heart size={18} fill={isSaved ? '#ff385c' : 'none'} color={isSaved ? '#ff385c' : 'currentColor'} />
          </button>
          
          <div className="web-loyalty-points-indicator">
            <Gift size={12} />
            <span>+{loyaltyPoints} Xal</span>
          </div>
        </div>

        <div className="web-tour-product-meta-body">
          <div className="web-operator-row">
            <div className="web-operator-title-group">
              <ShieldCheck size={14} className={isVipCard ? 'web-verified-icon-vip' : 'web-verified-icon'} />
              <span className="web-operator-company-name">{companyName}</span>
            </div>
            <div className="web-rating-info-group">
              <Star size={14} className="web-star-rating-icon" />
              <span>{rating.toFixed(1)}</span>
            </div>
          </div>

          <h3 className="web-tour-title-heading">{tour.title}</h3>
          
          <span className="web-tour-calendar-timeline">
            {tour.type === 'DOMESTIC' ? <Bus size={14} /> : <PlaneTakeoff size={14} />} 
            {tour.startDate ? formatDate(tour.startDate) : 'Hər həftəsonu'}
          </span>

          <div className="web-tour-price-row">
            <div className="web-price-meta-block">
              <span>Başlayan qiymətlərlə</span>
              <h4>{formatPrice(tourPrice)}</h4>
            </div>
            <button className={isVipCard ? 'web-btn-product-redirect-vip' : 'web-btn-product-redirect'}>
              Yer Seç
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Skeleton Card Renderer
  const renderSkeletonCard = (key: number) => (
    <div key={key} className="web-skeleton-card">
      <div className="web-skeleton-thumb" />
      <div className="web-skeleton-body">
        <div className="web-skeleton-line web-skeleton-line-sm" />
        <div className="web-skeleton-line web-skeleton-line-lg" />
        <div className="web-skeleton-line web-skeleton-line-md" />
        <div className="web-skeleton-line web-skeleton-line-sm" style={{ marginTop: 12 }} />
      </div>
    </div>
  );

  return (
    <div className="web-home-container-page">
      
      {/* 1. HERO SLIDESHOW WITH DYNAMIC VENDOR ADS & BENTO SEARCH ENGINE */}
      <section className="web-hero-section-wrapper">
        <div className="web-slider-container">
          {heroSlides.map((slide, index) => (
            <div 
              key={slide.id} 
              className={`web-slide ${index === currentSlide ? 'web-active-slide' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
              onClick={() => handleSlideClick(slide)}
              role="button"
              tabIndex={0}
            >
              <div className="web-slide-overlay">
                <div className="web-slide-content">
                  {slide.isAd ? (
                    <span className="web-sponsored-badge">
                      <Sparkles size={13} /> {slide.badge}
                    </span>
                  ) : (
                    <span className="web-hero-tagline">
                      <Flame size={14} /> {slide.badge}
                    </span>
                  )}
                  <h1 className="web-hero-title" dangerouslySetInnerHTML={{ __html: slide.title }} />
                  <p className="web-hero-subtitle">{slide.subtitle}</p>
                </div>
              </div>
            </div>
          ))}
          
          <button className="web-slider-btn-prev" onClick={prevSlide} aria-label="Əvvəlki"><ChevronLeft size={24} /></button>
          <button className="web-slider-btn-next" onClick={nextSlide} aria-label="Sonrakı"><ChevronRight size={24} /></button>
          
          <div className="web-slider-dots">
            {heroSlides.map((_, idx) => (
              <span 
                key={idx} 
                className={`web-dot ${idx === currentSlide ? 'web-active-dot' : ''}`} 
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>
        </div>

        {/* Integrated Floating Bento Search Engine */}
        <div className="web-search-engine-container">
          <div className="web-search-inner-grid">
            <div className="web-search-field-group">
              <div className="web-search-icon-field"><MapPin size={20} /></div>
              <div className="web-search-text-fields">
                <label>İstiqamət</label>
                <input 
                  type="text" 
                  placeholder="Hara səyahət etmək istəyirsiniz?" 
                  value={searchDestination}
                  onChange={(e) => setSearchDestination(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            <div className="web-search-divider"></div>

            <div className="web-search-field-group">
              <div className="web-search-icon-field"><Calendar size={20} /></div>
              <div className="web-search-text-fields">
                <label>Tarix Aralığı</label>
                <input 
                  type="text" 
                  placeholder="Tarixi seçin (Məs: 2026)" 
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            <div className="web-search-divider"></div>

            <div className="web-search-field-group">
              <div className="web-search-icon-field"><Users size={20} /></div>
              <div className="web-search-text-fields">
                <label>Sərnişin Sayı</label>
                <input 
                  type="text" 
                  placeholder="Neçə nəfər?" 
                  value={searchPax}
                  onChange={(e) => setSearchPax(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            <button className="web-btn-search-execute" onClick={handleSearch}>
              <Search size={18} />
              <span>Axtar</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. VIP TOURS CAROUSEL (Premium Gold Design) */}
      <section className="web-vip-carousel-section">
        <div className="web-section-header-flex">
          <div>
            <div className="web-vip-section-tag"><Crown size={16} /> Eksklüziv Təkliflər</div>
            <h2 className="web-section-main-title">VIP Səyahət Paketləri</h2>
            <p className="web-section-sub-title">5 ulduzlu otellər, VIP transferlər və tam fərdi yanaşma ilə təşkil olunmuş xüsusi turlar.</p>
          </div>
          <Link to="/tours" className="web-btn-view-all-links-vip">Bütün VIP turlar <ArrowRight size={16} /></Link>
        </div>
        <div className="web-tours-carousel">
          {loading 
            ? [1, 2, 3, 4].map(renderSkeletonCard)
            : finalVipTours.map(tour => renderTourCard(tour, tour.type === 'DOMESTIC', true))
          }
        </div>
      </section>

      {/* 3. TRENDING DESTINATIONS (Bento Grid) */}
      <section className="web-destinations-section">
        <div className="web-section-header">
          <h2 className="web-section-main-title">Populyar İstiqamətlər</h2>
          <p className="web-section-sub-title">İstifadəçilərimizin ən çox üstünlük verdiyi şəhərlər və təbiət qoynunda məkanlar.</p>
        </div>
        <div className="web-destinations-grid">
          {TRENDING_DESTINATIONS.map((dest) => (
            <Link to={dest.link} key={dest.id} className="web-destination-card">
              <img src={dest.image} alt={dest.name} className="web-dest-image" loading="lazy" />
              <div className="web-dest-overlay">
                <h3 className="web-dest-name">{dest.name}</h3>
                <span className="web-dest-count">{dest.count}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. DAXİLİ TURLAR CAROUSEL */}
      <section className="web-carousel-section">
        <div className="web-section-header-flex">
          <div>
            <h2 className="web-section-main-title">Bu Həftəsonu Daxili Turlar</h2>
            <p className="web-section-sub-title">Azərbaycanın hər qarışını kəşf edin. Rahat avtobuslar və peşəkar bələdçilərlə.</p>
          </div>
          <Link to="/tours?category=DOMESTIC" className="web-btn-view-all-links">Hamısına bax <ArrowRight size={16} /></Link>
        </div>
        <div className="web-tours-carousel">
          {loading 
            ? [1, 2, 3, 4].map(renderSkeletonCard)
            : finalDomesticTours.map(tour => renderTourCard(tour, true, false))
          }
        </div>
      </section>

      {/* 5. PARTNER TOURISM AGENCIES & COMPANIES SHOWCASE */}
      {companies.length > 0 && (
        <section className="web-companies-section">
          <div className="web-section-header-flex">
            <div>
              <div className="web-vip-section-tag"><Building2 size={16} /> Rəsmi Tərəfdaşlar</div>
              <h2 className="web-section-main-title">Lisenziyalı Turizm Şirkətləri</h2>
              <p className="web-section-sub-title">Dövlət reyestrindən keçmiş, yüksək müştəri məmnuniyyətinə sahib partnyor agentliklər.</p>
            </div>
            <Link to="/tours" className="web-btn-view-all-links">Bütün Agentliklər <ArrowRight size={16} /></Link>
          </div>
          <div className="web-companies-grid">
            {companies.map((company) => (
              <Link 
                to={`/tours?companyId=${company.id}`} 
                key={company.id} 
                className="web-company-card"
              >
                <div className="web-company-avatar-box">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.name} className="web-company-avatar-img" />
                  ) : (
                    <Building2 size={32} color="#3b82f6" />
                  )}
                </div>

                <div className="web-company-name-row">
                  <span className="web-company-name">{company.name}</span>
                  <ShieldCheck size={16} className="web-verified-icon" />
                </div>

                <span className="web-company-city">
                  <MapPin size={12} /> {company.city || 'Bakı, Azərbaycan'}
                </span>

                <div className="web-company-meta-bar">
                  <div className="web-company-rating-box">
                    <Star size={14} fill="#f59e0b" color="#f59e0b" />
                    <span>{(company.rating || 5.0).toFixed(1)}</span>
                  </div>
                  <span className="web-company-tours-count">
                    {company.activeTourCount || 0} Aktiv Tur
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 6. DYNAMIC CAMPAIGN BANNER WITH 1-CLICK PROMO CODE COPY */}
      <section className="web-campaign-section">
        <div className="web-campaign-container">
          <div className="web-campaign-icon-box"><Percent size={28} /></div>
          <div className="web-campaign-body">
            <h4>
              {activeCampaign 
                ? `${activeCampaign.discountValue}% Endirim — ${activeCampaign.promoCode}` 
                : 'Xarici Səyahətlərdə Erkən Rezervasiya (Early Bird)'}
            </h4>
            <p>
              {activeCampaign?.description || 'İlkin 20% ödəniş etməklə yerinizi sabitleyib qalan məbləği turun başlamasına 10 gün qalmış tamamlayın.'}
            </p>
            {activeCampaign?.promoCode && (
              <div className="web-promo-code-container">
                <span className="web-promo-code-text">{activeCampaign.promoCode}</span>
                <button 
                  className="web-btn-copy-promo" 
                  onClick={(e) => handleCopyPromo(activeCampaign.promoCode, e)}
                  title="Promo kodu kopyala"
                >
                  {copiedCode ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Kopyalandı' : 'Kodu Kopyala'}</span>
                </button>
              </div>
            )}
          </div>
          <Link to="/campaigns" className="web-btn-campaign-action">
            Bütün Kampaniyalar <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* 7. XARİCİ TURLAR CAROUSEL */}
      <section className="web-carousel-section">
        <div className="web-section-header-flex">
          <div>
            <h2 className="web-section-main-title">Beynəlxalq Səyahətlər</h2>
            <p className="web-section-sub-title">Uçuş və otel daxil tam paketlər. Viza dəstəyi və lüks xidmət təminatı ilə.</p>
          </div>
          <Link to="/tours?category=FOREIGN" className="web-btn-view-all-links">Hamısına bax <ArrowRight size={16} /></Link>
        </div>
        <div className="web-tours-carousel">
          {loading 
            ? [1, 2, 3, 4].map(renderSkeletonCard)
            : finalForeignTours.map(tour => renderTourCard(tour, false, false))
          }
        </div>
      </section>

      {/* 8. LOYALTY & REWARDS ECOSYSTEM (Apple Wallet Style) */}
      <section className="web-rewards-ecosystem-section">
        <div className="web-rewards-layout-split">
          <div className="web-rewards-text-details">
            <div className="web-badge-promo">
              <Sparkles size={14} /> İstifadəçi Sadiqliyi
            </div>
            <h2 className="web-rewards-main-title">Səyahət etdikcə qazandıran xal ekosistemi</h2>
            <p className="web-rewards-paragraph">
              Biz hər rezervasiyada sizə rəqəmsal şəbəkəmizdə keçərli olan <strong>Səyahət Xalları (Travel Points)</strong> təqdim edirik. Bu xalları yalnız platforma daxilində eksklüziv hədiyyələrə xərcləyə bilərsiniz.
            </p>

            <div className="web-rewards-feature-grid">
              <div className="web-reward-feature-item">
                <div className="web-reward-icon-wrapper"><Coffee size={20} /></div>
                <div>
                  <h5>Kafe & Restoran Kuponları</h5>
                  <p>Yığılan 100 xal şəhərin populyar kafe şəbəkələrində pulsuz kofe və ya desert kuponuna çevrilir.</p>
                </div>
              </div>
              <div className="web-reward-feature-item">
                <div className="web-reward-icon-wrapper-blue"><Umbrella size={20} /></div>
                <div>
                  <h5>Səyahət Sığortası Zəmanəti</h5>
                  <p>200 xala malik olan istifadəçilər növbəti beynəlxalq səyahətlərində pulsuz sığorta paketi qazanırlar.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Virtual Loyalty Card */}
          <div className="web-rewards-visual-card-box">
            <Link to="/account/loyalty" className="web-virtual-loyalty-card">
              <div className="web-vcard-header">
                <div className="web-vcard-brand">
                  <Gift size={16} /> TOURSALES
                </div>
                <ShieldCheck size={20} className="web-vcard-shield" />
              </div>
              
              <div className="web-vcard-body">
                <span className="web-vcard-label">İstifadə edilə bilən balans</span>
                <div className="web-vcard-points-wrap">
                  <h2 className="web-vcard-points">1,420</h2>
                  <span className="web-vcard-currency">XAL</span>
                </div>
              </div>

              <div className="web-vcard-footer">
                <div className="web-vcard-user">
                  <span className="web-vcard-name">Sadiqlik Proqramı</span>
                  <span className="web-vcard-member-since">Premium Üzv</span>
                </div>
              </div>

              {/* Decorator Circles */}
              <div className="web-circle1"></div>
              <div className="web-circle2"></div>
              <div className="web-card-glare"></div>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. TRUST FACTOR & MERCHANT ASSURANCE */}
      <section className="web-assurance-section">
        <div className="web-section-header-centered">
          <h2 className="web-assurance-main-title">Tam Təhlükəsiz Rezervasiya Modulu</h2>
          <p className="web-assurance-sub-title">Müştəri məmnuniyyətini qoruyan və maliyyə itkilərini sıfırlayan təhlükəsizlik alətləri.</p>
        </div>

        <div className="web-assurance-grid">
          <div className="web-assurance-item-card">
            <div className="web-assurance-icon-frame"><CheckCircle2Icon /></div>
            <h4>Yoxlanılmış Lisenziya (Verified)</h4>
            <p>Sistemə yalnız rəsmi dövlət reyestrindən keçmiş, hüquqi şəxs statuslu lisenziyalı agentliklər daxil ola bilər.</p>
          </div>
          <div className="web-assurance-item-card">
            <div className="web-assurance-icon-frame-blue"><Sparkles size={24} /></div>
            <h4>Avtomatlaşdırılmış Rəylər (NPS)</h4>
            <p>Turlar bitdikdən tam 2 saat sonra müştərilərə gedən rəy sorğuları keyfiyyətsiz şirkətləri sistemdən avtomatik uzaqlaşdırır.</p>
          </div>
          <div className="web-assurance-item-card">
            <div className="web-assurance-icon-frame-purple"><HelpCircle size={24} /></div>
            <h4>7/24 Hüquqi Dəstək</h4>
            <p>Həm agentlik panelinə, həm də müştəri checkout mərhələsinə inteqrasiya edilmiş fasiləsiz texniki dəstək mərkəzi.</p>
          </div>
        </div>
      </section>
      
    </div>
  );
};

const CheckCircle2Icon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
