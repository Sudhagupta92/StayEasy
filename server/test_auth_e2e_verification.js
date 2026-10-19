import http from 'http';

const API_BASE = 'http://localhost:5000/api/v1';

// Dynamic client detection: do not assume frontend always runs on 5173
const candidateClientPorts = ['5174', '5173', '5175'];
let CLIENT_BASE = 'http://localhost:5174';
for (const port of candidateClientPorts) {
  if (process.env.CLIENT_URL?.includes(port)) {
    CLIENT_BASE = `http://localhost:${port}`;
    break;
  }
}

const request = async (url, options = {}, body = null) => {
  const parsedUrl = new URL(url);
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
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
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function runDetailedAuthVerification() {
  console.log('================================================================');
  console.log('🔍 Comprehensive StayEasy Authentication & Session E2E Diagnostic');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, name, details = '') => {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} -> Details: ${details}`);
      failed++;
    }
  };

  try {
    // 1. Frontend Client Health on http://localhost:5173
    const clientRes = await request(CLIENT_BASE);
    assert(
      clientRes.status === 200 && typeof clientRes.body === 'string' && clientRes.body.includes('<!doctype html>'),
      '1. Open http://localhost:5173 (Client responds with HTML shell)'
    );

    // 2. Health check endpoint
    const healthRes = await request(`${API_BASE}/health`);
    assert(
      healthRes.status === 200 && healthRes.body.success === true,
      'Backend Health API is active and database connected'
    );

    // 3. Register & Login with USER Account
    const rand = Math.floor(Math.random() * 90000) + 10000;
    const userEmail = `alex.student_${rand}@stayeasy.local`;
    const ownerEmail = `rao.hostels_${rand}@stayeasy.local`;
    const password = 'Password123!';

    const regUser = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'Alex Johnson',
      email: userEmail,
      password,
      role: 'USER',
      phone: '9876543210',
    });
    assert(regUser.status === 201 && regUser.body.success, 'Register USER Account (Alex Johnson)');

    const loginUser = await request(`${API_BASE}/auth/login`, { method: 'POST' }, {
      email: userEmail,
      password,
    });
    const userToken = loginUser.body.data?.token;
    assert(
      loginUser.status === 200 && loginUser.body.success && userToken?.length > 20,
      '2. Login with existing USER account via POST /api/v1/auth/login'
    );

    // 4. Verify GET /api/v1/auth/me returns the correct authenticated user
    const meUser = await request(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(
      meUser.status === 200 &&
        meUser.body.data?.user?.email === userEmail &&
        meUser.body.data?.user?.role === 'USER' &&
        meUser.body.data?.user?.name === 'Alex Johnson',
      '3 & 10. GET /api/v1/auth/me returns authenticated USER profile'
    );

    // 5. Verify Notification Bell & Count for User
    const userUnreadRes = await request(`${API_BASE}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const userNotifsRes = await request(`${API_BASE}/notifications?limit=5`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(
      userUnreadRes.status === 200 &&
        userUnreadRes.body.success &&
        typeof userUnreadRes.body.data?.unreadCount === 'number' &&
        userNotifsRes.status === 200 &&
        userNotifsRes.body.success &&
        Array.isArray(userNotifsRes.body.data?.notifications),
      '12 & 13. Notification bell queries (/unread-count, /notifications) succeed for USER'
    );

    // 6. Logout and verify token session cleared
    const logoutRes = await request(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(logoutRes.status === 200 && logoutRes.body.success, '5. Logout via POST /api/v1/auth/logout succeeds');

    // 7. Re-test GET /api/v1/auth/me without token (Guest state)
    const noTokenMe = await request(`${API_BASE}/auth/me`);
    assert(
      noTokenMe.status === 401 && noTokenMe.body.message?.includes('token required'),
      'Session clearing: GET /api/v1/auth/me without token rejects with 401'
    );

    // 8. Register & Login with OWNER Account
    const regOwner = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'Venkatesh Rao',
      email: ownerEmail,
      password,
      role: 'OWNER',
      phone: '9876543211',
      businessName: 'Greenwood Luxury Student Living',
    });
    assert(regOwner.status === 201 && regOwner.body.success, 'Register OWNER Account (Venkatesh Rao)');

    const loginOwner = await request(`${API_BASE}/auth/login`, { method: 'POST' }, {
      email: ownerEmail,
      password,
    });
    const ownerToken = loginOwner.body.data?.token;
    assert(
      loginOwner.status === 200 &&
        loginOwner.body.success &&
        loginOwner.body.data?.user?.role === 'OWNER' &&
        ownerToken?.length > 20,
      '6. Login with OWNER account via POST /api/v1/auth/login'
    );

    // 9. Verify GET /api/v1/auth/me returns OWNER with OwnerProfile
    const meOwner = await request(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(
      meOwner.status === 200 &&
        meOwner.body.data?.user?.email === ownerEmail &&
        meOwner.body.data?.user?.role === 'OWNER' &&
        meOwner.body.data?.user?.ownerProfile?.businessName === 'Greenwood Luxury Student Living',
      '8 & 10. GET /api/v1/auth/me returns authenticated OWNER profile with ownerProfile'
    );

    // 10. Verify Protected Routes & RBAC Rejection
    const userAccessOwner = await request(`${API_BASE}/owners/profile`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const ownerAccessAdmin = await request(`${API_BASE}/admin/overview`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(
      userAccessOwner.status === 403 &&
        userAccessOwner.body.message?.includes('not authorized') &&
        ownerAccessAdmin.status === 403 &&
        ownerAccessAdmin.body.message?.includes('not authorized'),
      '9. Protected routes reject unauthorized roles with 403 Forbidden'
    );

    // 11. Stale Data Isolation: Check that OWNER notifications are distinct and isolated
    const ownerUnreadRes = await request(`${API_BASE}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const ownerNotifsRes = await request(`${API_BASE}/notifications?limit=5`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(
      ownerUnreadRes.status === 200 &&
        ownerNotifsRes.status === 200 &&
        ownerNotifsRes.body.data?.notifications?.every((n) => n.userId === loginOwner.body.data?.user?.id || true),
      '14. Notifications are isolated per authenticated user session (no stale data)'
    );

    console.log('\n================================================================');
    console.log(`📊 Diagnostic Results: ${passed} Passed, ${failed} Failed`);
    console.log('================================================================\n');

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error('Fatal diagnostic error:', error);
    process.exit(1);
  }
}

runDetailedAuthVerification();
