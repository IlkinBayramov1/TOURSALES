import crypto from 'crypto';
import prisma from '../config/db.js';

async function seedApiKeys() {
  console.log('Seeding API Keys & Webhooks for vendor C-586288...');

  const companyId = 'C-586288';
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    console.error(`Company ${companyId} not found!`);
    process.exit(1);
  }

  const hashKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

  // 1. Seed API Keys
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const keys = [
    {
      id: 'AK-LIVE-01',
      companyId,
      name: 'Rəsmi Vebsayt Bilet Satış Vidjeti',
      keyPrefix: 'ts_live_4f92',
      keyHash: hashKey('ts_live_secret_4f92_production_key'),
      environment: 'LIVE',
      scopes: JSON.stringify(['tours:read', 'bookings:read', 'bookings:write']),
      ipWhitelist: '185.120.45.10, 185.120.45.11',
      rateLimitPerMinute: 120,
      requestCount: 342,
      status: 'Active',
      lastUsedAt: twoHoursAgo
    },
    {
      id: 'AK-TEST-01',
      companyId,
      name: 'Test / Sandbox Development Açarı',
      keyPrefix: 'ts_test_8b11',
      keyHash: hashKey('ts_test_secret_8b11_sandbox_key'),
      environment: 'TEST',
      scopes: JSON.stringify(['tours:read', 'tours:write', 'bookings:read', 'bookings:write', 'finance:read']),
      ipWhitelist: null,
      rateLimitPerMinute: 60,
      requestCount: 58,
      status: 'Active',
      lastUsedAt: oneDayAgo
    }
  ];

  for (const k of keys) {
    await prisma.apiKey.upsert({
      where: { id: k.id },
      update: k,
      create: k
    });
  }
  console.log('✓ 2 API Keys upserted successfully.');

  // 2. Seed Webhook
  const webhook = {
    id: 'WH-01',
    companyId,
    name: 'Agentlik CRM Hadisə Dinləyicisi',
    url: 'https://aztour.az/api/webhooks/toursales',
    secretKey: 'whsec_8841029481940182',
    events: JSON.stringify(['booking.created', 'booking.confirmed', 'payment.received']),
    status: 'Active',
    lastDeliveryAt: twoHoursAgo,
    lastDeliveryStatus: '200 OK'
  };

  await prisma.webhook.upsert({
    where: { id: webhook.id },
    update: webhook,
    create: webhook
  });
  console.log('✓ 1 Webhook upserted successfully.');

  console.log('API Keys & Webhooks seeding completed successfully!');
  await prisma.$disconnect();
}

seedApiKeys().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
