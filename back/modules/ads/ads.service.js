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
  async purchaseAd(companyId, data, user = null) {
    const { tourId, packageId, position, title, imageUrl, linkUrl, paymentMethod = 'BALANCE' } = data;

    const adPackage = await prisma.adPackage.findUnique({ where: { id: packageId } });
    if (!adPackage) throw ApiError.notFound('Reklam paketi tapılmadı.');

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw ApiError.notFound('Şirkət tapılmadı.');

    const price = Number(adPackage.price);
    const availableBalance = Number(company.availableBalance);

    if (paymentMethod === 'BALANCE') {
      if (availableBalance < price) {
        throw ApiError.badRequest(
          `Platforma balansınızda kifayət qədər vəsait yoxdur. Tələb olunan: ${price} AZN, Mövcud balans: ${availableBalance} AZN. Zəhmət olmasa, Bank Kartı və ya B2B Faktura ilə ödəniş edin.`
        );
      }
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
    const ad = await prisma.$transaction(async (tx) => {
      // 1. Əgər Platforma Balansı seçilibsə, balansdan çıxırıq
      if (paymentMethod === 'BALANCE') {
        await tx.company.update({
          where: { id: companyId },
          data: {
            availableBalance: { decrement: price }
          }
        });
      }

      // 2. Tranzaksiya loqu yaradırıq
      const txId = await generateUniqueId('TX', 'transaction');
      const invoiceRef = `INV-AD-${Date.now().toString().slice(-6)}`;
      let paymentDesc = `"${finalTitle}" üçün VIP reklam paketi (${adPackage.name || adPackage.durationDays + ' Gün'}) alışı.`;
      if (paymentMethod === 'CARD') {
        paymentDesc += ' (Ödəniş Metodu: Bank Kartı ilə dərhal ödəniş)';
      } else if (paymentMethod === 'INVOICE') {
        paymentDesc += ` (Ödəniş Metodu: B2B Faktura #${invoiceRef})`;
      }

      await tx.transaction.create({
        data: {
          id: txId,
          companyId,
          type: 'MARKETING_AD',
          amount: price,
          netAmount: paymentMethod === 'BALANCE' ? -price : 0,
          status: paymentMethod === 'INVOICE' ? 'Pending_Verification' : 'Completed',
          description: paymentDesc
        }
      });

      // 3. Reklamı yaradırıq
      const createdAd = await tx.ad.create({
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

      return createdAd;
    });

    // 4. Audit Log qeydiyyatı
    await prisma.auditLog.create({
      data: {
        id: await generateUniqueId('AUD', 'auditLog'),
        tenantId: companyId,
        entityName: 'Ad',
        entityId: ad.id,
        action: 'PURCHASE_AD',
        performedBy: `${user?.name || 'Rəhbər'} (${(user?.agencyRole || 'OWNER').toUpperCase()})`,
        newValues: JSON.stringify({
          title: finalTitle,
          package: adPackage.name,
          price,
          paymentMethod,
          position: position || 'HERO'
        })
      }
    }).catch((err) => console.error('[AuditLog] PURCHASE_AD xətası:', err));

    return ad;
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
  async toggleAdStatus(companyId, adId, user = null) {
    const ad = await prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) throw ApiError.notFound('Reklam tapılmadı.');
    if (ad.companyId !== companyId) throw ApiError.forbidden('Bu reklamı dəyişməyə icazəniz yoxdur.');

    if (ad.status === 'Expired') {
      throw ApiError.badRequest('Müddəti bitmiş reklamın statusunu dəyişmək mümkün deyil.');
    }

    const newStatus = ad.status === 'Active' ? 'Paused' : 'Active';
    const updated = await prisma.ad.update({
      where: { id: adId },
      data: { status: newStatus },
      include: {
        tour: { select: { id: true, title: true, price: true, images: true } },
        package: true
      }
    });

    await prisma.auditLog.create({
      data: {
        id: await generateUniqueId('AUD', 'auditLog'),
        tenantId: companyId,
        entityName: 'Ad',
        entityId: adId,
        action: 'TOGGLE_AD_STATUS',
        performedBy: `${user?.name || 'Rəhbər'} (${(user?.agencyRole || 'OWNER').toUpperCase()})`,
        oldValues: JSON.stringify({ status: ad.status }),
        newValues: JSON.stringify({ status: newStatus })
      }
    }).catch((err) => console.error('[AuditLog] TOGGLE_AD_STATUS xətası:', err));

    return updated;
  }

  // Reklamı silmək
  async deleteAd(companyId, adId, user = null) {
    const ad = await prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) throw ApiError.notFound('Reklam tapılmadı.');
    if (ad.companyId !== companyId) throw ApiError.forbidden('Bu reklamı silməyə icazəniz yoxdur.');

    await prisma.ad.delete({ where: { id: adId } });

    await prisma.auditLog.create({
      data: {
        id: await generateUniqueId('AUD', 'auditLog'),
        tenantId: companyId,
        entityName: 'Ad',
        entityId: adId,
        action: 'DELETE_AD',
        performedBy: `${user?.name || 'Rəhbər'} (${(user?.agencyRole || 'OWNER').toUpperCase()})`,
        oldValues: JSON.stringify({ title: ad.title, amountPaid: ad.amountPaid })
      }
    }).catch((err) => console.error('[AuditLog] DELETE_AD xətası:', err));

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

  // İctimai müştəri reklamları (Web Portal üçün)
  async getPublicAds(options = {}) {
    const { position, limit = 10 } = options;
    const now = new Date();
    const where = {
      status: 'Active',
      endDate: { gte: now }
    };
    if (position && position !== 'ALL') {
      where.position = position;
    }

    const ads = await prisma.ad.findMany({
      where,
      include: {
        tour: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            type: true,
            destinationCountry: true
          }
        },
        package: {
          select: { name: true, durationDays: true }
        },
        company: {
          select: { id: true, name: true, logoUrl: true, rating: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10) || 10
    });

    // İzlənmə sayını (viewCount) asinxron artırırıq
    if (ads.length > 0) {
      const adIds = ads.map((a) => a.id);
      prisma.ad.updateMany({
        where: { id: { in: adIds } },
        data: { viewCount: { increment: 1 } }
      }).catch((err) => console.error('[Ads] View count increment xətası:', err));
    }

    return ads.map((ad) => {
      let parsedImages = [];
      if (ad.tour?.images) {
        try {
          parsedImages = typeof ad.tour.images === 'string' ? JSON.parse(ad.tour.images) : ad.tour.images;
        } catch {
          parsedImages = [ad.tour.images];
        }
      }

      return {
        id: ad.id,
        title: ad.title || ad.tour?.title || 'Xüsusi Tur Təklifi',
        imageUrl: ad.imageUrl || (parsedImages[0] || null),
        linkUrl: ad.linkUrl || (ad.tour ? `/tours/${ad.tour.id}` : '/tours'),
        position: ad.position,
        companyId: ad.companyId,
        companyName: ad.company?.name || 'Toursales Tərəfdaşı',
        companyLogo: ad.company?.logoUrl || null,
        companyRating: Number(ad.company?.rating) || 5.0,
        tour: ad.tour ? {
          ...ad.tour,
          price: Number(ad.tour.price) || 0,
          images: parsedImages
        } : null
      };
    });
  }

  // Reklam kliklənməsi qeydiyyatı
  async recordAdClick(adId) {
    const ad = await prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) throw ApiError.notFound('Reklam tapılmadı.');

    return prisma.ad.update({
      where: { id: adId },
      data: { clicksCount: { increment: 1 } },
      select: { id: true, clicksCount: true, linkUrl: true }
    });
  }
}

export const adsService = new AdsService();
export default adsService;
