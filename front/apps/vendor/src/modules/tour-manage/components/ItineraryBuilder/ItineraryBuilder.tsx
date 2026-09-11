import React from 'react';
import { Plus, Trash2, Clock, Calendar } from 'lucide-react';
import { Button, Input } from '@toursales/ui';
import { ItineraryItem } from '@toursales/types';
import './ItineraryBuilder.css';

interface ItineraryBuilderProps {
  items: ItineraryItem[];
  onChange: (items: ItineraryItem[]) => void;
}

export const ItineraryBuilder: React.FC<ItineraryBuilderProps> = ({
  items,
  onChange,
}) => {
  const handleAddItem = () => {
    const newItem: ItineraryItem = {
      id: Math.random().toString(36).substring(2, 9),
      day: items.length > 0 ? items[items.length - 1].day : 1,
      time: '08:00',
      title: '',
      description: '',
    };
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const handleUpdateItem = (index: number, field: keyof ItineraryItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="vendor-itinerary-builder">
      <div className="vendor-itinerary-header">
        <div>
          <h4>Tur Proqramı və Qrafik</h4>
          <p>Səyahətçilər üçün günbəgün və saatbasaat planlanan tədbirləri əlavə edin.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
        >
          <Plus size={16} />
          <span>Fəaliyyət Əlavə Et</span>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="vendor-itinerary-empty">
          <Calendar size={32} />
          <p>Hələ ki heç bir proqram bəndi əlavə olunmayıb.</p>
          <Button type="button" variant="secondary" size="sm" onClick={handleAddItem}>
            İlk Qrafiki Əlavə Et
          </Button>
        </div>
      ) : (
        <div className="vendor-itinerary-list">
          {items.map((item, index) => (
            <div key={item.id ?? index} className="vendor-itinerary-row">
              <div className="vendor-itinerary-col day-col">
                <Input
                  label="Gün"
                  type="number"
                  min={1}
                  value={item.day.toString()}
                  onChange={(e) =>
                    handleUpdateItem(index, 'day', parseInt(e.target.value) || 1)
                  }
                />
              </div>

              <div className="vendor-itinerary-col time-col">
                <Input
                  label="Saat"
                  type="text"
                  placeholder="08:00"
                  value={item.time}
                  onChange={(e) => handleUpdateItem(index, 'time', e.target.value)}
                />
              </div>

              <div className="vendor-itinerary-col title-col">
                <Input
                  label="Tədbir / Məkan Başlığı"
                  placeholder="Məs: Cıdır düzündə çay süfrəsi"
                  value={item.title}
                  onChange={(e) => handleUpdateItem(index, 'title', e.target.value)}
                />
              </div>

              <div className="vendor-itinerary-col desc-col">
                <Input
                  label="Təsvir (isteğe bağlı)"
                  placeholder="Məlumat və bələdçi tövsiyələri"
                  value={item.description}
                  onChange={(e) =>
                    handleUpdateItem(index, 'description', e.target.value)
                  }
                />
              </div>

              <div className="vendor-itinerary-col action-col">
                <button
                  type="button"
                  className="vendor-itinerary-remove-btn"
                  onClick={() => handleRemoveItem(index)}
                  title="Sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
