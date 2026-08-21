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
}

export const usersService = new UsersService();
export default usersService;
