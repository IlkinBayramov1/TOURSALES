import React from 'react';
import { Card } from '@toursales/ui';
import './LoginCard.css';

interface LoginCardProps {
  children: React.ReactNode;
}

export const LoginCard: React.FC<LoginCardProps> = ({ children }) => {
  return (
    <Card variant="glass" className="auth-login-card">
      {children}
    </Card>
  );
};
