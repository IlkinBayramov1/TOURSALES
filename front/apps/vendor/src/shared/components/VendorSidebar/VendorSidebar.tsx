import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Compass, 
  Users, 
  Wallet, 
  CreditCard, 
  ShieldCheck, 
  Megaphone, 
  Key, 
  Building2, 
  UserCheck,
  Building,
  BedDouble,
  MessageSquare,
  LifeBuoy,
  Briefcase,
  BarChart3,
  LogOut, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Badge } from '@toursales/ui';
import { useVendorAuth, AgencyRole } from '../../context/VendorAuthContext';
import './VendorSidebar.css';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
  allowedRoles: AgencyRole[];
}

export const VendorSidebar: React.FC = () => {
  const { company, logout, activeAgencyRole, simulationRole } = useVendorAuth();

  const navItems: NavItem[] = [
    { to: '/', label: 'İdarə Paneli', icon: <LayoutDashboard size={18} />, end: true, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
    { to: '/guide', label: 'Bələdçi Portalı', icon: <UserCheck size={18} />, allowedRoles: ['OWNER', 'MANAGER', 'GUIDE'] },
    { to: '/bookings', label: 'Sifarişlər & Minik', icon: <Users size={18} />, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT', 'GUIDE'] },
    { to: '/tours', label: 'Turların İdarəsi', icon: <Compass size={18} />, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
    { to: '/tenders', label: 'Tender Masası (Fərdi)', icon: <Briefcase size={18} />, allowedRoles: ['OWNER', 'MANAGER'] },
    { to: '/hotels', label: 'Otellər & Otaqlar', icon: <Building size={18} />, allowedRoles: ['OWNER', 'MANAGER'] },
    { to: '/hotels/bookings', label: 'Otel Qonaqları', icon: <BedDouble size={18} />, allowedRoles: ['OWNER', 'MANAGER'] },
    { to: '/chat', label: 'Müştəri Çatı', icon: <MessageSquare size={18} />, allowedRoles: ['OWNER', 'MANAGER'] },
    { to: '/tickets', label: 'Dəstək Biletləri', icon: <LifeBuoy size={18} />, allowedRoles: ['OWNER', 'MANAGER'] },
    { to: '/analytics', label: 'Dərin Analitika & Yield', icon: <BarChart3 size={18} />, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
    { to: '/finance', label: 'Maliyyə & Balans', icon: <Wallet size={18} />, allowedRoles: ['OWNER', 'ACCOUNTANT'] },
    { to: '/subscription', label: 'Abunəlik Planı', icon: <CreditCard size={18} />, allowedRoles: ['OWNER', 'ACCOUNTANT'] },
    { to: '/team', label: 'Komanda & Girişlər', icon: <ShieldCheck size={18} />, allowedRoles: ['OWNER', 'MANAGER'] },
    { to: '/ads', label: 'Reklam Kampaniyaları', icon: <Megaphone size={18} />, allowedRoles: ['OWNER', 'MANAGER'] },
    { to: '/api-keys', label: 'API Açar İdarəsi', icon: <Key size={18} />, allowedRoles: ['OWNER'] },
    { to: '/profile', label: 'Şirkət Profili', icon: <Building2 size={18} />, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT', 'GUIDE'] },
  ];

  const visibleNavItems = navItems.filter((item) =>
    item.allowedRoles.includes(activeAgencyRole)
  );

  const getRoleLabel = (role: AgencyRole) => {
    switch (role) {
      case 'OWNER': return '👑 Rəhbər';
      case 'MANAGER': return '🛡️ Menecer';
      case 'ACCOUNTANT': return '📊 Mühasib';
      case 'GUIDE': return '📱 Bələdçi';
      default: return role;
    }
  };

  return (
    <aside className="vendor-sidebar">
      {/* Brand & Portal Type */}
      <div className="vendor-sidebar-brand">
        <div className="vendor-brand-title">
          <span>TOURSALES</span>
          <Badge variant="warning" pill>
            PARTNER
          </Badge>
        </div>
        <p className="vendor-brand-sub">Turizm Şirkəti İdarəetmə Mərkəzi</p>
      </div>

      {/* Company Identity Summary */}
      <div className="vendor-company-card">
        <div className="vendor-company-avatar">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} />
          ) : (
            <Building2 size={22} />
          )}
        </div>
        <div className="vendor-company-meta">
          <h4 className="vendor-company-name">{company?.name || 'Agentlik Adı'}</h4>
          <div className="vendor-company-status-row">
            <span className="vendor-company-status">
              <span className="vendor-status-dot" />
              {company?.status === 'ACTIVE' ? 'Təsdiqlənmiş Tərəfdaş' : 'Aktiv Portal'}
            </span>
            <span className={`vendor-sidebar-role-badge ${simulationRole ? 'simulated' : ''}`}>
              {simulationRole ? `🎭 ${getRoleLabel(simulationRole)}` : getRoleLabel(activeAgencyRole)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="vendor-nav-menu">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `vendor-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="vendor-nav-icon">{item.icon}</span>
            <span className="vendor-nav-text">{item.label}</span>
            <ChevronRight size={15} className="vendor-nav-arrow" />
          </NavLink>
        ))}
      </nav>

      {/* Footer / Customer Portal Link & Logout */}
      <div className="vendor-sidebar-footer">
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          className="vendor-portal-switch"
        >
          <span>Müştəri Saytına Get</span>
          <ExternalLink size={14} />
        </a>

        <button
          type="button"
          onClick={logout}
          className="vendor-logout-button"
        >
          <LogOut size={16} />
          <span>Çıxış</span>
        </button>
      </div>
    </aside>
  );
};
