import prisma from '../../config/db.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import ApiError from '../../core/api.error.js';
import ledgerService from '../finance/ledger.service.js';

class PaymentOrchestrator {
  constructor() {
    this.processedWebhooks = new Set(); // Idempotency Key Cache
  }

  // 1. Ödəniş başlatma (Payment Initiation)
  async initiatePayment(data) {
    const { bookingId, amount, currency = 'AZN', provider = 'LOCAL_GATEWAY', returnUrl, cancelUrl } = data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tour: true }
    });

    if (!booking) throw ApiError.notFound('Rezervasiya tapılmadı.');

    const paymentId = await generateUniqueId('PAY', 'transaction');

    let paymentUrl = '';
    let providerTransactionId = `${provider}_TX_${Date.now()}`;

    // Provider seçimi (Abstraction Layer)
    switch (provider.toUpperCase()) {
      case 'LOCAL_GATEWAY': // BirBank / Kapital Bank API
        paymentUrl = `https://checkout.birbank.az/pay?token=${paymentId}&amount=${amount}`;
        break;

      case 'STRIPE': // Stripe Checkout
        paymentUrl = `https://checkout.stripe.com/pay/${paymentId}`;
        break;

      case 'PAYPAL': // PayPal Express Checkout
        paymentUrl = `https://www.paypal.com/checkoutnow?token=${paymentId}`;
        break;

      default:
        throw ApiError.badRequest(`Dəstəklənməyən ödəniş provayderi: ${provider}`);
    }

    return {
      paymentId,
      bookingId,
      amount,
      currency,
      provider,
      providerTransactionId,
      status: 'PENDING',
      paymentUrl,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 dəqiqə reservation timeout
    };
  }

  // 2. Webhook İdarəçiliyi və İdempotent İşləmə (Webhook Idempotency Layer)
  async handleWebhook({ provider, idempotencyKey, payload }) {
    if (this.processedWebhooks.has(idempotencyKey)) {
      console.log(`[Webhook Warning] Təkrar webhook alındı (Idempotency Key: ${idempotencyKey}). Əməliyyat rədd edildi.`);
      return { status: 'SKIPPED_DUPLICATE', idempotencyKey };
    }

    const { bookingId, amount, status } = payload;

    if (status === 'SUCCESS' || status === 'PAID') {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
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
            description: `${provider} Ödənişi Webhook İdempotent Təsdiqi`
          }, tx);
        });
      }
    }

    // Idempotency set-ə əlavə edirik ki, təkrar emal olunmasın
    this.processedWebhooks.add(idempotencyKey);

    return { status: 'PROCESSED', idempotencyKey };
  }
}

export const paymentOrchestrator = new PaymentOrchestrator();
export default paymentOrchestrator;
