import express from 'express';
import { authController } from './auth.controller.js';
import { validateRegister, validateLogin } from './auth.validation.js';
import { authMiddleware } from './auth.middleware.js';
import { authRateLimiter } from '../../middlewares/rate-limiter.middleware.js';

const router = express.Router();

// İctimai marşrutlar (Rate Limiter qorunması ilə)
router.post('/register', authRateLimiter, validateRegister, authController.register);
router.post('/login', authRateLimiter, validateLogin, authController.login);
router.post('/login/2fa', authRateLimiter, authController.verify2FA);
router.post('/refresh-token', authRateLimiter, authController.refreshToken);

// Qorumalı marşrutlar (autentifikasiya tələb edənlər)
router.get('/me', authMiddleware(), authController.getMe);
router.post('/logout', authMiddleware(), authController.logout);

// 2FA marşrutları
router.get('/2fa/setup', authMiddleware(), authController.setup2FA);
router.post('/2fa/enable', authMiddleware(), authController.enable2FA);
router.post('/2fa/disable', authMiddleware(), authController.disable2FA);

// Sessiya marşrutları
router.get('/sessions', authMiddleware(), authController.getSessions);
router.post('/sessions/kill-others', authMiddleware(), authController.killOtherSessions);
router.delete('/sessions/:sessionId', authMiddleware(), authController.killSession);

export default router;
