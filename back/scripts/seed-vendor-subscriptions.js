import prisma from '../config/db.js';

async function seedSubscriptions() {
  console.log('Seeding vendor subscription payments & billing settings...');

  const companyId = 'C-586288';
  const planId = 'SP-PRO';

  // 1. Ensure company is on SP-PRO with next billing date 30 days ahead
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 28);

  await prisma.company.update({
    where: { id: companyId },
    data: {
      planId,
      autoRenewSubscription: true,
      nextBillingDate: nextMonth,
    }
  });
  console.log('✓ Company updated with SP-PRO and nextBillingDate:', nextMonth.toISOString().split('T')[0]);

  // 2. Clear old payments if any
  await prisma.subscriptionPayment.deleteMany({
    where: { companyId }
  });

  // 3. Create 2 sample past payments
  const lastMonth = new Date();
  lastMonth.setDate(lastMonth.getDate() - 32);

  const thisMonth = new Date();
  thisMonth.setDate(thisMonth.getDate() - 2);

  await prisma.subscriptionPayment.createMany({
    data: [
      {
        id: 'SPY-2026-08',
        companyId,
        planId,
        amount: 49.0,
        paymentDate: lastMonth,
        dueDate: lastMonth,
        status: 'Paid',
      },
      {
        id: 'SPY-2026-09',
        companyId,
        planId,
        amount: 49.0,
        paymentDate: thisMonth,
        dueDate: thisMonth,
        status: 'Paid',
      }
    ]
  });

  console.log('✓ Seeded 2 subscription payment invoices for C-586288.');
  console.log('Done!');
  await prisma.$disconnect();
}

seedSubscriptions().catch((err) => {
  console.error('Error seeding subscriptions:', err);
  process.exit(1);
});
