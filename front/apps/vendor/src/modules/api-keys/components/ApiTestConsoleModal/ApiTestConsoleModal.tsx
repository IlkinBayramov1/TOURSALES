import React, { useState, useEffect } from 'react';
import { Button } from '@toursales/ui';
import { Terminal, Play, Copy, Check, Clock, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { ApiKey } from '@toursales/types';
import { apiKeysApi, SimulateRequestResult } from '../../apiKeysApi';
import './ApiTestConsoleModal.css';

interface ApiTestConsoleModalProps {
  isOpen: boolean;
  keys: ApiKey[];
  initialSelectedKey?: ApiKey | null;
  onClose: () => void;
}

const PRESET_ENDPOINTS = [
  {
    label: 'GET /api/v1/external/tours - Turların Siyahısı',
    endpoint: '/api/v1/external/tours',
    method: 'GET',
    requiredScope: 'tours:read',
    defaultPayload: ''
  },
  {
    label: 'GET /api/v1/external/tours/my-tours - Agentliyin Aktiv Turları',
    endpoint: '/api/v1/external/tours/my-tours',
    method: 'GET',
    requiredScope: 'tours:read',
    defaultPayload: ''
  },
  {
    label: 'POST /api/v1/external/bookings - Yeni Tur Rezervasiyası',
    endpoint: '/api/v1/external/bookings',
    method: 'POST',
    requiredScope: 'bookings:write',
    defaultPayload: JSON.stringify(
      {
        tourId: 'TR-1001',
        customerName: 'Samir Qasımov',
        customerEmail: 'samir@example.com',
        customerPhone: '+994501234567',
        seats: 2,
        notes: 'API vasitəsilə vebsaytdan daxil olan rezervasiya'
      },
      null,
      2
    )
  },
  {
    label: 'GET /api/v1/external/stats - Satış & Maliyyə İnteqrasiya Hesabatı',
    endpoint: '/api/v1/external/stats',
    method: 'GET',
    requiredScope: 'finance:read',
    defaultPayload: ''
  }
];

export const ApiTestConsoleModal: React.FC<ApiTestConsoleModalProps> = ({
  isOpen,
  keys,
  initialSelectedKey,
  onClose
}) => {
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [manualSecretKey, setManualSecretKey] = useState<string>('');
  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState<number>(0);
  const [payloadText, setPayloadText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulateRequestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedResponse, setCopiedResponse] = useState(false);

  useEffect(() => {
    if (initialSelectedKey) {
      setSelectedKeyId(initialSelectedKey.id);
    } else if (keys.length > 0 && !selectedKeyId) {
      setSelectedKeyId(keys[0].id);
    }
  }, [initialSelectedKey, keys]);

  useEffect(() => {
    const selectedPreset = PRESET_ENDPOINTS[selectedEndpointIndex];
    if (selectedPreset) {
      setPayloadText(selectedPreset.defaultPayload);
    }
  }, [selectedEndpointIndex]);

  if (!isOpen) return null;

  const currentPreset = PRESET_ENDPOINTS[selectedEndpointIndex] || PRESET_ENDPOINTS[0];
  const activeKeyObj = keys.find((k) => k.id === selectedKeyId);

  const handleSendRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Raw secret key resolution
      // If manual is given, use it; otherwise use activeKeyObj secret key placeholder simulation
      let secretToSend = manualSecretKey.trim();
      if (!secretToSend) {
        if (!activeKeyObj) {
          setError('Zəhmət olmasa bir API açarı seçin və ya gizli açarı daxil edin.');
          setLoading(false);
          return;
        }
        // In simulation test console, if vendor didn't provide raw key, we provide a prefix-based token
        secretToSend = `${activeKeyObj.keyPrefix}_live_test_console_secret_token`;
      }

      let parsedPayload: any = undefined;
      if (currentPreset.method === 'POST' && payloadText.trim()) {
        try {
          parsedPayload = JSON.parse(payloadText);
        } catch (e) {
          setError('Payload düzgün JSON formatında deyil. Zəhmət olmasa sintaksisi yoxlayın.');
          setLoading(false);
          return;
        }
      }

      const res = await apiKeysApi.simulateRequest({
        rawSecretKey: secretToSend,
        endpoint: currentPreset.endpoint,
        method: currentPreset.method,
        payload: parsedPayload
      });

      setResult(res);
    } catch (err: any) {
      setError(
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        'API sorğusunun simulyasiyasında xəta baş verdi.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  return (
    <div className="key-modal-overlay" onClick={onClose}>
      <div className="key-modal-card test-console-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="key-modal-header" style={{ background: '#0f172a', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <Terminal size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.125rem' }}>İnteraktiv API Test Konsolu (Playground)</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Real vaxt rejimində endpoint sorğularını yoxlayın və cavabları analiz edin</p>
            </div>
          </div>
          <button type="button" className="key-close-btn" onClick={onClose} style={{ color: '#94a3b8' }}>
            ×
          </button>
        </div>

        {error && (
          <div style={{ color: '#dc2626', background: '#fef2f2', padding: '0.75rem 1.25rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Content Body: Split View */}
        <div className="console-split-layout">
          {/* Left Panel: Request Configuration */}
          <div className="console-panel request-panel">
            <h4 className="console-panel-title">1. Sorğu Parametrləri</h4>

            {/* Select API Key */}
            <div className="key-form-group">
              <label>İstifadə Olunacaq API Açar</label>
              <select
                value={selectedKeyId}
                onChange={(e) => {
                  setSelectedKeyId(e.target.value);
                  setManualSecretKey('');
                }}
              >
                {keys.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} ({k.keyPrefix}••••) - [{k.environment}]
                  </option>
                ))}
              </select>
            </div>

            {/* Manual Secret Key (Optional override) */}
            <div className="key-form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Gizli API Açar (Token)</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Əgər əlinizdə xam açar varsa</span>
              </label>
              <input
                type="text"
                placeholder={activeKeyObj ? `${activeKeyObj.keyPrefix}••••••••••••` : 'ts_live_...'}
                value={manualSecretKey}
                onChange={(e) => setManualSecretKey(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
              />
            </div>

            {/* Endpoint Selector */}
            <div className="key-form-group">
              <label>API Endpoint & Metod</label>
              <select
                value={selectedEndpointIndex}
                onChange={(e) => setSelectedEndpointIndex(Number(e.target.value))}
              >
                {PRESET_ENDPOINTS.map((ep, idx) => (
                  <option key={idx} value={idx}>
                    [{ep.method}] {ep.endpoint}
                  </option>
                ))}
              </select>
            </div>

            {/* Endpoint Scope info */}
            <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569' }}>Tələb olunan Scope:</span>
              <span style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 600, color: '#1e293b' }}>
                {currentPreset.requiredScope}
              </span>
            </div>

            {/* Request Body Editor for POST */}
            {currentPreset.method === 'POST' && (
              <div className="key-form-group" style={{ marginTop: '0.5rem' }}>
                <label>JSON Request Body (Payload)</label>
                <textarea
                  className="console-payload-textarea"
                  rows={7}
                  value={payloadText}
                  onChange={(e) => setPayloadText(e.target.value)}
                  placeholder="{ ... }"
                />
              </div>
            )}

            {/* Submit Button */}
            <div style={{ marginTop: '1rem' }}>
              <Button
                variant="primary"
                onClick={handleSendRequest}
                isLoading={loading}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Play size={16} fill="currentColor" />
                <span>Test Sorğusunu İcra Et (Send Request)</span>
              </Button>
            </div>
          </div>

          {/* Right Panel: Response Output */}
          <div className="console-panel response-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h4 className="console-panel-title" style={{ margin: 0 }}>2. Server Cavabı (Response)</h4>
              {result && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleCopyResponse}
                    className="console-copy-btn"
                  >
                    {copiedResponse ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                    <span>{copiedResponse ? 'Kopyalandı' : 'JSON Kopyala'}</span>
                  </button>
                </div>
              )}
            </div>

            {result ? (
              <div className="response-content-wrapper">
                {/* Meta status bar */}
                <div className="response-meta-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`status-pill ${result.status === 200 || result.status === 201 ? 'status-200' : 'status-err'}`}>
                      {result.status} {result.status === 200 || result.status === 201 ? 'OK' : 'Error'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {result.method} {result.endpoint}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.75rem', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={13} color="#38bdf8" />
                      <span>{result.responseTimeMs} ms</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldCheck size={13} color="#4ade80" />
                      <span>{result.environment}</span>
                    </div>
                  </div>
                </div>

                {/* Formatted JSON Output */}
                <pre className="response-json-viewer">
                  <code>{JSON.stringify(result.data, null, 2)}</code>
                </pre>
              </div>
            ) : (
              <div className="response-placeholder">
                <Terminal size={36} color="#64748b" style={{ marginBottom: 12, opacity: 0.7 }} />
                <p style={{ margin: 0, fontWeight: 600, color: '#e2e8f0', fontSize: '0.875rem' }}>
                  Gözlənilir...
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94a3b8', maxWidth: 280 }}>
                  Sol paneldən istədiyiniz endpoint-i seçib "Test Sorğusunu İcra Et" düyməsini sıxın.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.75rem', borderTop: '1px solid #e5e7eb', background: '#f8fafc' }}>
          <Button variant="secondary" onClick={onClose}>
            Konsolu Bağla
          </Button>
        </div>
      </div>
    </div>
  );
};
