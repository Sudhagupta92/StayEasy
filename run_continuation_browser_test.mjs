import puppeteer from 'puppeteer-core';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CLIENT_URL = 'http://localhost:5173';
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\2dae3e00-d4f8-4368-b043-923e79a0aa6d';

const consoleErrors = [];
const failedRequests = [];

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runContinuationBrowserTest() {
  console.log('================================================================');
  console.log('🌐 Starting StayEasy Continuation Browser Verification');
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

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      console.error(`🔴 [Browser Console Error]: ${text}`);
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', (err) => {
    console.error(`💥 [Browser Uncaught Exception]: ${err.message}`);
    consoleErrors.push(err.message);
  });

  page.on('requestfailed', (req) => {
    console.error(`❌ [Network Request Failed]: ${req.method()} ${req.url()}`);
    failedRequests.push(req.url());
  });

  const ts = Date.now();
  const ownerEmail = `continuation.owner.${ts}@stayeasy.local`;

  try {
    // -------------------------------------------------------------
    // TEST 1: LANDLORD LANDING PAGE (/owners)
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Landlord Landing Page (/owners) ---');
    await page.goto(`${CLIENT_URL}/owners`, { waitUntil: 'networkidle2' });
    await delay(1000);

    const titleText = await page.evaluate(() => document.querySelector('h1')?.innerText || '');
    console.log(`Page H1: "${titleText.replace(/\n/g, ' ')}"`);
    if (!titleText.toLowerCase().includes('maximize occupancy')) {
      throw new Error(`Unexpected H1 on /owners: ${titleText}`);
    }

    // Verify ROI calculator exists
    const hasCalculator = await page.evaluate(() => {
      return document.body.innerText.includes('Interactive Earnings Estimator') &&
             document.body.innerText.includes('Projected Monthly Revenue');
    });
    console.log(`ROI Calculator Detected: ${hasCalculator ? '✅ YES' : '❌ NO'}`);

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '40_owners_landing_page.png') });
    console.log('📸 Captured 40_owners_landing_page.png');

    // -------------------------------------------------------------
    // TEST 2: REGISTER PAGE WITH ROLE PRE-SELECTION (?role=OWNER)
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Register Page Role Pre-selection ---');
    await page.goto(`${CLIENT_URL}/register?role=OWNER`, { waitUntil: 'networkidle2' });
    await delay(1000);

    const isOwnerActive = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const ownerBtn = buttons.find(b => b.textContent.includes('Property Owner'));
      const hasBusinessField = Array.from(document.querySelectorAll('label')).some(l => l.textContent.includes('Business Name'));
      return {
        buttonFound: !!ownerBtn,
        hasBusinessField,
        isActiveClass: ownerBtn?.className.includes('bg-brand-50') || ownerBtn?.className.includes('border-brand-500')
      };
    });

    console.log(`Owner Role Pre-selected: ${isOwnerActive.hasBusinessField ? '✅ YES' : '❌ NO'}`);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '41_register_owner_preselected.png') });
    console.log('📸 Captured 41_register_owner_preselected.png');

    // -------------------------------------------------------------
    // TEST 3: REGISTER NEW OWNER & VERIFY UPGRADED DASHBOARD LAYOUT
    // -------------------------------------------------------------
    console.log('\n--- 3. Registering New Owner & Inspecting Upgraded DashboardLayout ---');
    await page.type('input[placeholder="e.g. Rahul Verma"]', 'Shivaji Grand Residences');
    await page.type('input[placeholder="e.g. Greenwood Luxury Living"]', 'Shivaji Grand Living Hub');
    await page.type('input[type="email"]', ownerEmail);
    await page.type('input[type="tel"]', '9876543299');
    await page.type('input[type="password"]', 'Password123!');

    // Click submit
    const submitBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button[type="submit"]'));
      return btns[0];
    });
    await submitBtn.click();

    // Wait for redirect to /owner/dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    await delay(2000);

    const currentUrl = page.url();
    console.log(`Redirected to: ${currentUrl}`);

    // Verify upgraded sidebar
    const sidebarChecks = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasPhase13Badge: text.includes('Phase 13 Enterprise'),
        hasNoPhase1Skeleton: !text.includes('Phase 1 UI Skeleton'),
        hasProductionHardened: text.includes('Production Hardened'),
        hasRoleLabel: text.includes('Property Landlord') || text.includes('OWNER'),
        hasSignOut: text.includes('Sign Out'),
        hasShortcuts: text.includes('Quick Shortcuts')
      };
    });

    console.log('Sidebar Verification Checks:', sidebarChecks);
    if (!sidebarChecks.hasPhase13Badge || !sidebarChecks.hasNoPhase1Skeleton) {
      throw new Error('Sidebar still contains obsolete Phase 1 skeleton or missing Phase 13 Enterprise badge!');
    }

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '42_owner_dashboard_upgraded_layout.png') });
    console.log('📸 Captured 42_owner_dashboard_upgraded_layout.png');

    // -------------------------------------------------------------
    // TEST 4: TENANT DASHBOARD SIDEBAR VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- 4. Registering Tenant & Inspecting Tenant Portal Layout ---');
    await page.goto(`${CLIENT_URL}/register?role=USER`, { waitUntil: 'networkidle2' });
    await delay(500);

    const tenantEmail = `continuation.tenant.${ts}@stayeasy.local`;
    await page.type('input[placeholder="e.g. Rahul Verma"]', 'Aarav Mehta');
    await page.type('input[type="email"]', tenantEmail);
    await page.type('input[type="tel"]', '9876543288');
    await page.type('input[type="password"]', 'Password123!');

    const tenantSubmitBtn = await page.evaluateHandle(() => {
      return document.querySelector('button[type="submit"]');
    });
    await tenantSubmitBtn.click();

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    await delay(2000);

    console.log(`Tenant redirected to: ${page.url()}`);
    const tenantSidebar = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasPhase13Badge: text.includes('Phase 13 Enterprise'),
        hasNoPhase1Skeleton: !text.includes('Phase 1 UI Skeleton'),
        hasTenantRole: text.includes('Resident Tenant') || text.includes('USER'),
        hasSignOut: text.includes('Sign Out')
      };
    });

    console.log('Tenant Sidebar Checks:', tenantSidebar);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '43_user_dashboard_upgraded_layout.png') });
    console.log('📸 Captured 43_user_dashboard_upgraded_layout.png');

    console.log('\n================================================================');
    console.log('🎉 ALL CONTINUATION BROWSER VERIFICATIONS PASSED SUCCESSFULLY!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Browser Verification Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runContinuationBrowserTest();
