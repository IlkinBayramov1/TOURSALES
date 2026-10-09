import { asyncHandler } from '../../core/utils.js';
import paymentOrchestrator from './payment.orchestrator.js';
import ApiError from '../../core/api.error.js';
import prisma from '../../config/db.js';
import { detectCardBin, calculateInstallmentSchedule } from '../../utils/bin-detector.js';

class PaymentsController {
  detectBin = asyncHandler(async (req, res) => {
    const { cardNumberOrBin, amount, currency = 'AZN' } = req.body;
    const detection = detectCardBin(cardNumberOrBin);
    
    let installments = [];
    if (detection.isInstallment && amount) {
      installments = calculateInstallmentSchedule(parseFloat(amount), detection.supportedMonths, currency);
    }

    return res.status(200).json({
      status: 'success',
      msg: 'Kart BIN məlumatı təhlil edildi.',
      data: {
        ...detection,
        installments
      }
    });
  });

  initiatePayment = asyncHandler(async (req, res) => {
    const { 
      bookingId, 
      amount, 
      currency = 'AZN', 
      provider = 'BIRBANK', 
      returnUrl, 
      cancelUrl,
      installmentMonths = 1,
      paymentType = 'FULL' // 'FULL', 'DEPOSIT', 'BALANCE'
    } = req.body;

    if (!bookingId || !amount) {
      throw ApiError.badRequest('Rezervasiya ID (bookingId) və Məbləğ (amount) daxil edilməlidir.');
    }

    const result = await paymentOrchestrator.initiatePayment({
      bookingId,
      amount: parseFloat(amount),
      currency,
      provider,
      returnUrl,
      cancelUrl,
      installmentMonths: parseInt(installmentMonths, 10) || 1,
      paymentType
    });

    return res.status(200).json({
      status: 'success',
      msg: 'Ödəniş sessiyası uğurla başladıldı.',
      data: result
    });
  });

  getBalanceInfo = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { token } = req.query;

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      include: {
        tour: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            meetingPointAddress: true,
            currency: true,
            images: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            logoUrl: true
          }
        }
      }
    });

    if (!booking) {
      throw ApiError.notFound('Rezervasiya tapılmadı.');
    }

    if (token && booking.balanceToken && booking.balanceToken !== token) {
      throw ApiError.forbidden('Etibarsız təhlükəsizlik tokeni.');
    }

    let parsedPassengers = [];
    try {
      parsedPassengers = booking.passengersData ? JSON.parse(booking.passengersData) : [];
    } catch {
      parsedPassengers = [];
    }

    return res.status(200).json({
      status: 'success',
      msg: 'Qalıq ödəniş məlumatları əldə edildi.',
      data: {
        bookingId: booking.id,
        bookingNumber: booking.id.replace('TR-', 'TS-'),
        passengerName: `${booking.passengerName} ${booking.passengerSurname}`,
        contactNumber: booking.contactNumber,
        contactEmail: booking.contactEmail,
        totalAmount: Number(booking.totalAmount),
        paidAmount: Number(booking.paidAmount),
        remainingAmount: Number(booking.remainingAmount),
        currency: booking.tour?.currency || 'AZN',
        paymentStatus: booking.paymentStatus,
        paymentType: booking.paymentType,
        depositDueDate: booking.depositDueDate,
        depositPaidAt: booking.depositPaidAt,
        balancePaidAt: booking.balancePaidAt,
        seats: booking.seats,
        tour: booking.tour,
        company: booking.company,
        passengers: parsedPassengers
      }
    });
  });

  payBalance = asyncHandler(async (req, res) => {
    const { 
      bookingId, 
      provider = 'BIRBANK', 
      token, 
      returnUrl, 
      cancelUrl,
      installmentMonths = 1
    } = req.body;

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      include: { tour: true }
    });

    if (!booking) {
      throw ApiError.notFound('Rezervasiya tapılmadı.');
    }

    if (token && booking.balanceToken && booking.balanceToken !== token) {
      throw ApiError.forbidden('Etibarsız təhlükəsizlik tokeni.');
    }

    const remainingAmount = Number(booking.remainingAmount);
    if (remainingAmount <= 0 || booking.paymentStatus === 'PAID') {
      throw ApiError.badRequest('Bu sifarişin qalıq borcu yoxdur, tam ödənilib.');
    }

    const result = await paymentOrchestrator.initiatePayment({
      bookingId,
      amount: remainingAmount,
      currency: booking.tour?.currency || 'AZN',
      provider,
      returnUrl,
      cancelUrl,
      installmentMonths: parseInt(installmentMonths, 10) || 1,
      paymentType: 'BALANCE'
    });

    return res.status(200).json({
      status: 'success',
      msg: 'Qalıq ödəniş sessiyası uğurla başladıldı.',
      data: result
    });
  });

  simulateSuccess = asyncHandler(async (req, res) => {
    const { bookingId, paymentType = 'FULL', amount } = req.body;
    if (!bookingId) {
      throw ApiError.badRequest('bookingId daxil edilməlidir.');
    }

    const result = await paymentOrchestrator.simulatePaymentSuccess({
      bookingId,
      paymentType,
      amount: amount !== undefined ? parseFloat(amount) : undefined
    });

    return res.status(200).json({
      status: 'success',
      msg: 'Ödəniş simulyasiyası uğurla tamamlandı.',
      data: result
    });
  });

  handleWebhook = asyncHandler(async (req, res) => {
    const { provider } = req.params;
    const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || req.body.idempotencyKey || `whk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const result = await paymentOrchestrator.handleWebhook({
      provider,
      idempotencyKey,
      headers: req.headers,
      payload: req.body
    });

    return res.status(200).json({
      status: 'success',
      msg: 'Webhook uğurla emal edildi.',
      data: result
    });
  });

  getProviders = asyncHandler(async (req, res) => {
    const availableProviders = Array.from(paymentOrchestrator.providers.keys());
    return res.status(200).json({
      status: 'success',
      msg: 'Dəstəklənən ödəniş provayderləri gətirildi.',
      data: availableProviders
    });
  });
}

export const paymentsController = new PaymentsController();
export default paymentsController;
