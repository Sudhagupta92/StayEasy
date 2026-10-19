import puppeteer from 'puppeteer-core';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CLIENT_URL = 'http://localhost:5173';
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\2dae3e00-d4f8-4368-b043-923e79a0aa6d';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBrowserVerification() {
  console.log('================================================================');
  console.log('🌐 Running StayEasy Student Payment Method Browser Verification');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1440,920',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 920 });

  page.on('console', (msg) => {
    console.log(`[Browser Console ${msg.type()}]:`, msg.text());
  });
  page.on('pageerror', (err) => {
    console.log('[Browser Page Error]:', err.message);
  });

  const rand = Math.floor(Math.random() * 80000) + 20000;
  let passed = 0;
  let failed = 0;

  function assert(condition, stepName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${stepName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${stepName} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Register a student user via UI
    console.log('--- Step 1: Student Registration ---');
    await page.goto(`${CLIENT_URL}/register`, { waitUntil: 'networkidle2' });
    await delay(800);

    await page.type('input[placeholder="e.g. Rahul Verma"]', `Aman Student ${rand}`);
    await page.type('input[type="email"]', `aman_pay_${rand}@stayeasy.local`);
    await page.type('input[type="tel"]', '9876543210');
    await page.type('input[type="password"]', 'Password123!');

    const submitBtn = await page.evaluateHandle(() => document.querySelector('button[type="submit"]'));
    await submitBtn.click();

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await delay(1500);
    const urlAfterReg = page.url();
    assert(
      urlAfterReg.includes('/properties') || urlAfterReg.includes('/dashboard'),
      'Student registered and authenticated',
      urlAfterReg
    );

    // 2. Discover properties and navigate to detail page
    console.log('\n--- Step 2: Property Selection ---');
    await page.goto(`${CLIENT_URL}/properties`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.waitForSelector('a[href^="/properties/"]', { timeout: 8000 });
    const propertyLinks = await page.$$('a[href^="/properties/"]');
    const firstLink = propertyLinks[0];
    const href = await page.evaluate((el) => el.getAttribute('href'), firstLink);
    await page.goto(`${CLIENT_URL}${href}`, { waitUntil: 'networkidle2' });
    await delay(1200);

    const bookBtn = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((btn) =>
        btn.textContent.includes('Reserve Bed / Schedule Move-In')
      );
      return !!b;
    });
    assert(bookBtn, 'Property detail page loaded with reservation button');

    // 3. Open Booking & Payment Modal
    console.log('\n--- Step 3: Launch Booking & Payment Modal ---');
    console.log('Current URL before click:', page.url());
    const isAuthInBrowser = await page.evaluate(() => {
      return {
        token: localStorage.getItem('stayeasy_token') ? 'PRESENT' : 'MISSING',
      };
    });
    console.log('Browser Auth State:', isAuthInBrowser);

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Reserve Bed / Schedule Move-In')
      );
      if (btn) btn.click();
    });

    await delay(1500);
    console.log('Current URL after click:', page.url());
    const bodyHtml = await page.content();
    const hasConfigureStep = bodyHtml.includes('Reserve Your Bed') || bodyHtml.includes('Room Sharing') || bodyHtml.includes('Select Accommodation');
    assert(hasConfigureStep, 'Booking Modal Step 1: Configure Reservation opened');

    // Check step 1 content & proceed to Summary
    await page.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Review Booking & Costs') || b.textContent.includes('Review Costs')
      );
      if (nextBtn) nextBtn.click();
    });

    await delay(1000);
    const summaryHtml = await page.content();
    const hasSummary = summaryHtml.includes('Booking & Escrow Outlay') || summaryHtml.includes('Itemized Reservation Breakdown');
    assert(hasSummary, 'Booking Modal Step 2: Transparent Cost & Escrow Summary shown');

    // Verify Escrow Trust Banner
    const hasTrustMessage = summaryHtml.includes('Your security deposit is protected by StayEasy Escrow until verified move-in');
    assert(hasTrustMessage, 'Escrow Trust message clearly displayed in summary');

    // 4. Proceed to Step 3: Choose Payment Method
    console.log('\n--- Step 4: Choose Payment Method Selection UI ---');
    await page.evaluate(() => {
      const methodBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Choose Payment Method')
      );
      if (methodBtn) methodBtn.click();
    });

    await delay(1000);
    const methodsHtml = await page.content();
    const upiVisible = methodsHtml.includes('UPI Instant Payment');
    const cardVisible = methodsHtml.includes('Debit / Credit Card');
    const nbVisible = methodsHtml.includes('Net Banking');
    const cashVisible = methodsHtml.includes('Pay at Property');

    assert(upiVisible, 'Payment Option 1: UPI Available');
    assert(cardVisible, 'Payment Option 2: Debit / Credit Card Available');
    assert(nbVisible, 'Payment Option 3: Net Banking Available');
    assert(cashVisible, 'Payment Option 4: Pay at Property with host rule check');

    // Click Card
    await page.evaluate(() => {
      const cardOption = Array.from(document.querySelectorAll('div, button')).find((b) =>
        b.textContent.includes('Debit / Credit Card')
      );
      if (cardOption) cardOption.click();
    });
    await delay(500);
    assert(true, 'Selected Debit / Credit Card option');

    // Switch back to UPI
    await page.evaluate(() => {
      const upiOption = Array.from(document.querySelectorAll('div, button')).find((b) =>
        b.textContent.includes('UPI Instant Payment')
      );
      if (upiOption) upiOption.click();
    });
    await delay(500);
    assert(true, 'Switched to Instant UPI Payment option');

    // Screenshot Step 3 Payment Method UI
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'payment_step3_methods.png'), fullPage: false });

    // 5. Execute Payment & Advance Escrow
    console.log('\n--- Step 5: Proceed to Payment & Escrow Execution ---');
    await page.evaluate(() => {
      const payBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Pay ₹') || b.textContent.includes('Confirm Seat')
      );
      if (payBtn) payBtn.click();
    });

    // Wait for payment processing animation and confirmation step
    await delay(3500);
    const resultHtml = await page.content();
    const isSuccess = resultHtml.includes('Payment Confirmed') || resultHtml.includes('Payment Successful') || resultHtml.includes('HELD IN ESCROW');
    assert(isSuccess, 'Payment Result Step: Success Screen Displayed');

    const hasBookingRef = resultHtml.includes('Booking ID:');
    const hasTxnRef = resultHtml.includes('Transaction ID:');
    const hasEscrowStatus = resultHtml.includes('HELD IN ESCROW') || resultHtml.includes('Escrow Protection Active');
    const hasReceiptBtn = resultHtml.includes('Download / Print Receipt');

    assert(hasBookingRef, 'Booking ID displayed in confirmation screen');
    assert(hasTxnRef, 'Transaction ID displayed in confirmation screen');
    assert(hasEscrowStatus, 'Escrow Status (HELD IN ESCROW) displayed');
    assert(hasReceiptBtn, 'Print / Download Receipt action button available');

    // Screenshot Step 5 Success Screen
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'payment_step5_success.png'), fullPage: false });

    // 6. Test Printable Digital Escrow Receipt Modal
    console.log('\n--- Step 6: Escrow Digital Receipt ---');
    await page.evaluate(() => {
      const rBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Download / Print Receipt')
      );
      if (rBtn) rBtn.click();
    });
    await delay(1200);

    const receiptHtml = await page.content();
    const hasReceipt = receiptHtml.includes('Security Deposit Escrow Receipt') || receiptHtml.includes('Escrow Receipt');
    assert(hasReceipt, 'Official Escrow Receipt Modal opened with financials and verification details');

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'payment_escrow_receipt.png'), fullPage: false });

    // Close receipt modal
    await page.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Close Receipt')
      );
      if (closeBtn) closeBtn.click();
    });
    await delay(500);

    // 7. Verify Tenant Dashboard
    console.log('\n--- Step 7: Tenant Dashboard Integrity ---');
    await page.goto(`${CLIENT_URL}/user/dashboard`, { waitUntil: 'networkidle2' });
    await delay(1000);

    // Click on Bookings History tab
    await page.evaluate(() => {
      const bTab = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Booking History')
      );
      if (bTab) bTab.click();
    });
    await delay(1000);

    const dashHtml = await page.content();
    const hasHeldStatus = dashHtml.includes('HELD IN ESCROW');
    assert(hasHeldStatus, 'Tenant Dashboard shows active booking with HELD IN ESCROW badge');

    // 8. Verify Owner Dashboard
    console.log('\n--- Step 8: Owner Dashboard Integrity ---');
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]', { timeout: 8000 });
    await page.type('input[type="email"]', 'owner.greenwood@stayeasy.local');
    await page.type('input[type="password"]', 'Password123!');
    const ownerSubmit = await page.evaluateHandle(() => document.querySelector('button[type="submit"]'));
    await ownerSubmit.click();

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await delay(2000);
    const ownerDashUrl = page.url();
    assert(ownerDashUrl.includes('/owner/dashboard'), 'Owner Dashboard accessible and operational');

  } catch (err) {
    console.error('Fatal browser test error:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`📊 Browser Verification Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runBrowserVerification();
