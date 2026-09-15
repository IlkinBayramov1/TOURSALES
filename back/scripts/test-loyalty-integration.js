import prisma from '../config/db.js';

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function runTests() {
  console.log('--- Starting Loyalty & Rewards Integration Tests ---');
  let testUserId = null;

  try {
    // 1. Test Public Offers Endpoint
    console.log('\n[1/5] Testing GET /loyalty/offers (Public)...');
    const offersRes = await fetch(`${BASE_URL}/loyalty/offers`);
    console.log(`Status: ${offersRes.status}`);
    const offersJson = await offersRes.json();
    const offers = offersJson?.data || [];
    console.log(`Offers count: ${offers.length}`);
    if (offers.length < 6) {
      throw new Error(`Expected at least 6 offers, found ${offers.length}`);
    }
    console.log('✓ Public offers returned successfully:');
    offers.forEach(o => console.log(`  - [${o.category}] ${o.partnerName}: ${o.offerName} (${o.requiredPoints} Xal)`));

    // 2. Test Customer Registration with Welcome Bonus
    console.log('\n[2/5] Testing POST /auth/register (Welcome 100 Points Award)...');
    const testEmail = `loyalty_test_${Date.now()}@toursales.az`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Loyalty Tester',
        email: testEmail,
        password: 'Password123!',
        role: 'User'
      })
    });
    console.log(`Status: ${regRes.status}`);
    const regJson = await regRes.json();
    const user = regJson?.data?.user;
    const token = regJson?.data?.accessToken;
    testUserId = user?.id;
    console.log(`Registered user: ${user.name} (${user.email}) - ID: ${user.id}`);
    console.log(`Initial Loyalty Points in response: ${user.loyaltyPoints}`);
    if (user.loyaltyPoints !== 100) {
      throw new Error(`Expected 100 initial loyalty points, got ${user.loyaltyPoints}`);
    }
    console.log('✓ 100 Welcome Points awarded on registration!');

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    // 3. Test Customer Overview & History
    console.log('\n[3/5] Testing GET /users/loyalty (Customer Overview)...');
    const overviewRes = await fetch(`${BASE_URL}/users/loyalty`, { headers: authHeaders });
    const overviewJson = await overviewRes.json();
    const overview = overviewJson?.data;
    console.log(`Points: ${overview.points}, Tier: ${overview.tier}, History entries: ${overview.history?.length}`);
    if (overview.points !== 100 || overview.tier !== 'BRONZE' || overview.history?.length === 0) {
      throw new Error(`Overview data mismatch: ${JSON.stringify(overview)}`);
    }
    console.log(`✓ First history entry: "${overview.history[0].description}" (+${overview.history[0].points} Xal)`);

    // 4. Test Insufficient Points Rejection
    console.log('\n[4/5] Testing POST /loyalty/redeem with insufficient points (Expected 400)...');
    const expensiveOffer = offers.find(o => o.requiredPoints > 100);
    const failRes = await fetch(`${BASE_URL}/loyalty/redeem`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ offerId: expensiveOffer.id })
    });
    console.log(`Status: ${failRes.status}`);
    const failJson = await failRes.json();
    if (failRes.status === 400) {
      console.log(`✓ Correctly rejected with 400: "${failJson.msg || failJson.message}"`);
    } else {
      throw new Error(`Expected 400 but got ${failRes.status}: ${JSON.stringify(failJson)}`);
    }

    // 5. Award extra points to test successful redemption
    console.log('\n[5/5] Testing successful redemption after earning points...');
    await prisma.user.update({
      where: { id: testUserId },
      data: { loyaltyPoints: 300 }
    });

    const redeemOffer = offers.find(o => o.requiredPoints === 150); // Starbucks offer
    const redeemRes = await fetch(`${BASE_URL}/loyalty/redeem`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ offerId: redeemOffer.id })
    });
    console.log(`Redeem Status: ${redeemRes.status}`);
    const redeemJson = await redeemRes.json();
    const redeemData = redeemJson?.data;
    console.log('Redeem result:', redeemData);
    if (!redeemData?.voucherCode || !redeemData.voucherCode.startsWith('RW-')) {
      throw new Error(`Invalid voucher code generated: ${redeemData?.voucherCode}`);
    }
    if (redeemData.remainingPoints !== 150) {
      throw new Error(`Expected remaining points 150, got ${redeemData.remainingPoints}`);
    }
    console.log(`✓ Voucher generated: ${redeemData.voucherCode}`);
    console.log(`✓ Remaining points: ${redeemData.remainingPoints}`);

    // Verify updated overview
    const finalOverviewRes = await fetch(`${BASE_URL}/users/loyalty`, { headers: authHeaders });
    const finalOverviewJson = await finalOverviewRes.json();
    const finalOverview = finalOverviewJson?.data;
    console.log(`Updated points in DB: ${finalOverview.points}`);
    console.log(`Updated history count: ${finalOverview.history.length}`);
    console.log(`Latest history item: "${finalOverview.history[0].description}" (${finalOverview.history[0].type})`);

    console.log('\n=============================================');
    console.log('🎉 ALL 5 LOYALTY INTEGRATION TESTS PASSED 100%!');
    console.log('=============================================\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (testUserId) {
      console.log('Cleaning up test user...');
      await prisma.loyaltyHistory.deleteMany({ where: { userId: testUserId } });
      await prisma.session.deleteMany({ where: { userId: testUserId } });
      await prisma.refreshSession.deleteMany({ where: { userId: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } });
      console.log('✓ Test user cleaned up.');
    }
    await prisma.$disconnect();
  }
}

runTests();
