import prisma from '../config/db.js';

async function seedFinance() {
  console.log('Seeding financial data and subscription plans for C-586288...');

  const companyId = 'C-586288';

  // 1. Seed Subscription Plans
  const plans = [
    {
      id: 'SP-STARTER',
      name: 'Başlanğıc (Starter)',
      monthlyPrice: 0.0,
      domesticCommission: 8.0,
      foreignCommission: 10.0,
      features: JSON.stringify([
        '5 aktiv tur elanı',
        '8% daxili, 10% xarici komissiya',
        'Standart bilet satışı & QR vauçer',
        'E-poçt dəstəyi'
      ])
    },
    {
      id: 'SP-PRO',
      name: 'Peşəkar (Pro)',
      monthlyPrice: 49.0,
      domesticCommission: 5.0,
      foreignCommission: 7.0,
      features: JSON.stringify([
        '50 aktiv tur elanı',
        '5% güzəştli platform komissiyası',
        'Avtobus oturacaq interaktiv seçimi',
        'FİN kod ilə sərnişin siyahısı (roster)',
        'QR Bilet Yoxlama skaneri',
        'API Açar inteqrasiyası',
        '24/7 Prioritetli dəstək'
      ])
    },
    {
      id: 'SP-ENTERPRISE',
      name: 'Korporativ (Enterprise)',
      monthlyPrice: 149.0,
      domesticCommission: 3.0,
      foreignCommission: 5.0,
      features: JSON.stringify([
        'Limitsiz aktiv tur elanları',
        '3% minimum platform komissiyası',
        'Fərdi menecer dəstəyi',
        'Reklam bannerlərində 20% endirim',
        'Avtomatlaşdırılmış e-Qaimə integrasiyası',
        'Genişləndirilmiş komanda RBAC rolları'
      ])
    }
  ];

  for (const p of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: p.id },
      update: p,
      create: p
    });
    console.log(`Plan upserted: ${p.name}`);
  }

  // 2. Assign Pro plan to company and set availableBalance + bank details
  await prisma.company.update({
    where: { id: companyId },
    data: {
      planId: 'SP-PRO',
      availableBalance: 409.50,
      pendingBalance: 120.00,
      iban: 'AZ12ABB0000000012345678901',
      bankName: 'Azərbaycan Beynəlxalq Bankı (ABB)'
    }
  });
  console.log(`Company ${companyId} updated with balance 409.50 AZN and Pro plan`);

  // 3. Transactions for the 4 bookings
  const transactions = [
    {
      id: 'TX-BK-101',
      companyId,
      bookingId: 'TS-2026-101',
      type: 'TICKET_SALE',
      amount: 130.00,
      commission: 13.00,
      netAmount: 117.00,
      status: 'Completed',
      description: 'Quba — Qəçrəş turu bilet satışı (2 yer)'
    },
    {
      id: 'TX-BK-102',
      companyId,
      bookingId: 'TS-2026-102',
      type: 'TICKET_SALE',
      amount: 65.00,
      commission: 6.50,
      netAmount: 58.50,
      status: 'Completed',
      description: 'Quba — Qəçrəş turu bilet satışı (1 yer)'
    },
    {
      id: 'TX-BK-103',
      companyId,
      bookingId: 'TS-2026-103',
      type: 'TICKET_SALE',
      amount: 195.00,
      commission: 19.50,
      netAmount: 175.50,
      status: 'Completed',
      description: 'Quba — Qəçrəş turu bilet satışı (3 yer)'
    },
    {
      id: 'TX-BK-104',
      companyId,
      bookingId: 'TS-2026-104',
      type: 'TICKET_SALE',
      amount: 65.00,
      commission: 6.50,
      netAmount: 58.50,
      status: 'Completed',
      description: 'Türkiyə, Antalya turu bilet satışı (1 yer)'
    }
  ];

  for (const t of transactions) {
    await prisma.transaction.upsert({
      where: { id: t.id },
      update: t,
      create: t
    });
    console.log(`Transaction created: ${t.id}`);
  }

  // 4. Sample Payouts
  const samplePayouts = [
    {
      id: 'P-948201',
      companyId,
      amount: 250.00,
      status: 'Completed',
      bankAccount: 'AZ12ABB0000000012345678901'
    },
    {
      id: 'P-948202',
      companyId,
      amount: 75.00,
      status: 'Pending',
      bankAccount: 'AZ12ABB0000000012345678901'
    }
  ];

  for (const p of samplePayouts) {
    await prisma.payout.upsert({
      where: { id: p.id },
      update: p,
      create: p
    });
    console.log(`Payout created: ${p.id} (${p.status})`);
  }

  console.log('Finance seeding completed successfully!');
  await prisma.$disconnect();
}

seedFinance().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
