import express from 'express';
import { bookingsController } from './bookings.controller.js';
import { validateBooking } from './bookings.validation.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { secureUpload } from '../../utils/file-uploader.js';

const router = express.Router();

// Qonaq və ya qeydiyyatlı müştəri tərəfindən rezervasiya yaradılması
router.post('/', authMiddleware({ isPublic: true }), secureUpload.array('passports', 5), validateBooking, bookingsController.create);

// Müştərinin öz rezervasiyaları
router.get('/my', authMiddleware(), bookingsController.getMyBookings);
router.get('/my-bookings', authMiddleware(), bookingsController.getMyBookings);

// Admin ixrac marşrutu (/:id-dən əvvəl yerləşməlidir ki, id='export' kimi qəbul olunmasın)
router.get('/export', authMiddleware(), bookingsController.exportBookings);

// Vendor marşrutları (Autentifikasiya tələb olunur)
router.get('/vendor/bookings', authMiddleware(), bookingsController.getVendorBookings);
router.get('/vendor/stats', authMiddleware(), bookingsController.getVendorStats);
router.get('/vendor/bookings/:id', authMiddleware(), bookingsController.getVendorBookingById);
router.get('/vendor/roster/:tourId', authMiddleware(), bookingsController.getVendorRoster);
router.get('/vendor/roster/:tourId/export', authMiddleware(), bookingsController.exportVendorRoster);
router.post('/vendor/check-in', authMiddleware(), bookingsController.checkIn);
router.patch('/vendor/check-in/toggle/:id', authMiddleware(), bookingsController.toggleCheckIn);
router.post('/vendor/bulk-checkin', authMiddleware(), bookingsController.bulkCheckIn);
router.get('/vendor/export', authMiddleware(), bookingsController.exportVendorBookings);

// Bələdçi və Manifest Portalı marşrutları (Faza 1)
router.get('/guide/tours', authMiddleware(), bookingsController.getGuideTours);
router.get('/guide/staff', authMiddleware(), bookingsController.getCompanyGuides);
router.patch('/guide/tours/:tourId/assign', authMiddleware(), bookingsController.assignGuideToTour);
router.get('/guide/manifest/:tourId', authMiddleware(), bookingsController.getGuideManifest);
router.get('/guide/manifest/:tourId/export', authMiddleware(), bookingsController.exportGuideManifest);
router.post('/guide/scan-checkin', authMiddleware(), bookingsController.scanQrCheckIn);
router.patch('/guide/toggle-checkin/:id', authMiddleware(), bookingsController.toggleGuideCheckIn);
router.post('/guide/bulk-checkin', authMiddleware(), bookingsController.bulkCheckIn);
router.post('/guide/sync-offline', authMiddleware(), bookingsController.syncOfflineCheckIns);
router.post('/notifications/whatsapp/resend/:id', authMiddleware(), bookingsController.sendBookingWhatsApp);
router.post('/notifications/whatsapp/balance-reminder/:id', authMiddleware(), bookingsController.sendBalanceReminderWhatsApp);

// Pasport sənədlərinin qorunmuş şəkildə endirilməsi marşrutu
router.get('/:id/documents/:fileId', authMiddleware(), bookingsController.downloadDocument);

// Rezervasiyanın dinamik cərimə ilə ləğv edilməsi
router.post('/:id/cancel', authMiddleware(), bookingsController.cancel);

// Ümumi siyahı (Admin)
router.get('/', authMiddleware(), bookingsController.getAll);

// Rezervasiya detalları (bilet/vauçer üçün qonaq da baxa bilər)
// Statik /export və digər tək seqmentli marşrutlardan sonra yerləşir
router.get('/:id', authMiddleware({ isPublic: true }), bookingsController.getById);

export default router;
