import crypto from 'crypto';
import prisma from '../../config/db.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import { generateExcel } from '../../utils/excel-generator.js';
import ApiError from '../../core/api.error.js';
import notificationsService from '../notifications/notifications.service.js';
import whatsappProvider from '../notifications/whatsapp.provider.js';
import ledgerService from '../finance/ledger.service.js';
import riskEngine from '../security/risk.engine.js';

class BookingsService {
  async getAll(filters = {}, companyId = null) {
    const { tourType, paymentStatus, channel, startDate, endDate, search } = filters;

    const where = {
      deletedAt: null
    };

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
      where.tour = { type: tourType, deletedAt: null };
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
        tour: {
          select: {
            id: true,
            title: true,
            type: true,
            startDate: true,
            endDate: true,
            meetingPointAddress: true,
            busPlateNumber: true,
            driverName: true,
            driverPhone: true
          }
        },
        company: {
          select: { id: true, name: true }
        }
      },
      orderBy: { bookingDate: 'desc' }
    });
  }

  async getById(id, companyId = null) {
    const booking = await prisma.booking.findFirst({
      where: { id, deletedAt: null },
      include: {
        tour: {
          include: {
            company: true,
            guide: {
              select: { id: true, name: true, email: true, phoneNumber: true }
            }
          }
        },
        company: true,
        transactions: true
      }
    });

    if (!booking) return null;
    if (companyId && booking.companyId !== companyId) {
      throw ApiError.forbidden('Bu rezervasiyaya baxmaq üçün icazəniz yoxdur.');
    }
    return booking;
  }

  async create(data, companyId = null, bookingChannel = 'PLATFORM', files = []) {
    const requestedSeats = parseInt(data.seats, 10);
    if (isNaN(requestedSeats) || requestedSeats <= 0) {
      throw ApiError.badRequest('Oturacaq sayı müsbət ədəd olmalıdır.');
    }

    const tour = await prisma.tour.findFirst({
      where: { id: data.tourId, deletedAt: null },
      include: { company: { include: { plan: true } } }
    });

    if (!tour) throw ApiError.notFound('Tur tapılmadı.');

    const targetCompanyId = companyId || tour.companyId;

    const customer = await prisma.user.findFirst({
      where: { email: data.contactEmail, deletedAt: null }
    });

    // ID Generasiyası
    const id = await generateUniqueId('TR', 'booking');

    // Dinamik qiymətləndirmə (Early Bird & Surge Pricing)
    const now = new Date();
    const startDate = new Date(tour.startDate);
    const diffMs = startDate - now;
    const daysLeft = diffMs / (1000 * 60 * 60 * 24);

    const rawPrice = Number(tour.price);
    let activePrice = rawPrice;
    
    const initialConfirmedBookings = await prisma.booking.findMany({
      where: { tourId: data.tourId, status: 'CONFIRMED', deletedAt: null }
    });
    const initialSoldSeats = initialConfirmedBookings.reduce((sum, b) => sum + b.seats, 0);

    if (daysLeft >= 30) {
      activePrice = Math.round(rawPrice * 0.8 * 100) / 100; // 20% endirim (Erkən)
    } else {
      const occupancyPercent = tour.maxParticipants > 0 ? (initialSoldSeats / tour.maxParticipants) * 100 : 0;
      if (daysLeft <= 3 && daysLeft >= 0 && occupancyPercent >= 90) {
        activePrice = Math.round(rawPrice * 1.3 * 100) / 100; // 30% artım (Surge)
      }
    }

    const totalAmount = activePrice * requestedSeats;
    
    // FinTech 30/70 Depozit Hesablanması
    const isDeposit = data.paymentType === 'DEPOSIT';
    const depositPercentage = Number(tour.depositPercentage || 30.0);
    const depositAmount = isDeposit ? Math.round(((totalAmount * depositPercentage) / 100) * 100) / 100 : totalAmount;

    const isPendingPayment = data.paymentStatus === 'PENDING';
    const paidAmount = isPendingPayment 
      ? 0.0 
      : (data.paidAmount !== undefined ? parseFloat(data.paidAmount) : (isDeposit ? depositAmount : totalAmount));
    const remainingAmount = isPendingPayment 
      ? totalAmount 
      : Math.max(0, totalAmount - paidAmount);
    const paymentStatus = isPendingPayment 
      ? 'PENDING' 
      : (paidAmount >= totalAmount ? 'PAID' : (paidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING'));

    if (!isPendingPayment && !isDeposit && paidAmount < totalAmount) {
      throw ApiError.badRequest(`Sistemdə nisyə/borc bron rejimi mövcud deyil. Tam ödənilməli məbləğ: ${totalAmount} AZN`);
    }

    let depositDueDate = null;
    let balanceToken = null;
    if (isDeposit) {
      const dueDays = tour.depositDueDaysBefore !== undefined ? parseInt(tour.depositDueDaysBefore, 10) : 5;
      depositDueDate = new Date(startDate.getTime() - (dueDays * 24 * 60 * 60 * 1000));
      balanceToken = crypto.randomBytes(24).toString('hex');
    }

    // Fraud & Risk Evaluation
    const userBookingCount = customer ? await prisma.booking.count({ where: { contactEmail: data.contactEmail } }) : 0;
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentBookingsIn10Min = await prisma.booking.count({
      where: { contactEmail: data.contactEmail, createdAt: { gte: tenMinutesAgo } }
    });

    const riskAssessment = riskEngine.evaluateBookingRisk({
      email: data.contactEmail,
      amount: totalAmount,
      userBookingCount,
      recentBookingsIn10Min
    });

    if (riskAssessment.action === 'REJECT') {
      throw ApiError.forbidden(`Təhlükəsizlik xəbərdarlığı: Rezervasiya fırıldaqçılıq riskinə görə rədd edildi (${riskAssessment.reasons.join(', ')}).`);
    }

    // Avtobus oturacaq nömrəsi təyini
    let busSeatNumber = null;
    if (data.busSeatNumber) {
      busSeatNumber = String(data.busSeatNumber);
    } else if (Array.isArray(data.seatNumbers) && data.seatNumbers.length > 0) {
      busSeatNumber = data.seatNumbers.join(',');
    } else if (Array.isArray(data.passengers) && data.passengers.length > 0) {
      busSeatNumber = data.passengers.map(p => p.seatNumber).filter(Boolean).join(',');
    }

    const documentPaths = files.map(file => file.path);

    const plan = tour.company.plan;
    const commissionRate = plan 
      ? Number(tour.type === 'DOMESTIC' ? plan.domesticCommission : plan.foreignCommission)
      : 10.0; 

    const commissionAmount = (paidAmount * commissionRate) / 100;
    const netAmount = paidAmount - commissionAmount;

    const passengersData = Array.isArray(data.passengers)
      ? JSON.stringify(data.passengers)
      : (data.passengersData || null);

    // --- DOUBLE DEFENSE CONCURRENCY LOCKING INSIDE ATOMIC TRANSACTION ---
    const result = await prisma.$transaction(async (tx) => {
      const activeBookings = await tx.booking.findMany({
        where: { tourId: data.tourId, status: { in: ['CONFIRMED', 'PENDING'] }, deletedAt: null }
      });
      const currentSoldSeats = activeBookings.reduce((sum, b) => sum + b.seats, 0);

      if (currentSoldSeats + requestedSeats > tour.maxParticipants) {
        const available = Math.max(0, tour.maxParticipants - currentSoldSeats);
        throw ApiError.badRequest(`Kifayət qədər boş yer yoxdur (Paralel sifariş). Qalan yer sayı: ${available}`);
      }

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
          status: isPendingPayment ? 'PENDING' : 'CONFIRMED',
          paymentStatus,
          paymentType: isDeposit ? 'DEPOSIT' : 'FULL',
          paidAmount,
          remainingAmount,
          totalAmount,
          depositDueDate,
          depositPaidAt: isDeposit && paidAmount > 0 ? new Date() : null,
          balanceToken,
          installmentMonths: parseInt(data.installmentMonths, 10) || 1,
          installmentCardType: data.installmentCardType || null,
          passengersData,
          documents: JSON.stringify(documentPaths),
          bookingChannel
        }
      });

      if (paidAmount > 0) {
        const txId = await generateUniqueId('TX', 'transaction');
        await tx.transaction.create({
          data: {
            id: txId,
            companyId: targetCompanyId,
            bookingId: id,
            type: isDeposit ? 'TICKET_SALE_DEPOSIT' : 'TICKET_SALE',
            amount: paidAmount,
            commission: commissionAmount,
            netAmount: netAmount,
            status: 'Completed',
            description: `${tour.title} turu üçün ${isDeposit ? '30% Depozit' : 'Bilet'} satışı.`
          }
        });

        // İkiqat Yazılışlı Maliyyə Baş Kitabında (Financial Ledger) qeydiyyat
        await ledgerService.recordBookingSale({
          bookingId: id,
          companyId: targetCompanyId,
          totalAmount: paidAmount,
          commissionAmount: commissionAmount,
          netAmount: netAmount,
          description: `${tour.title} turu üçün ${isDeposit ? '30% Depozit' : 'Tam Ödənişli'} Bilet Satışı`
        }, tx);

        await tx.company.update({
          where: { id: targetCompanyId },
          data: {
            availableBalance: { increment: netAmount }
          }
        });
      }

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

    notificationsService.send({
      userId: customer?.id || null,
      type: 'BOOKING_CONFIRMED',
      title: 'Rezervasiyanız təsdiqləndi',
      message: `${tour.title} turu üçün ${requestedSeats} yerlik biletiniz uğurla bron edildi. Bilet ID: ${id}`,
      email: data.contactEmail
    });

    // Avtomatik WhatsApp Bilet və ya Depozit Təsdiqi
    if (isDeposit && paidAmount > 0) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const balancePaymentUrl = `${frontendUrl}/pay/balance/${result.id}?token=${balanceToken}`;
      const dueDateStr = depositDueDate ? depositDueDate.toLocaleDateString('az-AZ') : 'Turdan 5 gün əvvəl';
      whatsappProvider.sendWhatsAppMessage({
        to: result.contactNumber,
        templateName: 'deposit_confirmation',
        bodyText: `Hörmətli ${result.passengerName}, ${tour.title} turu üçün ${paidAmount} AZN məbləğində 30% depozit ödənişiniz qəbul edildi! Yerləriniz bron olundu. Qalan ${remainingAmount} AZN məbləğin son ödəniş tarixi: ${dueDateStr}. Qalıq ödəniş linkiniz: ${balancePaymentUrl}`,
        bookingId: result.id
      }).catch(err => console.error('[WhatsApp Deposit Notification Error]', err.message));
    } else {
      whatsappProvider.sendBookingConfirmation(result, tour).catch((err) => {
        console.error('[WhatsApp Booking Notification Error]', err.message);
      });
    }

    return result;
  }

  async cancelBooking(bookingId, reqUser = null) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      include: { 
        tour: true, 
        company: { include: { plan: true } }
      }
    });

    if (!booking) throw ApiError.notFound('Rezervasiya tapılmadı.');

    if (booking.status === 'CANCELLED') {
      throw ApiError.badRequest('Bu rezervasiya artıq ləğv edilib.');
    }

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

    const plan = booking.company.plan;
    const commissionRate = plan 
      ? Number(booking.tour.type === 'DOMESTIC' ? plan.domesticCommission : plan.foreignCommission)
      : 10.0;

    const refundCommission = (refundAmount * commissionRate) / 100;
    const refundNet = refundAmount - refundCommission;

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED', paymentStatus: refundPercent === 100 ? 'REFUNDED' : 'PARTIALLY_REFUNDED' }
      });

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

        await ledgerService.recordReversalEntry({
          originalJournalId: bookingId,
          bookingId: bookingId,
          companyId: booking.companyId,
          refundAmount: refundAmount,
          reason: `${booking.tour.title} turu ləğv olunduğu üçün refund reversal`
        }, tx);

        await tx.company.update({
          where: { id: booking.companyId },
          data: {
            availableBalance: { decrement: refundNet }
          }
        });
      }

      const user = await tx.user.findFirst({
        where: { email: booking.contactEmail, deletedAt: null }
      });
      if (user) {
        const pointsDeducted = booking.tour.type === 'DOMESTIC' ? 10 : 20;
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

    const nextInLine = await prisma.waitingList.findFirst({
      where: { tourId: booking.tourId },
      orderBy: { createdAt: 'asc' },
      include: { user: true }
    });

    if (nextInLine && nextInLine.user && !nextInLine.user.deletedAt) {
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
      tourTitle: b.tour ? b.tour.title : 'N/A',
      tourId: b.tourId,
      bookingDate: b.bookingDate.toISOString().split('T')[0],
      paymentStatus: b.paymentStatus,
      seats: b.seats,
      paidAmount: b.paidAmount,
      remainingAmount: b.remainingAmount,
      bookingChannel: b.bookingChannel
    }));

    return generateExcel(formattedData, columns, 'Rezervasiyalar');
  }

  // --- VENDOR SPECIFIC METHODS ---

  async getVendorBookings(companyId, query = {}) {
    const { tourId, status, search } = query;

    const where = {
      companyId,
      deletedAt: null
    };

    if (tourId) where.tourId = tourId;
    if (status) {
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
        { id: { contains: search } },
        { passengerName: { contains: search } },
        { passengerSurname: { contains: search } },
        { contactNumber: { contains: search } },
        { contactEmail: { contains: search } }
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

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        tour: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            meetingPointAddress: true,
            destinationCountry: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return bookings.map((b) => {
      let passList = [];
      if (b.passengersData) {
        try { passList = JSON.parse(b.passengersData); } catch (e) {}
      }

      if (!passList || passList.length === 0) {
        const seatNum = parseInt(b.busSeatNumber, 10) || 1;
        passList = [{
          seatNumber: seatNum,
          fullName: `${b.passengerName} ${b.passengerSurname}`,
          phone: b.contactNumber,
          finCode: b.passengerPassport || '',
          isCheckedIn: b.isCheckedIn
        }];
      }

      const totalAmount = Number(b.totalAmount || 0);
      const paidAmount = Number(b.paidAmount || 0);
      const remainingAmount = Number(b.remainingAmount !== null && b.remainingAmount !== undefined ? b.remainingAmount : Math.max(0, totalAmount - paidAmount));

      return {
        id: b.id,
        bookingNumber: b.id,
        userId: b.contactEmail,
        passengerName: b.passengerName,
        passengerSurname: b.passengerSurname,
        passengerPassport: b.passengerPassport || '',
        contactNumber: b.contactNumber,
        contactEmail: b.contactEmail,
        tourId: b.tourId,
        tourTitle: b.tour ? b.tour.title : 'Tur',
        tourStartDate: b.tour?.startDate,
        tourEndDate: b.tour?.endDate,
        companyId: b.companyId,
        seats: b.seats || 1,
        busSeatNumber: b.busSeatNumber,
        totalAmount,
        totalPrice: totalAmount,
        paidAmount,
        remainingAmount,
        paymentType: b.paymentType || 'FULL',
        depositDueDate: b.depositDueDate ? b.depositDueDate.toISOString() : null,
        depositPaidAt: b.depositPaidAt ? b.depositPaidAt.toISOString() : null,
        balancePaidAt: b.balancePaidAt ? b.balancePaidAt.toISOString() : null,
        balanceToken: b.balanceToken,
        installmentMonths: b.installmentMonths || 1,
        installmentCardType: b.installmentCardType,
        currency: 'AZN',
        status: b.status,
        paymentMethod: b.installmentCardType || 'BIRBANK',
        paymentStatus: b.paymentStatus,
        bookingChannel: b.bookingChannel || 'PLATFORM',
        documents: b.documents,
        passengers: passList,
        isCheckedIn: b.isCheckedIn,
        checkedInAt: b.checkedInAt ? b.checkedInAt.toISOString() : null,
        checkedInBy: b.checkedInBy,
        qrToken: b.qrToken || b.id,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString()
      };
    });
  }

  async getVendorStats(companyId) {
    const bookings = await prisma.booking.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        status: true,
        seats: true,
        totalAmount: true,
        isCheckedIn: true,
        passengersData: true
      }
    });

    const totalBookings = bookings.length;
    let totalPassengers = 0;
    let checkedInCount = 0;
    let totalRevenue = 0;

    for (const b of bookings) {
      if (b.status === 'CONFIRMED' || b.status === 'COMPLETED') {
        totalRevenue += Number(b.totalAmount || 0);
      }

      let passList = [];
      if (b.passengersData) {
        try { passList = JSON.parse(b.passengersData); } catch (e) {}
      }

      if (passList.length > 0) {
        totalPassengers += passList.length;
        checkedInCount += passList.filter(p => p.isCheckedIn).length;
      } else {
        totalPassengers += b.seats || 1;
        if (b.isCheckedIn) {
          checkedInCount += b.seats || 1;
        }
      }
    }

    const checkedInRate = totalPassengers > 0 ? Math.round((checkedInCount / totalPassengers) * 100) : 0;

    return {
      totalBookings,
      totalPassengers,
      checkedInCount,
      checkedInRate,
      totalRevenue: Math.round(totalRevenue * 100) / 100
    };
  }

  async getVendorBookingById(id, companyId) {
    const b = await prisma.booking.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        tour: true,
        company: { select: { id: true, name: true, phoneNumber: true, email: true } }
      }
    });

    if (!b) return null;

    let passList = [];
    if (b.passengersData) {
      try { passList = JSON.parse(b.passengersData); } catch (e) {}
    }

    if (!passList || passList.length === 0) {
      const seatNum = parseInt(b.busSeatNumber, 10) || 1;
      passList = [{
        seatNumber: seatNum,
        fullName: `${b.passengerName} ${b.passengerSurname}`,
        phone: b.contactNumber,
        finCode: b.passengerPassport || '',
        isCheckedIn: b.isCheckedIn
      }];
    }

    const totalAmount = Number(b.totalAmount || 0);
    const paidAmount = Number(b.paidAmount || 0);
    const remainingAmount = Number(b.remainingAmount !== null && b.remainingAmount !== undefined ? b.remainingAmount : Math.max(0, totalAmount - paidAmount));

    return {
      id: b.id,
      bookingNumber: b.id,
      userId: b.contactEmail,
      passengerName: b.passengerName,
      passengerSurname: b.passengerSurname,
      passengerPassport: b.passengerPassport || '',
      contactNumber: b.contactNumber,
      contactEmail: b.contactEmail,
      tourId: b.tourId,
      tourTitle: b.tour ? b.tour.title : 'Tur',
      tourStartDate: b.tour?.startDate,
      tourEndDate: b.tour?.endDate,
      meetingPointAddress: b.tour?.meetingPointAddress || '',
      busPlateNumber: b.tour?.busPlateNumber || '',
      driverName: b.tour?.driverName || '',
      driverPhone: b.tour?.driverPhone || '',
      departureNotes: b.tour?.departureNotes || '',
      companyId: b.companyId,
      companyName: b.company?.name,
      companyPhone: b.company?.phoneNumber || '',
      seats: b.seats || 1,
      busSeatNumber: b.busSeatNumber,
      totalAmount,
      totalPrice: totalAmount,
      paidAmount,
      remainingAmount,
      paymentType: b.paymentType || 'FULL',
      depositDueDate: b.depositDueDate ? b.depositDueDate.toISOString() : null,
      depositPaidAt: b.depositPaidAt ? b.depositPaidAt.toISOString() : null,
      balancePaidAt: b.balancePaidAt ? b.balancePaidAt.toISOString() : null,
      balanceToken: b.balanceToken,
      installmentMonths: b.installmentMonths || 1,
      installmentCardType: b.installmentCardType,
      currency: 'AZN',
      status: b.status,
      paymentMethod: b.installmentCardType || 'BIRBANK',
      paymentStatus: b.paymentStatus,
      bookingChannel: b.bookingChannel || 'PLATFORM',
      documents: b.documents,
      passengers: passList,
      isCheckedIn: b.isCheckedIn,
      checkedInAt: b.checkedInAt ? b.checkedInAt.toISOString() : null,
      checkedInBy: b.checkedInBy,
      qrToken: b.qrToken || b.id,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString()
    };
  }

  async getVendorRoster(tourId, companyId) {
    const tour = await prisma.tour.findFirst({
      where: { id: tourId, companyId, deletedAt: null }
    });
    if (!tour) {
      throw ApiError.notFound('Tur tapılmadı və ya bu şirkətə aid deyil.');
    }

    const bookings = await prisma.booking.findMany({
      where: {
        tourId,
        companyId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        deletedAt: null
      },
      orderBy: { createdAt: 'asc' }
    });

    const roster = [];
    for (const b of bookings) {
      let passList = [];
      if (b.passengersData) {
        try { passList = JSON.parse(b.passengersData); } catch (e) {}
      }

      const totalAmount = Number(b.totalAmount || 0);
      const paidAmount = Number(b.paidAmount || 0);
      const remainingAmount = Number(b.remainingAmount !== null && b.remainingAmount !== undefined ? b.remainingAmount : Math.max(0, totalAmount - paidAmount));
      const isFullyPaid = b.paymentStatus === 'PAID' || remainingAmount === 0;

      if (passList.length > 0) {
        passList.forEach((p, idx) => {
          roster.push({
            id: `${b.id}-${p.seatNumber || idx + 1}`,
            bookingId: b.id,
            bookingNumber: b.id,
            seatNumber: p.seatNumber || idx + 1,
            fullName: p.fullName || `${b.passengerName} ${b.passengerSurname}`,
            phone: p.phone || b.contactNumber,
            finCode: p.finCode || b.passengerPassport || '',
            status: b.status,
            paymentStatus: b.paymentStatus,
            paymentType: b.paymentType || 'FULL',
            totalAmount,
            paidAmount,
            remainingAmount,
            isFullyPaid,
            hasRemainingDebt: remainingAmount > 0,
            isCheckedIn: p.isCheckedIn !== undefined ? p.isCheckedIn : b.isCheckedIn,
            checkedInAt: b.checkedInAt
          });
        });
      } else {
        const seats = b.seats || 1;
        const baseSeat = parseInt(b.busSeatNumber, 10) || 1;
        for (let i = 0; i < seats; i++) {
          roster.push({
            id: `${b.id}-${baseSeat + i}`,
            bookingId: b.id,
            bookingNumber: b.id,
            seatNumber: baseSeat + i,
            fullName: i === 0 ? `${b.passengerName} ${b.passengerSurname}` : `${b.passengerName} ${b.passengerSurname} (${i + 1})`,
            phone: b.contactNumber,
            finCode: b.passengerPassport || '',
            status: b.status,
            paymentStatus: b.paymentStatus,
            paymentType: b.paymentType || 'FULL',
            totalAmount,
            paidAmount,
            remainingAmount,
            isFullyPaid,
            hasRemainingDebt: remainingAmount > 0,
            isCheckedIn: b.isCheckedIn,
            checkedInAt: b.checkedInAt
          });
        }
      }
    }

    roster.sort((a, b) => a.seatNumber - b.seatNumber);
    return roster;
  }

  async checkInTicket(payload, companyId, userId) {
    const searchVal = (payload.qrToken || payload.bookingNumber || '').trim();
    if (!searchVal) {
      throw ApiError.badRequest('Bilet nömrəsi və ya QR kod təqdim edilməlidir.');
    }

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { id: searchVal },
          { qrToken: searchVal }
        ],
        companyId,
        deletedAt: null
      },
      include: { tour: true }
    });

    if (!booking) {
      throw ApiError.notFound('Bilet tapılmadı və ya bu şirkətə aid deyil.');
    }

    if (booking.status === 'CANCELLED') {
      throw ApiError.badRequest('Bu bilet ləğv edilib! Minik icazəsi verilmir.');
    }

    const alreadyCheckedIn = booking.isCheckedIn;

    let passList = [];
    if (booking.passengersData) {
      try { passList = JSON.parse(booking.passengersData); } catch (e) {}
    }

    let seatNumbers = [];
    let passengerNames = [];

    if (passList.length > 0) {
      passList = passList.map(p => ({ ...p, isCheckedIn: true }));
      seatNumbers = passList.map(p => p.seatNumber);
      passengerNames = passList.map(p => p.fullName);
    } else {
      seatNumbers = [parseInt(booking.busSeatNumber, 10) || 1];
      passengerNames = [`${booking.passengerName} ${booking.passengerSurname}`];
    }

    const now = new Date();
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        isCheckedIn: true,
        checkedInAt: now,
        checkedInBy: userId || 'VENDOR',
        passengersData: passList.length > 0 ? JSON.stringify(passList) : booking.passengersData
      }
    });

    return {
      verified: true,
      alreadyCheckedIn,
      bookingNumber: booking.id,
      passengerNames,
      seatNumbers,
      checkedInAt: now.toISOString(),
      tourTitle: booking.tour ? booking.tour.title : 'Tur'
    };
  }

  async toggleCheckIn(bookingId, passengerSeat, companyId, userId) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, companyId, deletedAt: null }
    });
    if (!booking) {
      throw ApiError.notFound('Bilet tapılmadı.');
    }

    let newCheckedIn = !booking.isCheckedIn;
    let passList = [];
    if (booking.passengersData) {
      try { passList = JSON.parse(booking.passengersData); } catch (e) {}
    }

    if (passList.length > 0 && passengerSeat !== undefined) {
      const seatNum = parseInt(passengerSeat, 10);
      const target = passList.find(p => p.seatNumber === seatNum);
      if (target) {
        target.isCheckedIn = !target.isCheckedIn;
        newCheckedIn = target.isCheckedIn;
      }
      const allChecked = passList.every(p => p.isCheckedIn);
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          isCheckedIn: allChecked,
          checkedInAt: newCheckedIn ? new Date() : null,
          checkedInBy: newCheckedIn ? userId : null,
          passengersData: JSON.stringify(passList)
        }
      });
    } else {
      if (passList.length > 0) {
        passList = passList.map(p => ({ ...p, isCheckedIn: newCheckedIn }));
      }
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          isCheckedIn: newCheckedIn,
          checkedInAt: newCheckedIn ? new Date() : null,
          checkedInBy: newCheckedIn ? userId : null,
          passengersData: passList.length > 0 ? JSON.stringify(passList) : booking.passengersData
        }
      });
    }

    return { isCheckedIn: newCheckedIn, checkedInAt: newCheckedIn ? new Date().toISOString() : null };
  }

  async exportVendorRosterToExcel(tourId, companyId) {
    const tour = await prisma.tour.findFirst({
      where: { id: tourId, companyId, deletedAt: null }
    });
    if (!tour) throw ApiError.notFound('Tur tapılmadı.');

    const roster = await this.getVendorRoster(tourId, companyId);

    const columns = [
      { header: 'Yer №', key: 'seatNumber', width: 10 },
      { header: 'Sərnişin Ad Soyad', key: 'fullName', width: 28 },
      { header: 'Telefon Nömrəsi', key: 'phone', width: 18 },
      { header: 'FİN Kod (Ş/V)', key: 'finCode', width: 16 },
      { header: 'Bilet №', key: 'bookingNumber', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Minik Qeydiyyatı', key: 'checkInStatus', width: 18 }
    ];

    const formattedData = roster.map(r => ({
      seatNumber: r.seatNumber,
      fullName: r.fullName,
      phone: r.phone,
      finCode: r.finCode || '—',
      bookingNumber: r.bookingNumber,
      status: r.status === 'CONFIRMED' ? 'Təsdiqlənib' : r.status,
      checkInStatus: r.isCheckedIn ? '✓ Mindirildi' : 'Gözləyir'
    }));

    return generateExcel(formattedData, columns, `Manifest`);
  }

  async getMyBookings(userEmail, userId = null) {
    if (!userEmail && !userId) {
      return [];
    }

    const where = {
      deletedAt: null,
      OR: [
        { contactEmail: userEmail }
      ]
    };

    return prisma.booking.findMany({
      where,
      include: {
        tour: true,
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            phoneNumber: true,
            rating: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async cancelBooking(bookingId, user, reason = '') {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      include: { tour: true, company: true }
    });

    if (!booking) {
      throw ApiError.notFound('Rezervasiya tapılmadı.');
    }

    // Permission check
    const isOwner = user && (booking.contactEmail === user.email || booking.passengerName?.toLowerCase() === user.name?.toLowerCase());
    const isCompanyStaff = user && user.companyId === booking.companyId;
    const isSuperAdmin = user && user.role === 'SuperAdmin';

    if (!isOwner && !isCompanyStaff && !isSuperAdmin) {
      throw ApiError.forbidden('Bu rezervasiyanı ləğv etmək hüququnuz yoxdur.');
    }

    if (booking.status === 'CANCELLED') {
      throw ApiError.badRequest('Bu rezervasiya artıq ləğv edilmişdir.');
    }

    // Dynamic penalty calculation based on time left until departure
    const now = new Date();
    const startDate = new Date(booking.tour.startDate);
    const diffHours = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercent = 0;
    if (diffHours >= 72) {
      refundPercent = 100; // >= 3 days: 100% full refund
    } else if (diffHours >= 24) {
      refundPercent = 70;  // 24-72 hours: 70% refund (30% penalty)
    } else if (diffHours > 0) {
      refundPercent = 30;  // < 24 hours: 30% refund (70% penalty)
    } else {
      refundPercent = 0;   // Tour already started/completed: 0% refund
    }

    const paid = Number(booking.paidAmount || 0);
    const refundAmount = Number(((paid * refundPercent) / 100).toFixed(2));
    const penaltyAmount = Number((paid - refundAmount).toFixed(2));

    return prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          deleteReason: reason || 'Müştəri tərəfindən ləğv edildi',
          deletedAt: null
        },
        include: { tour: true, company: true }
      });

      if (refundAmount > 0) {
        const txId = await generateUniqueId('TX', 'transaction');
        await tx.transaction.create({
          data: {
            id: txId,
            companyId: booking.companyId,
            bookingId: booking.id,
            type: 'REFUND',
            amount: refundAmount,
            commission: 0,
            netAmount: -refundAmount,
            status: 'Completed',
            description: `${booking.tour.title} turu ləğv edildi. Geri qaytarma (${refundPercent}%): ${refundAmount} AZN`
          }
        });
      }

        return {
        bookingId: updated.id,
        status: updated.status,
        tourTitle: booking.tour.title,
        paidAmount: paid,
        refundPercent,
        refundAmount,
        penaltyAmount
      };
    });
  }

  // =========================================================================
  // FAZA 1: BƏLƏDÇİ MOBİL QR MANİFEST & CHECK-IN SİSTEMİ
  // =========================================================================

  async getGuideTours(userId, companyId, agencyRole) {
    const where = {
      deletedAt: null
    };

    if (companyId) {
      where.companyId = companyId;
    }

    if (agencyRole === 'GUIDE') {
      where.OR = [
        { guideId: userId },
        { guideId: null }
      ];
    }

    const tours = await prisma.tour.findMany({
      where,
      include: {
        bookings: {
          where: { status: 'CONFIRMED', deletedAt: null }
        },
        guide: {
          select: { id: true, name: true, phoneNumber: true, email: true }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    return tours.map((t) => {
      let totalBookedSeats = 0;
      let checkedInCount = 0;

      t.bookings.forEach((b) => {
        let passList = [];
        if (b.passengersData) {
          try { passList = JSON.parse(b.passengersData); } catch (e) {}
        }
        if (passList.length > 0) {
          totalBookedSeats += passList.length;
          checkedInCount += passList.filter((p) => p.isCheckedIn).length;
        } else {
          totalBookedSeats += (b.seats || 1);
          if (b.isCheckedIn) checkedInCount += (b.seats || 1);
        }
      });

      const capacity = t.busCapacity || t.maxParticipants || 48;
      const progressPercent = totalBookedSeats > 0 ? Math.round((checkedInCount / totalBookedSeats) * 100) : 0;

      return {
        id: t.id,
        title: t.title,
        type: t.type,
        startDate: t.startDate,
        endDate: t.endDate,
        meetingPointAddress: t.meetingPointAddress || 'Gənclik m/s',
        busCapacity: capacity,
        busPlateNumber: t.busPlateNumber || '99-XX-000',
        driverName: t.driverName || 'Təyin olunub',
        driverPhone: t.driverPhone || '',
        departureNotes: t.departureNotes || '',
        guideId: t.guideId,
        guide: t.guide,
        totalBookedSeats,
        checkedInCount,
        pendingCount: Math.max(0, totalBookedSeats - checkedInCount),
        progressPercent
      };
    });
  }

  async getGuideManifest(tourId, companyId) {
    const tour = await prisma.tour.findFirst({
      where: { id: tourId, deletedAt: null },
      include: {
        guide: {
          select: { id: true, name: true, phoneNumber: true, email: true }
        }
      }
    });

    if (!tour) {
      throw ApiError.notFound('Tur tapılmadı.');
    }

    if (companyId && tour.companyId !== companyId) {
      throw ApiError.forbidden('Bu turun manifestinə baxmaq hüququnuz yoxdur.');
    }

    const bookings = await prisma.booking.findMany({
      where: {
        tourId,
        status: 'CONFIRMED',
        deletedAt: null
      },
      orderBy: [{ busSeatNumber: 'asc' }, { createdAt: 'asc' }]
    });

    const capacity = tour.busCapacity || tour.maxParticipants || 48;
    const seatMap = [];
    const passengers = [];
    const seatAllocation = new Map();

    let totalRevenue = 0;
    let totalDebtAmount = 0;
    let debtorCount = 0;

    bookings.forEach((b) => {
      let passList = [];
      if (b.passengersData) {
        try { passList = JSON.parse(b.passengersData); } catch (e) {}
      }

      const totalAmount = Number(b.totalAmount || 0);
      const paidAmount = Number(b.paidAmount || 0);
      const remainingBalance = Math.max(0, Math.round((totalAmount - paidAmount) * 100) / 100);
      const isFullyPaid = b.paymentStatus === 'PAID' || remainingBalance === 0;
      const paymentStatus = b.paymentStatus || (remainingBalance === 0 ? 'PAID' : 'PENDING');
      const specialNotes = b.specialRequests || b.notes || null;

      totalRevenue += totalAmount;
      if (remainingBalance > 0) {
        totalDebtAmount += remainingBalance;
        debtorCount++;
      }

      if (passList.length > 0) {
        passList.forEach((p) => {
          const seatNum = parseInt(p.seatNumber, 10) || 1;
          const passObj = {
            seatNumber: seatNum,
            fullName: p.fullName || `${b.passengerName} ${b.passengerSurname}`,
            phone: p.phone || b.contactNumber,
            finCode: p.finCode || '',
            isCheckedIn: !!p.isCheckedIn,
            bookingId: b.id,
            qrToken: b.qrToken,
            paymentStatus,
            totalAmount,
            paidAmount,
            remainingBalance,
            isFullyPaid,
            hasRemainingDebt: remainingBalance > 0,
            specialNotes,
            checkedInAt: b.checkedInAt,
            checkedInBy: b.checkedInBy
          };
          passengers.push(passObj);
          seatAllocation.set(seatNum, passObj);
        });
      } else {
        const seatNum = parseInt(b.busSeatNumber, 10) || 1;
        const passObj = {
          seatNumber: seatNum,
          fullName: `${b.passengerName} ${b.passengerSurname}`,
          phone: b.contactNumber,
          finCode: b.passengerPassport || '',
          isCheckedIn: !!b.isCheckedIn,
          bookingId: b.id,
          qrToken: b.qrToken,
          paymentStatus,
          totalAmount,
          paidAmount,
          remainingBalance,
          isFullyPaid,
          hasRemainingDebt: remainingBalance > 0,
          specialNotes,
          checkedInAt: b.checkedInAt,
          checkedInBy: b.checkedInBy
        };
        passengers.push(passObj);
        seatAllocation.set(seatNum, passObj);
      }
    });

    for (let s = 1; s <= capacity; s++) {
      if (seatAllocation.has(s)) {
        const p = seatAllocation.get(s);
        seatMap.push({
          seatNumber: s,
          status: p.isCheckedIn ? 'CHECKED_IN' : 'RESERVED',
          passenger: p
        });
      } else {
        seatMap.push({
          seatNumber: s,
          status: 'EMPTY',
          passenger: null
        });
      }
    }

    const totalBookedSeats = passengers.length;
    const checkedInCount = passengers.filter((p) => p.isCheckedIn).length;
    const pendingCount = Math.max(0, totalBookedSeats - checkedInCount);
    const progressPercentage = totalBookedSeats > 0 ? Math.round((checkedInCount / totalBookedSeats) * 100) : 0;

    return {
      tour: {
        id: tour.id,
        title: tour.title,
        type: tour.type,
        startDate: tour.startDate,
        endDate: tour.endDate,
        meetingPointAddress: tour.meetingPointAddress || 'Gənclik m/s',
        meetingPointLat: tour.meetingPointLat,
        meetingPointLng: tour.meetingPointLng,
        busCapacity: capacity,
        busPlateNumber: tour.busPlateNumber || '99-XX-000',
        driverName: tour.driverName || 'Təyin olunub',
        driverPhone: tour.driverPhone || '',
        departureNotes: tour.departureNotes || '',
        guide: tour.guide
      },
      stats: {
        totalCapacity: capacity,
        totalBookedSeats,
        checkedInCount,
        pendingCount,
        progressPercentage,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalDebtAmount: Math.round(totalDebtAmount * 100) / 100,
        debtorCount
      },
      seatMap,
      passengers: passengers.sort((a, b) => a.seatNumber - b.seatNumber)
    };
  }

  async scanQrCheckIn({ qrToken, bookingId, tourId }, guideId, guideName, companyId) {
    const token = (qrToken || bookingId || '').trim();
    if (!token) {
      throw ApiError.badRequest('QR token və ya bilet ID təqdim edilməlidir.');
    }

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { qrToken: token },
          { id: token }
        ],
        deletedAt: null
      },
      include: { tour: true }
    });

    if (!booking) {
      throw ApiError.notFound('Bilet tapılmadı və ya etibarsızdır.');
    }

    if (companyId && booking.companyId !== companyId) {
      throw ApiError.forbidden('Bu bilet sizin şirkətinizə aid deyil.');
    }

    if (tourId && booking.tourId !== tourId) {
      throw ApiError.badRequest(`Bu bilet cari tura aid deyil! (Gözlənilən: "${booking.tour?.title || booking.tourId}")`);
    }

    if (booking.status === 'CANCELLED') {
      throw ApiError.badRequest('Bu bilet ləğv edilib! Minik icazəsi verilmir.');
    }

    let passList = [];
    if (booking.passengersData) {
      try { passList = JSON.parse(booking.passengersData); } catch (e) {}
    }

    const alreadyCheckedIn = booking.isCheckedIn || (passList.length > 0 && passList.every((p) => p.isCheckedIn));

    let seatNumbers = [];
    let passengerNames = [];

    if (passList.length > 0) {
      seatNumbers = passList.map((p) => p.seatNumber);
      passengerNames = passList.map((p) => p.fullName);
      passList = passList.map((p) => ({ ...p, isCheckedIn: true }));
    } else {
      seatNumbers = [parseInt(booking.busSeatNumber, 10) || 1];
      passengerNames = [`${booking.passengerName} ${booking.passengerSurname}`];
    }

    if (alreadyCheckedIn) {
      return {
        success: false,
        isDuplicate: true,
        message: 'Diqqət: Bu bilet artıq minik qeydiyyatından keçib!',
        checkedInAt: booking.checkedInAt,
        checkedInBy: booking.checkedInBy,
        bookingNumber: booking.id,
        passengerNames,
        seatNumbers,
        tourTitle: booking.tour?.title
      };
    }

    const now = new Date();
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        isCheckedIn: true,
        checkedInAt: now,
        checkedInBy: guideName || guideId || 'Bələdçi',
        passengersData: passList.length > 0 ? JSON.stringify(passList) : booking.passengersData
      }
    });

    // Real-vaxt rejimində ofisə və abunəçilərə yayım
    notificationsService.broadcastPassengerCheckIn({
      tourId: booking.tourId,
      bookingId: booking.id,
      seatNumbers,
      passengerNames,
      checkedInAt: now.toISOString(),
      checkedInBy: guideName || 'Bələdçi'
    });

    return {
      success: true,
      verified: true,
      isDuplicate: false,
      bookingNumber: booking.id,
      passengerNames,
      seatNumbers,
      checkedInAt: now.toISOString(),
      checkedInBy: guideName || 'Bələdçi',
      tourTitle: booking.tour?.title
    };
  }

  async toggleGuideCheckIn(bookingId, passengerSeat, guideId, guideName, companyId) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      include: { tour: true }
    });

    if (!booking) {
      throw ApiError.notFound('Bilet tapılmadı.');
    }

    if (companyId && booking.companyId !== companyId) {
      throw ApiError.forbidden('Bu bilet sizin şirkətinizə aid deyil.');
    }

    let passList = [];
    if (booking.passengersData) {
      try { passList = JSON.parse(booking.passengersData); } catch (e) {}
    }

    let isNowChecked = !booking.isCheckedIn;
    const seatNum = passengerSeat !== undefined ? parseInt(passengerSeat, 10) : null;

    if (passList.length > 0 && seatNum !== null) {
      const target = passList.find((p) => p.seatNumber === seatNum);
      if (target) {
        target.isCheckedIn = !target.isCheckedIn;
        isNowChecked = target.isCheckedIn;
      }
      const allChecked = passList.every((p) => p.isCheckedIn);
      const anyChecked = passList.some((p) => p.isCheckedIn);

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          isCheckedIn: allChecked || anyChecked,
          checkedInAt: isNowChecked ? new Date() : (anyChecked ? booking.checkedInAt : null),
          checkedInBy: isNowChecked ? (guideName || guideId) : (anyChecked ? booking.checkedInBy : null),
          passengersData: JSON.stringify(passList)
        }
      });
    } else {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          isCheckedIn: isNowChecked,
          checkedInAt: isNowChecked ? new Date() : null,
          checkedInBy: isNowChecked ? (guideName || guideId) : null
        }
      });
    }

    const now = new Date();
    notificationsService.broadcastPassengerCheckIn({
      tourId: booking.tourId,
      bookingId: booking.id,
      seatNumbers: seatNum ? [seatNum] : [parseInt(booking.busSeatNumber, 10) || 1],
      isCheckedIn: isNowChecked,
      checkedInAt: isNowChecked ? now.toISOString() : null,
      checkedInBy: guideName || 'Bələdçi'
    });

    return {
      success: true,
      bookingId: booking.id,
      seatNumber: seatNum,
      isCheckedIn: isNowChecked
    };
  }

  async syncOfflineCheckIns(tourId, checkInItems = [], guideId, guideName, companyId) {
    let syncedCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const item of checkInItems) {
      try {
        await this.scanQrCheckIn(
          { qrToken: item.qrToken || item.bookingId, tourId },
          guideId,
          guideName,
          companyId
        );
        syncedCount++;
      } catch (err) {
        failedCount++;
        errors.push({ token: item.qrToken || item.bookingId, error: err.message });
      }
    }

    return {
      success: true,
      syncedCount,
      failedCount,
      errors
    };
  }

  async sendBookingWhatsApp(bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tour: { include: { guide: true } } }
    });
    if (!booking) throw ApiError.notFound('Bilet tapılmadı.');

    return whatsappProvider.sendBookingConfirmation(booking, booking.tour);
  }

  async sendBalanceReminderWhatsApp(bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tour: true }
    });
    if (!booking) throw ApiError.notFound('Rezervasiya tapılmadı.');
    if (booking.paymentStatus === 'PAID') {
      throw ApiError.badRequest('Bu rezervasiya artıq tam ödənilmişdir.');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const balancePaymentUrl = `${frontendUrl}/pay/balance/${booking.id}?token=${booking.balanceToken}`;
    const dueDateStr = booking.depositDueDate ? new Date(booking.depositDueDate).toLocaleDateString('az-AZ') : 'Turdan 5 gün əvvəl';

    return whatsappProvider.sendWhatsAppMessage({
      to: booking.contactNumber,
      templateName: 'deposit_reminder_manual',
      bodyText: `Hörmətli ${booking.passengerName}, ${booking.tour.title} turu üçün qalan ${Number(booking.remainingAmount)} AZN qalıq məbləğin son ödəniş tarixi: ${dueDateStr}. Təhlükəsiz qalıq ödəniş linkiniz: ${balancePaymentUrl}`,
      bookingId: booking.id
    });
  }

  /**
   * Get staff members that can be assigned as guides
   */
  async getCompanyGuides(companyId) {
    if (!companyId) return [];

    return prisma.user.findMany({
      where: {
        companyId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        agencyRole: true
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Assign guide and operational details to a tour
   */
  async assignGuideToTour(tourId, {
    guideId = null,
    driverName,
    driverPhone,
    busPlateNumber,
    meetingPointAddress,
    departureNotes
  }, companyId) {
    const tour = await prisma.tour.findFirst({
      where: { id: tourId, deletedAt: null }
    });

    if (!tour) {
      throw ApiError.notFound('Tur tapılmadı.');
    }

    if (companyId && tour.companyId !== companyId) {
      throw ApiError.forbidden('Bu tura bələdçi təyin etmək hüququnuz yoxdur.');
    }

    if (guideId) {
      const guideUser = await prisma.user.findUnique({
        where: { id: guideId }
      });
      if (!guideUser) {
        throw ApiError.badRequest('Təyin edilən bələdçi tapılmadı.');
      }
    }

    const data = {};
    if (guideId !== undefined) data.guideId = guideId || null;
    if (driverName !== undefined) data.driverName = driverName;
    if (driverPhone !== undefined) data.driverPhone = driverPhone;
    if (busPlateNumber !== undefined) data.busPlateNumber = busPlateNumber;
    if (meetingPointAddress !== undefined) data.meetingPointAddress = meetingPointAddress;
    if (departureNotes !== undefined) data.departureNotes = departureNotes;

    const updatedTour = await prisma.tour.update({
      where: { id: tourId },
      data,
      include: {
        guide: {
          select: { id: true, name: true, phoneNumber: true, email: true }
        }
      }
    });

    return updatedTour;
  }

  /**
   * Bulk check-in passengers for a tour
   */
  async bulkCheckIn(tourId, bookingIds = null, guideId, guideName, companyId) {
    const tour = await prisma.tour.findFirst({
      where: { id: tourId, deletedAt: null }
    });

    if (!tour) {
      throw ApiError.notFound('Tur tapılmadı.');
    }

    if (companyId && tour.companyId !== companyId) {
      throw ApiError.forbidden('Bu turun sərnişinlərini təsdiqləmək hüququnuz yoxdur.');
    }

    const where = {
      tourId,
      status: 'CONFIRMED',
      deletedAt: null
    };

    if (Array.isArray(bookingIds) && bookingIds.length > 0) {
      where.id = { in: bookingIds };
    }

    const bookings = await prisma.booking.findMany({ where });
    let totalCheckedIn = 0;
    const now = new Date();

    for (const b of bookings) {
      let passList = [];
      if (b.passengersData) {
        try { passList = JSON.parse(b.passengersData); } catch (e) {}
      }

      if (passList.length > 0) {
        passList = passList.map(p => ({ ...p, isCheckedIn: true }));
        totalCheckedIn += passList.length;
      } else {
        totalCheckedIn += (b.seats || 1);
      }

      await prisma.booking.update({
        where: { id: b.id },
        data: {
          isCheckedIn: true,
          checkedInAt: now,
          checkedInBy: guideName || guideId || 'Bələdçi',
          passengersData: passList.length > 0 ? JSON.stringify(passList) : b.passengersData
        }
      });
    }

    notificationsService.broadcastPassengerCheckIn({
      tourId,
      bookingId: 'BULK_ALL',
      seatNumbers: [],
      passengerNames: ['Hamısı'],
      isCheckedIn: true,
      checkedInAt: now.toISOString(),
      checkedInBy: guideName || 'Bələdçi'
    });

    return {
      success: true,
      checkedInCount: totalCheckedIn,
      message: `${totalCheckedIn} sərnişin uğurla mindirildi olaraq qeyd edildi.`
    };
  }

  /**
   * Export guide manifest to Excel
   */
  async exportGuideManifest(tourId, companyId) {
    const manifest = await this.getGuideManifest(tourId, companyId);
    const { tour, passengers } = manifest;

    const columns = [
      { header: 'Yer №', key: 'seatNumber', width: 10 },
      { header: 'Sərnişin Ad Soyad', key: 'fullName', width: 28 },
      { header: 'Telefon Nömrəsi', key: 'phone', width: 18 },
      { header: 'FİN Kod', key: 'finCode', width: 14 },
      { header: 'Bilet №', key: 'bookingNumber', width: 16 },
      { header: 'Minik Qeydiyyatı', key: 'checkInStatus', width: 18 },
      { header: 'Minik Vaxtı', key: 'checkedInAt', width: 20 },
      { header: 'Ödəniş Statusu', key: 'paymentStatus', width: 16 },
      { header: 'Ümumi Məbləğ (AZN)', key: 'totalAmount', width: 18 },
      { header: 'Ödənilmiş (AZN)', key: 'paidAmount', width: 16 },
      { header: 'Qalıq Borc (AZN)', key: 'remainingBalance', width: 16 },
    ];

    const formattedData = passengers.map(p => ({
      seatNumber: p.seatNumber,
      fullName: p.fullName,
      phone: p.phone,
      finCode: p.finCode || '—',
      bookingNumber: p.bookingId,
      checkInStatus: p.isCheckedIn ? '✓ Mindirildi' : 'Gözləyir',
      checkedInAt: p.checkedInAt ? new Date(p.checkedInAt).toLocaleString('az-AZ') : '—',
      paymentStatus: p.paymentStatus === 'PAID' ? 'Tam Ödənilib' : (p.remainingBalance > 0 ? 'Qalıq Borc Var' : p.paymentStatus),
      totalAmount: p.totalAmount,
      paidAmount: p.paidAmount,
      remainingBalance: p.remainingBalance > 0 ? `${p.remainingBalance} AZN` : '0 AZN'
    }));

    return generateExcel(formattedData, columns, `Manifest`);
  }
}

export const bookingsService = new BookingsService();
export default bookingsService;
