import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTourDetail } from '@/modules/tour/hooks/useTourDetail';
import { useBookingFlow } from '@/modules/booking/hooks/useBookingFlow';
import { useSeatSelection } from '@/modules/booking/hooks/useSeatSelection';
import { BookingStepIndicator } from './components/BookingStepIndicator/BookingStepIndicator';
import { SeatSelectionStep } from './components/SeatSelectionStep/SeatSelectionStep';
import { PassengerDetailsStep } from './components/PassengerDetailsStep/PassengerDetailsStep';
import { BookingSummaryCard } from '@/modules/booking/components/BookingSummaryCard/BookingSummaryCard';
import { Button, Spinner } from '@toursales/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/shared/context/ToastContext';
import './BookingPage.css';

export const BookingPage: React.FC = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const { tour, loading: tourLoading } = useTourDetail(tourId);
  const { addToast } = useToast();

  const {
    seatMatrix,
    selectedSeats,
    toggleSeat,
    lockTimeRemaining,
  } = useSeatSelection(tourId || '');

  const {
    step,
    setStep,
    passengers,
    updatePassenger,
    promoCode,
    setPromoCode,
    priceBreakdown,
  } = useBookingFlow(tour);

  if (tourLoading || !tour) {
    return (
      <div className="web-booking-loading">
        <Spinner size="lg" />
        <p>Rezervasiya sistemi hazırlanır...</p>
      </div>
    );
  }

  const handleProceedToStep2 = () => {
    if (selectedSeats.length === 0) {
      addToast({ type: 'warning', message: 'Davam etmək üçün ən azı 1 oturacaq seçməlisiniz' });
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToCheckout = () => {
    const incomplete = passengers.some((p: any) => !p.fullName.trim() || !p.phone.trim());
    if (incomplete) {
      addToast({ type: 'warning', message: 'Zəhmət olmasa bütün sərnişinlərin ad və əlaqə nömrəsini doldurun' });
      return;
    }

    // Save booking state in sessionStorage for CheckoutPage
    sessionStorage.setItem(
      'toursales_checkout_data',
      JSON.stringify({
        tourId: tour.id,
        tour,
        selectedSeats,
        passengers,
        promoCode,
        priceBreakdown,
      })
    );

    navigate(`/checkout/${tour.id}`);
  };

  return (
    <div className="web-booking-page">
      <div className="web-container">
        {/* Step Indicator */}
        <BookingStepIndicator currentStep={step} />

        <div className="web-booking-layout">
          {/* Main Content Step */}
          <main className="web-booking-main">
            {step === 1 && (
              <>
                <SeatSelectionStep
                  seatMatrix={seatMatrix}
                  selectedSeats={selectedSeats}
                  onToggleSeat={toggleSeat}
                  lockTimeRemaining={lockTimeRemaining}
                  promoCode={promoCode}
                  onApplyPromo={setPromoCode}
                  promoDiscount={priceBreakdown?.promoDiscount}
                />

                <div className="web-booking-step-actions">
                  <Link to={`/tours/${tour.id}`}>
                    <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
                      Tura Qayıt
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={selectedSeats.length === 0}
                    onClick={handleProceedToStep2}
                    rightIcon={<ArrowRight size={16} />}
                  >
                    Sərnişin Məlumatlarına Keç ({selectedSeats.length} yer)
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <PassengerDetailsStep
                  passengers={passengers}
                  onUpdatePassenger={updatePassenger}
                  isForeignTour={tour.type === 'FOREIGN'}
                />

                <div className="web-booking-step-actions">
                  <Button
                    variant="ghost"
                    leftIcon={<ArrowLeft size={16} />}
                    onClick={() => setStep(1)}
                  >
                    Oturacaq Seçiminə Qayıt
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleProceedToCheckout}
                    rightIcon={<ArrowRight size={16} />}
                  >
                    Ödəniş Mərhələsinə Keç
                  </Button>
                </div>
              </>
            )}
          </main>

          {/* Right Summary Panel */}
          <aside className="web-booking-aside">
            <BookingSummaryCard
              tour={tour}
              selectedSeats={selectedSeats}
              priceBreakdown={priceBreakdown}
            />
          </aside>
        </div>
      </div>
    </div>
  );
};
