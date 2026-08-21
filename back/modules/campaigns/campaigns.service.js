import prisma from '../../config/db.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import ApiError from '../../core/api.error.js';

class CampaignsService {
  async getAll(filters = {}, companyId = null) {
    const { status, type } = filters;

    const where = {};
    if (companyId) {
      where.OR = [
        { companyId },
        { companyId: null }
      ];
    }
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }

    return prisma.campaign.findMany({
      where,
      include: {
        company: { select: { name: true } },
        _count: { select: { usages: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(id) {
    return prisma.campaign.findUnique({
      where: { id },
      include: { company: true }
    });
  }

  async create(data, companyId = null) {
    const id = await generateUniqueId('CP', 'campaign');

    return prisma.campaign.create({
      data: {
        id,
        companyId,
        type: data.type || 'DISCOUNT',
        promoCode: data.promoCode.toUpperCase(),
        discountType: data.discountType || 'PERCENTAGE',
        discountValue: parseFloat(data.discountValue),
        usageLimit: parseInt(data.usageLimit || 0, 10),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        description: data.description || null,
        status: 'Active'
      }
    });
  }

  async delete(id, companyId = null) {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) return false;
    if (companyId && campaign.companyId !== companyId) return false;

    await prisma.campaign.delete({ where: { id } });
    return true;
  }

  // Promokod yoxlanılması (validation)
  async validatePromoCode(promoCode, userId) {
    const campaign = await prisma.campaign.findUnique({
      where: { promoCode: promoCode.toUpperCase() }
    });

    if (!campaign) throw ApiError.notFound('Promokod tapılmadı.');
    if (campaign.status !== 'Active') throw ApiError.badRequest('Bu promokod artıq aktiv deyil.');

    const now = new Date();
    if (now < campaign.startDate || now > campaign.endDate) {
      throw ApiError.badRequest('Promokodun istifadə müddəti uyğun deyil.');
    }

    // Limit yoxlanışı
    if (campaign.usageLimit > 0 && campaign.usedCount >= campaign.usageLimit) {
      throw ApiError.badRequest('Bu promokodun istifadə limiti dolub.');
    }

    // Bu istifadəçinin artıq istifadə edib etmədiyini yoxlayırıq
    if (userId) {
      const usage = await prisma.campaignUsage.findFirst({
        where: { campaignId: campaign.id, userId }
      });
      if (usage) {
        throw ApiError.badRequest('Siz bu promokodu artıq istifadə etmisiniz.');
      }
    }

    return campaign;
  }

  // KPI Analitikası (Hər kampaniya üzrə ROI/İstifadə)
  async getKPIReport(companyId = null) {
    const campaigns = await prisma.campaign.findMany({
      where: companyId ? { companyId } : {},
      include: {
        usages: {
          include: {
            user: true
          }
        }
      }
    });

    return campaigns.map((c) => {
      return {
        campaignId: c.id,
        promoCode: c.promoCode,
        type: c.type,
        discountValue: c.discountValue,
        discountType: c.discountType,
        usageLimit: c.usageLimit,
        usedCount: c.usedCount,
        usagesHistory: c.usages.map((u) => ({
          userId: u.userId,
          userName: u.user.name || 'Müştəri',
          usedAt: u.usedAt
        }))
      };
    });
  }
}

export const campaignsService = new CampaignsService();
export default campaignsService;
