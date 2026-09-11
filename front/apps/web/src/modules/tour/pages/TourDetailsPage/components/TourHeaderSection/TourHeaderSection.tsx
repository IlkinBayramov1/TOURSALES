import React, { useState } from 'react';
import { MapPin, Calendar, Star, Share2, Heart, Check } from 'lucide-react';
import { Tour } from '@toursales/types';
import { Badge, Button } from '@toursales/ui';
import { formatDate } from '@/shared/utils/formatters';
import { useToast } from '@/shared/context/ToastContext';
import './TourHeaderSection.css';

interface TourHeaderSectionProps {
  tour: Tour;
}

export const TourHeaderSection: React.FC<TourHeaderSectionProps> = ({ tour }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  const { info } = useToast();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    info('Tur linki kopyalandı!', 'Paylaş');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="web-tour-header-section">
      <div className="web-tour-header-badges">
        <Badge variant={tour.type === 'DOMESTIC' ? 'primary' : 'info'} pill>
          {tour.type === 'DOMESTIC' ? '🇦🇿 Daxili Tur' : '✈️ Xarici Tur'}
        </Badge>
        {tour.isKarabakh && (
          <Badge variant="gold" pill>
            Qarabağ Tarixi Marşrutu
          </Badge>
        )}
        <Badge variant="neutral">
          <MapPin size={12} /> {tour.region}
        </Badge>
      </div>

      <h1 className="web-tour-header-title">{tour.title}</h1>

      <div className="web-tour-header-meta">
        <div className="web-tour-meta-item">
          <Calendar size={16} className="meta-icon" />
          <span>{formatDate(tour.startDate)} — {formatDate(tour.endDate)}</span>
        </div>

        {tour.rating && (
          <div className="web-tour-meta-item">
            <Star size={16} className="star-icon-filled" />
            <strong>{tour.rating.toFixed(1)}</strong>
            <span>({tour.reviewsCount || 0} rəy)</span>
          </div>
        )}

        <div className="web-tour-header-actions">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={copied ? <Check size={16} /> : <Share2 size={16} />}
            onClick={handleShare}
          >
            {copied ? 'Kopyalandı' : 'Paylaş'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} color={isFavorite ? '#ef4444' : 'currentColor'} />}
            onClick={() => setIsFavorite(!isFavorite)}
          >
            {isFavorite ? 'Bəyənildi' : 'Yadda saxla'}
          </Button>
        </div>
      </div>
    </div>
  );
};
