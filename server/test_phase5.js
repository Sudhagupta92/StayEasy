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

async function runPhase5Tests() {
  console.log('====================================================');
  console.log('🚀 Starting StayEasy Phase 5: Room/Bed Booking & Escrow Tests');
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
  let tenant1Token = '';
  let tenant2Token = '';
  let unauthorizedToken = '';
  let propertyId = '';
  let roomConfigId = '';
  let booking1Id = '';
  let booking2Id = '';

  // 1. Setup Auth Users
  try {
    const regOwner = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Escrow Landlord #${rand}`,
        email: `escrow_owner_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'OWNER',
        businessName: 'Escrow Protected Living',
      },
    });
    ownerToken = regOwner.data.data?.token;

    const regTenant1 = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Tenant One #${rand}`,
        email: `tenant1_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'USER',
      },
    });
    tenant1Token = regTenant1.data.data?.token;

    const regTenant2 = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Tenant Two #${rand}`,
        email: `tenant2_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'USER',
      },
    });
    tenant2Token = regTenant2.data.data?.token;

    const regOther = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Unauthorized User #${rand}`,
        email: `other_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'USER',
      },
    });
    unauthorizedToken = regOther.data.data?.token;

    assert(
      !!ownerToken && !!tenant1Token && !!tenant2Token && !!unauthorizedToken,
      'Test users (Owner, Tenant 1, Tenant 2, Unauthorized User) registered successfully'
    );
  } catch (e) {
    assert(false, `Account setup failed: ${e.message}`);
  }

  // 2. Owner creates a property with 1 single room (availableBeds: 1)
  try {
    const propRes = await req('/properties', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        title: `Escrow Test Residency #${rand}`,
        description: 'Test property for escrow & seat reservation',
        propertyType: 'PG',
        genderPreference: 'UNISEX',
        address: { city: 'Bengaluru', state: 'Karnataka', pincode: '560034' },
        images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5'],
        roomConfigurations: [
          {
            type: 'SINGLE',
            name: 'Single AC Room',
            rent: 10000,
            deposit: 15000,
            totalBeds: 1,
            availableBeds: 1,
            attachedWashroom: true,
            hasAC: true,
          },
        ],
      },
    });

    propertyId = propRes.data.data?.property?._id;
    roomConfigId = propRes.data.data?.property?.roomConfigurations?.[0]?._id;
    assert(
      propRes.status === 201 && !!propertyId && !!roomConfigId,
      'Owner creates property listing with 1 available bed'
    );
  } catch (e) {
    assert(false, `Property creation failed: ${e.message}`);
  }

  // 3. Tenant 1 reserves the 1 available bed -> Decrements availableBeds to 0
  try {
    const bookRes = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        propertyId,
        roomConfigId,
        moveInDate: '2026-09-01',
        durationMonths: 6,
      },
    });

    booking1Id = bookRes.data.data?.booking?._id;
    assert(
      bookRes.status === 201 &&
        bookRes.data.data?.booking?.status === 'REQUESTED' &&
        bookRes.data.data?.booking?.costs?.securityDeposit === 15000 &&
        bookRes.data.data?.booking?.costs?.totalUpfrontAmount === 25000,
      'Tenant 1 creates booking request (securityDeposit: ₹15,000, upfront: ₹25,000)'
    );
  } catch (e) {
    assert(false, `Booking request failed: ${e.message}`);
  }

  // 4. Edge Case: Tenant 2 attempts to book when availableBeds is 0
  try {
    const overBookRes = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant2Token}` },
      body: {
        propertyId,
        roomConfigId,
        moveInDate: '2026-09-01',
        durationMonths: 3,
      },
    });
    assert(
      overBookRes.status === 400 && overBookRes.data.success === false,
      'Edge Case: Overbooking rejected when availableBeds = 0 (400 Bad Request)'
    );
  } catch (e) {
    assert(false, `Overbooking test failed: ${e.message}`);
  }

  // 5. Edge Case: Settlement before check-in is forbidden
  try {
    const prematureSettle = await req(`/bookings/${booking1Id}/escrow/settle`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { damageDeductionAmount: 500 },
    });
    if (prematureSettle.status !== 400) {
      console.log('Test 5 details:', prematureSettle.status, prematureSettle.data);
    }
    assert(
      prematureSettle.status === 400,
      'Edge Case: Settlement before check-in is forbidden (400 Bad Request)'
    );
  } catch (e) {
    assert(false, `Premature settlement test failed: ${e.message}`);
  }

  // 6. Tenant 1 pays upfront rent + deposit into Escrow Protection
  try {
    const payRes = await req(`/bookings/${booking1Id}/escrow/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });

    if (payRes.status !== 200) {
      console.log('Test 6 details:', payRes.status, payRes.data);
    }
    const bk = payRes.data.data?.booking;
    const receipt = payRes.data.data?.escrowReceipt;
    assert(
      payRes.status === 200 &&
        bk?.escrowStatus === 'HELD_IN_ESCROW' &&
        bk?.paymentStatus === 'ESCROW_HELD' &&
        !!receipt?.receiptId &&
        receipt.receiptId.startsWith('ESCROW-REC-'),
      'Tenant 1 deposits funds into Escrow (escrowStatus: HELD_IN_ESCROW, receipt generated)'
    );
  } catch (e) {
    assert(false, `Escrow payment failed: ${e.message}`);
  }

  // 7. Edge Case: Double payment attempt fails
  try {
    const doublePay = await req(`/bookings/${booking1Id}/escrow/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(
      doublePay.status === 400,
      'Edge Case: Duplicate escrow payment attempt rejected (400 Bad Request)'
    );
  } catch (e) {
    assert(false, `Double payment test failed: ${e.message}`);
  }

  // 8. Fetch formal Escrow Receipt
  try {
    const receiptRes = await req(`/bookings/${booking1Id}/escrow/receipt`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    const receipt = receiptRes.data.data?.receipt;
    assert(
      receiptRes.status === 200 &&
        receipt?.escrowFinancials?.securityDeposit === 15000 &&
        receipt?.escrowGuarantee?.includes('StayEasy Escrow Deposit Protection'),
      'GET /api/v1/bookings/:id/escrow/receipt returns formal deposit protection details'
    );
  } catch (e) {
    assert(false, `Escrow receipt API failed: ${e.message}`);
  }

  // 9. Unauthorized user cannot access Tenant 1 escrow receipt
  try {
    const unauthReceipt = await req(`/bookings/${booking1Id}/escrow/receipt`, {
      headers: { Authorization: `Bearer ${unauthorizedToken}` },
    });
    assert(
      unauthReceipt.status === 403,
      'Authorization Guard: Unauthorized user cannot view another user escrow receipt (403)'
    );
  } catch (e) {
    assert(false, `Unauthorized receipt test failed: ${e.message}`);
  }

  // 10. Owner accepts booking & completes Tenant 1 Check-in
  try {
    const checkInRes = await req(`/bookings/${booking1Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { status: 'CHECKED_IN' },
    });

    const bk = checkInRes.data.data?.booking;
    assert(
      checkInRes.status === 200 &&
        bk?.status === 'CHECKED_IN' &&
        bk?.isVerifiedResident === true &&
        !!bk?.checkInDate,
      'Owner confirms Check-in: status becomes CHECKED_IN and isVerifiedResident = true'
    );
  } catch (e) {
    assert(false, `Check-in failed: ${e.message}`);
  }

  // 11. Edge Case: Excessive damage deduction (> deposit amount) rejected
  try {
    const overDeduction = await req(`/bookings/${booking1Id}/escrow/settle`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { damageDeductionAmount: 20000 },
    });
    assert(
      overDeduction.status === 400 &&
        overDeduction.data.message?.includes('cannot exceed total security deposit'),
      'Edge Case: Damage deduction exceeding security deposit is rejected (400 Bad Request)'
    );
  } catch (e) {
    assert(false, `Over-deduction test failed: ${e.message}`);
  }

  // 12. Landlord completes Checkout & Escrow Settlement with ₹1,000 deduction
  try {
    const settleRes = await req(`/bookings/${booking1Id}/escrow/settle`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        damageDeductionAmount: 1000,
        deductionReason: 'Minor wall paint scuff repair',
      },
    });

    const bk = settleRes.data.data?.booking;
    assert(
      settleRes.status === 200 &&
        bk?.status === 'CHECKED_OUT' &&
        bk?.escrowStatus === 'PARTIALLY_REFUNDED' &&
        bk?.escrowSettlement?.tenantRefundAmount === 14000 &&
        bk?.escrowSettlement?.ownerPayoutAmount === 1000,
      'Landlord settles Checkout Escrow: Tenant Refund ₹14,000, Damage Payout ₹1,000'
    );
  } catch (e) {
    assert(false, `Escrow settlement failed: ${e.message}`);
  }

  // 13. Verify bed inventory was restored (+1) after CHECKED_OUT
  try {
    const propRes = await req(`/properties/${propertyId}`);
    const availableBeds = propRes.data.data?.property?.roomConfigurations?.[0]?.availableBeds;
    assert(
      propRes.status === 200 && availableBeds === 1,
      'Bed inventory automatically restored (+1) after checkout completion'
    );
  } catch (e) {
    assert(false, `Inventory restoration check failed: ${e.message}`);
  }

  // 14. Edge Case: Double settlement attempt rejected
  try {
    const doubleSettle = await req(`/bookings/${booking1Id}/escrow/settle`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { damageDeductionAmount: 0 },
    });
    assert(
      doubleSettle.status === 400,
      'Edge Case: Duplicate escrow settlement attempt rejected (400 Bad Request)'
    );
  } catch (e) {
    assert(false, `Double settlement test failed: ${e.message}`);
  }

  // 15. Cancellation & Inventory Restoration Verification
  try {
    // Tenant 2 books the now restored bed
    const book2Res = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant2Token}` },
      body: {
        propertyId,
        roomConfigId,
        moveInDate: '2026-10-01',
        durationMonths: 3,
      },
    });

    booking2Id = book2Res.data.data?.booking?._id;

    // Tenant 2 cancels the booking
    const cancelRes = await req(`/bookings/${booking2Id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant2Token}` },
      body: { reason: 'Schedule change' },
    });

    const checkPropRes = await req(`/properties/${propertyId}`);
    const finalBeds = checkPropRes.data.data?.property?.roomConfigurations?.[0]?.availableBeds;

    assert(
      cancelRes.status === 200 &&
        cancelRes.data.data?.booking?.status === 'CANCELLED' &&
        finalBeds === 1,
      'Tenant cancels booking: status becomes CANCELLED & bed inventory restored'
    );
  } catch (e) {
    assert(false, `Cancellation test failed: ${e.message}`);
  }

  console.log('\n====================================================');
  console.log(`📊 Phase 5 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5Tests();
