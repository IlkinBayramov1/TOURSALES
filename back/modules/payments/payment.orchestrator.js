import prisma from '../../config/db.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import ApiError from '../../core/api.error.js';
import ledgerService from '../finance/ledger.service.js';
import {
  StripeAdapter,
  BirBankAdapter,
  KapitalAdapter,
  EManatAdapter,
  MilliONAdapter
} from './payment.provider.js';

class PaymentOrchestrator {
  constructor() {
    this.providers = new Map();
    this.registerProvider(new StripeAdapter());
    this.registerProvider(new BirBankAdapter());
    this.registerProvider(new KapitalAdapter());
    this.registerProvider(new EManatAdapter());
    this.registerProvider(new MilliONAdapter());
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
    const { bookingId, amount, currency = 'AZN', provider = 'BIRBANK', returnUrl, cancelUrl } = data;

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
      cancelUrl
    });

    return {
      paymentId,
      bookingId,
      amount,
      currency,
      provider: adapter.name,
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

    const { bookingId, amount, status } = payload;
    let processingStatus = 'PROCESSED';

    if (status === 'SUCCESS' || status === 'PAID') {
      const booking = await prisma.booking.findFirst({
        where: { id: bookingId, deletedAt: null },
        include: { tour: { include: { company: { include: { plan: true } } } } }
      });

      if (booking && booking.paymentStatus !== 'PAID') {
        const paidAmount = Number(amount);
        const tour = booking.tour;
        const plan = tour.company.plan;
        const commissionRate = plan ? Number(tour.type === 'DOMESTIC' ? plan.domesticCommission : plan.foreignCommission) : 10.0;
        const commissionAmount = (paidAmount * commissionRate) / 100;
        const netAmount = paidAmount - commissionAmount;

        await prisma.$transaction(async (tx) => {
          // Booking statusunu ödənilmiş etmək
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              paymentStatus: 'PAID',
              paidAmount,
              remainingAmount: 0.0
            }
          });

          // Ledger İkiqat yazılışı
          await ledgerService.recordBookingSale({
            bookingId,
            companyId: booking.companyId,
            totalAmount: paidAmount,
            commissionAmount,
            netAmount,
            description: `${adapter.name} Ödənişi Webhook İdempotent Təsdiqi`
          }, tx);
        });
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
}

export const paymentOrchestrator = new PaymentOrchestrator();
export default paymentOrchestrator;
