import React, { useEffect, useState } from 'react';
import { RolePermissionRow, teamApi } from '../../teamApi';
import { ShieldCheck, Check, Minus } from 'lucide-react';
import './RolePermissionsMatrix.css';

export const RolePermissionsMatrix: React.FC = () => {
  const [matrix, setMatrix] = useState<RolePermissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatrix = async () => {
      try {
        setLoading(true);
        const data = await teamApi.getRolesMatrix();
        setMatrix(data);
      } catch (err) {
        console.error('İcazələr matrisi yüklənmədi:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatrix();
  }, []);

  return (
    <div className="permissions-matrix-card">
      <div className="permissions-matrix-header">
        <div className="permissions-header-icon">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h3>Rollar və İcazələr Matrisi (RBAC)</h3>
          <p>
            Platformadakı hər bir rolun (Rəhbər, Menecer, Mühasib, Bələdçi) sistem modulları üzrə icazə və məhdudiyyətləri
          </p>
        </div>
      </div>

      <div className="permissions-table-wrap">
        <table className="permissions-table">
          <thead>
            <tr>
              <th className="col-mod">Sistem Modulu</th>
              <th className="col-role owner">Rəhbər (OWNER)</th>
              <th className="col-role manager">Menecer (MANAGER)</th>
              <th className="col-role accountant">Mühasib (ACCOUNTANT)</th>
              <th className="col-role guide">Bələdçi (GUIDE)</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, idx) => (
              <tr key={idx}>
                <td className="col-mod">
                  <div className="matrix-module-name">{row.module}</div>
                  <div className="matrix-module-desc">{row.description}</div>
                </td>
                <td className="col-role owner">
                  <span className="matrix-perm-tag full">{row.owner}</span>
                </td>
                <td className="col-role manager">
                  <span className={`matrix-perm-tag ${row.manager.includes('Tam') || row.manager.includes('Bəli') ? 'high' : row.manager.includes('Yoxdur') ? 'none' : 'mid'}`}>
                    {row.manager}
                  </span>
                </td>
                <td className="col-role accountant">
                  <span className={`matrix-perm-tag ${row.accountant.includes('Tam') ? 'high' : row.accountant.includes('Yoxdur') ? 'none' : 'mid'}`}>
                    {row.accountant}
                  </span>
                </td>
                <td className="col-role guide">
                  <span className={`matrix-perm-tag ${row.guide.includes('Əsas') || row.guide.includes('Bəli') ? 'high' : row.guide.includes('Yoxdur') ? 'none' : 'mid'}`}>
                    {row.guide}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
