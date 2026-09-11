import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Home
import { HomePage } from '../pages/HomePage/HomePage';

// Auth
import { LoginPage } from '../modules/auth/pages/LoginPage/LoginPage';
import { RegisterPage } from '../modules/auth/pages/RegisterPage/RegisterPage';

// Tours
import { TourCatalogPage } from '../modules/tour/pages/TourCatalogPage/TourCatalogPage';
import { TourDetailsPage } from '../modules/tour/pages/TourDetailsPage/TourDetailsPage';
import { DomesticToursPage } from '../modules/tour/pages/DomesticToursPage/DomesticToursPage';
import { ForeignToursPage } from '../modules/tour/pages/ForeignToursPage/ForeignToursPage';

// Booking
import { BookingPage } from '../modules/booking/pages/BookingPage/BookingPage';
import { CheckoutPage } from '../modules/booking/pages/CheckoutPage/CheckoutPage';
import { VoucherPage } from '../modules/booking/pages/VoucherPage/VoucherPage';

// Account
import { ProfilePage } from '../modules/account/pages/ProfilePage/ProfilePage';
import { BookingHistoryPage } from '../modules/account/pages/BookingHistoryPage/BookingHistoryPage';
import { FavoritesPage } from '../modules/account/pages/FavoritesPage/FavoritesPage';
import { LoyaltyPage } from '../modules/account/pages/LoyaltyPage/LoyaltyPage';

// Campaign & CMS
import { SpecialOffersPage } from '../modules/campaign/pages/SpecialOffersPage/SpecialOffersPage';
import { BlogListPage } from '../modules/cms/pages/BlogListPage/BlogListPage';
import { BlogDetailPage } from '../modules/cms/pages/BlogDetailPage/BlogDetailPage';
import { FAQPage } from '../modules/cms/pages/FAQPage/FAQPage';
import { TermsPage } from '../modules/cms/pages/TermsPage/TermsPage';
import { PrivacyPage } from '../modules/cms/pages/PrivacyPage/PrivacyPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/catalog" element={<TourCatalogPage />} />
      <Route path="/tours" element={<TourCatalogPage />} />
      <Route path="/tours/:id" element={<TourDetailsPage />} />
      <Route path="/domestic" element={<DomesticToursPage />} />
      <Route path="/domestic-tours" element={<DomesticToursPage />} />
      <Route path="/foreign" element={<ForeignToursPage />} />
      <Route path="/foreign-tours" element={<ForeignToursPage />} />
      <Route path="/offers" element={<SpecialOffersPage />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Campaigns & CMS */}
      <Route path="/campaigns" element={<SpecialOffersPage />} />
      <Route path="/blog" element={<BlogListPage />} />
      <Route path="/blog/:slug" element={<BlogDetailPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* Vouchers (accessible for sharing/verification) */}
      <Route path="/booking/voucher/:id" element={<VoucherPage />} />

      {/* Protected Customer Routes */}
      <Route
        path="/booking/:tourId"
        element={
          <ProtectedRoute>
            <BookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout/:bookingId"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/bookings"
        element={
          <ProtectedRoute>
            <BookingHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/favorites"
        element={
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/loyalty"
        element={
          <ProtectedRoute>
            <LoyaltyPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
