import express from 'express';
import { paymentsController } from './payments.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';

const router = express.Router();

// Dəstəklənən ödəniş provayderləri siyahısı (Public)
router.get('/providers', paymentsController.getProviders);

// Kart BIN Aşkarlanması və Taksit Hesablanması (Public)
router.post('/detect-bin', paymentsController.detectBin);

// Qalıq Ödəniş Detalları (Public - linkdəki təhlükəsizlik tokeni ilə)
router.get('/balance-info/:bookingId', paymentsController.getBalanceInfo);

// Qalıq Məbləğin Ödənilməsi (Public / Auth)
router.post('/pay-balance', authMiddleware({ isPublic: true }), paymentsController.payBalance);

// Ödəniş başlatma (Autentifikasiyalı və ya qonaq üçün public token ilə)
router.post('/initiate', authMiddleware({ isPublic: true }), paymentsController.initiatePayment);
router.post('/init', authMiddleware({ isPublic: true }), paymentsController.initiatePayment);

// Test / Dev Ödəniş Simulyatoru
router.post('/simulate-success', paymentsController.simulateSuccess);

// Bank Webhook-ları (İctimai - hər bir bank provayderi öz təhlükəsizlik imzası ilə göndərir)
router.post('/webhook/:provider', paymentsController.handleWebhook);

export default router;
