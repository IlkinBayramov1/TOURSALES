import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  Globe, Menu, Gift, User, MapPin, Check, LogOut, Heart, Ticket, Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className={`web-navbar ${isScrolled ? 'web-navbar-scrolled' : ''}`}>
      <div className="web-nav-container">
        
        {/* Brand Logo */}
        <Link to="/" className="web-logo-group">
          <div className="web-logo-icon">
            <MapPin size={26} strokeWidth={2.5} />
          </div>
          <span className="web-logo-text">
            TOUR<span>SALES</span>
          </span>
        </Link>

        {/* Center Pill Navigation */}
        <nav className="web-center-nav">
          <NavLink 
            to="/domestic" 
            className={({ isActive }) => isActive ? 'web-nav-pill web-nav-pill-active' : 'web-nav-pill'}
          >
            Daxili Turlar
          </NavLink>
          
          <NavLink 
            to="/foreign" 
            className={({ isActive }) => isActive ? 'web-nav-pill web-nav-pill-active' : 'web-nav-pill'}
          >
            Xarici Turlar
          </NavLink>
          
          <NavLink 
            to="/campaigns" 
            className={({ isActive }) => isActive ? 'web-nav-pill web-nav-pill-active' : 'web-nav-pill'}
          >
            Kampaniyalar
          </NavLink>
          
          <a 
            href="http://localhost:5174" 
            target="_blank" 
            rel="noreferrer"
            className="web-nav-pill"
          >
            Tərəfdaşlıq (B2B)
          </a>
        </nav>

        {/* Right Actions */}
        <div className="web-right-actions">
          
          {/* Language & Currency Dropdown */}
          <div className="web-relative-wrap" ref={langRef}>
            <button 
              className="web-btn-lang-curr"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              type="button"
            >
              <Globe size={16} />
              <span className="web-lang-text">
                {currency === 'AZN' ? 'AZN / AZ' : currency === 'USD' ? 'USD / EN' : 'EUR / EN'}
              </span>
            </button>

            {isLangMenuOpen && (
              <div className="web-dropdown-popover">
                <div className="web-dropdown-popover-header">Bölgə və Valyuta</div>
                <button 
                  className="web-dropdown-popover-item" 
                  onClick={() => { setCurrency('AZN'); setIsLangMenuOpen(false); }}
                >
                  <div className="web-dropdown-popover-content">
                    <span className="web-dropdown-item-title">Azərbaycan</span>
                    <span className="web-dropdown-item-sub">AZN - Manat</span>
                  </div>
                  {currency === 'AZN' && <Check size={16} className="web-check-green" />}
                </button>
                <button 
                  className="web-dropdown-popover-item" 
                  onClick={() => { setCurrency('USD'); setIsLangMenuOpen(false); }}
                >
                  <div className="web-dropdown-popover-content">
                    <span className="web-dropdown-item-title">English (US)</span>
                    <span className="web-dropdown-item-sub">USD - Dollar</span>
                  </div>
                  {currency === 'USD' && <Check size={16} className="web-check-green" />}
                </button>
                <button 
                  className="web-dropdown-popover-item" 
                  onClick={() => { setCurrency('EUR'); setIsLangMenuOpen(false); }}
                >
                  <div className="web-dropdown-popover-content">
                    <span className="web-dropdown-item-title">English (EU)</span>
                    <span className="web-dropdown-item-sub">EUR - Euro</span>
                  </div>
                  {currency === 'EUR' && <Check size={16} className="web-check-green" />}
                </button>
              </div>
            )}
          </div>

          {/* Loyalty Points Badge */}
          <Link to="/account/loyalty" className="web-loyalty-pill">
            <div className="web-loyalty-icon-circle">
              <Gift size={14} />
            </div>
            <div className="web-loyalty-text">
              <span className="web-loyalty-amount">1,420</span>
              <span className="web-loyalty-label">Xal</span>
            </div>
          </Link>

          {/* User Menu or Login Button */}
          {isAuthenticated && user ? (
            <div className="web-relative-wrap" ref={userRef}>
              <button 
                className="web-user-menu-pill"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                type="button"
              >
                <Menu size={18} className="web-hamburger-icon" />
                <div className="web-user-avatar-circle">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="web-dropdown-popover-right">
                  <Link 
                    to="/account/profile" 
                    className="web-dropdown-item-user" 
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User size={16} className="web-dropdown-icon" />
                    <span>Şəxsi Kabinet</span>
                  </Link>
                  <Link 
                    to="/account/bookings" 
                    className="web-dropdown-item-user" 
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Ticket size={16} className="web-dropdown-icon" />
                    <span>Biletlərim və Səfərlər</span>
                  </Link>
                  <Link 
                    to="/account/favorites" 
                    className="web-dropdown-item-user" 
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Heart size={16} className="web-dropdown-icon" />
                    <span>İstək Siyahısı</span>
                  </Link>
                  <div className="web-dropdown-divider"></div>
                  <button 
                    className="web-dropdown-item-logout" 
                    onClick={() => { setIsUserMenuOpen(false); logout(); }}
                  >
                    <LogOut size={16} />
                    <span>Hesabdan Çıx</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              className="web-btn-login-pill" 
              onClick={() => navigate('/login')}
              type="button"
            >
              <User size={16} />
              <span>Daxil ol</span>
            </button>
          )}

          {/* Mobile hamburger button */}
          <button 
            className="web-mobile-toggle-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menyu"
            type="button"
          >
            <Menu size={22} />
          </button>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="web-mobile-drawer">
          <NavLink to="/domestic" onClick={() => setMobileOpen(false)}>Daxili Turlar</NavLink>
          <NavLink to="/foreign" onClick={() => setMobileOpen(false)}>Xarici Turlar</NavLink>
          <NavLink to="/campaigns" onClick={() => setMobileOpen(false)}>Kampaniyalar</NavLink>
          <NavLink to="/account/loyalty" onClick={() => setMobileOpen(false)}>Səyahət Xalları (1,420 Xal)</NavLink>
          <a href="http://localhost:5174" target="_blank" rel="noreferrer">Tərəfdaşlıq (B2B)</a>
          {!isAuthenticated && (
            <button 
              className="web-btn-login-pill" 
              style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
              onClick={() => { setMobileOpen(false); navigate('/login'); }}
            >
              Daxil ol / Qeydiyyat
            </button>
          )}
        </div>
      )}
    </header>
  );
};
