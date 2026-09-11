import React, { useEffect, useState } from 'react';
import { Button } from '@toursales/ui';
import { DataTable } from '@/shared/components';
import { CreateKeyModal } from '../../components/CreateKeyModal/CreateKeyModal';
import { apiKeysApi } from '../../apiKeysApi';
import { ApiKey } from '@toursales/types';
import './ApiKeysPage.css';

export const ApiKeysPage: React.FC = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadKeys = async () => {
    try {
      setLoading(true);
      const data = await apiKeysApi.getKeys();
      setKeys(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Bu API açarını ləğv etmək istədiyinizə əminsiniz? Bu açardan istifadə edən bütün xarici sistemlər işləməyəcək.')) {
      return;
    }
    try {
      await apiKeysApi.revokeKey(id);
      loadKeys();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="apikeys-page">
      <div className="apikeys-header">
        <div>
          <h1>API & İnteqrasiyalar</h1>
          <p>Şəxsi vebsaytınızdan və ya tətbiqinizdən turları və bilet satışını idarə etmək üçün API açarları</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + Yeni API Açar Yarat
        </Button>
      </div>

      <div className="apikeys-docs-card">
        <h3>Tez Başlanğıc Təlimatı (API Auth)</h3>
        <p>Bütün sorğuların başlıq hissəsinə (Headers) aşağıdakı formatda API açarınızı əlavə edin:</p>
        <div className="code-preview">
          <code>Authorization: Bearer ts_live_sec_your_secret_key_here</code>
        </div>
      </div>

      <div className="apikeys-table-card">
        <DataTable
          data={keys}
          columns={[
            {
              header: 'Açarın Adı',
              accessor: (k: ApiKey) => (
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {k.name}
                </span>
              )
            },
            {
              header: 'Açar Prefiksi',
              accessor: (k: ApiKey) => (
                <code style={{ background: 'var(--color-bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  {k.keyPrefix}••••••••
                </code>
              )
            },
            {
              header: 'Yaradılma Tarixi',
              accessor: (k: ApiKey) => new Date(k.createdAt).toLocaleDateString('az-AZ')
            },
            {
              header: 'Son İstifadə',
              accessor: (k: ApiKey) => k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('az-AZ') : 'İstifadə olunmayıb'
            },
            {
              header: 'Əməliyyat',
              accessor: (k: ApiKey) => (
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ color: 'var(--color-error)' }}
                  onClick={() => handleRevoke(k.id)}
                >
                  Ləğv et
                </Button>
              )
            }
          ]}
        />
      </div>

      <CreateKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadKeys}
      />
    </div>
  );
};
