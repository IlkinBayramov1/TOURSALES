import crypto from 'crypto';
import prisma from '../../config/db.js';
import env from '../../config/env.js';
import ApiError from '../../core/api.error.js';

class VoucherService {
  constructor() {
    this.secretKey = env.JWT_SECRET || 'toursales_voucher_secret_key';
  }

  // 1. QR Kod şifrələnməsi (Cryptographic QR Payload Generation)
  generateQrToken(bookingId) {
    const payload = JSON.stringify({ bookingId, ts: Date.now() });
    const hmac = crypto.createHmac('sha256', this.secretKey).update(payload).digest('hex');
    const token = Buffer.from(payload).toString('base64') + '.' + hmac;
    return token;
  }

  // 2. QR Kod Bilet Doğrulanması (Voucher Verification)
  async verifyVoucherToken(token) {
    try {
      const [base64Payload, hmac] = token.split('.');
      if (!base64Payload || !hmac) throw ApiError.badRequest('Keçərsiz QR bilet strukturu.');

      const payloadStr = Buffer.from(base64Payload, 'base64').toString('utf-8');
      const expectedHmac = crypto.createHmac('sha256', this.secretKey).update(payloadStr).digest('hex');

      if (hmac !== expectedHmac) {
        throw ApiError.unauthorized('Saxta və ya dəyişdirilmiş bilet QR kodu!');
      }

      const { bookingId } = JSON.parse(payloadStr);

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          tour: true,
          company: true
        }
      });

      if (!booking) throw ApiError.notFound('Bilet tapılmadı.');

      return {
        valid: true,
        bookingId: booking.id,
        passenger: `${booking.passengerName} ${booking.passengerSurname}`,
        passport: booking.passengerPassport || 'Yoxdur',
        tourTitle: booking.tour.title,
        tourDate: booking.tour.startDate,
        seats: booking.seats,
        busSeatNumber: booking.busSeatNumber || 'Təyin edilməyib',
        paymentStatus: booking.paymentStatus,
        companyName: booking.company.name,
        verifiedAt: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.badRequest('QR biletinin doğrulanması uğursuz oldu.');
    }
  }

  // 3. Voucher PDF Metadata və QR Token Generasiyası
  async getVoucherDetails(bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tour: true, company: true }
    });

    if (!booking) throw ApiError.notFound('Rezervasiya tapılmadı.');

    const qrToken = this.generateQrToken(bookingId);

    return {
      voucherId: `VCH-${booking.id}`,
      bookingId: booking.id,
      company: {
        name: booking.company.name,
        phone: booking.company.phoneNumber,
        email: booking.company.email
      },
      passenger: {
        name: `${booking.passengerName} ${booking.passengerSurname}`,
        phone: booking.contactNumber,
        email: booking.contactEmail,
        passport: booking.passengerPassport
      },
      tour: {
        title: booking.tour.title,
        startDate: booking.tour.startDate,
        meetingPoint: booking.tour.meetingPointAddress,
        type: booking.tour.type
      },
      seats: booking.seats,
      busSeatNumber: booking.busSeatNumber,
      qrToken,
      qrVerificationUrl: `https://toursales.az/verify-voucher?token=${encodeURIComponent(qrToken)}`
    };
  }
}

export const voucherService = new VoucherService();
export default voucherService;
