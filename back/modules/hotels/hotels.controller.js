import hotelsService from './hotels.service.js';
import hotelBookingsService from './hotel-bookings.service.js';
import { asyncHandler } from '../../core/utils.js';

class HotelsController {
  // Public: Search hotels with filters
  searchHotels = asyncHandler(async (req, res) => {
    const result = await hotelsService.searchHotels(req.query);
    res.status(200).json({
      success: true,
      data: result.hotels,
      meta: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      }
    });
  });

  // Public: Get single hotel details
  getHotelDetails = asyncHandler(async (req, res) => {
    const hotel = await hotelsService.getHotelDetails(req.params.id, req.query);
    res.status(200).json({
      success: true,
      data: hotel
    });
  });

  // Public: Get recommended hotels for a tour (Cross-sell)
  getTourRecommendations = asyncHandler(async (req, res) => {
    const recommendations = await hotelsService.getRecommendedHotelsForTour(req.params.tourId);
    res.status(200).json({
      success: true,
      data: recommendations
    });
  });

  // User: Create hotel booking
  createBooking = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const booking = await hotelBookingsService.createHotelBooking(userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Otel rezervasiyanız uğurla qeydə alındı.',
      data: booking
    });
  });

  // User: Get my bookings
  getMyBookings = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const bookings = await hotelBookingsService.getUserHotelBookings(userId);
    res.status(200).json({
      success: true,
      data: bookings
    });
  });

  // User: Get booking details
  getBookingById = asyncHandler(async (req, res) => {
    const userId = req.user.role === 'SuperAdmin' ? null : req.user.id;
    const booking = await hotelBookingsService.getHotelBookingById(req.params.id, userId);
    res.status(200).json({
      success: true,
      data: booking
    });
  });

  // User: Cancel booking
  cancelBooking = asyncHandler(async (req, res) => {
    const userId = req.user.role === 'SuperAdmin' ? null : req.user.id;
    const { reason } = req.body;
    const cancelled = await hotelBookingsService.cancelHotelBooking(req.params.id, userId, reason);
    res.status(200).json({
      success: true,
      message: 'Rezervasiya ləğv edildi.',
      data: cancelled
    });
  });

  // Public/User: Get balance payment info
  getBalanceInfo = asyncHandler(async (req, res) => {
    const booking = await hotelBookingsService.getHotelBookingById(req.params.id);
    const total = Number(booking.totalAmount);
    const paid = Number(booking.paidAmount);
    const remaining = Math.max(0, total - paid);

    res.status(200).json({
      success: true,
      data: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        hotelName: booking.hotel.name,
        roomName: booking.roomType.name,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        nightsCount: booking.nightsCount,
        primaryGuestName: booking.primaryGuestName,
        totalAmount: total,
        paidAmount: paid,
        remainingAmount: remaining,
        depositDueDate: booking.depositDueDate,
        paymentStatus: booking.paymentStatus,
        status: booking.status
      }
    });
  });

  // Public/User: Pay balance
  payBalance = asyncHandler(async (req, res) => {
    const { token, paymentMethod, installmentMonths } = req.body;
    const result = await hotelBookingsService.payHotelBalance(req.params.id, token, { paymentMethod, installmentMonths });
    res.status(200).json({
      success: true,
      message: 'Qalıq ödəniş uğurla tamamlandı.',
      data: result
    });
  });

  // Vendor: Get vendor's hotels
  getVendorHotels = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'Vendor şirkəti tapılmadı.' });
    }
    const hotels = await hotelsService.getVendorHotels(companyId);
    res.status(200).json({
      success: true,
      data: hotels
    });
  });

  // Vendor: Create hotel
  createHotel = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'Vendor şirkəti tapılmadı.' });
    }
    const hotel = await hotelsService.createHotel(companyId, req.body);
    res.status(201).json({
      success: true,
      message: 'Otel uğurla yaradıldı.',
      data: hotel
    });
  });

  // Vendor: Update hotel
  updateHotel = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const hotel = await hotelsService.updateHotel(req.params.id, companyId, req.body);
    res.status(200).json({
      success: true,
      message: 'Otel məlumatları yeniləndi.',
      data: hotel
    });
  });

  // Vendor: Create room type
  createRoomType = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const room = await hotelsService.createRoomType(req.params.hotelId, companyId, req.body);
    res.status(201).json({
      success: true,
      message: 'Otaq növü əlavə edildi.',
      data: room
    });
  });

  // Vendor: Get room availability matrix
  getRoomAvailabilityMatrix = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const { startDate, endDate } = req.query;
    const result = await hotelsService.getRoomAvailabilityMatrix(req.params.roomId, companyId, startDate, endDate);
    res.status(200).json({
      success: true,
      data: result
    });
  });

  // Vendor: Bulk update calendar
  bulkUpdateCalendar = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const result = await hotelsService.bulkUpdateRoomCalendar(req.params.roomId, companyId, req.body);
    res.status(200).json({
      success: true,
      message: `${result.updatedDaysCount} gün üzrə qiymət və otaq sayı yeniləndi.`,
      data: result
    });
  });

  // Vendor: Get hotel bookings
  getVendorBookings = asyncHandler(async (req, res) => {
    const companyId = req.user.companyId;
    const bookings = await hotelBookingsService.getVendorHotelBookings(companyId, req.query);
    res.status(200).json({
      success: true,
      data: bookings
    });
  });
}

export default new HotelsController();
