import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CLIENT_URL = 'http://localhost:5173';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runCleanUIVerification() {
  console.log('================================================================================');
  console.log('🌐 Final Real Browser UI Pass (Owner, Tenant, Admin Standard Sessions)');
  console.log('================================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1400,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const consoleErrors = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`🔴 [Console Error]: ${msg.text()}`);
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    console.error(`💥 [Uncaught Exception]: ${err.message}`);
    consoleErrors.push(err.message);
  });

  page.on('requestfailed', (req) => {
    console.error(`❌ [Request Failed]: ${req.method()} ${req.url()}`);
    failedRequests.push(req.url());
  });

  const setReactInput = async (selectorOrElement, value) => {
    await page.evaluate((el, val) => {
      const input = typeof el === 'string' ? document.querySelector(el) : el;
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, selectorOrElement, value);
  };

  const timestamp = Date.now();

  try {
    // 1. OWNER FLOW
    console.log('1. Owner Flow (Register -> 9 Tabs -> Logout -> Login -> Reload)...');
    await page.goto(`${CLIENT_URL}/register`, { waitUntil: 'networkidle2' });
    await delay(300);

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Property Owner'));
      if (btn) btn.click();
    });
    await delay(200);

    const ownerEmail = `clean.owner.${timestamp}@stayeasy.local`;
    const ownerInputs = await page.$$('input');
    await setReactInput(ownerInputs[0], 'Manipal Student Stays');
    await setReactInput(ownerInputs[1], ownerEmail);
    await setReactInput(ownerInputs[2], 'Manipal Luxury PG');
    await setReactInput(ownerInputs[3], '9876543210');
    await setReactInput(ownerInputs[4], 'Password123!');
    await delay(200);

    const ownerSubmit = await page.$('button[type="submit"]');
    await ownerSubmit.click();
    await delay(2500);

    console.log(`   Owner Dashboard URL: ${page.url()}`);

    const ownerTabs = [
      'Listed Accommodations', 'Booking Inquiries', 'Active Residents',
      'Rent Ledger', 'Resident Reviews', 'Maintenance & SLA',
      'AI Intelligence', 'Earnings & Payouts', 'Analytics'
    ];
    for (const q of ownerTabs) {
      await page.evaluate((query) => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes(query));
        if (btn) btn.click();
      }, q);
      await delay(400);
    }

    // Owner Logout & Re-login
    await page.evaluate(() => localStorage.removeItem('stayeasy_token'));
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle2' });
    await delay(300);

    const loginInputs = await page.$$('input');
    await setReactInput(loginInputs[0], ownerEmail);
    await setReactInput(loginInputs[1], 'Password123!');
    await delay(200);

    const loginSubmit = await page.$('button[type="submit"]');
    await loginSubmit.click();
    await delay(2500);
    console.log(`   Owner Re-login Dashboard URL: ${page.url()}`);

    // 2. USER / TENANT FLOW
    console.log('\n2. Tenant Flow (Register -> 8 Tabs -> Logout -> Login -> Reload)...');
    await page.evaluate(() => localStorage.removeItem('stayeasy_token'));
    await page.goto(`${CLIENT_URL}/register`, { waitUntil: 'networkidle2' });
    await delay(300);

    const tenantEmail = `clean.tenant.${timestamp}@stayeasy.local`;
    const tenantInputs = await page.$$('input');
    await setReactInput(tenantInputs[0], 'Kavya Nair');
    await setReactInput(tenantInputs[1], tenantEmail);
    await setReactInput(tenantInputs[2], '9876543222');
    await setReactInput(tenantInputs[3], 'Password123!');
    await delay(200);

    const tenantSubmit = await page.$('button[type="submit"]');
    await tenantSubmit.click();
    await delay(2500);
    console.log(`   Tenant Dashboard URL: ${page.url()}`);

    const tenantTabs = [
      'Active Accommodation', 'Digital Rent Ledger', 'Booking History',
      'My Reviews', 'Maintenance & SLA', 'AI Recommendations',
      'Financial Ledger', 'Spending & Insights'
    ];
    for (const q of tenantTabs) {
      await page.evaluate((query) => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes(query));
        if (btn) btn.click();
      }, q);
      await delay(400);
    }

    // Tenant Logout & Re-login
    await page.evaluate(() => localStorage.removeItem('stayeasy_token'));
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle2' });
    await delay(300);

    const tenantLoginInputs = await page.$$('input');
    await setReactInput(tenantLoginInputs[0], tenantEmail);
    await setReactInput(tenantLoginInputs[1], 'Password123!');
    await delay(200);

    const tenantLoginSubmit = await page.$('button[type="submit"]');
    await tenantLoginSubmit.click();
    await delay(2500);
    console.log(`   Tenant Re-login Dashboard URL: ${page.url()}`);

    // 3. ADMIN FLOW
    console.log('\n3. Admin Flow (Login -> 4 Tabs)...');
    await page.evaluate(() => localStorage.removeItem('stayeasy_token'));
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle2' });
    await delay(300);

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Admin'));
      if (btn) btn.click();
    });
    await delay(2500);
    console.log(`   Admin Dashboard URL: ${page.url()}`);

    const adminTabs = [
      'AI Platform Intelligence', 'Platform Analytics',
      'Platform Financial Control', 'Audit Pipeline'
    ];
    for (const q of adminTabs) {
      await page.evaluate((query) => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes(query));
        if (btn) btn.click();
      }, q);
      await delay(400);
    }

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }

  console.log('\n================================================================================');
  console.log(`Total Red Console Errors:       ${consoleErrors.length}`);
  console.log(`Total Failed Network Requests:  ${failedRequests.length}`);
  console.log('================================================================================\n');

  if (consoleErrors.length > 0 || failedRequests.length > 0) {
    process.exit(1);
  }
}

runCleanUIVerification();
