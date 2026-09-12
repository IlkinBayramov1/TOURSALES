const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function request(url, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const error = new Error(`Request failed: ${res.status} ${res.statusText}`);
    error.status = res.status;
    error.data = json;
    throw error;
  }

  return json;
}

async function runPhase8Tests() {
  console.log('--- PHASE 8: API KEYS & INTEGRATIONS ENDPOINT VERIFICATION ---');

  // Step 1: Login
  console.log('1. Logging in as vendor owner (aztour@gmail.com)...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'aztour@gmail.com',
      password: 'password123'
    }
  });

  const token = loginRes?.data?.accessToken || loginRes?.accessToken;
  if (!token) throw new Error('Token not received');
  console.log('✓ Login successful! Token acquired.');

  // Step 2: Get API Keys
  console.log('2. GET /api-keys ...');
  const keysRes = await request('/api-keys', { method: 'GET' }, token);
  const keys = keysRes.data || [];
  console.log(`✓ API Keys received: ${keys.length} keys found.`);
  if (keys.length < 2) throw new Error('Expected at least 2 seeded keys');

  // Step 3: Get Stats
  console.log('3. GET /api-keys/stats ...');
  const statsRes = await request('/api-keys/stats', { method: 'GET' }, token);
  const stats = statsRes.data;
  console.log('✓ Stats received:', stats);
  if (stats.totalKeys === undefined) throw new Error('Expected totalKeys in stats');

  // Step 4: Create Test Key
  console.log('4. POST /api-keys (Create Key) ...');
  const createRes = await request('/api-keys', {
    method: 'POST',
    body: {
      name: 'Avtomatlaşdırılmış Test Açarı',
      environment: 'TEST',
      scopes: ['tours:read', 'bookings:read'],
      rateLimitPerMinute: 60
    }
  }, token);
  const createdKeyData = createRes.data;
  console.log(`✓ Key created: ${createdKeyData?.apiKey?.name} (Prefix: ${createdKeyData?.apiKey?.keyPrefix})`);
  console.log(`✓ Raw Secret returned: ${createdKeyData?.rawSecretKey?.substring(0, 15)}...`);
  if (!createdKeyData?.rawSecretKey?.startsWith('ts_test_')) {
    throw new Error('Expected rawSecretKey to start with ts_test_');
  }

  const testKeyId = createdKeyData?.apiKey?.id;

  // Step 5: Revoke Key
  console.log(`5. PATCH /api-keys/${testKeyId}/revoke ...`);
  const revokeRes = await request(`/api-keys/${testKeyId}/revoke`, { method: 'PATCH' }, token);
  console.log(`✓ Key revoked: status = ${revokeRes.data?.status}`);
  if (revokeRes.data?.status !== 'Revoked') throw new Error('Expected status Revoked');

  // Step 6: Delete Key
  console.log(`6. DELETE /api-keys/${testKeyId} ...`);
  await request(`/api-keys/${testKeyId}`, { method: 'DELETE' }, token);
  console.log('✓ Test key deleted successfully.');

  // Step 7: Get Webhooks
  console.log('7. GET /api-keys/webhooks/all ...');
  const webhooksRes = await request('/api-keys/webhooks/all', { method: 'GET' }, token);
  const webhooks = webhooksRes.data || [];
  console.log(`✓ Webhooks received: ${webhooks.length} webhooks found.`);
  if (webhooks.length < 1) throw new Error('Expected at least 1 seeded webhook');

  // Step 8: Create Webhook
  console.log('8. POST /api-keys/webhooks (Create Webhook) ...');
  const newWhRes = await request('/api-keys/webhooks', {
    method: 'POST',
    body: {
      name: 'Test Event Dispatcher',
      url: 'https://webhook.site/test-integration-endpoint',
      events: ['booking.created', 'payment.received']
    }
  }, token);
  const createdWh = newWhRes.data;
  console.log(`✓ Webhook created: ${createdWh?.name} (URL: ${createdWh?.url})`);
  const testWhId = createdWh?.id;

  // Step 9: Test Webhook (Ping)
  console.log(`9. POST /api-keys/webhooks/${testWhId}/test ...`);
  const pingRes = await request(`/api-keys/webhooks/${testWhId}/test`, { method: 'POST' }, token);
  console.log(`✓ Ping response: ${pingRes.msg}`);

  // Step 10: Delete Webhook
  console.log(`10. DELETE /api-keys/webhooks/${testWhId} ...`);
  await request(`/api-keys/webhooks/${testWhId}`, { method: 'DELETE' }, token);
  console.log('✓ Test webhook deleted successfully.');

  console.log('\n========================================');
  console.log('ALL PHASE 8 BACKEND TESTS PASSED (10/10)!');
  console.log('========================================\n');
}

runPhase8Tests().catch((err) => {
  console.error('Phase 8 Test Failure:', err.data || err.message);
  process.exit(1);
});
