import React from 'react';
import { Key, Activity, Clock, Webhook } from 'lucide-react';
import { ApiIntegrationStats } from '@toursales/types';
import './ApiKpiCards.css';

interface ApiKpiCardsProps {
  stats?: ApiIntegrationStats;
  loading?: boolean;
}

export const ApiKpiCards: React.FC<ApiKpiCardsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="api-kpi-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="api-kpi-card" style={{ opacity: 0.6 }}>
            <div className="api-kpi-icon keys" />
            <div className="api-kpi-content">
              <div style={{ height: 14, width: '60%', background: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 28, width: '40%', background: '#e5e7eb', borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalKeys = stats?.totalKeys || 0;
  const liveKeys = stats?.activeLiveKeys || 0;
  const testKeys = stats?.activeTestKeys || 0;
  const totalRequests = stats?.totalRequestsLast30Days || 0;
  const latency = stats?.avgLatencyMs || 42;
  const webhooks = stats?.activeWebhooksCount || 0;

  return (
    <div className="api-kpi-grid">
      {/* 1. API Keys Count */}
      <div className="api-kpi-card">
        <div className="api-kpi-icon keys">
          <Key size={24} />
        </div>
        <div className="api-kpi-content">
          <div className="api-kpi-title">Aktiv API Açarları</div>
          <div className="api-kpi-value">{totalKeys} açar</div>
          <div className="api-kpi-subtitle">
            <span className="api-kpi-badge live">{liveKeys} Live</span>
            <span className="api-kpi-badge test">{testKeys} Sandbox</span>
          </div>
        </div>
      </div>

      {/* 2. Total Requests */}
      <div className="api-kpi-card">
        <div className="api-kpi-icon requests">
          <Activity size={24} />
        </div>
        <div className="api-kpi-content">
          <div className="api-kpi-title">Aylıq API Sorğuları</div>
          <div className="api-kpi-value">{totalRequests.toLocaleString('az-AZ')}</div>
          <div className="api-kpi-subtitle">
            <span>Son 30 gündə uğurlu çağırış</span>
          </div>
        </div>
      </div>

      {/* 3. Latency */}
      <div className="api-kpi-card">
        <div className="api-kpi-icon latency">
          <Clock size={24} />
        </div>
        <div className="api-kpi-content">
          <div className="api-kpi-title">Orta Cavab Müddəti</div>
          <div className="api-kpi-value">{latency} ms</div>
          <div className="api-kpi-subtitle">
            <span style={{ color: '#059669', fontWeight: 600 }}>Yüksək sürətli (Fast SLA)</span>
          </div>
        </div>
      </div>

      {/* 4. Active Webhooks */}
      <div className="api-kpi-card">
        <div className="api-kpi-icon webhooks">
          <Webhook size={24} />
        </div>
        <div className="api-kpi-content">
          <div className="api-kpi-title">Aktiv Webhooks</div>
          <div className="api-kpi-value">{webhooks} endpoint</div>
          <div className="api-kpi-subtitle">
            <span>Canlı hadisə dinləyiciləri</span>
          </div>
        </div>
      </div>
    </div>
  );
};
