import prisma from '../../config/db.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import ApiError from '../../core/api.error.js';
import ledgerService from '../finance/ledger.service.js';
import whatsappProvider from '../notifications/whatsapp.provider.js';
import {
  StripeAdapter,
  BirBankAdapter,
  KapitalAdapter,
  EManatAdapter,
  MilliONAdapter,
  TamKartAdapter,
  BolkartAdapter,
  AlbaliAdapter
} from './payment.provider.js';

class PaymentOrchestrator {
  constructor() {
    this.providers = new Map();
    this.registerProvider(new StripeAdapter());
    this.registerProvider(new BirBankAdapter());
    this.registerProvider(new KapitalAdapter());
    this.registerProvider(new EManatAdapter());
    this.registerProvider(new MilliONAdapter());
    this.registerProvider(new TamKartAdapter());
    this.registerProvider(new BolkartAdapter());
    this.registerProvider(new AlbaliAdapter());
  }

  registerProvider(adapter) {
    this.providers.set(adapter.name.toUpperCase(), adapter);
  }

  getProvider(providerName) {
    const adapter = this.providers.get((providerName || '').toUpperCase());
    if (!adapter) {
      throw ApiError.badRequest(`Dəstəklənməyən ödəniş provayderi: ${providerName}`);
    }
    return adapter;
  }

