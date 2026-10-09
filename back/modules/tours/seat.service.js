import prisma from '../../config/db.js';
import ApiError from '../../core/api.error.js';
import notificationsService from '../notifications/notifications.service.js';

class SeatService {
  constructor() {
    // In-memory seat locks storage: { "TOUR_ID:SEAT_NUM": { userId, expiresAt } }
    this.seatLocks = new Map();

    // Start background auto-sweeper for expired locks every 10 seconds
    this.sweeperInterval = setInterval(() => {
      this.cleanupExpiredLocks();
    }, 10000);
    if (this.sweeperInterval.unref) {
      this.sweeperInterval.unref(); // Don't hold node process open on exit
    }
  }

  /**
   * Periodic sweeper: identifies expired locks, removes them and broadcasts release
   */
  cleanupExpiredLocks() {
    const now = Date.now();
    const expiredByTour = new Map(); // tourId -> [seatNumbers]

    for (const [lockKey, lock] of this.seatLocks.entries()) {
      if (lock.expiresAt <= now) {
        this.seatLocks.delete(lockKey);
        const [tourId, seatStr] = lockKey.split(':');
        const seatNum = parseInt(seatStr, 10);
        if (!expiredByTour.has(tourId)) {
          expiredByTour.set(tourId, []);
        }
        expiredByTour.get(tourId).push(seatNum);
      }
    }

    // Broadcast expired seats release to room subscribers
    for (const [tourId, seats] of expiredByTour.entries()) {
      if (seats.length > 0) {
        notificationsService.broadcastSeatReleased(tourId, seats);
      }
    }
  }

