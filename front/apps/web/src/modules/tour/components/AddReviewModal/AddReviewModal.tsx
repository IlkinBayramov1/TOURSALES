import React, { useState } from 'react';
import { Modal, Button, StarRating } from '@toursales/ui';
import './AddReviewModal.css';

interface AddReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  isLoading: boolean;
}

export const AddReviewModal: React.FC<AddReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Zəhmət olmasa təəssüratınızı qeyd edin');
      return;
    }
    setError('');
    await onSubmit(rating, comment);
    setComment('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tura Rəy və Qiymət Yazın"
      size="md"
    >
      <form className="web-add-review-form" onSubmit={handleSubmit}>
        <div className="web-add-review-rating-field">
          <label className="web-add-review-label">Turdan necə razı qaldınız?</label>
          <div className="web-add-review-stars">
            <StarRating
              rating={rating}
              size={28}
              interactive
              onChange={(newRating) => setRating(newRating)}
            />
          </div>
        </div>

        <div className="web-add-review-comment-field">
          <label className="web-add-review-label">Təəssüratınız</label>
          <textarea
            rows={4}
            placeholder="Turun marşrutu, bələdçisi və təşkili haqqında fikirlərinizi bölüşün..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="web-add-review-textarea"
            required
          />
        </div>

        {error && <p className="auth-form-error">{error}</p>}

        <div className="web-add-review-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Ləğv et
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Rəyi Paylaş
          </Button>
        </div>
      </form>
    </Modal>
  );
};
