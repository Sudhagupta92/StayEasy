import { spawn, execSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const API_URL = 'http://localhost:5000/api/v1';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to check if a port is listening
const isPortListening = (port, host = '127.0.0.1', timeout = 1000) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isConnected = false;
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      isConnected = true;
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
};

// Find PID listening on a given port (Windows)
const getPidOnPort = (port) => {
  try {
    const output = execSync('netstat -ano', { encoding: 'utf8' });
    const lines = output.split(/\r?\n/);
    for (const line of lines) {
      if (line.includes(`:${port}`) && line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(pid) && pid > 0) return pid;
      }
    }
  } catch (e) {}
  return null;
};

// Kill process by PID
const killPid = (pid) => {
  if (!pid) return;
  try {
    execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
    console.log(`[Test] Terminated PID ${pid}.`);
  } catch (e) {}
};

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
    console.log(`  ✅ PASS: ${testName} ${details ? '(' + details + ')' : ''}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
    failed++;
  }
}

async function runAudit() {
  console.log('================================================================================');
  console.log('🛡️  StayEasy Comprehensive End-to-End Persistence & Restart Audit');
  console.log('================================================================================\n');

  // Ensure server is active before beginning test
  if (!(await isPortListening(5000))) {
    console.log('[Setup] Server not running on port 5000. Booting backend server...');
    const sProc = spawn('node', ['server.js'], { cwd: path.resolve('server'), stdio: 'ignore', detached: true });
    sProc.unref();
    const sWait = Date.now();
    while (Date.now() - sWait < 25000) {
      await sleep(500);
      if (await isPortListening(5000)) break;
    }
  }

  // STEP 1: Verify Initial Backend & Database Status
  console.log('--- Step 1: Health & Database Diagnostics ---');
  const initialHealth = await api('/health');
  assert(initialHealth.status === 200 && initialHealth.data?.success, '1.1 Health endpoint responds with 200 OK');
  assert(initialHealth.data?.data?.database?.isConnected === true, '1.2 Database is connected');
  assert(initialHealth.data?.data?.database?.isMemoryServer === false, '1.3 isMemoryServer is FALSE (Persistent WiredTiger DB)');

  // STEP 2: Create Pre-Restart Tenant, Landlord, Property, and Booking
  console.log('\n--- Step 2: Creating Pre-Restart Data (Tenant, Landlord, Custom Property, Booking) ---');
  const timestamp = Date.now();
  const tenantEmail = `tenant.restart.${timestamp}@stayeasy.local`;
  const ownerEmail = `owner.restart.${timestamp}@stayeasy.local`;
  const password = 'Password123!';
  const customPropTitle = `Persistent Heights Luxury Suites ${timestamp}`;

  // 2.1 Register Tenant
  const regTenant = await api('/auth/register', {
    method: 'POST',
    body: { name: 'Aarav Patel', email: tenantEmail, password, role: 'USER', phone: '9876543210' },
  });
  assert(regTenant.status === 201 && regTenant.data?.success, '2.1 Register Tenant account', tenantEmail);
  const tenantToken = regTenant.data?.data?.token;

  // 2.2 Register Landlord
  const regOwner = await api('/auth/register', {
    method: 'POST',
    body: { name: 'Naveen Kumar', email: ownerEmail, password, role: 'OWNER', phone: '9876543211', businessName: 'Kumar Living' },
  });
  assert(regOwner.status === 201 && regOwner.data?.success, '2.2 Register Landlord account', ownerEmail);
  const ownerToken = regOwner.data?.data?.token;

  // 2.3 Landlord Creates Custom Property
  const createProp = await api('/properties', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: {
      title: customPropTitle,
      tagline: 'High-End Verified Co-Living in Whitefield',
      description: 'Ultra luxury accommodations with 300 Mbps WiFi, gym, and 3 meals daily.',
      propertyType: 'PG',
      genderPreference: 'UNISEX',
      address: { street: 'Main Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560066', landmark: 'ITPL Signal' },
      images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80'],
      roomConfigurations: [
        { type: 'SINGLE', name: 'Private Suite', rent: 17500, deposit: 25000, totalBeds: 6, availableBeds: 5, attachedWashroom: true, hasBalcony: true, hasAC: true },
      ],
      expenses: {
        electricity: { type: 'PER_UNIT', rate: 8.5 },
        water: { type: 'INCLUDED', amount: 0 },
        maintenance: { type: 'INCLUDED', amount: 0 },
        food: { available: true, includedInRent: true, extraCost: 0 },
      },
    },
  });
  assert(createProp.status === 201 && createProp.data?.success, '2.3 Landlord creates new property in database');
  const propertyId = createProp.data?.data?.property?._id;
  const roomConfigId = createProp.data?.data?.property?.roomConfigurations[0]?._id;

  // 2.4 Tenant Books Room
  const createBooking = await api('/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tenantToken}` },
    body: {
      propertyId,
      roomConfigId,
      moveInDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      durationMonths: 6,
    },
  });
  assert(createBooking.status === 201 && createBooking.data?.success, '2.4 Tenant books room in newly created property');
  const bookingId = createBooking.data?.data?.booking?._id;

  // Record counts before restart
  const preRestartPropsRes = await api('/properties');
  const preRestartTotal = preRestartPropsRes.data?.data?.properties?.length || 0;
  console.log(`[Pre-Restart] Total properties in database: ${preRestartTotal}`);

  // =========================================================================
  // STEP 3: PERFORM ACTUAL RESTART OF SERVER AND DATABASE
  // =========================================================================
  console.log('\n================================================================================');
  console.log('🔄 STEP 3: PERFORMING ACTUAL FORCEFUL SERVER & DATABASE SHUTDOWN');
  console.log('================================================================================');

  const serverPid = getPidOnPort(5000);
  console.log(`[Restart Step] Server on port 5000 is PID: ${serverPid}`);
  const mongoPid = getPidOnPort(27017);
  console.log(`[Restart Step] MongoDB on port 27017 is PID: ${mongoPid}`);

  // Kill server process
  if (serverPid) {
    killPid(serverPid);
  }

  // Kill MongoDB process (simulating hard machine shutdown / process termination)
  if (mongoPid) {
    killPid(mongoPid);
  }

  // Verify ports are offline
  await sleep(1500);
  const serverListeningNow = await isPortListening(5000);
  const mongoListeningNow = await isPortListening(27017);
  console.log(`[Restart Step] Port 5000 listening: ${serverListeningNow} (Expected: false)`);
  console.log(`[Restart Step] Port 27017 listening: ${mongoListeningNow} (Expected: false)`);
  assert(!serverListeningNow, '3.1 HTTP server is completely offline');
  assert(!mongoListeningNow, '3.2 MongoDB daemon is completely offline');

  console.log('\n[Restart Step] Relaunching backend server (which automatically boots persistent mongod & self-heals)...');
  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.resolve('server'),
    stdio: 'ignore',
    detached: true,
  });
  serverProcess.unref();

  // Wait for server to come back online on port 5000
  let isBackOnline = false;
  const restartStart = Date.now();
  while (Date.now() - restartStart < 25000) {
    await sleep(500);
    if (await isPortListening(5000)) {
      isBackOnline = true;
      break;
    }
  }

  assert(isBackOnline, '3.3 Server successfully revived and is listening on port 5000');

  // STEP 4: Post-Restart Verification of Persisted Data
  console.log('\n--- Step 4: Verifying Data Persistence Across Server & Database Restart ---');
  const postHealth = await api('/health');
  assert(postHealth.status === 200, '4.1 Post-restart health check responds 200 OK');
  assert(postHealth.data?.data?.database?.isConnected === true, '4.2 Post-restart database is connected');
  assert(postHealth.data?.data?.database?.isMemoryServer === false, '4.3 Post-restart isMemoryServer is FALSE (Confirmed on-disk WiredTiger)');

  // 4.4 Tenant Login Post-Restart
  const postTenantLogin = await api('/auth/login', {
    method: 'POST',
    body: { email: tenantEmail, password },
  });
  assert(
    postTenantLogin.status === 200 && postTenantLogin.data?.success,
    '4.4 Pre-restart Tenant logs in successfully with preserved password & credentials',
    `User: ${postTenantLogin.data?.data?.user?.email}`
  );

  // 4.5 Landlord Login Post-Restart
  const postOwnerLogin = await api('/auth/login', {
    method: 'POST',
    body: { email: ownerEmail, password },
  });
  assert(
    postOwnerLogin.status === 200 && postOwnerLogin.data?.success,
    '4.5 Pre-restart Landlord logs in successfully with preserved password & credentials',
    `User: ${postOwnerLogin.data?.data?.user?.email}`
  );

  // 4.6 Custom Property Persistence
  const checkProp = await api(`/properties/${propertyId}`);
  assert(
    checkProp.status === 200 && checkProp.data?.data?.property?.title === customPropTitle,
    '4.6 Custom property created before shutdown persists intact',
    `Found title: "${checkProp.data?.data?.property?.title}"`
  );

  // 4.7 Booking Persistence
  const checkBooking = await api(`/bookings/${bookingId}`, {
    headers: { Authorization: `Bearer ${postTenantLogin.data?.data?.token}` },
  });
  assert(
    checkBooking.status === 200 && checkBooking.data?.data?.booking?._id === bookingId,
    '4.7 Booking created before shutdown persists intact',
    `Status: ${checkBooking.data?.data?.booking?.status}`
  );

  // 4.8 Idempotency: Zero duplicate properties
  const allPropsAfter = await api('/properties?limit=100');
  const titles = (allPropsAfter.data?.data?.properties || []).map((p) => p.title);
  const demoTitles = [
    'Greenwood Luxury Student Living & Co-Living',
    'MetroNest Executive Hostel for Professionals',
    'Serene Heights Premium Girls Residency',
    'Koregaon Park Co-Living & Shared Flat',
    'Bandra West Modern 1BHK / Private Rooms',
  ];

  for (const demoTitle of demoTitles) {
    const occurrences = titles.filter((t) => t === demoTitle).length;
    assert(occurrences === 1, `4.8 Demo listing "${demoTitle}" exists exactly once (occurrences: ${occurrences})`);
  }

  // STEP 5: Browser Verification (Puppeteer against live frontend)
  console.log('\n--- Step 5: Full Browser UI Verification (Edge / Puppeteer) ---');
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const browserErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (!t.includes('favicon') && !t.includes('unsplash')) browserErrors.push(t);
      }
    });

    // 5.1 Test Login Page
    console.log('[Browser] Navigating to http://localhost:5174/login...');
    await page.goto('http://localhost:5174/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await page.type('input[type="email"]', tenantEmail);
    await page.type('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await sleep(2500);

    const tokenInStorage = await page.evaluate(() => localStorage.getItem('stayeasy_token'));
    assert(!!tokenInStorage, '5.1 Browser login succeeded and stored stayeasy_token in localStorage');

    // 5.2 Test Properties Page & Search
    console.log('[Browser] Navigating to http://localhost:5174/properties...');
    await page.goto('http://localhost:5174/properties', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(2500);

    const displayedCards = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('h3')).map((h) => h.innerText);
    });
    const hasNoAccommodations = displayedCards.some((c) => c.includes('No Accommodations Found'));
    assert(!hasNoAccommodations, '5.2 Properties page loaded live listings without "No Accommodations Found" error');
    assert(displayedCards.length >= 5, '5.3 At least 5 property cards rendered in browser UI', `Cards count: ${displayedCards.length}`);

    console.log(`[Browser] Console errors recorded: ${browserErrors.length}`);
  } catch (browserErr) {
    console.error('Browser testing notice:', browserErr.message);
    failed++;
  } finally {
    if (browser) await browser.close();
  }

  console.log('\n================================================================================');
  console.log(`📊 RESTART & PERSISTENCE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
