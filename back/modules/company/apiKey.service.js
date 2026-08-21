import crypto from 'crypto';

class ApiKeyService {
  constructor() {
    this.apiKeysStore = new Map(); // Production environment-də redis / DB store
  }

  // Cryptographic API Key Generasiyası (ts_live_XXXXX)
  generateApiKey(companyId, keyName = 'Default API Key') {
    const rawSecret = `ts_live_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');

    const keyData = {
      id: `AK-${Date.now()}`,
      companyId,
      keyName,
      keyHash,
      createdAt: new Date(),
      status: 'ACTIVE',
      rateLimitPerMinute: 60,
      requestCount: 0
    };

    this.apiKeysStore.set(keyHash, keyData);

    return {
      id: keyData.id,
      keyName,
      rawSecretKey: rawSecret, // Yalnız 1 dəfə göstərilir
      rateLimitPerMinute: keyData.rateLimitPerMinute
    };
  }

  // API Key Verifikasiyası & Rate Limiting
  validateApiKey(rawSecretKey) {
    if (!rawSecretKey || !rawSecretKey.startsWith('ts_live_')) {
      return { valid: false, reason: 'İnvalid API Key formatı.' };
    }

    const hash = crypto.createHash('sha256').update(rawSecretKey).digest('hex');
    const keyData = this.apiKeysStore.get(hash);

    if (!keyData || keyData.status !== 'ACTIVE') {
      return { valid: false, reason: 'Aktiv API Key tapılmadı.' };
    }

    keyData.requestCount += 1;
    return { valid: true, companyId: keyData.companyId, requestCount: keyData.requestCount };
  }
}

export const apiKeyService = new ApiKeyService();
export default apiKeyService;
