import prisma from '../../config/db.js';
import ApiError from '../../core/api.error.js';

class SeatService {
  constructor() {
    // Memory / Redis Seat Locks: { "TOUR_ID:SEAT_NUM": { userId, expiresAt } }
    this.seatLocks = new Map();
  }

  // 1. Tur üçün avtobus oturacaq matrisinin alınması
  async getSeatMatrix(tourId) {
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include: { bookings: { where: { status: { in: ['CONFIRMED', 'PENDING'] } } } }
    });

    if (!tour) throw ApiError.notFound('Tur tapılmadı.');
    if (tour.type !== 'DOMESTIC') throw ApiError.badRequest('Oturacaq matrisi yalnız daxili turlar üçün keçərlidir.');

    const totalSeats = tour.busCapacity || tour.maxParticipants || 48;

    // Satılmış / Bron edilmiş oturacaqlar
    const bookedSeats = new Set();
    tour.bookings.forEach(b => {
      if (b.busSeatNumber) {
        b.busSeatNumber.split(',').forEach(s => bookedSeats.add(parseInt(s.trim())));
      }
    });

    const now = Date.now();
    const matrix = [];

    for (let i = 1; i <= totalSeats; i++) {
      const lockKey = `${tourId}:${i}`;
      const lock = this.seatLocks.get(lockKey);

      let status = 'AVAILABLE';
      let lockedBy = null;

      if (bookedSeats.has(i)) {
        status = 'BOOKED';
      } else if (lock && lock.expiresAt > now) {
        status = 'LOCKED';
        lockedBy = lock.userId;
      } else if (lock && lock.expiresAt <= now) {
        this.seatLocks.delete(lockKey); // Müddəti bitmiş kilidi silirik
      }

      matrix.push({ seatNumber: i, status, lockedBy });
    }

    return { tourId, busCapacity: totalSeats, matrix };
  }

  // 2. Real-vaxt Oturacaq Kilidlənməsi (Concurrency Prevention / Lock)
  async lockSeat(tourId, seatNumber, userId) {
    const seatNum = parseInt(seatNumber);
    const lockKey = `${tourId}:${seatNum}`;
    const now = Date.now();

    // 1. Öncə Verilənlər Bazasında bron olunub-olunmadığını yoxlayırıq
    const existingBooking = await prisma.booking.findFirst({
      where: {
        tourId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        busSeatNumber: { contains: String(seatNum) }
      }
    });

    if (existingBooking) {
      throw ApiError.conflict(`Oturacaq #${seatNum} artıq bron olunub.`);
    }

    // 2. Aktiv kilid yoxlanışı
    const lock = this.seatLocks.get(lockKey);
    if (lock && lock.expiresAt > now && lock.userId !== userId) {
      throw ApiError.conflict(`Oturacaq #${seatNum} hal-hazırda başqa istifadəçi tərəfindən kilidlənib.`);
    }

    // 3. 5 dəqiqəlik temporary kilid qoyulur
    const expiresAt = now + 5 * 60 * 1000;
    this.seatLocks.set(lockKey, { userId, expiresAt });

    return { tourId, seatNumber: seatNum, status: 'LOCKED', userId, expiresAt: new Date(expiresAt) };
  }

  // 3. Oturacaq kilidinin azad edilməsi
  async releaseSeat(tourId, seatNumber, userId) {
    const seatNum = parseInt(seatNumber);
    const lockKey = `${tourId}:${seatNum}`;
    const lock = this.seatLocks.get(lockKey);

    if (lock && lock.userId === userId) {
      this.seatLocks.delete(lockKey);
      return { tourId, seatNumber: seatNum, status: 'RELEASED' };
    }

    return { tourId, seatNumber: seatNum, status: 'NOT_LOCKED' };
  }
}

export const seatService = new SeatService();
export default seatService;
