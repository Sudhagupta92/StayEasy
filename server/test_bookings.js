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

async function runBookingTests() {
  console.log('====================================================');
  console.log('🚀 Starting StayEasy Phase 4 Booking & Lifecycle Tests');
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
  let otherTenantToken = '';
  let propertyId = '';
  let singleRoomConfigId = '';
  let zeroBedRoomConfigId = '';
  let bookingId = '';
  let secondBookingId = '';

  // 1. Setup Auth Accounts & Test Property
  try {
    const regOwner = await req('/auth/register', {
      method: 'POST',
      body: {
        name: 'Landlord BookingTest',
        email: `owner_bk_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'OWNER',
        businessName: 'Phase 4 Test Residency',
      },
    });
    ownerToken = regOwner.data.data?.token;

    const regTenant = await req('/auth/register', {
      method: 'POST',
      body: {
        name: 'Tenant Arjun',
        email: `tenant_bk_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'USER',
      },
    });
    tenantToken = regTenant.data.data?.token;

    const regOtherTenant = await req('/auth/register', {
      method: 'POST',
      body: {
        name: 'Other Tenant Priya',
        email: `other_bk_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'USER',
      },
    });
    otherTenantToken = regOtherTenant.data.data?.token;

    // Create a property with 1 available bed in single room and 0 beds in double room
    const propRes = await req('/properties', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        title: `Test PG For Bookings #${rand}`,
        tagline: 'Seat Allocation Test Listing',
        description: 'Test property for atomic inventory allocation and stay lifecycle.',
        propertyType: 'PG',
        genderPreference: 'UNISEX',
        address: {
          street: 'Koramangala 5th Block',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560034',
        },
        images: [
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
        ],
        roomConfigurations: [
          {
            type: 'SINGLE',
            name: 'Single Deluxe AC Room',
            rent: 15000,
            deposit: 20000,
            totalBeds: 1,
            availableBeds: 1, // Only 1 bed available
            attachedWashroom: true,
            hasAC: true,
          },
          {
            type: 'DOUBLE',
            name: '2-Seater Full Room',
            rent: 10000,
            deposit: 15000,
            totalBeds: 2,
            availableBeds: 0, // 0 beds available to test out-of-stock check
            attachedWashroom: true,
            hasAC: false,
          },
        ],
        expenses: {
          electricity: { type: 'PER_UNIT', rate: 8, description: '₹8/unit' },
          water: { type: 'INCLUDED', amount: 0 },
          maintenance: { type: 'INCLUDED', amount: 0 },
          food: { available: true, includedInRent: true, foodType: 'BOTH' },
        },
      },
    });

    propertyId = propRes.data.data?.property?._id;
    const configs = propRes.data.data?.property?.roomConfigurations || [];
    singleRoomConfigId = configs.find((c) => c.type === 'SINGLE')?._id;
    zeroBedRoomConfigId = configs.find((c) => c.type === 'DOUBLE')?._id;

    assert(
      !!ownerToken && !!tenantToken && !!propertyId && !!singleRoomConfigId,
      'Test accounts & property created with atomic room configurations'
    );
  } catch (e) {
    assert(false, `Setup failed: ${e.message}`);
  }

  // 2. Unauthenticated Booking Attempt (Must fail 401)
  try {
    const unauthRes = await req('/bookings', {
      method: 'POST',
      body: {
        propertyId,
        roomConfigId: singleRoomConfigId,
        moveInDate: '2026-09-01',
      },
    });
    assert(
      unauthRes.status === 401,
      'Unauthorized guest booking is blocked with 401 Unauthorized'
    );
  } catch (e) {
    assert(false, `Unauthenticated test failed: ${e.message}`);
  }

  // 3. Attempt Booking on Fully Occupied (0 available beds) Room Config
  try {
    const fullRes = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
      body: {
        propertyId,
        roomConfigId: zeroBedRoomConfigId,
        moveInDate: '2026-09-01',
      },
    });
    assert(
      fullRes.status === 400 && fullRes.data?.message?.includes('No available beds'),
      'Prevent booking unavailable seats (0 beds left returns 400 Bad Request)'
    );
  } catch (e) {
    assert(false, `Full room test failed: ${e.message}`);
  }

  // 4. Successful Booking & Atomic Seat Inventory Decrement
  try {
    const bookRes = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenantToken}` },
      body: {
        propertyId,
        roomConfigId: singleRoomConfigId,
        moveInDate: '2026-09-01',
        durationMonths: 6,
        notes: 'Vegetarian student moving for internship',
      },
    });

    bookingId = bookRes.data.data?.booking?._id;
    const bk = bookRes.data.data?.booking;

    // Verify property availableBeds decremented to 0
    const propCheck = await req(`/properties/${propertyId}`);
    const updatedSingle = propCheck.data.data?.property?.roomConfigurations?.find(
      (c) => c._id === singleRoomConfigId
    );

    assert(
      bookRes.status === 201 &&
        bk?.status === 'REQUESTED' &&
        bk?.costs?.monthlyRent === 15000 &&
        bk?.costs?.securityDeposit === 20000 &&
        bk?.costs?.totalUpfrontAmount === 35000 &&
        updatedSingle?.availableBeds === 0,
      'POST /api/v1/bookings creates reservation & atomically decrements available beds (1 -> 0)'
    );
  } catch (e) {
    assert(false, `Booking create failed: ${e.message}`);
  }

  // 5. Double-Booking Prevention on Now-Exhausted Seat
  try {
    const doubleBookRes = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherTenantToken}` },
      body: {
        propertyId,
        roomConfigId: singleRoomConfigId,
        moveInDate: '2026-09-01',
      },
    });
    assert(
      doubleBookRes.status === 400,
      'Double-Booking Prevention: Race condition blocked when seat becomes occupied'
    );
  } catch (e) {
    assert(false, `Double booking test failed: ${e.message}`);
  }

  // 6. Owner views incoming bookings
  try {
    const ownerBookingsRes = await req('/bookings/owner-bookings', {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const found = ownerBookingsRes.data.data?.bookings?.some((b) => b._id === bookingId);
    assert(
      ownerBookingsRes.status === 200 && found,
      'GET /api/v1/bookings/owner-bookings displays incoming reservations for Landlord'
    );
  } catch (e) {
    assert(false, `Owner bookings view failed: ${e.message}`);
  }

  // 7. Owner accepts booking
  try {
    const acceptRes = await req(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { status: 'ACCEPTED', notes: 'Booking accepted. Room is sanitized.' },
    });
    assert(
      acceptRes.status === 200 && acceptRes.data.data?.booking?.status === 'ACCEPTED',
      'PATCH /api/v1/bookings/:id/status allows Owner to transition REQUESTED -> ACCEPTED'
    );
  } catch (e) {
    assert(false, `Accept booking failed: ${e.message}`);
  }

  // 8. Owner Checks-In Tenant -> Verified Residency Established
  try {
    const checkInRes = await req(`/bookings/${bookingId}/status`, {
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
      'Physical Check-in sets status CHECKED_IN & grants verified residency (isVerifiedResident: true)'
    );
  } catch (e) {
    assert(false, `Check-in failed: ${e.message}`);
  }

  // 9. Active Stay & Resident List
  try {
    const residentsRes = await req('/bookings/owner-residents', {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const isResident = residentsRes.data.data?.residents?.some((r) => r._id === bookingId);
    assert(
      residentsRes.status === 200 && isResident,
      'GET /api/v1/bookings/owner-residents tracks active occupant records'
    );
  } catch (e) {
    assert(false, `Residents list failed: ${e.message}`);
  }

  // 10. Tenant views active booking & history
  try {
    const myBookingsRes = await req('/bookings/my-bookings', {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const active = myBookingsRes.data.data?.bookings?.find((b) => b._id === bookingId);
    assert(
      myBookingsRes.status === 200 &&
        active?.status === 'CHECKED_IN' &&
        active?.isVerifiedResident === true,
      'GET /api/v1/bookings/my-bookings returns active stays and verified resident state'
    );
  } catch (e) {
    assert(false, `My bookings failed: ${e.message}`);
  }

  // 11. Test Booking Cancellation & Inventory Restoration
  try {
    // Create second property with 2 beds
    const tempProp = await req('/properties', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        title: `Cancellation Test Property #${rand}`,
        description: 'Testing inventory restoration on cancel',
        propertyType: 'PG',
        address: { city: 'Pune', state: 'Maharashtra', pincode: '411001' },
        images: ['https://example.com/test.jpg'],
        roomConfigurations: [
          {
            type: 'DOUBLE',
            name: '2-Seater',
            rent: 8000,
            deposit: 10000,
            totalBeds: 2,
            availableBeds: 2,
          },
        ],
      },
    });

    const tempPropId = tempProp.data.data?.property?._id;
    const tempConfigId = tempProp.data.data?.property?.roomConfigurations?.[0]?._id;

    // Tenant books 1 bed (available: 2 -> 1)
    const b2 = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherTenantToken}` },
      body: {
        propertyId: tempPropId,
        roomConfigId: tempConfigId,
        moveInDate: '2026-09-15',
      },
    });
    secondBookingId = b2.data.data?.booking?._id;

    // Verify bed decremented to 1
    const pAfterBook = await req(`/properties/${tempPropId}`);
    const bedsAfterBook = pAfterBook.data.data?.property?.roomConfigurations?.[0]?.availableBeds;

    // Tenant cancels booking
    const cancelRes = await req(`/bookings/${secondBookingId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherTenantToken}` },
      body: { reason: 'Plans changed' },
    });

    // Verify bed restored back to 2
    const pAfterCancel = await req(`/properties/${tempPropId}`);
    const bedsAfterCancel = pAfterCancel.data.data?.property?.roomConfigurations?.[0]?.availableBeds;

    assert(
      cancelRes.status === 200 &&
        cancelRes.data.data?.booking?.status === 'CANCELLED' &&
        bedsAfterBook === 1 &&
        bedsAfterCancel === 2,
      'POST /api/v1/bookings/:id/cancel cancels reservation & atomically restores bed inventory (+1)'
    );
  } catch (e) {
    assert(false, `Cancellation test failed: ${e.message}`);
  }

  // 12. Landlord Completes Check-Out (Restores bed for next resident)
  try {
    const checkOutRes = await req(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { status: 'CHECKED_OUT' },
    });

    const propAfterCheckout = await req(`/properties/${propertyId}`);
    const restoredSingleBeds = propAfterCheckout.data.data?.property?.roomConfigurations?.find(
      (c) => c._id === singleRoomConfigId
    )?.availableBeds;

    assert(
      checkOutRes.status === 200 &&
        checkOutRes.data.data?.booking?.status === 'CHECKED_OUT' &&
        restoredSingleBeds === 1,
      'Check-Out records completion, preserves verified resident history, and restores seat vacancy (0 -> 1)'
    );
  } catch (e) {
    assert(false, `Check-out test failed: ${e.message}`);
  }

  // 13. RBAC: Unauthorized Tenant attempting to change booking status
  try {
    const unauthorizedStatusRes = await req(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${otherTenantToken}` },
      body: { status: 'ACCEPTED' },
    });
    assert(
      unauthorizedStatusRes.status === 403,
      'RBAC: Unauthorized user is forbidden from updating booking status (403 Forbidden)'
    );
  } catch (e) {
    assert(false, `RBAC status test failed: ${e.message}`);
  }

  console.log('\n====================================================');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runBookingTests();
