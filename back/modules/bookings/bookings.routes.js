import express from 'express';
import { bookingsController } from './bookings.controller.js';
import { validateBooking } from './bookings.validation.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { secureUpload } from '../../utils/file-uploader.js';

const router = express.Router();

// Bütün rezervasiya marşrutları üçün auth vacibdir
router.use(authMiddleware());

router.get('/', bookingsController.getAll);
router.get('/export', bookingsController.exportBookings);
// Vendor marşrutları (/:id-dən əvvəl yerləşməlidir)
router.get('/vendor/bookings', bookingsController.getVendorBookings);
router.get('/vendor/stats', bookingsController.getVendorStats);
router.get('/vendor/bookings/:id', bookingsController.getVendorBookingById);
router.get('/vendor/roster/:tourId', bookingsController.getVendorRoster);
router.get('/vendor/roster/:tourId/export', bookingsController.exportVendorRoster);
router.post('/vendor/check-in', bookingsController.checkIn);
router.patch('/vendor/check-in/toggle/:id', bookingsController.toggleCheckIn);
router.get('/vendor/export', bookingsController.exportVendorBookings);

router.get('/:id', bookingsController.getById);

// Rezervasiya yaradılan zaman pasport şəkillərinin qorunmuş qovluğa yüklənməsi üçün secureUpload istifadə edirik
router.post('/', secureUpload.array('passports', 5), validateBooking, bookingsController.create);

// Pasport sənədlərinin qorunmuş şəkildə endirilməsi marşrutu
router.get('/:id/documents/:fileId', bookingsController.downloadDocument);

// Rezervasiyanın dinamik cərimə ilə ləğv edilməsi
router.post('/:id/cancel', bookingsController.cancel);

export default router;
