import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useVendorAuth } from '../shared/context/VendorAuthContext';
import { Spinner } from '@toursales/ui';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useVendorAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-primary)'
      }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
