import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { useTourDetail } from '../../hooks/useTourDetail';
import { useTourDetailsState, TourTab } from './hooks/useTourDetailsState';
import { TourHeaderSection } from './components/TourHeaderSection/TourHeaderSection';
import { TourGalleryModal } from './components/TourGalleryModal/TourGalleryModal';
import { TourOverviewTab } from './components/TourOverviewTab/TourOverviewTab';
import { TourItineraryTimeline } from './components/TourItineraryTimeline/TourItineraryTimeline';
import { TourInclusionsCard } from './components/TourInclusionsCard/TourInclusionsCard';
import { TourMeetingLocation } from './components/TourMeetingLocation/TourMeetingLocation';
import { TourReviewsSection } from './components/TourReviewsSection/TourReviewsSection';
import { TourStickyBookingBar } from './components/TourStickyBookingBar/TourStickyBookingBar';
import { Spinner, Button } from '@toursales/ui';
import './TourDetailsPage.css';

export const TourDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { tour, loading, error, refetch } = useTourDetail(id);
  const {
    activeTab,
    setActiveTab,
    galleryOpen,
    setGalleryOpen,
    activeImageIndex,
    openGalleryAt,
  } = useTourDetailsState();

  if (loading) {
    return (
      <div className="web-tour-details-loading">
        <Spinner size="lg" />
        <p>Tur məlumatları yüklənir...</p>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="web-container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2>Tur tapılmadı</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem' }}>
          {error || 'Axtardığınız tur mövcud deyil və ya ləğv edilmişdir.'}
        </p>
        <Link to="/tours">
          <Button variant="primary" leftIcon={<ArrowLeft size={16} />}>
            Bütün Turlara Qayıt
          </Button>
        </Link>
      </div>
    );
  }

  const images = tour.images && tour.images.length > 0 ? tour.images : [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
  ];

  return (
    <div className="web-tour-details-page">
      <div className="web-container">
        {/* Breadcrumb Navigation */}
        <nav className="web-tour-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Ana Səhifə</Link>
          <ChevronRight size={14} />
          <Link to="/tours">Turlar</Link>
          <ChevronRight size={14} />
          <span className="current">{tour.title}</span>
        </nav>

        {/* Tour Header */}
        <TourHeaderSection tour={tour} />

        {/* Photo Showcase Grid */}
        <div className="web-tour-photo-grid">
          <div className="web-photo-main" onClick={() => openGalleryAt(0)}>
            <img src={images[0]} alt={tour.title} />
            <div className="web-photo-overlay-btn">
              <ImageIcon size={18} />
              <span>Bütün Şəkillərə Bax ({images.length})</span>
            </div>
          </div>

          <div className="web-photo-side-col">
            {images.slice(1, 4).map((img, idx) => (
              <div
                key={idx}
                className="web-photo-side"
                onClick={() => openGalleryAt(idx + 1)}
              >
                <img src={img} alt={`Foto ${idx + 2}`} />
              </div>
            ))}
          </div>
        </div>

        {/* 2-Column Content Layout */}
        <div className="web-tour-content-layout">
          {/* Left Column: Tabs & Info */}
          <div className="web-tour-left-col">
            {/* Tabs Bar */}
            <div className="web-tour-tabs-bar">
              {(
                [
                  { id: 'overview', label: 'Tur Haqqında' },
                  { id: 'itinerary', label: 'Proqram' },
                  { id: 'inclusions', label: 'Xidmətlər' },
                  { id: 'meeting', label: 'Toplanış Yeri' },
                  { id: 'reviews', label: `Rəylər (${tour.reviewsCount || 0})` },
                ] as { id: TourTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  className={`web-tour-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="web-tour-tab-content">
              {activeTab === 'overview' && <TourOverviewTab tour={tour} />}
              {activeTab === 'itinerary' && (
                <TourItineraryTimeline itinerary={tour.itinerary} />
              )}
              {activeTab === 'inclusions' && (
                <TourInclusionsCard
                  inclusions={tour.inclusions}
                  exclusions={tour.exclusions}
                />
              )}
              {activeTab === 'meeting' && (
                <TourMeetingLocation
                  meetingPoint={tour.meetingPoint}
                  meetingLat={tour.meetingLat}
                  meetingLng={tour.meetingLng}
                />
              )}
              {activeTab === 'reviews' && (
                <TourReviewsSection
                  tourId={tour.id}
                  rating={tour.rating}
                  reviewsCount={tour.reviewsCount}
                  reviews={tour.reviews}
                  onReviewAdded={refetch}
                />
              )}
            </div>
          </div>

          {/* Right Column: Sticky Booking Card */}
          <div className="web-tour-right-col">
            <TourStickyBookingBar tour={tour} />
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Gallery Modal */}
      <TourGalleryModal
        images={images}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        activeIndex={activeImageIndex}
        onSelectIndex={(idx) => openGalleryAt(idx)}
      />
    </div>
  );
};
