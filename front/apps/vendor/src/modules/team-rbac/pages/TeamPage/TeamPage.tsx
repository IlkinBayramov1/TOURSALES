import React, { useEffect, useState } from 'react';
import { Button, Badge } from '@toursales/ui';
import { DataTable } from '@/shared/components';
import { InviteMemberModal } from '../../components/InviteMemberModal/InviteMemberModal';
import { teamApi } from '../../teamApi';
import { AgencyMember } from '@toursales/types';
import './TeamPage.css';

export const TeamPage: React.FC = () => {
  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await teamApi.getMembers();
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleRemove = async (id: string) => {
    if (!window.confirm('Bu əməkdaşı komandadan silmək istədiyinizə əminsiniz?')) return;
    try {
      await teamApi.removeMember(id);
      loadMembers();
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'primary';
      case 'ACCOUNTANT': return 'gold';
      case 'GUIDE': return 'info';
      default: return 'neutral';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'Menecer';
      case 'ACCOUNTANT': return 'Mühasib';
      case 'GUIDE': return 'Bələdçi';
      default: return role;
    }
  };

  return (
    <div className="team-page">
      <div className="team-header">
        <div>
          <h1>Komanda & Giriş İcazələri (RBAC)</h1>
          <p>Şirkətinizin əməkdaşlarını və onların idarəetmə səlahiyyətlərini təyin edin</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + Yeni Əməkdaş Əlavə Et
        </Button>
      </div>

      <div className="role-info-card">
        <h3>İcazə Rollarının İzahı</h3>
        <div className="role-grid">
          <div className="role-item">
            <h4>🛡️ Menecer (MANAGER)</h4>
            <p>Bütün turları yaratmaq/redaktə etmək, sərnişinləri idarə etmək və komandaya yeni üzv dəvət etmək səlahiyyəti.</p>
          </div>
          <div className="role-item">
            <h4>📊 Mühasib (ACCOUNTANT)</h4>
            <p>Maliyyə balansını izləmək, bank çıxarışı sorğusu göndərmək və mühasibat uçotu ledger qeydlərini görmək hüququ.</p>
          </div>
          <div className="role-item">
            <h4>📱 Bələdçi (GUIDE)</h4>
            <p>Yalnız QR kod yoxlanışı, avtobus sərnişin siyahısına baxış və sərnişinlərin gəlişini qeyd etmək (Check-in) səlahiyyəti.</p>
          </div>
        </div>
      </div>

      <div className="team-table-card">
        <DataTable
          data={members}
          columns={[
            {
              header: 'Əməkdaş',
              accessor: (m: AgencyMember) => (
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{m.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{m.email}</div>
                </div>
              )
            },
            {
              header: 'Rol',
              accessor: (m: AgencyMember) => (
                <Badge variant={getRoleBadgeVariant(m.role)}>
                  {getRoleLabel(m.role)}
                </Badge>
              )
            },
            {
              header: 'Qoşulma Tarixi',
              accessor: (m: AgencyMember) => new Date(m.createdAt).toLocaleDateString('az-AZ')
            },
            {
              header: 'Əməliyyat',
              accessor: (m: AgencyMember) => (
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ color: 'var(--color-error)' }}
                  onClick={() => handleRemove(m.id)}
                >
                  Sil
                </Button>
              )
            }
          ]}
        />
      </div>

      <InviteMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadMembers}
      />
    </div>
  );
};
