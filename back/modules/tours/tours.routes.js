import express from 'express';
import { toursController } from './tours.controller.js';
import { reviewsController } from '../reviews/reviews.controller.js';
import { validateTour, validateTourUpdate } from './tours.validation.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// Vendor-a aid xüsusi marşrutlar (Mütləq /:id-dən ƏVVƏL gəlməlidir)
router.get('/my-tours', authMiddleware(), roleMiddleware(ROLES.VENDOR), toursController.getMyTours);
router.get('/vendor/my-tours', authMiddleware(), roleMiddleware(ROLES.VENDOR), toursController.getMyTours);
router.get('/my-performance', authMiddleware(), roleMiddleware(ROLES.VENDOR), toursController.getMyPerformanceStats);
router.post('/bulk-status', authMiddleware(), roleMiddleware(ROLES.VENDOR, ROLES.SUPERADMIN), toursController.bulkToggleStatus);

// İctimai marşrutlar
router.get('/export/excel', authMiddleware(), toursController.exportTours);
router.get('/', toursController.getAll);
router.get('/:id', toursController.getById);
router.get('/:id/reviews', reviewsController.getTourReviews);
router.post('/:id/reviews', authMiddleware(), reviewsController.create);
router.post('/:id/calculate-price', authMiddleware({ isPublic: true }), toursController.calculatePrice);
router.get('/:id/seats', toursController.getSeatMatrix);
router.post('/:id/seats/lock', authMiddleware({ isPublic: true }), toursController.lockSeat);
router.post('/:id/seats/release', authMiddleware({ isPublic: true }), toursController.releaseSeat);
router.post('/:id/seats/extend', authMiddleware({ isPublic: true }), toursController.extendSeatLock);

// Qorunan marşrutlar (Mütləq autentifikasiya tələb edir)
router.use(authMiddleware());

// Gözləmə Siyahısı marşrutları (Hər hansı autentifikasiyalı istifadəçi növbəyə yazıla/çıxa bilər)
router.post('/:id/waiting-list', toursController.joinWaitingList);
router.delete('/:id/waiting-list', toursController.leaveWaitingList);
router.get('/:id/waiting-list', toursController.getWaitingList);

import { requireAgencyRole } from '../../middlewares/agency-role.middleware.js';

// Vendor tur yaratma və əməliyyatlar
router.post('/', roleMiddleware(ROLES.VENDOR), requireAgencyRole('OWNER', 'MANAGER'), validateTour, toursController.create);
router.post('/:id/clone', roleMiddleware(ROLES.VENDOR, ROLES.SUPERADMIN), requireAgencyRole('OWNER', 'MANAGER'), toursController.clone);
router.post('/:id/seats/toggle-lock', roleMiddleware(ROLES.VENDOR, ROLES.SUPERADMIN), requireAgencyRole('OWNER', 'MANAGER'), toursController.toggleSeatLock);

// Həm Admin, həm Vendor üçün ortaq marşrutlar
router.patch('/:id/status', roleMiddleware(ROLES.VENDOR, ROLES.SUPERADMIN), requireAgencyRole('OWNER', 'MANAGER'), toursController.toggleStatus);
router.put('/:id', roleMiddleware(ROLES.VENDOR, ROLES.SUPERADMIN), requireAgencyRole('OWNER', 'MANAGER'), validateTourUpdate, toursController.update);
router.delete('/:id', roleMiddleware(ROLES.VENDOR, ROLES.SUPERADMIN), requireAgencyRole('OWNER', 'MANAGER'), toursController.delete);

export default router;
