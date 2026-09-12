import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { Key, Copy, Check, ShieldAlert, Sparkles } from 'lucide-react';
import { apiKeysApi } from '../../apiKeysApi';
import './CreateKeyModal.css';

interface CreateKeyModalProps {
  isOpen: boolean;
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

export const CreateKeyModal: React.FC<CreateKeyModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [environment, setEnvironment] = useState<'LIVE' | 'TEST'>('LIVE');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    'tours:read',
    'bookings:read',
    'bookings:write'
  ]);
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [rateLimit, setRateLimit] = useState(120);

  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleScope = (scopeId: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Açarın adını daxil edin.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await apiKeysApi.createKey({
        name: name.trim(),
        environment,
        scopes: selectedScopes,
        ipWhitelist: ipWhitelist.trim() || undefined,
        rateLimitPerMinute: Number(rateLimit) || 120
      });

      setCreatedSecret(res.rawSecretKey);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.msg || err?.response?.data?.message || err?.message || 'Açar yaradılarkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (createdSecret) {
      navigator.clipboard.writeText(createdSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setName('');
    setEnvironment('LIVE');
    setSelectedScopes(['tours:read', 'bookings:read', 'bookings:write']);
    setIpWhitelist('');
    setRateLimit(120);
    setCreatedSecret(null);
    setError(null);
    onClose();
  };

  return (
    <div className="key-modal-overlay" onClick={handleClose}>
      <div className="key-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="key-modal-header">
          <h3>{createdSecret ? 'API Açarınız Yaradıldı' : 'Yeni API Açar Yarat'}</h3>
          <button type="button" className="key-close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        {error && (
          <div style={{ color: '#dc2626', background: '#fef2f2', padding: '0.75rem 1.25rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {!createdSecret ? (
          <form onSubmit={handleCreate}>
            <div className="key-form-body">
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

              {/* Environment */}
              <div className="key-form-group">
                <label>İnteqrasiya Mühiti</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div
                    className={`scope-checkbox-label ${environment === 'LIVE' ? 'checked' : ''}`}
                    onClick={() => setEnvironment('LIVE')}
                    style={{ justifyContent: 'center' }}
                  >
                    <input
                      type="radio"
                      name="env"
                      checked={environment === 'LIVE'}
                      onChange={() => setEnvironment('LIVE')}
                    />
                    <span style={{ fontWeight: 600 }}>Canlı İstehsal (LIVE)</span>
                  </div>

                  <div
                    className={`scope-checkbox-label ${environment === 'TEST' ? 'checked' : ''}`}
                    onClick={() => setEnvironment('TEST')}
                    style={{ justifyContent: 'center' }}
                  >
                    <input
                      type="radio"
                      name="env"
                      checked={environment === 'TEST'}
                      onChange={() => setEnvironment('TEST')}
                    />
                    <span style={{ fontWeight: 600 }}>Sandbox / Test (TEST)</span>
                  </div>
                </div>
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
                  <label>IP Whitelist (İstəyə bağlı)</label>
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

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', padding: '1.25rem 1.75rem', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <Button variant="secondary" onClick={handleClose} disabled={loading}>
                Ləğv et
              </Button>
              <Button variant="primary" type="submit" isLoading={loading}>
                Açarı Yarat
              </Button>
            </div>
          </form>
        ) : (
          <div style={{ padding: '1.75rem' }}>
            <div className="security-warning">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 4 }}>
                <ShieldAlert size={18} />
                <span>Təhlükəsizlik Xəbərdarlığı:</span>
              </div>
              Bu gizli API açarı yalnız <strong>bircə dəfə</strong> nümayiş olunur. Onu dərhal kopyalayın və təhlükəsiz yerdə (məsələn, <code>.env</code> faylında) saxlayın. Səhifəni bağladıqdan sonra açarın tam mətni görünməyəcək.
            </div>

            <div className="secret-key-display">
              <span className="secret-key-code">{createdSecret}</span>
              <Button size="sm" variant="secondary" onClick={handleCopy} style={{ flexShrink: 0 }}>
                {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                <span>{copied ? '✓ Kopyalandı' : 'Kopyala'}</span>
              </Button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
              <Button variant="primary" onClick={handleClose}>
                Yadda saxladım və Bağla
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
