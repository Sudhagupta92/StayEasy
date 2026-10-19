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

async function runPhase7Tests() {
  console.log('====================================================');
  console.log('🚀 Starting StayEasy Phase 7: Verified Resident Reviews & Ratings Tests');
  console.log('====================================================\n');

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
  let adminToken = '';
  let propertyId = '';
  let roomConfigId = '';
  let bookingId = '';
  let reviewId = '';

  try {
    // 1. Setup Auth Users
    const regOwner = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Review Owner #${rand}`,
        email: `review_owner_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'OWNER',
        businessName: 'Audited PG Living',
      },
    });
    assert(regOwner.status === 201, 'Register Owner Account', JSON.stringify(regOwner.data));
    ownerToken = regOwner.data.data?.token;

    const regTenant1 = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Verified Resident #${rand}`,
        email: `tenant1_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'USER',
      },
    });
    assert(regTenant1.status === 201, 'Register Tenant 1 (Resident)', JSON.stringify(regTenant1.data));
    tenant1Token = regTenant1.data.data?.token;

    const regTenant2 = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Unverified User #${rand}`,
        email: `tenant2_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'USER',
      },
    });
    assert(regTenant2.status === 201, 'Register Tenant 2 (No Stay)', JSON.stringify(regTenant2.data));
    tenant2Token = regTenant2.data.data?.token;

    const regAdmin = await req('/auth/register', {
      method: 'POST',
      body: {
        name: `Review Moderator #${rand}`,
        email: `admin_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'ADMIN',
      },
    });
    assert(regAdmin.status === 201, 'Register Admin Account', JSON.stringify(regAdmin.data));
    adminToken = regAdmin.data.data?.token;


    // 2. Owner Creates Property
    const propRes = await req('/properties', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        title: `Gourmet Food PG #${rand}`,
        tagline: 'Home cooked meals & study environment',
        description: 'Premium student PG with 3 meals daily.',
        propertyType: 'PG',
        genderPreference: 'UNISEX',
        address: {
          street: '100 Feet Rd',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560034',
        },
        images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5'],
        roomConfigurations: [
          {
            type: 'DOUBLE',
            name: 'Double Sharing AC',
            rent: 11000,
            deposit: 15000,
            totalBeds: 4,
            availableBeds: 4,
          },
        ],
      },
    });
    assert(propRes.status === 201, 'Create Property Listing for Review Tests');
    propertyId = propRes.data.data.property._id;
    roomConfigId = propRes.data.data.property.roomConfigurations[0]._id;

    // 3. Security Rule 1: Tenant 2 (unverified, no stay) attempts to post review -> Expect HTTP 403
    const unverifiedReview = await req('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant2Token}` },
      body: {
        propertyId,
        title: 'Fake 5-star rating without staying',
        comment: 'Nice place even though I never set foot inside',
        overallRating: 5,
      },
    });
    assert(
      unverifiedReview.status === 403,
      'Security: Block unverified user without booking from posting review (HTTP 403)'
    );

    // 4. Security Rule 2: Landlord attempts to post review on own property -> Expect HTTP 403
    const ownerSelfReview = await req('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        propertyId,
        title: 'My PG is the best',
        comment: 'Owner self review praising own property',
        overallRating: 5,
      },
    });
    assert(
      ownerSelfReview.status === 403,
      'Security: Block landlord from self-reviewing own property (HTTP 403)'
    );

    // 5. Tenant 1 Creates Booking and Landlord Checks In Tenant 1
    const bookRes = await req('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        propertyId,
        roomConfigId,
        moveInDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        durationMonths: 3,
      },
    });
    assert(bookRes.status === 201, 'Tenant 1 creates bed reservation');
    bookingId = bookRes.data.data.booking._id;

    // Landlord accepts & checks in Tenant 1
    await req(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { status: 'ACCEPTED' },
    });

    const checkInRes = await req(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { status: 'CHECKED_IN', notes: 'Physical key handed over' },
    });
    assert(
      checkInRes.status === 200 && checkInRes.data.data.booking.isVerifiedResident === true,
      'Landlord checks in Tenant 1 (isVerifiedResident = true)'
    );

    // 6. Check Review Eligibility for Tenant 1 -> Expect isEligible: true
    const eligRes = await req(`/reviews/eligibility/${propertyId}`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    assert(
      eligRes.status === 200 && eligRes.data.data.isEligible === true,
      'Eligibility Endpoint: Verified resident is confirmed eligible to review'
    );

    // 7. Tenant 1 Submits Verified Review
    const createRevRes = await req('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        propertyId,
        title: 'Delicious home-cooked meals & quiet study environment',
        comment:
          'Living here for 2 months now. Food quality is 5/5, clean washrooms, and owner resolves issues within 24h.',
        overallRating: 5,
        foodQualityRating: 5,
        cleanlinessRating: 4,
        ownerResponsivenessRating: 5,
        billingTransparencyRating: 5,
        amenitiesRating: 5,
        promiseVsRealityScore: 9,
        pros: ['Great food', 'Fast WiFi', 'Transparent electricity billing'],
        cons: ['Gate closes at 10:30 PM'],
      },
    });
    assert(createRevRes.status === 201, 'Tenant 1 submits verified resident review (HTTP 201)');
    reviewId = createRevRes.data.data.review._id;

    // 8. Duplicate Review Protection: Tenant 1 attempts to submit a second review -> Expect HTTP 400
    const dupReviewRes = await req('/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant1Token}` },
      body: {
        propertyId,
        title: 'Second review attempt',
        comment: 'Trying to post duplicate review for same stay',
        overallRating: 5,
      },
    });
    assert(
      dupReviewRes.status === 400,
      'Security: Prevent duplicate review submission for same stay (HTTP 400)'
    );

    // 9. Verify Dynamic Property Ratings Recalculation
    const propDetails = await req(`/properties/${propertyId}`);
    const ratings = propDetails.data.data.property.ratings;
    assert(
      ratings && ratings.totalReviews === 1 && ratings.overallAverage === 5 && ratings.foodQualityAverage === 5,
      'Dynamic Aggregation: Property ratings updated automatically (totalReviews: 1, overallAverage: 5)'
    );

    // 10. Helpful Feedback Voting
    const helpfulRes = await req(`/reviews/${reviewId}/helpful`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant2Token}` },
      body: { type: 'helpful' },
    });
    assert(
      helpfulRes.status === 200 && helpfulRes.data.data.helpfulCount === 1,
      'Helpful Vote: Authenticated user toggles helpful vote on review'
    );

    // 11. Owner Response to Review
    const ownerRespRes = await req(`/reviews/${reviewId}/respond`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        responseText: 'Thank you for your feedback! We maintain strict meal quality daily.',
      },
    });
    assert(
      ownerRespRes.status === 200 &&
        ownerRespRes.data.data.review.ownerResponse.responseText.includes('Thank you'),
      'Owner Response: Landlord posts official response to resident review'
    );

    // 12. Flag / Report Review
    const flagRes = await req(`/reviews/${reviewId}/flag`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tenant2Token}` },
      body: { reason: 'Testing report functionality for admin review' },
    });
    assert(flagRes.status === 200, 'User reports/flags review for moderation');

    // 13. Admin Moderation Queue
    const adminFlagged = await req('/reviews/admin/flagged', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminFlagged.status === 200 && adminFlagged.data.data.reviews.length >= 1,
      'Admin Console: Admin retrieves flagged review queue'
    );

    // 14. Admin Moderation Action (Status REJECTED & Recalculate Ratings)
    const modRes = await req(`/reviews/${reviewId}/moderate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'REJECTED', notes: 'Removed during automated test suite' },
    });
    assert(modRes.status === 200 && modRes.data.data.review.status === 'REJECTED', 'Admin moderates review status to REJECTED');

    // Verify Property Ratings updated after rejection
    const propDetailsAfter = await req(`/properties/${propertyId}`);
    assert(
      propDetailsAfter.data.data.property.ratings.totalReviews === 0,
      'Dynamic Aggregation: Property ratings recalculated back to 0 total reviews after rejection'
    );

  } catch (err) {
    console.error('❌ Test execution error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 Phase 7 Test Suite Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase7Tests();
