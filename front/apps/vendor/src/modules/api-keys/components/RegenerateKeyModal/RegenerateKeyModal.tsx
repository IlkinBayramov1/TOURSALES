import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { RotateCw, AlertTriangle, ShieldAlert, Copy, Check } from 'lucide-react';
import { ApiKey } from '@toursales/types';
import { apiKeysApi } from '../../apiKeysApi';
import './RegenerateKeyModal.css';

interface RegenerateKeyModalProps {
  isOpen: boolean;
  apiKey: ApiKey | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegenerateKeyModal: React.FC<RegenerateKeyModalProps> = ({
  isOpen,
  apiKey,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !apiKey) return null;

  const handleRegenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiKeysApi.regenerateKey(apiKey.id);
      setNewSecret(res.rawSecretKey);
      onSuccess();
    } catch (err: any) {
      setError(
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        'Açar kodu yenilənərkən xəta baş verdi.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (newSecret) {
      navigator.clipboard.writeText(newSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setNewSecret(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="key-modal-overlay" onClick={handleClose}>
      <div className="key-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="key-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RotateCw size={20} color="#d97706" />
            <h3 style={{ margin: 0 }}>API Açarını Yenidən Yarat (Roll / Regenerate)</h3>
          </div>
          <button type="button" className="key-close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        {error && (
          <div style={{ color: '#dc2626', background: '#fef2f2', padding: '0.75rem 1.25rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {!newSecret ? (
          <div style={{ padding: '1.75rem' }}>
            <div className="regen-warning-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b45309', fontWeight: 700, marginBottom: 6 }}>
                <AlertTriangle size={20} />
                <span>Diqqət: Mövcud açar dərhal ləğv ediləcək!</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', lineHeight: 1.5 }}>
                <strong>"{apiKey.name}"</strong> açarının gizli açar tokenini yenilədiyiniz zaman, hazırda istifadədə olan köhnə açar <strong>dərhal qüvvədən düşəcək</strong>. Həmin açarla qoşulmuş tətbiq və ya saytlarınızda dərhal yeni açarı quraşdırmalısınız.
              </p>
            </div>

            <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#64748b' }}>Açar ID:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{apiKey.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#64748b' }}>Cari Prefiks:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{apiKey.keyPrefix}••••••••</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Mühit:</span>
                <span style={{ fontWeight: 700, color: apiKey.environment === 'LIVE' ? '#059669' : '#7c3aed' }}>
                  {apiKey.environment}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
              <Button variant="secondary" onClick={handleClose} disabled={loading}>
                İmtina et
              </Button>
              <Button
                variant="primary"
                onClick={handleRegenerate}
                isLoading={loading}
                style={{ background: '#d97706', borderColor: '#d97706' }}
              >
                <RotateCw size={14} style={{ marginRight: 6 }} />
                Bəli, Yeni Gizli Kod Yarat
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '1.75rem' }}>
            <div className="security-warning">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 4 }}>
                <ShieldAlert size={18} />
                <span>Yeni Gizli Açar Uğurla Yaradıldı!</span>
              </div>
              Köhnə açar ləğv edildi. Bu yeni gizli açar <strong>yalnız bir dəfə</strong> göstərilir. Onu dərhal kopyalayın və layihənizin konfiqurasiyasına daxil edin.
            </div>

            <div className="secret-key-display">
              <span className="secret-key-code">{newSecret}</span>
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
