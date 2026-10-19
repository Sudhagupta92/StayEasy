/**
 * Test Suite: Verified Resident Review System USP Verification (Tests A - L)
 * 
 * Tests:
 * Test A: Checked-in resident creates review -> success (201), isVerifiedResident: true, stay duration calculated.
 * Test B: Non-resident (no booking/stay) -> rejected with 403.
 * Test C: Resident of Property 1 cannot review Property 2 -> rejected with 403.
 * Test D: Client-spoofed stay duration/verified fields are strictly overridden by server calculations.
 * Test E: Duplicate review for same stay/property rejected with 400.
 * Test F: GET endpoints return verified resident badge, stay duration days, and stay duration text.
 * Test G: Owner Residents API supports search, filters (property, status, verified), and computes stay durations.
 * Test H: Strict Owner Isolation - Owner B cannot access Owner A's residents.
 * Test I: Platform Overview API returns clean aggregate statistics with zero PII.
 * Test J: Past resident (checked-out) duration calculation in days.
 * Test K: Current active resident (checked-in, no checkout) duration calculation.
 * Test L: Backward compatibility check for bookings, ledger, maintenance, and admin overview.
 */

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
    ...(options.body && { body: typeof options.body === 'string' ? options.body : JSON.stringify(options.body) }),
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

