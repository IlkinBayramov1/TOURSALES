import React from 'react';
import { Search, QrCode, Bell, Plus } from 'lucide-react';
import { Button } from '@toursales/ui';
import { useVendorAuth } from '../../context/VendorAuthContext';
import { useNavigate } from 'react-router-dom';
import './VendorHeader.css';

interface VendorHeaderProps {
  onOpenScanner?: () => void;
}

export const VendorHeader: React.FC<VendorHeaderProps> = ({ onOpenScanner }) => {
  const { user, company } = useVendorAuth();
  const navigate = useNavigate();

  return (
    <header className="vendor-header">
      <div className="vendor-header-search">
        <Search size={16} className="vendor-search-icon" />
        <input
          type="text"
          placeholder="Tur, rezervasiya, sərnişin və ya əməliyyat axtar... (Cmd + K)"
          className="vendor-search-input"
        />
        <kbd className="vendor-search-kbd">⌘K</kbd>
      </div>

      <div className="vendor-header-right">
        {/* Quick Tour Create CTA */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/tours/create')}
          className="vendor-quick-create-btn"
        >
          <Plus size={16} />
          <span>Yeni Tur</span>
        </Button>

        {/* Quick QR Check-in scanner trigger */}
        {onOpenScanner && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenScanner}
            className="vendor-quick-scan-btn"
          >
            <QrCode size={16} />
            <span>QR Skaner / Minik</span>
          </Button>
        )}

        {/* Notification Bell */}
        <button type="button" className="vendor-header-icon-btn" title="Bildirişlər">
          <Bell size={18} />
          <span className="vendor-notification-dot" />
        </button>

        <div className="vendor-header-divider" />

        {/* User avatar & name */}
        <div className="vendor-header-user" onClick={() => navigate('/profile')}>
          <div className="vendor-user-avatar">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'VN'}
          </div>
          <div className="vendor-user-meta">
            <span className="vendor-user-name">{user?.name || company?.name || 'İlkin bayramov'}</span>
            <span className="vendor-user-role">Tərəfdaş (Vendor)</span>
          </div>
        </div>
      </div>
    </header>
  );
};
