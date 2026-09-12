import React, { useState } from 'react';
import { Key, Copy, Check, Ban, Trash2 } from 'lucide-react';
import { ApiKey } from '@toursales/types';
import './ApiKeysTable.css';

interface ApiKeysTableProps {
  keys: ApiKey[];
  loading?: boolean;
  onRevoke: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ApiKeysTable: React.FC<ApiKeysTableProps> = ({
  keys,
  loading,
  onRevoke,
  onDelete
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPrefix = (key: ApiKey) => {
    navigator.clipboard.writeText(key.keyPrefix);
    setCopiedId(key.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="apikeys-table-container">
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
          API açarları yüklənir...
        </div>
      </div>
    );
  }

  if (!keys || keys.length === 0) {
    return (
      <div className="apikeys-table-container">
        <div className="ad-empty-state" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#9ca3af' }}>
            <Key size={28} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            API açarı tapılmadı
          </h3>
          <p style={{ fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto', color: '#6b7280' }}>
            Vebsaytınızı və ya tətbiqinizi TOURSALES platformasına inteqrasiya etmək üçün ilk API açarınızı yaradın.
          </p>
        </div>
      </div>
    );
  }

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'tours:read':
        return 'Turları Oxumaq';
      case 'tours:write':
        return 'Turları İdarə Etmək';
      case 'bookings:read':
        return 'Sifarişləri Oxumaq';
      case 'bookings:write':
        return 'Bilet Satışı / Sifariş';
      case 'finance:read':
        return 'Maliyyə & Hesabat';
      default:
        return scope;
    }
  };

  return (
    <div className="apikeys-table-container">
      <table className="ads-table">
        <thead>
          <tr>
            <th>Açarın Adı & Təsviri</th>
            <th>Mühit</th>
            <th>Açar Prefiksi</th>
            <th>İcazə Sahələri (Scopes)</th>
            <th>Sorğu Sayı</th>
            <th>Son İstifadə</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Əməliyyatlar</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => {
            const isLive = k.environment === 'LIVE';
            const isRevoked = k.status === 'Revoked';
            const scopes = Array.isArray(k.scopes) ? k.scopes : [];
            const isCopied = copiedId === k.id;

            return (
              <tr key={k.id} style={{ opacity: isRevoked ? 0.6 : 1 }}>
                {/* Name */}
                <td>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {k.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      Yaradılıb: {new Date(k.createdAt).toLocaleDateString('az-AZ')}
                    </div>
                  </div>
                </td>

                {/* Environment */}
                <td>
                  <span className={`env-badge ${isLive ? 'live' : 'test'}`}>
                    {isLive ? 'LIVE' : 'SANDBOX'}
                  </span>
                </td>

                {/* Key Prefix */}
                <td>
                  <span className="key-prefix-code">
                    <span>{k.keyPrefix}••••••••</span>
                    <button
                      type="button"
                      onClick={() => handleCopyPrefix(k)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6b7280' }}
                      title="Prefiksi kopyala"
                    >
                      {isCopied ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                    </button>
                  </span>
                </td>

                {/* Scopes */}
                <td>
                  <div className="scopes-wrap">
                    {scopes.map((s, idx) => (
                      <span key={idx} className="scope-pill">
                        {getScopeLabel(s)}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Request Count */}
                <td>
                  <span style={{ fontWeight: 600 }}>{(k.requestCount || 0).toLocaleString('az-AZ')}</span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: 4 }}>sorğu</span>
                </td>

                {/* Last Used */}
                <td>
                  <span style={{ fontSize: '0.8125rem' }}>
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('az-AZ') : 'İstifadə olunmayıb'}
                  </span>
                </td>

                {/* Status */}
                <td>
                  {isRevoked ? (
                    <span className="ad-status-badge expired">
                      <span className="ad-status-dot" />
                      Ləğv edilib
                    </span>
                  ) : (
                    <span className="ad-status-badge active">
                      <span className="ad-status-dot" />
                      Aktiv
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td>
                  <div className="ad-actions-cell" style={{ justifyContent: 'flex-end' }}>
                    {!isRevoked && (
                      <button
                        type="button"
                        className="ad-action-btn"
                        title="Açarı Ləğv Et (Revoke)"
                        onClick={() => {
                          if (window.confirm(`"${k.name}" API açarını ləğv etmək istədiyinizə əminsiniz? Bu açardan istifadə edən xarici sistemlər işləməyəcək.`)) {
                            onRevoke(k.id);
                          }
                        }}
                      >
                        <Ban size={14} color="#d97706" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="ad-action-btn delete"
                      title="Açarı Sil"
                      onClick={() => {
                        if (window.confirm(`"${k.name}" API açarını silmək istədiyinizə əminsiniz?`)) {
                          onDelete(k.id);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
