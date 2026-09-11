import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PaymentMethod, Tour, PassengerInfo, PriceCalculationResult } from '@toursales/types';
import { CheckoutTimer } from './components/CheckoutTimer/CheckoutTimer';
import { PaymentMethodSelector } from './components/PaymentMethodSelector/PaymentMethodSelector';
import { OrderSummaryPanel } from './components/OrderSummaryPanel/OrderSummaryPanel';
import { bookingApi } from '@/modules/booking/api/bookingApi';
import { Button, Spinner } from '@toursales/ui';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/shared/context/ToastContext';
import { parseApiError } from '@/shared/api/errorHandler';
import './CheckoutPage.css';

export const CheckoutPage: React.FC = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const { success, error: toastError, warning } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BIRBANK');
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingData, setBookingData] = useState<{
    tour: Tour;
    selectedSeats: number[];
    passengers: PassengerInfo[];
    promoCode?: string;
    priceBreakdown: PriceCalculationResult | null;
  } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('toursales_checkout_data');
    if (!raw) {
      navigate(`/tours/${tourId}`);
      return;
    }
    try {
      setBookingData(JSON.parse(raw));
    } catch {
      navigate(`/tours/${tourId}`);
    }
  }, [tourId, navigate]);

  const handleTimerExpire = () => {
    warning('Ödəniş üçün ayrılan vaxt bitdi. Zəhmət olmasa tura qayıdaraq yerləri yenidən seçin.');
    sessionStorage.removeItem('toursales_checkout_data');
    navigate(`/booking/${tourId}`);
  };

  const handlePayment = async () => {
    if (!bookingData) return;
    setLoading(true);
    try {
      // 1. Create booking in backend
      const booking = await bookingApi.createBooking({
        tourId: bookingData.tour.id,
        seatNumbers: bookingData.selectedSeats,
        passengers: bookingData.passengers,
        promoCode: bookingData.promoCode,
        paymentMethod,
      });

      // 2. Initialize payment with selected gateway (BirBank, Kapital, Stripe)
      await bookingApi.initPayment({
        bookingId: booking.id,
        paymentMethod,
      });

      success('Ödəniş uğurla tamamlandı! Elektron biletiniz hazırlandı.', 'Təbriklər');
      sessionStorage.removeItem('toursales_checkout_data');
      navigate(`/voucher/${booking.id}`);
    } catch (err: any) {
      const msg = parseApiError(err);
      toastError(msg, 'Ödəniş xətası');
    } finally {
      setLoading(false);
    }
  };

  if (!bookingData) {
    return (
      <div className="web-checkout-loading">
        <Spinner size="lg" />
        <p>Məlumatlar yoxlanılır...</p>
      </div>
    );
  }

  return (
    <div className="web-checkout-page">
      <div className="web-container">
        {/* Checkout Urgency Timer */}
        <CheckoutTimer onExpire={handleTimerExpire} />

        <div className="web-checkout-layout">
          {/* Left Column: Payment Method Selection */}
          <div className="web-checkout-left">
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onSelectMethod={setPaymentMethod}
            />

            <div className="web-checkout-back-link">
              <Link to={`/booking/${tourId}`}>
                <Button variant="ghost">
                  <ArrowLeft size={16} />
                  <span>Sərnişin məlumatlarını redaktə et</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Order Summary and Pay Action */}
          <div className="web-checkout-right">
            <OrderSummaryPanel
              tour={bookingData.tour}
              passengers={bookingData.passengers}
              priceBreakdown={bookingData.priceBreakdown}
              onPay={handlePayment}
              isLoading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
