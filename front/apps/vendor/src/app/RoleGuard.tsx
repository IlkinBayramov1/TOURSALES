import React from 'react';
import { useVendorAuth, AgencyRole } from '../shared/context/VendorAuthContext';
import { ShieldAlert, RotateCcw, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './RoleGuard.css';

interface RoleGuardProps {
  allowedRoles: AgencyRole[];
  children?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { activeAgencyRole, simulationRole, setSimulationRole } = useVendorAuth();
  const navigate = useNavigate();

  const isAllowed = allowedRoles.includes(activeAgencyRole);

  if (isAllowed) {
    return <>{children}</>;
  }

  const getRoleLabel = (role: AgencyRole) => {
    switch (role) {
      case 'OWNER': return '👑 Şirkət Rəhbəri';
      case 'MANAGER': return '🛡️ Menecer';
      case 'ACCOUNTANT': return '📊 Mühasib';
      case 'GUIDE': return '📱 Bələdçi';
      default: return role;
    }
  };

  const getFallbackRoute = () => {
    if (activeAgencyRole === 'GUIDE') return '/guide';
    return '/';
  };

  return (
    <div className="role-guard-denied-container">
      <div className="role-guard-denied-card">
        <div className="role-guard-icon-box">
          <ShieldAlert size={48} />
        </div>

        <div className="role-guard-badge">
          <span>403 FORBIDDEN • RBAC QORUYUCUSU</span>
        </div>

        <h2>Bu Modula Giriş Məhdudlaşdırılıb</h2>
        <p className="role-guard-desc">
          Hazırda aktiv olan <strong>{getRoleLabel(activeAgencyRole)}</strong> rolunun bu səhifəyə və modula baxmaq və ya əməliyyat aparmaq səlahiyyəti yoxdur.
        </p>

        <div className="role-guard-details">
          <div className="role-guard-detail-row">
            <span>Aktiv Rol:</span>
            <strong>{getRoleLabel(activeAgencyRole)}</strong>
          </div>
          <div className="role-guard-detail-row">
            <span>Tələb olunan Rollar:</span>
            <strong>{allowedRoles.map(getRoleLabel).join(', ')}</strong>
          </div>
        </div>

        <div className="role-guard-actions">
          {simulationRole ? (
            <button
              type="button"
              className="role-guard-btn primary"
              onClick={() => setSimulationRole(null)}
            >
              <RotateCcw size={16} />
              <span>Simulyasiyanı Dayandır (Rəhbər Rejimi)</span>
            </button>
          ) : (
            <button
              type="button"
              className="role-guard-btn primary"
              onClick={() => navigate(getFallbackRoute())}
            >
              <Home size={16} />
              <span>İcazəli Əsas Səhifəyə Qayıt</span>
            </button>
          )}

          <button
            type="button"
            className="role-guard-btn secondary"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
            <span>Əvvəlki Səhifə</span>
          </button>
        </div>
      </div>
    </div>
  );
};
