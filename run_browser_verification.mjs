import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CLIENT_URL = 'http://localhost:5173';
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\1d3b0144-591d-4f78-b354-301f449a4a4e';

// Track issues
const consoleErrors = [];
const consoleWarns = [];
const failedRequests = [];
const allRequests = [];

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBrowserVerification() {
  console.log('================================================================');
  console.log('🌐 Launching Real Browser (Chromium / Edge) UI Verification');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1400,900',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Attach Console and Network listeners
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      console.error(`🔴 [Browser Console Error]: ${text}`);
      consoleErrors.push(text);
    } else if (type === 'warn' && !text.includes('React DevTools') && !text.includes('future flag')) {
      console.warn(`🟡 [Browser Console Warn]: ${text}`);
      consoleWarns.push(text);
    } else {
      // console.log(`ℹ️ [Browser Console]: ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    console.error(`💥 [Browser Uncaught Exception]: ${err.message}`);
    consoleErrors.push(`Uncaught Exception: ${err.message}`);
  });

  page.on('requestfailed', (req) => {
    console.error(`❌ [Network Request Failed]: ${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
    failedRequests.push({ url: req.url(), error: req.failure()?.errorText });
  });

  page.on('response', (res) => {
    const status = res.status();
    const url = res.url();
    allRequests.push({ method: res.request().method(), url, status });
    if (status >= 400 && !url.includes('/favicon.ico')) {
      console.warn(`⚠️ [HTTP ${status}]: ${res.request().method()} ${url}`);
    }
  });

  const timestamp = Date.now();

  try {
    // -------------------------------------------------------------
    // TEST 1: HOMEPAGE VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Homepage (http://localhost:5173/) ---');
    await page.goto(CLIENT_URL, { waitUntil: 'networkidle2' });
    const homeTitle = await page.title();
    console.log(`Homepage title: "${homeTitle}"`);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screenshot_1_homepage.png') });
    console.log('📸 Captured screenshot_1_homepage.png');

    // -------------------------------------------------------------
    // TEST 2: OWNER REGISTRATION & REDIRECT TO /owner/dashboard
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Owner Registration Flow ---');
    await page.goto(`${CLIENT_URL}/register`, { waitUntil: 'networkidle2' });
    await delay(500);

    // Click "Property Owner" role button
    const ownerRoleButtons = await page.$$('button');
    let ownerBtnFound = false;
    for (const btn of ownerRoleButtons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text.includes('Property Owner')) {
        await btn.click();
        ownerBtnFound = true;
        break;
      }
    }
    console.log(`Clicked Property Owner role selector: ${ownerBtnFound}`);
    await delay(300);

    // Helper to type into React controlled inputs
    const setReactInput = async (selectorOrElement, value) => {
      await page.evaluate((el, val) => {
        const input = typeof el === 'string' ? document.querySelector(el) : el;
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }, selectorOrElement, value);
    };

    const ownerEmail = `browser.owner.${timestamp}@stayeasy.local`;
    const ownerPass = 'Password123!';
    const ownerName = 'Vikramaditya Singhania';
    const businessName = 'Singhania Residency Suites';

    // Find all input elements by placeholder or selector
    const allInputs = await page.$$('input');
    console.log(`Found ${allInputs.length} input fields on Register page`);

    await setReactInput(allInputs[0], ownerName);
    await setReactInput(allInputs[1], ownerEmail);
    await setReactInput(allInputs[2], businessName);
    await setReactInput(allInputs[3], '9876543210');
    await setReactInput(allInputs[4], ownerPass);

    await delay(500);
    // Submit form
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    console.log('Clicked "Complete Registration" button');

    // Wait for navigation
    await delay(3000);
    const postRegUrl = page.url();
    console.log(`Post-registration URL: ${postRegUrl}`);
    const isOwnerDashboard = postRegUrl.includes('/owner/dashboard');
    console.log(`✅ Automatic navigation to /owner/dashboard: ${isOwnerDashboard ? 'SUCCESS' : 'FAILED'}`);

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screenshot_2_owner_dashboard_initial.png') });
    console.log('📸 Captured screenshot_2_owner_dashboard_initial.png');

    // -------------------------------------------------------------
    // TEST 3: OWNER DASHBOARD ALL TABS VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing All Owner Dashboard Tabs ---');
    const ownerTabsToTest = [
      { name: 'Listed Accommodations', query: 'Listed Accommodations' },
      { name: 'Booking Inquiries', query: 'Booking Inquiries' },
      { name: 'Active Residents & Check-In', query: 'Active Residents' },
      { name: 'Rent Ledger & Invoicing', query: 'Rent Ledger' },
      { name: 'Resident Reviews', query: 'Resident Reviews' },
      { name: 'Maintenance & SLA', query: 'Maintenance & SLA' },
      { name: 'AI Intelligence', query: 'AI Intelligence' },
      { name: 'Earnings & Payouts', query: 'Earnings & Payouts' },
      { name: 'Analytics', query: 'Analytics' },
    ];

    for (const tab of ownerTabsToTest) {
      const clicked = await page.evaluate((tabQuery) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find((b) => b.textContent.includes(tabQuery));
        if (target) {
          target.click();
          return true;
        }
        return false;
      }, tab.query);

      await delay(800);
      console.log(`Owner Tab [${tab.name}]: clicked = ${clicked}, current errors = ${consoleErrors.length}`);
    }

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screenshot_3_owner_dashboard_tabs.png') });
    console.log('📸 Captured screenshot_3_owner_dashboard_tabs.png');

    // -------------------------------------------------------------
    // TEST 4: OWNER LOGOUT & RE-LOGIN
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Owner Logout & Re-Login Flow ---');
    await page.evaluate(() => {
      localStorage.removeItem('stayeasy_token');
    });
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle2' });
    await delay(500);

    const loginInputs = await page.$$('input');
    await setReactInput(loginInputs[0], ownerEmail);
    await setReactInput(loginInputs[1], ownerPass);

    await delay(300);
    const loginSubmitBtn = await page.$('button[type="submit"]');
    await loginSubmitBtn.click();
    console.log('Clicked "Sign In" button');

    await delay(2500);
    const postLoginUrl = page.url();
    console.log(`Post-login URL: ${postLoginUrl}`);
    console.log(`✅ Owner Re-login redirect: ${postLoginUrl.includes('/owner/dashboard') ? 'SUCCESS' : 'FAILED'}`);

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screenshot_4_owner_relogin.png') });
    console.log('📸 Captured screenshot_4_owner_relogin.png');

    // -------------------------------------------------------------
    // TEST 5: USER / TENANT REGISTRATION & DASHBOARD TABS
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Tenant (USER) Registration & Dashboard ---');
    await page.evaluate(() => localStorage.removeItem('stayeasy_token'));
    await page.goto(`${CLIENT_URL}/register`, { waitUntil: 'networkidle2' });
    await delay(500);

    const tenantEmail = `browser.tenant.${timestamp}@stayeasy.local`;
    const tenantPass = 'Password123!';
    const tenantName = 'Ananya Sen';

    const tenantInputs = await page.$$('input');
    await setReactInput(tenantInputs[0], tenantName);
    await setReactInput(tenantInputs[1], tenantEmail);
    await setReactInput(tenantInputs[2], '9876543222');
    await setReactInput(tenantInputs[3], tenantPass);

    await delay(300);
    const tenantSubmit = await page.$('button[type="submit"]');
    await tenantSubmit.click();
    console.log('Submitted Tenant Registration');

    await delay(2500);
    const tenantUrl = page.url();
    console.log(`Post-tenant registration URL: ${tenantUrl}`);
    console.log(`✅ Tenant redirect to /user/dashboard: ${tenantUrl.includes('/user/dashboard') ? 'SUCCESS' : 'FAILED'}`);

    // Click Tenant Tabs
    const tenantTabs = [
      { name: 'Active Accommodation', query: 'Active Accommodation' },
      { name: 'Digital Rent Ledger', query: 'Digital Rent Ledger' },
      { name: 'Booking History', query: 'Booking History' },
      { name: 'My Reviews', query: 'My Reviews' },
      { name: 'Maintenance & SLA', query: 'Maintenance & SLA' },
      { name: 'AI Recommendations', query: 'AI Recommendations' },
      { name: 'Financial Ledger', query: 'Financial Ledger' },
      { name: 'Spending & Insights', query: 'Spending & Insights' },
    ];

    for (const tab of tenantTabs) {
      const clicked = await page.evaluate((tabQuery) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find((b) => b.textContent.includes(tabQuery));
        if (target) {
          target.click();
          return true;
        }
        return false;
      }, tab.query);
      await delay(800);
      console.log(`Tenant Tab [${tab.name}]: clicked = ${clicked}, console errors = ${consoleErrors.length}`);
    }

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screenshot_5_tenant_dashboard.png') });
    console.log('📸 Captured screenshot_5_tenant_dashboard.png');

    // -------------------------------------------------------------
    // TEST 6: ADMIN LOGIN & DASHBOARD TABS
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Admin Login & Dashboard ---');
    await page.evaluate(() => localStorage.removeItem('stayeasy_token'));
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle2' });
    await delay(500);

    // Click 1-click Admin demo button
    const clickedAdminDemo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminBtn = buttons.find((b) => b.textContent.includes('Admin'));
      if (adminBtn) {
        adminBtn.click();
        return true;
      }
      return false;
    });
    console.log(`Clicked 1-Click Admin Demo Login: ${clickedAdminDemo}`);

    await delay(2500);
    const adminUrl = page.url();
    console.log(`Admin post-login URL: ${adminUrl}`);
    console.log(`✅ Admin redirect to /admin/dashboard: ${adminUrl.includes('/admin/dashboard') ? 'SUCCESS' : 'FAILED'}`);

    // Test Admin tabs
    const adminTabs = [
      { name: 'AI Platform Intelligence', query: 'AI Platform Intelligence' },
      { name: 'Platform Analytics & Telemetry', query: 'Platform Analytics' },
      { name: 'Platform Financial Control', query: 'Platform Financial Control' },
      { name: 'Audit Pipeline & Moderation Control', query: 'Audit Pipeline' },
    ];

    for (const tab of adminTabs) {
      const clicked = await page.evaluate((tabQuery) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find((b) => b.textContent.includes(tabQuery));
        if (target) {
          target.click();
          return true;
        }
        return false;
      }, tab.query);
      await delay(800);
      console.log(`Admin Tab [${tab.name}]: clicked = ${clicked}, console errors = ${consoleErrors.length}`);
    }

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screenshot_6_admin_dashboard.png') });
    console.log('📸 Captured screenshot_6_admin_dashboard.png');

  } catch (err) {
    console.error('💥 Test Execution Error:', err);
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log('📊 Browser Verification Summary');
  console.log('================================================================');
  console.log(`Total Red Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Errors:');
    consoleErrors.forEach((e) => console.log(`  - ${e}`));
  }
  console.log(`Total Failed Network Requests: ${failedRequests.length}`);
  if (failedRequests.length > 0) {
    failedRequests.forEach((r) => console.log(`  - ${r.url}: ${r.error}`));
  }
  console.log('================================================================\n');

  if (consoleErrors.length > 0 || failedRequests.length > 0) {
    process.exit(1);
  }
}

runBrowserVerification();
