import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, MapPin, Calendar, Users, Star, ShieldCheck, Gift,
  ArrowRight, ChevronRight, ChevronLeft, Info, CheckCircle2, 
  Percent, PlaneTakeoff, Bus, Flame, Crown, Sparkles, Coffee, 
  Umbrella, HelpCircle, Heart
} from 'lucide-react';
import { Tour } from '@toursales/types';
import { tourApi } from '../../modules/tour/api/tourApi';
import './HomePage.css';

// --- SLIDER BANNERS ---
const HERO_SLIDES = [
  {
    id: 1,
    title: 'Yay tətili planlarına <span>indidən başlayın.</span>',
    subtitle: 'Bütün beynəlxalq istiqamətlərdə 30%-dək qənaət, pulsuz hava limanı transferi.',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=2000',
    badge: 'Erkən Rezervasiya',
    link: '/campaigns'
  },
  {
    id: 2,
    title: 'Dağların zirvəsində <span>unudulmaz anlar.</span>',
    subtitle: 'Şahdağ və Tufandağ turlarında 5 AZN behlə yerinizi zəmanətə alın.',
    image: 'https://images.unsplash.com/photo-1548777123-e216912df7d8?auto=format&fit=crop&q=80&w=2000',
    badge: 'Daxili Turlar',
    link: '/domestic'
  },
  {
    id: 3,
    title: 'Kapadokyanın <span>sehrli səması.</span>',
    subtitle: 'Hava şarları, yeraltı şəhərlər və premium otellərdə gecələmə.',
    image: 'https://images.unsplash.com/photo-1506459225024-1428097a7e18?auto=format&fit=crop&q=80&w=2000',
    badge: 'Kəşf Et',
    link: '/foreign'
  }
];

