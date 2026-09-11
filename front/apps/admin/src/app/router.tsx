import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from './AdminLayout';

// Auth
import { AdminLoginPage } from '../modules/auth/pages/AdminLoginPage/AdminLoginPage';

// Dashboard
import { AdminDashboardPage } from '../modules/dashboard/pages/AdminDashboardPage/AdminDashboardPage';

// Companies
import { CompaniesListPage } from '../modules/companies/pages/CompaniesListPage/CompaniesListPage';
import { CompanyDetailPage } from '../modules/companies/pages/CompanyDetailPage/CompanyDetailPage';

// Subscriptions
import { SubscriptionPlansPage } from '../modules/subscriptions/pages/SubscriptionPlansPage/SubscriptionPlansPage';

// Finance & Payouts Audit
import { FinanceAuditPage } from '../modules/finance-audit/pages/FinanceAuditPage/FinanceAuditPage';

// Audit Logs
import { AuditLogsPage } from '../modules/audit-logs/pages/AuditLogsPage/AuditLogsPage';

// CMS
import { CmsManagePage } from '../modules/cms-manage/pages/CmsManagePage/CmsManagePage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AdminLoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: '/',
            element: <AdminDashboardPage />,
          },
          {
            path: '/companies',
            element: <CompaniesListPage />,
          },
          {
            path: '/companies/:id',
            element: <CompanyDetailPage />,
          },
          {
            path: '/subscriptions',
            element: <SubscriptionPlansPage />,
          },
          {
            path: '/finance-audit',
            element: <FinanceAuditPage />,
          },
          {
            path: '/audit-logs',
            element: <AuditLogsPage />,
          },
          {
            path: '/cms',
            element: <CmsManagePage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
], {
  basename: '/admin',
});
