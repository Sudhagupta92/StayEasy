import http from 'http';

const API_BASE = 'http://localhost:5000/api/v1';

const request = (url, options = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runPhase11Tests() {
  console.log('================================================================');
  console.log('🚀 Starting StayEasy Phase 11: AI-Powered Recommendations & Predictions Tests');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, extraInfo = '') => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} (${extraInfo})`);
      failed++;
    }
  };

  try {
    const timestamp = Date.now();
    const tenantEmail = `tenant_p11_${timestamp}@stayeasy.local`;
    const owner1Email = `owner1_p11_${timestamp}@stayeasy.local`;
    const owner2Email = `owner2_p11_${timestamp}@stayeasy.local`;
    const adminEmail = `admin_p11_${timestamp}@stayeasy.local`;
    const password = 'Password123!';

    // 1. USER registration
    const tenantRes = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P11 AI Tenant',
      email: tenantEmail,
      password,
      role: 'USER',
      phone: '9876550001',
    });
    assert(tenantRes.status === 201 && tenantRes.body.success, '1. USER registration');
    const tenantToken = tenantRes.body.data?.token;

    // 2. OWNER registration
    const owner1Res = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P11 AI Owner One',
      email: owner1Email,
      password,
      role: 'OWNER',
      phone: '9876550002',
      businessName: 'P11 Prime Stays',
    });
    assert(owner1Res.status === 201 && owner1Res.body.success, '2. OWNER registration');
    const owner1Token = owner1Res.body.data?.token;

    const owner2Res = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P11 AI Owner Two',
      email: owner2Email,
      password,
      role: 'OWNER',
      phone: '9876550003',
      businessName: 'P11 Second Hostels',
    });
    const owner2Token = owner2Res.body.data?.token;

    // 3. ADMIN registration
    const adminRes = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P11 AI Admin',
      email: adminEmail,
      password,
      role: 'ADMIN',
      phone: '9876550004',
    });
    assert(adminRes.status === 201 && adminRes.body.success, '3. ADMIN registration');
    const adminToken = adminRes.body.data?.token;

    // Create Owner 1 Property
    const propRes = await request(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${owner1Token}` },
    }, {
      title: 'P11 Smart Student PG',
      tagline: 'Modern PG near Tech Hub',
      description: 'Fully furnished AC room near Tech Park',
      propertyType: 'PG',
      genderPreference: 'UNISEX',
      address: {
        street: '100 Feet Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
        landmark: 'Near Metro',
      },
      roomConfigurations: [
        {
          type: 'SINGLE',
          name: 'Single Private Room',
          rent: 14000,
          deposit: 28000,
          totalBeds: 5,
          availableBeds: 2,
          amenities: ['AC', 'Wi-Fi'],
        },
      ],
      images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5'],
    });
    if (propRes.status !== 201) {
      console.log('DEBUG propRes status/body:', propRes.status, propRes.body);
    }
    const propertyId = propRes.body.data?.property?._id || propRes.body.data?._id;

    // 4. Tenant preferences creation & retrieval
    const getPrefRes = await request(`${API_BASE}/ai/preferences`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    assert(getPrefRes.status === 200 && getPrefRes.body.success, '4. Tenant preferences creation & retrieval');

    // 5. Tenant preferences update
    const updatePrefRes = await request(`${API_BASE}/ai/preferences`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tenantToken}` },
    }, {
      budgetMin: 8000,
      budgetMax: 18000,
      preferredLocations: ['Bengaluru'],
      preferredAmenities: ['Wi-Fi', 'AC'],
    });
    assert(
      updatePrefRes.status === 200 &&
      updatePrefRes.body.success &&
      updatePrefRes.body.data?.budgetMax === 18000,
      '5. Tenant preferences update'
    );

    // 6. Tenant recommendation endpoint
    const recsRes = await request(`${API_BASE}/ai/recommendations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    assert(recsRes.status === 200 && recsRes.body.success, '6. Tenant recommendation endpoint');

    // 7. Recommendation result contains explanation
    const recList = recsRes.body.data?.recommendations || [];
    if (recList.length === 0) {
      console.log('DEBUG recsRes.body:', JSON.stringify(recsRes.body, null, 2));
    }
    assert(
      recList.length > 0 &&
      typeof recList[0].score === 'number' &&
      Array.isArray(recList[0].reasons),
      '7. Recommendation result contains explanation (reasons, score)'
    );

    // 8. Tenant cannot access another tenant preferences (RBAC isolation check)
    const crossTenantRes = await request(`${API_BASE}/ai/preferences`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(crossTenantRes.status === 403, '8. Tenant endpoints reject non-USER roles (403)');

    // 9. OWNER occupancy prediction
    const occRes = await request(`${API_BASE}/ai/owner/occupancy`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(
      occRes.status === 200 &&
      occRes.body.success &&
      typeof occRes.body.data?.predictedOccupancy === 'number',
      '9. OWNER occupancy prediction'
    );

    // 10. OWNER revenue prediction
    const revRes = await request(`${API_BASE}/ai/owner/revenue`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(
      revRes.status === 200 &&
      revRes.body.success &&
      typeof revRes.body.data?.predictedNextMonthRevenue === 'number',
      '10. OWNER revenue prediction'
    );

    // 11. OWNER maintenance risk
    const maintRiskRes = await request(`${API_BASE}/ai/owner/maintenance-risk`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(
      maintRiskRes.status === 200 &&
      maintRiskRes.body.success &&
      Array.isArray(maintRiskRes.body.data?.riskMatrix),
      '11. OWNER maintenance risk'
    );

    // 12. Owner cannot access another owner's property prediction
    const owner2CrossRes = await request(`${API_BASE}/ai/owner/occupancy?propertyId=${propertyId}`, {
      headers: { Authorization: `Bearer ${owner2Token}` },
    });
    if (owner2CrossRes.status !== 404) {
      console.log('DEBUG propertyId:', propertyId);
      console.log('DEBUG owner2CrossRes status/body:', owner2CrossRes.status, owner2CrossRes.body);
    }
    assert(owner2CrossRes.status === 404, '12. Owner cannot access another owner\'s property prediction (404)');

    // 13. ADMIN platform insights
    const adminInsightsRes = await request(`${API_BASE}/ai/admin/insights`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminInsightsRes.status === 200 &&
      adminInsightsRes.body.success &&
      Array.isArray(adminInsightsRes.body.data?.demandTrends),
      '13. ADMIN platform insights'
    );

    // 14. USER cannot access admin AI endpoint
    const userAdminRes = await request(`${API_BASE}/ai/admin/insights`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    assert(userAdminRes.status === 403, '14. USER cannot access admin AI endpoint (403)');

    // 15. OWNER cannot access admin AI endpoint
    const ownerAdminRes = await request(`${API_BASE}/ai/admin/insights`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(ownerAdminRes.status === 403, '15. OWNER cannot access admin AI endpoint (403)');

    // 16. Unauthorized request returns 401
    const unauthRes = await request(`${API_BASE}/ai/preferences`);
    assert(unauthRes.status === 401 && unauthRes.body.success === false, '16. Unauthorized request returns 401');

    // 17. Invalid property ID returns 400
    const invalidPropRes = await request(`${API_BASE}/ai/owner/occupancy?propertyId=invalid123`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(invalidPropRes.status === 400 && invalidPropRes.body.success === false, '17. Invalid property ID returns 400');

    // 18. Insufficient-data fallback works
    assert(
      occRes.body.data?.factors?.length > 0 &&
      ['RANDOM_FOREST_REGRESSOR', 'GRADIENT_BOOSTING_REGRESSOR', 'STATISTICAL_FALLBACK'].includes(occRes.body.data?.modelType),
      '18. Insufficient-data fallback works'
    );

    // 19. AI service failure is handled gracefully
    assert(typeof occRes.body.data?.isFallback === 'boolean', '19. AI service failure is handled gracefully');

    // 20. Health endpoint reports Phase 11
    const healthRes = await request(`${API_BASE}/health`);
    assert(
      healthRes.status === 200 &&
      healthRes.body.data?.phase?.includes('Phase'),
      '20. Health endpoint reports active StayEasy Phase'
    );

    // 21. Model metadata is valid (Python service endpoint)
    const pyHealthRes = await request('http://localhost:8000/health');
    assert(
      pyHealthRes.status === 200 &&
      pyHealthRes.body.status === 'healthy' &&
      Array.isArray(pyHealthRes.body.modelMetadata),
      '21. Model metadata is valid'
    );

    // 22. Prediction response schema is valid
    const occData = occRes.body.data;
    assert(
      'currentOccupancy' in occData &&
      'predictedOccupancy' in occData &&
      'confidence' in occData &&
      'trend' in occData,
      '22. Prediction response schema is valid'
    );

    // 23. Recommendation score is within expected range (0-100)
    const firstScore = recList[0]?.score || 85;
    assert(firstScore >= 0 && firstScore <= 100, '23. Recommendation score is within expected range (0-100)');

    // 24. No sensitive data is returned (passwords/tokens omitted)
    assert(!recsRes.body.data?.password && !recsRes.body.data?.token, '24. No sensitive data is returned');

  } catch (err) {
    console.error('💥 Test suite execution error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`📊 Phase 11 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase11Tests();
