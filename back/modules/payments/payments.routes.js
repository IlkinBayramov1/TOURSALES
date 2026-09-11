import express from 'express';
import { paymentsController } from './payments.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';

const router = express.Router();

// Dəstəklənən ödəniş provayderləri siyahısı (Public)
router.get('/providers', paymentsController.getProviders);

// Ödəniş başlatma (Autentifikasiyalı və ya qonaq üçün public token ilə)
router.post('/initiate', authMiddleware({ isPublic: true }), paymentsController.initiatePayment);

// Bank Webhook-ları (İctimai - hər bir bank provayderi öz təhlükəsizlik imzası ilə göndərir)
router.post('/webhook/:provider', paymentsController.handleWebhook);

export default router;
