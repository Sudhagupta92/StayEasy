# 🧪 StayEasy Phase 12 — Integrated Financial Payments Gateway QA & Manual Verification Checklist

This document details the step-by-step procedure to manually test and verify all Financial Payment Orders, Signature Verifications, Duplicate Payment Protections, Refunds, Webhook Listeners, Digital Receipts, and Tenant/Owner/Admin Financial Control features built in StayEasy Phase 12.

---

## 🚀 Pre-requisites & Service Startup

1. **Start Express Backend API Server (Port 5000)**:
   ```bash
   node server/server.js
   ```
   *Verify:* `http://localhost:5000/api/v1/health` reports `"phase": "Phase 12 - Integrated Financial Payments Gateway & Real-Time Wallet / Escrow Ledger"`.

2. **Start React Frontend Client (Port 5173)**:
   ```bash
   npm run dev --prefix client
   ```
   *Verify:* Open `http://localhost:5173` in browser.

---

## 💳 Scenario A: Tenant Rent Invoice Payment & Digital Receipt

### 1. Initiate Rent Payment via Payment Gateway
- Log in as a Tenant (`USER` role).
- Navigate to **User Dashboard** -> **Financial Ledger** tab.
- Find a pending rent invoice in the **Pending Rent Invoices** banner.
- Click **Pay Now**.
- **Expected Result**: Payment Modal opens displaying:
  - Payable amount (e.g., `₹17,500`).
  - Payment options (UPI, Credit/Debit Card, NetBanking).
  - Sandbox outcome options (`Simulate Success` / `Simulate Failure`).

### 2. Complete Gateway Order Verification
- Select `UPI` or `Cards` and keep `Simulate Success` selected.
- Click **Pay Securely**.
- **Expected Result**:
  - Gateway order created (`order_SE_...`).
  - Signature digest verified.
  - Success modal confirms transaction.
  - Invoice status changes to `PAID` with receipt badge (`SE-RCT-...`).
  - Real-time notification fired to tenant & owner.

### 3. View & Print Digital Receipt
- In the **Payment Audit History & Receipts** table, click **View Receipt 📜**.
- **Expected Result**: Digital Receipt Modal pops up displaying:
  - Official StayEasy Header with Receipt Number (`SE-RCT-...`).
  - Issue timestamp, Payer details, Property name, and breakdown.
  - Amount paid in INR and `Status: PAID ✓`.
  - **Print / Save PDF** button triggers browser print dialog cleanly.

---

## 🛡️ Scenario B: Escrow Security Deposit Payment & Duplicate Protection

### 1. Pay Upfront Escrow Deposit
- Log in as a Tenant.
- In **My Bookings**, select an accepted booking with pending deposit.
- Click **Pay Escrow Security Deposit**.
- Complete sandbox payment.
- **Expected Result**: Booking `paymentStatus` transitions to `ESCROW_HELD` and `escrowStatus` becomes `HELD_IN_ESCROW`. Receipt `ESCROW-REC-...` generated.

### 2. Duplicate Payment Protection
- Attempt to re-pay the same invoice or deposit order.
- **Expected Result**: System blocks duplicate payment attempt with error: `Duplicate payment attempt. Order has already been paid successfully` (HTTP `400 Bad Request`).

---

## 🏦 Scenario C: Owner Financial Portal & Payout Request

### 1. Inspect Landlord Revenue & Net Balance
- Log in as a Landlord (`OWNER` role).
- Navigate to **Owner Dashboard** -> **Earnings & Payouts** tab.
- Inspect Financial Cards:
  - **Gross Revenue Collected** (total rent payments received).
  - **Platform Service Fee (2%)** (StayEasy commission).
  - **Net Balance Available** (available for payout).
  - **Property Escrow Holdings** (tenant security deposits held).

### 2. Request Owner Payout Disbursal
- Click **Request Disbursal 💸**.
- **Expected Result**:
  - `PAYOUT` transaction created (`SE-PYT-...`).
  - Disbursal confirmation alert displayed.
  - Owner receives `ESCROW_PAYOUT` notification.

---

## 🛡️ Scenario D: Admin Financial Control & Webhook Testing

### 1. Platform Financial Overview & GMV
- Log in as an Administrator (`ADMIN` role).
- Navigate to **Admin Dashboard** -> **Platform Financial Control** tab.
- View **Platform GMV**, **Platform Fee Earnings**, **Escrow Pool Held**, and **System-Wide Financial Audit Log**.

2. **Simulate Gateway Webhook Event**:
   - Click **Test Webhook Signature Event** (`payment.captured`).
   - **Expected Result**: Webhook listener processes callback and returns `Webhook event 'payment.captured' processed successfully`.

---

## 🏆 Automated Regression Test Suite Execution

Run all 13 test suites to verify system integrity:

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

All test scripts MUST report **0 Failed** assertions.
