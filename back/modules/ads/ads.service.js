import prisma from '../../config/db.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import ApiError from '../../core/api.error.js';

class AdsService {
  // Reklam paketləri
  async getPackages() {
    const packages = await prisma.adPackage.findMany({
      orderBy: { price: 'asc' }
    });

    return packages.map((pkg) => {
      let parsedFeatures = [];
      try {
        parsedFeatures = JSON.parse(pkg.features);
      } catch {
        parsedFeatures = [pkg.features];
      }
      return {
        ...pkg,
        features: parsedFeatures
      };
    });
  }

  async createPackage(data) {
    const id = await generateUniqueId('ADP', 'adPackage');
    return prisma.adPackage.create({
      data: {
        id,
        name: data.name || `${data.durationDays} Günlük Reklam Paketi`,
        durationDays: parseInt(data.durationDays, 10),
        price: parseFloat(data.price),
        features: typeof data.features === 'string' ? data.features : JSON.stringify(data.features || [])
      }
    });
  }

  // Reklam almaq (Vendor)
  async purchaseAd(companyId, data) {
    const { tourId, packageId, position, title, imageUrl, linkUrl } = data;

    const adPackage = await prisma.adPackage.findUnique({ where: { id: packageId } });
    if (!adPackage) throw ApiError.notFound('Reklam paketi tapılmadı.');

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw ApiError.notFound('Şirkət tapılmadı.');

    const price = Number(adPackage.price);
    const availableBalance = Number(company.availableBalance);

    if (availableBalance < price) {
      throw ApiError.badRequest(`Balansda kifayət qədər vəsait yoxdur. Tələb olunan: ${price} AZN, Mövcud balans: ${availableBalance} AZN.`);
    }

    let tour = null;
    let finalTitle = title;
    let finalImage = imageUrl;
    let finalLink = linkUrl;

    if (tourId) {
      tour = await prisma.tour.findUnique({ where: { id: tourId } });
      if (!tour) throw ApiError.notFound('Tur tapılmadı.');
      if (tour.companyId !== companyId) throw ApiError.forbidden('Bu tura yalnız öz sahibi reklam ala bilər.');

      if (!finalTitle) finalTitle = tour.title;
      if (!finalImage) finalImage = tour.coverImage || (tour.images ? JSON.parse(tour.images)[0] : null);
      if (!finalLink) finalLink = `/tours/${tour.id}`;
    }

    if (!finalTitle) {
      throw ApiError.badRequest('Reklam üçün başlıq və ya tur seçilməlidir.');
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
          availableBalance: { decrement: price }
        }
      });

      // 2. Tranzaksiya loqu yaradırıq
      const txId = await generateUniqueId('TX', 'transaction');
      await tx.transaction.create({
        data: {
          id: txId,
          companyId,
          type: 'SUBSCRIPTION',
          amount: price,
          netAmount: -price,
          status: 'Completed',
          description: `"${finalTitle}" üçün VIP reklam paketi (${adPackage.name || adPackage.durationDays + ' Gün'}) alışı.`
        }
      });

      // 3. Reklamı yaradırıq
      const ad = await tx.ad.create({
        data: {
          id: adId,
          companyId,
          tourId: tourId || null,
          packageId,
          title: finalTitle,
          imageUrl: finalImage || null,
          linkUrl: finalLink || null,
          position: position || 'HERO',
          amountPaid: price,
          startDate,
          endDate,
          status: 'Active',
          viewCount: 0,
          clicksCount: 0,
          bookingCount: 0
        },
        include: {
          tour: { select: { id: true, title: true, price: true, images: true } },
          package: true
        }
      });

      return ad;
    });
  }

  // Reklamların siyahısı
  async getAds(filters = {}, companyId = null) {
    const { status, position, search } = filters;
    const where = {};

    if (companyId) {
      where.companyId = companyId;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (position && position !== 'ALL') {
      where.position = position;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { tour: { title: { contains: search } } }
      ];
    }

    const ads = await prisma.ad.findMany({
      where,
      include: {
        tour: { select: { id: true, title: true, price: true, images: true } },
        package: true,
        company: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Avtomatik Expired yoxlanışı
    const now = new Date();
    return ads.map((ad) => {
      let isExpired = ad.endDate < now;
      let effectiveStatus = ad.status;
      if (isExpired && effectiveStatus === 'Active') {
        effectiveStatus = 'Expired';
      }
      return {
        ...ad,
        status: effectiveStatus,
        clicksCount: ad.clicksCount || 0,
        viewCount: ad.viewCount || 0,
        bookingCount: ad.bookingCount || 0
      };
    });
  }

  // Status dəyişmə (Active <-> Paused)
  async toggleAdStatus(companyId, adId) {
    const ad = await prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) throw ApiError.notFound('Reklam tapılmadı.');
    if (ad.companyId !== companyId) throw ApiError.forbidden('Bu reklamı dəyişməyə icazəniz yoxdur.');

    if (ad.status === 'Expired') {
      throw ApiError.badRequest('Müddəti bitmiş reklamın statusunu dəyişmək mümkün deyil.');
    }

    const newStatus = ad.status === 'Active' ? 'Paused' : 'Active';
    return prisma.ad.update({
      where: { id: adId },
      data: { status: newStatus },
      include: {
        tour: { select: { id: true, title: true, price: true, images: true } },
        package: true
      }
    });
  }

  // Reklamı silmək
  async deleteAd(companyId, adId) {
    const ad = await prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) throw ApiError.notFound('Reklam tapılmadı.');
    if (ad.companyId !== companyId) throw ApiError.forbidden('Bu reklamı silməyə icazəniz yoxdur.');

    await prisma.ad.delete({ where: { id: adId } });
    return { success: true, message: 'Reklam uğurla silindi.' };
  }

  // Reklam KPI Hesabatı (Statistika və Analitika)
  async getAdsKPI(companyId = null) {
    const ads = await prisma.ad.findMany({
      where: companyId ? { companyId } : {},
      include: {
        tour: {
          select: {
            title: true,
            price: true,
            bookings: {
              where: { status: 'CONFIRMED' }
            }
          }
        },
        package: true
      }
    });

    let totalImpressions = 0;
    let totalClicks = 0;
    let totalBookings = 0;
    let totalSpent = 0;
    let totalRevenueGenerated = 0;
    let activeAdsCount = 0;

    const detailedAds = ads.map((ad) => {
      const imps = ad.viewCount || 0;
      const clicks = ad.clicksCount || 0;
      const bookings = ad.bookingCount || 0;
      const spent = Number(ad.amountPaid) || 0;

      // Tur üzrə təxmini gəlir
      let tourPrice = Number(ad.tour?.price || 0);
      let revenue = bookings * tourPrice;

      totalImpressions += imps;
      totalClicks += clicks;
      totalBookings += bookings;
      totalSpent += spent;
      totalRevenueGenerated += revenue;

      if (ad.status === 'Active' && new Date(ad.endDate) > new Date()) {
        activeAdsCount++;
      }

      const ctr = imps > 0 ? ((clicks / imps) * 100).toFixed(2) : '0.00';

      return {
        adId: ad.id,
        title: ad.title || ad.tour?.title || 'Ads Campaign',
        tourTitle: ad.tour?.title || null,
        packageName: ad.package?.name || `${ad.package?.durationDays || 0} Günlük Paket`,
        position: ad.position,
        amountPaid: spent,
        startDate: ad.startDate,
        endDate: ad.endDate,
        status: ad.status,
        viewCount: imps,
        clicksCount: clicks,
        ctr: `${ctr}%`,
        bookingCount: bookings,
        revenueGenerated: revenue
      };
    });

    const overallCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
    const roi = totalSpent > 0 ? (((totalRevenueGenerated - totalSpent) / totalSpent) * 100).toFixed(1) : '0.0';

    return {
      summary: {
        totalImpressions,
        totalClicks,
        avgCtr: `${overallCtr}%`,
        totalBookings,
        totalSpent,
        totalRevenueGenerated,
        roi: `${roi}%`,
        activeAdsCount,
        totalAdsCount: ads.length
      },
      campaigns: detailedAds
    };
  }
}

export const adsService = new AdsService();
export default adsService;
