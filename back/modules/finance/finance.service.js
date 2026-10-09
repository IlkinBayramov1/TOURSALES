import prisma from '../../config/db.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import { generateExcel } from '../../utils/excel-generator.js';
import ApiError from '../../core/api.error.js';

class FinanceService {
  async getBalances(companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { availableBalance: true, pendingBalance: true }
    });
    if (!company) throw ApiError.notFound('Şirkət tapılmadı.');
    return company;
  }

  async getTransactions(filters = {}, companyId = null) {
    const { type, status, startDate, endDate } = filters;

    const where = {};
    if (companyId) {
      where.companyId = companyId;
    }
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    return prisma.transaction.findMany({
      where,
      include: {
        company: { select: { name: true } },
        booking: { select: { id: true, passengerName: true, passengerSurname: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Vendor payout sorğusu açır (Təkmil IBAN & Hədd yoxlanışı ilə)
  async requestPayout(companyId, amount, bankAccount) {
    const requestedAmount = parseFloat(amount);
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      throw ApiError.badRequest('Məbləğ 0-dan böyük rəqəm olmalıdır.');
    }
    if (requestedAmount < 20) {
      throw ApiError.badRequest('Minimum pul çıxarışı məbləği 20 AZN təşkil edir.');
    }

    const cleanIban = (bankAccount || '').replace(/\s+/g, '').toUpperCase();
    if (!cleanIban || cleanIban.length < 15 || !cleanIban.startsWith('AZ')) {
      throw ApiError.badRequest('Düzgün Azərbaycan bank IBAN hesabı daxil edin (məs: AZ... 28 simvol).');
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw ApiError.notFound('Şirkət tapılmadı.');

    const availableBal = Number(company.availableBalance || 0);
    if (availableBal < requestedAmount) {
      throw ApiError.badRequest(`Balansda kifayət qədər vəsait yoxdur. Mövcud balans: ${availableBal.toFixed(2)} AZN, Tələb olunan: ${requestedAmount.toFixed(2)} AZN`);
    }

    const payoutId = await generateUniqueId('P', 'payout');

    // Atomik olaraq balansı azaldırıq və payout yaradırıq
    return prisma.$transaction(async (tx) => {
      await tx.company.update({
        where: { id: companyId },
        data: {
          availableBalance: { decrement: requestedAmount }
        }
      });

      const payout = await tx.payout.create({
        data: {
          id: payoutId,
          companyId,
          amount: requestedAmount,
          bankAccount: cleanIban,
          status: 'Pending'
        }
      });

      const txId = await generateUniqueId('TX', 'transaction');
      await tx.transaction.create({
        data: {
          id: txId,
          companyId,
          type: 'PAYOUT',
          amount: requestedAmount,
          netAmount: -requestedAmount,
          status: 'Pending',
          description: `Bank hesabına çıxarış sorğusu: ${payoutId} (${cleanIban})`
        }
      });

      return payout;
    });
  }

  // Vendor tərəfindən 'Pending' statuslu çıxarış sorğusunun ləğv edilməsi
  async cancelPayout(companyId, payoutId) {
    const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout || payout.companyId !== companyId) {
      throw ApiError.notFound('Çıxarış sorğusu tapılmadı.');
    }

    if (payout.status.toLowerCase() !== 'pending') {
      throw ApiError.badRequest(`Yalnız gözləmədə olan (Pending) sorğular ləğv edilə bilər. Cari status: ${payout.status}`);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Payout statusunu 'Cancelled' edirik
      const updatedPayout = await tx.payout.update({
        where: { id: payoutId },
        data: { status: 'Cancelled' }
      });

      // 2. Məbləği şirkətin mövcud balansına dərhal qaytarırıq
      await tx.company.update({
        where: { id: companyId },
        data: {
          availableBalance: { increment: payout.amount }
        }
      });

      // 3. Əlaqəli Transaction statusunu 'Cancelled' edirik
      const relatedTx = await tx.transaction.findFirst({
        where: {
          companyId,
          type: 'PAYOUT',
          description: { contains: payoutId }
        }
      });

      if (relatedTx) {
        await tx.transaction.update({
          where: { id: relatedTx.id },
          data: { status: 'Cancelled' }
        });
      }

      return {
        id: updatedPayout.id,
        status: 'CANCELLED',
        refundedAmount: Number(payout.amount),
        message: 'Çıxarış sorğusu uğurla ləğv edildi və vəsait mövcud balansa qaytarıldı.'
      };
    });
  }

  // SuperAdmin payout sorğusunu təsdiqləyir və ya rədd edir
  async processPayout(payoutId, status) {
    if (status !== 'Completed' && status !== 'Failed') {
      throw ApiError.badRequest("Status yalnız 'Completed' və ya 'Failed' ola bilər.");
    }

    const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw ApiError.notFound('Çıxarış sorğusu tapılmadı.');
    if (payout.status !== 'Pending') {
      throw ApiError.badRequest('Bu sorğu artıq emal edilib.');
    }

    return prisma.$transaction(async (tx) => {
      // Payout statusunu yeniləyirik
      const updatedPayout = await tx.payout.update({
        where: { id: payoutId },
        data: { status }
      });

      // Payout-a bağlı olan transaction-ı tapırıq və yeniləyirik
      const transaction = await tx.transaction.findFirst({
        where: { description: { contains: payoutId }, type: 'PAYOUT' }
      });

      if (transaction) {
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status }
        });
      }

      // Əgər payout uğursuz oldusa (Failed), pulu şirkətin mövcud balansına qaytarırıq (refund)
      if (status === 'Failed') {
        await tx.company.update({
          where: { id: payout.companyId },
          data: {
            availableBalance: { increment: payout.amount }
          }
        });
      }

      return updatedPayout;
    });
  }

  async getAllPayouts(filters = {}) {
    const { status } = filters;
    const where = {};
    if (status) {
      where.status = status;
    }
    return prisma.payout.findMany({
      where,
      include: { company: { select: { name: true } } },
      orderBy: { payoutDate: 'desc' }
    });
  }

  async exportTransactionsToExcel(filters = {}, companyId = null) {
    const txs = await this.getTransactions(filters, companyId);

    const columns = [
      { header: 'Tranzaksiya ID', key: 'id', width: 16 },
      { header: 'Şirkət Adı', key: 'companyName', width: 24 },
      { header: 'Növü', key: 'type', width: 16 },
      { header: 'Məbləğ (AZN)', key: 'amount', width: 15 },
      { header: 'Komissiya (AZN)', key: 'commission', width: 16 },
      { header: 'Xalis Gəlir (AZN)', key: 'netAmount', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Rezervasiya / Müştəri', key: 'customer', width: 26 },
      { header: 'Tarix', key: 'createdAt', width: 20 },
      { header: 'Təsvir', key: 'description', width: 36 }
    ];

    const formattedData = txs.map((t) => ({
      id: t.id,
      companyName: t.company?.name || 'C-Vendor',
      type: t.type,
      amount: Number(t.amount || 0).toFixed(2),
      commission: Number(t.commission || 0).toFixed(2),
      netAmount: Number(t.netAmount || 0).toFixed(2),
      status: t.status,
      customer: t.booking ? `${t.booking.passengerName || ''} ${t.booking.passengerSurname || ''} (#${t.booking.id})`.trim() : '—',
      createdAt: t.createdAt ? t.createdAt.toISOString().replace('T', ' ').substring(0, 19) : '',
      description: t.description || ''
    }));

    return generateExcel(formattedData, columns, 'Maliyyə Tarixçəsi');
  }

  // --- VENDOR SPECIFIC FINANCE METHODS ---

  async getVendorOverview(companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        availableBalance: true,
        pendingBalance: true,
        iban: true,
        bankName: true,
        voen: true,
        bankCode: true,
        swiftBic: true
      }
    });

    if (!company) throw ApiError.notFound('Şirkət tapılmadı.');

    const payoutsAgg = await prisma.payout.aggregate({
      where: { companyId, status: 'Completed' },
      _sum: { amount: true }
    });
    const totalWithdrawn = Number(payoutsAgg._sum.amount || 0);

    // Bütün satış növlərinin və qaytarmaların tam hesablanması
    const salesTypes = ['TICKET_SALE', 'TICKET_SALE_DEPOSIT', 'HOTEL_SALE', 'CUSTOM_TOUR_SALE'];
    const txSalesAgg = await prisma.transaction.aggregate({
      where: { companyId, type: { in: salesTypes }, status: 'Completed' },
      _sum: { amount: true, commission: true, netAmount: true }
    });

    const txRefundsAgg = await prisma.transaction.aggregate({
      where: { companyId, type: 'REFUND', status: 'Completed' },
      _sum: { amount: true }
    });
    const totalRefunds = Number(txRefundsAgg._sum.amount || 0);

    const grossSales = Number(txSalesAgg._sum.amount || 0);
    const totalTurnover = Math.max(0, grossSales - totalRefunds);
    const totalCommissions = Number(txSalesAgg._sum.commission || 0);
    const netEarnings = Number(txSalesAgg._sum.netAmount || (grossSales - totalCommissions)) - totalRefunds;

    const now = new Date();
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        companyId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        deletedAt: null,
        tour: { endDate: { gte: now } }
      },
      select: { paidAmount: true, totalAmount: true }
    });
    const calculatedPending = upcomingBookings.reduce((sum, b) => sum + Number(b.paidAmount || b.totalAmount || 0), 0);
    const pendingBalance = Math.max(Number(company.pendingBalance || 0), calculatedPending);

    return {
      availableBalance: Number(company.availableBalance || 0),
      pendingBalance,
      totalWithdrawn,
      totalTurnover,
      totalCommissions,
      netEarnings,
      totalRefunds,
      iban: company.iban || '',
      bankName: company.bankName || '',
      voen: company.voen || '',
      bankCode: company.bankCode || '',
      swiftBic: company.swiftBic || '',
      currency: 'AZN'
    };
  }

  async getVendorTransactions(companyId, query = {}) {
    const { type, status, startDate, endDate, search } = query;
    const where = { companyId };

    if (type && type !== 'ALL') {
      where.type = type;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (search && search.trim()) {
      where.OR = [
        { description: { contains: search.trim() } },
        { id: { contains: search.trim() } },
        { booking: { passengerName: { contains: search.trim() } } },
        { booking: { passengerSurname: { contains: search.trim() } } }
      ];
    }

    const txs = await prisma.transaction.findMany({
      where,
      include: {
        booking: {
          select: {
            id: true,
            passengerName: true,
            passengerSurname: true,
            contactNumber: true,
            passengerPassport: true,
            tour: { select: { id: true, title: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const inflowTypes = ['TICKET_SALE', 'TICKET_SALE_DEPOSIT', 'HOTEL_SALE', 'CUSTOM_TOUR_SALE'];
    const outflowTypes = ['PAYOUT', 'REFUND', 'SUBSCRIPTION', 'AD_PAYMENT', 'EXPENSE'];

    return txs.map((t) => {
      const amountNum = Math.abs(Number(t.amount || 0));
      const netAmountNum = Number(t.netAmount || t.amount || 0);

      let debit = 0;
      let credit = 0;

      if (inflowTypes.includes(t.type)) {
        credit = netAmountNum > 0 ? netAmountNum : amountNum;
        debit = 0;
      } else if (outflowTypes.includes(t.type)) {
        debit = amountNum;
        credit = 0;
      } else {
        if (netAmountNum < 0) {
          debit = Math.abs(netAmountNum);
          credit = 0;
        } else {
          credit = netAmountNum;
          debit = 0;
        }
      }

      let accountName = 'Maliyyə Əməliyyatı';
      if (t.type === 'TICKET_SALE') accountName = 'Tur Bilet Satışı';
      else if (t.type === 'TICKET_SALE_DEPOSIT') accountName = 'Tur Depozit Ödənişi';
      else if (t.type === 'HOTEL_SALE') accountName = 'Otel Otaq Satışı';
      else if (t.type === 'CUSTOM_TOUR_SALE') accountName = 'Fərdi Tur Tenderi';
      else if (t.type === 'PAYOUT') accountName = 'Bank Hesabına Çıxarış';
      else if (t.type === 'REFUND') accountName = 'Ləğv / Geri Qaytarılma';
      else if (t.type === 'SUBSCRIPTION') accountName = 'Abunəlik / Xidmət Haqqı';
      else if (t.type === 'AD_PAYMENT') accountName = 'Reklam Kampaniyası Ödənişi';

      return {
        id: t.id,
        companyId: t.companyId,
        transactionId: t.id,
        bookingId: t.bookingId || null,
        tourTitle: t.booking?.tour?.title || null,
        passengerName: t.booking ? `${t.booking.passengerName} ${t.booking.passengerSurname}` : null,
        passengerPhone: t.booking?.contactNumber || null,
        passengerPassport: t.booking?.passengerPassport || null,
        account: accountName,
        type: t.type,
        debit,
        credit,
        amount: amountNum,
        commission: Number(t.commission || 0),
        netAmount: netAmountNum,
        currency: 'AZN',
        status: t.status,
        description: t.description || `${accountName} (#${t.id.slice(0, 8)})`,
        createdAt: t.createdAt.toISOString()
      };
    });
  }

  async getVendorPayouts(companyId) {
    const payouts = await prisma.payout.findMany({
      where: { companyId },
      orderBy: { payoutDate: 'desc' }
    });

    return payouts.map((p) => ({
      id: p.id,
      companyId: p.companyId,
      amount: Number(p.amount),
      currency: 'AZN',
      bankAccount: p.bankAccount,
      status: p.status.toUpperCase(),
      requestedAt: p.payoutDate.toISOString(),
      processedAt: p.status !== 'Pending' ? p.payoutDate.toISOString() : null
    }));
  }

  // Escrow (Gözləmədəki Balans) tərkibinin detalları
  async getVendorEscrowDetails(companyId) {
    const now = new Date();
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        companyId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        deletedAt: null,
        tour: { endDate: { gte: now } }
      },
      include: {
        tour: {
          select: { id: true, title: true, startDate: true, endDate: true }
        }
      },
      orderBy: { tour: { startDate: 'asc' } }
    });

    return upcomingBookings.map((b) => {
      const endDate = b.tour?.endDate ? new Date(b.tour.endDate) : new Date();
      const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        bookingId: b.id,
        tourTitle: b.tour?.title || 'Fərdi / Paket Tur',
        tourStartDate: b.tour?.startDate || null,
        tourEndDate: b.tour?.endDate || null,
        passengerName: `${b.passengerName} ${b.passengerSurname}`,
        amount: Number(b.paidAmount || b.totalAmount || 0),
        daysLeft,
        releaseDate: endDate.toISOString().split('T')[0],
        status: 'GÖZLƏMƏDƏ (ESCROW)'
      };
    });
  }

  // Şirkətin bank rekvizitlərini yeniləmə
  async updateBankDetails(companyId, data) {
    const { iban, bankName, voen, swiftBic, bankCode, bankVoen } = data;

    const updateData = {};
    if (iban !== undefined) {
      const clean = (iban || '').replace(/\s+/g, '').toUpperCase();
      if (clean && (!clean.startsWith('AZ') || clean.length < 15)) {
        throw ApiError.badRequest('Düzgün Azərbaycan IBAN formatı daxil edin.');
      }
      updateData.iban = clean;
    }
    if (bankName !== undefined) updateData.bankName = bankName.trim();
    if (voen !== undefined) updateData.voen = voen.trim();
    if (swiftBic !== undefined) updateData.swiftBic = swiftBic.trim();
    if (bankCode !== undefined) updateData.bankCode = bankCode.trim();
    if (bankVoen !== undefined) updateData.bankVoen = bankVoen.trim();

    return prisma.company.update({
      where: { id: companyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        iban: true,
        bankName: true,
        voen: true,
        swiftBic: true,
        bankCode: true
      }
    });
  }
}

export const financeService = new FinanceService();
export default financeService;