  // 1. Ödəniş başlatma (Payment Initiation via Adapter)
  async initiatePayment(data) {
    const { 
      bookingId, 
      amount, 
      currency = 'AZN', 
      provider = 'BIRBANK', 
      returnUrl, 
      cancelUrl,
      installmentMonths = 1,
      paymentType = 'FULL' // 'FULL', 'DEPOSIT', 'BALANCE'
    } = data;

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      include: { tour: true }
    });

    if (!booking) throw ApiError.notFound('Rezervasiya tapılmadı.');

    const adapter = this.getProvider(provider);
    const paymentId = await generateUniqueId('PAY', 'transaction');

    const paymentResult = await adapter.createPayment({
      bookingId,
      amount,
      currency,
      returnUrl,
      cancelUrl,
      installmentMonths
    });

    return {
      paymentId,
      bookingId,
      amount,
      currency,
      provider: adapter.name,
      paymentType,
      installmentMonths,
      providerTransactionId: paymentResult.providerTransactionId,
      status: 'PENDING',
      paymentUrl: paymentResult.paymentUrl,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    };
  }

  // 2. Webhook İdarəçiliyi və DB-based Idempotency Layer
  async handleWebhook({ provider, idempotencyKey, headers = {}, payload = {} }) {
    const adapter = this.getProvider(provider);

    // Verify provider-specific signature
    adapter.verifyWebhook(headers, payload);

    // Check DB-level Idempotency (Persistent Replay Protection)
    const existingLog = await prisma.webhookLog.findUnique({
      where: { idempotencyKey }
    });

    if (existingLog) {
      console.log(`[Webhook Warning] Təkrar webhook alındı (Idempotency Key: ${idempotencyKey}). Əməliyyat rədd edildi.`);
      return { status: 'SKIPPED_DUPLICATE', idempotencyKey };
    }

    const { bookingId, amount, status, paymentType = 'FULL' } = payload;
    let processingStatus = 'PROCESSED';

    if (status === 'SUCCESS' || status === 'PAID') {
      const booking = await prisma.booking.findFirst({
        where: { id: bookingId, deletedAt: null },
        include: { tour: { include: { company: { include: { plan: true } } } } }
      });

      if (booking) {
        const paidTxAmount = Number(amount);
        const tour = booking.tour;
        const plan = tour.company.plan;
        const commissionRate = plan ? Number(tour.type === 'DOMESTIC' ? plan.domesticCommission : plan.foreignCommission) : 10.0;
        const commissionAmount = (paidTxAmount * commissionRate) / 100;
        const netAmount = paidTxAmount - commissionAmount;

        await prisma.$transaction(async (tx) => {
          let updatedPaymentStatus = 'PAID';
          let updatedPaidAmount = Number(booking.totalAmount);
          let updatedRemainingAmount = 0.0;
          let depositPaidAt = booking.depositPaidAt;
          let balancePaidAt = booking.balancePaidAt;

          if (paymentType === 'DEPOSIT') {
            updatedPaymentStatus = 'PARTIALLY_PAID';
            updatedPaidAmount = paidTxAmount;
            updatedRemainingAmount = Math.max(0, Number(booking.totalAmount) - paidTxAmount);
            depositPaidAt = new Date();
          } else if (paymentType === 'BALANCE') {
            updatedPaymentStatus = 'PAID';
            updatedPaidAmount = Number(booking.totalAmount);
            updatedRemainingAmount = 0.0;
            balancePaidAt = new Date();
          }

          // Booking statusunu yeniləmək
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: 'CONFIRMED',
              paymentStatus: updatedPaymentStatus,
              paidAmount: updatedPaidAmount,
              remainingAmount: updatedRemainingAmount,
              depositPaidAt,
              balancePaidAt
            }
          });

          // Ledger İkiqat yazılışı
          await ledgerService.recordBookingSale({
            bookingId,
            companyId: booking.companyId,
            totalAmount: paidTxAmount,
            commissionAmount,
            netAmount,
            description: `${adapter.name} ${paymentType} Ödənişi Webhook İdempotent Təsdiqi`
          }, tx);
        });

        // WhatsApp Bildirişi Göndərmə
        try {
          if (paymentType === 'DEPOSIT') {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const balancePaymentUrl = `${frontendUrl}/pay/balance/${booking.id}?token=${booking.balanceToken}`;
            await whatsappProvider.sendWhatsAppMessage({
              to: booking.contactNumber,
              templateName: 'deposit_confirmation',
              bodyText: `Hörmətli ${booking.passengerName}, ${tour.title} turu üçün ${paidTxAmount} AZN məbləğində 30% depozit ödənişiniz qəbul edildi! Qalan ${Number(booking.totalAmount) - paidTxAmount} AZN məbləğin son ödəniş tarixi: ${booking.depositDueDate ? new Date(booking.depositDueDate).toLocaleDateString('az-AZ') : 'Turdan 5 gün əvvəl'}. Qalıq ödəniş linkiniz: ${balancePaymentUrl}`,
              bookingId: booking.id
            });
          } else {
            await whatsappProvider.sendBookingConfirmationTemplate({
              booking,
              tour,
              voucherUrl: `http://localhost:5173/voucher/${booking.id}`
            });
          }
        } catch (notifErr) {
          console.error('[Payment Notification Error]:', notifErr.message);
        }
      }
    }

    // Persistent Webhook Log save
    const whlId = await generateUniqueId('WHL', 'webhookLog');
    await prisma.webhookLog.create({
      data: {
        id: whlId,
        provider: adapter.name,
        idempotencyKey,
        payload: JSON.stringify(payload),
        status: processingStatus
      }
    });

    return { status: processingStatus, idempotencyKey };
  }

  // 3. Test və Simulyasiya: Dərhal Uğurlu Ödənişi Təsdiqləmək (Dev helper)
  async simulatePaymentSuccess({ bookingId, paymentType = 'FULL', amount }) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      include: { tour: { include: { company: true } } }
    });

    if (!booking) throw ApiError.notFound('Rezervasiya tapılmadı.');

    const txAmount = amount !== undefined ? Number(amount) : (paymentType === 'DEPOSIT' ? Number(booking.totalAmount) * 0.3 : Number(booking.remainingAmount || booking.totalAmount));

    const idempotencyKey = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.handleWebhook({
      provider: 'BIRBANK',
      idempotencyKey,
      payload: {
        bookingId,
        amount: txAmount,
        status: 'PAID',
        paymentType
      }
    });
  }
}

export const paymentOrchestrator = new PaymentOrchestrator();
export default paymentOrchestrator;
