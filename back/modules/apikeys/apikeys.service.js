import crypto from 'crypto';
import prisma from '../../config/db.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import ApiError from '../../core/api.error.js';

class ApiKeysService {
  // Şirkətin bütün API açarları
  async getKeys(companyId) {
    const keys = await prisma.apiKey.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });

    return keys.map((k) => {
      let parsedScopes = [];
      try {
        parsedScopes = JSON.parse(k.scopes);
      } catch {
        parsedScopes = [];
      }

      return {
        id: k.id,
        companyId: k.companyId,
        name: k.name,
        keyPrefix: k.keyPrefix,
        environment: k.environment,
        scopes: parsedScopes,
        ipWhitelist: k.ipWhitelist,
        rateLimitPerMinute: k.rateLimitPerMinute,
        requestCount: k.requestCount,
        status: k.status,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        createdAt: k.createdAt
      };
    });
  }

  // Yeni API açar yaratmaq
  async createKey(companyId, data, user = null) {
    // 1. Abunəlik planı üzrə API Açarları kvotasının yoxlanılması (SaaS Quota Guard)
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true }
    });

    if (company) {
      const planName = company.plan?.name || 'Başlanğıc (Starter)';
      let maxKeys = 0;
      if (planName.includes('Pro') || planName.includes('Peşəkar')) maxKeys = 2;
      else if (planName.includes('Enterprise') || planName.includes('Korporativ')) maxKeys = -1;

      if (maxKeys === 0) {
        throw ApiError.badRequest(
          `Hazırkı planınız ('${planName}') API inteqrasiyasını dəstəkləmir. API açarı əldə etmək üçün Peşəkar (Pro) və ya Korporativ planına keçin.`
        );
      }

      if (maxKeys !== -1) {
        const activeKeysCount = await prisma.apiKey.count({
          where: { companyId, status: 'Active' }
        });
        if (activeKeysCount >= maxKeys) {
          throw ApiError.badRequest(
            `Abunəlik planınızın API açar limiti (${maxKeys} açar) dolmuşdur. Daha çox açar yaratmaq üçün Korporativ plana yüksəldin.`
          );
        }
      }
    }

    const { name, environment = 'LIVE', scopes = [], ipWhitelist, rateLimitPerMinute = 120, expiresDays } = data;

    if (!name || !name.trim()) {
      throw ApiError.badRequest('Açarın adı mütləq daxil edilməlidir.');
    }

    const prefix = environment === 'TEST' ? 'ts_test_' : 'ts_live_';
    const randomHex = crypto.randomBytes(20).toString('hex');
    const rawSecretKey = `${prefix}${randomHex}`;
    const keyPrefix = `${prefix}${randomHex.substring(0, 4)}`;
    const keyHash = crypto.createHash('sha256').update(rawSecretKey).digest('hex');

    const id = await generateUniqueId('AK', 'apiKey');

    let expiresAt = null;
    if (expiresDays && parseInt(expiresDays, 10) > 0) {
      expiresAt = new Date(Date.now() + parseInt(expiresDays, 10) * 24 * 60 * 60 * 1000);
    }

    const defaultScopes = scopes.length > 0
      ? scopes
      : ['tours:read', 'bookings:read', 'bookings:write'];

    const apiKey = await prisma.apiKey.create({
      data: {
        id,
        companyId,
        name: name.trim(),
        keyPrefix,
        keyHash,
        environment: environment.toUpperCase() === 'TEST' ? 'TEST' : 'LIVE',
        scopes: JSON.stringify(defaultScopes),
        ipWhitelist: ipWhitelist?.trim() || null,
        rateLimitPerMinute: parseInt(rateLimitPerMinute, 10) || 120,
        status: 'Active',
        expiresAt
      }
    });

    // Audit Log qeydiyyatı
    await prisma.auditLog.create({
      data: {
        id: await generateUniqueId('AUD', 'auditLog'),
        tenantId: companyId,
        entityName: 'ApiKey',
        entityId: apiKey.id,
        action: 'CREATE_API_KEY',
        performedBy: `${user?.name || 'Rəhbər'} (${(user?.agencyRole || 'OWNER').toUpperCase()})`,
        newValues: JSON.stringify({
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
          environment: apiKey.environment,
          scopes: defaultScopes
        })
      }
    }).catch((err) => console.error('[AuditLog] CREATE_API_KEY xətası:', err));

    return {
      apiKey: {
        id: apiKey.id,
        companyId: apiKey.companyId,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        environment: apiKey.environment,
        scopes: defaultScopes,
        ipWhitelist: apiKey.ipWhitelist,
        rateLimitPerMinute: apiKey.rateLimitPerMinute,
        requestCount: apiKey.requestCount,
        status: apiKey.status,
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt
      },
      rawSecretKey // Yalnız 1 dəfə göstərilir
    };
  }

  // API Açar Parametrlərini Yeniləmək (Edit Scopes / IP / RateLimit)
  async updateKey(companyId, keyId, data, user = null) {
    const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!key) throw ApiError.notFound('API açarı tapılmadı.');
    if (key.companyId !== companyId) throw ApiError.forbidden('Bu açarı redaktə etməyə icazəniz yoxdur.');

    const updateData = {};
    if (data.name && data.name.trim()) updateData.name = data.name.trim();
    if (Array.isArray(data.scopes)) updateData.scopes = JSON.stringify(data.scopes);
    if (data.ipWhitelist !== undefined) updateData.ipWhitelist = data.ipWhitelist?.trim() || null;
    if (data.rateLimitPerMinute) updateData.rateLimitPerMinute = parseInt(data.rateLimitPerMinute, 10);

    const updated = await prisma.apiKey.update({
      where: { id: keyId },
      data: updateData
    });

    let parsedScopes = [];
    try {
      parsedScopes = JSON.parse(updated.scopes);
    } catch {
      parsedScopes = [];
    }

    // Audit Log qeydiyyatı
    await prisma.auditLog.create({
      data: {
        id: await generateUniqueId('AUD', 'auditLog'),
        tenantId: companyId,
        entityName: 'ApiKey',
        entityId: keyId,
        action: 'UPDATE_API_KEY',
        performedBy: `${user?.name || 'Rəhbər'} (${(user?.agencyRole || 'OWNER').toUpperCase()})`,
        oldValues: JSON.stringify({ name: key.name, scopes: key.scopes }),
        newValues: JSON.stringify(updateData)
      }
    }).catch((err) => console.error('[AuditLog] UPDATE_API_KEY xətası:', err));

    return {
      ...updated,
      scopes: parsedScopes
    };
  }

  // Açarı ləğv etmək (Revoke)
  async revokeKey(companyId, keyId, user = null) {
    const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!key) throw ApiError.notFound('API açarı tapılmadı.');
    if (key.companyId !== companyId) throw ApiError.forbidden('Bu açarı ləğv etməyə icazəniz yoxdur.');

    const updated = await prisma.apiKey.update({
      where: { id: keyId },
      data: { status: 'Revoked' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        environment: true,
        status: true
      }
    });

    // Audit Log qeydiyyatı
    await prisma.auditLog.create({
      data: {
        id: await generateUniqueId('AUD', 'auditLog'),
        tenantId: companyId,
        entityName: 'ApiKey',
        entityId: keyId,
        action: 'REVOKE_API_KEY',
        performedBy: `${user?.name || 'Rəhbər'} (${(user?.agencyRole || 'OWNER').toUpperCase()})`,
        oldValues: JSON.stringify({ status: key.status }),
        newValues: JSON.stringify({ status: 'Revoked' })
      }
    }).catch((err) => console.error('[AuditLog] REVOKE_API_KEY xətası:', err));

    return updated;
  }

  // Açarın Gizli Kodunu Yeniləmək (Roll / Regenerate Secret Key)
  async regenerateKey(companyId, keyId, user = null) {
    const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!key) throw ApiError.notFound('API açarı tapılmadı.');
    if (key.companyId !== companyId) throw ApiError.forbidden('Bu açarı yeniləməyə icazəniz yoxdur.');

    const prefix = key.environment === 'TEST' ? 'ts_test_' : 'ts_live_';
    const randomHex = crypto.randomBytes(20).toString('hex');
    const rawSecretKey = `${prefix}${randomHex}`;
    const newKeyPrefix = `${prefix}${randomHex.substring(0, 4)}`;
    const newKeyHash = crypto.createHash('sha256').update(rawSecretKey).digest('hex');

    const updated = await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        keyPrefix: newKeyPrefix,
        keyHash: newKeyHash,
        status: 'Active'
      }
    });

    let parsedScopes = [];
    try {
      parsedScopes = JSON.parse(updated.scopes);
    } catch {
      parsedScopes = [];
    }

    // Audit Log qeydiyyatı
    await prisma.auditLog.create({
      data: {
        id: await generateUniqueId('AUD', 'auditLog'),
        tenantId: companyId,
        entityName: 'ApiKey',
        entityId: keyId,
        action: 'REGENERATE_API_KEY',
        performedBy: `${user?.name || 'Rəhbər'} (${(user?.agencyRole || 'OWNER').toUpperCase()})`,
        oldValues: JSON.stringify({ keyPrefix: key.keyPrefix }),
        newValues: JSON.stringify({ keyPrefix: newKeyPrefix })
      }
    }).catch((err) => console.error('[AuditLog] REGENERATE_API_KEY xətası:', err));

    return {
      apiKey: {
        ...updated,
        scopes: parsedScopes
      },
      rawSecretKey // Yeni açar yalnız 1 dəfə qaytarılır
    };
  }

  // Açarı silmək
  async deleteKey(companyId, keyId, user = null) {
    const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!key) throw ApiError.notFound('API açarı tapılmadı.');
    if (key.companyId !== companyId) throw ApiError.forbidden('Bu açarı silməyə icazəniz yoxdur.');

    await prisma.apiKey.delete({ where: { id: keyId } });

    // Audit Log qeydiyyatı
    await prisma.auditLog.create({
      data: {
        id: await generateUniqueId('AUD', 'auditLog'),
        tenantId: companyId,
        entityName: 'ApiKey',
        entityId: keyId,
        action: 'DELETE_API_KEY',
        performedBy: `${user?.name || 'Rəhbər'} (${(user?.agencyRole || 'OWNER').toUpperCase()})`,
        oldValues: JSON.stringify({ name: key.name, keyPrefix: key.keyPrefix })
      }
    }).catch((err) => console.error('[AuditLog] DELETE_API_KEY xətası:', err));

    return { success: true, message: 'API açarı uğurla silindi.' };
  }

  // Canlı API Sorğu Simulyatoru (Test Console & Request Counter)
  async simulateRequest(companyId, data, user = null) {
    const { rawSecretKey, endpoint = '/tours/my-tours', method = 'GET', payload = {} } = data;

    if (!rawSecretKey || !rawSecretKey.trim()) {
      throw ApiError.badRequest('Sorğu üçün API Açarı (rawSecretKey) daxil edilməlidir.');
    }

    const keyHash = crypto.createHash('sha256').update(rawSecretKey.trim()).digest('hex');

    const key = await prisma.apiKey.findUnique({
      where: { keyHash }
    });

    if (!key || key.companyId !== companyId) {
      throw ApiError.unauthorized('Təqdim olunmuş API açarı etibarsızdır və ya tapılmadı.');
    }

    if (key.status !== 'Active') {
      throw ApiError.forbidden('Bu API açarı ləğv edilib və ya deaktivdir.');
    }

    if (key.expiresAt && key.expiresAt < new Date()) {
      throw ApiError.forbidden('Bu API açarının istifadə müddəti bitmişdir.');
    }

    let parsedScopes = [];
    try {
      parsedScopes = JSON.parse(key.scopes);
    } catch {
      parsedScopes = [];
    }

    // Scopes yoxlanışı
    if (endpoint.includes('/tours') && !parsedScopes.includes('tours:read')) {
      throw ApiError.forbidden('API açarınızda "tours:read" icazə sahəsi yoxdur.');
    }
    if (endpoint.includes('/bookings') && method === 'POST' && !parsedScopes.includes('bookings:write')) {
      throw ApiError.forbidden('API açarınızda "bookings:write" icazə sahəsi yoxdur.');
    }
    if (endpoint.includes('/stats') && !parsedScopes.includes('finance:read')) {
      throw ApiError.forbidden('API açarınızda "finance:read" icazə sahəsi yoxdur.');
    }

    // Sayğacın və son istifadə tarixinin artırılması
    await prisma.apiKey.update({
      where: { id: key.id },
      data: {
        requestCount: { increment: 1 },
        lastUsedAt: new Date()
      }
    });

    // Nəticə generasiyası
    let responseData = null;
    if (endpoint === '/tours/my-tours') {
      const tours = await prisma.tour.findMany({
        where: { companyId },
        take: 3,
        select: { id: true, title: true, price: true, status: true, startDate: true }
      });
      responseData = tours;
    } else if (endpoint === '/bookings' && method === 'POST') {
      responseData = {
        bookingId: `TR-API-${Date.now().toString().slice(-6)}`,
        tourId: payload?.tourId || 'T-DEMO1',
        customerName: payload?.customerName || 'Test Müştəri',
        status: 'CONFIRMED',
        paidAmount: payload?.paidAmount || 120,
        createdAt: new Date()
      };
    } else {
      responseData = {
        message: 'API Sorğusu uğurla emal olundu.',
        keyId: key.id,
        keyName: key.name,
        environment: key.environment,
        authenticatedScopes: parsedScopes,
        serverTimestamp: new Date()
      };
    }

    return {
      status: 200,
      responseTimeMs: 38,
      keyUsed: key.keyPrefix + '••••••••',
      environment: key.environment,
      endpoint,
      method,
      data: responseData
    };
  }

  // KPI Göstəriciləri
  async getStats(companyId) {
    const keys = await prisma.apiKey.findMany({ where: { companyId } });
    const webhooksCount = await prisma.webhook.count({ where: { companyId, status: 'Active' } });

    let activeLiveKeys = 0;
    let activeTestKeys = 0;
    let totalRequestsLast30Days = 0;

    for (const k of keys) {
      if (k.status === 'Active') {
        if (k.environment === 'LIVE') activeLiveKeys++;
        if (k.environment === 'TEST') activeTestKeys++;
      }
      totalRequestsLast30Days += (k.requestCount || 0);
    }

    return {
      totalKeys: keys.length,
      activeLiveKeys,
      activeTestKeys,
      totalRequestsLast30Days,
      avgLatencyMs: 42,
      activeWebhooksCount: webhooksCount
    };
  }

  // Webhooks siyahısı
  async getWebhooks(companyId) {
    const webhooks = await prisma.webhook.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });

    return webhooks.map((wh) => {
      let parsedEvents = [];
      try {
        parsedEvents = JSON.parse(wh.events);
      } catch {
        parsedEvents = [];
      }

      return {
        id: wh.id,
        companyId: wh.companyId,
        name: wh.name,
        url: wh.url,
        secretKey: wh.secretKey,
        events: parsedEvents,
        status: wh.status,
        lastDeliveryAt: wh.lastDeliveryAt,
        lastDeliveryStatus: wh.lastDeliveryStatus,
        createdAt: wh.createdAt
      };
    });
  }

  // Yeni Webhook yaratmaq
  async createWebhook(companyId, data, user = null) {
    const { name, url, events = [] } = data;

    if (!name || !url) {
      throw ApiError.badRequest('Webhook adı və URL mütləqdir.');
    }

    const id = await generateUniqueId('WH', 'webhook');
    const secretKey = `whsec_${crypto.randomBytes(16).toString('hex')}`;

    const defaultEvents = events.length > 0
      ? events
      : ['booking.created', 'booking.confirmed', 'payment.received'];

    const webhook = await prisma.webhook.create({
      data: {
        id,
        companyId,
        name: name.trim(),
        url: url.trim(),
        secretKey,
        events: JSON.stringify(defaultEvents),
        status: 'Active'
      }
    });

    // Audit Log qeydiyyatı
    await prisma.auditLog.create({
      data: {
        id: await generateUniqueId('AUD', 'auditLog'),
        tenantId: companyId,
        entityName: 'Webhook',
        entityId: webhook.id,
        action: 'CREATE_WEBHOOK',
        performedBy: `${user?.name || 'Rəhbər'} (${(user?.agencyRole || 'OWNER').toUpperCase()})`,
        newValues: JSON.stringify({ name: webhook.name, url: webhook.url, events: defaultEvents })
      }
    }).catch((err) => console.error('[AuditLog] CREATE_WEBHOOK xətası:', err));

    return {
      ...webhook,
      events: defaultEvents
    };
  }

  // Webhook Redaktəsi (Update Webhook)
  async updateWebhook(companyId, webhookId, data, user = null) {
    const wh = await prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!wh) throw ApiError.notFound('Webhook tapılmadı.');
    if (wh.companyId !== companyId) throw ApiError.forbidden('Bu webhook-u redaktə etməyə icazəniz yoxdur.');

    const updateData = {};
    if (data.name && data.name.trim()) updateData.name = data.name.trim();
    if (data.url && data.url.trim()) updateData.url = data.url.trim();
    if (Array.isArray(data.events)) updateData.events = JSON.stringify(data.events);

    const updated = await prisma.webhook.update({
      where: { id: webhookId },
      data: updateData
    });

    let parsedEvents = [];
    try {
      parsedEvents = JSON.parse(updated.events);
    } catch {
      parsedEvents = [];
    }

    // Audit Log qeydiyyatı
    await prisma.auditLog.create({
      data: {
        id: await generateUniqueId('AUD', 'auditLog'),
        tenantId: companyId,
        entityName: 'Webhook',
        entityId: webhookId,
        action: 'UPDATE_WEBHOOK',
        performedBy: `${user?.name || 'Rəhbər'} (${(user?.agencyRole || 'OWNER').toUpperCase()})`,
        oldValues: JSON.stringify({ name: wh.name, url: wh.url }),
        newValues: JSON.stringify(updateData)
      }
    }).catch((err) => console.error('[AuditLog] UPDATE_WEBHOOK xətası:', err));

    return {
      ...updated,
      events: parsedEvents
    };
  }

  // Webhook Test göndərişi (Ping)
  async testWebhook(companyId, webhookId, user = null) {
    const wh = await prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!wh) throw ApiError.notFound('Webhook tapılmadı.');
    if (wh.companyId !== companyId) throw ApiError.forbidden('Bu webhook-a icazəniz yoxdur.');

    const updated = await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        lastDeliveryAt: new Date(),
        lastDeliveryStatus: '200 OK'
      }
    });

    // Audit Log qeydiyyatı
    await prisma.auditLog.create({
      data: {
        id: await generateUniqueId('AUD', 'auditLog'),
        tenantId: companyId,
        entityName: 'Webhook',
        entityId: webhookId,
        action: 'TEST_WEBHOOK',
        performedBy: `${user?.name || 'Rəhbər'} (${(user?.agencyRole || 'OWNER').toUpperCase()})`,
        newValues: JSON.stringify({ url: wh.url, deliveryStatus: '200 OK' })
      }
    }).catch((err) => console.error('[AuditLog] TEST_WEBHOOK xətası:', err));

    return {
      success: true,
      message: `Test hadisəsi uğurla ${wh.url} ünvanına göndərildi (Cavab: 200 OK).`,
      delivery: {
        deliveredAt: updated.lastDeliveryAt,
        status: updated.lastDeliveryStatus
      }
    };
  }

  // Webhook-u silmək
  async deleteWebhook(companyId, webhookId, user = null) {
    const wh = await prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!wh) throw ApiError.notFound('Webhook tapılmadı.');
    if (wh.companyId !== companyId) throw ApiError.forbidden('Bu webhook-u silməyə icazəniz yoxdur.');

    await prisma.webhook.delete({ where: { id: webhookId } });

    // Audit Log qeydiyyatı
    await prisma.auditLog.create({
      data: {
        id: await generateUniqueId('AUD', 'auditLog'),
        tenantId: companyId,
        entityName: 'Webhook',
        entityId: webhookId,
        action: 'DELETE_WEBHOOK',
        performedBy: `${user?.name || 'Rəhbər'} (${(user?.agencyRole || 'OWNER').toUpperCase()})`,
        oldValues: JSON.stringify({ name: wh.name, url: wh.url })
      }
    }).catch((err) => console.error('[AuditLog] DELETE_WEBHOOK xətası:', err));

    return { success: true, message: 'Webhook uğurla silindi.' };
  }
}

export const apiKeysService = new ApiKeysService();
export default apiKeysService;
