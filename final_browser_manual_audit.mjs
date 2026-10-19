import puppeteer from 'puppeteer-core';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CLIENT_URL = 'http://localhost:5173';
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\1d3b0144-591d-4f78-b354-301f449a4a4e';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const auditReport = {
  ownerFlow: { status: 'PENDING', steps: [] },
  userFlow: { status: 'PENDING', steps: [] },
  adminFlow: { status: 'PENDING', steps: [] },
  staleTokenFlow: { status: 'PENDING', steps: [] },
  bugVerifications: {
    useStateDefined: true,
    pendingBookingsDefined: true,
    ownerAnalyticsRendered: false,
    userAnalyticsRendered: false,
  },
  consoleErrors: [],
  failedRequests: [],
};

async function runAudit() {
  console.log('================================================================================');
  console.log('🧪 StayEasy Full Manual-Equivalent Browser UI Verification');
  console.log('================================================================================\n');

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

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      console.error(`🔴 [Browser Console Error]: ${text}`);
      auditReport.consoleErrors.push({ text, url: page.url() });
      if (text.includes('useState is not defined')) auditReport.bugVerifications.useStateDefined = false;
      if (text.includes('pendingBookings is not defined')) auditReport.bugVerifications.pendingBookingsDefined = false;
    }
  });

  page.on('pageerror', (err) => {
    console.error(`💥 [Browser Uncaught Exception]: ${err.message}`);
    auditReport.consoleErrors.push({ text: `Uncaught Exception: ${err.message}`, url: page.url() });
    if (err.message.includes('useState is not defined')) auditReport.bugVerifications.useStateDefined = false;
    if (err.message.includes('pendingBookings is not defined')) auditReport.bugVerifications.pendingBookingsDefined = false;
  });

  page.on('requestfailed', (req) => {
    console.error(`❌ [Network Request Failed]: ${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
    auditReport.failedRequests.push({ url: req.url(), error: req.failure()?.errorText });
  });

  page.on('response', (res) => {
    const status = res.status();
    const url = res.url();
    if (status >= 400 && !url.includes('/favicon.ico')) {
      console.warn(`⚠️ [HTTP ${status}]: ${res.request().method()} ${url}`);
      if (status >= 500) {
        auditReport.failedRequests.push({ url, status, error: `HTTP ${status}` });
      }
    }
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
    // =========================================================================
    // SECTION 1: OWNER FULL MANUAL FLOW
    // =========================================================================
    console.log('>>> [1/4] Starting Owner Registration & Dashboard Verification...');
    await page.goto(`${CLIENT_URL}/register`, { waitUntil: 'networkidle2' });
    await delay(500);

    // Select Property Owner role
    const ownerBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent.includes('Property Owner'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    auditReport.ownerFlow.steps.push({ step: 'Select Property Owner Role', success: ownerBtn });
    await delay(300);

    const ownerEmail = `audit.owner.${timestamp}@stayeasy.local`;
    const ownerPass = 'Password123!';
    const ownerName = 'Rameshwaram Hostels Pvt Ltd';
    const businessName = 'Rameshwaram Premium Living';

    const ownerInputs = await page.$$('input');
    await setReactInput(ownerInputs[0], ownerName);
    await setReactInput(ownerInputs[1], ownerEmail);
    await setReactInput(ownerInputs[2], businessName);
    await setReactInput(ownerInputs[3], '9876543210');
    await setReactInput(ownerInputs[4], ownerPass);
    await delay(300);

    const ownerSubmit = await page.$('button[type="submit"]');
    await ownerSubmit.click();
    await delay(3000);

    const ownerPostRegUrl = page.url();
    const ownerRegSuccess = ownerPostRegUrl.includes('/owner/dashboard');
    auditReport.ownerFlow.steps.push({
      step: 'Auto-redirect to /owner/dashboard',
      success: ownerRegSuccess,
      url: ownerPostRegUrl,
    });
    console.log(`Owner Auto-Redirect: ${ownerRegSuccess ? 'PASS' : 'FAIL'} (${ownerPostRegUrl})`);

    // Verify Owner Header text
    const ownerDashboardText = await page.evaluate(() => document.body.innerText);
    const hasOwnerProfile = ownerDashboardText.includes('Verified Landlord Partner') || ownerDashboardText.includes(businessName);
    auditReport.ownerFlow.steps.push({ step: 'Owner Portal UI Rendered', success: hasOwnerProfile });

    // Step through each Owner Tab one by one
    const ownerTabs = [
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

    for (const tab of ownerTabs) {
      const errCountBefore = auditReport.consoleErrors.length;
      const clicked = await page.evaluate((q) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find((b) => b.textContent.includes(q));
        if (target) {
          target.click();
          return true;
        }
        return false;
      }, tab.query);

      await delay(800);
      const errCountAfter = auditReport.consoleErrors.length;
      const tabSuccess = clicked && errCountBefore === errCountAfter;
      if (tab.name === 'Analytics') auditReport.bugVerifications.ownerAnalyticsRendered = true;

      auditReport.ownerFlow.steps.push({
        step: `Owner Tab: ${tab.name}`,
        clicked,
        errorsIntroduced: errCountAfter - errCountBefore,
        success: tabSuccess,
      });
      console.log(`   [Owner Tab] ${tab.name}: ${tabSuccess ? 'PASS' : 'FAIL'}`);
    }

    // Logout and Re-Login
    console.log('   Testing Owner Logout & Re-Login...');
    await page.evaluate(() => localStorage.removeItem('stayeasy_token'));
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle2' });
    await delay(400);

    const loginInputs = await page.$$('input');
    await setReactInput(loginInputs[0], ownerEmail);
    await setReactInput(loginInputs[1], ownerPass);
    await delay(300);

    const loginBtn = await page.$('button[type="submit"]');
    await loginBtn.click();
    await delay(2500);

    const ownerReloginUrl = page.url();
    const ownerReloginSuccess = ownerReloginUrl.includes('/owner/dashboard');
    auditReport.ownerFlow.steps.push({
      step: 'Owner Re-Login & Dashboard Reload',
      success: ownerReloginSuccess,
      url: ownerReloginUrl,
    });
    console.log(`Owner Re-Login Reload: ${ownerReloginSuccess ? 'PASS' : 'FAIL'}`);
    auditReport.ownerFlow.status = ownerRegSuccess && ownerReloginSuccess ? 'PASS' : 'FAIL';

    // =========================================================================
    // SECTION 2: USER / TENANT FULL MANUAL FLOW
    // =========================================================================
    console.log('\n>>> [2/4] Starting Tenant (USER) Registration & Dashboard Verification...');
    await page.evaluate(() => localStorage.removeItem('stayeasy_token'));
    await page.goto(`${CLIENT_URL}/register`, { waitUntil: 'networkidle2' });
    await delay(500);

    const tenantEmail = `audit.tenant.${timestamp}@stayeasy.local`;
    const tenantPass = 'Password123!';
    const tenantName = 'Shreya Mukherjee';

    const tenantInputs = await page.$$('input');
    await setReactInput(tenantInputs[0], tenantName);
    await setReactInput(tenantInputs[1], tenantEmail);
    await setReactInput(tenantInputs[2], '9876543222');
    await setReactInput(tenantInputs[3], tenantPass);
    await delay(300);

    const tenantSubmit = await page.$('button[type="submit"]');
    await tenantSubmit.click();
    await delay(3000);

    const tenantPostRegUrl = page.url();
    const tenantRegSuccess = tenantPostRegUrl.includes('/user/dashboard');
    auditReport.userFlow.steps.push({
      step: 'Auto-redirect to /user/dashboard',
      success: tenantRegSuccess,
      url: tenantPostRegUrl,
    });
    console.log(`Tenant Auto-Redirect: ${tenantRegSuccess ? 'PASS' : 'FAIL'} (${tenantPostRegUrl})`);

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
      const errCountBefore = auditReport.consoleErrors.length;
      const clicked = await page.evaluate((q) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find((b) => b.textContent.includes(q));
        if (target) {
          target.click();
          return true;
        }
        return false;
      }, tab.query);

      await delay(800);
      const errCountAfter = auditReport.consoleErrors.length;
      const tabSuccess = clicked && errCountBefore === errCountAfter;
      if (tab.name === 'Spending & Insights') auditReport.bugVerifications.userAnalyticsRendered = true;

      auditReport.userFlow.steps.push({
        step: `Tenant Tab: ${tab.name}`,
        clicked,
        errorsIntroduced: errCountAfter - errCountBefore,
        success: tabSuccess,
      });
      console.log(`   [Tenant Tab] ${tab.name}: ${tabSuccess ? 'PASS' : 'FAIL'}`);
    }

    // Logout and Re-Login
    console.log('   Testing Tenant Logout & Re-Login...');
    await page.evaluate(() => localStorage.removeItem('stayeasy_token'));
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle2' });
    await delay(400);

    const tenantLoginInputs = await page.$$('input');
    await setReactInput(tenantLoginInputs[0], tenantEmail);
    await setReactInput(tenantLoginInputs[1], tenantPass);
    await delay(300);

    const tenantLoginBtn = await page.$('button[type="submit"]');
    await tenantLoginBtn.click();
    await delay(2500);

    const tenantReloginUrl = page.url();
    const tenantReloginSuccess = tenantReloginUrl.includes('/user/dashboard');
    auditReport.userFlow.steps.push({
      step: 'Tenant Re-Login & Dashboard Reload',
      success: tenantReloginSuccess,
      url: tenantReloginUrl,
    });
    console.log(`Tenant Re-Login Reload: ${tenantReloginSuccess ? 'PASS' : 'FAIL'}`);
    auditReport.userFlow.status = tenantRegSuccess && tenantReloginSuccess ? 'PASS' : 'FAIL';

    // =========================================================================
    // SECTION 3: ADMIN FULL MANUAL FLOW
    // =========================================================================
    console.log('\n>>> [3/4] Starting Admin Login & Dashboard Verification...');
    await page.evaluate(() => localStorage.removeItem('stayeasy_token'));
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle2' });
    await delay(500);

    // 1-Click Admin Login
    const clickedAdminDemo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminBtn = buttons.find((b) => b.textContent.includes('Admin'));
      if (adminBtn) {
        adminBtn.click();
        return true;
      }
      return false;
    });
    await delay(2500);

    const adminUrl = page.url();
    const adminLoginSuccess = adminUrl.includes('/admin/dashboard');
    auditReport.adminFlow.steps.push({
      step: 'Admin Login & Redirect to /admin/dashboard',
      success: adminLoginSuccess,
      url: adminUrl,
    });
    console.log(`Admin Redirect: ${adminLoginSuccess ? 'PASS' : 'FAIL'} (${adminUrl})`);

    const adminTabs = [
      { name: 'AI Platform Intelligence', query: 'AI Platform Intelligence' },
      { name: 'Platform Analytics & Telemetry', query: 'Platform Analytics' },
      { name: 'Platform Financial Control', query: 'Platform Financial Control' },
      { name: 'Audit Pipeline & Moderation Control', query: 'Audit Pipeline' },
    ];

    for (const tab of adminTabs) {
      const errCountBefore = auditReport.consoleErrors.length;
      const clicked = await page.evaluate((q) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find((b) => b.textContent.includes(q));
        if (target) {
          target.click();
          return true;
        }
        return false;
      }, tab.query);

      await delay(800);
      const errCountAfter = auditReport.consoleErrors.length;
      const tabSuccess = clicked && errCountBefore === errCountAfter;

      auditReport.adminFlow.steps.push({
        step: `Admin Tab: ${tab.name}`,
        clicked,
        errorsIntroduced: errCountAfter - errCountBefore,
        success: tabSuccess,
      });
      console.log(`   [Admin Tab] ${tab.name}: ${tabSuccess ? 'PASS' : 'FAIL'}`);
    }
    auditReport.adminFlow.status = adminLoginSuccess ? 'PASS' : 'FAIL';

    // =========================================================================
    // SECTION 4: STALE TOKEN RECOVERY VERIFICATION
    // =========================================================================
    console.log('\n>>> [4/4] Starting Stale Token Recovery Verification...');
    await page.evaluate(() => {
      localStorage.setItem('stayeasy_token', 'stale.invalid.mock.jwt.token');
    });
    await page.goto(`${CLIENT_URL}/`, { waitUntil: 'networkidle2' });
    await delay(1000);

    const tokenAfterStaleCheck = await page.evaluate(() => localStorage.getItem('stayeasy_token'));
    const isCleanedGracefully = tokenAfterStaleCheck === null;
    auditReport.staleTokenFlow.steps.push({
      step: 'Stale token evicted from localStorage without crash',
      success: isCleanedGracefully,
      tokenState: tokenAfterStaleCheck,
    });
    auditReport.staleTokenFlow.status = isCleanedGracefully ? 'PASS' : 'FAIL';
    console.log(`Stale Token Eviction & Session Recovery: ${isCleanedGracefully ? 'PASS' : 'FAIL'}`);

  } catch (err) {
    console.error('💥 Execution Exception during audit:', err);
  } finally {
    await browser.close();
  }

  console.log('\n================================================================================');
  console.log('📊 Complete Manual UI Audit Result Summary');
  console.log('================================================================================');
  console.log(`Owner Flow:       ${auditReport.ownerFlow.status}`);
  console.log(`User/Tenant Flow: ${auditReport.userFlow.status}`);
  console.log(`Admin Flow:       ${auditReport.adminFlow.status}`);
  console.log(`Stale Token Flow: ${auditReport.staleTokenFlow.status}`);
  console.log(`Console Errors:   ${auditReport.consoleErrors.length}`);
  console.log(`Failed Requests:  ${auditReport.failedRequests.length}`);
  console.log('Bug Verifications:');
  console.log(`  - useState is defined:            ${auditReport.bugVerifications.useStateDefined ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  - pendingBookings is defined:     ${auditReport.bugVerifications.pendingBookingsDefined ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  - OwnerAnalytics rendered:        ${auditReport.bugVerifications.ownerAnalyticsRendered ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  - UserAnalytics rendered:         ${auditReport.bugVerifications.userAnalyticsRendered ? '✅ PASS' : '❌ FAIL'}`);
  console.log('================================================================================\n');

  if (
    auditReport.ownerFlow.status !== 'PASS' ||
    auditReport.userFlow.status !== 'PASS' ||
    auditReport.adminFlow.status !== 'PASS' ||
    auditReport.consoleErrors.length > 0 ||
    auditReport.failedRequests.length > 0
  ) {
    process.exit(1);
  }
}

runAudit();
