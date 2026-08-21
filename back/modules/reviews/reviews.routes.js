import express from 'express';
import { reviewsController } from './reviews.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// Tura aid rəyləri görmək hər kəsə açıqdır
router.get('/tour/:tourId', reviewsController.getTourReviews);

// Aşağıdakı marşrutlar üçün autentifikasiya vacibdir
router.use(authMiddleware());

// Müştərilər turlar üçün rəy yaza bilərlər
router.post('/', roleMiddleware(ROLES.USER), reviewsController.create);

// Vendor-lar öz müştəri məmnuniyyəti indeksini görə bilərlər
router.get('/satisfaction-index', roleMiddleware(ROLES.VENDOR), reviewsController.getMySatisfactionIndex);

export default router;
