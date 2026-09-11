import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { Button, Input } from '@toursales/ui';
import { LoginPayload } from '@toursales/types';
import './LoginForm.css';

interface LoginFormProps {
  onSubmit: (payload: LoginPayload) => void;
  isLoading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Zəhmət olmasa email və şifrəni daxil edin');
      return;
    }
    setError('');
    onSubmit({ email, password });
  };

  return (
    <form className="auth-login-form" onSubmit={handleSubmit}>
      {error && <div className="auth-form-error">{error}</div>}

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
        Daxil ol
      </Button>
    </form>
  );
};
