import express from 'express';
import authRoutes from '../../modules/auth/auth.routes.js';
import usersRoutes from '../../modules/users/users.routes.js';
import subscriptionsRoutes from '../../modules/subscriptions/subscriptions.routes.js';
import companiesRoutes from '../../modules/companies/companies.routes.js';
import toursRoutes from '../../modules/tours/tours.routes.js';
import bookingsRoutes from '../../modules/bookings/bookings.routes.js';
import financeRoutes from '../../modules/finance/finance.routes.js';
import campaignsRoutes from '../../modules/campaigns/campaigns.routes.js';
import adsRoutes from '../../modules/ads/ads.routes.js';
import loyaltyRoutes from '../../modules/loyalty/loyalty.routes.js';
import vendorRoutes from '../../modules/vendor/vendor.routes.js';
import superadminRoutes from '../../modules/superadmin/superadmin.routes.js';
import reviewsRoutes from '../../modules/reviews/reviews.routes.js';
import cmsRoutes from '../../modules/cms/cms.routes.js';
import healthRoutes from '../../modules/health/health.routes.js';
import notificationsRoutes from '../../modules/notifications/notifications.routes.js';
import vouchersRoutes from '../../modules/vouchers/vouchers.routes.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/subscriptions', subscriptionsRoutes);
router.use('/companies', companiesRoutes);
router.use('/tours', toursRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/finance', financeRoutes);
router.use('/campaigns', campaignsRoutes);
router.use('/ads', adsRoutes);
router.use('/loyalty', loyaltyRoutes);
router.use('/vendor', vendorRoutes);
router.use('/superadmin', superadminRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/cms', cmsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/vouchers', vouchersRoutes);

export default router;

