# 🧪 StayEasy Phase 13 — Production Hardening & Final Integration Verification Checklist

This document details the step-by-step procedure to manually audit, test, and verify the production-hardened StayEasy web application across all 13 phases.

---

## 🚀 Pre-requisites & Service Deployment Check

1. **Verify Node.js/Express API Gateway (Port 5000)**:
   ```bash
   node server/server.js
   ```
   *Health Check:* `http://localhost:5000/api/v1/health`
   *Expected Result:* Returns `status: "UP"`, MongoDB connected status, and active phase string.

2. **Verify Python AI Microservice (Port 8000)**:
   ```bash
   python -m uvicorn app:app --host 0.0.0.0 --port 8000
   ```
   *Health Check:* `http://localhost:8000/health`
   *Expected Result:* Returns `status: "healthy"`, model metadata loaded, and `modelsLoaded >= 1`.

3. **Verify Vite React Production Client (Port 5173 / Production Dist)**:
   ```bash
   npm run dev --prefix client
   ```
   *Expected Result:* App opens cleanly at `http://localhost:5173`.

---

## 🔐 Scenario A: Security & CORS Verification

1. **Python AI Microservice CORS**:
   - Issue a request from an authorized origin (`http://localhost:5173`).
   - *Expected Result:* HTTP response headers return `Access-Control-Allow-Origin: http://localhost:5173` and `Access-Control-Allow-Credentials: true`. Wildcard `*` is not emitted when credentials are true.

2. **Centralized Mongoose Error Handling**:
   - Issue a request to `GET /api/v1/properties/invalid123ObjectId`.
   - *Expected Result:* Returns HTTP `400 Bad Request` with structured JSON message: `Invalid format for resource identifier 'id'`. (No 500 Internal Server Error stack trace dump).

3. **Production Secrets Safety**:
   - Launch server in production mode without explicit JWT secret: `NODE_ENV=production node server/server.js`.
   - *Expected Result:* Console logs explicit warning `⚠️ [SECURITY WARNING] Running in PRODUCTION mode with default fallback JWT_SECRET`.

---

## 🛡️ Scenario B: Full System E2E Workflow Verification

### 1. User Authentication & Profile Lifecycle
- Register a new Tenant (`USER` role) and Landlord (`OWNER` role).
- Log in and verify JWT Bearer token storage.
- Update profile bio, phone, and occupation. Verify authorization guards block Tenants from accessing Owner/Admin management routes (`403 Forbidden`).

### 2. Property Listing & Transparent Cost Calculation
- Landlord creates a new property listing with sub-metered power rates and room configurations.
- Verify listing appears in search results sorted by `totalEstimatedMonthlyCost`.

### 3. Room Booking & Deposit Escrow
- Tenant submits booking request for an available bed.
- Tenant pays upfront security deposit via Payment Gateway simulator.
- Verify `escrowStatus` becomes `HELD_IN_ESCROW` and deposit receipt `ESCROW-REC-...` is generated.

### 4. Verified Resident Review & SLA Tickets
- Landlord confirms physical check-in (`isVerifiedResident` set to `true`).
- Resident submits verified property review.
- Resident files high-priority maintenance ticket. Inspect automated SLA response and resolution deadlines.

### 5. Financial Ledger & Digital Receipts
- Landlord issues monthly rent invoice.
- Tenant pays rent invoice online.
- Verify status updates to `PAID` and receipt `SE-RCT-...` is viewable and printable.
- Landlord views gross earnings, platform fee deductions (2%), and requests disbursal payout (`SE-PYT-...`).

### 6. AI Recommendations & Predictions
- Tenant views personalized AI recommendations with explainable decision tags.
- Landlord views AI occupancy and revenue predictions.
- Admin inspects platform intelligence metrics.

---

## 🏆 Full 13-Suite Regression Verification Command

Run the complete automated test suite to confirm zero regressions:

```bash
node server/test_auth.js
node server/test_properties.js
node server/test_phase4.js
node server/test_bookings.js
node server/test_phase5.js
node server/test_phase6.js
node server/test_phase7.js
node server/test_phase8.js
node server/test_phase9.js
node server/test_phase10.js
node server/test_phase11.js
node server/test_phase12.js
node server/test_auth_e2e_verification.js
```

All 13 test suites MUST report **0 Failed** assertions.
