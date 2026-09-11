import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RegisterCard } from './components/RegisterCard/RegisterCard';
import { RegisterForm } from '../../components/RegisterForm/RegisterForm';
import { useAuthActions } from '../../hooks/useAuthActions';
import { RegisterPayload } from '@toursales/types';
import './RegisterPage.css';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { handleRegister, loading } = useAuthActions();

  const onRegisterSubmit = async (payload: RegisterPayload) => {
    await handleRegister(payload);
    if (payload.role === 'VENDOR') {
      navigate('/login');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="register-page-container">
      <RegisterCard>
        <div className="register-header">
          <h2 className="register-title">Yeni Hesab Yarat</h2>
          <p className="register-subtitle">
            Azərbaycanın ən böyük səyahət platformasına qoşulun
          </p>
        </div>

        <RegisterForm onSubmit={onRegisterSubmit} isLoading={loading} />

        <div className="register-footer-text">
          <span>Artıq hesabınız var? </span>
          <Link to="/login" className="register-link">
            Daxil olun
          </Link>
        </div>
      </RegisterCard>
    </div>
  );
};