async function runVerifiedReviewTests() {
  console.log('================================================================================');
  console.log('🌟 Running StayEasy Verified Resident Review System USP Tests (Tests A - L)');
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

  const rand = Math.floor(Math.random() * 900000) + 100000;

  try {
    // -------------------------------------------------------------
    // Step 0: Create Test Accounts & Properties
    // -------------------------------------------------------------
    console.log('0. Registering Test Accounts...');
    // Owner 1
    const regOwner1 = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Owner One #${rand}`,
        email: `owner1_${rand}@stayeasy.test`,
        password: 'Password123!',
        role: 'OWNER',
        phone: '9876543001',
      },
    });
    assert(regOwner1.status === 201, 'Register Owner 1');
    const owner1Token = regOwner1.data.data?.token;

    // Owner 2
    const regOwner2 = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Owner Two #${rand}`,
        email: `owner2_${rand}@stayeasy.test`,
        password: 'Password123!',
        role: 'OWNER',
        phone: '9876543002',
      },
    });
    assert(regOwner2.status === 201, 'Register Owner 2');
    const owner2Token = regOwner2.data.data?.token;

    // Tenant 1 (Resident of Property 1)
    const regTenant1 = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Tenant Resident #${rand}`,
        email: `resident_${rand}@stayeasy.test`,
        password: 'Password123!',
        role: 'USER',
        phone: '9876543003',
      },
    });
    assert(regTenant1.status === 201, 'Register Tenant 1');
    const tenant1Token = regTenant1.data.data?.token;

    // Tenant 2 (Non-resident / outsider)
    const regTenant2 = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Tenant Outsider #${rand}`,
        email: `outsider_${rand}@stayeasy.test`,
        password: 'Password123!',
        role: 'USER',
        phone: '9876543004',
      },
    });
    assert(regTenant2.status === 201, 'Register Tenant 2');
    const tenant2Token = regTenant2.data.data?.token;

    // Admin
    const regAdmin = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Platform Admin #${rand}`,
        email: `admin_${rand}@stayeasy.test`,
        password: 'Password123!',
        role: 'ADMIN',
        phone: '9876543005',
      },
    });
    assert(regAdmin.status === 201, 'Register Admin');
    const adminToken = regAdmin.data.data?.token;

    // Create Property 1 under Owner 1
    const prop1Res = await req('/properties', {
      method: 'POST',
      headers: { Authorization: `Bearer ${owner1Token}` },
      body: {
        title: `Royal Oasis PG #${rand}`,
        description: 'Luxury PG near Tech Hub',
        propertyType: 'PG',
        genderPreference: 'MALE',
        address: {
          street: '12th Cross, Koramangala',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560034',
        },
        images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5'],
        roomConfigurations: [
          {
            type: 'SINGLE',
            name: 'Single Premium Room',
            rent: 14000,
            deposit: 20000,
            totalBeds: 2,
            availableBeds: 2,
          },
        ],
      },
    });
    assert(prop1Res.status === 201, 'Owner 1 creates Property 1', JSON.stringify(prop1Res.data));
    const prop1Id = prop1Res.data.data.property._id;
    const roomConfig1Id = prop1Res.data.data.property.roomConfigurations[0]._id;

    // Create Property 2 under Owner 2
    const prop2Res = await req('/properties', {
      method: 'POST',
      headers: { Authorization: `Bearer ${owner2Token}` },
      body: {
        title: `Serene Heights Hostel #${rand}`,
        description: 'Comfortable hostel for students',
        propertyType: 'HOSTEL',
        genderPreference: 'FEMALE',
        address: {
          street: '5th Main, HSR Layout',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560102',
        },
        images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5'],
        roomConfigurations: [
          {
            type: 'DOUBLE',
            name: 'Double Sharing',
            rent: 9000,
            deposit: 12000,
            totalBeds: 4,
            availableBeds: 4,
          },
        ],
      },
    });
    assert(prop2Res.status === 201, 'Owner 2 creates Property 2', JSON.stringify(prop2Res.data));
    const prop2Id = prop2Res.data.data.property._id;

    // -------------------------------------------------------------
    // Test B: Non-resident (Tenant 2 with no stay) -> 403 Forbidden
    // -------------------------------------------------------------
    console.log('\n--- Test B: Non-resident review block ---');
    const nonResReview = await req('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant2Token}` },
      body: {
        propertyId: prop1Id,
        title: 'Review without staying',
        comment: 'I never booked this property but want to leave a review.',
        overallRating: 4,
      },
    });
    assert(
      nonResReview.status === 403,
      'Test B: Non-resident attempting to review is rejected with HTTP 403',
      JSON.stringify(nonResReview.data)
    );

    // -------------------------------------------------------------
    // Setup Stay for Tenant 1 on Property 1
    // -------------------------------------------------------------
    console.log('\nSetting up Active Stay for Tenant 1 on Property 1...');
    const bookRes = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        propertyId: prop1Id,
        roomConfigId: roomConfig1Id,
        moveInDate: new Date().toISOString().split('T')[0],
        durationMonths: 6,
      },
    });
    assert(bookRes.status === 201, 'Tenant 1 creates booking on Property 1');
    const bookingId = bookRes.data.data.booking._id;

    // Owner 1 accepts & checks in Tenant 1
    await req(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${owner1Token}` },
      body: { status: 'ACCEPTED' },
    });

    const checkInDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000); // 45 days ago
    const checkInRes = await req(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${owner1Token}` },
      body: {
        status: 'CHECKED_IN',
        checkInDate: checkInDate.toISOString(),
        notes: 'Tenant moved in 45 days ago',
      },
    });
    assert(checkInRes.status === 200, 'Owner 1 checks in Tenant 1');

    // -------------------------------------------------------------
    // Test C: Resident of Property 1 cannot review Property 2 (403)
    // -------------------------------------------------------------
    console.log('\n--- Test C: Cross-property review block ---');
    const crossPropReview = await req('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        propertyId: prop2Id,
        title: 'Review of unstayed property',
        comment: 'I stayed at Prop 1, but trying to review Prop 2.',
        overallRating: 5,
      },
    });
    assert(
      crossPropReview.status === 403,
      'Test C: Resident of Property 1 attempting to review Property 2 is rejected with HTTP 403'
    );

    // -------------------------------------------------------------
    // Test K & A & D: Active Resident Eligibility, Review Creation & Anti-Tamper
    // -------------------------------------------------------------
    console.log('\n--- Test K & A & D: Active resident verification & anti-tamper check ---');
    // Check eligibility endpoint
    const eligRes = await req(`/reviews/eligibility/${prop1Id}`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(
      eligRes.status === 200 &&
        eligRes.data.data.isEligible === true &&
        eligRes.data.data.isVerifiedResident === true &&
        eligRes.data.data.isCurrentResident === true &&
        eligRes.data.data.stayDurationDays >= 40,
      'Test K: Eligibility API calculates active resident status and stay duration (~45 days)',
      JSON.stringify(eligRes.data)
    );

    // Attempt to spoof stay duration and verification flags in POST /reviews
    const spoofReview = await req('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        propertyId: prop1Id,
        title: 'Outstanding staying experience',
        comment: 'Clean facilities, warm water 24/7, high speed optical fiber WiFi and polite staff.',
        overallRating: 5,
        foodQualityRating: 5,
        cleanlinessRating: 5,
        ownerResponsivenessRating: 5,
        billingTransparencyRating: 5,
        amenitiesRating: 5,
        promiseVsRealityScore: 10,
        pros: ['Great amenities', 'Clean washroom', 'Fast WiFi'],
        cons: ['Limited visitor hours'],
        // Spoof attempt
        stayDurationDays: 9999,
        stayDurationText: 'Stayed for 9999 days (fake)',
        isVerifiedResident: false,
      },
    });
    assert(
      spoofReview.status === 201,
      'Test A: Checked-in resident creates verified review successfully (HTTP 201)'
    );
    const createdRev = spoofReview.data.data.review;
    assert(
      createdRev.isVerifiedResident === true,
      'Test D1: Anti-Tamper: Server enforces isVerifiedResident = true from verified booking'
    );
    assert(
      createdRev.stayDurationDays >= 40 && createdRev.stayDurationDays <= 50,
      'Test D2: Anti-Tamper: Server overrides client 9999 days with actual calculated stay duration (~45 days)'
    );
    assert(
      createdRev.stayDurationText.includes('Currently staying') || createdRev.stayDurationText.includes('45 days'),
      `Test D3: Stay duration formatted text generated by server: "${createdRev.stayDurationText}"`
    );

    // -------------------------------------------------------------
    // Test E: Duplicate Review Protection (HTTP 400)
    // -------------------------------------------------------------
    console.log('\n--- Test E: Duplicate review rejection ---');
    const dupReview = await req('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        propertyId: prop1Id,
        title: 'Second review attempt for same stay',
        comment: 'Attempting to submit another review',
        overallRating: 5,
      },
    });
    assert(
      dupReview.status === 400,
      'Test E: Duplicate review submission for same stay/property rejected with HTTP 400'
    );

    // -------------------------------------------------------------
    // Test F: GET Endpoints return Verified Badges & Stay Duration
    // -------------------------------------------------------------
    console.log('\n--- Test F: Public & Owner review GET endpoints return verified metadata ---');
    const propReviewsRes = await req(`/reviews/property/${prop1Id}?sortBy=recent`);
    assert(propReviewsRes.status === 200, 'GET /reviews/property/:id succeeds');
    const pubRev = propReviewsRes.data.data.reviews.find((r) => r._id === createdRev._id);
    assert(
      pubRev && pubRev.isVerifiedResident === true && pubRev.stayDurationText,
      'Test F1: Public property review payload includes isVerifiedResident and stayDurationText'
    );

    const ownerRevRes = await req('/reviews/owner-reviews', {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(ownerRevRes.status === 200, 'GET /reviews/owner-reviews succeeds');
    const ownRev = ownerRevRes.data.data.reviews.find((r) => r._id === createdRev._id);
    assert(
      ownRev && ownRev.isVerifiedResident === true && ownRev.stayDurationDays >= 40,
      'Test F2: Owner reviews payload includes verified badge and stay duration days'
    );

    // -------------------------------------------------------------
    // Test G: Owner Residents Search & Filters
    // -------------------------------------------------------------
    console.log('\n--- Test G: Owner Residents API search, filtering, and duration mapping ---');
    const allResidentsRes = await req('/bookings/owner-residents', {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(
      allResidentsRes.status === 200 && allResidentsRes.data.data.residents.length >= 1,
      'Test G1: Owner can list all residents with stay duration computed'
    );
    const r0 = allResidentsRes.data.data.residents.find((r) => r._id === bookingId);
    assert(
      r0 && r0.stayDurationDays >= 40 && r0.stayDurationText,
      `Test G2: Resident record has computed stayDurationDays (${r0?.stayDurationDays}) and stayDurationText ("${r0?.stayDurationText}")`
    );

    // Search by name
    const searchRes = await req(`/bookings/owner-residents?search=${encodeURIComponent('Tenant Resident')}`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(
      searchRes.status === 200 && searchRes.data.data.residents.length >= 1,
      'Test G3: Search residents by name matches resident'
    );

    // Filter by property
    const filterPropRes = await req(`/bookings/owner-residents?propertyId=${prop1Id}`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(
      filterPropRes.status === 200 && filterPropRes.data.data.residents.length >= 1,
      'Test G4: Filter residents by propertyId matches resident'
    );

    // Filter by status=ACTIVE
    const filterActiveRes = await req('/bookings/owner-residents?status=ACTIVE', {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(
      filterActiveRes.status === 200 && filterActiveRes.data.data.residents.length >= 1,
      'Test G5: Filter residents by status=ACTIVE matches checked-in resident'
    );

    // -------------------------------------------------------------
    // Test H: Strict Owner Isolation
    // -------------------------------------------------------------
    console.log('\n--- Test H: Strict Owner Isolation ---');
    const owner2Residents = await req('/bookings/owner-residents', {
      headers: { Authorization: `Bearer ${owner2Token}` },
    });
    const leak = owner2Residents.data.data?.residents?.some((r) => r._id === bookingId);
    assert(
      owner2Residents.status === 200 && !leak,
      'Test H: Owner 2 cannot see Owner 1 residents (Strict Landlord Isolation)'
    );

    // -------------------------------------------------------------
    // Test I: Platform Overview Endpoint (Aggregate only, Zero PII)
    // -------------------------------------------------------------
    console.log('\n--- Test I: Platform Overview Endpoint ---');
    const platOverview = await req('/analytics/platform/overview', {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(
      platOverview.status === 200,
      'Test I1: GET /analytics/platform/overview returns HTTP 200'
    );
    const poData = platOverview.data.data;
    assert(
      poData &&
        typeof poData.totalUsers === 'number' &&
        typeof poData.totalProperties === 'number' &&
        typeof poData.totalVerifiedReviews === 'number' &&
        poData.totalVerifiedReviews >= 1 &&
        poData.averageRating > 0 &&
        poData.byType &&
        !poData.residents &&
        !poData.users,
      'Test I2: Platform Overview returns clean aggregate data (verified reviews, ratings, types) with ZERO user/resident PII'
    );

    // -------------------------------------------------------------
    // Test J: Past resident duration calculation (Checked out)
    // -------------------------------------------------------------
    console.log('\n--- Test J: Past Resident (Checked-out) Stay Duration ---');
    // Register Tenant 3
    const regTenant3 = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Past Resident #${rand}`,
        email: `pastresident_${rand}@stayeasy.test`,
        password: 'Password123!',
        role: 'USER',
        phone: '9876543006',
      },
    });
    const tenant3Token = regTenant3.data.data?.token;

    // Create booking for Tenant 3
    const book3 = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant3Token}` },
      body: {
        propertyId: prop1Id,
        roomConfigId: roomConfig1Id,
        moveInDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        durationMonths: 3,
      },
    });
    const booking3Id = book3.data.data.booking._id;

    // Check-in and then Check-out
    const ciDate3 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
    const coDate3 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago (stayed 60 days)

    await req(`/bookings/${booking3Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${owner1Token}` },
      body: { status: 'ACCEPTED' },
    });
    await req(`/bookings/${booking3Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${owner1Token}` },
      body: { status: 'CHECKED_IN', checkInDate: ciDate3.toISOString() },
    });
    await req(`/bookings/${booking3Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${owner1Token}` },
      body: { status: 'CHECKED_OUT', checkOutDate: coDate3.toISOString() },
    });

    // Check Tenant 3 eligibility
    const elig3 = await req(`/reviews/eligibility/${prop1Id}`, {
      headers: { Authorization: `Bearer ${tenant3Token}` },
    });
    assert(
      elig3.status === 200 &&
        elig3.data.data.isEligible === true &&
        elig3.data.data.isCurrentResident === false &&
        elig3.data.data.stayDurationDays >= 58 &&
        elig3.data.data.stayDurationDays <= 62,
      `Test J1: Past resident eligibility computed stayDurationDays (${elig3.data.data?.stayDurationDays} days) for 60-day stay`
    );

    // Tenant 3 posts review
    const rev3 = await req('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant3Token}` },
      body: {
        propertyId: prop1Id,
        title: 'Great past stay for 2 months',
        comment: 'Stayed here for 2 months during my internship. Smooth checkout and deposit refund.',
        overallRating: 4,
        foodQualityRating: 4,
        cleanlinessRating: 4,
        ownerResponsivenessRating: 5,
        billingTransparencyRating: 5,
        amenitiesRating: 4,
      },
    });
    assert(rev3.status === 201, 'Test J2: Past resident posts verified review');
    assert(
      rev3.data.data.review.isVerifiedResident === true &&
        rev3.data.data.review.isCurrentResident === false &&
        rev3.data.data.review.stayDurationDays >= 58,
      `Test J3: Review recorded as past resident (stayDurationDays: ${rev3.data.data.review.stayDurationDays}, text: "${rev3.data.data.review.stayDurationText}")`
    );

    // -------------------------------------------------------------
    // Test L: Backward Compatibility
    // -------------------------------------------------------------
    console.log('\n--- Test L: Backward compatibility check ---');
    // Admin overview
    const adminOverviewRes = await req('/admin/overview', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminOverviewRes.status === 200, 'Test L1: Admin overview endpoint functional');

    // Admin analytics overview
    const adminAnalyticsRes = await req('/analytics/admin/overview?period=12m', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminAnalyticsRes.status === 200 &&
        typeof adminAnalyticsRes.data.data.totalVerifiedReviews === 'number',
      'Test L2: Admin analytics overview includes totalVerifiedReviews telemetry'
    );

    // Maintenance SLA summary
    const slaRes = await req('/maintenance/sla-summary', {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(slaRes.status === 200, 'Test L3: Maintenance SLA summary functional');

    // Owner Ledger
    const ledgerRes = await req('/ledger/owner-ledger', {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    assert(ledgerRes.status === 200, 'Test L4: Owner ledger functional');

  } catch (err) {
    console.error('❌ Test suite execution error:', err);
    failed++;
  }

  console.log('\n================================================================================');
  console.log(`📊 Verified Resident Review System Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerifiedReviewTests();
