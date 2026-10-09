import express from 'express';
import hotelsController from './hotels.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';

const router = express.Router();

// --- 1. İctimai Axtarış və Tövsiyələr ---
router.get('/', hotelsController.searchHotels);
router.get('/recommendations/tour/:tourId', hotelsController.getTourRecommendations);

// --- 2. Rezervasiyalar və Qalıq Ödəniş (İctimai / Qonaq / Müştəri) ---
router.get('/bookings/my-bookings', authMiddleware(), hotelsController.getMyBookings);
router.get('/bookings/:id/balance-info', hotelsController.getBalanceInfo);
router.post('/bookings/:id/pay-balance', hotelsController.payBalance);
router.post('/bookings/:id/cancel', authMiddleware(), hotelsController.cancelBooking);
router.get('/bookings/:id', authMiddleware({ isPublic: true }), hotelsController.getBookingById);
router.post('/bookings', authMiddleware({ isPublic: true }), hotelsController.createBooking);

// --- 3. Vendor İdarəetmə Marşrutları (/:id-dən əvvəl yerləşməlidir) ---
router.get('/vendor/my-hotels', authMiddleware(), hotelsController.getVendorHotels);
router.post('/vendor/hotels', authMiddleware(), hotelsController.createHotel);
router.put('/vendor/hotels/:id', authMiddleware(), hotelsController.updateHotel);
router.post('/vendor/hotels/:hotelId/rooms', authMiddleware(), hotelsController.createRoomType);
router.get('/vendor/rooms/:roomId/calendar', authMiddleware(), hotelsController.getRoomAvailabilityMatrix);
router.put('/vendor/rooms/:roomId/calendar', authMiddleware(), hotelsController.bulkUpdateCalendar);
router.post('/vendor/rooms/:roomId/calendar', authMiddleware(), hotelsController.bulkUpdateCalendar);
router.get('/vendor/bookings', authMiddleware(), hotelsController.getVendorBookings);

// --- 3.1 Vendor Əlavə Alias Marşrutları (Frontend və SDK tam uyğunluğu) ---
router.post('/', authMiddleware(), hotelsController.createHotel);
router.put('/:id', authMiddleware(), hotelsController.updateHotel);
router.post('/:hotelId/rooms', authMiddleware(), hotelsController.createRoomType);
router.get('/:hotelId/rooms/:roomId/calendar', authMiddleware(), hotelsController.getRoomAvailabilityMatrix);
router.post('/:hotelId/rooms/:roomId/calendar/bulk', authMiddleware(), hotelsController.bulkUpdateCalendar);
router.put('/:hotelId/rooms/:roomId/calendar', authMiddleware(), hotelsController.bulkUpdateCalendar);

// --- 4. Tək Otel Detalları ---
router.get('/:id', hotelsController.getHotelDetails);

export default router;
