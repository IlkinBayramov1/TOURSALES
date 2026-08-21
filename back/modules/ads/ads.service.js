import prisma from '../../config/db.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import ApiError from '../../core/api.error.js';

class AdsService {
  // Reklam paketləri
  async getPackages() {
    return prisma.adPackage.findMany();
  }

  async createPackage(data) {
    const id = await generateUniqueId('ADP', 'adPackage');
    return prisma.adPackage.create({
      data: {
        id,
        durationDays: parseInt(data.durationDays, 10),
        price: parseFloat(data.price),
        features: JSON.stringify(data.features || [])
      }
    });
  }

  // Reklam almaq (Vendor)
  async purchaseAd(companyId, tourId, packageId) {
    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) throw ApiError.notFound('Tur tapılmadı.');
    if (tour.companyId !== companyId) throw ApiError.forbidden('Bu tura yalnız öz sahibi reklam ala bilər.');

    const adPackage = await prisma.adPackage.findUnique({ where: { id: packageId } });
    if (!adPackage) throw ApiError.notFound('Reklam paketi tapılmadı.');

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw ApiError.notFound('Şirkət tapılmadı.');

    if (company.availableBalance < adPackage.price) {
      throw ApiError.badRequest('Balansda kifayət qədər vəsait yoxdur.');
    }

    const adId = await generateUniqueId('AD', 'ad');
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + adPackage.durationDays);

    // Atomik tranzaksiya
    return prisma.$transaction(async (tx) => {
      // 1. Balansdan pulu tuturuq
      await tx.company.update({
        where: { id: companyId },
        data: {
          availableBalance: { decrement: adPackage.price }
        }
      });

      // 2. Tranzaksiya loqu yaradırıq
      const txId = await generateUniqueId('TX', 'transaction');
      await tx.transaction.create({
        data: {
          id: txId,
          companyId,
          type: 'SUBSCRIPTION',
          amount: adPackage.price,
          netAmount: -adPackage.price,
          status: 'Completed',
          description: `${tour.title} turu üçün VIP reklam alışı: ${adPackage.durationDays} gün.`
        }
      });

      // 3. Reklamı yaradırıq
      const ad = await tx.ad.create({
        data: {
          id: adId,
          companyId,
          tourId,
          packageId,
          amountPaid: adPackage.price,
          startDate,
          endDate,
          status: 'Active'
        }
      });

      return ad;
    });
  }

  // Reklamların siyahısı
  async getAds(filters = {}, companyId = null) {
    const { status } = filters;
    const where = {};
    if (companyId) {
      where.companyId = companyId;
    }
    if (status) {
      where.status = status;
    }

    return prisma.ad.findMany({
      where,
      include: {
        tour: { select: { id: true, title: true, price: true } },
        package: true,
        company: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Reklam KPI Hesabatı (Göstəricilər)
  async getAdsKPI(companyId = null) {
    const ads = await prisma.ad.findMany({
      where: companyId ? { companyId } : {},
      include: {
        tour: {
          select: {
            title: true,
            bookings: {
              where: { status: 'CONFIRMED' }
            }
          }
        },
        package: true
      }
    });

    return ads.map((ad) => {
      // Reklam müddətində gələn sifarişlərin hesablanması
      const adBookings = ad.tour.bookings.filter(b => b.createdAt >= ad.startDate && b.createdAt <= ad.endDate);
      const conversionCount = adBookings.reduce((sum, b) => sum + b.seats, 0);
      const totalRevenueGenerated = adBookings.reduce((sum, b) => sum + b.paidAmount, 0);

      return {
        adId: ad.id,
        tourTitle: ad.tour.title,
        packageName: `${ad.package.durationDays} Günlük VIP Paket`,
        amountPaid: ad.amountPaid,
        startDate: ad.startDate,
        endDate: ad.endDate,
        status: ad.status,
        viewCount: ad.viewCount,
        bookingCount: conversionCount,
        revenueGenerated: totalRevenueGenerated
      };
    });
  }
}

export const adsService = new AdsService();
export default adsService;
