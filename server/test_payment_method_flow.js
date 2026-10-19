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

async function runPaymentMethodTests() {
  console.log('================================================================================');
  console.log('💳 StayEasy Automated Suite: Student Payment Method Selection & Escrow Lifecycle');
  console.log('================================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  const rand = Math.floor(Math.random() * 90000) + 10000;
  let ownerToken = '';
  let tenant1Token = '';
  let tenant2Token = '';
  let propertyId = '';
  let roomConfigId = '';

  try {
    // 1. Setup Auth Users
    console.log('--- Step 1: User & Property Setup ---');
    const regOwner = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Payment Host #${rand}`,
        email: `payment_owner_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'OWNER',
        businessName: 'StayEasy Premium PG',
      },
    });
    assert(regOwner.status === 201 && regOwner.data?.data?.token, 'Owner Registered Successfully');
    ownerToken = regOwner.data?.data?.token;

    const regTenant1 = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Student Rahul #${rand}`,
        email: `rahul_student_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'USER',
      },
    });
    assert(regTenant1.status === 201 && regTenant1.data?.data?.token, 'Tenant 1 (Student) Registered');
    tenant1Token = regTenant1.data?.data?.token;

    const regTenant2 = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Student Priya #${rand}`,
        email: `priya_student_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'USER',
      },
    });
    assert(regTenant2.status === 201 && regTenant2.data?.data?.token, 'Tenant 2 Registered');
    tenant2Token = regTenant2.data?.data?.token;

    // Create Property with allowPayAtProperty: false by default
    const createProp = await req('/properties', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        title: `StayEasy Elite PG #${rand}`,
        description: 'Cozy verified student accommodation near University campus',
        propertyType: 'PG',
        genderPreference: 'UNISEX',
        foodIncluded: true,
        foodType: 'VEG',
        amenities: ['WiFi', 'Power Backup', 'Study Desk', 'RO Water'],
        houseRules: ['Quiet hours after 10 PM'],
        allowPayAtProperty: false, // Disallowed initially
        address: {
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560034',
        },
        images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5'],
        roomConfigurations: [
          {
            name: 'Double Deluxe 201',
            type: 'DOUBLE',
            rent: 7500,
            deposit: 7500,
            totalBeds: 10,
            availableBeds: 10,
            hasAC: true,
            attachedWashroom: true,
          },
        ],
      },
    });
    assert(
      createProp.status === 201 && createProp.data?.data?.property?._id,
      'Property with Double Deluxe Room Created',
      JSON.stringify(createProp.data)
    );
    propertyId = createProp.data?.data?.property?._id;
    roomConfigId = createProp.data?.data?.property?.roomConfigurations?.[0]?._id;

    // 2. Test Booking Creation with Default / Initial Payment Method
    console.log('\n--- Step 2: Booking Creation with Payment Method Tag ---');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const b1Res = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        propertyId,
        roomConfigId,
        moveInDate: futureDate.toISOString().split('T')[0],
        durationMonths: 6,
        paymentMethod: 'UPI',
        notes: 'Vegetarian meals preferred',
      },
    });
    assert(b1Res.status === 201, 'Booking 1 Created Successfully', JSON.stringify(b1Res.data));
    const booking1 = b1Res.data?.data?.booking;
    assert(booking1?.paymentMethod === 'UPI', 'Booking correctly recorded selected payment method (UPI)');
    assert(booking1?.escrowStatus === 'PENDING_PAYMENT', 'Booking escrowStatus initialized to PENDING_PAYMENT');
    assert(['REQUESTED', 'PENDING_PAYMENT'].includes(booking1?.status), 'Booking status initialized to REQUESTED / PENDING_PAYMENT');
    const booking1Id = booking1?._id;

    // 3. Test UPI Payment & Escrow Status Update
    console.log('\n--- Step 3: UPI Payment Execution & Escrow Protection ---');
    const upiIdempotencyKey = `idemp-upi-${rand}-1`;
    const payUpiRes = await req(`/bookings/${booking1Id}/escrow/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        paymentMethod: 'UPI',
        idempotencyKey: upiIdempotencyKey,
      },
    });

    assert(payUpiRes.status === 200, 'UPI Escrow Deposit Payment Succeeded', JSON.stringify(payUpiRes.data));
    const upiBooking = payUpiRes.data?.data?.booking;
    assert(upiBooking?.escrowStatus === 'HELD_IN_ESCROW', 'Escrow status updated to HELD_IN_ESCROW');
    assert(upiBooking?.paymentStatus === 'ESCROW_HELD', 'Payment status updated to ESCROW_HELD');
    assert(upiBooking?.paymentMethod === 'UPI', 'Payment method persisted as UPI');
    assert(
      typeof payUpiRes.data?.data?.receiptId === 'string' && payUpiRes.data?.data?.receiptId.startsWith('ESCROW-REC-'),
      'Valid Escrow Receipt generated (ESCROW-REC-*)'
    );
    assert(!!payUpiRes.data?.data?.transactionId, 'Valid Transaction ID created and linked');

    // 4. Test Idempotency & Duplicate Prevention
    console.log('\n--- Step 4: Duplicate Payment Prevention (Idempotency) ---');
    const dupUpiRes = await req(`/bookings/${booking1Id}/escrow/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        paymentMethod: 'UPI',
        idempotencyKey: upiIdempotencyKey, // Replaying exact same idempotency key
      },
    });
    assert(dupUpiRes.status === 200, 'Duplicate request safely handled', JSON.stringify(dupUpiRes.data));
    assert(dupUpiRes.data?.data?.idempotentReplay === true, 'Response indicates idempotentReplay: true');
    assert(
      dupUpiRes.data?.data?.transactionId === payUpiRes.data?.data?.transactionId,
      'No duplicate transaction created; identical transaction ID returned'
    );

    // 5. Test Card Payment Method with Booking 2
    console.log('\n--- Step 5: Card Payment Method Selection & Escrow ---');
    const b2Res = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        propertyId,
        roomConfigId,
        moveInDate: futureDate.toISOString().split('T')[0],
        durationMonths: 3,
        paymentMethod: 'CARD',
      },
    });
    assert(b2Res.status === 201, 'Booking 2 Created with CARD method', JSON.stringify(b2Res.data));
    const booking2Id = b2Res.data?.data?.booking?._id;

    const payCardRes = await req(`/bookings/${booking2Id}/escrow/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        paymentMethod: 'CARD',
        idempotencyKey: `idemp-card-${rand}-2`,
      },
    });
    assert(payCardRes.status === 200, 'Card Escrow Deposit Payment Succeeded');
    assert(payCardRes.data?.data?.booking?.paymentMethod === 'CARD', 'Booking paymentMethod is CARD');
    assert(payCardRes.data?.data?.booking?.escrowStatus === 'HELD_IN_ESCROW', 'Card payment held in escrow');

    // 6. Test Net Banking Payment Method with Booking 3
    console.log('\n--- Step 6: Net Banking Payment Method Selection & Escrow ---');
    const b3Res = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        propertyId,
        roomConfigId,
        moveInDate: futureDate.toISOString().split('T')[0],
        durationMonths: 1,
        paymentMethod: 'NET_BANKING',
      },
    });
    assert(b3Res.status === 201, 'Booking 3 Created with NET_BANKING');
    const booking3Id = b3Res.data?.data?.booking?._id;

    const payNbRes = await req(`/bookings/${booking3Id}/escrow/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        paymentMethod: 'NET_BANKING',
        idempotencyKey: `idemp-nb-${rand}-3`,
      },
    });
    assert(payNbRes.status === 200, 'Net Banking Escrow Deposit Payment Succeeded');
    assert(payNbRes.data?.data?.booking?.paymentMethod === 'NET_BANKING', 'Booking paymentMethod is NET_BANKING');

    // 7. Test "Pay at Property" Rule Enforcement: Disallowed Initially
    console.log('\n--- Step 7: Pay at Property (OFFLINE_CASH) Rule Check ---');
    const b4Res = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        propertyId,
        roomConfigId,
        moveInDate: futureDate.toISOString().split('T')[0],
        durationMonths: 6,
        paymentMethod: 'OFFLINE_CASH',
      },
    });
    const booking4Id = b4Res.data?.data?.booking?._id;

    // Attempt to pay with OFFLINE_CASH when property has allowPayAtProperty: false
    const payOfflineBlocked = await req(`/bookings/${booking4Id}/escrow/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        paymentMethod: 'OFFLINE_CASH',
        idempotencyKey: `idemp-cash-blocked-${rand}`,
      },
    });
    assert(
      payOfflineBlocked.status === 400 &&
        (payOfflineBlocked.data?.message?.includes('not allowed') ||
          payOfflineBlocked.data?.message?.includes('not enabled')),
      'Pay at Property correctly REJECTED when property owner has not enabled it'
    );

    // 8. Test "Pay at Property" when Allowed by Owner
    console.log('\n--- Step 8: Pay at Property (OFFLINE_CASH) Allowed by Host Rule ---');
    // Enable allowPayAtProperty on the property
    const updatePropRes = await req(`/properties/${propertyId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        allowPayAtProperty: true,
      },
    });
    assert(updatePropRes.status === 200, 'Owner updated property to enable Pay at Property');

    const payOfflineAllowed = await req(`/bookings/${booking4Id}/escrow/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        paymentMethod: 'OFFLINE_CASH',
        idempotencyKey: `idemp-cash-allowed-${rand}`,
      },
    });
    assert(payOfflineAllowed.status === 200, 'Pay at Property ACCEPTED when enabled');
    assert(payOfflineAllowed.data?.data?.booking?.paymentMethod === 'OFFLINE_CASH', 'Payment method is OFFLINE_CASH');
    assert(payOfflineAllowed.data?.data?.booking?.escrowStatus === 'PENDING_PAYMENT', 'Escrow status remains pending until cash collection at check-in');

    // 9. Test Simulated Payment Failure
    console.log('\n--- Step 9: Payment Failure Simulation & State Preservation ---');
    const b5Res = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        propertyId,
        roomConfigId,
        moveInDate: futureDate.toISOString().split('T')[0],
        durationMonths: 2,
        paymentMethod: 'CARD',
      },
    });
    const booking5Id = b5Res.data?.data?.booking?._id;

    const failRes = await req(`/bookings/${booking5Id}/escrow/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        paymentMethod: 'CARD',
        idempotencyKey: `idemp-fail-${rand}`,
        simulateFailure: true,
      },
    });
    assert(failRes.status === 402, 'Failed payment returns 402 Payment Required');
    assert(
      failRes.data?.errors?.bookingId === booking5Id || failRes.data?.data?.bookingId === booking5Id,
      'Failure response includes bookingId'
    );

    // Verify booking state in DB: must still be in PENDING state and not moved to HELD_IN_ESCROW
    const b5Check = await req(`/bookings/${booking5Id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(
      b5Check.data?.data?.booking?.escrowStatus === 'PENDING_PAYMENT',
      'Booking escrowStatus remains PENDING_PAYMENT on failure'
    );
    assert(
      ['PENDING', 'PENDING_PAYMENT'].includes(b5Check.data?.data?.booking?.paymentStatus),
      'Booking paymentStatus remains PENDING on failure'
    );

    // 10. Test Payment Retry on the SAME Booking (No Duplicates)
    console.log('\n--- Step 10: Retry Payment on SAME Booking ---');
    const retryRes = await req(`/bookings/${booking5Id}/escrow/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        paymentMethod: 'UPI', // Changed method on retry
        idempotencyKey: `idemp-retry-${rand}`,
        simulateFailure: false,
      },
    });
    assert(retryRes.status === 200, 'Retry payment succeeded on the SAME booking');
    assert(retryRes.data?.data?.booking?._id === booking5Id, 'Booking ID is identical; no duplicate booking created');
    assert(retryRes.data?.data?.booking?.paymentMethod === 'UPI', 'Method successfully switched to UPI on retry');
    assert(retryRes.data?.data?.booking?.escrowStatus === 'HELD_IN_ESCROW', 'Escrow status now updated to HELD_IN_ESCROW');

    // 11. Security & RBAC: Unauthorized Tenant cannot pay for another tenant's booking
    console.log('\n--- Step 11: RBAC & Security Boundary ---');
    const unauthRes = await req(`/bookings/${booking5Id}/escrow/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant2Token}` }, // Tenant 2 attempting to pay Tenant 1's booking
      body: {
        paymentMethod: 'UPI',
      },
    });
    assert(unauthRes.status === 403, 'Unauthorized tenant payment blocked with 403 Forbidden');

  } catch (error) {
    console.error('Fatal test error:', error);
    failed++;
  }

  console.log('\n================================================================================');
  console.log(`🎯 Focused Payment Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPaymentMethodTests();
