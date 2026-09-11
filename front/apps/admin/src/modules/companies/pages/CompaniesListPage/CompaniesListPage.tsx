import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '@toursales/ui';
import { Building2, CheckCircle2, ShieldAlert, Percent, Eye } from 'lucide-react';
import { DataTable } from '../../../../shared/components/DataTable/DataTable';
import { CompanyVerificationModal } from '../../components/CompanyVerificationModal/CompanyVerificationModal';
import { CommissionConfigModal } from '../../components/CommissionConfigModal/CommissionConfigModal';
import { companiesApi } from '../../companiesApi';
import { Company, CompanyStatus } from '@toursales/types';
import './CompaniesListPage.css';

export const CompaniesListPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const [selectedVerifyComp, setSelectedVerifyComp] = useState<Company | null>(null);
  const [selectedCommComp, setSelectedCommComp] = useState<Company | null>(null);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companiesApi.getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const filteredCompanies = filterStatus === 'ALL'
    ? companies
    : companies.filter((c) => c.status === filterStatus);

  const getStatusBadgeVariant = (status: CompanyStatus) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'SUSPENDED': return 'error';
      case 'REJECTED': return 'neutral';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: CompanyStatus) => {
    switch (status) {
      case 'ACTIVE': return 'Aktiv (Təsdiqlənmiş)';
      case 'PENDING': return 'Gözləmədə (Yeni)';
      case 'SUSPENDED': return 'Dayandırılmış';
      case 'REJECTED': return 'İmtina Edilmiş';
      default: return status;
    }
  };

  return (
    <div className="companies-list-page">
      <div className="companies-header">
        <div>
          <h1>Turizm Agentliklərinin Reyestri</h1>
          <p>Bütün tərəfdaş şirkətlərin lisenziyaları, komissiya dərəcələri və hüquqi statusları</p>
        </div>

        <div className="companies-filter-tabs">
          {['ALL', 'PENDING', 'ACTIVE', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              type="button"
              className={`filter-tab-btn ${filterStatus === st ? 'active' : ''}`}
              onClick={() => setFilterStatus(st)}
            >
              {st === 'ALL' ? 'Hamısı' : st === 'PENDING' ? 'Gözləyənlər' : st === 'ACTIVE' ? 'Aktiv' : 'Dayandırılmış'}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        data={filteredCompanies}
        searchPlaceholder="Agentlik adı və ya VÖEN ilə axtarın..."
        searchField={(c: Company) => `${c.name} ${c.voen} ${c.email}`}
        columns={[
          {
            header: 'Şirkət & VÖEN',
            accessor: (c: Company) => (
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{c.name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>VÖEN: {c.voen}</div>
              </div>
            )
          },
          {
            header: 'Əlaqə Məlumatları',
            accessor: (c: Company) => (
              <div>
                <div>{c.email}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{c.phone}</div>
              </div>
            )
          },
          {
            header: 'Status',
            accessor: (c: Company) => (
              <Badge variant={getStatusBadgeVariant(c.status)}>
                {getStatusLabel(c.status)}
              </Badge>
            )
          },
          {
            header: 'Komissiya',
            accessor: (c: Company) => (
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                {c.commissionRate}%
              </span>
            )
          },
          {
            header: 'Əməliyyatlar',
            accessor: (c: Company) => (
              <div className="actions-cell">
                <Link to={`/companies/${c.id}`}>
                  <Button variant="ghost" size="sm" title="Detallı Baxış">
                    <Eye size={15} />
                  </Button>
                </Link>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedVerifyComp(c)}
                  title="Status / Təsdiq"
                >
                  <ShieldAlert size={15} />
                  <span>Status</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCommComp(c)}
                  title="Komissiya Tənzimlə"
                >
                  <Percent size={15} />
                </Button>
              </div>
            )
          }
        ]}
      />

      <CompanyVerificationModal
        company={selectedVerifyComp}
        isOpen={!!selectedVerifyComp}
        onClose={() => setSelectedVerifyComp(null)}
        onSuccess={loadCompanies}
      />

      <CommissionConfigModal
        company={selectedCommComp}
        isOpen={!!selectedCommComp}
        onClose={() => setSelectedCommComp(null)}
        onSuccess={loadCompanies}
      />
    </div>
  );
};
