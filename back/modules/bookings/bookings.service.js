import prisma from '../../config/db.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import { generateExcel } from '../../utils/excel-generator.js';
import ApiError from '../../core/api.error.js';
import notificationsService from '../notifications/notifications.service.js';
import ledgerService from '../finance/ledger.service.js';

class BookingsService {
  async getAll(filters = {}, companyId = null) {
    const { tourType, paymentStatus, channel, startDate, endDate, search } = filters;

    const where = {};
    if (companyId) {
      where.companyId = companyId;
    }
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    if (channel) {
      where.bookingChannel = channel;
    }
    if (tourType) {
      where.tour = { type: tourType };
    }
    if (startDate || endDate) {
      where.bookingDate = {};
      if (startDate) where.bookingDate.gte = new Date(startDate);
      if (endDate) where.bookingDate.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { passengerName: { contains: search } },
        { passengerSurname: { contains: search } },
        { contactEmail: { contains: search } }
      ];
    }

    return prisma.booking.findMany({
      where,
      include: {
        tour: true,
        company: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(id, companyId = null) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { tour: true, company: true }
    });

    if (!booking) return null;
    if (companyId && booking.companyId !== companyId) {
      throw ApiError.forbidden('Bu rezervasiyaya baxmaq üçün icazəniz yoxdur.');
    }
    return booking;
  }

