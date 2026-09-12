import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@toursales/ui';
import { Key, Webhook, Code2, Search, Plus } from 'lucide-react';
import { ApiKey, WebhookConfig, ApiIntegrationStats } from '@toursales/types';
import { apiKeysApi } from '../../apiKeysApi';
import { ApiKpiCards } from '../../components/ApiKpiCards/ApiKpiCards';
import { ApiKeysTable } from '../../components/ApiKeysTable/ApiKeysTable';
import { WebhooksTable } from '../../components/WebhooksTable/WebhooksTable';
import { ApiCodeExamples } from '../../components/ApiCodeExamples/ApiCodeExamples';
import { CreateKeyModal } from '../../components/CreateKeyModal/CreateKeyModal';
import { CreateWebhookModal } from '../../components/CreateWebhookModal/CreateWebhookModal';
import './ApiKeysPage.css';

type ApiTab = 'KEYS' | 'WEBHOOKS' | 'DOCS';

export const ApiKeysPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ApiTab>('KEYS');
  const [loading, setLoading] = useState(true);

  // Data states
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [stats, setStats] = useState<ApiIntegrationStats | undefined>(undefined);

  // Modals state
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [envFilter, setEnvFilter] = useState('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      const [keysData, webhooksData, statsData] = await Promise.all([
        apiKeysApi.getKeys(),
        apiKeysApi.getWebhooks(),
        apiKeysApi.getStats()
      ]);

      setKeys(keysData);
      setWebhooks(webhooksData);
      setStats(statsData);
    } catch (err) {
      console.error('API məlumatlarının yüklənməsində xəta:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Keys
  const filteredKeys = useMemo(() => {
    return keys.filter((k) => {
      const searchLower = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        k.name?.toLowerCase().includes(searchLower) ||
        k.keyPrefix?.toLowerCase().includes(searchLower);

      const matchEnv = envFilter === 'ALL' || k.environment === envFilter;

      return matchSearch && matchEnv;
    });
  }, [keys, searchQuery, envFilter]);

  // Filtered Webhooks
  const filteredWebhooks = useMemo(() => {
    return webhooks.filter((wh) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        wh.name?.toLowerCase().includes(searchLower) ||
        wh.url?.toLowerCase().includes(searchLower)
      );
    });
  }, [webhooks, searchQuery]);

  // Handlers
  const handleRevokeKey = async (id: string) => {
    try {
      await apiKeysApi.revokeKey(id);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.msg || err?.message || 'Açar ləğv edilərkən xəta baş verdi');
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      await apiKeysApi.deleteKey(id);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.msg || err?.message || 'Açar silinərkən xəta baş verdi');
    }
  };

  const handleTestWebhook = async (id: string) => {
    const res = await apiKeysApi.testWebhook(id);
    await loadData();
    return res as any;
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await apiKeysApi.deleteWebhook(id);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.msg || err?.message || 'Webhook silinərkən xəta baş verdi');
    }
  };

  return (
    <div className="apikeys-page">
      {/* Header */}
      <div className="apikeys-header">
        <div>
          <h1>API & İnteqrasiyalar</h1>
          <p>Şəxsi vebsaytınızdan və ya CRM tətbiqinizdən turları və bilet satışını idarə etmək üçün API mərkəzi</p>
        </div>

        <div className="apikeys-header-actions">
          <Button
            variant="outline"
            onClick={() => setIsWebhookModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Webhook size={16} />
            <span>+ Yeni Webhook</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsKeyModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} />
            <span>+ Yeni API Açar</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <ApiKpiCards stats={stats} loading={loading} />

      {/* Nav Tabs */}
      <div className="apikeys-nav-tabs">
        <button
          type="button"
          className={`apikeys-nav-tab ${activeTab === 'KEYS' ? 'active' : ''}`}
          onClick={() => setActiveTab('KEYS')}
        >
          <Key size={16} />
          <span>API Açarları</span>
          <span className="apikeys-tab-badge">{keys.length}</span>
        </button>

        <button
          type="button"
          className={`apikeys-nav-tab ${activeTab === 'WEBHOOKS' ? 'active' : ''}`}
          onClick={() => setActiveTab('WEBHOOKS')}
        >
          <Webhook size={16} />
          <span>Webhooks (Hadisə Bildirişləri)</span>
          <span className="apikeys-tab-badge">{webhooks.length}</span>
        </button>

        <button
          type="button"
          className={`apikeys-nav-tab ${activeTab === 'DOCS' ? 'active' : ''}`}
          onClick={() => setActiveTab('DOCS')}
        >
          <Code2 size={16} />
          <span>Sənədlər & Kod Nümunələri</span>
        </button>
      </div>

      {/* Filters (only on KEYS and WEBHOOKS tabs) */}
      {activeTab !== 'DOCS' && (
        <div className="apikeys-filters-bar">
          <div className="apikeys-search-box">
            <Search size={16} className="apikeys-search-icon" />
            <input
              type="text"
              className="apikeys-search-input"
              placeholder={
                activeTab === 'KEYS'
                  ? 'Açar adı və ya prefiks ilə axtarış...'
                  : 'Webhook adı və ya URL ilə axtarış...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {activeTab === 'KEYS' && (
            <select
              className="apikeys-filter-select"
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
            >
              <option value="ALL">Bütün Mühitlər</option>
              <option value="LIVE">Yalnız LIVE Açarlar</option>
              <option value="TEST">Yalnız TEST / Sandbox Açarlar</option>
            </select>
          )}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'KEYS' && (
        <ApiKeysTable
          keys={filteredKeys}
          loading={loading}
          onRevoke={handleRevokeKey}
          onDelete={handleDeleteKey}
        />
      )}

      {activeTab === 'WEBHOOKS' && (
        <WebhooksTable
          webhooks={filteredWebhooks}
          loading={loading}
          onTestWebhook={handleTestWebhook}
          onDelete={handleDeleteWebhook}
        />
      )}

      {activeTab === 'DOCS' && <ApiCodeExamples />}

      {/* Modals */}
      <CreateKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSuccess={loadData}
      />

      <CreateWebhookModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
