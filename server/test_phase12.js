import assert from 'assert';

const API_BASE = 'http://localhost:5000/api/v1';

// HTTP Request Helper
async function request(url, options = {}, body = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    method: options.method || 'GET',
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(url, config);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, body: data };
}

async function runPhase12Tests() {
  console.log('================================================================');
  console.log('🚀 Starting StayEasy Phase 12: Integrated Financial Payments Gateway Tests');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const timestamp = Date.now();
  const tenantEmail = `tenant.p12.${timestamp}@stayeasy.local`;
  const owner1Email = `owner1.p12.${timestamp}@stayeasy.local`;
  const owner2Email = `owner2.p12.${timestamp}@stayeasy.local`;
  const adminEmail = `admin.p12.${timestamp}@stayeasy.local`;
  const password = 'Password123!';

  try {
    // 1. Register Tenant
    const tenantRes = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P12 Resident Tenant',
      email: tenantEmail,
      password,
      role: 'USER',
      phone: '9876541201',
    });
    assert(tenantRes.status === 201 && tenantRes.body.success, '1. Tenant registration');
    const tenantToken = tenantRes.body.data?.token;
    console.log('✅ PASS: 1. Tenant registration');
    passed++;

    // 2. Register Owner 1
    const owner1Res = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P12 Landlord One',
      email: owner1Email,
      password,
      role: 'OWNER',
      phone: '9876541202',
      businessName: 'P12 Apex Stays',
    });
    assert(owner1Res.status === 201 && owner1Res.body.success, '2. Owner 1 registration');
    const owner1Token = owner1Res.body.data?.token;
    console.log('✅ PASS: 2. Owner 1 registration');
    passed++;

    // 3. Register Owner 2
    const owner2Res = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P12 Landlord Two',
      email: owner2Email,
      password,
      role: 'OWNER',
      phone: '9876541203',
      businessName: 'P12 Crest Living',
    });
    assert(owner2Res.status === 201 && owner2Res.body.success, '3. Owner 2 registration');
    const owner2Token = owner2Res.body.data?.token;
    console.log('✅ PASS: 3. Owner 2 registration');
    passed++;

    // 4. Register Admin
    const adminRes = await request(`${API_BASE}/auth/register`, { method: 'POST' }, {
      name: 'P12 Financial Admin',
      email: adminEmail,
      password,
      role: 'ADMIN',
      phone: '9876541204',
    });
    assert(adminRes.status === 201 && adminRes.body.success, '4. Admin registration');
    const adminToken = adminRes.body.data?.token;
    console.log('✅ PASS: 4. Admin registration');
    passed++;

    // 5. Create Property for Owner 1
    const propRes = await request(`${API_BASE}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${owner1Token}` },
    }, {
      title: 'P12 Financial Tech PG',
      tagline: 'Modern PG near Financial Hub',
      description: 'Fully furnished AC room near Tech Park',
      propertyType: 'PG',
      genderPreference: 'UNISEX',
      address: {
        street: '100 Feet Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
        landmark: 'Near Metro',
      },
      roomConfigurations: [
        {
          type: 'SINGLE',
          name: 'Single Room',
          roomType: 'SINGLE',
          sharingType: 1,
          occupancyCount: 1,
          totalRooms: 5,
          availableRooms: 3,
          totalBeds: 5,
          availableBeds: 3,
          rent: 16000,
          deposit: 32000,
          monthlyRent: 16000,
          depositAmount: 32000,
          amenities: ['AC', 'Wi-Fi'],
        },
      ],
      rules: { foodIncluded: true, gateClosingTime: '22:30' },
      images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5'],
    });
    assert(propRes.status === 201 && propRes.body.success, '5. Create property listing');
    const propertyId = propRes.body.data?.property?._id || propRes.body.data?._id;
    const roomConfigId = propRes.body.data?.property?.roomConfigurations?.[0]?._id || propRes.body.data?.roomConfigurations?.[0]?._id;
    console.log('✅ PASS: 5. Create property listing');
    passed++;

    // 6. Create Booking Request
    const moveInDate = new Date();
    moveInDate.setDate(moveInDate.getDate() + 7);

    const bookingRes = await request(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
    }, {
      propertyId,
      roomConfigId,
      moveInDate: moveInDate.toISOString(),
      durationMonths: 6,
    });
    assert(bookingRes.status === 201 && bookingRes.body.success, '6. Create booking request');
    const bookingId = bookingRes.body.data?.booking?._id;
    console.log('✅ PASS: 6. Create booking request');
    passed++;

    // 7. Create Payment Order for Escrow Deposit
    const depositOrderRes = await request(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
    }, {
      amount: 48000,
      purpose: 'DEPOSIT',
      referenceId: bookingId,
      referenceType: 'BOOKING',
      idempotencyKey: `PAY-DEP-${bookingId}`,
    });
    if (depositOrderRes.status !== 201) {
      console.log('DEBUG depositOrderRes status/body:', depositOrderRes.status, depositOrderRes.body);
    }
    assert(depositOrderRes.status === 201 && depositOrderRes.body.data?.orderId, '7. Create payment order for Escrow Deposit');
    const depositOrderId = depositOrderRes.body.data.orderId;
    console.log('✅ PASS: 7. Create payment order for Escrow Deposit');
    passed++;

    // 8. Verify Payment Signature for Escrow Deposit
    const verifyDepositRes = await request(`${API_BASE}/payments/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
    }, {
      orderId: depositOrderId,
      paymentId: 'pay_P12_DEP_001',
      signature: 'sig_P12_DEP_OK',
      paymentMethod: 'UPI',
      idempotencyKey: `PAY-DEP-${bookingId}`,
    });
    assert(verifyDepositRes.status === 200 && verifyDepositRes.body.success, '8. Verify payment signature for Escrow Deposit');
    const escrowReceiptNumber = verifyDepositRes.body.data?.receiptNumber;
    console.log('✅ PASS: 8. Verify payment signature for Escrow Deposit');
    passed++;

    // 9. Idempotency Check: Re-submitting payment for already paid order returns 400 Bad Request
    const duplicateOrderRes = await request(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
    }, {
      amount: 48000,
      purpose: 'DEPOSIT',
      referenceId: bookingId,
      referenceType: 'BOOKING',
      idempotencyKey: `PAY-DEP-${bookingId}`,
    });
    assert(duplicateOrderRes.status === 400 && duplicateOrderRes.body.success === false, '9. Idempotency check: Duplicate payment blocked');
    console.log('✅ PASS: 9. Idempotency check: Duplicate payment blocked');
    passed++;

    // 10. Check Booking state updated to ESCROW_HELD
    const bookingCheckRes = await request(`${API_BASE}/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    assert(bookingCheckRes.status === 200 && bookingCheckRes.body.data?.booking?.escrowStatus === 'HELD_IN_ESCROW', '10. Booking escrowStatus updated to HELD_IN_ESCROW');
    console.log('✅ PASS: 10. Booking escrowStatus updated to HELD_IN_ESCROW');
    passed++;

    // 11. Generate Rent Invoice
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);

    const invoiceRes = await request(`${API_BASE}/ledger/invoice`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${owner1Token}` },
    }, {
      bookingId,
      billingMonth: 'September 2026',
      dueDate: dueDate.toISOString(),
      baseRent: 16000,
      waterCharges: 500,
      maintenanceCharges: 1000,
    });
    assert(invoiceRes.status === 201 && invoiceRes.body.success, '11. Generate rent invoice');
    const invoiceId = invoiceRes.body.data?.invoice?._id;
    console.log('✅ PASS: 11. Generate rent invoice');
    passed++;

    // 12. Create Payment Order for Rent Invoice
    const rentOrderRes = await request(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
    }, {
      amount: 17500,
      purpose: 'RENT',
      referenceId: invoiceId,
      referenceType: 'RENT_LEDGER',
      idempotencyKey: `PAY-INV-${invoiceId}`,
    });
    assert(rentOrderRes.status === 201 && rentOrderRes.body.data?.orderId, '12. Create payment order for Rent Invoice');
    const rentOrderId = rentOrderRes.body.data.orderId;
    console.log('✅ PASS: 12. Create payment order for Rent Invoice');
    passed++;

    // 13. Verify Payment Signature for Rent Invoice
    const verifyRentRes = await request(`${API_BASE}/payments/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
    }, {
      orderId: rentOrderId,
      paymentId: 'pay_P12_RENT_001',
      signature: 'sig_P12_RENT_OK',
      paymentMethod: 'UPI',
      idempotencyKey: `PAY-INV-${invoiceId}`,
    });
    assert(verifyRentRes.status === 200 && verifyRentRes.body.success, '13. Verify payment signature for Rent Invoice');
    const rentReceiptNumber = verifyRentRes.body.data?.receiptNumber;
    console.log('✅ PASS: 13. Verify payment signature for Rent Invoice');
    passed++;

    // 14. Verify RentLedger status updated to PAID
    const invoiceCheckRes = await request(`${API_BASE}/ledger/invoice/${invoiceId}`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    assert(invoiceCheckRes.status === 200 && invoiceCheckRes.body.data?.invoice?.status === 'PAID', '14. RentLedger invoice status updated to PAID');
    console.log('✅ PASS: 14. RentLedger invoice status updated to PAID');
    passed++;

    // 15. Failed Payment Handling Simulation
    const failOrderRes = await request(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
    }, {
      amount: 5000,
      purpose: 'OTHER',
      idempotencyKey: `PAY-FAIL-${timestamp}`,
    });
    assert(failOrderRes.status === 201, '15. Create payment order for failure simulation');
    console.log('✅ PASS: 15. Failed payment order initialized');
    passed++;

    // 16. Webhook Listener Validation
    const webhookRes = await request(`${API_BASE}/payments/webhook`, {
      method: 'POST',
      headers: { 'x-razorpay-signature': 'sig_webhook_valid' },
    }, {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_webhook_test',
            order_id: rentOrderId,
          },
        },
      },
    });
    assert(webhookRes.status === 200 && webhookRes.body.success, '16. Gateway webhook listener processed event');
    console.log('✅ PASS: 16. Gateway webhook listener processed event');
    passed++;

    // 17. Process Refund
    const refundRes = await request(`${API_BASE}/payments/refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${owner1Token}` },
    }, {
      bookingId,
      refundAmount: 5000,
      reason: 'Partial deposit refund upon checkout inspection',
    });
    assert(refundRes.status === 200 && refundRes.body.success, '17. Process refund for deposit');
    const refundReceiptNumber = refundRes.body.data?.receiptNumber;
    console.log('✅ PASS: 17. Process refund for deposit');
    passed++;

    // 18. Download / View Digital Receipt API
    const receiptApiRes = await request(`${API_BASE}/payments/receipt/${rentReceiptNumber}`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    assert(receiptApiRes.status === 200 && receiptApiRes.body.data?.receipt, '18. Download / view digital receipt API');
    console.log('✅ PASS: 18. Download / view digital receipt API');
    passed++;

    // 19. Tenant Financial Summary API
    const tenantFinanceRes = await request(`${API_BASE}/payments/finance/tenant`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    assert(tenantFinanceRes.status === 200 && typeof tenantFinanceRes.body.data?.summary?.totalRentPaid === 'number', '19. Tenant financial summary API');
    console.log('✅ PASS: 19. Tenant financial summary API');
    passed++;

    // 20. Owner Financial Summary & Earnings API
    const ownerFinanceRes = await request(`${API_BASE}/payments/finance/owner`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(ownerFinanceRes.status === 200 && typeof ownerFinanceRes.body.data?.summary?.grossEarnings === 'number', '20. Owner financial summary API');
    console.log('✅ PASS: 20. Owner financial summary API');
    passed++;

    // 21. Landlord Payout Request
    const payoutRes = await request(`${API_BASE}/payments/owner/payout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${owner1Token}` },
    }, {
      amount: 10000,
      bankAccount: 'HDFC-XXXX-9999',
    });
    assert(payoutRes.status === 200 && payoutRes.body.success, '21. Landlord payout request');
    console.log('✅ PASS: 21. Landlord payout request');
    passed++;

    // 22. Admin Platform Financial Overview API
    const adminFinanceRes = await request(`${API_BASE}/payments/finance/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminFinanceRes.status === 200 && typeof adminFinanceRes.body.data?.summary?.platformGMV === 'number', '22. Admin platform financial overview API');
    console.log('✅ PASS: 22. Admin platform financial overview API');
    passed++;

    // 23. RBAC Security Guards: Tenant cannot access Admin Finance
    const rbacGuardRes = await request(`${API_BASE}/payments/finance/admin`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    assert(rbacGuardRes.status === 403, '23. RBAC Guard: Tenant cannot access Admin Finance (403)');
    console.log('✅ PASS: 23. RBAC Guard: Tenant cannot access Admin Finance (403)');
    passed++;

    // 24. Health Endpoint Reports Phase 12
    const healthRes = await request(`${API_BASE}/health`);
    assert(
      healthRes.status === 200 &&
      healthRes.body.data?.phase?.includes('Phase 12'),
      '24. Health endpoint reports Phase 12'
    );
    console.log('✅ PASS: 24. Health endpoint reports Phase 12');
    passed++;

  } catch (err) {
    console.error('💥 Test execution error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`📊 Phase 12 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase12Tests();
