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

// Hotels & Accommodation (Faza 3)
import { HotelCatalogPage } from '../modules/hotel/pages/HotelCatalogPage/HotelCatalogPage';
import { HotelDetailsPage } from '../modules/hotel/pages/HotelDetailsPage/HotelDetailsPage';
import { HotelCheckoutPage } from '../modules/hotel/pages/HotelCheckoutPage/HotelCheckoutPage';

// Booking
import { BookingPage } from '../modules/booking/pages/BookingPage/BookingPage';
import { CheckoutPage } from '../modules/booking/pages/CheckoutPage/CheckoutPage';
import { VoucherPage } from '../modules/booking/pages/VoucherPage/VoucherPage';
import { BalancePaymentPage } from '../modules/booking/pages/BalancePaymentPage/BalancePaymentPage';

// Account
import { ProfilePage } from '../modules/account/pages/ProfilePage/ProfilePage';
import { BookingHistoryPage } from '../modules/account/pages/BookingHistoryPage/BookingHistoryPage';
import { FavoritesPage } from '../modules/account/pages/FavoritesPage/FavoritesPage';
import { LoyaltyPage } from '../modules/account/pages/LoyaltyPage/LoyaltyPage';

// Tickets & Support (Faza 4)
import { CustomerTicketsPage } from '../modules/ticket/pages/CustomerTicketsPage';
import { CreateTicketPage } from '../modules/ticket/pages/CreateTicketPage';
import { TicketDetailsPage } from '../modules/ticket/pages/TicketDetailsPage';

// Custom Private Tours & B2B Tender (Faza 5)
import { CustomTourWizardPage } from '../modules/custom-tour/pages/CustomTourWizardPage/CustomTourWizardPage';
import { CustomTourBidsPage } from '../modules/custom-tour/pages/CustomTourBidsPage/CustomTourBidsPage';
import { MyCustomToursPage } from '../modules/custom-tour/pages/MyCustomToursPage/MyCustomToursPage';

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

      {/* Hotels & Accommodation (Faza 3) */}
      <Route path="/hotels" element={<HotelCatalogPage />} />
      <Route path="/hotels/:id" element={<HotelDetailsPage />} />
      <Route path="/hotels/checkout/:roomTypeId" element={<HotelCheckoutPage />} />

      {/* Custom Private & Corporate Tour Builder (Faza 5) */}
      <Route path="/custom-tour" element={<CustomTourWizardPage />} />
      <Route path="/custom-tour/:id" element={<CustomTourBidsPage />} />

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
      <Route path="/voucher/:id" element={<VoucherPage />} />

      {/* FinTech Qalıq Ödəniş Portalı (WhatsApp/SMS Linki ilə) */}
      <Route path="/pay/balance/:bookingId" element={<BalancePaymentPage />} />

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
        path="/account"
        element={<Navigate to="/account/bookings" replace />}
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
        element={<FavoritesPage />}
      />
      <Route
        path="/favorites"
        element={<FavoritesPage />}
      />
      <Route
        path="/account/loyalty"
        element={<LoyaltyPage />}
      />
      <Route
        path="/loyalty"
        element={<LoyaltyPage />}
      />

      {/* Support Tickets (Faza 4) */}
      <Route
        path="/account/tickets"
        element={
          <ProtectedRoute>
            <CustomerTicketsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/tickets/new"
        element={
          <ProtectedRoute>
            <CreateTicketPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/tickets/:id"
        element={
          <ProtectedRoute>
            <TicketDetailsPage />
          </ProtectedRoute>
        }
      />

      {/* Customer Custom Tours & Bids */}
      <Route
        path="/account/custom-tours"
        element={
          <ProtectedRoute>
            <MyCustomToursPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
