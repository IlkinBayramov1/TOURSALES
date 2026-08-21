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

  // Vendor payout sorğusu açır
  async requestPayout(companyId, amount, bankAccount) {
    const requestedAmount = parseFloat(amount);
    if (requestedAmount <= 0) throw ApiError.badRequest('Məbləğ 0-dan böyük olmalıdır.');

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw ApiError.notFound('Şirkət tapılmadı.');

    if (company.availableBalance < requestedAmount) {
      throw ApiError.badRequest('Balansda kifayət qədər vəsait yoxdur.');
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
          bankAccount,
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
          description: `Çıxarış sorğusu: ${payoutId}`
        }
      });

      return payout;
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
      { header: 'Tranzaksiya ID', key: 'id', width: 15 },
      { header: 'Şirkət Adı', key: 'companyName', width: 25 },
      { header: 'Növü', key: 'type', width: 15 },
      { header: 'Məbləğ (AZN)', key: 'amount', width: 15 },
      { header: 'Komissiya (AZN)', key: 'commission', width: 15 },
      { header: 'Xalis (AZN)', key: 'netAmount', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Tarix', key: 'createdAt', width: 20 },
      { header: 'Təsvir', key: 'description', width: 35 }
    ];

    const formattedData = txs.map((t) => ({
      id: t.id,
      companyName: t.company.name,
      type: t.type,
      amount: t.amount,
      commission: t.commission,
      netAmount: t.netAmount,
      status: t.status,
      createdAt: t.createdAt.toISOString().replace('T', ' ').substring(0, 19),
      description: t.description
    }));

    return generateExcel(formattedData, columns, 'Maliyyə Tarixçəsi');
  }
}

export const financeService = new FinanceService();
export default financeService;
