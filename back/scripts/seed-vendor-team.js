import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';

async function seedTeam() {
  console.log('Seeding vendor team members & audit logs for C-586288...');

  const companyId = 'C-586288';
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Update owner user
  await prisma.user.updateMany({
    where: { email: 'aztour@gmail.com' },
    data: {
      agencyRole: 'OWNER',
      phoneNumber: '+994 50 123 45 67',
      status: 'Active',
      lastLoginAt: new Date()
    }
  });
  console.log('✓ Owner updated to agencyRole: OWNER');

  // 2. Remove any previous seeded sub-users to avoid duplicates
  await prisma.user.deleteMany({
    where: {
      email: { in: ['elvin@aztour.az', 'aysel@aztour.az', 'murad@aztour.az'] }
    }
  });

  // 3. Create Manager, Accountant, Guide
  const membersData = [
    {
      id: 'U-TM-01',
      name: 'Elvin Əliyev',
      email: 'elvin@aztour.az',
      password: hashedPassword,
      hashAlgorithm: 'BCRYPT',
      role: 'Vendor',
      agencyRole: 'MANAGER',
      companyId,
      phoneNumber: '+994 55 234 56 78',
      status: 'Active',
      lastLoginAt: new Date(Date.now() - 3600 * 1000 * 4) // 4 hours ago
    },
    {
      id: 'U-TM-02',
      name: 'Aysel Qasımova',
      email: 'aysel@aztour.az',
      password: hashedPassword,
      hashAlgorithm: 'BCRYPT',
      role: 'Vendor',
      agencyRole: 'ACCOUNTANT',
      companyId,
      phoneNumber: '+994 70 345 67 89',
      status: 'Active',
      lastLoginAt: new Date(Date.now() - 3600 * 1000 * 24) // 1 day ago
    },
    {
      id: 'U-TM-03',
      name: 'Murad Məmmədov',
      email: 'murad@aztour.az',
      password: hashedPassword,
      hashAlgorithm: 'BCRYPT',
      role: 'Vendor',
      agencyRole: 'GUIDE',
      companyId,
      phoneNumber: '+994 77 456 78 90',
      status: 'Active',
      lastLoginAt: new Date(Date.now() - 3600 * 1000 * 48) // 2 days ago
    }
  ];

  for (const m of membersData) {
    await prisma.user.create({ data: m });
  }
  console.log('✓ Created 3 team members: Manager, Accountant, Guide');

  // 4. Seed Audit Logs
  await prisma.auditLog.deleteMany({
    where: { tenantId: companyId }
  });

  const auditLogs = [
    {
      id: 'AUD-101',
      tenantId: companyId,
      entityName: 'Tour',
      entityId: 'T-128948',
      action: 'UPDATE',
      performedBy: 'Elvin Əliyev (Menecer)',
      oldValues: JSON.stringify({ price: 45 }),
      newValues: JSON.stringify({ price: 50, note: 'Qiymət mövsümə uyğun artırıldı' }),
      createdAt: new Date(Date.now() - 3600 * 1000 * 3)
    },
    {
      id: 'AUD-102',
      tenantId: companyId,
      entityName: 'Payout',
      entityId: 'P-446436',
      action: 'CREATE',
      performedBy: 'Aysel Qasımova (Mühasib)',
      oldValues: null,
      newValues: JSON.stringify({ amount: 25.0, iban: 'AZ12ABB0000000012345678901' }),
      createdAt: new Date(Date.now() - 3600 * 1000 * 12)
    },
    {
      id: 'AUD-103',
      tenantId: companyId,
      entityName: 'Booking',
      entityId: 'TR-104',
      action: 'CHECKIN',
      performedBy: 'Murad Məmmədov (Bələdçi)',
      oldValues: JSON.stringify({ isCheckedIn: false }),
      newValues: JSON.stringify({ isCheckedIn: true, seatNumber: 'Yer 12' }),
      createdAt: new Date(Date.now() - 3600 * 1000 * 20)
    },
    {
      id: 'AUD-104',
      tenantId: companyId,
      entityName: 'SubscriptionPlan',
      entityId: 'SP-PRO',
      action: 'CHANGE_PLAN',
      performedBy: 'ilkin bayramov (Rəhbər)',
      oldValues: JSON.stringify({ plan: 'SP-STARTER' }),
      newValues: JSON.stringify({ plan: 'SP-PRO', billing: 'Monthly' }),
      createdAt: new Date(Date.now() - 3600 * 1000 * 48)
    },
    {
      id: 'AUD-105',
      tenantId: companyId,
      entityName: 'TeamMember',
      entityId: 'U-TM-03',
      action: 'INVITE',
      performedBy: 'ilkin bayramov (Rəhbər)',
      oldValues: null,
      newValues: JSON.stringify({ name: 'Murad Məmmədov', role: 'GUIDE' }),
      createdAt: new Date(Date.now() - 3600 * 1000 * 72)
    }
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: log });
  }
  console.log('✓ Seeded 5 audit log entries for C-586288');

  console.log('Done!');
  await prisma.$disconnect();
}

seedTeam().catch((err) => {
  console.error('Error seeding team:', err);
  process.exit(1);
});
