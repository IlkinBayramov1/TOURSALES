import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { useNavigate, Link } from 'react-router-dom';
import { useVendorAuth } from '../../../../shared/context/VendorAuthContext';
import './RegisterPage.css';
import '../LoginPage/LoginPage.css';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useVendorAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
    voen: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Qeydiyyat zamanı xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vendor-auth-container">
      <div className="vendor-register-card">
        <div className="vendor-auth-header">
          <div className="vendor-auth-brand">
            <span>🏢</span> TOURSALES Vendor
          </div>
          <h1 className="vendor-auth-title">Agentlik Qeydiyyatı</h1>
          <p className="vendor-auth-subtitle">Platformaya qoşulun və biletlərinizi minlərlə müştəriyə satın</p>
        </div>

        {error && <div className="vendor-auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="vendor-auth-form">
          <div className="vendor-grid-2">
            <div className="vendor-auth-field">
              <label>Agentlik / Şirkət Adı</label>
              <input
                type="text"
                placeholder="Məs: Caspian Travel MMC"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </div>
            <div className="vendor-auth-field">
              <label>VÖEN</label>
              <input
                type="text"
                placeholder="10 rəqəmli VÖEN"
                value={formData.voen}
                onChange={(e) => setFormData({ ...formData, voen: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="vendor-grid-2">
            <div className="vendor-auth-field">
              <label>Məsul Şəxs (Ad və Soyad)</label>
              <input
                type="text"
                placeholder="Adınız və Soyadınız"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="vendor-auth-field">
              <label>Əlaqə Telefonu</label>
              <input
                type="tel"
                placeholder="+994 50 123 45 67"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="vendor-grid-2">
            <div className="vendor-auth-field">
              <label>E-poçt Ünvanı</label>
              <input
                type="email"
                placeholder="info@caspiantravel.az"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="vendor-auth-field">
              <label>Şifrə</label>
              <input
                type="password"
                placeholder="Minimum 8 simvol"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </div>

          <Button variant="primary" size="lg" type="submit" isLoading={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            Qeydiyyatdan Keç
          </Button>
        </form>

        <div className="vendor-auth-footer">
          Artıq hesabınız var?{' '}
          <Link to="/login">Daxil Olun</Link>
        </div>
      </div>
    </div>
  );
};
