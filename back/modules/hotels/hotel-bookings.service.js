import prisma from '../../config/db.js';
import whatsappProvider from '../notifications/whatsapp.provider.js';
import { calculateDynamicRoomRate } from '../../utils/yield-engine.js';
import crypto from 'crypto';

class HotelBookingsService {
  /**
   * Create a new hotel booking with room locking, dynamic rate, and deposit support
   */
  async createHotelBooking(userId, data) {
    const {
      hotelId,
      roomTypeId,
      checkInDate,
      checkOutDate,
      roomsCount = 1,
      guestsCount = 2,
      primaryGuestName,
      primaryGuestPhone,
      primaryGuestEmail,
      guestNotes,
      paymentType = 'FULL',
      paymentMethod = 'KAPITAL_BANK',
      installmentMonths,
      installmentCardType,
      linkedTourBookingId,
    } = data;

    if (!hotelId || !roomTypeId || !checkInDate || !checkOutDate || !primaryGuestName || !primaryGuestPhone) {
      const error = new Error('Zəhmət olmasa bütün tələb olunan sahələri doldurun.');
      error.statusCode = 400;
      throw error;
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      const error = new Error('Çıxış tarixi giriş tarixindən sonra olmalıdır.');
      error.statusCode = 400;
      throw error;
    }

    const nightsCount = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

    // Fetch hotel and room
    const hotel = await prisma.hotel.findFirst({
      where: { id: hotelId, isActive: true, deletedAt: null }
    });
    if (!hotel) {
      const error = new Error('Otel tapılmadı və ya aktiv deyil.');
      error.statusCode = 404;
      throw error;
    }

    const room = await prisma.roomType.findFirst({
      where: { id: roomTypeId, hotelId, isActive: true, deletedAt: null }
    });
    if (!room) {
      const error = new Error('Otaq növü tapılmadı.');
      error.statusCode = 404;
      throw error;
    }

    // Check capacity
    const numRooms = parseInt(roomsCount, 10) || 1;
    const numGuests = parseInt(guestsCount, 10) || 2;
    if (numGuests > room.maxOccupancy * numRooms) {
      const error = new Error(`Seçilmiş ${numRooms} otağın maksimum qonaq tutumu ${room.maxOccupancy * numRooms} nəfərdir.`);
      error.statusCode = 400;
      throw error;
    }

    // Check availability for all nights in date range
    const calendarEntries = await prisma.roomAvailabilityCalendar.findMany({
      where: {
        roomTypeId,
        date: { gte: checkIn, lt: checkOut }
      }
    });

    const calendarMap = new Map();
    calendarEntries.forEach(entry => {
      calendarMap.set(entry.date.toISOString().slice(0, 10), entry);
    });

    let totalCalculatedAmount = 0;
    const current = new Date(checkIn);

    while (current < checkOut) {
      const dateKey = current.toISOString().slice(0, 10);
      const entry = calendarMap.get(dateKey);

      if (entry && entry.isBlocked) {
        const error = new Error(`${dateKey} tarixində bu otaq növü rezervasiya üçün bağlıdır.`);
        error.statusCode = 400;
        throw error;
      }

      const available = entry ? entry.availableCount : room.totalRoomsCount;
      if (available < numRooms) {
        const error = new Error(`${dateKey} tarixində kifayət qədər boş otaq yoxdur (Qalan otaq: ${available}).`);
        error.statusCode = 400;
        throw error;
      }

      const dynamicRate = calculateDynamicRoomRate({
        basePrice: Number(room.basePrice),
        availableCount: available,
        totalRoomsCount: room.totalRoomsCount,
        targetDate: current,
        priceOverride: entry ? entry.priceOverride : null,
        dynamicPricingActive: hotel.dynamicPricingActive
      });

      totalCalculatedAmount += dynamicRate.price * numRooms;
      current.setDate(current.getDate() + 1);
    }

    // Cross-sell discount calculation
    let crossSellDiscount = 0;
    if (linkedTourBookingId) {
      const tourBooking = await prisma.booking.findFirst({
        where: { id: linkedTourBookingId, status: { in: ['CONFIRMED', 'PAID', 'PARTIALLY_PAID'] } }
      });
      if (tourBooking) {
        crossSellDiscount = Math.round(totalCalculatedAmount * 0.10 * 100) / 100; // 10% paket endirimi
        totalCalculatedAmount = Math.max(0, totalCalculatedAmount - crossSellDiscount);
      }
    }

    totalCalculatedAmount = Math.round(totalCalculatedAmount * 100) / 100;

    // Deposit or Full payment
    const isDeposit = (paymentType === 'DEPOSIT' || paymentType === 'DEPOSIT_30') && hotel.allowDeposit;
    let paidAmount = totalCalculatedAmount;
    let paymentStatus = 'PAID';
    let status = 'CONFIRMED';
    let balanceToken = null;
    let depositDueDate = null;

    if (isDeposit) {
      paidAmount = Math.round(totalCalculatedAmount * 0.30 * 100) / 100;
      paymentStatus = 'PARTIALLY_PAID';
      status = 'PARTIALLY_PAID';
      balanceToken = crypto.randomBytes(24).toString('hex');
      
      const dueDaysBefore = 5;
      depositDueDate = new Date(checkIn.getTime() - dueDaysBefore * 24 * 60 * 60 * 1000);
      if (depositDueDate <= new Date()) {
        depositDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
    }

    const bookingId = `HB-${Math.floor(100000 + Math.random() * 900000)}`;
    const bookingNumber = `HTR-${Math.floor(100000 + Math.random() * 900000)}`;
    const qrCodeToken = `HQR-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    // Execute booking in transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Create HotelBooking record
      const createdBooking = await tx.hotelBooking.create({
        data: {
          id: bookingId,
          bookingNumber,
          userId,
          companyId: hotel.companyId,
          hotelId,
          roomTypeId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          nightsCount,
          roomsCount: numRooms,
          guestsCount: numGuests,
          primaryGuestName,
          primaryGuestPhone,
          primaryGuestEmail: primaryGuestEmail || null,
          guestNotes: guestNotes || null,
          totalAmount: totalCalculatedAmount,
          paidAmount,
          paymentType: isDeposit ? 'DEPOSIT' : (paymentType === 'INSTALLMENT' ? 'INSTALLMENT' : 'FULL'),
          paymentMethod,
          paymentStatus,
          status,
          balanceToken,
          depositDueDate,
          installmentMonths: installmentMonths ? parseInt(installmentMonths, 10) : null,
          qrCodeToken,
          linkedTourBookingId: linkedTourBookingId || null,
          crossSellDiscount: crossSellDiscount > 0 ? crossSellDiscount : null,
        },
        include: {
          hotel: { select: { name: true, address: true, city: true, starRating: true, checkInTime: true } },
          roomType: { select: { name: true, mealPlan: true, bedType: true } },
        }
      });

      // Update room availability for each night in range
      const stepDate = new Date(checkIn);
      while (stepDate < checkOut) {
        const dateObj = new Date(stepDate);
        const existing = await tx.roomAvailabilityCalendar.findUnique({
          where: {
            roomTypeId_date: {
              roomTypeId,
              date: dateObj
            }
          }
        });

        if (existing) {
          await tx.roomAvailabilityCalendar.update({
            where: { id: existing.id },
            data: {
              availableCount: Math.max(0, existing.availableCount - numRooms)
            }
          });
        } else {
          const racId = `RAC-${Math.floor(100000 + Math.random() * 900000)}`;
          await tx.roomAvailabilityCalendar.create({
            data: {
              id: racId,
              roomTypeId,
              date: dateObj,
              availableCount: Math.max(0, room.totalRoomsCount - numRooms),
            }
          });
        }

        stepDate.setDate(stepDate.getDate() + 1);
      }

      return createdBooking;
    });

    // Send WhatsApp notification
    try {
      const checkInFormatted = checkIn.toLocaleDateString('az-AZ');
      const checkOutFormatted = checkOut.toLocaleDateString('az-AZ');
      
      let messageText = `Hörmətli ${primaryGuestName}, *${hotel.name}* üçün otaq rezervasiyanız uğurla qeydə alındı! 🏨\n\n` +
        `📋 *Rezervasiya №:* ${bookingNumber}\n` +
        `🛏️ *Otaq:* ${room.name} (${numRooms} otaq, ${nightsCount} gecə)\n` +
        `📅 *Giriş / Çıxış:* ${checkInFormatted} (${hotel.checkInTime}) — ${checkOutFormatted}\n` +
        `📍 *Ünvan:* ${hotel.address}, ${hotel.city}\n\n`;

      if (isDeposit) {
        const remaining = Math.round((totalCalculatedAmount - paidAmount) * 100) / 100;
        const dueDateFormatted = depositDueDate.toLocaleDateString('az-AZ');
        const balanceUrl = `http://localhost:5173/hotels/pay/balance/${booking.id}?token=${balanceToken}`;
        messageText += `💰 *30% Depozit:* ${paidAmount} AZN ödənildi.\n` +
          `⏳ *Qalıq Məbləğ:* ${remaining} AZN (Son ödəniş: ${dueDateFormatted})\n` +
          `🔗 *Qalıq Ödəniş Linki:* ${balanceUrl}\n\n`;
      } else {
        messageText += `💰 *Ödənilən Məbləğ:* ${totalCalculatedAmount} AZN (Tam ödənilib)\n\n`;
      }

      messageText += `📲 *Elektron Otel Vauçeriniz:*\nhttp://localhost:5173/hotels/voucher/${booking.id}\n\n` +
        `Xoş istirahətlər arzulayırıq! — *TOURSALES*`;

      await whatsappProvider.sendMessage({
        to: primaryGuestPhone,
        text: messageText,
        templateName: isDeposit ? 'hotel_deposit_confirmation' : 'hotel_booking_confirmation',
        bookingId: booking.id,
        metadata: {
          hotelId: hotel.id,
          hotelName: hotel.name,
          nightsCount,
          totalAmount: totalCalculatedAmount,
          isDeposit
        }
      });
    } catch (err) {
      console.error('[WhatsApp] Otel bildirişi xətası:', err);
    }

