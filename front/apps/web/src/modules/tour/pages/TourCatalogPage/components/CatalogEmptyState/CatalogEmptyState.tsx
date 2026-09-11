import React from 'react';
import { Compass, RotateCcw } from 'lucide-react';
import { Button } from '@toursales/ui';
import './CatalogEmptyState.css';

interface CatalogEmptyStateProps {
  onReset: () => void;
}

export const CatalogEmptyState: React.FC<CatalogEmptyStateProps> = ({ onReset }) => {
  return (
    <div className="web-catalog-empty-state">
      <div className="web-empty-icon">
        <Compass size={48} />
      </div>
      <h3 className="web-empty-title">Uyğun Tur Tapılmadı</h3>
      <p className="web-empty-desc">
        Axtarış və ya süzgəc meyarlarınıza uyğun heç bir nəticə tapılmadı. Süzgəcləri sıfırlayaraq bütün mövcud turlara baxa bilərsiniz.
      </p>
      <Button variant="outline" onClick={onReset} leftIcon={<RotateCcw size={16} />}>
        Bütün Turları Göstər
      </Button>
    </div>
  );
};
