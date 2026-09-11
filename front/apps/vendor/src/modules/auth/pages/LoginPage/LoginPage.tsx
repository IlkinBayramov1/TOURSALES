import React, { useState } from 'react';
import { Button } from '@toursales/ui';
import { useNavigate, Link } from 'react-router-dom';
import { useVendorAuth } from '../../../../shared/context/VendorAuthContext';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useVendorAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError(null);
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'E-poçt və ya şifrə yanlışdır');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vendor-auth-container">
      <div className="vendor-auth-card">
        <div className="vendor-auth-header">
          <div className="vendor-auth-brand">
            <span>🏢</span> TOURSALES Vendor
          </div>
          <h1 className="vendor-auth-title">Tərəfdaş Girişi</h1>
          <p className="vendor-auth-subtitle">Turizm agentliyi idarəetmə panelinə daxil olun</p>
        </div>

        {error && <div className="vendor-auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="vendor-auth-form">
          <div className="vendor-auth-field">
            <label>E-poçt Ünvanı</label>
            <input
              type="email"
              placeholder="agent@toursales.az"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="vendor-auth-field">
            <label>Şifrə</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button variant="primary" size="lg" type="submit" isLoading={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            Daxil Ol
          </Button>
        </form>

        <div className="vendor-auth-footer">
          Hələ tərəfdaş deyilsiniz?{' '}
          <Link to="/register">Agentlik Qeydiyyatı</Link>
        </div>
      </div>
    </div>
  );
};
