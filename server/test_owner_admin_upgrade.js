/**
 * Test Suite: Owner & Admin Platform Upgrade Verification
 * Verifies Room & Bed Management, Categorized Photos, Property Stats,
 * Multi-Property Owner Analytics, and Platform Admin Analytics.
 */

const BASE_URL = 'http://localhost:5000/api/v1';

async function req(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, data: JSON.parse(text) };
  } catch (e) {
    return { status: res.status, ok: res.ok, rawText: text };
  }
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 Running StayEasy Owner & Admin Platform Upgrade Tests');
  console.log('======================================================\n');

  const ts = Date.now();
  const ownerEmail = `test.owner.${ts}@stayeasy.test`;
  const tenantEmail = `test.tenant.${ts}@stayeasy.test`;
  const adminEmail = `test.admin.${ts}@stayeasy.test`;

  // 1. Register Owner
  console.log('1. Registering Owner, Tenant, Admin accounts...');
  const ownerRes = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Grand Horizon Hostels',
      email: ownerEmail,
      password: 'Password123!',
      role: 'OWNER',
      phone: '9876543210',
    }),
  });
  assert(ownerRes.status === 201, 'Owner registration returned 201');
  const ownerToken = ownerRes.data.data.token;

  // Register Tenant
  const tenantRes = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Rohan Sharma',
      email: tenantEmail,
      password: 'Password123!',
      role: 'USER',
      phone: '9876543211',
    }),
  });
  assert(tenantRes.status === 201, 'Tenant registration returned 201');
  const tenantToken = tenantRes.data.data.token;

  // Register Admin
  const adminRes = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Super Admin',
      email: adminEmail,
      password: 'Password123!',
      role: 'ADMIN',
      phone: '9876543212',
    }),
  });
  assert(adminRes.status === 201, 'Admin registration returned 201');
  const adminToken = adminRes.data.data.token;

  // 2. Create a Property as Owner
  console.log('\n2. Creating Property with structured configuration...');
  const propRes = await req('/properties', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({
      title: 'Grand Horizon Luxury PG & Co-living',
      description: 'Modern premium PG with fast WiFi, biometric access, and delicious homestyle meals.',
      propertyType: 'PG',
      genderPreference: 'UNISEX',
      address: {
        street: '100 Feet Ring Road, Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560038',
        landmark: 'Near Metro Station',
      },
      contactPhone: '9876543210',
      contactEmail: ownerEmail,
      amenities: ['WiFi', 'Power Backup', 'Air Conditioning', 'CCTV', 'Biometric Entry', 'Daily Housekeeping'],
      houseRules: ['No smoking indoors', 'Gate closes at 11 PM', 'Guests allowed till 8 PM'],
      roomConfigurations: [
        {
          name: 'Executive Double Bed',
          type: 'DOUBLE_SHARING',
          totalBeds: 4,
          availableBeds: 4,
          rent: 9500,
          deposit: 19000,
          hasAC: true,
          attachedWashroom: true,
          hasBalcony: true,
        },
      ],
      images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5'],
      expenses: {
        electricity: { type: 'INCLUDED' },
        water: { type: 'INCLUDED' },
        maintenance: { type: 'INCLUDED' },
        food: { available: true, includedInRent: true },
      },
    }),
  });
  assert(propRes.status === 201, 'Property created successfully');
  const propertyId = propRes.data.data.property._id;
  assert(propertyId, 'Property has valid _id');

  // Verify Admin verifies property
  await req(`/properties/${propertyId}/verify`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'VERIFIED' }),
  });

  // 3. Room Management
  console.log('\n3. Testing Room & Bed Management API...');
  // Add Room 102
  const addRoomRes = await req(`/properties/${propertyId}/rooms`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({
      roomNumber: '102',
      floor: 1,
      type: 'DOUBLE',
      sharingType: 'DOUBLE_SHARING',
      rentPerBed: 9500,
      depositPerBed: 19000,
      hasAC: true,
      hasAttachedBath: true,
      hasBalcony: true,
      beds: [
        { bedNumber: 'Bed A', status: 'AVAILABLE', price: 9500 },
        { bedNumber: 'Bed B', status: 'AVAILABLE', price: 9500 },
      ],
    }),
  });
  assert(addRoomRes.status === 201, 'Room 102 added with 2 beds');
  const room102Id = addRoomRes.data.data.room._id;
  const bedAId = addRoomRes.data.data.room.beds[0]._id;
  const bedBId = addRoomRes.data.data.room.beds[1]._id;

  // Add Room 201 (Single Seater)
  const addRoom201Res = await req(`/properties/${propertyId}/rooms`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({
      roomNumber: '201',
      floor: 2,
      type: 'SINGLE',
      sharingType: 'SINGLE_ROOM',
      rentPerBed: 14000,
      depositPerBed: 28000,
      hasAC: true,
      hasAttachedBath: true,
      beds: [{ bedNumber: 'Bed 1', status: 'AVAILABLE', price: 14000 }],
    }),
  });
  assert(addRoom201Res.status === 201, 'Room 201 added with 1 bed');

  // Update Bed Status
  console.log('\n4. Testing Bed Status Updates...');
  const updateBedRes = await req(`/properties/${propertyId}/beds/${bedAId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ status: 'OCCUPIED' }),
  });
  assert(updateBedRes.status === 200, 'Bed A status updated to OCCUPIED');
  assert(updateBedRes.data.data.bed?.status === 'OCCUPIED', 'Returned bed status is OCCUPIED');

  // Fetch Rooms
  const getRoomsRes = await req(`/properties/${propertyId}/rooms`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert(getRoomsRes.status === 200, 'Fetched property rooms');
  assert(getRoomsRes.data.data.rooms.length >= 2, 'Property has 2+ rooms');

  // 5. Categorized Photos Management
  console.log('\n5. Testing Categorized Photo Management...');
  const addPhotoRes = await req(`/properties/${propertyId}/photos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({
      url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af',
      category: 'ROOM',
      caption: 'Deluxe Master Double Bed Room with Balcony View',
      isCover: true,
    }),
  });
  assert(addPhotoRes.status === 201, 'Categorized photo added');
  const photosList = addPhotoRes.data.data.photos || [];
  const photoId = photosList[photosList.length - 1]?._id;
  assert(photoId !== undefined, 'Photo has valid _id');

  // Add another photo (KITCHEN)
  const addKitchenPhotoRes = await req(`/properties/${propertyId}/photos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({
      url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f',
      category: 'KITCHEN',
      caption: 'Hygienic 4-meal commercial pantry and dining hall',
      isCover: false,
    }),
  });
  assert(addKitchenPhotoRes.status === 201, 'Kitchen photo added');
  const kitchenPhotosList = addKitchenPhotoRes.data.data.photos || [];
  const kitchenPhotoId = kitchenPhotosList[kitchenPhotosList.length - 1]?._id;

  // Delete Kitchen photo
  const deletePhotoRes = await req(`/properties/${propertyId}/photos/${kitchenPhotoId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert(deletePhotoRes.status === 200, 'Kitchen photo deleted successfully');

  // 6. Property Level Statistics Scorecard
  console.log('\n6. Testing Property-Level Stats Scorecard...');
  const statsRes = await req(`/properties/${propertyId}/stats`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert(statsRes.status === 200, 'Fetched property statistics');
  const stats = statsRes.data.data.stats || statsRes.data.data;
  assert(stats.totalBeds > 0, `Total beds computed: ${stats.totalBeds}`);
  assert(typeof stats.occupancyRate === 'number', `Occupancy rate computed: ${stats.occupancyRate}%`);
  assert(stats.totalRooms >= 2, `Rooms count: ${stats.totalRooms}`);

  // 7. Multi-Property Owner Analytics
  console.log('\n7. Testing Multi-Property Owner Analytics Telemetry...');
  const ownerAnalyticsRes = await req('/analytics/owner/overview', {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert(ownerAnalyticsRes.status === 200, 'Fetched owner overview');
  assert(
    Array.isArray(ownerAnalyticsRes.data.data.propertiesSummary),
    'Owner overview contains propertiesSummary comparative array'
  );
  assert(ownerAnalyticsRes.data.data.propertiesSummary.length >= 1, 'Owner has comparative scorecards for their properties');

  // 8. Platform Admin Analytics Telemetry
  console.log('\n8. Testing Platform Admin Global Telemetry...');
  const adminAnalyticsRes = await req('/analytics/admin/overview', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminAnalyticsRes.status === 200, 'Fetched admin overview');
  assert(
    Array.isArray(adminAnalyticsRes.data.data.propertyTypeDistribution),
    'Admin overview contains propertyTypeDistribution'
  );
  assert(adminAnalyticsRes.data.data.platformBeds !== undefined, 'Admin overview contains platformBeds');
  assert(adminAnalyticsRes.data.data.grossMerchandiseValue !== undefined, 'Admin overview contains GMV');
  assert(adminAnalyticsRes.data.data.escrowHeld !== undefined, 'Admin overview contains Escrow Held');

  // 9. RBAC Security Checks
  console.log('\n9. Verifying RBAC Security Boundaries...');
  // Tenant cannot add room to owner's property
  const tenantAddRoomRes = await req(`/properties/${propertyId}/rooms`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tenantToken}` },
    body: JSON.stringify({ roomNumber: '301', floor: 3 }),
  });
  assert(tenantAddRoomRes.status === 403, 'Tenant blocked with 403 from adding rooms');

  // Tenant cannot delete property photos
  const tenantDeletePhotoRes = await req(`/properties/${propertyId}/photos/${photoId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tenantToken}` },
  });
  assert(tenantDeletePhotoRes.status === 403, 'Tenant blocked with 403 from deleting photos');

  console.log('\n======================================================');
  console.log('🎉 ALL OWNER & ADMIN UPGRADE TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
