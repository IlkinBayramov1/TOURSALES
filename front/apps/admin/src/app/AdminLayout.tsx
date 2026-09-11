import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar, AdminHeader } from '../shared/components';
import './AdminLayout.css';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'SuperAdmin İdarəetmə Paneli', subtitle: 'Platforma ümumi statistikası, bilet dövriyyəsi və bildirişlər' },
  '/companies': { title: 'Turizm Agentliklərinin Reyestri', subtitle: 'Lisenziya verifikasiyası və fərdi komissiya tənzimləmələri' },
  '/subscriptions': { title: 'Abunəlik Planları & Tariflər', subtitle: 'Agentliklər üçün təklif olunan aylıq paketlərin qiymət siyasəti' },
  '/finance-audit': { title: 'Maliyyə Auditi & Çıxarış Nəzarəti', subtitle: 'Platforma balans ledger uçotu və bank köçürmələrinin icrası' },
  '/audit-logs': { title: 'Təhlükəsizlik & Audit Qeydləri', subtitle: 'Sistemdə həyata keçirilən bütün kritik əməliyyatların jurnalı' },
  '/cms': { title: 'CMS Məzmun İdarəsi', subtitle: 'Müştəri vebsaytının bloq məqalələri, FAQ və vitrin reklamları' },
};

export const AdminLayout: React.FC = () => {
  const location = useLocation();

  let pageInfo = PAGE_TITLES[location.pathname];
  if (!pageInfo) {
    if (location.pathname.startsWith('/companies/')) {
      pageInfo = { title: 'Agentlik Profili & Sənədlər', subtitle: 'Şirkətin hüquqi rekvizitləri və bank məlumatları' };
    } else {
      pageInfo = { title: 'SuperAdmin Portalı', subtitle: 'TOURSALES Central Administration' };
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-layout-main">
        <AdminHeader title={pageInfo.title} subtitle={pageInfo.subtitle} />

        <main className="admin-layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
