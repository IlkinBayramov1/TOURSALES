import React from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Modal } from '@toursales/ui';
import './TourGalleryModal.css';

interface TourGalleryModalProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  activeIndex: number;
  onSelectIndex: (index: number) => void;
}

export const TourGalleryModal: React.FC<TourGalleryModalProps> = ({
  images,
  isOpen,
  onClose,
  activeIndex,
  onSelectIndex,
}) => {
  const safeImages = images && images.length > 0
    ? images
    : ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'];

  const handlePrev = () => {
    onSelectIndex((activeIndex - 1 + safeImages.length) % safeImages.length);
  };

  const handleNext = () => {
    onSelectIndex((activeIndex + 1) % safeImages.length);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title={`Qalereya (${activeIndex + 1} / ${safeImages.length})`}>
      <div className="web-gallery-modal-content">
        <div className="web-gallery-main-view">
          <button className="web-gallery-nav-btn prev" onClick={handlePrev}>
            <ChevronLeft size={24} />
          </button>
          <img
            src={safeImages[activeIndex]}
            alt={`Foto ${activeIndex + 1}`}
            className="web-gallery-active-img"
          />
          <button className="web-gallery-nav-btn next" onClick={handleNext}>
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="web-gallery-thumbs-row">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              className={`web-gallery-thumb-btn ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => onSelectIndex(idx)}
            >
              <img src={img} alt={`Thumb ${idx + 1}`} />
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};
