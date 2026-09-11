import { useState } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { LoginPayload, RegisterPayload } from '@toursales/types';

export const useAuthActions = () => {
  const { login, register, verify2FA } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      return await login(payload);
    } catch (err: any) {
      setError(err?.message || 'Giriş uğursuz oldu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (payload: RegisterPayload) => {
    setLoading(true);
    setError(null);
    try {
      await register(payload);
    } catch (err: any) {
      setError(err?.message || 'Qeydiyyat uğursuz oldu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (userId: string, code: string) => {
    setLoading(true);
    setError(null);
    try {
      await verify2FA(userId, code);
    } catch (err: any) {
      setError(err?.message || '2FA təsdiqi uğursuz oldu');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    handleLogin,
    handleRegister,
    handleVerify2FA,
    loading,
    error,
  };
};
