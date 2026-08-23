import express from 'express';
import notificationsController from './notifications.controller.js';

const router = express.Router();

router.post('/send', (req, res, next) => notificationsController.sendNotification(req, res, next));

export default router;
