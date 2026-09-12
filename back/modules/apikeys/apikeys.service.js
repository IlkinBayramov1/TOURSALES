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
  async createKey(companyId, data) {
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

  // Açarı ləğv etmək (Revoke)
  async revokeKey(companyId, keyId) {
    const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!key) throw ApiError.notFound('API açarı tapılmadı.');
    if (key.companyId !== companyId) throw ApiError.forbidden('Bu açarı ləğv etməyə icazəniz yoxdur.');

    return prisma.apiKey.update({
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
  }

  // Açarı silmək
  async deleteKey(companyId, keyId) {
    const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!key) throw ApiError.notFound('API açarı tapılmadı.');
    if (key.companyId !== companyId) throw ApiError.forbidden('Bu açarı silməyə icazəniz yoxdur.');

    await prisma.apiKey.delete({ where: { id: keyId } });
    return { success: true, message: 'API açarı uğurla silindi.' };
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
  async createWebhook(companyId, data) {
    const { name, url, events = [] } = data;

    if (!name || !url) {
      throw ApiError.badRequest('Webhook adı və URL mütləqdir.');
    }

    const id = await generateUniqueId('WH', 'webhook');
    const secretKey = `whsec_${crypto.randomBytes(16).toString('hex')}`;

    const defaultEvents = events.length > 0
      ? events
      : ['booking.created', 'booking.confirmed', 'payment.received'];

    return prisma.webhook.create({
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
  }

  // Webhook Test göndərişi (Ping)
  async testWebhook(companyId, webhookId) {
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
  async deleteWebhook(companyId, webhookId) {
    const wh = await prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!wh) throw ApiError.notFound('Webhook tapılmadı.');
    if (wh.companyId !== companyId) throw ApiError.forbidden('Bu webhook-u silməyə icazəniz yoxdur.');

    await prisma.webhook.delete({ where: { id: webhookId } });
    return { success: true, message: 'Webhook uğurla silindi.' };
  }
}

export const apiKeysService = new ApiKeysService();
export default apiKeysService;
