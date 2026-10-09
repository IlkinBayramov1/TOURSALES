import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { VendorLayout } from './VendorLayout';
import { RoleGuard } from './RoleGuard';

// Auth Pages
import { LoginPage } from '../modules/auth/pages/LoginPage/LoginPage';
import { RegisterPage } from '../modules/auth/pages/RegisterPage/RegisterPage';

// Dashboard
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage/DashboardPage';

// Tour Management
import { TourListPage } from '../modules/tour-manage/pages/TourListPage/TourListPage';
import { CreateTourPage } from '../modules/tour-manage/pages/CreateTourPage/CreateTourPage';
import { EditTourPage } from '../modules/tour-manage/pages/EditTourPage/EditTourPage';

// Hotels & Accommodation (Faza 3)
import { VendorHotelListPage } from '../modules/hotel-manage/pages/VendorHotelListPage/VendorHotelListPage';
import { VendorHotelFormPage } from '../modules/hotel-manage/pages/VendorHotelFormPage/VendorHotelFormPage';
import { RoomCalendarMatrixPage } from '../modules/hotel-manage/pages/RoomCalendarMatrixPage/RoomCalendarMatrixPage';
import { VendorHotelBookingsPage } from '../modules/hotel-manage/pages/VendorHotelBookingsPage/VendorHotelBookingsPage';

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

// Guide Portal
import { GuideToursPage } from '../modules/guide-portal/pages/GuideToursPage/GuideToursPage';
import { GuideManifestPage } from '../modules/guide-portal/pages/GuideManifestPage/GuideManifestPage';

// Profile
import { VendorProfilePage } from '../modules/profile/pages/VendorProfilePage/VendorProfilePage';

// Support & Live Chat (Faza 4)
import { VendorChatPage } from '../modules/support-chat/pages/VendorChatPage/VendorChatPage';
import { VendorTicketsPage } from '../modules/support-chat/pages/VendorTicketsPage/VendorTicketsPage';

// Custom Tours & B2B Tenders (Faza 5)
import { VendorTenderBoardPage } from '../modules/custom-tours/pages/VendorTenderBoardPage/VendorTenderBoardPage';
import { VendorMyBidsPage } from '../modules/custom-tours/pages/VendorMyBidsPage/VendorMyBidsPage';

// Deep Analytics & Smart Yield (Faza 6)
import { VendorAnalyticsDashboardPage } from '../modules/analytics/pages/VendorAnalyticsDashboardPage/VendorAnalyticsDashboardPage';

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
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER', 'ACCOUNTANT']}>
                <DashboardPage />
              </RoleGuard>
            )
          },
          {
            path: '/chat',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                <VendorChatPage />
              </RoleGuard>
            )
          },
          {
            path: '/tickets',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                <VendorTicketsPage />
              </RoleGuard>
            )
          },
          {
            path: '/analytics',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER', 'ACCOUNTANT']}>
                <VendorAnalyticsDashboardPage />
              </RoleGuard>
            )
          },
          {
            path: '/tours',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER', 'ACCOUNTANT']}>
                <TourListPage />
              </RoleGuard>
            )
          },
          {
            path: '/tours/create',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                <CreateTourPage />
              </RoleGuard>
            )
          },
          {
            path: '/tours/edit/:id',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                <EditTourPage />
              </RoleGuard>
            )
          },
          {
            path: '/tenders',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                <VendorTenderBoardPage />
              </RoleGuard>
            )
          },
          {
            path: '/tenders/my-bids',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                <VendorMyBidsPage />
              </RoleGuard>
            )
          },
          {
            path: '/hotels',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                <VendorHotelListPage />
              </RoleGuard>
            )
          },
          {
            path: '/hotels/create',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                <VendorHotelFormPage />
              </RoleGuard>
            )
          },
          {
            path: '/hotels/edit/:id',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                <VendorHotelFormPage />
              </RoleGuard>
            )
          },
          {
            path: '/hotels/:id/calendar',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                <RoomCalendarMatrixPage />
              </RoleGuard>
            )
          },
          {
            path: '/hotels/bookings',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                <VendorHotelBookingsPage />
              </RoleGuard>
            )
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
            element: (
              <RoleGuard allowedRoles={['OWNER', 'ACCOUNTANT']}>
                <VendorFinancePage />
              </RoleGuard>
            )
          },
          {
            path: '/subscription',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'ACCOUNTANT']}>
                <SubscriptionPage />
              </RoleGuard>
            )
          },
          {
            path: '/team',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                <TeamPage />
              </RoleGuard>
            )
          },
          {
            path: '/ads',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                <AdsDashboardPage />
              </RoleGuard>
            )
          },
          {
            path: '/api-keys',
            element: (
              <RoleGuard allowedRoles={['OWNER']}>
                <ApiKeysPage />
              </RoleGuard>
            )
          },
          {
            path: '/profile',
            element: <VendorProfilePage />
          },
          {
            path: '/guide',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER', 'GUIDE']}>
                <GuideToursPage />
              </RoleGuard>
            )
          },
          {
            path: '/guide/manifest/:tourId',
            element: (
              <RoleGuard allowedRoles={['OWNER', 'MANAGER', 'GUIDE']}>
                <GuideManifestPage />
              </RoleGuard>
            )
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