  // 1. Tur üçün avtobus oturacaq matrisinin alınması
  async getSeatMatrix(tourId) {
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include: { bookings: { where: { status: { in: ['CONFIRMED', 'PENDING'] }, deletedAt: null } } }
    });

    if (!tour) throw ApiError.notFound('Tur tapılmadı.');

    const totalSeats = tour.busCapacity || tour.maxParticipants || (tour.type === 'DOMESTIC' ? 48 : 30);

    // Satılmış / Bron edilmiş oturacaqlar
    const bookedSeats = new Set();
    tour.bookings.forEach((b) => {
      if (b.busSeatNumber) {
        b.busSeatNumber.split(',').forEach((s) => {
          const parsed = parseInt(s.trim(), 10);
          if (!isNaN(parsed)) bookedSeats.add(parsed);
        });
      }
    });

    const now = Date.now();
    const matrix = [];

    for (let i = 1; i <= totalSeats; i++) {
      const lockKey = `${tourId}:${i}`;
      const lock = this.seatLocks.get(lockKey);

      let status = 'AVAILABLE';
      let lockedBy = null;
      let isVendorHold = false;
      let holdReason = null;

      if (bookedSeats.has(i)) {
        status = 'BOOKED';
      } else if (lock && lock.expiresAt > now) {
        status = 'LOCKED';
        lockedBy = lock.userId;
        isVendorHold = !!lock.isVendorHold;
        holdReason = lock.reason || null;
      } else if (lock && lock.expiresAt <= now) {
        this.seatLocks.delete(lockKey); // Müddəti bitmiş kilidi dərhal silirik
      }

      matrix.push({
        seatNumber: i,
        row: Math.ceil(i / 4),
        column: ((i - 1) % 4) + 1,
        status,
        lockedBy,
        isVendorHold,
        holdReason
      });
    }

    const availableSeats = matrix.filter((s) => s.status === 'AVAILABLE').length;
    const busType = totalSeats <= 20 ? 'SPRINTER' : 'STANDARD_48';

    return {
      tourId,
      busCapacity: totalSeats,
      totalSeats,
      availableSeats,
      busType,
      seats: matrix,
      matrix
    };
  }

  /**
   * 2. Qrup / Toplu Oturacaqların Atomik Kilidlənməsi (Batch Atomic Locking)
   * Bütün seçilmiş yerlər ya tam kilidlənir, ya da biri belə məşğuldursa heç biri kilidlənmir.
   */
  async lockSeats(tourId, seatNumbers, userId, durationSeconds = 300) {
    if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      throw ApiError.badRequest('Oturacaq nömrələri massiv şəklində daxil edilməlidir.');
    }

    const parsedSeats = seatNumbers.map((s) => parseInt(s, 10)).filter((n) => !isNaN(n) && n > 0);
    if (parsedSeats.length === 0) {
      throw ApiError.badRequest('Etibarlı oturacaq nömrəsi tapılmadı.');
    }

    // 1. Öncə Verilənlər Bazasında artıq bron olunmuş yerləri yoxlayırıq
    const existingBookings = await prisma.booking.findMany({
      where: {
        tourId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        deletedAt: null
      },
      select: { busSeatNumber: true }
    });

    const bookedSeats = new Set();
    existingBookings.forEach((b) => {
      if (b.busSeatNumber) {
        b.busSeatNumber.split(',').forEach((s) => {
          const parsed = parseInt(s.trim(), 10);
          if (!isNaN(parsed)) bookedSeats.add(parsed);
        });
      }
    });

    const now = Date.now();
    const conflictedSeats = [];

    for (const seatNum of parsedSeats) {
      if (bookedSeats.has(seatNum)) {
        conflictedSeats.push({ seatNumber: seatNum, reason: 'ALREADY_BOOKED' });
        continue;
      }

      const lockKey = `${tourId}:${seatNum}`;
      const lock = this.seatLocks.get(lockKey);
      if (lock && lock.expiresAt > now && lock.userId !== userId) {
        conflictedSeats.push({ seatNumber: seatNum, reason: 'LOCKED_BY_OTHER_USER' });
      }
    }

    if (conflictedSeats.length > 0) {
      const conflictNums = conflictedSeats.map((c) => `#${c.seatNumber}`).join(', ');
      throw ApiError.conflict(`Seçilmiş oturacaqlardan bəziləri artıq məşğuldur: ${conflictNums}`);
    }

    // 2. Atomik kilidləmə: Bütün yerləri eyni vaxtda qeydə alırıq
    const expiresAt = new Date(now + durationSeconds * 1000);
    const lockedRecords = [];

    for (const seatNum of parsedSeats) {
      const lockKey = `${tourId}:${seatNum}`;
      this.seatLocks.set(lockKey, { userId, expiresAt: expiresAt.getTime() });
      lockedRecords.push({ seatNumber: seatNum, status: 'LOCKED', userId, expiresAt });
    }

    // 3. WebSocket vasitəsilə otaq iştirakçılarına anlıq elan edirik
    notificationsService.broadcastSeatLocked(tourId, parsedSeats, userId, expiresAt);

    return {
      tourId,
      seatNumbers: parsedSeats,
      status: 'LOCKED',
      userId,
      expiresAt,
      lockTimeRemaining: durationSeconds
    };
  }

  // Tək oturacaq üçün geriyə uyğunluq (Backward compatible)
  async lockSeat(tourId, seatNumber, userId, durationSeconds = 300) {
    const res = await this.lockSeats(tourId, [seatNumber], userId, durationSeconds);
    return {
      tourId,
      seatNumber: res.seatNumbers[0],
      status: 'LOCKED',
      userId,
      expiresAt: res.expiresAt
    };
  }

  /**
   * 3. Qrup / Toplu Oturacaq Kilidlərinin Azad Edilməsi
   */
  async releaseSeats(tourId, seatNumbers, userId) {
    if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return { tourId, releasedSeats: [], status: 'NO_SEATS_SPECIFIED' };
    }

    const parsedSeats = seatNumbers.map((s) => parseInt(s, 10)).filter((n) => !isNaN(n) && n > 0);
    const released = [];

    for (const seatNum of parsedSeats) {
      const lockKey = `${tourId}:${seatNum}`;
      const lock = this.seatLocks.get(lockKey);

      // Yalnız öz kilidlədiyi və ya müddəti bitmiş kilidi aça bilər
      if (lock && (lock.userId === userId || lock.expiresAt <= Date.now() || !userId)) {
        this.seatLocks.delete(lockKey);
        released.push(seatNum);
      }
    }

    if (released.length > 0) {
      notificationsService.broadcastSeatReleased(tourId, released);
    }

    return {
      tourId,
      releasedSeats: released,
      status: released.length > 0 ? 'RELEASED' : 'NOT_LOCKED'
    };
  }

  // Tək oturacaq üçün geriyə uyğunluq
  async releaseSeat(tourId, seatNumber, userId) {
    const res = await this.releaseSeats(tourId, [seatNumber], userId);
    return {
      tourId,
      seatNumber: parseInt(seatNumber, 10),
      status: res.releasedSeats.length > 0 ? 'RELEASED' : 'NOT_LOCKED'
    };
  }

  /**
   * 4. Kilid Müddətini Uzatma (Heartbeat / Extend Lock)
   * Müştəri sifariş formasını doldurarkən taymeri yeniləmək üçün
   */
  async extendSeatLock(tourId, seatNumbers, userId, extensionSeconds = 300) {
    const parsedSeats = (Array.isArray(seatNumbers) ? seatNumbers : [seatNumbers])
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n) && n > 0);

    const now = Date.now();
    const newExpiresAt = new Date(now + extensionSeconds * 1000);
    const extendedSeats = [];

    for (const seatNum of parsedSeats) {
      const lockKey = `${tourId}:${seatNum}`;
      const lock = this.seatLocks.get(lockKey);
      if (lock && lock.userId === userId) {
        lock.expiresAt = newExpiresAt.getTime();
        extendedSeats.push(seatNum);
      }
    }

    if (extendedSeats.length > 0) {
      notificationsService.broadcastSeatLocked(tourId, extendedSeats, userId, newExpiresAt);
    }

    return {
      tourId,
      extendedSeats,
      expiresAt: newExpiresAt,
      status: extendedSeats.length > 0 ? 'EXTENDED' : 'NOT_FOUND'
    };
  }

  /**
   * 5. Vendor Xidməti Yer Kilidləmə / Açma (Service / VIP Hold Toggle)
   */
  async toggleVendorSeatLock(tourId, seatNumber, reason = 'Xidməti Yer', user = {}) {
    const parsedSeat = parseInt(seatNumber, 10);
    if (isNaN(parsedSeat) || parsedSeat <= 0) {
      throw ApiError.badRequest('Etibarlı oturacaq nömrəsi daxil edilməlidir.');
    }

    const lockKey = `${tourId}:${parsedSeat}`;
    const lock = this.seatLocks.get(lockKey);
    const now = Date.now();

    // Əgər artıq vendor tərəfindən kilidlənibsə, kilidi açırıq (Release)
    if (lock && lock.expiresAt > now && lock.isVendorHold) {
      this.seatLocks.delete(lockKey);
      notificationsService.broadcastSeatReleased(tourId, [parsedSeat]);
      return {
        tourId,
        seatNumber: parsedSeat,
        status: 'AVAILABLE',
        isVendorHold: false,
        message: `#${parsedSeat} nömrəli yer kiliddən azad edildi.`
      };
    }

    // Əgər yer bazada artıq satılıbsa (Booked), kilidləmək olmaz
    const existingBookings = await prisma.booking.findMany({
      where: {
        tourId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        deletedAt: null
      },
      select: { busSeatNumber: true }
    });

    const isBooked = existingBookings.some((b) => {
      if (!b.busSeatNumber) return false;
      return b.busSeatNumber.split(',').some((s) => parseInt(s.trim(), 10) === parsedSeat);
    });

    if (isBooked) {
      throw ApiError.conflict(`#${parsedSeat} nömrəli yer artıq sərnişin tərəfindən bron edilib, xidməti kilidləmə mümkün deyil.`);
    }

    // Xidməti kilidləmə (məs. 30 günlük vendor bloklaması)
    const expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000);
    this.seatLocks.set(lockKey, {
      userId: user.id || 'vendor',
      expiresAt: expiresAt.getTime(),
      isVendorHold: true,
      reason
    });

    notificationsService.broadcastSeatLocked(tourId, [parsedSeat], user.id || 'vendor', expiresAt);
    return {
      tourId,
      seatNumber: parsedSeat,
      status: 'LOCKED',
      isVendorHold: true,
      reason,
      message: `#${parsedSeat} nömrəli yer xidməti kilidləndi (${reason}).`
    };
  }
}

export const seatService = new SeatService();
export default seatService;
