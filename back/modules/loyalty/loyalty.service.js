import prisma from '../../config/db.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import ApiError from '../../core/api.error.js';

class LoyaltyService {
  async getOffers() {
    const now = new Date();
    return prisma.loyaltyOffer.findMany({
      where: {
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      }
    });
  }

  async createOffer(data) {
    const id = await generateUniqueId('LYO', 'loyaltyOffer');
    return prisma.loyaltyOffer.create({
      data: {
        id,
        partnerName: data.partnerName,
        offerName: data.offerName,
        description: data.description,
        requiredPoints: parseInt(data.requiredPoints, 10),
        maxUsage: parseInt(data.maxUsage || 0, 10),
        category: data.category || 'TRAVEL',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null
      }
    });
  }

  // Müştərinin loyalty təklifindən xal ilə yararlanması
  async redeemOffer(userId, offerId) {
    const offer = await prisma.loyaltyOffer.findUnique({ where: { id: offerId } });
    if (!offer) throw ApiError.notFound('Təklif tapılmadı.');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('İstifadəçi tapılmadı.');

    if (user.loyaltyPoints < offer.requiredPoints) {
      throw ApiError.badRequest(`Kifayət qədər xalınız yoxdur. Lazım olan: ${offer.requiredPoints}, Sizdə olan: ${user.loyaltyPoints}`);
    }

    if (offer.maxUsage > 0 && offer.usedCount >= offer.maxUsage) {
      throw ApiError.badRequest('Bu təklifin limiti dolub.');
    }

    const historyId = await generateUniqueId('LYH', 'loyaltyHistory');

    // Atomik tranzaksiya
    return prisma.$transaction(async (tx) => {
      // 1. İstifadəçi xalını azaldırıq
      await tx.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: { decrement: offer.requiredPoints }
        }
      });

      // 2. Təklifin istifadə sayını artırırıq
      await tx.loyaltyOffer.update({
        where: { id: offerId },
        data: {
          usedCount: { increment: 1 }
        }
      });

      // 3. Xal tarixçəsi loqu yazırıq
      const log = await tx.loyaltyHistory.create({
        data: {
          id: historyId,
          userId,
          actionType: 'SPENT',
          points: offer.requiredPoints,
          description: `${offer.partnerName} - ${offer.offerName} təklifi üçün xal xərcləndi.`
        }
      });

      return log;
    });
  }

  async getPointsHistory(userId) {
    return prisma.loyaltyHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAllHistory() {
    return prisma.loyaltyHistory.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const loyaltyService = new LoyaltyService();
export default loyaltyService;
