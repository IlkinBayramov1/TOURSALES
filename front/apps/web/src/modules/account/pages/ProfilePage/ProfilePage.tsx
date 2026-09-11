import React, { useState } from 'react';
import { User, Lock, Shield, Check, AlertCircle } from 'lucide-react';
import { Card, Button, Input, Badge } from '@toursales/ui';
import { useAuth } from '@/shared/hooks/useAuth';
import { useToast } from '@/shared/context/ToastContext';
import { AccountSidebar } from '../../components/AccountSidebar/AccountSidebar';
import { accountApi } from '../../api/accountApi';
import './ProfilePage.css';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      await accountApi.updateProfile({ name, phone });
      addToast({ type: 'success', message: 'Şəxsi məlumatlarınız uğurla yeniləndi!' });
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.response?.data?.message || 'Məlumatları yeniləyərkən xəta baş verdi.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast({ type: 'error', message: 'Yeni şifrələr bir-biri ilə uyğun gəlmir!' });
      return;
    }
    if (newPassword.length < 6) {
      addToast({ type: 'error', message: 'Şifrə minimum 6 simvoldan ibarət olmalıdır.' });
      return;
    }

    try {
      setIsChangingPassword(true);
      await accountApi.changePassword({ oldPassword, newPassword });
      addToast({ type: 'success', message: 'Şifrəniz uğurla dəyişdirildi!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.response?.data?.message || 'Şifrə dəyişdirilərkən xəta baş verdi.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="web-account-layout-container">
      <div className="web-account-grid">
        <aside className="web-account-sidebar-col">
          <AccountSidebar />
        </aside>

        <main className="web-account-main-col">
          <div className="web-account-page-header">
            <h1>Şəxsi Məlumatlar</h1>
            <p>Profil və təhlükəsizlik parametrlərinizi buradan idarə edin.</p>
          </div>

          <Card variant="default" className="web-profile-card">
            <div className="web-card-section-title">
              <User size={20} />
              <h3>Əsas Məlumatlar</h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="web-profile-form">
              <div className="web-form-grid">
                <Input
                  label="Ad və Soyad"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="İlkin Bayramov"
                  required
                />

                <Input
                  label="Əlaqə Nömrəsi"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+994 50 000 00 00"
                />

                <Input
                  label="E-poçt Ünvanı"
                  value={user?.email || ''}
                  disabled
                  helperText="E-poçt ünvanı dəyişdirilə bilməz"
                />

                <div className="web-profile-role-box">
                  <label className="web-role-label">Hesab Növü</label>
                  <div className="web-role-badge-row">
                    <Badge variant="primary" pill>
                      {user?.role === 'CUSTOMER' ? 'Müştəri (B2C)' : user?.role}
                    </Badge>
                    <span className="web-verified-text">
                      <Shield size={14} /> Təsdiqlənmiş İstifadəçi
                    </span>
                  </div>
                </div>
              </div>

              <div className="web-form-actions">
                <Button type="submit" variant="primary" isLoading={isSavingProfile}>
                  Dəyişiklikləri Yadda Saxla
                </Button>
              </div>
            </form>
          </Card>

          <Card variant="default" className="web-profile-card">
            <div className="web-card-section-title">
              <Lock size={20} />
              <h3>Şifrə və Təhlükəsizlik</h3>
            </div>

            <form onSubmit={handleChangePassword} className="web-password-form">
              <div className="web-form-grid">
                <Input
                  label="Cari Şifrə"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                <Input
                  label="Yeni Şifrə"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  helperText="Minimum 6 simvol"
                  required
                />

                <Input
                  label="Yeni Şifrənin Təkrarı"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="web-form-actions">
                <Button type="submit" variant="secondary" isLoading={isChangingPassword}>
                  Şifrəni Yenilə
                </Button>
              </div>
            </form>
          </Card>
        </main>
      </div>
    </div>
  );
};
