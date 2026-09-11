import React, { useState } from 'react';
import { Button, Badge } from '@toursales/ui';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Mail } from 'lucide-react';
import { useAdminAuth } from '../../../../shared/context/AdminAuthContext';
import './AdminLoginPage.css';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('admin@toursales.az');
  const [password, setPassword] = useState('admin123');
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
      setError(err?.message || 'E-poçt və ya şifrə yanlışdır');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-brand">
            <ShieldAlert size={26} color="var(--color-primary)" />
            <span>TOURSALES</span>
          </div>
          <h1 className="admin-login-title">SuperAdmin Girişi</h1>
          <p className="admin-login-subtitle">Platforma mərkəzi idarəetmə sisteminə daxil olun</p>
        </div>

        {error && <div className="admin-login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-login-field">
            <label>Administrator E-poçtu</label>
            <input
              type="email"
              placeholder="admin@toursales.az"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="admin-login-field">
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
            Sistemə Daxil Ol
          </Button>
        </form>

        <div className="admin-credentials-hint">
          Demo Giriş: <strong>admin@toursales.az</strong> / <strong>admin123</strong>
        </div>
      </div>
    </div>
  );
};
