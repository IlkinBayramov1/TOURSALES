import { asyncHandler } from '../../core/utils.js';
import paymentOrchestrator from './payment.orchestrator.js';
import ApiError from '../../core/api.error.js';

class PaymentsController {
  initiatePayment = asyncHandler(async (req, res) => {
    const { bookingId, amount, currency = 'AZN', provider = 'BIRBANK', returnUrl, cancelUrl } = req.body;
    if (!bookingId || !amount) {
      throw ApiError.badRequest('Rezervasiya ID (bookingId) və Məbləğ (amount) daxil edilməlidir.');
    }

    const result = await paymentOrchestrator.initiatePayment({
      bookingId,
      amount: parseFloat(amount),
      currency,
      provider,
      returnUrl,
      cancelUrl
    });

    return res.status(200).json({
      status: 'success',
      msg: 'Ödəniş sessiyası uğurla başladıldı.',
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
