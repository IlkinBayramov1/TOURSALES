import React from 'react';
import { Star } from 'lucide-react';
import './StarRating.css';

export interface StarRatingProps {
  rating: number; // 0 to 5
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (newRating: number) => void;
  showScore?: boolean;
  count?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 18,
  interactive = false,
  onChange,
  showScore = false,
  count,
}) => {
  return (
    <div className="ui-star-rating">
      <div className="ui-star-row">
        {Array.from({ length: maxStars }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = rating >= starValue;
          const isHalf = !isFilled && rating >= starValue - 0.5;

          return (
            <button
              key={index}
              type="button"
              className={`ui-star-btn ${interactive ? 'ui-star-interactive' : ''}`}
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starValue)}
              aria-label={`${starValue} ulduz`}
            >
              <Star
                size={size}
                className={`ui-star-icon ${isFilled ? 'ui-star-filled' : isHalf ? 'ui-star-half' : 'ui-star-empty'}`}
              />
            </button>
          );
        })}
      </div>
      {showScore && <span className="ui-star-score">{rating.toFixed(1)}</span>}
      {typeof count === 'number' && (
        <span className="ui-star-count">({count})</span>
      )}
    </div>
  );
};
