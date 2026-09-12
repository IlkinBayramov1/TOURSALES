import React, { useEffect, useState } from 'react';
import { Badge } from '@toursales/ui';
import { DataTable } from '@/shared/components';
import { TeamActivityLog, teamApi } from '../../teamApi';
import { History, Clock, UserCheck } from 'lucide-react';
import './TeamActivityLogTable.css';

export const TeamActivityLogTable: React.FC = () => {
  const [logs, setLogs] = useState<TeamActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await teamApi.getActivityLogs();
      setLogs(data);
    } catch (err) {
      console.error('Fəaliyyət jurnalı yüklənmədi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionBadgeVariant = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'CREATE':
      case 'INVITE':
        return 'success';
      case 'UPDATE':
      case 'CHANGE_PLAN':
        return 'warning';
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
      case 'CREATE': return 'Yaradıldı';
      case 'INVITE': return 'Dəvət Edildi';
      case 'UPDATE': return 'Yeniləndi';
      case 'CHECKIN': return 'Minik Təsdiqi';
      case 'CHANGE_PLAN': return 'Plan Dəyişimi';
      case 'REMOVE': return 'Silindi';
      default: return action;
    }
  };

  return (
    <div className="activity-log-card">
      <div className="activity-log-header">
        <div>
          <h3>Fəaliyyət və Təhlükəsizlik Jurnalı (Audit Log)</h3>
          <p>Şirkət əməkdaşları tərəfindən icra edilmiş son əməliyyatların şəffaf qeydiyyatı</p>
        </div>
        <span className="activity-count-badge">{logs.length} Hadisə</span>
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
              } catch (e) {
                // use raw text
              }
              return (
                <span className="text-secondary text-sm activity-details-cell">
                  {parsedText}
                </span>
              );
            },
          },
        ]}
        emptyMessage="Hələ heç bir fəaliyyət qeydə alınmayıb."
      />
    </div>
  );
};
