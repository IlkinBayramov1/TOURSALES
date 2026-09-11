import React from 'react';
import { TourReview } from '@toursales/types';
import { StarRating, Badge } from '@toursales/ui';
import { CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/shared/utils/formatters';
import './ReviewList.css';

interface ReviewListProps {
  reviews?: TourReview[];
}

export const ReviewList: React.FC<ReviewListProps> = ({ reviews = [] }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="web-reviews-empty">
        <p>Hələ ki bu tura rəy yazılmayıb. İlk rəyi siz yazın!</p>
      </div>
    );
  }

  return (
    <div className="web-reviews-list">
      {reviews.map((rev) => (
        <div key={rev.id} className="web-review-item">
          <div className="web-review-item-header">
            <div className="web-review-user-info">
              <div className="web-review-avatar">
                {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="web-review-user-name">
                  <span>{rev.userName}</span>
                  {rev.verifiedBooking && (
                    <Badge variant="success" size="sm" pill>
                      <CheckCircle2 size={12} /> Təsdiqlənmiş Alıcı
                    </Badge>
                  )}
                </div>
                <span className="web-review-date">{formatDate(rev.createdAt)}</span>
              </div>
            </div>

            <StarRating rating={rev.rating} size={16} />
          </div>

          <p className="web-review-comment">{rev.comment}</p>
        </div>
      ))}
    </div>
  );
};
