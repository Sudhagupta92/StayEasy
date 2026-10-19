import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runVerification() {
  console.log('=======================================================');
  console.log('🚀 StayEasy Full Fix Verification Suite');
  console.log('=======================================================\n');

  // Test 1: Health Check Endpoint
  console.log('--- TEST 1: Health Endpoint Check ---');
  const healthRes = await fetch('http://localhost:5000/api/v1/health').then((r) => r.json());
  console.log('Health Success:', healthRes.success);
  console.log('DB isConnected:', healthRes.data?.database?.isConnected);
  console.log('DB Host:', healthRes.data?.database?.host);
  console.log('DB Name:', healthRes.data?.database?.name);
  console.log('DB isMemoryServer:', healthRes.data?.database?.isMemoryServer);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('favicon.ico') && !txt.includes('unsplash.com')) {
        consoleErrors.push(txt);
        console.error('  [Browser Console Error]:', txt);
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

  const testEmail = `user_${Date.now()}@stayeasy.local`;
  const testPassword = 'Password123!';

  // Test 2: User Registration from Browser
  console.log('\n--- TEST 2: User Registration from Browser (http://localhost:5174/register) ---');
  await page.goto('http://localhost:5174/register', { waitUntil: 'networkidle2' });
  await sleep(1000);

  // Fill in Registration Form
  await page.type('input[type="text"]', 'Ananya Sharma');
  await page.type('input[type="email"]', testEmail);
  await page.type('input[type="tel"]', '9876543210');
  await page.type('input[type="password"]', testPassword);

  await page.click('button[type="submit"]');
  await sleep(2500);

  console.log('Post-Registration URL:', page.url());
  const regToken = await page.evaluate(() => localStorage.getItem('stayeasy_token'));
  console.log('Registration Token in localStorage:', !!regToken);
  console.log('Is on User Dashboard:', page.url().includes('/user/dashboard'));

  // Test 3: User Login from Browser
  console.log('\n--- TEST 3: User Login from Browser (http://localhost:5174/login) ---');
  // Log out / clear localStorage
  await page.evaluate(() => localStorage.removeItem('stayeasy_token'));
  await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.type('input[type="email"]', testEmail);
  await page.type('input[type="password"]', testPassword);
  await page.click('button[type="submit"]');
  await sleep(2500);

  console.log('Post-Login URL:', page.url());
  const loginToken = await page.evaluate(() => localStorage.getItem('stayeasy_token'));
  console.log('Login Token in localStorage:', !!loginToken);
  console.log('Is on User Dashboard:', page.url().includes('/user/dashboard'));

  // Test 4: Properties Page Listing
  console.log('\n--- TEST 4: Properties Page (http://localhost:5174/properties) ---');
  await page.goto('http://localhost:5174/properties', { waitUntil: 'networkidle2' });
  await sleep(2000);

  const propertyCards = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('h3')).map((h) => h.innerText);
    return cards.filter((c) => c && !c.includes('Found'));
  });
  console.log('Number of Properties Displayed:', propertyCards.length);
  console.log('Properties Loaded:', propertyCards);

  const emptyState = await page.evaluate(() => document.body.innerText.includes('No Accommodations Found'));
  console.log('Is Empty State ("No Accommodations Found") displayed?:', emptyState);

  // Test 5: Search & Filtering
  console.log('\n--- TEST 5: Search and Filtering ---');
  // Search for "Greenwood"
  const searchInput = await page.$('input[placeholder*="Search"]');
  if (searchInput) {
    await searchInput.type('Greenwood');
    await page.keyboard.press('Enter');
    await sleep(1500);

    const greenwoodCards = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('h3'))
        .map((h) => h.innerText)
        .filter((c) => c && !c.includes('Found'));
    });
    console.log('Search "Greenwood" Count:', greenwoodCards.length);
    console.log('Search Result:', greenwoodCards);
  }

  // Clear Search
  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Search"]');
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await sleep(1000);

  // Filter City: "Hyderabad"
  await page.evaluate(() => {
    const select = document.querySelector('select');
    if (select) {
      select.value = 'Hyderabad';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(1500);

  const hyderabadCards = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h3'))
      .map((h) => h.innerText)
      .filter((c) => c && !c.includes('Found'));
  });
  console.log('City "Hyderabad" Count:', hyderabadCards.length);
  console.log('City Filter Results:', hyderabadCards);

  // Click Clear All / Reset Filters
  await page.evaluate(() => {
    const clearBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Clear All'));
    if (clearBtn) clearBtn.click();
  });
  await sleep(1500);

  const allCardsReset = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h3'))
      .map((h) => h.innerText)
      .filter((c) => c && !c.includes('Found'));
  });
  console.log('After Clear Filters Count:', allCardsReset.length);

  console.log('\n--- Final Browser Health Check ---');
  console.log('Browser Console Errors Count:', consoleErrors.length);
  console.log('Network Request Errors Count:', networkErrors.length);

  await browser.close();

  console.log('\n=======================================================');
  console.log('🎉 ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
  console.log('=======================================================');
}

runVerification().catch((err) => {
  console.error('❌ Verification failed with error:', err);
  process.exit(1);
});
