import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { Webhook, AlertCircle } from 'lucide-react';
import { apiKeysApi } from '../../apiKeysApi';
import '../CreateKeyModal/CreateKeyModal.css';

interface CreateWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AVAILABLE_EVENTS = [
  { id: 'booking.created', label: 'Yeni Sifariş Daxil Olduqda' },
  { id: 'booking.confirmed', label: 'Sifariş Təsdiqləndikdə' },
  { id: 'booking.cancelled', label: 'Sifariş Ləğv Edildikdə' },
  { id: 'payment.received', label: 'Ödəniş Uğurlu Olduqda' }
];

export const CreateWebhookModal: React.FC<CreateWebhookModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'booking.created',
    'booking.confirmed',
    'payment.received'
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      setError('Webhook adını və URL ünvanını daxil edin.');
      return;
    }

    if (selectedEvents.length === 0) {
      setError('Ən azı bir hadisə seçilməlidir.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiKeysApi.createWebhook({
        name: name.trim(),
        url: url.trim(),
        events: selectedEvents
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.msg || err?.response?.data?.message || err?.message || 'Webhook yaradılarkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setUrl('');
    setSelectedEvents(['booking.created', 'booking.confirmed', 'payment.received']);
    setError(null);
    onClose();
  };

  return (
    <div className="key-modal-overlay" onClick={handleClose}>
      <div className="key-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="key-modal-header">
          <h3>Yeni Webhook Əlavə Et</h3>
          <button type="button" className="key-close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        {error && (
          <div style={{ color: '#dc2626', background: '#fef2f2', padding: '0.75rem 1.25rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="key-form-body">
            <div className="key-form-group">
              <label>Webhook Adı / Təyinatı</label>
              <input
                type="text"
                placeholder="Məsələn: Agentlik CRM Hadisə Dinləyicisi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="key-form-group">
              <label>Endpoint URL (HTTPS tövsiyə olunur)</label>
              <input
                type="url"
                placeholder="https://agency-domain.com/api/webhooks/toursales"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Hadisə baş verdikdə POST sorğusu bu ünvana JSON payload ilə göndəriləcək
              </span>
            </div>

            <div className="key-form-group">
              <label>Abunə Olunacaq Hadisələr</label>
              <div className="scopes-checkbox-grid">
                {AVAILABLE_EVENTS.map((ev) => {
                  const isChecked = selectedEvents.includes(ev.id);
                  return (
                    <div
                      key={ev.id}
                      className={`scope-checkbox-label ${isChecked ? 'checked' : ''}`}
                      onClick={() => handleToggleEvent(ev.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleEvent(ev.id)}
                      />
                      <span>{ev.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', padding: '1.25rem 1.75rem', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <Button variant="secondary" onClick={handleClose} disabled={loading}>
              Ləğv et
            </Button>
            <Button variant="primary" type="submit" isLoading={loading}>
              <Webhook size={16} style={{ marginRight: 6 }} />
              Webhook-u Əlavə Et
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
