import { useState } from 'react';

export type TourTab = 'overview' | 'itinerary' | 'inclusions' | 'meeting' | 'reviews';

export const useTourDetailsState = () => {
  const [activeTab, setActiveTab] = useState<TourTab>('overview');
  const [galleryOpen, setGalleryOpen] = useState<boolean>(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  const openGalleryAt = (index: number) => {
    setActiveImageIndex(index);
    setGalleryOpen(true);
  };

  return {
    activeTab,
    setActiveTab,
    galleryOpen,
    setGalleryOpen,
    activeImageIndex,
    openGalleryAt,
  };
};