// --- VIP TURLAR ---
const VIP_TOURS = [
  { id: 'vip-1', title: 'Maldiv Adaları: 7 Gecə Lüks Tətil', company: 'Baku Global Elite', rating: 5.0, reviews: 84, price: 3250, date: '15 İyul - 22 İyul', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800', points: 200, isXarici: true },
  { id: 'vip-2', title: 'İsveçrə Alp Dağları Ekspressi', company: 'EuroPassport Premium', rating: 4.9, reviews: 112, price: 2890, date: '05 Avqust - 12 Avqust', image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&q=80&w=800', points: 150, isXarici: true },
  { id: 'vip-3', title: 'Şahdağ Pik Palas Eksklüziv Həftəsonu', company: 'TechTrade Solutions', rating: 5.0, reviews: 65, price: 450, date: 'Hər Həftəsonu', image: 'https://images.unsplash.com/photo-1548777123-e216912df7d8?auto=format&fit=crop&q=80&w=800', points: 50, isXarici: false },
  { id: 'vip-4', title: 'Paris və Amalfi Sahilləri Klassik', company: 'Boutique Travel AZ', rating: 4.9, reviews: 210, price: 3100, date: '10 Sentyabr - 18 Sentyabr', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=800', points: 180, isXarici: true }
];

// --- TRENDING DESTINATIONS ---
const TRENDING_DESTINATIONS = [
  { id: 'd1', name: 'İstanbul, Türkiyə', count: '45+ Tur', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80&w=600', link: '/foreign?search=Istanbul' },
  { id: 'd2', name: 'Quba & Şahdağ', count: '28+ Tur', image: 'https://images.unsplash.com/photo-1548777123-e216912df7d8?auto=format&fit=crop&q=80&w=600', link: '/domestic?search=Quba' },
  { id: 'd3', name: 'Dubay, BƏƏ', count: '12+ Tur', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=600', link: '/foreign?search=Dubay' },
  { id: 'd4', name: 'Qəbələ & İsmayıllı', count: '34+ Tur', image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80&w=600', link: '/domestic?search=Qebele' },
];

// --- DAXİLİ VƏ XARİCİ FALLBACK MOCK DATA ---
const FALLBACK_DAXILI = [
  { id: 'daxili-1', title: 'Şahdağ Kompleksi Həftəsonu Qış & Yay', company: 'TechTrade MMC', rating: 4.9, reviews: 148, price: 35, date: '06 İyun - 07 İyun', image: 'https://images.unsplash.com/photo-1548777123-e216912df7d8?auto=format&fit=crop&q=80&w=600', points: 10, badge: 'Çox Satılan' },
  { id: 'daxili-2', title: 'Gədəbəy və Göygöl Yaylaqları Eko Tur', company: 'Eco Tourism AZ', rating: 4.7, reviews: 94, price: 40, date: '15 İyun', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600', points: 10 },
  { id: 'daxili-3', title: 'Lənkəran - Lerik Cənub İncisi', company: 'Caspian Travel', rating: 4.8, reviews: 112, price: 38, date: '22 İyun', image: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&q=80&w=600', points: 15 },
  { id: 'daxili-4', title: 'Şəki - Qəbələ Tarix və Təbiət Səyahəti', company: 'DiscoverAz Pro', rating: 5.0, reviews: 205, price: 45, date: '28 İyun - 29 İyun', image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80&w=600', points: 20 },
];

const FALLBACK_XARICI = [
  { id: 'xarici-1', title: '4 Gecə 5 Gün İstanbul və Boğaz Turu', company: 'Baku Global', rating: 4.8, reviews: 290, price: 890, date: '12 İyun - 17 İyun', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80&w=600', points: 50, badge: 'Viza Dəstəkli' },
  { id: 'xarici-2', title: 'Roma, Florensiya Klassik Avropa Turu', company: 'EuroPassport Elite', rating: 5.0, reviews: 412, price: 2450, date: '01 İyul - 08 İyul', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=600', points: 100 },
  { id: 'xarici-3', title: 'Sehrli Kapadokya (Hava Şarları & Vadi)', company: 'Global Travel', rating: 4.9, reviews: 320, price: 1200, date: '15 İyul - 20 İyul', image: 'https://images.unsplash.com/photo-1506459225024-1428097a7e18?auto=format&fit=crop&q=80&w=600', points: 60 },
  { id: 'xarici-4', title: 'Dubay Səhra Safari və Şopinq Festivalı', company: 'SkyLine Avia', rating: 4.6, reviews: 185, price: 1450, date: '10 Avqust - 15 Avqust', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=600', points: 70 },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [wishlist, setWishlist] = useState<string[]>(['vip-2', 'daxili-1']);
  
  // Search state
  const [searchDestination, setSearchDestination] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchPax, setSearchPax] = useState('');

  // Slayder animasiyası
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const nextSlide = () => setCurrentSlide(prev => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide(prev => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchDestination) params.append('q', searchDestination);
    navigate(`/tours?${params.toString()}`);
  };

  // Reusable Tour Card Renderer
  const renderCard = (tour: any, isDomestic = false, isVIP = false) => (
    <div 
      key={tour.id} 
      className={`web-tour-product-card ${isVIP ? 'web-vip-tour-card' : ''}`}
      onClick={() => navigate(isDomestic ? `/domestic` : `/foreign`)}
    >
      <div className="web-tour-thumbnail-wrapper">
        <img src={tour.image} alt={tour.title} className="web-tour-img" />
        
        {isVIP && (
          <div className="web-vip-badge">
            <Crown size={14} /> VIP Paket
          </div>
        )}
        {!isVIP && tour.badge && <span className="web-floating-card-badge">{tour.badge}</span>}
        
        <button 
          className={`web-wishlist-btn ${wishlist.includes(tour.id) ? 'web-wishlist-active' : ''}`}
          onClick={(e) => toggleWishlist(tour.id, e)}
          aria-label="Sevimlilərə əlavə et"
        >
          <Heart size={18} fill={wishlist.includes(tour.id) ? "currentColor" : "none"} />
        </button>
        
        <div className="web-loyalty-points-indicator">
          <Gift size={12} />
          <span>+{tour.points} Xal</span>
        </div>
      </div>

      <div className="web-tour-product-meta-body">
        <div className="web-operator-row">
          <div className="web-operator-title-group">
            <ShieldCheck size={14} className={isVIP ? 'web-verified-icon-vip' : 'web-verified-icon'} />
            <span className="web-operator-company-name">{tour.company}</span>
          </div>
          <div className="web-rating-info-group">
            <Star size={14} className="web-star-rating-icon" />
            <span>{tour.rating}</span>
          </div>
        </div>

        <h3 className="web-tour-title-heading">{tour.title}</h3>
        <span className="web-tour-calendar-timeline">
          {isDomestic ? <Bus size={14} /> : <PlaneTakeoff size={14}/>} 
          {tour.date}
        </span>

        <div className="web-tour-price-row">
          <div className="web-price-meta-block">
            <span>Başlayan qiymətlərlə</span>
            <h4>{tour.price} <span className="web-azn-symbol">₼</span></h4>
          </div>
          <button className={isVIP ? 'web-btn-product-redirect-vip' : 'web-btn-product-redirect'}>
            Yer Seç
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="web-home-container-page">
      
      {/* 1. HERO SLIDESHOW & BENTO SEARCH ENGINE */}
      <section className="web-hero-section-wrapper">
        <div className="web-slider-container">
          {HERO_SLIDES.map((banner, index) => (
            <div 
              key={banner.id} 
              className={`web-slide ${index === currentSlide ? 'web-active-slide' : ''}`}
              style={{ backgroundImage: `url(${banner.image})` }}
            >
              <div className="web-slide-overlay">
                <div className="web-slide-content">
                  <span className="web-hero-tagline"><Flame size={14} /> {banner.badge}</span>
                  <h1 className="web-hero-title" dangerouslySetInnerHTML={{ __html: banner.title }} />
                  <p className="web-hero-subtitle">{banner.subtitle}</p>
                </div>
              </div>
            </div>
          ))}
          
          <button className="web-slider-btn-prev" onClick={prevSlide} aria-label="Əvvəlki"><ChevronLeft size={24} /></button>
          <button className="web-slider-btn-next" onClick={nextSlide} aria-label="Sonrakı"><ChevronRight size={24} /></button>
          
          <div className="web-slider-dots">
            {HERO_SLIDES.map((_, idx) => (
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
                  placeholder="Tarixi seçin (Məs: May 2026)" 
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
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
          {VIP_TOURS.map(tour => renderCard(tour, !tour.isXarici, true))}
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
              <img src={dest.image} alt={dest.name} className="web-dest-image" />
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
          <Link to="/domestic" className="web-btn-view-all-links">Hamısına bax <ArrowRight size={16} /></Link>
        </div>
        <div className="web-tours-carousel">
          {FALLBACK_DAXILI.map(tour => renderCard(tour, true))}
        </div>
      </section>

      {/* 5. CAMPAIGN BANNER SYSTEM (Bento Box Urgency) */}
      <section className="web-campaign-section">
        <div className="web-campaign-container">
          <div className="web-campaign-icon-box"><Percent size={28} /></div>
          <div className="web-campaign-body">
            <h4>Xarici Səyahətlərdə Erkən Rezervasiya (Early Bird)</h4>
            <p>İlkin 20% ödəniş (Milestone Payment) etməklə yerinizi sabitleyib qalan məbləği turun başlamasına 10 gün qalmış tamamlayın.</p>
          </div>
          <Link to="/campaigns" className="web-btn-campaign-action">Tarifləri İncələ <ChevronRight size={16} /></Link>
        </div>
      </section>

      {/* 6. XARİCİ TURLAR CAROUSEL */}
      <section className="web-carousel-section">
        <div className="web-section-header-flex">
          <div>
            <h2 className="web-section-main-title">Beynəlxalq Səyahətlər</h2>
            <p className="web-section-sub-title">Uçuş və otel daxil tam paketlər. Viza dəstəyi və lüks xidmət təminatı ilə.</p>
          </div>
          <Link to="/foreign" className="web-btn-view-all-links">Hamısına bax <ArrowRight size={16} /></Link>
        </div>
        <div className="web-tours-carousel">
          {FALLBACK_XARICI.map(tour => renderCard(tour, false))}
        </div>
      </section>

      {/* 7. LOYALTY & REWARDS ECOSYSTEM (Apple Wallet Style) */}
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
                  <span className="web-vcard-name">Elçin Abdullayev</span>
                  <span className="web-vcard-member-since">Üzv: 2026</span>
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

      {/* 8. TRUST FACTOR & MERCHANT ASSURANCE */}
      <section className="web-assurance-section">
        <div className="web-section-header-centered">
          <h2 className="web-assurance-main-title">Tam Təhlükəsiz Rezervasiya Modulu</h2>
          <p className="web-assurance-sub-title">Müştəri məmnuniyyətini qoruyan və maliyyə itkilərini sıfırlayan təhlükəsizlik alətləri.</p>
        </div>

        <div className="web-assurance-grid">
          <div className="web-assurance-item-card">
            <div className="web-assurance-icon-frame"><CheckCircle2 size={24} /></div>
            <h4>Yoxlanılmış Lisenziya (Verified)</h4>
            <p>Sistemə yalnız rəsmi dövlət reyestrindən keçmiş, hüquqi şəxs statuslu lisenziyalı agentliklər daxil ola bilər.</p>
          </div>
          <div className="web-assurance-item-card">
            <div className="web-assurance-icon-frame-blue"><Info size={24} /></div>
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
