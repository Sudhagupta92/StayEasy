const API_URL = 'http://localhost:5000/api/v1';

async function req(endpoint, options = {}) {
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

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

async function runTests() {
  console.log('==============================================');
  console.log('🚀 Starting StayEasy Phase 2 Automated Auth Tests');
  console.log('==============================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  const rand = Math.floor(Math.random() * 90000) + 10000;
  const userEmail = `tenant_${rand}@stayeasy.local`;
  const ownerEmail = `landlord_${rand}@stayeasy.local`;
  const adminEmail = `admin_${rand}@stayeasy.local`;
  const password = 'StrongPassword123!';

  let userToken = '';
  let ownerToken = '';
  let adminToken = '';

  // 1. Test Health
  try {
    const health = await req('/health');
    assert(
      health.data.success === true &&
        health.data.data?.database?.state === 'connected' &&
        health.data.data?.database?.name === 'stayeasy',
      'GET /api/v1/health reports connected state and stayeasy db'
    );
  } catch (e) {
    assert(false, `GET /api/v1/health failed: ${e.message}`);
  }

  // 2. Register USER
  try {
    const regUser = await req('/auth/register', {
      method: 'POST',
      body: {
        name: 'Rohan Sharma',
        email: userEmail,
        password,
        role: 'USER',
        phone: '9876543210',
      },
    });
    userToken = regUser.data.data?.token;
    assert(
      regUser.status === 201 &&
        regUser.data.data?.user?.role === 'USER' &&
        userToken?.length > 20,
      'POST /api/v1/auth/register (USER role) creates user and returns JWT'
    );
  } catch (e) {
    assert(false, `Register USER failed: ${e.message}`);
  }

  // 3. Register OWNER
  try {
    const regOwner = await req('/auth/register', {
      method: 'POST',
      body: {
        name: 'Venkatesh Rao',
        email: ownerEmail,
        password,
        role: 'OWNER',
        phone: '9876543211',
        businessName: 'Rao Comfort Hostels',
      },
    });
    ownerToken = regOwner.data.data?.token;
    assert(
      regOwner.status === 201 &&
        regOwner.data.data?.user?.role === 'OWNER' &&
        regOwner.data.data?.user?.ownerProfile?.businessName === 'Rao Comfort Hostels',
      'POST /api/v1/auth/register (OWNER role) creates OwnerProfile with business name'
    );
  } catch (e) {
    assert(false, `Register OWNER failed: ${e.message}`);
  }

  // 4. Duplicate Email Validation
  try {
    const dupRes = await req('/auth/register', {
      method: 'POST',
      body: {
        name: 'Duplicate Rohan',
        email: userEmail,
        password,
      },
    });
    assert(
      dupRes.status === 400 && dupRes.data.message?.includes('already exists'),
      'Duplicate email registration is blocked with 400 Bad Request'
    );
  } catch (e) {
    assert(false, `Duplicate test failed: ${e.message}`);
  }

  // 5. Login Valid
  try {
    const loginRes = await req('/auth/login', {
      method: 'POST',
      body: {
        email: userEmail,
        password,
      },
    });
    assert(
      loginRes.status === 200 &&
        loginRes.data.data?.user?.email === userEmail &&
        loginRes.data.data?.token?.length > 20,
      'POST /api/v1/auth/login authenticates valid user with bcrypt verification'
    );
  } catch (e) {
    assert(false, `Login valid failed: ${e.message}`);
  }

  // 6. Login Invalid Password
  try {
    const badLoginRes = await req('/auth/login', {
      method: 'POST',
      body: {
        email: userEmail,
        password: 'WrongPassword999!',
      },
    });
    assert(
      badLoginRes.status === 401 &&
        badLoginRes.data.message?.includes('Invalid email or password'),
      'Invalid password login is rejected with 401 Unauthorized'
    );
  } catch (e) {
    assert(false, `Bad login test failed: ${e.message}`);
  }

  // 7. Protected Route GET /auth/me with Valid Token
  try {
    const meRes = await req('/auth/me', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(
      meRes.status === 200 && meRes.data.data?.user?.email === userEmail,
      'GET /api/v1/auth/me returns authenticated user with valid Bearer token'
    );
  } catch (e) {
    assert(false, `GET /auth/me failed: ${e.message}`);
  }

  // 8. Protected Route GET /auth/me without Token
  try {
    const noTokenRes = await req('/auth/me');
    assert(
      noTokenRes.status === 401 &&
        noTokenRes.data.message?.includes('token required'),
      'GET /api/v1/auth/me without token is rejected with 401 Unauthorized'
    );
  } catch (e) {
    assert(false, `No token test failed: ${e.message}`);
  }

  // 9. Profile Update PUT /users/profile
  try {
    const updateRes = await req('/users/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        phone: '9988776655',
        occupation: 'Computer Science Student',
        bio: 'Looking for a quiet single room near Christ University.',
      },
    });
    assert(
      updateRes.status === 200 &&
        updateRes.data.data?.user?.occupation === 'Computer Science Student' &&
        updateRes.data.data?.user?.phone === '9988776655',
      'PUT /api/v1/users/profile successfully updates user bio, phone, and occupation'
    );
  } catch (e) {
    assert(false, `Update profile failed: ${e.message}`);
  }

  // 10. RBAC: USER trying to access OWNER route
  try {
    const userToOwnerRes = await req('/owners/profile', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(
      userToOwnerRes.status === 403 &&
        userToOwnerRes.data.message?.includes('not authorized'),
      'RBAC: USER role accessing OWNER route is forbidden with 403 Forbidden'
    );
  } catch (e) {
    assert(false, `USER to OWNER RBAC test failed: ${e.message}`);
  }

  // 11. RBAC: OWNER accessing OWNER route
  try {
    const ownerProfileRes = await req('/owners/profile', {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(
      ownerProfileRes.status === 200 &&
        ownerProfileRes.data.data?.ownerProfile?.businessName === 'Rao Comfort Hostels',
      'RBAC: OWNER role accessing OWNER route is granted 200 OK with ownerProfile'
    );
  } catch (e) {
    assert(false, `Owner profile test failed: ${e.message}`);
  }

  // 12. RBAC: USER trying to access ADMIN route
  try {
    const userToAdminRes = await req('/admin/overview', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(
      userToAdminRes.status === 403 &&
        userToAdminRes.data.message?.includes('not authorized'),
      'RBAC: USER role accessing ADMIN route is forbidden with 403 Forbidden'
    );
  } catch (e) {
    assert(false, `USER to ADMIN RBAC test failed: ${e.message}`);
  }

  // 13. Create ADMIN user and test ADMIN route
  try {
    const regAdmin = await req('/auth/register', {
      method: 'POST',
      body: {
        name: 'StayEasy System Admin',
        email: adminEmail,
        password,
        role: 'ADMIN',
        phone: '9000000000',
      },
    });
    adminToken = regAdmin.data.data?.token;

    const adminOverview = await req('/admin/overview', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminOverview.status === 200 &&
        adminOverview.data.data?.systemStats?.totalUsers >= 3 &&
        adminOverview.data.data?.systemStats?.currentPhase?.includes('Phase 2'),
      'RBAC: ADMIN role accessing /admin/overview is granted 200 OK with platform metrics'
    );
  } catch (e) {
    assert(false, `Admin test failed: ${e.message}`);
  }

  // 14. Test Logout endpoint
  try {
    const logoutRes = await req('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(
      logoutRes.status === 200 && logoutRes.data.success === true,
      'POST /api/v1/auth/logout returns 200 OK acknowledgment'
    );
  } catch (e) {
    assert(false, `Logout test failed: ${e.message}`);
  }

  console.log('\n==============================================');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('==============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
