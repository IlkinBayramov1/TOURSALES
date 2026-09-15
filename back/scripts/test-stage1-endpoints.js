const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
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

  return { status: res.status, ok: res.ok, data: json };
}

async function runStage1Verification() {
  console.log('====================================================');
  console.log('🚀 MƏRHƏLƏ 1: BACKEND PUBLIC API SINAQ TESTLƏRİ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [KEÇDİ] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [UĞURSUZ] ${message}`);
    }
  }

  // TEST 1: İctimai Reklamlar (GET /ads/public)
  console.log('1. GET /ads/public yoxlanılır...');
  const adsRes = await request('/ads/public');
  assert(adsRes.ok, `GET /ads/public status 200 qaytardı (Cavab: ${adsRes.status})`);
  assert(Array.isArray(adsRes.data?.data), 'Gələn data massiv tipindədir');
  console.log(`   Mövcud ictimai reklam sayı: ${adsRes.data?.data?.length || 0}`);

  // TEST 2: HERO mövqeli reklamlar
  console.log('\n2. GET /ads/public?position=HERO yoxlanılır...');
  const heroAdsRes = await request('/ads/public?position=HERO');
  assert(heroAdsRes.ok, `GET /ads/public?position=HERO status 200 qaytardı (Cavab: ${heroAdsRes.status})`);

  // TEST 3: İctimai Tərəfdaş Şirkətlər Kataloqu (GET /companies/public)
  console.log('\n3. GET /companies/public yoxlanılır...');
  const companiesRes = await request('/companies/public');
  assert(companiesRes.ok, `GET /companies/public status 200 qaytardı (Cavab: ${companiesRes.status})`);
  assert(Array.isArray(companiesRes.data?.data), 'Gələn şirkətlər data massiv tipindədir');
  console.log(`   Mövcud ictimai şirkət sayı: ${companiesRes.data?.data?.length || 0}`);

  // TEST 4: Şirkət Vitrini (GET /companies/public/:id)
  console.log('\n4. GET /companies/public/C-586288 yoxlanılır...');
  const companyProfileRes = await request('/companies/public/C-586288');
  assert(companyProfileRes.ok, `GET /companies/public/C-586288 status 200 qaytardı (Cavab: ${companyProfileRes.status})`);
  if (companyProfileRes.ok) {
    const c = companyProfileRes.data?.data;
    assert(c && c.name, `Şirkət adı mövcuddur: "${c?.name}"`);
    assert(Array.isArray(c?.tours), 'Şirkətin aktiv turları massiv şəklində əlavə olunub');
    console.log(`   Şirkət reytinqi: ${c?.rating}, Aktiv tur sayı: ${c?.tours?.length || 0}`);
  }

  // TEST 5: Aktiv Kampaniyalar (GET /campaigns/active)
  console.log('\n5. GET /campaigns/active yoxlanılır...');
  const campaignsRes = await request('/campaigns/active');
  assert(campaignsRes.ok, `GET /campaigns/active status 200 qaytardı (Cavab: ${campaignsRes.status})`);
  assert(Array.isArray(campaignsRes.data?.data), 'Kampaniyalar massiv şəklində qaytarıldı');
  console.log(`   Mövcud aktiv kampaniya sayı: ${campaignsRes.data?.data?.length || 0}`);

  // TEST 6: Promo Kod Validasiyası (POST /campaigns/validate)
  console.log('\n6. POST /campaigns/validate yoxlanılır (Boş / Test kodu ilə)...');
  const promoRes = await request('/campaigns/validate', {
    method: 'POST',
    body: { promoCode: 'INVALID_TEST_CODE' }
  });
  assert(promoRes.status !== 401, `Promo validate autentifikasiyasız çağırıla bildi (Status: ${promoRes.status})`);

  // TEST 7: Turların siyahısı və Zəngin Şirkət Obyekti (GET /tours)
  console.log('\n7. GET /tours yoxlanılır...');
  const toursRes = await request('/tours');
  assert(toursRes.ok, `GET /tours status 200 qaytardı (Cavab: ${toursRes.status})`);
  const toursList = toursRes.data?.data || toursRes.data || [];
  assert(Array.isArray(toursList) && toursList.length > 0, `Ən azı 1 tur mövcuddur (Tapıldı: ${toursList.length})`);
  
  if (toursList.length > 0) {
    const sampleTour = toursList[0];
    assert(sampleTour.company !== undefined, 'Tur obyektində zəngin "company" sahəsi mövcuddur');
    console.log(`   Nümunə tur: "${sampleTour.title}", Təşkilatçı: "${sampleTour.company?.name || sampleTour.companyName}"`);

    // TEST 8: Tək turun detalları (GET /tours/:id)
    console.log(`\n8. GET /tours/${sampleTour.id} yoxlanılır...`);
    const tourDetailRes = await request(`/tours/${sampleTour.id}`);
    assert(tourDetailRes.ok, `GET /tours/${sampleTour.id} status 200 qaytardı`);
    const tourDetail = tourDetailRes.data?.data;
    assert(tourDetail?.company?.id !== undefined, 'Tur detallarında zəngin company.id mövcuddur');

    // TEST 9: Tur Rəyləri Alias Marşrutu (GET /tours/:id/reviews)
    console.log(`\n9. GET /tours/${sampleTour.id}/reviews yoxlanılır...`);
    const reviewsRes = await request(`/tours/${sampleTour.id}/reviews`);
    assert(reviewsRes.ok, `GET /tours/${sampleTour.id}/reviews status 200 qaytardı (Cavab: ${reviewsRes.status})`);
    assert(Array.isArray(reviewsRes.data?.data?.reviews), 'Rəylər (data.reviews) massiv tipindədir');
    assert(typeof reviewsRes.data?.data?.averageRating === 'number', 'Orta reytinq (data.averageRating) mövcuddur');
  }

  console.log('\n====================================================');
  console.log(`🏁 NƏTİCƏ: ${passedTests} / ${totalTests} test uğurla keçdi!`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 MƏRHƏLƏ 1 UĞURLA BAŞA ÇATDI!');
    process.exit(0);
  } else {
    console.error('⚠️ Bəzi testlər uğursuz oldu.');
    process.exit(1);
  }
}

runStage1Verification().catch(err => {
  console.error('Test skripti xətası:', err);
  process.exit(1);
});
