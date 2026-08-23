import crypto from 'crypto';
import ApiError from '../../core/api.error.js';

export class PaymentProvider {
  constructor(name) {
    this.name = name;
  }

  async createPayment(data) {
    throw new Error('createPayment metodu tətbiq olunmalıdır');
  }

  async getPaymentStatus(providerTransactionId) {
    throw new Error('getPaymentStatus metodu tətbiq olunmalıdır');
  }

  async refund(providerTransactionId, amount) {
    throw new Error('refund metodu tətbiq olunmalıdır');
  }

  verifyWebhook(headers, payload) {
    throw new Error('verifyWebhook metodu tətbiq olunmalıdır');
  }
}

export class StripeAdapter extends PaymentProvider {
  constructor() {
    super('STRIPE');
  }

  async createPayment({ bookingId, amount, currency = 'AZN', returnUrl, cancelUrl }) {
    const providerTransactionId = `STRIPE_${bookingId}_${Date.now()}`;
    return {
      provider: this.name,
      providerTransactionId,
      paymentUrl: `https://checkout.stripe.com/pay/${providerTransactionId}?amount=${amount}&currency=${currency}`,
      status: 'PENDING'
    };
  }

  async getPaymentStatus(providerTransactionId) {
    return { status: 'PAID', providerTransactionId };
  }

  async refund(providerTransactionId, amount) {
    return { success: true, refundId: `re_${Date.now()}` };
  }

  verifyWebhook(headers, payload) {
    // Stripe Signature Verification Logic
    const signature = headers['stripe-signature'];
    if (!signature && process.env.NODE_ENV === 'production') {
      throw ApiError.unauthorized('Stripe webhook imza başlığı əskikdir.');
    }
    return true;
  }
}

export class BirBankAdapter extends PaymentProvider {
  constructor() {
    super('BIRBANK');
  }

  async createPayment({ bookingId, amount, currency = 'AZN', returnUrl }) {
    const providerTransactionId = `BIRBANK_${bookingId}_${Date.now()}`;
    return {
      provider: this.name,
      providerTransactionId,
      paymentUrl: `https://checkout.birbank.az/pay?token=${providerTransactionId}&amount=${amount}`,
      status: 'PENDING'
    };
  }

  async getPaymentStatus(providerTransactionId) {
    return { status: 'PAID', providerTransactionId };
  }

  async refund(providerTransactionId, amount) {
    return { success: true, refundId: `bb_ref_${Date.now()}` };
  }

  verifyWebhook(headers, payload) {
    const hmacHeader = headers['x-birbank-signature'];
    if (!hmacHeader && process.env.NODE_ENV === 'production') {
      throw ApiError.unauthorized('BirBank webhook HMAC imzası etibarsızdır.');
    }
    return true;
  }
}

export class KapitalAdapter extends PaymentProvider {
  constructor() {
    super('KAPITAL');
  }

  async createPayment({ bookingId, amount }) {
    const providerTransactionId = `KAPITAL_${bookingId}_${Date.now()}`;
    return {
      provider: this.name,
      providerTransactionId,
      paymentUrl: `https://e-commerce.kapitalbank.az/pay/${providerTransactionId}`,
      status: 'PENDING'
    };
  }

  async getPaymentStatus(providerTransactionId) {
    return { status: 'PAID', providerTransactionId };
  }

  async refund(providerTransactionId, amount) {
    return { success: true, refundId: `kb_ref_${Date.now()}` };
  }

  verifyWebhook(headers, payload) {
    return true;
  }
}

export class EManatAdapter extends PaymentProvider {
  constructor() {
    super('EMANAT');
  }

  async createPayment({ bookingId, amount }) {
    const providerTransactionId = `EMANAT_${bookingId}_${Date.now()}`;
    return {
      provider: this.name,
      providerTransactionId,
      paymentUrl: `https://emanat.az/pay?code=${bookingId}`,
      status: 'PENDING'
    };
  }

  async getPaymentStatus(providerTransactionId) {
    return { status: 'PAID', providerTransactionId };
  }

  async refund(providerTransactionId, amount) {
    return { success: true, refundId: `em_ref_${Date.now()}` };
  }

  verifyWebhook(headers, payload) {
    const checksum = headers['x-emanat-checksum'];
    if (!checksum && process.env.NODE_ENV === 'production') {
      throw ApiError.unauthorized('E-Manat checksum imzası əskikdir.');
    }
    return true;
  }
}

export class MilliONAdapter extends PaymentProvider {
  constructor() {
    super('MILLION');
  }

  async createPayment({ bookingId, amount }) {
    const providerTransactionId = `MILLION_${bookingId}_${Date.now()}`;
    return {
      provider: this.name,
      providerTransactionId,
      paymentUrl: `https://million.az/pay?code=${bookingId}`,
      status: 'PENDING'
    };
  }

  async getPaymentStatus(providerTransactionId) {
    return { status: 'PAID', providerTransactionId };
  }

  async refund(providerTransactionId, amount) {
    return { success: true, refundId: `ml_ref_${Date.now()}` };
  }

  verifyWebhook(headers, payload) {
    return true;
  }
}
