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

async function runPhase10Tests() {
  console.log('================================================================');
  console.log('🚀 Starting StayEasy Phase 10: Advanced Analytics & Insights Tests');
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
    const owner1Email = `owner1_p10_${timestamp}@stayeasy.local`;
    const owner2Email = `owner2_p10_${timestamp}@stayeasy.local`;
    const tenant1Email = `tenant1_p10_${timestamp}@stayeasy.local`;
    const adminEmail = `admin_p10_${timestamp}@stayeasy.local`;
    const password = 'Password123!';

    // 1. Register Owner 1
    const owner1Res = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P10 Landlord One',
      email: owner1Email,
      password,
      role: 'OWNER',
      phone: '9876540001',
      businessName: 'P10 Apex Stays',
    });
    assert(owner1Res.status === 201 && owner1Res.body.success, '1. Register owner');
    const owner1Token = owner1Res.body.data?.token;

    // 2. Register Owner 2
    const owner2Res = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P10 Landlord Two',
      email: owner2Email,
      password,
      role: 'OWNER',
      phone: '9876540002',
      businessName: 'P10 Crest Hostels',
    });
    assert(owner2Res.status === 201 && owner2Res.body.success, '2. Register second owner');
    const owner2Token = owner2Res.body.data?.token;

    // 3. Register Tenant
    const tenant1Res = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P10 Resident Tenant',
      email: tenant1Email,
      password,
      role: 'USER',
      phone: '9876540003',
    });
    assert(tenant1Res.status === 201 && tenant1Res.body.success, '3. Register tenant');
    const tenant1Token = tenant1Res.body.data?.token;

    // 4. Register Admin
    const adminRes = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P10 Platform Admin',
      email: adminEmail,
      password,
      role: 'ADMIN',
      phone: '9876540004',
    });
    assert(adminRes.status === 201 && adminRes.body.success, '4. Register admin');
    const adminToken = adminRes.body.data?.token;

    // 5. Create Owner 1 Property
    const propRes = await request(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${owner1Token}` },
    }, {
      title: 'P10 Luxury Student Living',
      tagline: 'Modern PG near Tech Hub',
      description: 'Fully furnished AC rooms with high speed Wi-Fi and food.',
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
          name: 'Single Room',
          roomType: 'SINGLE',
          sharingType: 1,
          occupancyCount: 1,
          totalRooms: 5,
          availableRooms: 3,
          totalBeds: 5,
          availableBeds: 3,
          rent: 15000,
          deposit: 30000,
          monthlyRent: 15000,
          depositAmount: 30000,
          amenities: ['AC', 'Wi-Fi'],
        },
        {
          type: 'DOUBLE',
          name: 'Double Room',
          roomType: 'DOUBLE',
          sharingType: 2,
          occupancyCount: 2,
          totalRooms: 5,
          availableRooms: 2,
          totalBeds: 10,
          availableBeds: 4,
          rent: 9000,
          deposit: 18000,
          monthlyRent: 9000,
          depositAmount: 18000,
          amenities: ['Wi-Fi'],
        },
      ],
      rules: { foodIncluded: true, gateClosingTime: '22:30' },
      images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5'],
    });
    if (propRes.status !== 201) {
      console.log('DEBUG propRes in test_phase10:', propRes.status, propRes.body);
    }
    assert(propRes.status === 201 && propRes.body.success, '5. Create owner property');
    const propertyId = propRes.body.data?.property?._id || propRes.body.data?._id;

    // 6. Verify Owner Analytics Access
    const ownerOverviewRes = await request(`${API_BASE}/analytics/owner/overview`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(ownerOverviewRes.status === 200 && ownerOverviewRes.body.success, '6. Verify owner analytics access');

    // 7. Verify Owner Cannot Access Another Owner's Property Analytics
    const owner2CrossRes = await request(`${API_BASE}/analytics/owner/overview?propertyId=${propertyId}`, {
      headers: { Authorization: `Bearer ${owner2Token}` },
    });
    assert(owner2CrossRes.status === 404, '7. Verify owner cannot access another owner\'s analytics');

    // 8. Verify Tenant Analytics Access
    const tenantOverviewRes = await request(`${API_BASE}/analytics/user/overview`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(tenantOverviewRes.status === 200 && tenantOverviewRes.body.success, '8. Verify tenant analytics access');

    // 9. Verify Tenant Cannot Access Another Tenant's Analytics (RBAC / Auth test)
    const tenantCrossAdminRes = await request(`${API_BASE}/analytics/user/overview`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(tenantCrossAdminRes.status === 403, '9. Verify tenant endpoints reject non-USER roles (403)');

    // 10. Verify Admin Analytics Access
    const adminOverviewRes = await request(`${API_BASE}/analytics/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminOverviewRes.status === 200 && adminOverviewRes.body.success, '10. Verify admin analytics access');

    // 11. Verify USER Cannot Access Admin Analytics
    const userAdminRes = await request(`${API_BASE}/analytics/admin/overview`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(userAdminRes.status === 403, '11. Verify USER cannot access admin analytics');

    // 12. Verify OWNER Cannot Access Admin Analytics
    const ownerAdminRes = await request(`${API_BASE}/analytics/admin/overview`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(ownerAdminRes.status === 403, '12. Verify OWNER cannot access admin analytics');

    // 13. Verify Owner Overview Calculations
    const overviewData = ownerOverviewRes.body.data;
    assert(
      overviewData.totalProperties >= 1 &&
      overviewData.totalBeds === 15 &&
      overviewData.occupiedBeds === 8 &&
      overviewData.availableBeds === 7 &&
      overviewData.occupancyPercentage === 53,
      '13. Verify owner overview calculations (beds, vacancy, occupancy rate)'
    );

    // 14. Verify Owner Revenue Aggregation
    const ownerRevRes = await request(`${API_BASE}/analytics/owner/revenue?period=12m`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(ownerRevRes.status === 200 && Array.isArray(ownerRevRes.body.data) && ownerRevRes.body.data.length === 12, '14. Verify owner revenue aggregation');

    // 15. Verify Occupancy Calculation
    const ownerOccRes = await request(`${API_BASE}/analytics/owner/occupancy?period=12m`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(ownerOccRes.status === 200 && Array.isArray(ownerOccRes.body.data) && ownerOccRes.body.data.length === 12, '15. Verify occupancy calculation');

    // 16. Verify Tenant Spending Calculation
    const tenantSpendRes = await request(`${API_BASE}/analytics/user/spending?period=12m`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(tenantSpendRes.status === 200 && Array.isArray(tenantSpendRes.body.data) && tenantSpendRes.body.data.length === 12, '16. Verify tenant spending calculation');

    // 17. Verify Admin Platform Totals
    const adminData = adminOverviewRes.body.data;
    assert(
      typeof adminData.totalUsers === 'number' &&
      typeof adminData.totalOwners === 'number' &&
      typeof adminData.totalProperties === 'number' &&
      typeof adminData.slaCompliance === 'number',
      '17. Verify admin platform totals'
    );

    // 18. Verify Monthly Trend Aggregation
    const adminTrendsRes = await request(`${API_BASE}/analytics/admin/trends?period=12m`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminTrendsRes.status === 200 && Array.isArray(adminTrendsRes.body.data) && adminTrendsRes.body.data.length === 12, '18. Verify monthly trend aggregation');

    // 19. Verify Property Performance Aggregation
    const ownerPropsRes = await request(`${API_BASE}/analytics/owner/properties`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(ownerPropsRes.status === 200 && Array.isArray(ownerPropsRes.body.data) && ownerPropsRes.body.data.length >= 1, '19. Verify property performance aggregation');

    // 20. Verify Maintenance Analytics
    const ownerMaintRes = await request(`${API_BASE}/analytics/owner/maintenance`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(ownerMaintRes.status === 200 && ownerMaintRes.body.data && typeof ownerMaintRes.body.data.slaCompliancePercentage === 'number', '20. Verify maintenance analytics');

    // 21. Verify Invalid propertyId Handling
    const invalidPropRes = await request(`${API_BASE}/analytics/owner/overview?propertyId=invalid123`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(invalidPropRes.status === 400 && invalidPropRes.body.success === false, '21. Verify invalid propertyId handling (returns 400)');

    // 22. Verify Invalid Period Handling
    const invalidPeriodRes = await request(`${API_BASE}/analytics/owner/overview?period=999days`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(invalidPeriodRes.status === 400 && invalidPeriodRes.body.success === false, '22. Verify invalid period handling (returns 400)');

    // 23. Verify Unauthenticated Analytics Request Returns 401
    const unauthRes = await request(`${API_BASE}/analytics/owner/overview`);
    assert(unauthRes.status === 401 && unauthRes.body.success === false, '23. Verify unauthenticated analytics request returns 401');

    // 24. Verify Health Endpoint Reports Phase 10
    const healthRes = await request(`${API_BASE}/health`);
    assert(
      healthRes.status === 200 &&
      healthRes.body.success &&
      healthRes.body.data?.phase?.includes('Phase'),
      '24. Verify health endpoint reports active StayEasy Phase'
    );

  } catch (err) {
    console.error('💥 Test suite execution error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`📊 Phase 10 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase10Tests();
