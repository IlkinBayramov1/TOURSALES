import React, { useEffect, useState } from 'react';
import { Company, CompanyProfileStats, PasswordChangePayload } from '@toursales/types';
import { vendorProfileApi } from '../../vendorProfileApi';
import { ProfileHeroBanner } from '../../components/ProfileHeroBanner/ProfileHeroBanner';
import { GeneralInfoTab } from '../../components/GeneralInfoTab/GeneralInfoTab';
import { BankingTab } from '../../components/BankingTab/BankingTab';
import { SecurityTab } from '../../components/SecurityTab/SecurityTab';
import { NotificationsTab } from '../../components/NotificationsTab/NotificationsTab';
import './VendorProfilePage.css';

export const VendorProfilePage: React.FC = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<CompanyProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'banking' | 'security' | 'notifications'>('general');
  const [globalMessage, setGlobalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [compData, statsData] = await Promise.all([
        vendorProfileApi.getMyCompany(),
        vendorProfileApi.getCompanyStats().catch(() => null)
      ]);
      setCompany(compData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load profile data:', err);
      setGlobalMessage({
        type: 'error',
        text: 'Şirkət profil məlumatları yüklənərkən xəta baş verdi. Səhifəni yeniləyin.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCompany = async (partialData: Partial<Company>) => {
    try {
      setSaving(true);
      const updated = await vendorProfileApi.updateCompany(partialData);
      setCompany(updated);
    } catch (err: any) {
      console.error('Profile update failed:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (payload: PasswordChangePayload) => {
    try {
      setChangingPassword(true);
      await vendorProfileApi.changePassword(payload);
    } catch (err: any) {
      console.error('Password change failed:', err);
      throw err;
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setUploadingLogo(true);
      const res = await vendorProfileApi.uploadFile(file);
      const newLogo = res.fullUrl || res.url;
      const updated = await vendorProfileApi.updateCompany({ logoUrl: newLogo });
      setCompany(updated);
      setGlobalMessage({ type: 'success', text: 'Agentlik loqosu uğurla yeniləndi!' });
      setTimeout(() => setGlobalMessage(null), 3000);
    } catch (err: any) {
      console.error('Logo upload error:', err);
      setGlobalMessage({ type: 'error', text: 'Loqo yüklənərkən xəta baş verdi.' });
      setTimeout(() => setGlobalMessage(null), 4000);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    try {
      setUploadingCover(true);
      const res = await vendorProfileApi.uploadFile(file);
      const newCover = res.fullUrl || res.url;
      const updated = await vendorProfileApi.updateCompany({ coverUrl: newCover });
      setCompany(updated);
      setGlobalMessage({ type: 'success', text: 'Örtük şəkli uğurla yeniləndi!' });
      setTimeout(() => setGlobalMessage(null), 3000);
    } catch (err: any) {
      console.error('Cover upload error:', err);
      setGlobalMessage({ type: 'error', text: 'Örtük şəkli yüklənərkən xəta baş verdi.' });
      setTimeout(() => setGlobalMessage(null), 4000);
    } finally {
      setUploadingCover(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading-state">
        <div className="profile-loading-spinner" />
        <p>Şirkət profili və rekvizitlər yüklənir...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="profile-error-state">
        <h3>Şirkət profili tapılmadı</h3>
        <p>İstifadəçi profilinizə bağlı şirkət məlumatları gətirilə bilmədi.</p>
        <button onClick={loadData} className="profile-retry-btn">Yenidən Cəhd Et</button>
      </div>
    );
  }

  return (
    <div className="vendor-profile-page">
      {/* Top Header */}
      <div className="profile-page-header">
        <div>
          <h1 className="page-main-title">Şirkət Profili & Tənzimləmələr</h1>
          <p className="page-main-subtitle">
            Turizm agentliyinizin brend vizualını, hüquqi rekvizitlərini, bank hesablarını və təhlükəsizliyini idarə edin
          </p>
        </div>
      </div>

      {globalMessage && (
        <div className={`global-profile-alert ${globalMessage.type}`}>
          <span>{globalMessage.text}</span>
          <button onClick={() => setGlobalMessage(null)} className="alert-close-btn">✕</button>
        </div>
      )}

      {/* Hero Banner with Logo, Cover, Verification and Quick Stats */}
      <ProfileHeroBanner
        company={company}
        stats={stats}
        onLogoUpload={handleLogoUpload}
        onCoverUpload={handleCoverUpload}
        uploadingLogo={uploadingLogo}
        uploadingCover={uploadingCover}
      />

      {/* 4 Tabs Navigation Bar */}
      <div className="profile-tabs-bar">
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <span className="tab-icon">🏢</span>
          <span>Əsas Məlumatlar & Brendinq</span>
        </button>

        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'banking' ? 'active' : ''}`}
          onClick={() => setActiveTab('banking')}
        >
          <span className="tab-icon">🏦</span>
          <span>Bank & Hesablaşma Rekvizitləri</span>
        </button>

        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <span className="tab-icon">🔐</span>
          <span>Təhlükəsizlik & Şifrə</span>
        </button>

        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <span className="tab-icon">🔔</span>
          <span>Bildiriş Tənzimləmələri</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="profile-tab-body">
        {activeTab === 'general' && (
          <GeneralInfoTab
            company={company}
            onSave={handleSaveCompany}
            saving={saving}
          />
        )}

        {activeTab === 'banking' && (
          <BankingTab
            company={company}
            onSave={handleSaveCompany}
            saving={saving}
          />
        )}

        {activeTab === 'security' && (
          <SecurityTab
            onPasswordChange={handlePasswordChange}
            changing={changingPassword}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsTab
            company={company}
            onSave={handleSaveCompany}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
};

export default VendorProfilePage;
