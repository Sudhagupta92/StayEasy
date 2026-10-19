import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('====================================================');
  console.log('🔍 StayEasy E2E Test Suite (Registration, Login, Properties, Search, Filters)');
  console.log('====================================================');

  // 1. Health check
  console.log('\n[1] Checking Backend Health Endpoint: http://localhost:5000/api/v1/health');
  const healthRes = await fetch('http://localhost:5000/api/v1/health').then((r) => r.json());
  console.log('Health Response:', JSON.stringify(healthRes, null, 2));
  if (!healthRes.success) {
    throw new Error('Health check failed!');
  }

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon.ico') && !text.includes('unsplash.com')) {
        consoleErrors.push(text);
        console.error('  [Console Error]:', text);
      }
    }
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    if (!url.includes('favicon.ico') && !url.includes('unsplash.com') && !url.includes('fonts.gstatic.com')) {
      networkErrors.push(`${req.method()} ${url} - ${req.failure()?.errorText}`);
      console.error('  [Network Failed]:', req.method(), url, req.failure()?.errorText);
    }
  });

  // 2. Register from Browser
  const testEmail = `e2e_student_${Date.now()}@stayeasy.local`;
  const testPassword = 'Password123!';
  console.log(`\n[2] Testing Registration from Browser UI at http://localhost:5174/register`);
  await page.goto('http://localhost:5174/register', { waitUntil: 'networkidle2' });
  await sleep(1000);

  await page.type('input[placeholder="e.g. Rahul Verma"]', 'E2E Test Student');
  await page.type('input[placeholder="name@example.com"]', testEmail);
  await page.type('input[placeholder="+91 98765 43210"]', '9876543210');
  await page.type('input[placeholder="At least 6 characters"]', testPassword);

  await page.click('button[type="submit"]');
  await sleep(2500);

  const afterRegUrl = page.url();
  console.log('Post-Registration URL:', afterRegUrl);
  const regToken = await page.evaluate(() => localStorage.getItem('stayeasy_token'));
  console.log('Registration Token in localStorage:', !!regToken);
  if (!afterRegUrl.includes('/user/dashboard') || !regToken) {
    throw new Error('Registration failed to navigate to dashboard or store JWT token!');
  }
  console.log('✅ Registration SUCCESS!');

  // 3. Login from Browser
  console.log(`\n[3] Testing Login from Browser UI at http://localhost:5174/login`);
  await page.evaluate(() => localStorage.removeItem('stayeasy_token'));
  await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle2' });
  await sleep(1000);

  await page.type('input[placeholder="name@example.com"]', testEmail);
  await page.type('input[placeholder="••••••••"]', testPassword);
  await page.click('button[type="submit"]');
  await sleep(2500);

  const afterLoginUrl = page.url();
  console.log('Post-Login URL:', afterLoginUrl);
  const loginToken = await page.evaluate(() => localStorage.getItem('stayeasy_token'));
  console.log('Login Token in localStorage:', !!loginToken);
  if (!afterLoginUrl.includes('/user/dashboard') || !loginToken) {
    throw new Error('Login failed to navigate to dashboard or store JWT token!');
  }
  console.log('✅ Login SUCCESS!');

  // 4. Properties Page Listing
  console.log(`\n[4] Testing Properties Discovery Page at http://localhost:5174/properties`);
  await page.goto('http://localhost:5174/properties', { waitUntil: 'networkidle2' });
  await sleep(2000);

  const initialProperties = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h3'))
      .map((h) => h.innerText)
      .filter((c) => c && !c.includes('Found'));
  });
  console.log(`Properties loaded count: ${initialProperties.length} (Expected 5)`);
  console.log('Properties:', initialProperties);

  const emptyStateDisplayed = await page.evaluate(() =>
    document.body.innerText.includes('No Accommodations Found')
  );
  console.log('"No Accommodations Found" shown?:', emptyStateDisplayed);
  if (initialProperties.length !== 5 || emptyStateDisplayed) {
    throw new Error('Properties page failed to load all 5 seeded properties!');
  }
  console.log('✅ Properties Loading SUCCESS!');

  // 5. Search for "Greenwood"
  console.log('\n[5] Testing Search for "Greenwood"');
  const searchInput = await page.$('input[placeholder*="Search"]');
  await searchInput.type('Greenwood');
  await page.keyboard.press('Enter');
  await sleep(1500);

  const searchResults = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h3'))
      .map((h) => h.innerText)
      .filter((c) => c && !c.includes('Found'));
  });
  console.log(`Search Results Count: ${searchResults.length}`);
  console.log('Search Results:', searchResults);
  if (!searchResults.some((p) => p.includes('Greenwood'))) {
    throw new Error('Search did not return Greenwood Luxury Living!');
  }
  console.log('✅ Search SUCCESS!');

  // Clear search using the X button rendered by PropertiesPage
  const clearSearchBtn = await page.$('form button[type="button"]');
  if (clearSearchBtn) {
    await clearSearchBtn.click();
    await sleep(1500);
  }

  // 6. City Filters
  console.log('\n[6] Testing City Filter Pills');
  async function selectCity(cityName) {
    await page.evaluate((cName) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find((b) => b.textContent.trim() === cName);
      if (target) target.click();
    }, cityName);
    await sleep(1500);
    return await page.evaluate(() => {
      return Array.from(document.querySelectorAll('h3'))
        .map((h) => h.innerText)
        .filter((c) => c && !c.includes('Found'));
    });
  }

  const delhiResults = await selectCity('Delhi');
  console.log('Delhi filter results:', delhiResults);
  if (!delhiResults.includes('Serene Heights Premium Girls Residency')) {
    throw new Error('Delhi filter did not return Serene Heights!');
  }

  const blrResults = await selectCity('Bengaluru');
  console.log('Bengaluru filter results:', blrResults);
  if (!blrResults.includes('Greenwood Luxury Student Living & Co-Living')) {
    throw new Error('Bengaluru filter did not return Greenwood!');
  }

  const allCityResults = await selectCity('All Cities');
  console.log(`All Cities reset count: ${allCityResults.length} (Expected 5)`);
  if (allCityResults.length !== 5) {
    throw new Error('Resetting to All Cities did not return 5 properties!');
  }
  console.log('✅ City Filter Pills SUCCESS!');

  console.log('\n[7] Checking Browser Errors Summary');
  console.log('Console Errors:', consoleErrors.length);
  console.log('Network Failures:', networkErrors.length);

  await browser.close();

  console.log('\n====================================================');
  console.log('🎉 ALL TESTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

run().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err.message);
  process.exit(1);
});
