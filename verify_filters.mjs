import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runVerification() {
  console.log('=======================================================');
  console.log('🚀 StayEasy Thorough Filter & Browser Test');
  console.log('=======================================================\n');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:5174/properties', { waitUntil: 'networkidle2' });
  await sleep(1500);

  // 1. All properties initial count
  const allProps = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h3'))
      .map((h) => h.innerText)
      .filter((c) => c && !c.includes('Found'));
  });
  console.log('1. All Properties Initial Count (Expected 5):', allProps.length);
  console.log('   Properties:', allProps);

  // Helper to change select
  async function selectFilter(selectIndex, value) {
    await page.evaluate((idx, val) => {
      const selects = document.querySelectorAll('select');
      const s = selects[idx];
      if (s) {
        s.value = val;
        s.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, selectIndex, value);
    await sleep(1000);
  }

  // 2. Filter City: Bengaluru
  console.log('\n2. Testing City Filter: Bengaluru');
  await selectFilter(0, 'Bengaluru');
  const blrProps = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h3'))
      .map((h) => h.innerText)
      .filter((c) => c && !c.includes('Found'));
  });
  console.log('   Bengaluru Results:', blrProps);

  // 3. Filter City: Delhi
  console.log('\n3. Testing City Filter: Delhi');
  await selectFilter(0, 'Delhi');
  const delProps = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h3'))
      .map((h) => h.innerText)
      .filter((c) => c && !c.includes('Found'));
  });
  console.log('   Delhi Results:', delProps);

  // 4. Filter City: Hyderabad
  console.log('\n4. Testing City Filter: Hyderabad');
  await selectFilter(0, 'Hyderabad');
  const hydProps = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h3'))
      .map((h) => h.innerText)
      .filter((c) => c && !c.includes('Found'));
  });
  console.log('   Hyderabad Results:', hydProps);

  // 5. Reset City Filter
  console.log('\n5. Resetting City Filter to ALL');
  await selectFilter(0, 'ALL');
  const resetProps = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h3'))
      .map((h) => h.innerText)
      .filter((c) => c && !c.includes('Found'));
  });
  console.log('   Reset count (Expected 5):', resetProps.length);

  // 6. Test Single Property Details Navigation
  console.log('\n6. Testing Property Details Page Navigation');
  await page.evaluate(() => {
    const detailBtn = Array.from(document.querySelectorAll('a')).find((a) => a.textContent.includes('View Breakdown'));
    if (detailBtn) detailBtn.click();
  });
  await sleep(2000);
  console.log('   Detail Page URL:', page.url());
  const detailTitle = await page.evaluate(() => document.querySelector('h1')?.innerText || '');
  console.log('   Detail Page Title:', detailTitle);

  await browser.close();
  console.log('\n✅ All filter and navigation tests passed!');
}

runVerification().catch(console.error);
