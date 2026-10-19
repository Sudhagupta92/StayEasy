# 🧪 StayEasy Phase 11 — Manual & End-to-End Testing Verification Checklist

This document details the step-by-step procedure to manually test and verify all AI-Powered Recommendations, Predictions, and Intelligence features built in StayEasy Phase 11.

---

## 🚀 Pre-requisites & Service Startup

1. **Start Python AI Microservice (Port 8000)**:
   ```bash
   cd ai-service
   python -m uvicorn app:app --host 0.0.0.0 --port 8000
   ```
   *Verify:* Navigate to `http://localhost:8000/health`. Should return `{"status": "ok", "service": "StayEasy AI Service"}`.

2. **Start Backend Express Server (Port 5000)**:
   ```bash
   node server/server.js
   ```
   *Verify:* Navigate to `http://localhost:5000/api/v1/health`. Should report `"phase": "Phase 11 - AI-Powered Smart Recommendations & Predictions"`.

3. **Start React Frontend Client (Port 5173)**:
   ```bash
   npm run dev --prefix client
   ```
   *Verify:* Open `http://localhost:5173` in web browser.

---

## 👤 Scenario A: Tenant Smart Recommendations & Preferences

### 1. Set / Update Preferences
- Log in as a Tenant (`USER` role).
- Navigate to the **User Dashboard** -> **AI Recommendations** tab.
- Click **Edit Preferences**.
- Set Budget Range (e.g., ₹10,000 – ₹18,000), Preferred City (`Bengaluru`), Amenities (`AC`, `Wi-Fi`), Room Type (`SINGLE`), Food Preference (`VEG`).
- Click **Save Preferences**.
- **Expected Result**: Toast notification *"Preferences updated successfully"*. Modal closes.

### 2. View AI-Scored Property Recommendations
- In the **AI Recommendations** tab, observe the list of recommended property cards.
- Each property card displays:
  - Match Score (e.g., `85% Match` with green/gold gradient badge).
  - AI Badges (`AI Insight`, `High Confidence`).
  - Expandable *"Why this property?"* section listing transparent match reasons (e.g., *"Budget Match: Rent is ₹14,000/mo (within ₹10,000–₹18,000 range)"*, *"Location Match: Located in Bengaluru"*).
- Click **Book Now** or view property details.

---

## 🏡 Scenario B: Owner Predictive Analytics & Maintenance Risk Matrix

### 1. View Landlord Occupancy & Revenue Predictions
- Log in as a Landlord (`OWNER` role).
- Navigate to **Owner Dashboard** -> **AI Intelligence** tab.
- If landlord has multiple properties, select a property from the dropdown.
- Inspect **30-Day Occupancy Forecast**:
  - Predicted Occupancy Rate (e.g., `88.5%`), Confidence (`85%`), Data Window tag.
  - Key Drivers list explaining the forecast (e.g., *"High local demand in peak season"*, *"Competitive pricing below area median"*).
- Inspect **1-Month & 3-Month Revenue Forecast**:
  - Projected 30-Day Revenue (e.g., `₹75,000`), 90-Day Revenue projection, Expected Vacancy Loss.

### 2. Inspect Property Maintenance Risk Matrix
- Scroll to **Property Maintenance Risk & Hardware Health**.
- View Risk Severity Badge (`LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`).
- Observe numeric Risk Score (e.g., `35/100`) and Confidence Level (`85%`).
- Review identified Risk Factors (e.g., *"High plumbing ticket frequency in last 60 days"*, *"Building age > 5 years"*).
- Review Actionable Preventative Actions (e.g., *"Schedule preventative plumbing audit for block B"*, *"Check water heater pressure relief valves"*).

---

## 🛡️ Scenario C: Admin Platform Intelligence & Operational Telemetry

### 1. Platform-Wide Intelligence & System Telemetry
- Log in as an Administrator (`ADMIN` role).
- Navigate to **Admin Dashboard** -> **AI Platform Intelligence** tab.
- Inspect **Platform Demand Metrics**:
  - Total Active Properties, Platform Dues Collection Rate, Maintenance Risk Index.
- Inspect **System Telemetry**:
  - Machine Learning Model Metadata (`MAE: 3.2%`, `RMSE: 4.8%`, `R²: 0.94`, Data Window `90 days`).
- Inspect **Active System Alerts**:
  - High-risk maintenance flags across platform properties and occupancy bottleneck warnings.

---

## 🔌 Scenario D: Resilience & Graceful Service Degradation

### 1. Test AI Microservice Failure Handling
- Terminate the Python AI service (press `Ctrl+C` on terminal running uvicorn on port 8000).
- Refresh the Tenant, Owner, or Admin AI dashboard tabs.
- **Expected Result**:
  - Frontend continues to render without crashing.
  - Statistical Node fallbacks kick in seamlessly (`isFallback: true` returned).
  - Landlord predictions present safe historical averages.
  - Tenant recommendations sort properties by overall user rating.
- Restart Python AI service. Dashboard automatically resumes live ML inference.

---

## 🏆 Automated Regression Test Suite Execution

Run the complete 12-test suite to verify system integrity:

```bash
# 1. Auth Unit & RBAC Tests
node server/test_auth.js

# 2. Property Management Tests
node server/test_properties.js

# 3. Search & Cost Engine Tests
node server/test_phase4.js

# 4. Booking & Bed Inventory Tests
node server/test_bookings.js

# 5. Room Booking & Escrow Tests
node server/test_phase5.js

# 6. Rent Ledger & Invoicing Tests
node server/test_phase6.js

# 7. Resident Review Tests
node server/test_phase7.js

# 8. Notification System Tests
node server/test_phase8.js

# 9. Maintenance & SLA Tests
node server/test_phase9.js

# 10. Advanced Analytics Tests
node server/test_phase10.js

# 11. AI Recommendation & Prediction Tests
node server/test_phase11.js

# 12. E2E Auth Diagnostic Test
node server/test_auth_e2e_verification.js
```

All 12 test scripts MUST report **0 Failed** assertions.
