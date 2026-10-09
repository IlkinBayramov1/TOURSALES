import React, { useState, useEffect } from 'react';
import { Button } from '@toursales/ui';
import { Webhook, Copy, Check, ShieldCheck } from 'lucide-react';
import { WebhookConfig } from '@toursales/types';
import { apiKeysApi } from '../../apiKeysApi';
import '../CreateKeyModal/CreateKeyModal.css';

interface EditWebhookModalProps {
  isOpen: boolean;
  webhook: WebhookConfig | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AVAILABLE_EVENTS = [
  { id: 'booking.created', label: 'Yeni Sifariş Daxil Olduqda' },
  { id: 'booking.confirmed', label: 'Sifariş Təsdiqləndikdə' },
  { id: 'booking.cancelled', label: 'Sifariş Ləğv Edildikdə' },
  { id: 'payment.received', label: 'Ödəniş Uğurlu Olduqda' }
];

export const EditWebhookModal: React.FC<EditWebhookModalProps> = ({
  isOpen,
  webhook,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (webhook) {
      setName(webhook.name || '');
      setUrl(webhook.url || '');
      setSelectedEvents(Array.isArray(webhook.events) ? webhook.events : []);
      setError(null);
    }
  }, [webhook]);

  if (!isOpen || !webhook) return null;

  const handleToggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  const handleCopySecret = () => {
    if (webhook?.secretKey) {
      navigator.clipboard.writeText(webhook.secretKey);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
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
      await apiKeysApi.updateWebhook(webhook.id, {
        name: name.trim(),
        url: url.trim(),
        events: selectedEvents
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        'Webhook yenilənərkən xəta baş verdi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="key-modal-overlay" onClick={onClose}>
      <div className="key-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="key-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Webhook size={20} color="#2563eb" />
            <h3 style={{ margin: 0 }}>Webhook Parametrlərini Redaktə Et</h3>
          </div>
          <button type="button" className="key-close-btn" onClick={onClose}>
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
            {/* Signing Secret Box */}
            {webhook.secretKey && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '0.875rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 700, color: '#166534' }}>
                    <ShieldCheck size={16} />
                    <span>HMAC-SHA256 İmza Gizli Açarı (Signing Secret)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    style={{
                      background: '#dcfce7',
                      border: '1px solid #86efac',
                      borderRadius: 6,
                      padding: '0.25rem 0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.75rem',
                      color: '#15803d',
                      fontWeight: 600
                    }}
                  >
                    {copiedSecret ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedSecret ? 'Kopyalandı' : 'Kopyala'}</span>
                  </button>
                </div>
                <code style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#14532d', wordBreak: 'break-all' }}>
                  {webhook.secretKey}
                </code>
              </div>
            )}

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
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Ləğv et
            </Button>
            <Button variant="primary" type="submit" isLoading={loading}>
              Dəyişiklikləri Saxla
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
