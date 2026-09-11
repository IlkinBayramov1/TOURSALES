import React, { useEffect, useState } from 'react';
import { Badge } from '@toursales/ui';
import { ShieldCheck, ShieldAlert, Filter } from 'lucide-react';
import { DataTable } from '../../../../shared/components/DataTable/DataTable';
import { auditLogsApi, AuditLog } from '../../auditLogsApi';
import './AuditLogsPage.css';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await auditLogsApi.getLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="audit-logs-page">
      <div className="audit-logs-header">
        <div>
          <h1>Təhlükəsizlik & Audit Qeydləri (Audit Trail)</h1>
          <p>Bütün inzibati hərəkətlərin, maliyyə təsdiqlərinin və sistem dəyişikliklərinin dəyişməz qeydləri</p>
        </div>
      </div>

      <DataTable
        data={logs}
        searchPlaceholder="İstifadəçi adı, əməliyyat və ya IP üzrə axtarın..."
        searchField={(l: AuditLog) => `${l.userName} ${l.action} ${l.entity} ${l.ipAddress}`}
        columns={[
          {
            header: 'Tarix & Saat',
            accessor: (l: AuditLog) => new Date(l.createdAt).toLocaleString('az-AZ')
          },
          {
            header: 'İstifadəçi & Rol',
            accessor: (l: AuditLog) => (
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{l.userName || 'Sistem'}</div>
                <Badge variant={l.userRole === 'ADMIN' ? 'error' : 'primary'} size="sm">
                  {l.userRole || 'USER'}
                </Badge>
              </div>
            )
          },
          {
            header: 'Əməliyyat',
            accessor: (l: AuditLog) => (
              <span className="action-badge">{l.action}</span>
            )
          },
          {
            header: 'Obyekt (Entity)',
            accessor: (l: AuditLog) => (
              <span>{l.entity} {l.entityId ? `#${l.entityId}` : ''}</span>
            )
          },
          {
            header: 'IP Ünvanı',
            accessor: (l: AuditLog) => (
              <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{l.ipAddress || '127.0.0.1'}</span>
            )
          },
          {
            header: 'Ətraflı Parametrlər',
            accessor: (l: AuditLog) => (
              <span className="details-code" title={JSON.stringify(l.details)}>
                {JSON.stringify(l.details)}
              </span>
            )
          }
        ]}
      />
    </div>
  );
};
