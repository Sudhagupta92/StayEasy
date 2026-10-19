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

async function runPropertyTests() {
  console.log('====================================================');
  console.log('🚀 Starting StayEasy Phase 3 Property & Listing Tests');
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
  let otherOwnerToken = '';
  let userToken = '';
  let adminToken = '';
  let createdPropertyId = '';

  // 1. Setup Auth accounts for test
  try {
    const regOwner = await req('/auth/register', {
      method: 'POST',
      body: {
        name: 'Landlord Phase3',
        email: `landlord_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'OWNER',
        businessName: 'Phase 3 Luxury Living',
      },
    });
    ownerToken = regOwner.data.data?.token;

    const regOtherOwner = await req('/auth/register', {
      method: 'POST',
      body: {
        name: 'Other Landlord',
        email: `other_owner_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'OWNER',
        businessName: 'Other Properties',
      },
    });
    otherOwnerToken = regOtherOwner.data.data?.token;

    const regUser = await req('/auth/register', {
      method: 'POST',
      body: {
        name: 'Student Phase3',
        email: `student_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'USER',
      },
    });
    userToken = regUser.data.data?.token;

    const regAdmin = await req('/auth/register', {
      method: 'POST',
      body: {
        name: 'Admin Phase3',
        email: `admin_${rand}@stayeasy.local`,
        password: 'Password123!',
        role: 'ADMIN',
      },
    });
    adminToken = regAdmin.data.data?.token;

    assert(
      !!ownerToken && !!userToken && !!adminToken,
      'Test user roles (OWNER, USER, ADMIN) initialized successfully'
    );
  } catch (e) {
    assert(false, `Account setup failed: ${e.message}`);
  }

  // 2. Browse Properties (Public)
  try {
    const listRes = await req('/properties');
    const properties = listRes.data.data?.properties || [];
    assert(
      listRes.status === 200 && Array.isArray(properties) && properties.length >= 1,
      `GET /api/v1/properties returns active listings (${properties.length} found)`
    );
  } catch (e) {
    assert(false, `Browse properties failed: ${e.message}`);
  }

  // 3. Search & Filter Properties (by City)
  try {
    const cityRes = await req('/properties?city=Bengaluru');
    const props = cityRes.data.data?.properties || [];
    const allBangalore = props.every((p) => p.address.city.toLowerCase() === 'bengaluru');
    assert(
      cityRes.status === 200 && props.length >= 1 && allBangalore,
      'GET /api/v1/properties?city=Bengaluru filters accurately by city'
    );
  } catch (e) {
    assert(false, `Filter by city failed: ${e.message}`);
  }

  // 4. Search & Filter Properties (by Gender)
  try {
    const femaleRes = await req('/properties?genderPreference=FEMALE');
    const props = femaleRes.data.data?.properties || [];
    const allFemale = props.every((p) => p.genderPreference === 'FEMALE');
    assert(
      femaleRes.status === 200 && props.length >= 1 && allFemale,
      'GET /api/v1/properties?genderPreference=FEMALE filters accurately for women PGs'
    );
  } catch (e) {
    assert(false, `Filter by gender failed: ${e.message}`);
  }

  // 5. Owner creates property listing
  try {
    const newPropRes = await req('/properties', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        title: `Sunrise Executive PG #${rand}`,
        tagline: 'Modern 2-Seater AC Rooms for Tech Grads',
        description: 'Quiet PG near tech corridor with high-speed WiFi and hot meals.',
        propertyType: 'PG',
        genderPreference: 'MALE',
        address: {
          street: '100 Feet Road, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
          landmark: 'Near 12th Main Junction',
        },
        images: [
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
        ],
        roomConfigurations: [
          {
            type: 'SINGLE',
            name: 'Single Deluxe AC Room',
            rent: 14000,
            deposit: 20000,
            totalBeds: 5,
            availableBeds: 2,
            attachedWashroom: true,
            hasAC: true,
          },
          {
            type: 'DOUBLE',
            name: '2-Seater Sharing AC',
            rent: 9500,
            deposit: 15000,
            totalBeds: 12,
            availableBeds: 4,
            attachedWashroom: true,
            hasAC: true,
          },
        ],
        expenses: {
          electricity: {
            type: 'PER_UNIT',
            rate: 8.5,
            description: 'Sub-metered (₹8.5/unit)',
          },
          water: { type: 'INCLUDED', amount: 0 },
          maintenance: { type: 'INCLUDED', amount: 0 },
          food: {
            available: true,
            includedInRent: true,
            extraCost: 0,
            foodType: 'BOTH',
            mealSchedule: ['Breakfast', 'Dinner'],
          },
        },
        noticePeriodDays: 30,
        depositRefundPolicy: 'Full refund within 5 days of checkout.',
        amenities: ['High-Speed WiFi', 'Power Backup', 'CCTV 24/7', 'Housekeeping'],
      },
    });

    createdPropertyId = newPropRes.data.data?.property?._id;
    assert(
      newPropRes.status === 201 &&
        newPropRes.data.data?.property?.verificationStatus === 'PENDING' &&
        newPropRes.data.data?.property?.rentRange?.min === 9500 &&
        newPropRes.data.data?.property?.rentRange?.max === 14000,
      'POST /api/v1/properties (OWNER role) creates listing with auto-computed rent range'
    );
  } catch (e) {
    assert(false, `Owner property creation failed: ${e.message}`);
  }

  // 6. Non-Owner (USER role) attempting to create property
  try {
    const userCreateRes = await req('/properties', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        title: 'Unauthorized Property',
        description: 'Should be rejected',
        propertyType: 'PG',
        images: ['https://example.com/img.jpg'],
        roomConfigurations: [{ type: 'SINGLE', name: 'Room', rent: 5000, deposit: 5000 }],
        address: { city: 'Pune', state: 'MH', pincode: '411001' },
      },
    });
    assert(
      userCreateRes.status === 403,
      'RBAC: USER role is forbidden from creating property listings (403 Forbidden)'
    );
  } catch (e) {
    assert(false, `USER property create test failed: ${e.message}`);
  }

  // 7. Get Single Property Details by ID
  try {
    const detailRes = await req(`/properties/${createdPropertyId}`);
    const prop = detailRes.data.data?.property;
    assert(
      detailRes.status === 200 &&
        prop?._id === createdPropertyId &&
        prop?.roomConfigurations?.length === 2 &&
        prop?.expenses?.electricity?.rate === 8.5,
      'GET /api/v1/properties/:id returns complete expense breakdown, sub-meter rates & room matrix'
    );
  } catch (e) {
    assert(false, `Get single property failed: ${e.message}`);
  }

  // 8. Owner updates their property
  try {
    const updateRes = await req(`/properties/${createdPropertyId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        tagline: 'Updated: 1 Bed Left in Single Deluxe Room!',
        noticePeriodDays: 20,
      },
    });
    assert(
      updateRes.status === 200 &&
        updateRes.data.data?.property?.noticePeriodDays === 20 &&
        updateRes.data.data?.property?.tagline?.includes('Updated:'),
      'PUT /api/v1/properties/:id allows owning landlord to update property attributes'
    );
  } catch (e) {
    assert(false, `Update property failed: ${e.message}`);
  }

  // 9. Ownership Guard: Different landlord attempting to update property
  try {
    const otherUpdateRes = await req(`/properties/${createdPropertyId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${otherOwnerToken}` },
      body: { tagline: 'Hacked tagline' },
    });
    assert(
      otherUpdateRes.status === 403,
      'Ownership Guard: Landlord cannot update another landlord property (403 Forbidden)'
    );
  } catch (e) {
    assert(false, `Ownership guard test failed: ${e.message}`);
  }

  // 10. Owner fetches their own listings
  try {
    const myListingsRes = await req('/properties/my-listings', {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(
      myListingsRes.status === 200 && myListingsRes.data.data?.properties?.length >= 1,
      'GET /api/v1/properties/my-listings returns properties filtered for current owner'
    );
  } catch (e) {
    assert(false, `Get my listings failed: ${e.message}`);
  }

  // 11. Admin verifies and approves property
  try {
    const verifyRes = await req(`/properties/${createdPropertyId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        status: 'VERIFIED',
        notes: 'Physical audit completed by Officer Sharma. Sub-meter and food hygiene verified.',
        trustScore: 94,
      },
    });
    assert(
      verifyRes.status === 200 &&
        verifyRes.data.data?.property?.verificationStatus === 'VERIFIED' &&
        verifyRes.data.data?.property?.trustScore === 94,
      'PATCH /api/v1/properties/:id/verify allows ADMIN to verify listing with audit notes & Trust Score'
    );
  } catch (e) {
    assert(false, `Admin verify failed: ${e.message}`);
  }

  // 12. Owner deletes property
  try {
    const delRes = await req(`/properties/${createdPropertyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(
      delRes.status === 200 && delRes.data.success === true,
      'DELETE /api/v1/properties/:id allows owning landlord to delete listing'
    );
  } catch (e) {
    assert(false, `Delete property failed: ${e.message}`);
  }

  console.log('\n====================================================');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPropertyTests();
