import React from 'react';
import { Card } from '@toursales/ui';
import './RegisterCard.css';

interface RegisterCardProps {
  children: React.ReactNode;
}

export const RegisterCard: React.FC<RegisterCardProps> = ({ children }) => {
  return (
    <Card variant="glass" className="auth-register-card">
      {children}
    </Card>
  );
};
