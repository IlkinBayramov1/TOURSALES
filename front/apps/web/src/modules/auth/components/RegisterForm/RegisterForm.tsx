import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Building } from 'lucide-react';
import { Button, Input } from '@toursales/ui';
import { RegisterPayload } from '@toursales/types';
import './RegisterForm.css';

interface RegisterFormProps {
  onSubmit: (payload: RegisterPayload) => void;
  isLoading: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, isLoading }) => {
  const [role, setRole] = useState<'CUSTOMER' | 'VENDOR'>('CUSTOMER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyVoen, setCompanyVoen] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Ad, email və şifrə sahələri mütləqdir');
      return;
    }
    if (role === 'VENDOR' && (!companyName || !companyVoen)) {
      setError('Tur şirkəti üçün şirkət adı və VÖEN mütləqdir');
      return;
    }
    setError('');
    onSubmit({
      name,
      email,
      phone,
      password,
      role,
      companyName: role === 'VENDOR' ? companyName : undefined,
      companyVoen: role === 'VENDOR' ? companyVoen : undefined,
    });
  };

  return (
    <form className="auth-register-form" onSubmit={handleSubmit}>
      {error && <div className="auth-form-error">{error}</div>}

      <div className="auth-role-tabs">
        <button
          type="button"
          className={`auth-role-tab ${role === 'CUSTOMER' ? 'active' : ''}`}
          onClick={() => setRole('CUSTOMER')}
        >
          Səyyah / Müştəri
        </button>
        <button
          type="button"
          className={`auth-role-tab ${role === 'VENDOR' ? 'active' : ''}`}
          onClick={() => setRole('VENDOR')}
        >
          Tur Şirkəti (Vendor)
        </button>
      </div>

      <Input
        label="Ad və Soyad"
        placeholder="Əli Məmmədov"
        value={name}
        onChange={(e) => setName(e.target.value)}
        leftIcon={<User size={18} />}
        required
      />

      <Input
        label="Email ünvanı"
        type="email"
        placeholder="ad@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={<Mail size={18} />}
        required
      />

      <Input
        label="Əlaqə nömrəsi"
        placeholder="+994 50 123 45 67"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        leftIcon={<Phone size={18} />}
      />

      {role === 'VENDOR' && (
        <>
          <Input
            label="Şirkət / Agentlik Adı"
            placeholder="Məs: Caspian Travel MMC"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            leftIcon={<Building size={18} />}
            required
          />
          <Input
            label="VÖEN (10 rəqəmli)"
            placeholder="1234567890"
            value={companyVoen}
            onChange={(e) => setCompanyVoen(e.target.value)}
            required
          />
        </>
      )}

      <Input
        label="Şifrə"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={<Lock size={18} />}
        required
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        style={{ width: '100%', marginTop: '0.5rem' }}
      >
        Qeydiyyatdan keç
      </Button>
    </form>
  );
};
