import React from 'react';
import { useVendorAuth, AgencyRole } from '../../context/VendorAuthContext';
import { Eye, ShieldAlert, XCircle, RotateCcw } from 'lucide-react';
import './SimulationBanner.css';

export const SimulationBanner: React.FC = () => {
  const { simulationRole, setSimulationRole } = useVendorAuth();

  if (!simulationRole) return null;

  const getRoleLabel = (role: AgencyRole) => {
    switch (role) {
      case 'OWNER': return '👑 Şirkət Rəhbəri';
      case 'MANAGER': return '🛡️ Menecer';
      case 'ACCOUNTANT': return '📊 Mühasib';
      case 'GUIDE': return '📱 Bələdçi';
      default: return role;
    }
  };

  return (
    <div className="simulation-top-banner">
      <div className="simulation-banner-inner">
        <div className="simulation-banner-info">
          <div className="simulation-pulse-indicator">
            <span className="simulation-pulse-dot" />
            <Eye size={16} />
          </div>
          <div className="simulation-banner-texts">
            <div className="simulation-banner-title">
              <strong>Canlı Rol Simulyasiyası Aktivdir:</strong>
              <span className="simulation-role-highlight">{getRoleLabel(simulationRole)}</span>
            </div>
            <p className="simulation-banner-desc">
              Yan menyu, səhifələr və əməliyyat hüquqları bu rola uyğun məhdudlaşdırılıb. Digər səlahiyyətlər gizlədilib.
            </p>
          </div>
        </div>

        <div className="simulation-banner-actions">
          {/* Quick switch within banner */}
          <div className="simulation-switcher-inline">
            <label htmlFor="sim-role-select">Rolu Dəyiş:</label>
            <select
              id="sim-role-select"
              value={simulationRole}
              onChange={(e) => setSimulationRole(e.target.value as AgencyRole)}
              className="simulation-select-dropdown"
            >
              <option value="MANAGER">🛡️ Menecer</option>
              <option value="ACCOUNTANT">📊 Mühasib</option>
              <option value="GUIDE">📱 Bələdçi</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setSimulationRole(null)}
            className="simulation-exit-btn"
            title="Real Şirkət Rəhbəri rejiminə qayıt"
          >
            <RotateCcw size={14} />
            <span>Simulyasiyanı Dayandır (Rəhbər)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
