import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { PaymentMethod, BinDetectionResult } from '@toursales/types';
import { bookingApi } from '@/modules/booking/api/bookingApi';
import { PaymentMethodSelector } from '../CheckoutPage/components/PaymentMethodSelector/PaymentMethodSelector';
import { Button, Card, Spinner } from '@toursales/ui';
import { 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';
import { useToast } from '@/shared/context/ToastContext';
import { parseApiError } from '@/shared/api/errorHandler';
import './BalancePaymentPage.css';

export const BalancePaymentPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [paying, setPaying] = useState<boolean>(false);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BIRBANK');
  const [installmentMonths, setInstallmentMonths] = useState<number>(1);
  const [detectedCard, setDetectedCard] = useState<BinDetectionResult | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await bookingApi.getBalanceInfo(bookingId, token);
        setBalanceData(data);
      } catch (err: any) {
        setError(parseApiError(err) || 'Qalıq ödəniş məlumatları tapılmadı.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [bookingId, token]);

  const handlePayBalance = async () => {
    if (!balanceData || !bookingId) return;

    try {
      setPaying(true);
      const providerKey = paymentMethod === 'KAPITAL_BANK' ? 'KAPITAL' : paymentMethod;

      await bookingApi.payBalance({
        bookingId,
        provider: providerKey,
        token,
        installmentMonths,
        returnUrl: `${window.location.origin}/voucher/${bookingId}`,
        cancelUrl: `${window.location.origin}/pay/balance/${bookingId}?token=${token}`
      });

      addToast({
        type: 'success',
        message: 'Qalıq ödəniş uğurla tamamlandı! Yerləriniz tam təsdiqləndi.'
      });

      navigate(`/voucher/${bookingId}`);
    } catch (err: any) {
      addToast({
        type: 'error',
        message: parseApiError(err) || 'Ödəniş zamanı xəta baş verdi.'
      });
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="balance-page-loading">
        <Spinner size="lg" />
        <p>Qalıq ödəniş məlumatları təhlükəsiz şəkildə yoxlanılır...</p>
      </div>
    );
  }

  if (error || !balanceData) {
    return (
      <div className="balance-page-error-wrap">
        <div className="balance-error-card">
          <AlertCircle size={48} className="error-icon" />
          <h2>Məlumat Tapılmadı</h2>
          <p>{error || 'Ödəniş linki etibarsızdır və ya müddəti bitmişdir.'}</p>
          <Link to="/">
            <Button variant="primary">Əsas Səhifəyə Qayıt</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isAlreadyPaid = balanceData.paymentStatus === 'PAID' || balanceData.remainingAmount <= 0;
  const dueDateStr = balanceData.depositDueDate ? new Date(balanceData.depositDueDate).toLocaleDateString('az-AZ') : 'Turdan 5 gün əvvəl';
  const tourStartDateStr = balanceData.tour?.startDate ? new Date(balanceData.tour.startDate).toLocaleDateString('az-AZ') : '';

  if (isAlreadyPaid) {
    return (
      <div className="balance-page-success-wrap">
        <Card variant="glass" className="balance-already-paid-card">
          <CheckCircle2 size={56} className="paid-icon" />
          <h2>Sifarişiniz Tam Ödənilib!</h2>
          <p>
            Hörmətli <strong>{balanceData.passengerName}</strong>, <strong>{balanceData.tour?.title}</strong> turu üçün rezervasiyanız tam təsdiqlənmişdir və qalıq borcunuz yoxdur.
          </p>
          <div className="already-paid-actions">
            <Link to={`/voucher/${balanceData.bookingId}`}>
              <Button variant="primary" size="lg">
                Elektron QR Vauçeri Aç
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="web-balance-payment-page">
      <div className="web-container">
        <div className="balance-header-banner">
          <div className="banner-badge">
            <Lock size={15} /> 256-Bit SSL Qorunan Təhlükəsiz Şlüz
          </div>
          <h1 className="balance-main-title">Tur üçün Qalıq Ödəniş</h1>
          <p className="balance-main-subtitle">
            Bron nömrəsi: <strong>{balanceData.bookingNumber}</strong>
          </p>
        </div>

        <div className="balance-grid-layout">
          {/* Sol Sütun: Ödəniş Seçimi */}
          <div className="balance-left-col">
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onSelectMethod={setPaymentMethod}
              totalAmount={balanceData.remainingAmount}
              currency={balanceData.currency}
              selectedInstallment={installmentMonths}
              onSelectInstallment={setInstallmentMonths}
              onCardDetected={setDetectedCard}
            />
          </div>

          {/* Sağ Sütun: Rezervasiya Xülasəsi və Ödə Düyməsi */}
          <div className="balance-right-col">
            <Card variant="glass" className="balance-summary-card">
              <h3 className="summary-title">Rezervasiya Detalları</h3>

              <div className="summary-tour-info">
                <h4>{balanceData.tour?.title || 'Tur Səyahəti'}</h4>
                <div className="tour-meta-row">
                  <Calendar size={15} />
                  <span>Çıxış Tarixi: {tourStartDateStr}</span>
                </div>
                {balanceData.tour?.meetingPointAddress && (
                  <div className="tour-meta-row">
                    <MapPin size={15} />
                    <span>Toplanış: {balanceData.tour.meetingPointAddress}</span>
                  </div>
                )}
                <div className="tour-meta-row">
                  <User size={15} />
                  <span>Sərnişin: {balanceData.passengerName} ({balanceData.seats} yer)</span>
                </div>
              </div>

              {/* Maliyyə Cədvəli */}
              <div className="summary-financial-breakdown">
                <div className="financial-row">
                  <span>Ümumi Tur Qiyməti:</span>
                  <span>{balanceData.totalAmount.toFixed(2)} {balanceData.currency}</span>
                </div>
                <div className="financial-row paid">
                  <span>Ödənilmiş 30% Depozit:</span>
                  <strong>- {balanceData.paidAmount.toFixed(2)} {balanceData.currency}</strong>
                </div>
                <div className="financial-divider" />
                <div className="financial-row remaining">
                  <span>Ödəniləcək Qalıq 70%:</span>
                  <strong className="big-remaining">
                    {balanceData.remainingAmount.toFixed(2)} {balanceData.currency}
                  </strong>
                </div>
              </div>

              {/* Son tarix bildirişi */}
              <div className="balance-deadline-pill">
                <Clock size={16} />
                <span>Son Ödəniş Tarixi: <strong>{dueDateStr}</strong></span>
              </div>

              {/* Ödəniş düyməsi */}
              <Button
                variant="primary"
                size="lg"
                onClick={handlePayBalance}
                isLoading={paying}
                rightIcon={<ArrowRight size={18} />}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                Qalıq {balanceData.remainingAmount.toFixed(2)} {balanceData.currency} İndi Ödə
              </Button>

              <div className="balance-safe-note">
                <ShieldCheck size={16} />
                <span>3D Secure və rəsmi bank təhlükəsizliyi ilə qorunur</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BalancePaymentPage;
