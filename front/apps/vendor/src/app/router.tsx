import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { VendorLayout } from './VendorLayout';

// Auth Pages
import { LoginPage } from '../modules/auth/pages/LoginPage/LoginPage';
import { RegisterPage } from '../modules/auth/pages/RegisterPage/RegisterPage';

// Dashboard
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage/DashboardPage';

// Tour Management
import { TourListPage } from '../modules/tour-manage/pages/TourListPage/TourListPage';
import { CreateTourPage } from '../modules/tour-manage/pages/CreateTourPage/CreateTourPage';
import { EditTourPage } from '../modules/tour-manage/pages/EditTourPage/EditTourPage';

// Bookings & Passengers
import { VendorBookingsPage } from '../modules/bookings/pages/VendorBookingsPage/VendorBookingsPage';
import { BookingDetailPage } from '../modules/bookings/pages/BookingDetailPage/BookingDetailPage';

// Finance & Subscriptions
import { VendorFinancePage } from '../modules/finance/pages/VendorFinancePage/VendorFinancePage';
import { SubscriptionPage } from '../modules/finance/pages/SubscriptionPage/SubscriptionPage';

// Team & RBAC
import { TeamPage } from '../modules/team-rbac/pages/TeamPage/TeamPage';

// Ads
import { AdsDashboardPage } from '../modules/ads/pages/AdsDashboardPage/AdsDashboardPage';

// API Keys
import { ApiKeysPage } from '../modules/api-keys/pages/ApiKeysPage/ApiKeysPage';

// Profile
import { VendorProfilePage } from '../modules/profile/pages/VendorProfilePage/VendorProfilePage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/register',
    element: <RegisterPage />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <VendorLayout />,
        children: [
          {
            path: '/',
            element: <DashboardPage />
          },
          {
            path: '/tours',
            element: <TourListPage />
          },
          {
            path: '/tours/create',
            element: <CreateTourPage />
          },
          {
            path: '/tours/edit/:id',
            element: <EditTourPage />
          },
          {
            path: '/bookings',
            element: <VendorBookingsPage />
          },
          {
            path: '/bookings/:id',
            element: <BookingDetailPage />
          },
          {
            path: '/finance',
            element: <VendorFinancePage />
          },
          {
            path: '/subscription',
            element: <SubscriptionPage />
          },
          {
            path: '/team',
            element: <TeamPage />
          },
          {
            path: '/ads',
            element: <AdsDashboardPage />
          },
          {
            path: '/api-keys',
            element: <ApiKeysPage />
          },
          {
            path: '/profile',
            element: <VendorProfilePage />
          }
        ]
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
], {
  basename: '/vendor'
});
