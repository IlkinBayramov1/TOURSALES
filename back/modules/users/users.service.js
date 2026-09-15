import crypto from 'crypto';
import prisma from '../../config/db.js';
import { generateExcel } from '../../utils/excel-generator.js';
import ApiError from '../../core/api.error.js';

class UsersService {
  async getAllCustomers(filters = {}) {
    const { search } = filters;

    const where = {
      role: 'User'
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const customers = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Müştərilərin sifariş sayı və xərclərini dinamik hesablayırıq
    const customerStats = await Promise.all(
      customers.map(async (customer) => {
        const bookings = await prisma.booking.findMany({
          where: { contactEmail: customer.email }
        });

        const totalSpent = bookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
        const debt = bookings.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);

        return {
          id: customer.id,
          name: customer.name || 'Bilinmir',
          email: customer.email,
          role: customer.role,
          loyaltyPoints: customer.loyaltyPoints,
          createdAt: customer.createdAt,
          bookingCount: bookings.length,
          totalSpent,
          debtStatus: debt > 0 ? `Borcu var (${debt} AZN)` : 'Borcu yoxdur',
          bookings
        };
      })
    );

    return customerStats;
  }

  async getCustomerDetails(id) {
    const customer = await prisma.user.findFirst({
      where: { id, role: 'User' }
    });

    if (!customer) return null;

    const bookings = await prisma.booking.findMany({
      where: { contactEmail: customer.email },
      include: { tour: true }
    });

    const totalSpent = bookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
    const debt = bookings.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);

