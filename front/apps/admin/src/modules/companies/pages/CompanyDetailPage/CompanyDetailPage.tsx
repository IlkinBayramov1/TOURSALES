import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Badge, Spinner } from '@toursales/ui';
import { ArrowLeft, Building2, ShieldAlert, Percent } from 'lucide-react';
import { companiesApi } from '../../companiesApi';
import { CompanyVerificationModal } from '../../components/CompanyVerificationModal/CompanyVerificationModal';
import { CommissionConfigModal } from '../../components/CommissionConfigModal/CommissionConfigModal';
import { Company } from '@toursales/types';
import './CompanyDetailPage.css';

export const CompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isCommOpen, setIsCommOpen] = useState(false);

  const loadCompany = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await companiesApi.getCompanyById(id);
      setCompany(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompany();
  }, [id]);

  if (loading || !company) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="company-detail-page">
      <div className="detail-header">
        <div className="detail-title-wrap">
          <Link to="/companies" className="back-btn">
            <ArrowLeft size={16} />
            <span>Geri</span>
          </Link>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>{company.name}</h1>
          <Badge variant={company.status === 'ACTIVE' ? 'success' : 'warning'}>
            {company.status}
          </Badge>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={() => setIsCommOpen(true)}>
            <Percent size={15} />
            <span>Komissiya: {company.commissionRate}%</span>
          </Button>

          <Button variant="primary" onClick={() => setIsVerifyOpen(true)}>
            <ShieldAlert size={15} />
            <span>Statusu Dəyiş</span>
          </Button>
        </div>
      </div>

      <div className="detail-card">
        <h3>Hüquqi & Əlaqə Məlumatları</h3>
        <div className="info-grid">
          <div className="info-group">
            <label>VÖEN</label>
            <div className="value">{company.voen}</div>
          </div>
          <div className="info-group">
            <label>Rəsmi E-poçt</label>
            <div className="value">{company.email}</div>
          </div>
          <div className="info-group">
            <label>Əlaqə Telefonu</label>
            <div className="value">{company.phone}</div>
          </div>
          <div className="info-group">
            <label>Faktiki Hüquqi Ünvan</label>
            <div className="value">{company.address || 'Qeyd edilməyib'}</div>
          </div>
          <div className="info-group">
            <label>Qeydiyyat Tarixi</label>
            <div className="value">{new Date(company.createdAt).toLocaleDateString('az-AZ')}</div>
          </div>
        </div>
      </div>

      <div className="detail-card">
        <h3>Bank & Hesablaşma Rekvizitləri</h3>
        <div className="info-grid">
          <div className="info-group">
            <label>Xidmət Göstərən Bank</label>
            <div className="value">{company.bankName || 'Qeyd edilməyib'}</div>
          </div>
          <div className="info-group">
            <label>Bank Hesabı (IBAN)</label>
            <div className="value" style={{ fontFamily: 'monospace' }}>
              {company.bankIban || 'Qeyd edilməyib'}
            </div>
          </div>
          <div className="info-group">
            <label>Xüsusi Komissiya Razılaşması</label>
            <div className="value">{company.commissionRate}%</div>
          </div>
        </div>
      </div>

      {company.rejectionReason && (
        <div className="detail-card" style={{ borderLeft: '4px solid var(--color-error)' }}>
          <h3>Son Bildiriş / İmtina Səbəbi</h3>
          <p style={{ color: 'var(--color-error)', margin: 0 }}>
            {company.rejectionReason}
          </p>
        </div>
      )}

      <CompanyVerificationModal
        company={company}
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        onSuccess={loadCompany}
      />

      <CommissionConfigModal
        company={company}
        isOpen={isCommOpen}
        onClose={() => setIsCommOpen(false)}
        onSuccess={loadCompany}
      />
    </div>
  );
};
