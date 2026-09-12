import React, { useEffect, useState } from 'react';
import { Button, Badge } from '@toursales/ui';
import { DataTable } from '@/shared/components';
import { AgencyMember, TeamKpis, teamApi } from '../../teamApi';
import { TeamKpiCards } from '../../components/TeamKpiCards/TeamKpiCards';
import { RolePermissionsMatrix } from '../../components/RolePermissionsMatrix/RolePermissionsMatrix';
import { TeamActivityLogTable } from '../../components/TeamActivityLogTable/TeamActivityLogTable';
import { InviteMemberModal } from '../../components/InviteMemberModal/InviteMemberModal';
import { EditMemberModal } from '../../components/EditMemberModal/EditMemberModal';
import { 
  Users, 
  ShieldCheck, 
  History, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Eye, 
  Sparkles,
  Phone,
  Mail,
  CheckCircle2
} from 'lucide-react';
import './TeamPage.css';

export const TeamPage: React.FC = () => {
  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [kpis, setKpis] = useState<TeamKpis>({ total: 0, managers: 0, accountants: 0, guides: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'MATRIX' | 'AUDIT'>('MEMBERS');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modals state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<AgencyMember | null>(null);
  const [simulationRole, setSimulationRole] = useState<string>('OWNER');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await teamApi.getMembers();
      setMembers(res.members || []);
      setKpis(res.kpis || { total: 0, managers: 0, accountants: 0, guides: 0 });
    } catch (err) {
      console.error('Komanda məlumatları yüklənmədi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemove = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" adlı əməkdaşı komandadan silmək istədiyinizə əminsiniz?`)) return;
    try {
      await teamApi.removeMember(id);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.msg || 'Əməkdaş silinərkən xəta baş verdi.');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'OWNER': return 'primary';
      case 'MANAGER': return 'info';
      case 'ACCOUNTANT': return 'gold';
      case 'GUIDE': return 'success';
      default: return 'neutral';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'OWNER': return '👑 Şirkət Rəhbəri';
      case 'MANAGER': return '🛡️ Menecer';
      case 'ACCOUNTANT': return '📊 Mühasib';
      case 'GUIDE': return '📱 Bələdçi';
      default: return role;
    }
  };

  const filteredMembers = members.filter((m) => {
    if (roleFilter === 'ALL') return true;
    return m.role === roleFilter;
  });

  return (
    <div className="team-page">
      {/* Header */}
      <div className="team-header">
        <div>
          <div className="team-header-badge">
            <Sparkles size={14} />
            <span>Heyət və İcazələr İdarəetməsi</span>
          </div>
          <h1>Komanda & Giriş İcazələri (RBAC)</h1>
          <p>
            Şirkətinizin əməkdaşlarını, onların rol və səlahiyyətlərini təyin edin, fəaliyyət jurnalını izləyin
          </p>
        </div>

        <div className="team-header-actions">
          {/* Role Simulation Switcher */}
          <div className="team-simulation-box" title="Portalı seçilmiş rolun gözü ilə test edin">
            <Eye size={15} />
            <span>Görünüş:</span>
            <select
              value={simulationRole}
              onChange={(e) => setSimulationRole(e.target.value)}
              className="team-simulation-select"
            >
              <option value="OWNER">👑 Rəhbər (Tam Menyu)</option>
              <option value="MANAGER">🛡️ Menecer Rejimi</option>
              <option value="ACCOUNTANT">📊 Mühasib Rejimi</option>
              <option value="GUIDE">📱 Bələdçi Rejimi</option>
            </select>
          </div>

          <Button variant="primary" onClick={() => setIsInviteOpen(true)}>
            <UserPlus size={16} />
            <span>+ Yeni Əməkdaş Əlavə Et</span>
          </Button>
        </div>
      </div>

      {/* 4 Dynamic KPI Cards */}
      <TeamKpiCards kpis={kpis} />

      {/* Navigation Tabs */}
      <div className="team-tabs-container">
        <div className="team-tabs">
          <button
            type="button"
            className={`team-tab-btn ${activeTab === 'MEMBERS' ? 'active' : ''}`}
            onClick={() => setActiveTab('MEMBERS')}
          >
            <Users size={16} />
            <span>Əməkdaşlar Siyahısı ({members.length})</span>
          </button>
          <button
            type="button"
            className={`team-tab-btn ${activeTab === 'MATRIX' ? 'active' : ''}`}
            onClick={() => setActiveTab('MATRIX')}
          >
            <ShieldCheck size={16} />
            <span>Rollar & İcazələr Matrisi</span>
          </button>
          <button
            type="button"
            className={`team-tab-btn ${activeTab === 'AUDIT' ? 'active' : ''}`}
            onClick={() => setActiveTab('AUDIT')}
          >
            <History size={16} />
            <span>Fəaliyyət Jurnalı (Audit Log)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Members Directory */}
      {activeTab === 'MEMBERS' && (
        <div className="team-tab-content">
          <div className="team-table-card">
            <div className="team-table-header-row">
              <div>
                <h3>Şirkət Əməkdaşları</h3>
                <p>Giriş hüququ olan aktiv işçilər və onların məsuliyyət sahələri</p>
              </div>

              {/* Role Filters */}
              <div className="team-filter-pills">
                <button
                  type="button"
                  className={`team-pill ${roleFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setRoleFilter('ALL')}
                >
                  Hamısı ({members.length})
                </button>
                <button
                  type="button"
                  className={`team-pill ${roleFilter === 'MANAGER' ? 'active' : ''}`}
                  onClick={() => setRoleFilter('MANAGER')}
                >
                  Menecerlər ({kpis.managers})
                </button>
                <button
                  type="button"
                  className={`team-pill ${roleFilter === 'ACCOUNTANT' ? 'active' : ''}`}
                  onClick={() => setRoleFilter('ACCOUNTANT')}
                >
                  Mühasiblər ({kpis.accountants})
                </button>
                <button
                  type="button"
                  className={`team-pill ${roleFilter === 'GUIDE' ? 'active' : ''}`}
                  onClick={() => setRoleFilter('GUIDE')}
                >
                  Bələdçilər ({kpis.guides})
                </button>
              </div>
            </div>

            <DataTable<AgencyMember>
              data={filteredMembers}
              isLoading={loading}
              columns={[
                {
                  header: 'Əməkdaş',
                  render: (m: AgencyMember) => {
                    const initials = m.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    return (
                      <div className="member-avatar-cell">
                        <div className={`member-avatar ${m.role.toLowerCase()}`}>
                          {initials}
                        </div>
                        <div>
                          <div className="member-name">{m.name}</div>
                          <div className="member-email flex items-center gap-1">
                            <Mail size={12} />
                            <span>{m.email}</span>
                          </div>
                        </div>
                      </div>
                    );
                  },
                },
                {
                  header: 'Əlaqə Telefonu',
                  render: (m: AgencyMember) => (
                    <div className="member-phone-cell">
                      <Phone size={13} className="text-secondary" />
                      <span>{m.phoneNumber || '—'}</span>
                    </div>
                  ),
                },
                {
                  header: 'Sistem Rolu',
                  render: (m: AgencyMember) => (
                    <Badge variant={getRoleBadgeVariant(m.role)} pill>
                      {getRoleLabel(m.role)}
                    </Badge>
                  ),
                },
                {
                  header: 'Status',
                  render: (m: AgencyMember) => (
                    <Badge variant={m.status === 'Active' ? 'success' : 'error'} pill>
                      {m.status === 'Active' ? 'Aktiv' : 'Dondurulub'}
                    </Badge>
                  ),
                },
                {
                  header: 'Son Giriş',
                  render: (m: AgencyMember) => (
                    <span className="text-secondary text-sm">
                      {m.lastLoginAt
                        ? new Date(m.lastLoginAt).toLocaleDateString('az-AZ', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Daxil olmayıb'}
                    </span>
                  ),
                },
                {
                  header: 'Əməliyyatlar',
                  render: (m: AgencyMember) => (
                    <div className="member-actions-row">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingMember(m)}
                      >
                        <Edit2 size={13} />
                        <span>Dəyiş</span>
                      </Button>
                      {m.role !== 'OWNER' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          style={{ color: '#ef4444' }}
                          onClick={() => handleRemove(m.id, m.name)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
              emptyMessage="Bu filtr üzrə əməkdaş tapılmadı."
            />
          </div>
        </div>
      )}

      {/* TAB 2: Roles Matrix */}
      {activeTab === 'MATRIX' && (
        <div className="team-tab-content">
          <RolePermissionsMatrix />
        </div>
      )}

      {/* TAB 3: Audit Logs */}
      {activeTab === 'AUDIT' && (
        <div className="team-tab-content">
          <TeamActivityLogTable />
        </div>
      )}

      {/* Modals */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={loadData}
      />

      <EditMemberModal
        isOpen={!!editingMember}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onSuccess={loadData}
      />
    </div>
  );
};