    return {
      id: customer.id,
      name: customer.name || 'Bilinmir',
      email: customer.email,
      loyaltyPoints: customer.loyaltyPoints,
      createdAt: customer.createdAt,
      bookingCount: bookings.length,
      totalSpent,
      debtStatus: debt > 0 ? `Borcu var (${debt} AZN)` : 'Borcu yoxdur',
      bookingHistory: bookings
    };
  }

  async anonymizeCustomer(id) {
    const customer = await prisma.user.findUnique({
      where: { id }
    });

    if (!customer) throw ApiError.notFound('Müştəri tapılmadı.');

    // Yoxlayırıq: Əgər aktiv borcu varsa anonimləşdirməyə icazə vermirik
    const bookings = await prisma.booking.findMany({
      where: { contactEmail: customer.email }
    });
    const totalRemaining = bookings.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);
    if (totalRemaining > 0) {
      throw ApiError.badRequest('Aktiv borcu olan müştərini anonimləşdirmək/silmək olmaz.');
    }

    const anonymizedEmail = `deleted_user_${customer.id}@anonymized.com`;

    // Müştərinin rezervasiyalardakı email-ni də güncəlləyirik ki, maliyyə hesabatlarında tutarlı qalsın
    await prisma.$transaction([
      prisma.booking.updateMany({
        where: { contactEmail: customer.email },
        data: {
          passengerName: 'Silinmiş',
          passengerSurname: 'İstifadəçi',
          passengerPassport: 'ANONYMIZED',
          contactNumber: 'ANONYMIZED',
          contactEmail: anonymizedEmail
        }
      }),
      prisma.user.update({
        where: { id },
        data: {
          name: 'Anonymized User',
          email: anonymizedEmail,
          password: 'ANONYMIZED_' + crypto.randomBytes(8).toString('hex'),
          loyaltyPoints: 0,
          twoFactorEnabled: false,
          twoFactorSecret: null
        }
      }),
      // Sessiyalarını sonlandırırıq
      prisma.session.deleteMany({
        where: { userId: id }
      })
    ]);

    return { success: true };
  }

  async exportCustomersToExcel(filters = {}) {
    const customers = await this.getAllCustomers(filters);

    const columns = [
      { header: 'İstifadəçi ID', key: 'id', width: 15 },
      { header: 'Ad Soyad', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Qoşulma Tarixi', key: 'createdAt', width: 20 },
      { header: 'Sifariş Sayı', key: 'bookingCount', width: 15 },
      { header: 'Ümumi Xərc (AZN)', key: 'totalSpent', width: 18 },
      { header: 'Loyalty Xalı', key: 'loyaltyPoints', width: 15 },
      { header: 'Borc Vəziyyəti', key: 'debtStatus', width: 25 }
    ];

    const formattedData = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      createdAt: c.createdAt.toISOString().split('T')[0],
      bookingCount: c.bookingCount,
      totalSpent: c.totalSpent,
      loyaltyPoints: c.loyaltyPoints,
      debtStatus: c.debtStatus
    }));

    return generateExcel(formattedData, columns, 'Müştərilər');
  }

  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        role: true,
        status: true,
        loyaltyPoints: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw ApiError.notFound('İstifadəçi tapılmadı.');
    }

    return user;
  }

  async updateProfile(userId, data) {
    const { name, phone, phoneNumber } = data;
    const phoneToUpdate = phone !== undefined ? phone : phoneNumber;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(phoneToUpdate !== undefined && { phoneNumber: phoneToUpdate })
      },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        role: true,
        status: true,
        loyaltyPoints: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return user;
  }

  async changePassword(userId, { oldPassword, newPassword }) {
    if (!oldPassword || !newPassword) {
      throw ApiError.badRequest('Köhnə və yeni şifrə daxil edilməlidir.');
    }

    if (newPassword.length < 6) {
      throw ApiError.badRequest('Yeni şifrə ən azı 6 simvoldan ibarət olmalıdır.');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound('İstifadəçi tapılmadı.');
    }

    // Verify old password
    const { authService } = await import('../auth/auth.service.js');
    const isMatch = await authService.verifyPassword(user, oldPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Cari şifrə yanlışdır.');
    }

    const hashedPassword = await authService.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        hashAlgorithm: 'BCRYPT'
      }
    });

    return { success: true };
  }

  async getLoyalty(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, loyaltyPoints: true, name: true, email: true }
    });

    if (!user) {
      throw ApiError.notFound('İstifadəçi tapılmadı.');
    }

    const points = user.loyaltyPoints || 0;
    let tier = 'BRONZE';
    let tierDiscount = 0;

    if (points >= 3000) {
      tier = 'PLATINUM';
      tierDiscount = 10;
    } else if (points >= 1500) {
      tier = 'GOLD';
      tierDiscount = 5;
    } else if (points >= 500) {
      tier = 'SILVER';
      tierDiscount = 3;
    }

    const history = await prisma.loyaltyHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return {
      points,
      tier,
      tierDiscount,
      history: history.map(h => ({
        id: h.id,
        description: h.description,
        points: h.points,
        type: h.actionType === 'EARNED' ? 'EARNED' : 'REDEEMED',
        createdAt: h.createdAt.toISOString()
      }))
    };
  }

  async getFavorites(userId) {
    if (!userId) return [];

    const favRows = await prisma.$queryRawUnsafe(
      'SELECT tourId FROM user_favorites WHERE userId = ? ORDER BY createdAt DESC',
      userId
    );

    if (!favRows || favRows.length === 0) {
      return [];
    }

    const tourIds = favRows.map(r => r.tourId);
    const tours = await prisma.tour.findMany({
      where: {
        id: { in: tourIds },
        deletedAt: null
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            phoneNumber: true,
            rating: true
          }
        }
      }
    });

    const tourMap = new Map(tours.map(t => [t.id, t]));
    return tourIds.map(id => tourMap.get(id)).filter(Boolean);
  }

  async toggleFavorite(userId, tourId) {
    if (!userId || !tourId) throw ApiError.badRequest('İstifadəçi və ya Tur ID daxil edilməlidir.');
    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) throw ApiError.notFound('Tur tapılmadı.');

    const existing = await prisma.$queryRawUnsafe(
      'SELECT id FROM user_favorites WHERE userId = ? AND tourId = ? LIMIT 1',
      userId,
      tourId
    );

    let isFavorite = false;
    if (existing && existing.length > 0) {
      await prisma.$executeRawUnsafe(
        'DELETE FROM user_favorites WHERE userId = ? AND tourId = ?',
        userId,
        tourId
      );
      if (tour.favoriteCount > 0) {
        await prisma.tour.update({
          where: { id: tourId },
          data: { favoriteCount: { decrement: 1 } }
        }).catch(() => {});
      }
      isFavorite = false;
    } else {
      const favId = 'FAV-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      await prisma.$executeRawUnsafe(
        'INSERT INTO user_favorites (id, userId, tourId, createdAt) VALUES (?, ?, ?, NOW(3))',
        favId,
        userId,
        tourId
      );
      await prisma.tour.update({
        where: { id: tourId },
        data: { favoriteCount: { increment: 1 } }
      }).catch(() => {});
      isFavorite = true;
    }

    return { isFavorite, tourId };
  }

  async syncFavorites(userId, tourIds = []) {
    if (!userId || !Array.isArray(tourIds) || tourIds.length === 0) {
      return this.getFavorites(userId);
    }

    for (const tourId of tourIds) {
      if (typeof tourId === 'string' && tourId.trim()) {
        const cleanId = tourId.trim();
        const existing = await prisma.$queryRawUnsafe(
          'SELECT id FROM user_favorites WHERE userId = ? AND tourId = ? LIMIT 1',
          userId,
          cleanId
        );
        if (!existing || existing.length === 0) {
          const favId = 'FAV-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
          try {
            await prisma.$executeRawUnsafe(
              'INSERT INTO user_favorites (id, userId, tourId, createdAt) VALUES (?, ?, ?, NOW(3))',
              favId,
              userId,
              cleanId
            );
            await prisma.tour.update({
              where: { id: cleanId },
              data: { favoriteCount: { increment: 1 } }
            }).catch(() => {});
          } catch (e) {
            // ignore duplicates
          }
        }
      }
    }

    return this.getFavorites(userId);
  }
}

export const usersService = new UsersService();
export default usersService;