    return booking;
  }

  /**
   * Get user's hotel bookings
   */
  async getUserHotelBookings(userId) {
    const bookings = await prisma.hotelBooking.findMany({
      where: { userId, deletedAt: null },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            starRating: true,
            images: true,
            featuredImage: true,
            checkInTime: true,
            checkOutTime: true
          }
        },
        roomType: {
          select: {
            id: true,
            name: true,
            bedType: true,
            mealPlan: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return bookings.map(b => ({
      ...b,
      totalAmount: Number(b.totalAmount),
      paidAmount: Number(b.paidAmount),
      crossSellDiscount: b.crossSellDiscount ? Number(b.crossSellDiscount) : 0,
      hotelImages: typeof b.hotel.images === 'string' ? JSON.parse(b.hotel.images) : b.hotel.images
    }));
  }

  /**
   * Get single hotel booking details
   */
  async getHotelBookingById(bookingId, userId = null) {
    const where = { id: bookingId, deletedAt: null };
    if (userId) where.userId = userId;

    const booking = await prisma.hotelBooking.findFirst({
      where,
      include: {
        hotel: true,
        roomType: true,
        company: {
          select: { name: true, phoneNumber: true, email: true, logoUrl: true }
        }
      }
    });

    if (!booking) {
      const error = new Error('Rezervasiya tapılmadı.');
      error.statusCode = 404;
      throw error;
    }

    return {
      ...booking,
      totalAmount: Number(booking.totalAmount),
      paidAmount: Number(booking.paidAmount),
      remainingAmount: Math.max(0, Number(booking.totalAmount) - Number(booking.paidAmount)),
      hotelAmenities: typeof booking.hotel.amenities === 'string' ? JSON.parse(booking.hotel.amenities) : booking.hotel.amenities,
      hotelImages: typeof booking.hotel.images === 'string' ? JSON.parse(booking.hotel.images) : booking.hotel.images,
    };
  }

  /**
   * Vendor: Get bookings for vendor's hotels
   */
  async getVendorHotelBookings(companyId, query = {}) {
    const { status, hotelId, search } = query;

    const where = {
      companyId,
      deletedAt: null
    };

    if (hotelId) where.hotelId = hotelId;
    if (status && status !== 'ALL') {
      if (status === 'PARTIALLY_PAID') {
        where.OR = [
          { status: 'PARTIALLY_PAID' },
          { paymentStatus: 'PARTIALLY_PAID' },
          { paymentType: 'DEPOSIT' }
        ];
      } else {
        where.status = status;
      }
    }

    if (search) {
      const searchConditions = [
        { bookingNumber: { contains: search } },
        { primaryGuestName: { contains: search } },
        { primaryGuestPhone: { contains: search } },
        { primaryGuestEmail: { contains: search } }
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions }
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const bookings = await prisma.hotelBooking.findMany({
      where,
      include: {
        hotel: { select: { id: true, name: true, city: true } },
        roomType: { select: { id: true, name: true, bedType: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return bookings.map(b => ({
      ...b,
      totalAmount: Number(b.totalAmount),
      paidAmount: Number(b.paidAmount),
      remainingAmount: Math.max(0, Number(b.totalAmount) - Number(b.paidAmount))
    }));
  }

  /**
   * Cancel hotel booking and restore room inventory
   */
  async cancelHotelBooking(bookingId, userId = null, reason = '') {
    const where = { id: bookingId, deletedAt: null };
    if (userId) where.userId = userId;

    const booking = await prisma.hotelBooking.findFirst({ where });
    if (!booking) {
      const error = new Error('Rezervasiya tapılmadı.');
      error.statusCode = 404;
      throw error;
    }

    if (booking.status === 'CANCELLED') {
      return booking;
    }

    // Restore room availability in transaction
    const updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.hotelBooking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason || 'Müştəri tərəfindən ləğv edildi'
        }
      });

      const stepDate = new Date(booking.checkInDate);
      while (stepDate < booking.checkOutDate) {
        const dateObj = new Date(stepDate);
        const entry = await tx.roomAvailabilityCalendar.findUnique({
          where: {
            roomTypeId_date: {
              roomTypeId: booking.roomTypeId,
              date: dateObj
            }
          }
        });

        if (entry) {
          await tx.roomAvailabilityCalendar.update({
            where: { id: entry.id },
            data: {
              availableCount: entry.availableCount + booking.roomsCount
            }
          });
        }
        stepDate.setDate(stepDate.getDate() + 1);
      }

      return cancelled;
    });

    return updated;
  }

  /**
   * Pay remaining balance for hotel booking
   */
  async payHotelBalance(bookingId, token, paymentDetails = {}) {
    const booking = await prisma.hotelBooking.findUnique({
      where: { id: bookingId },
      include: { hotel: true, roomType: true }
    });

    if (!booking) {
      const error = new Error('Rezervasiya tapılmadı.');
      error.statusCode = 404;
      throw error;
    }

    if (booking.balanceToken !== token) {
      const error = new Error('Təhlükəsizlik tokeni etibarsızdır.');
      error.statusCode = 403;
      throw error;
    }

    const total = Number(booking.totalAmount);
    const paid = Number(booking.paidAmount);
    const remaining = Math.max(0, total - paid);

    if (remaining <= 0) {
      return {
        success: true,
        message: 'Bu rezervasiyanın bütün ödənişi artıq tamamlanıb.',
        booking
      };
    }

    const updated = await prisma.hotelBooking.update({
      where: { id: bookingId },
      data: {
        paidAmount: total,
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        paymentMethod: paymentDetails.paymentMethod || booking.paymentMethod,
        installmentMonths: paymentDetails.installmentMonths ? parseInt(paymentDetails.installmentMonths, 10) : booking.installmentMonths,
      }
    });

    // Send confirmation
    try {
      await whatsappProvider.sendMessage({
        to: booking.primaryGuestPhone,
        text: `Hörmətli ${booking.primaryGuestName}, *${booking.hotel.name}* üçün qalan ${remaining} AZN qalıq ödənişiniz uğurla qəbul edildi! 🎉\n\n` +
          `Otel rezervasiyanız tam təsdiqləndi. Girişdə QR vauçerinizi təqdim etməyiniz kifayətdir:\n` +
          `http://localhost:5173/hotels/voucher/${booking.id}\n\n` +
          `Xoş istirahətlər! — *TOURSALES*`,
        templateName: 'hotel_balance_paid_confirmation',
        bookingId: booking.id
      });
    } catch (err) {
      console.error('[WhatsApp] Qalıq təsdiq mesajı xətası:', err);
    }

    return {
      success: true,
      paidAmount: remaining,
      totalPaid: total,
      booking: updated
    };
  }
}

export default new HotelBookingsService();
