const API_URL = 'http://localhost:5000/api/v1';

async function req(endpoint, options = {}) {
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

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

async function runPhase6Tests() {
  console.log('====================================================');
  console.log('🚀 Starting StayEasy Phase 6: Stay Lifecycle & Rent Ledger Tests');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  const rand = Math.floor(Math.random() * 90000) + 10000;
  let ownerToken = '';
  let tenantToken = '';
  let unauthorizedToken = '';
  let propertyId = '';
  let roomConfigId = '';
  let bookingId = '';
  let invoice1Id = '';
  let invoice2Id = '';

  // 1. Register Auth Users
  try {
    const regOwner = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Ledger Landlord #${rand}`,
        email: `ledger_owner_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'OWNER',
        businessName: 'Digital Rent Residency',
      },
    });
    ownerToken = regOwner.data.data?.token;

    const regTenant = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Resident Tenant #${rand}`,
        email: `resident_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'USER',
      },
    });
    tenantToken = regTenant.data.data?.token;

    const regOther = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Unauthorized User #${rand}`,
        email: `unauth_ledger_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'USER',
      },
    });
    unauthorizedToken = regOther.data.data?.token;

    assert(
      !!ownerToken && !!tenantToken && !!unauthorizedToken,
      'Test users (Owner, Resident Tenant, Unauthorized User) registered'
    );
  } catch (e) {
    assert(false, `Account setup failed: ${e.message}`);
  }

  // 2. Owner creates property listing & Tenant reserves + checks in
  try {
    const propRes = await req('/properties', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        title: `Ledger Luxury PG #${rand}`,
        description: 'PG with sub-metered power billing',
        propertyType: 'PG',
        genderPreference: 'UNISEX',
        address: { city: 'Bengaluru', state: 'Karnataka', pincode: '560034' },
        images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5'],
        expenses: {
          electricity: { type: 'PER_UNIT', rate: 8, description: 'Sub-metered billing at ₹8/unit' },
        },
        noticePeriodDays: 30,
        roomConfigurations: [
          {
            type: 'SINGLE',
            name: 'Single Deluxe AC',
            rent: 10000,
            deposit: 15000,
            totalBeds: 2,
            availableBeds: 2,
          },
        ],
      },
    });

    propertyId = propRes.data.data?.property?._id;
    roomConfigId = propRes.data.data?.property?.roomConfigurations?.[0]?._id;

    // Create booking
    const bookRes = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
      body: { propertyId, roomConfigId, moveInDate: '2026-09-01', durationMonths: 6 },
    });
    bookingId = bookRes.data.data?.booking?._id;

    // Check-in tenant
    const checkInRes = await req(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { status: 'CHECKED_IN' },
    });

    assert(
      checkInRes.status === 200 && checkInRes.data.data?.booking?.status === 'CHECKED_IN',
      'Tenant successfully checked in for active stay'
    );
  } catch (e) {
    assert(false, `Property/Check-in setup failed: ${e.message}`);
  }

  // 3. Landlord issues monthly rent invoice with sub-meter electricity
  try {
    const invoiceRes = await req('/ledger/invoice', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        bookingId,
        billingMonth: 'September 2026',
        dueDate: '2026-09-05',
        previousMeterReading: 100,
        currentMeterReading: 160, // 60 units * ₹8 = ₹480
        waterCharges: 200,
        maintenanceCharges: 300,
      },
    });

    const inv = invoiceRes.data.data?.invoice;
    invoice1Id = inv?._id;

    assert(
      invoiceRes.status === 201 &&
        inv?.status === 'DUE' &&
        inv?.invoiceNumber.startsWith('SE-INV-') &&
        inv?.breakdown?.electricity?.unitsConsumed === 60 &&
        inv?.breakdown?.electricity?.amount === 480 &&
        inv?.totalAmount === 10980, // 10000 rent + 480 power + 200 water + 300 maintenance
      'Landlord generates monthly rent invoice (₹10,980 with sub-metered power calculation)'
    );
  } catch (e) {
    assert(false, `Invoice creation failed: ${e.message}`);
  }

  // 4. Edge Case: Meter reading invalid (current < previous)
  try {
    const invalidMeter = await req('/ledger/invoice', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        bookingId,
        billingMonth: 'October 2026',
        dueDate: '2026-10-05',
        previousMeterReading: 200,
        currentMeterReading: 150, // Invalid!
      },
    });

    assert(
      invalidMeter.status === 400 && invalidMeter.data.message?.includes('cannot be less than previous'),
      'Edge Case: Current meter reading less than previous reading is rejected (400 Bad Request)'
    );
  } catch (e) {
    assert(false, `Invalid meter reading test failed: ${e.message}`);
  }

  // 5. Tenant views digital rent ledger statement (`GET /api/v1/ledger/my-ledger`)
  try {
    const myLedger = await req('/ledger/my-ledger', {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });

    const summary = myLedger.data.data?.summary;
    const invoices = myLedger.data.data?.invoices;

    assert(
      myLedger.status === 200 &&
        invoices?.length === 1 &&
        summary?.totalOutstandingDue === 10980 &&
        summary?.totalPaidAmount === 0,
      'Tenant retrieves digital rent ledger statement with pending due balance'
    );
  } catch (e) {
    assert(false, `Tenant ledger retrieval failed: ${e.message}`);
  }

  // 6. Landlord views collection ledger (`GET /api/v1/ledger/owner-ledger`)
  try {
    const ownerLedger = await req('/ledger/owner-ledger', {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    const summary = ownerLedger.data.data?.summary;

    assert(
      ownerLedger.status === 200 && summary?.pendingDueRent === 10980,
      'Landlord retrieves collection ledger summary with pending dues'
    );
  } catch (e) {
    assert(false, `Owner ledger retrieval failed: ${e.message}`);
  }

  // 7. Tenant pays monthly rent invoice online (`POST /api/v1/ledger/:id/pay`)
  try {
    const payRes = await req(`/ledger/${invoice1Id}/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
      body: { paymentMethod: 'UPI' },
    });

    const inv = payRes.data.data?.invoice;

    assert(
      payRes.status === 200 &&
        inv?.status === 'PAID' &&
        inv?.balanceDue === 0 &&
        inv?.receiptNumber.startsWith('SE-RCT-'),
      'Tenant pays rent invoice online (status becomes PAID & SE-RCT receipt generated)'
    );
  } catch (e) {
    assert(false, `Rent payment failed: ${e.message}`);
  }

  // 8. Edge Case: Duplicate rent payment attempt rejected
  try {
    const doublePay = await req(`/ledger/${invoice1Id}/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
    });

    assert(
      doublePay.status === 400 && doublePay.data.message?.includes('already been paid'),
      'Edge Case: Duplicate rent payment attempt rejected (400 Bad Request)'
    );
  } catch (e) {
    assert(false, `Duplicate payment test failed: ${e.message}`);
  }

  // 9. Fetch Single Invoice & Printable Receipt API (`GET /api/v1/ledger/invoice/:id`)
  try {
    const receiptRes = await req(`/ledger/invoice/${invoice1Id}`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });

    const inv = receiptRes.data.data?.invoice;

    assert(
      receiptRes.status === 200 &&
        inv?.invoiceNumber === invoice1Id || inv?.breakdown?.baseRent === 10000,
      'GET /api/v1/ledger/invoice/:id returns full line-item breakdown & receipt data'
    );
  } catch (e) {
    assert(false, `Single invoice API failed: ${e.message}`);
  }

  // 10. Authorization Guard: Unauthorized user cannot view Tenant 1 invoice
  try {
    const unauthRes = await req(`/ledger/invoice/${invoice1Id}`, {
      headers: { Authorization: `Bearer ${unauthorizedToken}` },
    });

    assert(
      unauthRes.status === 403,
      'Authorization Guard: Unauthorized user cannot view another user rent invoice (403 Forbidden)'
    );
  } catch (e) {
    assert(false, `Unauthorized invoice test failed: ${e.message}`);
  }

  // 11. Move-Out Notice Period Edge Case: Date earlier than required notice period
  try {
    const today = new Date();
    const earlyDate = new Date(today);
    earlyDate.setDate(earlyDate.getDate() + 10); // Only 10 days notice (requires 30!)

    const earlyNotice = await req('/ledger/notice', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
      body: {
        bookingId,
        intendedCheckoutDate: earlyDate.toISOString().split('T')[0],
        reason: 'Too early',
      },
    });

    assert(
      earlyNotice.status === 400 && earlyNotice.data.message?.includes('notice period'),
      'Notice Period Validation: Checkout date earlier than required notice period is rejected (400)'
    );
  } catch (e) {
    assert(false, `Notice period validation test failed: ${e.message}`);
  }

  // 12. Move-Out Notice Valid Submission
  try {
    const today = new Date();
    const validDate = new Date(today);
    validDate.setDate(validDate.getDate() + 35); // 35 days notice (satisfies 30-day policy)

    const noticeRes = await req('/ledger/notice', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
      body: {
        bookingId,
        intendedCheckoutDate: validDate.toISOString().split('T')[0],
        reason: 'Relocating to another branch',
      },
    });

    assert(
      noticeRes.status === 200 && noticeRes.data.success === true,
      'Tenant serves formal move-out notice meeting property notice period criteria'
    );
  } catch (e) {
    assert(false, `Valid move-out notice test failed: ${e.message}`);
  }

  // 13. Landlord marks invoice paid offline
  try {
    const invoice2Res = await req('/ledger/invoice', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        bookingId,
        billingMonth: 'October 2026',
        dueDate: '2026-10-05',
        previousMeterReading: 160,
        currentMeterReading: 200,
      },
    });

    invoice2Id = invoice2Res.data.data?.invoice?._id;

    const markPaidRes = await req(`/ledger/${invoice2Id}/mark-paid`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { paymentMethod: 'CASH', paymentReference: 'HAND_CASH_COLLECTION' },
    });

    assert(
      markPaidRes.status === 200 && markPaidRes.data.data?.invoice?.status === 'PAID',
      'Landlord marks rent invoice as PAID offline (cash collection logged)'
    );
  } catch (e) {
    assert(false, `Offline mark paid test failed: ${e.message}`);
  }

  console.log('\n====================================================');
  console.log(`📊 Phase 6 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6Tests();
