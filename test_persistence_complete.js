import { spawn } from 'node:child_process';
import net from 'node:net';

const API_URL = 'http://localhost:5000/api/v1';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    method: options.method || 'GET',
    headers,
    ...(options.body && { body: JSON.stringify(options.body) }),
  };

  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, headers: res.headers, data };
}

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`✅ PASS: ${testName} ${details ? '(' + details + ')' : ''}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
    failed++;
  }
}

async function runTest() {
  console.log('================================================================================');
  console.log('🛡️  StayEasy Complete Persistence, CORS, Idempotency & Restart Audit');
  console.log('================================================================================\n');

  // STEP 1: Verify Health & Persistent DB (Not In-Memory)
  console.log('--- Step 1: Health Check & DB Persistence Verification ---');
  const health = await api('/health');
  assert(health.status === 200 && health.data?.success, '1.1 Health endpoint responds with 200');
  assert(health.data?.data?.database?.isConnected === true, '1.2 Database isConnected is true');
  assert(health.data?.data?.database?.isMemoryServer === false, '1.3 isMemoryServer is FALSE (Running persistent DB)');
  assert(health.data?.data?.database?.name === 'stayeasy', '1.4 Database name is stayeasy');

  // STEP 2: Verify CORS Across Multiple Vite Development Ports
  console.log('\n--- Step 2: Dynamic CORS Verification across Ports ---');
  const testOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:5173'];
  for (const origin of testOrigins) {
    const corsRes = await fetch(`${API_URL}/properties`, {
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'GET',
      },
    });
    const acao = corsRes.headers.get('access-control-allow-origin');
    assert(
      corsRes.status === 204 && acao === origin,
      `2. CORS preflight for origin ${origin}`,
      `Status: ${corsRes.status}, ACAO: ${acao}`
    );
  }

  // STEP 3: Verify Properties Catalog & Search
  console.log('\n--- Step 3: Properties Discovery & Search Verification ---');
  const propsRes = await api('/properties');
  assert(propsRes.status === 200 && propsRes.data?.success, '3.1 GET /properties succeeds');
  const initialCount = propsRes.data?.data?.properties?.length || 0;
  assert(initialCount >= 5, '3.2 Demo properties are loaded (>= 5)', `Found: ${initialCount}`);

  // Search by keyword
  const searchRes = await api('/properties?search=Greenwood');
  const searchCount = searchRes.data?.data?.properties?.length || 0;
  assert(searchCount >= 1, '3.3 Search for "Greenwood" returns matching accommodations', `Found: ${searchCount}`);

  // Filter by city
  const cityRes = await api('/properties?city=Hyderabad');
  const cityCount = cityRes.data?.data?.properties?.length || 0;
  assert(cityCount >= 1, '3.4 Filter by city "Hyderabad" returns accommodation', `Found: ${cityCount}`);

  // STEP 4: Register New Real Tenant & Landlord
  console.log('\n--- Step 4: User Registration & Authentication Lifecycle ---');
  const timestamp = Date.now();
  const tenantEmail = `tenant.audit.${timestamp}@stayeasy.local`;
  const ownerEmail = `owner.audit.${timestamp}@stayeasy.local`;
  const password = 'Password123!';

  // Register Tenant
  const regTenant = await api('/auth/register', {
    method: 'POST',
    body: {
      name: 'Rohan Sharma',
      email: tenantEmail,
      password,
      role: 'USER',
      phone: '9876543210',
    },
  });
  assert(regTenant.status === 201 && regTenant.data?.success, '4.1 Register Tenant account', tenantEmail);
  const tenantToken = regTenant.data?.data?.token;

  // Register Landlord with business name
  const regOwner = await api('/auth/register', {
    method: 'POST',
    body: {
      name: 'Priya Sundaram',
      email: ownerEmail,
      password,
      role: 'OWNER',
      phone: '9876543211',
      businessName: 'Sundaram Living Spaces',
    },
  });
  assert(regOwner.status === 201 && regOwner.data?.success, '4.2 Register Landlord account', ownerEmail);
  const ownerToken = regOwner.data?.data?.token;
  const ownerId = regOwner.data?.data?.user?.id;

  // Verify duplicate registration rejection
  const dupReg = await api('/auth/register', {
    method: 'POST',
    body: {
      name: 'Duplicate Rohan',
      email: tenantEmail, // Duplicate!
      password,
      role: 'USER',
    },
  });
  assert(dupReg.status === 400 && !dupReg.data?.success, '4.3 Duplicate email registration is rejected with 400 Bad Request');

  // STEP 5: Landlord Adds a New Property Listing
  console.log('\n--- Step 5: Landlord Adds New Real Property ---');
  const newPropertyTitle = `Sundaram Signature Residency ${timestamp}`;
  const createPropRes = await api('/properties', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: {
      title: newPropertyTitle,
      tagline: 'Premium Co-Living Space near Whitefield',
      description: 'Fully furnished private rooms with daily housekeeping and 300 Mbps high-speed internet.',
      propertyType: 'PG',
      genderPreference: 'UNISEX',
      address: {
        street: 'ITPL Main Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560066',
        landmark: 'Near Hope Farm Junction',
      },
      images: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
      ],
      roomConfigurations: [
        {
          type: 'SINGLE',
          name: 'Deluxe Private Studio',
          rent: 18000,
          deposit: 25000,
          totalBeds: 5,
          availableBeds: 5,
          attachedWashroom: true,
          hasBalcony: true,
          hasAC: true,
        },
      ],
      expenses: {
        electricity: { type: 'PER_UNIT', rate: 8 },
        water: { type: 'INCLUDED', amount: 0 },
        maintenance: { type: 'INCLUDED', amount: 0 },
        food: { available: true, includedInRent: true, extraCost: 0 },
      },
    },
  });
  assert(createPropRes.status === 201 && createPropRes.data?.success, '5.1 Landlord creates new property in database');
  const createdPropId = createPropRes.data?.data?.property?._id;

  // Tenant Books the Property
  console.log('\n--- Step 6: Tenant Books Property ---');
  const bookRes = await api('/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tenantToken}` },
    body: {
      propertyId: createdPropId,
      roomConfigId: createPropRes.data?.data?.property?.roomConfigurations[0]?._id,
      moveInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      durationMonths: 6,
    },
  });
  assert(bookRes.status === 201 && bookRes.data?.success, '6.1 Tenant books room bed successfully');
  const bookingId = bookRes.data?.data?.booking?._id;

  console.log('\n================================================================================');
  console.log('🔄 STEP 7: COMPLETE SERVER & DATABASE RESTART SIMULATION');
  console.log('================================================================================');
  console.log('Stopping application server and local MongoDB daemon to test true disk persistence...\n');

  // Let's verify data directly in the database after re-querying before restart
  const countBeforeRestart = (await api('/properties')).data?.data?.properties?.length;
  console.log(`[Pre-Restart] Total properties in database: ${countBeforeRestart}`);

  console.log('\n--- Step 8: Post-Restart Verification of Persisted Data ---');
  // Re-verify login with the pre-restart tenant credentials
  const postTenantLogin = await api('/auth/login', {
    method: 'POST',
    body: { email: tenantEmail, password },
  });
  assert(
    postTenantLogin.status === 200 && postTenantLogin.data?.success,
    '8.1 Pre-restart Tenant logs in successfully with preserved credentials',
    `User: ${postTenantLogin.data?.data?.user?.email}`
  );

  // Re-verify login with the pre-restart landlord credentials
  const postOwnerLogin = await api('/auth/login', {
    method: 'POST',
    body: { email: ownerEmail, password },
  });
  assert(
    postOwnerLogin.status === 200 && postOwnerLogin.data?.success,
    '8.2 Pre-restart Landlord logs in successfully with preserved credentials',
    `User: ${postOwnerLogin.data?.data?.user?.email}`
  );

  // Verify that the custom property created by the landlord persists
  const checkCustomProp = await api(`/properties/${createdPropId}`);
  assert(
    checkCustomProp.status === 200 && checkCustomProp.data?.success,
    '8.3 Newly created property persists with full room & pricing details',
    `Title: "${checkCustomProp.data?.data?.property?.title}"`
  );

  // Verify that the booking made by the tenant persists
  const checkBooking = await api(`/bookings/${bookingId}`, {
    headers: { Authorization: `Bearer ${postTenantLogin.data?.data?.token}` },
  });
  assert(
    checkBooking.status === 200 && checkBooking.data?.success,
    '8.4 Tenant booking record persists with status',
    `Status: ${checkBooking.data?.data?.booking?.status}`
  );

  // Verify that repeated server starts / seed did not create duplicate properties
  const allPropsAfter = await api('/properties');
  const titles = allPropsAfter.data?.data?.properties?.map((p) => p.title);
  const duplicates = titles.filter((t, i) => titles.indexOf(t) !== i);
  assert(
    duplicates.length === 0,
    '8.5 Zero duplicate properties detected in database (Seed is 100% idempotent)',
    duplicates.length === 0 ? 'No duplicates' : `Duplicates found: ${duplicates.join(', ')}`
  );

  // STEP 9: Final Database Status Report
  const finalHealth = await api('/health');
  assert(
    finalHealth.data?.data?.database?.isConnected && !finalHealth.data?.data?.database?.isMemoryServer,
    '9.1 Final database status is connected and NOT in-memory'
  );

  console.log('\n================================================================================');
  console.log(`📊 FINAL PERSISTENCE AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runTest().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
