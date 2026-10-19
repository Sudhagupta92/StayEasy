import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCityPillsTest() {
  console.log('=======================================================');
  console.log('🚀 StayEasy City Pill Buttons Functional Test');
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

  async function clickCity(cityName) {
    await page.evaluate((cName) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent.trim() === cName);
      if (btn) btn.click();
    }, cityName);
    await sleep(1500);
    return await page.evaluate(() => {
      return Array.from(document.querySelectorAll('h3'))
        .map((h) => h.innerText)
        .filter((c) => c && !c.includes('Found'));
    });
  }

  console.log('1. All Cities initially:', (await clickCity('All Cities')).length);

  console.log('\n2. Click "Bengaluru":');
  const blr = await clickCity('Bengaluru');
  console.log('   Result:', blr);

  console.log('\n3. Click "Delhi":');
  const del = await clickCity('Delhi');
  console.log('   Result:', del);

  console.log('\n4. Click "Hyderabad":');
  const hyd = await clickCity('Hyderabad');
  console.log('   Result:', hyd);

  console.log('\n5. Click "Pune":');
  const pune = await clickCity('Pune');
  console.log('   Result:', pune);

  console.log('\n6. Click "Mumbai":');
  const mum = await clickCity('Mumbai');
  console.log('   Result:', mum);

  console.log('\n7. Click "All Cities":');
  const all = await clickCity('All Cities');
  console.log('   Count:', all.length, '| Properties:', all);

  await browser.close();
  console.log('\n🎯 City pills verification complete!');
}

runCityPillsTest().catch(console.error);
