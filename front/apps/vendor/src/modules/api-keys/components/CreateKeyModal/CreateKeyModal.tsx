import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { apiKeysApi } from '../../apiKeysApi';
import './CreateKeyModal.css';

interface CreateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateKeyModal: React.FC<CreateKeyModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await apiKeysApi.createKey(name);
      setCreatedSecret(res.rawSecretKey);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Açar yaradılarkən xəta baş verdi');
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
    setCreatedSecret(null);
    setError(null);
    onClose();
  };

  return (
    <div className="key-modal-overlay" onClick={handleClose}>
      <div className="key-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="key-modal-header">
          <h3>{createdSecret ? 'API Açarınız Hazırdır' : 'Yeni API Açar Yarat'}</h3>
          <button type="button" className="key-close-btn" onClick={handleClose}>×</button>
        </div>

        {error && (
          <div style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {!createdSecret ? (
          <form onSubmit={handleCreate}>
            <div className="key-form-group">
              <label>Açarın Təsviri / Adı</label>
              <input
                type="text"
                placeholder="Məsələn: Rəsmi Vebsayt Rezervasiya İnteqrasiyası"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <Button variant="secondary" onClick={handleClose} disabled={loading}>
                Ləğv et
              </Button>
              <Button variant="primary" type="submit" isLoading={loading}>
                Yarat
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <div className="security-warning">
              ⚠️ <strong>Diqqət:</strong> Bu gizli açar yalnız bir dəfə nümayiş olunur. Onu dərhal kopyalayın və təhlükəsiz yerdə saxlayın.
            </div>

            <div className="secret-key-display">
              <span className="secret-key-code">{createdSecret}</span>
              <Button size="sm" variant="secondary" onClick={handleCopy}>
                {copied ? '✓ Kopyalandı' : 'Kopyala'}
              </Button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <Button variant="primary" onClick={handleClose}>
                Bağla
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
