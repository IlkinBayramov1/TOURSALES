import express from 'express';
import { toursController } from './tours.controller.js';
import { validateTour } from './tours.validation.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// Vendor-a aid xüsusi marşrutlar (Mütləq /:id-dən ƏVVƏL gəlməlidir)
router.get('/my-tours', authMiddleware(), roleMiddleware(ROLES.VENDOR), toursController.getMyTours);
router.get('/vendor/my-tours', authMiddleware(), roleMiddleware(ROLES.VENDOR), toursController.getMyTours);
router.get('/my-performance', authMiddleware(), roleMiddleware(ROLES.VENDOR), toursController.getMyPerformanceStats);

// İctimai marşrutlar
router.get('/export/excel', authMiddleware(), toursController.exportTours);
router.get('/', toursController.getAll);
router.get('/:id', toursController.getById);
router.post('/:id/calculate-price', authMiddleware({ isPublic: true }), toursController.calculatePrice);
router.get('/:id/seats', toursController.getSeatMatrix);

// Qorunan marşrutlar (Mütləq autentifikasiya tələb edir)
router.use(authMiddleware());

// Oturacaq Kilidlənməsi marşrutları
router.post('/:id/seats/lock', toursController.lockSeat);
router.post('/:id/seats/release', toursController.releaseSeat);

// Gözləmə Siyahısı marşrutları (Hər hansı autentifikasiyalı istifadəçi növbəyə yazıla/çıxa bilər)
router.post('/:id/waiting-list', toursController.joinWaitingList);
router.delete('/:id/waiting-list', toursController.leaveWaitingList);
router.get('/:id/waiting-list', toursController.getWaitingList);

// Vendor tur yaratma
router.post('/', roleMiddleware(ROLES.VENDOR), validateTour, toursController.create);

// Həm Admin, həm Vendor üçün ortaq marşrutlar
router.put('/:id', validateTour, toursController.update);
router.delete('/:id', toursController.delete);

export default router;
