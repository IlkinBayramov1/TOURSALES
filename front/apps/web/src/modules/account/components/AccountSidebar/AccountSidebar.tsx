import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  User as UserIcon, 
  Ticket, 
  Heart, 
  Award, 
  LogOut, 
  LogIn,
  ShieldCheck, 
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useFavorites } from '@/shared/context/FavoritesContext';
import './AccountSidebar.css';

export const AccountSidebar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { favoritesCount } = useFavorites();

  const navItems = [
    {
      to: '/account/profile',
      label: 'Şəxsi Məlumatlar',
      icon: <UserIcon size={18} />,
    },
    {
      to: '/account/bookings',
      label: 'Sifarişlərim və Biletlər',
      icon: <Ticket size={18} />,
    },
    {
      to: '/account/favorites',
      label: 'Seçilmiş Turlar',
      icon: <Heart size={18} />,
      badge: favoritesCount > 0 ? favoritesCount : null,
    },
    {
      to: '/account/loyalty',
      label: 'Bonus & Loyallıq',
      icon: <Award size={18} />,
    },
  ];

  return (
    <aside className="web-account-sidebar">
      <div className="web-account-user-badge">
        <div className="web-account-avatar">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} />
          ) : (
            <div className="web-avatar-placeholder">
              {user?.name?.charAt(0).toUpperCase() || (isAuthenticated ? 'M' : 'Q')}
            </div>
          )}
        </div>
        <div className="web-account-user-info">
          <h3 className="web-account-name">{user?.name || (isAuthenticated ? 'Müştəri' : 'Qonaq İstifadəçi')}</h3>
          <p className="web-account-email">{user?.email || (isAuthenticated ? '' : 'Daxil olmayıb')}</p>
          <div className="web-account-role">
            {isAuthenticated ? <ShieldCheck size={13} /> : <UserCheck size={13} />}
            <span>{isAuthenticated ? 'Müştəri Hesabı' : 'Qonaq Rejimi'}</span>
          </div>
        </div>
      </div>

      <nav className="web-account-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `web-account-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="web-nav-icon">{item.icon}</span>
            <span className="web-nav-label">{item.label}</span>
            {item.badge !== null && item.badge !== undefined && (
              <span className="web-account-badge-count">{item.badge}</span>
            )}
            <ChevronRight size={16} className="web-nav-chevron" />
          </NavLink>
        ))}

        {isAuthenticated ? (
          <button
            type="button"
            onClick={logout}
            className="web-account-nav-item web-account-logout-btn"
          >
            <span className="web-nav-icon">
              <LogOut size={18} />
            </span>
            <span className="web-nav-label">Çıxış Et</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="web-account-nav-item web-account-login-nav-btn"
          >
            <span className="web-nav-icon">
              <LogIn size={18} />
            </span>
            <span className="web-nav-label">Hesaba Daxil Ol</span>
          </Link>
        )}
      </nav>
    </aside>
  );
};
