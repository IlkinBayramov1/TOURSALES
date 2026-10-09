import React, { useEffect, useState } from 'react';
import { Badge, Button } from '@toursales/ui';
import { DataTable } from '@/shared/components';
import { TeamActivityLog, teamApi } from '../../teamApi';
import { 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  X, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  User,
  Activity
} from 'lucide-react';
import './TeamActivityLogTable.css';

export const TeamActivityLogTable: React.FC = () => {
  const [logs, setLogs] = useState<TeamActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<TeamActivityLog | null>(null);

  const loadLogs = async (customAction = actionFilter, customSearch = search) => {
    try {
      setLoading(true);
      const data = await teamApi.getActivityLogs({
        action: customAction !== 'ALL' ? customAction : undefined,
        search: customSearch.trim() || undefined,
      });
      setLogs(data);
    } catch (err) {
      console.error('Fəaliyyət jurnalı yüklənmədi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs(actionFilter, search);
    }, 300);
    return () => clearTimeout(timer);
  }, [actionFilter, search]);

  const getActionBadgeVariant = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'CREATE':
      case 'INVITE':
        return 'success';
      case 'UPDATE':
      case 'CHANGE_PLAN':
      case 'STATUS_CHANGE':
        return 'warning';
      case 'RESET_PASSWORD':
        return 'gold';
      case 'CHECKIN':
        return 'info';
      case 'REMOVE':
      case 'DELETE':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'CREATE': return '➕ Yaradıldı';
      case 'INVITE': return '✉️ Dəvət Edildi';
      case 'UPDATE': return '✏️ Redaktə';
      case 'RESET_PASSWORD': return '🔑 Şifrə Sıfırlandı';
      case 'STATUS_CHANGE': return '⏸️ Status Dəyişdirildi';
      case 'CHECKIN': return '🎫 Minik Təsdiqi';
      case 'CHANGE_PLAN': return '💎 Plan Dəyişimi';
      case 'REMOVE':
      case 'DELETE': return '🗑️ Silindi';
      default: return action;
    }
  };

  const formatJson = (val: string | null | undefined) => {
    if (!val || val === '—') return null;
    try {
      const parsed = JSON.parse(val);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return val;
    }
  };

  return (
    <div className="activity-log-card">
      <div className="activity-log-header">
        <div>
          <h3>Fəaliyyət və Təhlükəsizlik Jurnalı (Audit Log)</h3>
          <p>Şirkət əməkdaşları tərəfindən icra edilmiş son əməliyyatların şəffaf qeydiyyatı</p>
        </div>
        <div className="activity-header-meta">
          <span className="activity-count-badge">{logs.length} Hadisə Tapıldı</span>
          <button 
            type="button" 
            onClick={() => loadLogs()} 
            className="activity-refresh-btn" 
            title="Yenilə"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="activity-filter-bar">
        <div className="activity-search-box">
          <Search size={16} className="activity-search-icon" />
          <input
            type="text"
            placeholder="İcraçı adı, modul, obyekt və ya detal üzrə axtar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="activity-search-input"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="activity-clear-search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="activity-action-filter-box">
          <Filter size={15} />
          <span>Əməliyyat:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="activity-action-select"
          >
            <option value="ALL">Bütün Əməliyyatlar</option>
            <option value="INVITE">✉️ Dəvət (INVITE)</option>
            <option value="UPDATE">✏️ Redaktə (UPDATE)</option>
            <option value="RESET_PASSWORD">🔑 Şifrə Sıfırlama (RESET_PASSWORD)</option>
            <option value="STATUS_CHANGE">⏸️ Status Dəyişimi (STATUS_CHANGE)</option>
            <option value="REMOVE">🗑️ Silinmə (REMOVE)</option>
            <option value="CHECKIN">🎫 Minik Check-in (CHECKIN)</option>
            <option value="CHANGE_PLAN">💎 Plan Dəyişimi (CHANGE_PLAN)</option>
          </select>
        </div>
      </div>

      <DataTable<TeamActivityLog>
        data={logs}
        isLoading={loading}
        columns={[
          {
            header: 'Tarix & Saat',
            render: (l: TeamActivityLog) => (
              <div className="activity-time-cell">
                <Clock size={14} className="text-secondary" />
                <span>
                  {new Date(l.createdAt).toLocaleDateString('az-AZ', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ),
          },
          {
            header: 'İcraçı Əməkdaş',
            render: (l: TeamActivityLog) => (
              <span className="font-semibold text-slate-800">
                {l.performedBy}
              </span>
            ),
          },
          {
            header: 'Əməliyyat',
            render: (l: TeamActivityLog) => (
              <Badge variant={getActionBadgeVariant(l.action)} pill>
                {getActionLabel(l.action)}
              </Badge>
            ),
          },
          {
            header: 'Modul / Obyekt',
            render: (l: TeamActivityLog) => (
              <span className="font-mono text-sm text-secondary">
                {l.entityName} (#{l.entityId})
              </span>
            ),
          },
          {
            header: 'Detallar',
            render: (l: TeamActivityLog) => {
              let parsedText = l.details;
              try {
                const parsed = JSON.parse(l.details);
                parsedText = Object.entries(parsed)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(', ');
              } catch {
                // use raw text
              }
              return (
                <div className="activity-details-row">
                  <span className="text-secondary text-sm activity-details-cell">
                    {parsedText}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedLog(l)}
                    className="activity-inspect-btn"
                    title="Dəyişikliklərin JSON detalına bax"
                  >
                    <Eye size={13} />
                    <span>Baxış</span>
                  </button>
                </div>
              );
            },
          },
        ]}
        emptyMessage={
          search || actionFilter !== 'ALL'
            ? 'Axtarış meyarlarına uyğun fəaliyyət tapılmadı.'
            : 'Hələ heç bir fəaliyyət qeydə alınmayıb.'
        }
      />

      {/* Audit Detail Modal */}
      {selectedLog && (
        <div className="audit-detail-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="audit-detail-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="audit-detail-modal-header">
              <div className="audit-detail-header-left">
                <span className="audit-modal-badge">
                  <Activity size={13} />
                  Audit Qeydiyyatı #{selectedLog.id}
                </span>
                <h3>Əməliyyatın Dərin Təhlili</h3>
              </div>
              <button
                type="button"
                className="audit-modal-close"
                onClick={() => setSelectedLog(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="audit-detail-meta-grid">
              <div className="audit-meta-item">
                <span className="audit-meta-label">İcraçı</span>
                <span className="audit-meta-val">{selectedLog.performedBy}</span>
              </div>
              <div className="audit-meta-item">
                <span className="audit-meta-label">Əməliyyat</span>
                <Badge variant={getActionBadgeVariant(selectedLog.action)} pill>
                  {getActionLabel(selectedLog.action)}
                </Badge>
              </div>
              <div className="audit-meta-item">
                <span className="audit-meta-label">Təsir Edilən Obyekt</span>
                <span className="audit-meta-val font-mono">
                  {selectedLog.entityName} ({selectedLog.entityId})
                </span>
              </div>
              <div className="audit-meta-item">
                <span className="audit-meta-label">Zaman</span>
                <span className="audit-meta-val">
                  {new Date(selectedLog.createdAt).toLocaleString('az-AZ')}
                </span>
              </div>
            </div>

            {/* Changes comparison */}
            <div className="audit-changes-container">
              {selectedLog.oldValues && (
                <div className="audit-change-box old">
                  <div className="audit-change-title">
                    <span>Əvvəlki Dəyərlər (Old Values)</span>
                  </div>
                  <pre className="audit-json-pre">
                    {formatJson(selectedLog.oldValues)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && (
                <div className="audit-change-box new">
                  <div className="audit-change-title">
                    <span>Yeni Dəyərlər (New Values)</span>
                  </div>
                  <pre className="audit-json-pre">
                    {formatJson(selectedLog.newValues)}
                  </pre>
                </div>
              )}

              {!selectedLog.oldValues && !selectedLog.newValues && (
                <div className="audit-change-box neutral">
                  <div className="audit-change-title">
                    <span>Detallar</span>
                  </div>
                  <pre className="audit-json-pre">{selectedLog.details}</pre>
                </div>
              )}
            </div>

            <div className="audit-modal-footer">
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                Bağla
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