  async create(data, companyId = null, bookingChannel = 'PLATFORM', files = []) {
    const tour = await prisma.tour.findUnique({
      where: { id: data.tourId },
      include: { company: { include: { plan: true } } }
    });

    if (!tour) throw ApiError.notFound('Tur tapılmadı.');

    const targetCompanyId = companyId || tour.companyId;

    // --- DEBT LOCK Yoxlanışı (GDPR ilə silinmişlər istisnadır) ---
    const customer = await prisma.user.findUnique({
      where: { email: data.contactEmail }
    });
    if (customer && !customer.email.includes('@anonymized.com')) {
      const overdueDebtBooking = await prisma.booking.findFirst({
        where: {
          contactEmail: customer.email,
          remainingAmount: { gt: 0 },
          tour: {
            startDate: { lt: new Date() }
          }
        }
      });
      if (overdueDebtBooking) {
        throw ApiError.badRequest('Yeni rezervasiya etmək bloklanıb: Sistemdə vaxtı keçmiş ödənilməmiş borcunuz mövcuddur.');
      }
    }

    // Yer doluluğunu yoxlayırıq
    const confirmedBookings = await prisma.booking.findMany({
      where: { tourId: data.tourId, status: 'CONFIRMED' }
    });
    const soldSeats = confirmedBookings.reduce((sum, b) => sum + b.seats, 0);
    const requestedSeats = parseInt(data.seats, 10);

    if (soldSeats + requestedSeats > tour.maxParticipants) {
      throw ApiError.badRequest(`Kifayət qədər boş yer yoxdur. Qalan yer sayı: ${tour.maxParticipants - soldSeats}`);
    }

    // ID Generasiyası
    const id = await generateUniqueId('TR', 'booking');

    // Dinamik qiymətləndirmə (Early Bird & Surge Pricing)
    const now = new Date();
    const startDate = new Date(tour.startDate);
    const diffMs = startDate - now;
    const daysLeft = diffMs / (1000 * 60 * 60 * 24);

    const rawPrice = Number(tour.price);
    let activePrice = rawPrice;
    if (daysLeft >= 30) {
      activePrice = Math.round(rawPrice * 0.8 * 100) / 100; // 20% endirim (Erkən)
    } else {
      const occupancyPercent = tour.maxParticipants > 0 ? (soldSeats / tour.maxParticipants) * 100 : 0;
      if (daysLeft <= 3 && daysLeft >= 0 && occupancyPercent >= 90) {
        activePrice = Math.round(rawPrice * 1.3 * 100) / 100; // 30% artım (Surge)
      }
    }

    const totalAmount = activePrice * requestedSeats;
    const paidAmount = parseFloat(data.paidAmount || 0);
    const remainingAmount = totalAmount - paidAmount;

    let paymentStatus = 'PENDING';
    if (paidAmount >= totalAmount) {
      paymentStatus = 'PAID';
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    }

    // Daxili turlar üçün avtobus oturacaq nömrəsi
    let busSeatNumber = null;
    if (tour.type === 'DOMESTIC') {
      busSeatNumber = data.busSeatNumber || null;
    }

    const documentPaths = files.map(file => file.path);

    const plan = tour.company.plan;
    const commissionRate = plan 
      ? Number(tour.type === 'DOMESTIC' ? plan.domesticCommission : plan.foreignCommission)
      : 10.0; 

    const commissionAmount = (paidAmount * commissionRate) / 100;
    const netAmount = paidAmount - commissionAmount;

    const result = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          id,
          tourId: data.tourId,
          companyId: targetCompanyId,
          passengerName: data.passengerName,
          passengerSurname: data.passengerSurname,
          passengerPassport: data.passengerPassport || null,
          contactNumber: data.contactNumber,
          contactEmail: data.contactEmail,
          seats: requestedSeats,
          busSeatNumber,
          status: 'CONFIRMED',
          paymentStatus,
          paidAmount,
          remainingAmount,
          totalAmount,
          documents: JSON.stringify(documentPaths),
          bookingChannel
        }
      });

      const txId = await generateUniqueId('TX', 'transaction');
      await tx.transaction.create({
        data: {
          id: txId,
          companyId: targetCompanyId,
          bookingId: id,
          type: 'TICKET_SALE',
          amount: paidAmount,
          commission: commissionAmount,
          netAmount: netAmount,
          status: 'Completed',
          description: `${tour.title} turu üçün bilet satışı.`
        }
      });

      // İkiqat Yazılışlı Maliyyə Baş Kitabında (Financial Ledger) qeydiyyat
      if (paidAmount > 0) {
        await ledgerService.recordBookingSale({
          bookingId: id,
          companyId: targetCompanyId,
          totalAmount: paidAmount,
          commissionAmount: commissionAmount,
          netAmount: netAmount,
          description: `${tour.title} turu üçün Bilet Satışı Ledger Yoxlanışı`
        }, tx);
      }

      await tx.company.update({
        where: { id: targetCompanyId },
        data: {
          availableBalance: { increment: netAmount },
          pendingBalance: { increment: remainingAmount }
        }
      });

      if (customer) {
        const pointsEarned = tour.type === 'DOMESTIC' ? 10 : 20;
        await tx.user.update({
          where: { id: customer.id },
          data: { loyaltyPoints: { increment: pointsEarned } }
        });

        const lyhId = await generateUniqueId('LYH', 'loyaltyHistory');
        await tx.loyaltyHistory.create({
          data: {
            id: lyhId,
            userId: customer.id,
            actionType: 'EARNED',
            points: pointsEarned,
            description: `${tour.title} tur rezervasiyasından xal qazanıldı.`
          }
        });
      }

      return newBooking;
    });

    // Uğurlu sifariş anında müştəriyə anlıq WebSocket və email bildirişi göndəririk
    notificationsService.send({
      userId: customer?.id || null,
      type: 'BOOKING_CONFIRMED',
      title: 'Rezervasiyanız təsdiqləndi',
      message: `${tour.title} turu üçün ${requestedSeats} yerlik biletiniz uğurla bron edildi. Bilet ID: ${id}`,
      email: data.contactEmail
    });

    return result;
  }

  async cancelBooking(bookingId, reqUser = null) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        tour: true, 
        company: { include: { plan: true } }
      }
    });

    if (!booking) throw ApiError.notFound('Rezervasiya tapılmadı.');

    if (booking.status === 'CANCELLED') {
      throw ApiError.badRequest('Bu rezervasiya artıq ləğv edilib.');
    }

    // Rol yoxlanışı: Müştəridirsə yalnız öz biletini, Vendor-dursa öz şirkətinin biletini ləğv edə bilər
    if (reqUser) {
      if (reqUser.role === 'User' && booking.contactEmail !== reqUser.email) {
        throw ApiError.forbidden('Yalnız öz rezervasiyanızı ləğv edə bilərsiniz.');
      }
      if (reqUser.role === 'Vendor' && booking.companyId !== reqUser.companyId) {
        throw ApiError.forbidden('Digər şirkətlərə aid rezervasiyaları ləğv edə bilməzsiniz.');
      }
    }

    const now = new Date();
    const tourStart = new Date(booking.tour.startDate);
    const diffMs = tourStart - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    let refundPercent = 100;
    if (diffHours < 0) {
      throw ApiError.badRequest('Başlamış və ya artıq keçmiş turları ləğv etmək olmaz.');
    } else if (diffHours < 24) {
      refundPercent = 0; 
    } else if (diffHours < 72) {
      refundPercent = 50; 
    }

    const paidAmountNum = Number(booking.paidAmount);
    const refundAmount = (paidAmountNum * refundPercent) / 100;

    // Şirkətin abunəlik komissiya dərəcəsi
    const plan = booking.company.plan;
    const commissionRate = plan 
      ? Number(booking.tour.type === 'DOMESTIC' ? plan.domesticCommission : plan.foreignCommission)
      : 10.0;

    // Ləğv edilən məbləğə müvafiq komissiya və xalis məbləğ çıxılır
    const refundCommission = (refundAmount * commissionRate) / 100;
    const refundNet = refundAmount - refundCommission;

    await prisma.$transaction(async (tx) => {
      // 1. Statusu CANCELLED təyin edirik
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED', paymentStatus: refundPercent === 100 ? 'REFUNDED' : 'PARTIALLY_REFUNDED' }
      });

      // 2. Əgər geri qaytarılan məbləğ varsa
      if (refundAmount > 0) {
        const refundTxId = await generateUniqueId('TX', 'transaction');
        await tx.transaction.create({
          data: {
            id: refundTxId,
            companyId: booking.companyId,
            bookingId: bookingId,
            type: 'REFUND',
            amount: -refundAmount,
            commission: -refundCommission,
            netAmount: -refundNet,
            status: 'Completed',
            description: `${booking.tour.title} turu ləğv edildi. Geri ödəmə məbləği (${refundPercent}%): ${refundAmount} AZN`
          }
        });

        // Şirkət balansından atomik olaraq pul geri çıxılır
        await tx.company.update({
          where: { id: booking.companyId },
          data: {
            availableBalance: { decrement: refundNet }
          }
        });
      }

      // Hər bir halda, ödənilməmiş borc məbləği pendingBalance-dən çıxılır (çünki tur ləğv edildi)
      if (booking.remainingAmount > 0) {
        await tx.company.update({
          where: { id: booking.companyId },
          data: {
            pendingBalance: { decrement: booking.remainingAmount }
          }
        });
      }

      // 3. Loyallıq xalını silirik (qazanılan xallar geri hesablanır)
      const user = await tx.user.findUnique({
        where: { email: booking.contactEmail }
      });
      if (user) {
        const pointsDeducted = booking.tour.type === 'DOMESTIC' ? 10 : 20;
        // Xalların mənfi olmaması üçün 0-dan az ola bilməz limit qoyulur
        const finalPoints = Math.max(0, user.loyaltyPoints - pointsDeducted);
        await tx.user.update({
          where: { id: user.id },
          data: { loyaltyPoints: finalPoints }
        });

        const lyhId = await generateUniqueId('LYH', 'loyaltyHistory');
        await tx.loyaltyHistory.create({
          data: {
            id: lyhId,
            userId: user.id,
            actionType: 'SPENT',
            points: pointsDeducted,
            description: `${booking.tour.title} turunun ləğv edilməsi səbəbilə loyallıq xalı silindi.`
          }
        });
      }
    });

    // 4. Waiting List yoxlaması: Boş yer yarandığı üçün növbədəki ilk müştəriyə bildiriş göndəririk
    const nextInLine = await prisma.waitingList.findFirst({
      where: { tourId: booking.tourId },
      orderBy: { createdAt: 'asc' },
      include: { user: true }
    });

    if (nextInLine) {
      notificationsService.send({
        userId: nextInLine.userId,
        type: 'WAITING_LIST_ALERT',
        title: 'Boş yer yaranıb!',
        message: `Növbədə olduğunuz "${booking.tour.title}" turunda boş yer yaranıb. İndi daxil olub rezervasiya edə bilərsiniz.`,
        email: nextInLine.user.email
      });
    }

    return { success: true, refundPercent, refundAmount };
  }

  async exportBookingsToExcel(filters = {}, companyId = null) {
    const bookings = await this.getAll(filters, companyId);

    const columns = [
      { header: 'Bilet ID', key: 'id', width: 15 },
      { header: 'Müştəri Ad Soyad', key: 'passengerName', width: 25 },
      { header: 'Telefon', key: 'contactNumber', width: 15 },
      { header: 'Email', key: 'contactEmail', width: 25 },
      { header: 'Turun Adı', key: 'tourTitle', width: 25 },
      { header: 'Tur ID', key: 'tourId', width: 15 },
      { header: 'Tarix', key: 'bookingDate', width: 15 },
      { header: 'Ödəniş Statusu', key: 'paymentStatus', width: 15 },
      { header: 'Yer Sayı', key: 'seats', width: 10 },
      { header: 'Ödənilən (AZN)', key: 'paidAmount', width: 15 },
      { header: 'Qalıq (AZN)', key: 'remainingAmount', width: 15 },
      { header: 'Platforma Kanalı', key: 'bookingChannel', width: 15 }
    ];

    const formattedData = bookings.map((b) => ({
      id: b.id,
      passengerName: `${b.passengerName} ${b.passengerSurname}`,
      contactNumber: b.contactNumber,
      contactEmail: b.contactEmail,
      tourTitle: b.tour.title,
      tourId: b.tour.id,
      bookingDate: b.bookingDate.toISOString().split('T')[0],
      paymentStatus: b.paymentStatus,
      seats: b.seats,
      paidAmount: b.paidAmount,
      remainingAmount: b.remainingAmount,
      bookingChannel: b.bookingChannel
    }));

    return generateExcel(formattedData, columns, 'Rezervasiyalar');
  }
}

export const bookingsService = new BookingsService();
export default bookingsService;
