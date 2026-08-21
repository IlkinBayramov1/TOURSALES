import prisma from '../../config/db.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import ApiError from '../../core/api.error.js';
import ledgerService from './ledger.service.js';

class PayoutService {
  // 1. Vendor tərəfindən Payout (Gəlir Çıxarılması) Sorğusu
  async requestPayout(companyId, amount, bankAccount) {
    const payoutAmount = Number(amount);
    if (payoutAmount <= 0) throw ApiError.badRequest('Çıxarılan məbləğ 0-dan böyük olmalıdır.');

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) throw ApiError.notFound('Şirkət tapılmadı.');

    const currentBalance = Number(company.availableBalance);
    if (currentBalance < payoutAmount) {
      throw ApiError.badRequest(`Kifayət qədər balansı yoxdur. Mövcud balans: ${currentBalance} AZN, Sorğu: ${payoutAmount} AZN`);
    }

    const payoutId = await generateUniqueId('P', 'payout');

    return await prisma.$transaction(async (tx) => {
      // Balansdan məbləğin çıxarılması
      await tx.company.update({
        where: { id: companyId },
        data: {
          availableBalance: { decrement: payoutAmount }
        }
      });

      // Payout sorğusunun yaradılması
      const payout = await tx.payout.create({
        data: {
          id: payoutId,
          companyId,
          amount: payoutAmount,
          status: 'Pending',
          bankAccount: bankAccount || company.iban || 'AZ00PASHA0000000000000'
        }
      });

      return payout;
    });
  }

  // 2. SuperAdmin tərəfindən Payout Sorğusunun İcrası (Execution & Ledger Entry)
  async executePayout(payoutId) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { company: true }
    });

    if (!payout) throw ApiError.notFound('Payout sorğusu tapılmadı.');
    if (payout.status !== 'Pending') throw ApiError.badRequest(`Payout artıq ${payout.status} statusundadır.`);

    return await prisma.$transaction(async (tx) => {
      const updatedPayout = await tx.payout.update({
        where: { id: payoutId },
        data: { status: 'Completed' }
      });

      // Transaction log
      const txId = await generateUniqueId('TX', 'transaction');
      await tx.transaction.create({
        data: {
          id: txId,
          companyId: payout.companyId,
          type: 'PAYOUT',
          amount: payout.amount,
          commission: 0.0,
          netAmount: payout.amount,
          status: 'Completed',
          description: `Vendor bank hesabına köçürmə (${payout.bankAccount})`
        }
      });

      return updatedPayout;
    });
  }
}

export const payoutService = new PayoutService();
export default payoutService;
