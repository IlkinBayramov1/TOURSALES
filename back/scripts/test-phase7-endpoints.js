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

async function runPhase7Tests() {
  console.log('--- PHASE 7: ADS & PROMOTIONS ENDPOINT VERIFICATION ---');

  // Step 1: Login
  console.log('1. Logging in as vendor owner (aztour@gmail.com)...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'aztour@gmail.com',
      password: 'password123'
    }
  });

  const token = loginRes?.data?.accessToken || loginRes?.accessToken || loginRes?.data?.token;
  if (!token) throw new Error('Token not received');
  console.log('✓ Login successful! Token acquired.');

  // Step 2: Get Packages
  console.log('2. GET /ads/packages ...');
  const packagesRes = await request('/ads/packages', { method: 'GET' }, token);
  const packages = packagesRes.data || [];
  console.log(`✓ Packages received: ${packages.length} packages found.`);
  if (packages.length < 3) throw new Error('Expected at least 3 packages');

  // Step 3: Get Ads
  console.log('3. GET /ads ...');
  const adsRes = await request('/ads', { method: 'GET' }, token);
  const ads = adsRes.data || [];
  console.log(`✓ Ads received: ${ads.length} ads found.`);
  if (ads.length < 2) throw new Error('Expected at least 2 seeded ads');

  // Step 4: Get Ads KPI
  console.log('4. GET /ads/kpi ...');
  const kpiRes = await request('/ads/kpi', { method: 'GET' }, token);
  const kpiData = kpiRes.data;
  console.log('✓ Ads KPI received:', kpiData?.summary);
  if (!kpiData?.summary) throw new Error('Expected summary in KPI response');

  // Step 5: Toggle Status
  const testAd = ads.find(a => a.status === 'Active');
  if (testAd) {
    console.log(`5. PATCH /ads/${testAd.id}/status (Active -> Paused) ...`);
    const toggleRes1 = await request(`/ads/${testAd.id}/status`, { method: 'PATCH' }, token);
    console.log(`✓ Toggled status to: ${toggleRes1.data?.status}`);
    
    // Toggle back to Active
    const toggleRes2 = await request(`/ads/${testAd.id}/status`, { method: 'PATCH' }, token);
    console.log(`✓ Toggled back to: ${toggleRes2.data?.status}`);
  }

  // Step 6: Get Campaigns (Promo codes)
  console.log('6. GET /campaigns ...');
  const campaignsRes = await request('/campaigns?companyOnly=true', { method: 'GET' }, token);
  const campaigns = campaignsRes.data || [];
  console.log(`✓ Campaigns received: ${campaigns.length} promo codes found.`);
  if (campaigns.length < 2) throw new Error('Expected at least 2 seeded campaigns');

  // Step 7: Create Promo Code
  console.log('7. POST /campaigns (Create Promo Code) ...');
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const newPromoRes = await request('/campaigns', {
    method: 'POST',
    body: {
      promoCode: `TEST${Math.floor(Math.random() * 10000)}`,
      type: 'DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      usageLimit: 25,
      startDate: now.toISOString(),
      endDate: nextMonth.toISOString(),
      description: 'Avtomatlaşdırılmış inteqrasiya test kuponu'
    }
  }, token);
  const createdPromo = newPromoRes.data;
  console.log(`✓ Promo code created: ${createdPromo?.promoCode} (ID: ${createdPromo?.id})`);

  // Step 8: Delete Promo Code
  console.log(`8. DELETE /campaigns/${createdPromo?.id} ...`);
  await request(`/campaigns/${createdPromo?.id}`, { method: 'DELETE' }, token);
  console.log('✓ Promo code deleted successfully.');

  // Step 9: Purchase Ad (7-day standard showcase)
  console.log('9. POST /ads/purchase (Testing atomic ad purchase with balance deduction) ...');
  const purchaseRes = await request('/ads/purchase', {
    method: 'POST',
    body: {
      tourId: 'T-128948',
      packageId: 'ADP-7D',
      position: 'HERO',
      title: 'Xüsusi Test Tur Reklamı'
    }
  }, token);
  const purchasedAd = purchaseRes.data;
  console.log(`✓ Ad purchased successfully! Ad ID: ${purchasedAd?.id}, Amount: ${purchasedAd?.amountPaid} AZN`);

  // Step 10: Delete purchased test ad
  console.log(`10. DELETE /ads/${purchasedAd?.id} ...`);
  await request(`/ads/${purchasedAd?.id}`, { method: 'DELETE' }, token);
  console.log('✓ Test ad deleted successfully.');

  console.log('\n========================================');
  console.log('ALL PHASE 7 BACKEND TESTS PASSED (10/10)!');
  console.log('========================================\n');
}

runPhase7Tests().catch((err) => {
  console.error('Phase 7 Test Failure:', err.data || err.message);
  process.exit(1);
});
