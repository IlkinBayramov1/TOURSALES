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
  const [paymentScheme, setPaymentScheme] = useState<'FULL' | 'DEPOSIT'>('FULL');
  const [installmentMonths, setInstallmentMonths] = useState<number>(1);
  const [detectedCard, setDetectedCard] = useState<any>(null);
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

  const tourPrice = Number((bookingData?.tour as any)?.price ?? (bookingData?.tour as any)?.basePrice ?? 0);
  const totalAmount =
    bookingData?.priceBreakdown?.totalPrice ?? (tourPrice * (bookingData?.selectedSeats.length || 1));

  const isDepositAllowed = bookingData?.tour?.allowDeposit !== false;
  const depositPercent = Number(bookingData?.tour?.depositPercentage || 30);
  const depositAmount = Math.round(((totalAmount * depositPercent) / 100) * 100) / 100;
  const remainingAmount = Math.max(0, totalAmount - depositAmount);

  const tourStartDate = bookingData?.tour?.startDate ? new Date(bookingData.tour.startDate) : new Date(Date.now() + 10 * 86400000);
  const dueDays = bookingData?.tour?.depositDueDaysBefore || 5;
  const depositDueDate = new Date(tourStartDate.getTime() - (dueDays * 86400000));

  const chargeAmount = paymentScheme === 'DEPOSIT' ? depositAmount : totalAmount;

  const handlePayment = async () => {
    if (!bookingData) return;
    setLoading(true);

    const isTerminal = paymentMethod === 'EMANAT' || paymentMethod === 'MILLION';

    try {
      const primary = bookingData.passengers[0];
      const fullName = primary?.fullName || 'Müştəri Sərnişin';
      const parts = fullName.trim().split(/\s+/);
      const passengerName = parts[0] || 'Müştəri';
      const passengerSurname = parts.slice(1).join(' ') || 'Sərnişin';

      // 1. Create booking in backend with paymentType (FULL / DEPOSIT)
      const booking = await bookingApi.createBooking({
        tourId: bookingData.tour.id,
        seatNumbers: bookingData.selectedSeats,
        passengers: bookingData.passengers,
        promoCode: bookingData.promoCode,
        paymentMethod,
        paymentType: paymentScheme,
        installmentMonths: installmentMonths || 1,
        installmentCardType: detectedCard?.cardName || paymentMethod,
        ...({
          passengerName,
          passengerSurname,
          contactNumber: primary?.phone || '+994500000000',
          contactEmail: 'guest@toursales.az',
          seats: bookingData.selectedSeats.length,
          paidAmount: isTerminal ? 0 : chargeAmount,
          paymentStatus: isTerminal ? 'PENDING' : (paymentScheme === 'DEPOSIT' ? 'PARTIALLY_PAID' : 'PAID'),
        } as any),
      });

      // 2. Initialize payment with selected gateway
      const providerKey =
        paymentMethod === 'KAPITAL_BANK' ? 'KAPITAL' : paymentMethod;

      await bookingApi.initPayment({
        bookingId: booking.id,
        amount: chargeAmount,
        currency: bookingData.tour.currency || 'AZN',
        provider: providerKey,
        paymentType: paymentScheme,
        installmentMonths,
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
          amount: chargeAmount,
          currency: bookingData.tour.currency || 'AZN',
        });
      } else {
        // Card payment success
        if (paymentScheme === 'DEPOSIT') {
          addToast({
            type: 'success',
            message: `30% depozit ödənişi uğurla tamamlandı! Qalan ${remainingAmount} AZN üçün ödəniş linki nömrənizə göndərildi.`,
          });
        } else {
          addToast({
            type: 'success',
            message: 'Ödəniş uğurla tamamlandı! Elektron biletiniz və QR vauçeriniz hazırlandı.',
          });
        }
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

  return (
    <div className="web-checkout-page">
      <div className="web-container">
        {/* Checkout Urgency Timer */}
        <CheckoutTimer onExpire={handleTimerExpire} />

        <div className="web-checkout-layout">
          {/* Left Column: Payment Scheme + Payment Method Selection */}
          <div className="web-checkout-left">
            {/* 1. FinTech Payment Scheme Selector (Full vs 30% Deposit) */}
            {isDepositAllowed && (
              <div className="web-payment-scheme-card">
                <div className="scheme-card-header">
                  <h4>Ödəniş Modelini Seçin</h4>
                  <span className="scheme-subtitle">İstəyinizə uyğun rahat ödəniş sxemini təyin edin</span>
                </div>

                <div className="scheme-toggle-pills">
                  <button
                    type="button"
                    className={`scheme-pill-btn ${paymentScheme === 'FULL' ? 'active' : ''}`}
                    onClick={() => setPaymentScheme('FULL')}
                  >
                    <div className="scheme-pill-title">100% Tam Ödəniş</div>
                    <div className="scheme-pill-sub">Birdəfəlik və ya Taksitlə</div>
                    <div className="scheme-pill-price">{totalAmount.toFixed(2)} {bookingData.tour.currency || 'AZN'}</div>
                  </button>

                  <button
                    type="button"
                    className={`scheme-pill-btn ${paymentScheme === 'DEPOSIT' ? 'active' : ''}`}
                    onClick={() => setPaymentScheme('DEPOSIT')}
                  >
                    <div className="scheme-pill-badge">Çox Satılan</div>
                    <div className="scheme-pill-title">30% Depozit Seçimi</div>
                    <div className="scheme-pill-sub">İndi cəmi 30%, qalan 70% sonra</div>
                    <div className="scheme-pill-price">{depositAmount.toFixed(2)} {bookingData.tour.currency || 'AZN'} indi</div>
                  </button>
                </div>

                {paymentScheme === 'DEPOSIT' && (
                  <div className="deposit-explanation-box">
                    <div className="deposit-steps-visual">
                      <div className="step-badge active">
                        <span className="step-num">1</span>
                        <div className="step-info">
                          <strong>İndi Ödənilir (30%):</strong>
                          <span>{depositAmount.toFixed(2)} {bookingData.tour.currency || 'AZN'}</span>
                        </div>
                      </div>
                      <div className="step-divider" />
                      <div className="step-badge future">
                        <span className="step-num">2</span>
                        <div className="step-info">
                          <strong>Qalan 70% (Son tarix: {depositDueDate.toLocaleDateString('az-AZ')}):</strong>
                          <span>{remainingAmount.toFixed(2)} {bookingData.tour.currency || 'AZN'}</span>
                        </div>
                      </div>
                    </div>
                    <p className="deposit-note-text">
                      💡 Yerləriniz dərhal adınıza rəsmi qeydiyyata alınır. Qalan 70% məbləği turun çıxışına {dueDays} gün qalmışadək WhatsApp ilə göndəriləcək 1-klik ödəniş linki vasitəsilə rahatlıqla tamamlaya bilərsiniz.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. Payment Method Selector */}
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onSelectMethod={setPaymentMethod}
              totalAmount={chargeAmount}
              currency={bookingData.tour.currency || 'AZN'}
              selectedInstallment={installmentMonths}
              onSelectInstallment={setInstallmentMonths}
              onCardDetected={setDetectedCard}
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
              paymentScheme={paymentScheme}
              depositAmount={depositAmount}
              remainingAmount={remainingAmount}
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
