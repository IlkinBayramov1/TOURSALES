import React, { useEffect, useState } from 'react';
import { Button, Badge } from '@toursales/ui';
import { vendorProfileApi } from '../../vendorProfileApi';
import { Company } from '@toursales/types';
import './VendorProfilePage.css';

export const VendorProfilePage: React.FC = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await vendorProfileApi.getMyCompany();
        setCompany(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    try {
      setSaving(true);
      setMessage(null);
      await vendorProfileApi.updateCompany(company);
      setMessage('Məlumatlar uğurla yadda saxlanıldı!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage('Məlumatlar yenilənərkən xəta baş verdi');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !company) {
    return <div style={{ padding: '2rem' }}>Yüklənir...</div>;
  }

  return (
    <div className="vendor-profile-page">
      <div className="profile-header">
        <h1>Şirkət Profili & Rekvizitlər</h1>
        <p>Turizm agentliyinizin rəsmi məlumatlarını, bank rekvizitlərini və əlaqə vasitələrini yeniləyin</p>
      </div>

      {message && (
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: message.includes('xəta') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          color: message.includes('xəta') ? 'var(--color-error)' : 'var(--color-success)',
          fontWeight: 600
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 className="profile-section-title" style={{ margin: 0, border: 'none' }}>Əsas Şirkət Məlumatları</h3>
          <Badge variant={company.status === 'ACTIVE' ? 'success' : 'warning'}>
            Status: {company.status}
          </Badge>
        </div>

        <div className="profile-grid-2">
          <div className="profile-form-group">
            <label>Şirkətin Rəsmi Adı</label>
            <input
              type="text"
              value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
              required
            />
          </div>

          <div className="profile-form-group">
            <label>VÖEN (Vergi Ödəyicisinin Eyniləşdirmə Nömrəsi)</label>
            <input
              type="text"
              value={company.voen}
              disabled
              title="VÖEN dəyişdirilə bilməz"
            />
          </div>
        </div>

        <div className="profile-grid-2">
          <div className="profile-form-group">
            <label>Əlaqə E-poçtu</label>
            <input
              type="email"
              value={company.email}
              onChange={(e) => setCompany({ ...company, email: e.target.value })}
              required
            />
          </div>

          <div className="profile-form-group">
            <label>Əlaqə Telefonu</label>
            <input
              type="tel"
              value={company.phone}
              onChange={(e) => setCompany({ ...company, phone: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="profile-form-group">
          <label>Faktiki Ünvan</label>
          <input
            type="text"
            value={company.address || ''}
            onChange={(e) => setCompany({ ...company, address: e.target.value })}
          />
        </div>

        <h3 className="profile-section-title" style={{ marginTop: '2rem' }}>Bank Hesablaşma Rekvizitləri</h3>

        <div className="profile-grid-2">
          <div className="profile-form-group">
            <label>Xidmət Göstərən Bank</label>
            <input
              type="text"
              value={company.bankName || ''}
              onChange={(e) => setCompany({ ...company, bankName: e.target.value })}
            />
          </div>

          <div className="profile-form-group">
            <label>Bank Hesabı (IBAN)</label>
            <input
              type="text"
              value={company.bankIban || ''}
              onChange={(e) => setCompany({ ...company, bankIban: e.target.value })}
            />
          </div>
        </div>

        <div className="profile-actions">
          <Button variant="primary" type="submit" isLoading={saving}>
            Dəyişiklikləri Yadda Saxla
          </Button>
        </div>
      </form>
    </div>
  );
};
