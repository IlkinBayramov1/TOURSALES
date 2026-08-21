import express from 'express';
import { toursController } from './tours.controller.js';
import { validateTour } from './tours.validation.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { roleMiddleware } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../config/constants.js';

const router = express.Router();

// İctimai marşrutlar
router.get('/', toursController.getAll);
router.get('/:id', toursController.getById);

// Qorunan marşrutlar (Mütləq autentifikasiya tələb edir)
router.use(authMiddleware());

// Gözləmə Siyahısı marşrutları (Hər hansı autentifikasiyalı istifadəçi növbəyə yazıla/çıxa bilər)
router.post('/:id/waiting-list', toursController.joinWaitingList);
router.delete('/:id/waiting-list', toursController.leaveWaitingList);
router.get('/:id/waiting-list', toursController.getWaitingList);

// Vendor-a aid olanlar
router.get('/my-tours', roleMiddleware(ROLES.VENDOR), toursController.getMyTours);
router.get('/my-performance', roleMiddleware(ROLES.VENDOR), toursController.getMyPerformanceStats);
router.post('/', roleMiddleware(ROLES.VENDOR), validateTour, toursController.create);

// Həm Admin, həm Vendor üçün ortaq marşrutlar
router.get('/export/excel', toursController.exportTours);
router.put('/:id', validateTour, toursController.update);
router.delete('/:id', toursController.delete);

export default router;
