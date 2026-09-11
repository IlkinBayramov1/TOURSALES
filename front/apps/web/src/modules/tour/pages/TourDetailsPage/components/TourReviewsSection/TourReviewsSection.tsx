import React, { useState } from 'react';
import { TourReview } from '@toursales/types';
import { ReviewList } from '@/modules/tour/components/ReviewList/ReviewList';
import { AddReviewModal } from '@/modules/tour/components/AddReviewModal/AddReviewModal';
import { Button, StarRating } from '@toursales/ui';
import { MessageSquarePlus } from 'lucide-react';
import { useTourReviews } from '@/modules/tour/hooks/useTourReviews';
import './TourReviewsSection.css';

interface TourReviewsSectionProps {
  tourId: string;
  rating?: number;
  reviewsCount?: number;
  reviews?: TourReview[];
  onReviewAdded?: () => void;
}

export const TourReviewsSection: React.FC<TourReviewsSectionProps> = ({
  tourId,
  rating = 5,
  reviewsCount = 0,
  reviews = [],
  onReviewAdded,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { submitReview, submitting } = useTourReviews(tourId, onReviewAdded);

  return (
    <div className="web-tour-reviews-section">
      <div className="web-reviews-header">
        <div className="web-reviews-summary">
          <h3 className="web-section-heading">Müştəri Rəyləri</h3>
          <div className="web-reviews-score-box">
            <span className="web-reviews-big-score">{rating.toFixed(1)}</span>
            <div>
              <StarRating rating={rating} size={18} />
              <span className="web-reviews-count-text">
                {reviewsCount} təsdiqlənmiş səyyah rəyi
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          leftIcon={<MessageSquarePlus size={18} />}
          onClick={() => setModalOpen(true)}
        >
          Rəy Yaz
        </Button>
      </div>

      <ReviewList reviews={reviews} />

      <AddReviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={submitReview}
        isLoading={submitting}
      />
    </div>
  );
};
