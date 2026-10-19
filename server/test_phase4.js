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

async function runPhase4Tests() {
  console.log('====================================================');
  console.log('🚀 Starting StayEasy Phase 4: Search, Filters & Living Cost Engine Tests');
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

  // 1. Fetch Dynamic Filter Metadata
  try {
    const metaRes = await req('/properties/filters/meta');
    const data = metaRes.data.data;
    assert(
      metaRes.status === 200 &&
        Array.isArray(data?.cities) &&
        Array.isArray(data?.amenities) &&
        typeof data?.rentRange?.min === 'number' &&
        typeof data?.totalCostRange?.max === 'number',
      'GET /api/v1/properties/filters/meta returns dynamic cities, amenities, rent & total cost ranges'
    );
  } catch (e) {
    assert(false, `Filter metadata API failed: ${e.message}`);
  }

  // 2. Filter by City & AC Room configuration
  try {
    const acRes = await req('/properties?city=Bengaluru&hasAC=true');
    const props = acRes.data.data?.properties || [];
    const allMatch = props.every(
      (p) =>
        p.address.city.toLowerCase() === 'bengaluru' &&
        p.roomConfigurations.some((rc) => rc.hasAC)
    );
    assert(
      acRes.status === 200 && props.length >= 1 && allMatch,
      'GET /api/v1/properties?city=Bengaluru&hasAC=true filters AC accommodations accurately'
    );
  } catch (e) {
    assert(false, `AC & City filter failed: ${e.message}`);
  }

  // 3. Filter by Sub-metered Electricity Billing
  try {
    const elecRes = await req('/properties?electricityType=PER_UNIT');
    const props = elecRes.data.data?.properties || [];
    const allPerUnit = props.every((p) => p.expenses?.electricity?.type === 'PER_UNIT');
    assert(
      elecRes.status === 200 && props.length >= 1 && allPerUnit,
      'GET /api/v1/properties?electricityType=PER_UNIT filters sub-metered power properties'
    );
  } catch (e) {
    assert(false, `Electricity type filter failed: ${e.message}`);
  }

  // 4. Filter by Max Total Estimated Living Cost
  try {
    const costRes = await req('/properties?maxTotalCost=12000');
    const props = costRes.data.data?.properties || [];
    const allUnderMax = props.every(
      (p) => (p.totalEstimatedMonthlyCost || p.rentRange?.min || 0) <= 12000
    );
    assert(
      costRes.status === 200 && props.length >= 1 && allUnderMax,
      'GET /api/v1/properties?maxTotalCost=12000 filters by true total living cost bounds'
    );
  } catch (e) {
    assert(false, `Max total cost filter failed: ${e.message}`);
  }

  // 5. Sort by Total Monthly Cost (cost_asc)
  try {
    const sortRes = await req('/properties?sort=cost_asc');
    const props = sortRes.data.data?.properties || [];
    let isSorted = true;
    for (let i = 0; i < props.length - 1; i++) {
      const costA = props[i].totalEstimatedMonthlyCost || props[i].rentRange?.min || 0;
      const costB = props[i + 1].totalEstimatedMonthlyCost || props[i + 1].rentRange?.min || 0;
      if (costA > costB) {
        isSorted = false;
        break;
      }
    }
    assert(
      sortRes.status === 200 && props.length >= 1 && isSorted,
      'GET /api/v1/properties?sort=cost_asc sorts by total estimated monthly cost ascending'
    );
  } catch (e) {
    assert(false, `Cost sorting failed: ${e.message}`);
  }

  // 6. Verify Virtual Property Fields for Living Cost Engine
  try {
    const listRes = await req('/properties');
    const firstProp = listRes.data.data?.properties?.[0];
    assert(
      firstProp &&
        typeof firstProp.totalEstimatedMonthlyCost === 'number' &&
        typeof firstProp.totalAvailableBeds === 'number',
      'Property records expose virtual fields totalEstimatedMonthlyCost & totalAvailableBeds'
    );
  } catch (e) {
    assert(false, `Virtual fields check failed: ${e.message}`);
  }

  console.log('\n====================================================');
  console.log(`📊 Phase 4 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4Tests();
