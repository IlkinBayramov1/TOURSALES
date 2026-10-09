import React, { useState, useEffect } from 'react';
import { Button } from '@toursales/ui';
import { Key, ShieldAlert } from 'lucide-react';
import { ApiKey } from '@toursales/types';
import { apiKeysApi } from '../../apiKeysApi';
import './EditKeyModal.css';

interface EditKeyModalProps {
  isOpen: boolean;
  apiKey: ApiKey | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AVAILABLE_SCOPES = [
  { id: 'tours:read', label: 'Turları Oxumaq' },
  { id: 'tours:write', label: 'Turları İdarə Etmək' },
  { id: 'bookings:read', label: 'Sifarişləri Oxumaq' },
  { id: 'bookings:write', label: 'Bilet Satışı / Sifariş' },
  { id: 'finance:read', label: 'Maliyyə & Hesabat' }
];

export const EditKeyModal: React.FC<EditKeyModalProps> = ({
  isOpen,
  apiKey,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [rateLimit, setRateLimit] = useState(120);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (apiKey) {
      setName(apiKey.name || '');
      setSelectedScopes(Array.isArray(apiKey.scopes) ? apiKey.scopes : []);
      setIpWhitelist(apiKey.ipWhitelist || '');
      setRateLimit(apiKey.rateLimitPerMinute || 120);
      setError(null);
    }
  }, [apiKey]);

  if (!isOpen || !apiKey) return null;

  const handleToggleScope = (scopeId: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    );
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Açarın adını daxil edin.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiKeysApi.updateKey(apiKey.id, {
        name: name.trim(),
        scopes: selectedScopes,
        ipWhitelist: ipWhitelist.trim() || undefined,
        rateLimitPerMinute: Number(rateLimit) || 120
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        'Açar parametrləri yenilənərkən xəta baş verdi.'
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
            <Key size={20} color="#2563eb" />
            <h3 style={{ margin: 0 }}>API Açarını Redaktə Et</h3>
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

        <form onSubmit={handleUpdate}>
          <div className="key-form-body">
            {/* Key Identifier Info */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748b' }}>Açar ID & Prefiks:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>
                  {apiKey.id} ({apiKey.keyPrefix}••••••••)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', marginTop: 4 }}>
                <span style={{ color: '#64748b' }}>Mühit:</span>
                <span style={{ fontWeight: 700, color: apiKey.environment === 'LIVE' ? '#059669' : '#7c3aed' }}>
                  {apiKey.environment}
                </span>
              </div>
            </div>

            {/* Name */}
            <div className="key-form-group">
              <label>Açarın Adı / Təyinatı</label>
              <input
                type="text"
                placeholder="Məsələn: Rəsmi Vebsayt Rezervasiya İnteqrasiyası"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Scopes */}
            <div className="key-form-group">
              <label>İcazə Sferaları (Scopes)</label>
              <div className="scopes-checkbox-grid">
                {AVAILABLE_SCOPES.map((scope) => {
                  const isChecked = selectedScopes.includes(scope.id);
                  return (
                    <div
                      key={scope.id}
                      className={`scope-checkbox-label ${isChecked ? 'checked' : ''}`}
                      onClick={() => handleToggleScope(scope.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleScope(scope.id)}
                      />
                      <span>{scope.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* IP Whitelist & Rate limit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
              <div className="key-form-group">
                <label>IP Whitelist (Boş buraxıla bilər)</label>
                <input
                  type="text"
                  placeholder="Məs: 185.120.45.10"
                  value={ipWhitelist}
                  onChange={(e) => setIpWhitelist(e.target.value)}
                />
              </div>
              <div className="key-form-group">
                <label>Sorğu Limiti (dəqiqə)</label>
                <input
                  type="number"
                  min="30"
                  max="1000"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end',
              padding: '1.25rem 1.75rem',
              borderTop: '1px solid #e5e7eb',
              background: '#f9fafb'
            }}
          >
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
