import React, { useState } from 'react';
import { Webhook, Send, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { WebhookConfig } from '@toursales/types';

interface WebhooksTableProps {
  webhooks: WebhookConfig[];
  loading?: boolean;
  onTestWebhook: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const WebhooksTable: React.FC<WebhooksTableProps> = ({
  webhooks,
  loading,
  onTestWebhook,
  onDelete
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; msg: string; success: boolean } | null>(null);

  const handleTest = async (id: string) => {
    try {
      setTestingId(id);
      setTestResult(null);
      await onTestWebhook(id);
      setTestResult({ id, msg: 'Test hadisəsi uğurla göndərildi (200 OK)', success: true });
    } catch (err: any) {
      setTestResult({ id, msg: err?.message || 'Çatdırılmada xəta baş verdi', success: false });
    } finally {
      setTestingId(null);
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="apikeys-table-container">
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
          Webhooks yüklənir...
        </div>
      </div>
    );
  }

  if (!webhooks || webhooks.length === 0) {
    return (
      <div className="apikeys-table-container">
        <div className="ad-empty-state" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#9ca3af' }}>
            <Webhook size={28} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Aktiv Webhook tapılmadı
          </h3>
          <p style={{ fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto', color: '#6b7280' }}>
            Yeni sifarişlər və ödənişlər haqqında xarici CRM və ya serverinizə anlıq bildiriş almaq üçün webhook əlavə edin.
          </p>
        </div>
      </div>
    );
  }

  const getEventBadge = (event: string) => {
    switch (event) {
      case 'booking.created':
        return 'Yeni Sifariş';
      case 'booking.confirmed':
        return 'Sifariş Təsdiqi';
      case 'booking.cancelled':
        return 'Sifariş Ləğvi';
      case 'payment.received':
        return 'Uğurlu Ödəniş';
      default:
        return event;
    }
  };

  return (
    <div className="apikeys-table-container">
      <table className="ads-table">
        <thead>
          <tr>
            <th>Webhook Adı</th>
            <th>Endpoint URL</th>
            <th>Abunə Olunan Hadisələr</th>
            <th>Son Çatdırılma</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Əməliyyatlar</th>
          </tr>
        </thead>
        <tbody>
          {webhooks.map((wh) => {
            const events = Array.isArray(wh.events) ? wh.events : [];
            const isTesting = testingId === wh.id;

            return (
              <tr key={wh.id}>
                {/* Name */}
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {wh.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    Yaradılıb: {new Date(wh.createdAt).toLocaleDateString('az-AZ')}
                  </div>
                </td>

                {/* URL */}
                <td>
                  <code style={{ background: '#f8fafc', padding: '0.25rem 0.5rem', borderRadius: 6, fontSize: '0.8125rem', border: '1px solid #e2e8f0' }}>
                    {wh.url}
                  </code>
                </td>

                {/* Events */}
                <td>
                  <div className="scopes-wrap">
                    {events.map((ev, idx) => (
                      <span key={idx} className="scope-pill" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}>
                        {getEventBadge(ev)}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Last Delivery */}
                <td>
                  {wh.lastDeliveryAt ? (
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                        {new Date(wh.lastDeliveryAt).toLocaleString('az-AZ')}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                        {wh.lastDeliveryStatus || '200 OK'}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
                      Hadisə çatdırılmayıb
                    </span>
                  )}
                </td>

                {/* Status */}
                <td>
                  <span className={`ad-status-badge ${wh.status === 'Active' ? 'active' : 'expired'}`}>
                    <span className="ad-status-dot" />
                    {wh.status === 'Active' ? 'Aktiv' : 'Deaktiv'}
                  </span>
                </td>

                {/* Actions */}
                <td>
                  <div className="ad-actions-cell" style={{ justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="ad-action-btn"
                      title="Test Hadisəsi Göndər (Ping)"
                      onClick={() => handleTest(wh.id)}
                      disabled={isTesting}
                      style={{ width: 'auto', padding: '0 0.625rem', fontSize: '0.75rem', gap: 4 }}
                    >
                      <Send size={12} />
                      <span>{isTesting ? 'Yoxlanılır...' : 'Test Göndər'}</span>
                    </button>

                    <button
                      type="button"
                      className="ad-action-btn delete"
                      title="Webhook-u Sil"
                      onClick={() => {
                        if (window.confirm(`"${wh.name}" webhook-unu silmək istədiyinizdən əminsiniz?`)) {
                          onDelete(wh.id);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {testResult && testResult.id === wh.id && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: testResult.success ? '#059669' : '#dc2626'
                      }}
                    >
                      {testResult.success ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      <span>{testResult.msg}</span>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
