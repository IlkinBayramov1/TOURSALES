import React, { useState, useEffect, useCallback } from 'react';
import { TourReview } from '@toursales/types';
import { ReviewList } from '@/modules/tour/components/ReviewList/ReviewList';
import { AddReviewModal } from '@/modules/tour/components/AddReviewModal/AddReviewModal';
import { Button, StarRating } from '@toursales/ui';
import { MessageSquarePlus } from 'lucide-react';
import { useTourReviews } from '@/modules/tour/hooks/useTourReviews';
import { tourApi } from '@/modules/tour/api/tourApi';
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
  const [liveReviews, setLiveReviews] = useState<TourReview[]>(reviews);
  const [liveRating, setLiveRating] = useState<number>(rating);
  const [liveTotal, setLiveTotal] = useState<number>(reviewsCount);

  const fetchReviews = useCallback(async () => {
    try {
      const data = await tourApi.getTourReviews(tourId);
      if (data) {
        if (data.reviews) setLiveReviews(data.reviews);
        if (data.averageRating !== undefined) setLiveRating(data.averageRating);
        if (data.totalReviews !== undefined) setLiveTotal(data.totalReviews);
      }
    } catch {
      // fallback to initial props
    }
  }, [tourId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleReviewSuccess = () => {
    fetchReviews();
    if (onReviewAdded) onReviewAdded();
  };

  const { submitReview, submitting } = useTourReviews(tourId, handleReviewSuccess);

  return (
    <div className="web-tour-reviews-section">
      <div className="web-reviews-header">
        <div className="web-reviews-summary">
          <h3 className="web-section-heading">Müştəri Rəyləri</h3>
          <div className="web-reviews-score-box">
            <span className="web-reviews-big-score">{(liveRating || 5).toFixed(1)}</span>
            <div>
              <StarRating rating={liveRating || 5} size={18} />
              <span className="web-reviews-count-text">
                {liveTotal} təsdiqlənmiş səyyah rəyi
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

      <ReviewList reviews={liveReviews} />

      <AddReviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={submitReview}
        isLoading={submitting}
      />
    </div>
  );
};
