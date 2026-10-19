import { execSync } from 'child_process';

const suites = [
  { name: 'Suite 1: User & Owner Auth Lifecycle', file: 'server/test_auth.js' },
  { name: 'Suite 2: Property Listings & RBAC', file: 'server/test_properties.js' },
  { name: 'Suite 3: Search, Filters & Cost Engine', file: 'server/test_phase4.js' },
  { name: 'Suite 4: Bookings & Inventory Lock', file: 'server/test_bookings.js' },
  { name: 'Suite 5: Escrow Deposit Protection', file: 'server/test_phase5.js' },
  { name: 'Suite 6: Stay Lifecycle & Rent Ledger', file: 'server/test_phase6.js' },
  { name: 'Suite 7: Verified Resident Reviews', file: 'server/test_phase7.js' },
  { name: 'Suite 8: Notifications System', file: 'server/test_phase8.js' },
  { name: 'Suite 9: Maintenance SLA & Tickets', file: 'server/test_phase9.js' },
  { name: 'Suite 10: Advanced Analytics', file: 'server/test_phase10.js' },
  { name: 'Suite 11: AI Recommendations & Forecasting', file: 'server/test_phase11.js' },
  { name: 'Suite 12: Payments Gateway & Disbursals', file: 'server/test_phase12.js' },
  { name: 'Suite 13: Auth E2E Diagnostic', file: 'server/test_auth_e2e_verification.js' },
  { name: 'Suite 14: Owner/Tenant/Admin Flow', file: 'server/test_owner_auth_flow.js' },
  { name: 'Suite 15: Owner & Admin Platform Upgrade', file: 'server/test_owner_admin_upgrade.js' },
  { name: 'Suite 16: Verified Resident Reviews USP', file: 'server/test_verified_reviews.js' },
];

console.log('================================================================================');
console.log('🚀 Running Complete StayEasy Automated Regression Matrix (16 Suites)');
console.log('================================================================================\n');

let totalPassed = 0;
let totalFailed = 0;
const results = [];

for (const suite of suites) {
  try {
    const output = execSync(`node ${suite.file}`, { encoding: 'utf8' });
    const passedMatch = output.match(/(\d+)\s*(?:Passed|PASSED)/i);
    const failedMatch = output.match(/(\d+)\s*(?:Failed|FAILED)/i);
    const p = passedMatch ? parseInt(passedMatch[1], 10) : 1;
    const f = failedMatch ? parseInt(failedMatch[1], 10) : 0;
    totalPassed += p;
    totalFailed += f;
    results.push({ name: suite.name, file: suite.file, passed: p, failed: f, status: f === 0 ? '✅ PASS' : '❌ FAIL' });
    console.log(`[PASS] ${suite.name} (${p} passed, ${f} failed)`);
  } catch (err) {
    totalFailed++;
    results.push({ name: suite.name, file: suite.file, passed: 0, failed: 1, status: '❌ FAIL', error: err.message });
    console.error(`[FAIL] ${suite.name}:`, err.message);
  }
}

console.log('\n================================================================================');
console.log('📊 Consolidated Regression Test Summary');
console.log('================================================================================');
console.table(results, ['name', 'passed', 'failed', 'status']);
console.log(`Total Assertions Passed: ${totalPassed}`);
console.log(`Total Assertions Failed: ${totalFailed}`);
console.log('================================================================================\n');

if (totalFailed > 0) process.exit(1);
