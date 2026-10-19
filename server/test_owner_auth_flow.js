
const BASE_URL = 'http://localhost:5000/api/v1';

const logPass = (msg) => console.log(`✅ PASS: ${msg}`);
const logFail = (msg, err) => {
  console.error(`❌ FAIL: ${msg}`);
  if (err) console.error('   Error:', err);
};

let passed = 0;
let failed = 0;

const assert = (condition, msg, errDetail) => {
  if (condition) {
    logPass(msg);
    passed++;
  } else {
    logFail(msg, errDetail);
    failed++;
  }
};

async function runOwnerAuthAndDashboardTests() {
  console.log('================================================================');
  console.log('🧪 StayEasy Owner, Tenant & Admin Auth + Dashboard Flow Diagnostic');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const ownerEmail = `test.owner.${timestamp}@stayeasy.local`;
  const tenantEmail = `test.tenant.${timestamp}@stayeasy.local`;
  const adminEmail = `test.admin.${timestamp}@stayeasy.local`;
  const password = 'Password123!';

  // --- 1. OWNER REGISTRATION FLOW ---
  console.log('--- Step 1: Owner Registration & Profile Creation ---');
  let ownerToken = null;
  let ownerUser = null;
  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rajesh Sharma',
        email: ownerEmail,
        password: password,
        phone: '9876543210',
        role: 'OWNER',
        businessName: 'Sharma Elite Stays',
      }),
    });
    const regData = await regRes.json();
    ownerToken = regData.data?.token;
    ownerUser = regData.data?.user;

    assert(regRes.status === 201 && regData.success === true, 'Owner registration returns HTTP 201 Created');
    assert(ownerToken && typeof ownerToken === 'string', 'JWT token generated and returned on Owner registration');
    assert(ownerUser?.role === 'OWNER', 'Registered user role is OWNER');
    assert(ownerUser?.ownerProfile?.businessName === 'Sharma Elite Stays', 'OwnerProfile created atomically with business name');
  } catch (err) {
    assert(false, 'Owner registration threw exception', err.message);
  }

  // --- 2. SESSION VALIDATION / GET /api/v1/auth/me ---
  console.log('\n--- Step 2: Session Validation (GET /api/v1/auth/me) ---');
  try {
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.success === true, 'GET /auth/me with valid Bearer token returns HTTP 200 OK');
    assert(meData.data?.user?.role === 'OWNER', 'GET /auth/me returns authenticated OWNER user object');
    assert(meData.data?.user?.ownerProfile?.businessName === 'Sharma Elite Stays', 'GET /auth/me populates linked ownerProfile');
  } catch (err) {
    assert(false, 'GET /auth/me threw exception', err.message);
  }

  // --- 3. OWNER DASHBOARD DATA ENDPOINTS ---
  console.log('\n--- Step 3: Owner Dashboard Data Fetch Endpoints ---');
  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`,
    };

    // Owner Profile
    const profileRes = await fetch(`${BASE_URL}/owners/profile`, { headers });
    const profileData = await profileRes.json();
    assert(profileRes.status === 200 && profileData.success === true, 'GET /owners/profile returns owner business profile');

    // My Properties
    const propsRes = await fetch(`${BASE_URL}/properties/my-listings`, { headers });
    const propsData = await propsRes.json();
    assert(propsRes.status === 200 && Array.isArray(propsData.data?.properties), 'GET /properties/my-listings returns properties array');

    // Owner Bookings
    const bkRes = await fetch(`${BASE_URL}/bookings/owner-bookings`, { headers });
    const bkData = await bkRes.json();
    assert(bkRes.status === 200 && Array.isArray(bkData.data?.bookings), 'GET /bookings/owner-bookings returns bookings array');

    // Owner Residents
    const resRes = await fetch(`${BASE_URL}/bookings/owner-residents`, { headers });
    const resData = await resRes.json();
    assert(resRes.status === 200 && Array.isArray(resData.data?.residents), 'GET /bookings/owner-residents returns active occupants array');

    // Owner Ledger
    const ledgerRes = await fetch(`${BASE_URL}/ledger/owner-ledger`, { headers });
    const ledgerData = await ledgerRes.json();
    assert(ledgerRes.status === 200 && ledgerData.success === true, 'GET /ledger/owner-ledger returns collection ledger summary');

    // Owner Reviews
    const reviewsRes = await fetch(`${BASE_URL}/reviews/owner-reviews`, { headers });
    const reviewsData = await reviewsRes.json();
    assert(reviewsRes.status === 200 && Array.isArray(reviewsData.data?.reviews), 'GET /reviews/owner-reviews returns received property reviews');

    // Owner Maintenance Tickets
    const ticketsRes = await fetch(`${BASE_URL}/maintenance/owner-tickets`, { headers });
    const ticketsData = await ticketsRes.json();
    assert(ticketsRes.status === 200 && Array.isArray(ticketsData.data?.tickets), 'GET /maintenance/owner-tickets returns property maintenance tickets');

    // Owner SLA Summary
    const slaRes = await fetch(`${BASE_URL}/maintenance/sla-summary`, { headers });
    const slaData = await slaRes.json();
    assert(slaRes.status === 200 && slaData.success === true, 'GET /maintenance/sla-summary returns SLA performance metrics');
  } catch (err) {
    assert(false, 'Owner Dashboard data fetch threw exception', err.message);
  }

  // --- 4. OWNER LOGIN FLOW ---
  console.log('\n--- Step 4: Owner Login Flow ---');
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ownerEmail, password: password }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.success === true, 'POST /auth/login authenticates Owner successfully');
    assert(loginData.data?.user?.role === 'OWNER', 'Login response returns user with OWNER role');
    assert(loginData.data?.token && loginData.data?.token.length > 20, 'Login response returns valid JWT token');
  } catch (err) {
    assert(false, 'Owner login threw exception', err.message);
  }

  // --- 5. TENANT / USER REGISTRATION & DASHBOARD FLOW ---
  console.log('\n--- Step 5: Tenant (USER) Registration, Login & Dashboard Flow ---');
  let tenantToken = null;
  try {
    const tenantReg = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Priya Patel',
        email: tenantEmail,
        password: password,
        phone: '9876543222',
        role: 'USER',
      }),
    });
    const tenantRegData = await tenantReg.json();
    tenantToken = tenantRegData.data?.token;
    assert(tenantReg.status === 201 && tenantRegData.data?.user?.role === 'USER', 'Tenant (USER) registers successfully with USER role');

    const tenantHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tenantToken}`,
    };

    const myBk = await fetch(`${BASE_URL}/bookings/my-bookings`, { headers: tenantHeaders });
    assert(myBk.status === 200, 'Tenant can access GET /bookings/my-bookings');

    const myLedger = await fetch(`${BASE_URL}/ledger/my-ledger`, { headers: tenantHeaders });
    assert(myLedger.status === 200, 'Tenant can access GET /ledger/my-ledger');

    const myTickets = await fetch(`${BASE_URL}/maintenance/my-tickets`, { headers: tenantHeaders });
    assert(myTickets.status === 200, 'Tenant can access GET /maintenance/my-tickets');
  } catch (err) {
    assert(false, 'Tenant flow threw exception', err.message);
  }

  // --- 6. ADMIN AUTH & DASHBOARD FLOW ---
  console.log('\n--- Step 6: Admin Flow & Role Protections ---');
  try {
    const regAdmin = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'StayEasy System Admin',
        email: adminEmail,
        password: password,
        phone: '9000000000',
        role: 'ADMIN',
      }),
    });
    const regAdminData = await regAdmin.json();
    const adminToken = regAdminData.data?.token;

    assert(regAdmin.status === 201 && regAdminData.data?.user?.role === 'ADMIN', 'Admin registered successfully with ADMIN role');

    const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: password }),
    });
    const adminLoginData = await adminLogin.json();
    assert(adminLogin.status === 200 && adminLoginData.data?.user?.role === 'ADMIN', 'Admin login succeeds with ADMIN role');

    const adminOverview = await fetch(`${BASE_URL}/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminOverview.status === 200, 'Admin can access GET /admin/overview');

    // Verify RBAC protection: Tenant cannot access Admin overview
    const forbiddenRes = await fetch(`${BASE_URL}/admin/overview`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    assert(forbiddenRes.status === 403, 'RBAC Guard: Tenant is rejected from /admin/overview with 403 Forbidden');
  } catch (err) {
    assert(false, 'Admin flow threw exception', err.message);
  }

  // --- 7. STALE / INVALID TOKEN RECOVERY ---
  console.log('\n--- Step 7: Stale / Invalid Token Security & Error Response ---');
  try {
    const badTokenRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: 'Bearer invalid.or.expired.jwt.token' },
    });
    const badTokenData = await badTokenRes.json();
    assert(badTokenRes.status === 401 && badTokenData.success === false, 'Invalid token returns HTTP 401 Unauthorized');
    assert(badTokenData.message.includes('token') || badTokenData.message.includes('expired') || badTokenData.message.includes('authorized'), 'Invalid token returns clear rejection message without exposing internals');
  } catch (err) {
    assert(false, 'Bad token test threw exception', err.message);
  }

  console.log('\n================================================================');
  console.log(`📊 Diagnostic Results: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runOwnerAuthAndDashboardTests();
