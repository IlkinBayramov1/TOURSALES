import { useState } from 'react';
import { tourApi } from '../api/tourApi';
import { useToast } from '../../../shared/context/ToastContext';

export const useTourReviews = (tourId: string, onReviewAdded?: () => void) => {
  const [submitting, setSubmitting] = useState(false);
  const { success, error: toastError } = useToast();

  const submitReview = async (rating: number, comment: string) => {
    setSubmitting(true);
    try {
      await tourApi.addReview(tourId, { rating, comment });
      success('Rəyiniz uğurla əlavə edildi!', 'Təşəkkür edirik');
      if (onReviewAdded) onReviewAdded();
    } catch (err: any) {
      toastError(err?.message || 'Rəy göndərilərkən xəta baş verdi', 'Xəta');
    } finally {
      setSubmitting(false);
    }
  };

  return { submitReview, submitting };
};
