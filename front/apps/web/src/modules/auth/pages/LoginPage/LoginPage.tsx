import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LoginCard } from './components/LoginCard/LoginCard';
import { LoginForm } from '../../components/LoginForm/LoginForm';
import { SocialAuthButtons } from './components/SocialAuthButtons/SocialAuthButtons';
import { Verify2FAModal } from '../../components/Verify2FAModal/Verify2FAModal';
import { useAuthActions } from '../../hooks/useAuthActions';
import { LoginPayload } from '@toursales/types';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const { handleLogin, handleVerify2FA, loading } = useAuthActions();
  const [show2FA, setShow2FA] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const onLoginSubmit = async (payload: LoginPayload) => {
    const result = await handleLogin(payload);
    if (result?.requires2FA && result.userId) {
      setPendingUserId(result.userId);
      setShow2FA(true);
    } else {
      navigate(from, { replace: true });
    }
  };

  const onVerify2FASubmit = async (code: string) => {
    if (pendingUserId) {
      await handleVerify2FA(pendingUserId, code);
      setShow2FA(false);
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="login-page-container">
      <LoginCard>
        <div className="login-header">
          <h2 className="login-title">Xoş Gəlmisiniz</h2>
          <p className="login-subtitle">
            Turları sifariş etmək və rezervasiyalarınızı idarə etmək üçün daxil olun
          </p>
        </div>

        <LoginForm onSubmit={onLoginSubmit} isLoading={loading} />

        <SocialAuthButtons />

        <div className="login-footer-text">
          <span>Hesabınız yoxdur? </span>
          <Link to="/register" className="login-link">
            Qeydiyyatdan keçin
          </Link>
        </div>
      </LoginCard>

      <Verify2FAModal
        isOpen={show2FA}
        onClose={() => setShow2FA(false)}
        onVerify={onVerify2FASubmit}
        isLoading={loading}
      />
    </div>
  );
};
