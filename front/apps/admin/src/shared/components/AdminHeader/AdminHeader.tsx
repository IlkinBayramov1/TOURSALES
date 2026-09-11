import React from 'react';
import { ExternalLink } from 'lucide-react';
import './AdminHeader.css';

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title = 'Platforma İdarəetmə Paneli',
  subtitle,
}) => {
  return (
    <header className="admin-header">
      <div>
        <h1 className="admin-header-title">{title}</h1>
        {subtitle && <p className="admin-header-subtitle">{subtitle}</p>}
      </div>

      <div className="admin-header-actions">
        <div className="system-status">
          <span className="status-dot" />
          <span>Sistem Aktivdir</span>
        </div>

        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          className="portal-link"
        >
          <span>Müştəri Portalı (Web)</span>
          <ExternalLink size={12} />
        </a>

        <a
          href="http://localhost:5174"
          target="_blank"
          rel="noreferrer"
          className="portal-link"
        >
          <span>Agentlik Portalı (Vendor)</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </header>
  );
};
