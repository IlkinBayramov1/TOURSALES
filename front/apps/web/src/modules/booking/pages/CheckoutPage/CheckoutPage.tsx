import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PaymentMethod, Tour, PassengerInfo, PriceCalculationResult } from '@toursales/types';
import { CheckoutTimer } from './components/CheckoutTimer/CheckoutTimer';
import { PaymentMethodSelector } from './components/PaymentMethodSelector/PaymentMethodSelector';
import { OrderSummaryPanel } from './components/OrderSummaryPanel/OrderSummaryPanel';
import { bookingApi } from '@/modules/booking/api/bookingApi';
import { Button, Spinner, Modal } from '@toursales/ui';
import { ArrowLeft, Copy, Check, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';
import { useToast } from '@/shared/context/ToastContext';
import { parseApiError } from '@/shared/api/errorHandler';
import './CheckoutPage.css';

interface TerminalModalState {
  isOpen: boolean;
  provider: string;
  bookingId: string;
  terminalCode: string;
  amount: number;
  currency: string;
}

export const CheckoutPage: React.FC = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BIRBANK');
  const [installmentMonths, setInstallmentMonths] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);
  const [terminalModal, setTerminalModal] = useState<TerminalModalState | null>(null);

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
    addToast({
      type: 'warning',
      message: 'Ödəniş üçün ayrılan vaxt bitdi. Zəhmət olmasa tura qayıdaraq yerləri yenidən seçin.',
    });
    sessionStorage.removeItem('toursales_checkout_data');
    navigate(`/booking/${tourId}`);
  };

  const handleCopyTerminalCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    addToast({ type: 'success', message: 'Terminal ödəniş kodu kopyalandı!' });
    setTimeout(() => setCodeCopied(false), 3000);
  };

  const handlePayment = async () => {
    if (!bookingData) return;
    setLoading(true);

    const tourPrice = Number((bookingData.tour as any).price ?? (bookingData.tour as any).basePrice ?? 0);
    const totalAmount =
      bookingData.priceBreakdown?.totalPrice ?? tourPrice * bookingData.selectedSeats.length;
    const isTerminal = paymentMethod === 'EMANAT' || paymentMethod === 'MILLION';

    try {
      const primary = bookingData.passengers[0];
      const fullName = primary?.fullName || 'Müştəri Sərnişin';
      const parts = fullName.trim().split(/\s+/);
      const passengerName = parts[0] || 'Müştəri';
      const passengerSurname = parts.slice(1).join(' ') || 'Sərnişin';

      // 1. Create booking in backend
      const booking = await bookingApi.createBooking({
        tourId: bookingData.tour.id,
        seatNumbers: bookingData.selectedSeats,
        passengers: bookingData.passengers,
        promoCode: bookingData.promoCode,
        paymentMethod,
        ...({
          passengerName,
          passengerSurname,
          contactNumber: primary?.phone || '+994500000000',
          contactEmail: 'guest@toursales.az',
          seats: bookingData.selectedSeats.length,
          paidAmount: isTerminal ? 0 : totalAmount,
          paymentStatus: isTerminal ? 'PENDING' : 'PAID',
        } as any),
      });

      // 2. Initialize payment with selected gateway
      const providerKey =
        paymentMethod === 'KAPITAL_BANK' ? 'KAPITAL' : paymentMethod;

      await bookingApi.initPayment({
        bookingId: booking.id,
        amount: totalAmount,
        currency: bookingData.tour.currency || 'AZN',
        provider: providerKey,
        returnUrl: `${window.location.origin}/voucher/${booking.id}`,
        cancelUrl: `${window.location.origin}/checkout/${bookingData.tour.id}`,
      });

      // If Terminal payment, show modal with code
      if (isTerminal) {
        const terminalCode = booking.bookingNumber || booking.id.replace('TR-', 'TS-');
        setTerminalModal({
          isOpen: true,
          provider: paymentMethod === 'EMANAT' ? 'eManat' : 'MilliÖN',
          bookingId: booking.id,
          terminalCode,
          amount: totalAmount,
          currency: bookingData.tour.currency || 'AZN',
        });
      } else {
        // Card payment success
        addToast({
          type: 'success',
          message: 'Ödəniş uğurla tamamlandı! Elektron biletiniz və QR vauçeriniz hazırlandı.',
        });
        sessionStorage.removeItem('toursales_checkout_data');
        navigate(`/voucher/${booking.id}`);
      }
    } catch (err: any) {
      const msg = parseApiError(err);
      addToast({ type: 'error', message: msg });
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

  const calculatedTotal =
    bookingData.priceBreakdown?.totalPrice ??
    Number((bookingData.tour as any).price ?? (bookingData.tour as any).basePrice ?? 0) *
      bookingData.selectedSeats.length;

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
              totalAmount={calculatedTotal}
              currency={bookingData.tour.currency || 'AZN'}
              selectedInstallment={installmentMonths}
              onSelectInstallment={setInstallmentMonths}
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

      {/* Terminal Payment Instruction Modal */}
      {terminalModal && (
        <Modal
          isOpen={terminalModal.isOpen}
          onClose={() => {
            sessionStorage.removeItem('toursales_checkout_data');
            navigate(`/voucher/${terminalModal.bookingId}`);
          }}
          title={
            <div className="terminal-modal-header-title">
              <Terminal size={22} className="terminal-modal-title-icon" />
              <span>{terminalModal.provider} Terminalı üçün Ödəniş Kodu</span>
            </div>
          }
          size="md"
        >
          <div className="web-terminal-modal-body">
            <p className="terminal-modal-desc">
              Rezervasiyanız qeydə alındı və oturacaqlarınız <strong>12 saat</strong> müddətinə bloklandı.
              Aşağıdakı kodu istənilən <strong>{terminalModal.provider}</strong> terminalında daxil edərək nağd ödəniş edə bilərsiniz.
            </p>

            <div className="terminal-code-display-box">
              <span className="code-label">Terminal Ödəniş Kodu:</span>
              <div className="code-value-row">
                <span className="code-digits">{terminalModal.terminalCode}</span>
                <button
                  type="button"
                  className="terminal-copy-action-btn"
                  onClick={() => handleCopyTerminalCode(terminalModal.terminalCode)}
                >
                  {codeCopied ? <Check size={18} /> : <Copy size={18} />}
                  <span>{codeCopied ? 'Kopyalandı' : 'Kodu Kopyala'}</span>
                </button>
              </div>
              <span className="code-amount-notice">
                Ödəniləcək məbləğ: <strong>{terminalModal.amount} {terminalModal.currency}</strong>
              </span>
            </div>

            <div className="terminal-steps-timeline">
              <h5>Addım-addım necə ödəmək olar?</h5>
              <ol>
                <li>Ən yaxın <strong>{terminalModal.provider}</strong> terminalına yaxınlaşın.</li>
                <li>Ekranda <strong>"Turizm və Biletlər"</strong> kateqoriyasını seçin.</li>
                <li><strong>"TOURSALES"</strong> xidmətinə klikləyin.</li>
                <li>Yuxarıdakı <strong>{terminalModal.terminalCode}</strong> kodunu daxil edin.</li>
                <li><strong>{terminalModal.amount} {terminalModal.currency}</strong> nağd məbləği daxil edin və qəbzi götürün.</li>
              </ol>
            </div>

            <div className="terminal-modal-actions">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  sessionStorage.removeItem('toursales_checkout_data');
                  navigate(`/voucher/${terminalModal.bookingId}`);
                }}
                rightIcon={<ExternalLink size={16} />}
                style={{ width: '100%' }}
              >
                Elektron Vauçerə Keçid
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
