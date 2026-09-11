import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Scale,
  ShieldAlert,
  FileText,
  LogOut,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { Badge } from '@toursales/ui';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './AdminSidebar.css';

export const AdminSidebar: React.FC = () => {
  const { user, logout } = useAdminAuth();

  const navItems = [
    { to: '/', label: 'İdarə Paneli', icon: <LayoutDashboard size={18} />, end: true },
    { to: '/companies', label: 'Turizm Agentlikləri', icon: <Building2 size={18} /> },
    { to: '/subscriptions', label: 'Abunəlik Planları', icon: <CreditCard size={18} /> },
    { to: '/finance-audit', label: 'Maliyyə & Çıxarışlar', icon: <Scale size={18} /> },
    { to: '/audit-logs', label: 'Təhlükəsizlik & Audit', icon: <ShieldAlert size={18} /> },
    { to: '/cms', label: 'CMS Məzmun İdarəsi', icon: <FileText size={18} /> },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <div className="admin-brand-title">
          <span>TOURSALES</span>
          <Badge variant="error" pill>
            SUPERADMIN
          </Badge>
        </div>
        <span className="admin-brand-sub">Platforma Nəzarət Mərkəzi</span>
      </div>

      <nav className="admin-nav-menu">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="admin-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-user-info">
          <div className="admin-avatar">
            <ShieldCheck size={20} />
          </div>
          <div className="admin-user-details">
            <span className="admin-user-name">{user?.name || 'Super Admin'}</span>
            <span className="admin-user-role">Sistem Administratoru</span>
          </div>
        </div>

        <button type="button" onClick={logout} className="admin-logout-btn">
          <LogOut size={14} />
          <span>Sistemdən Çıxış</span>
        </button>
      </div>
    </aside>
  );
};
