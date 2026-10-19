# StayEasy Phase 9 — Manual Testing Checklist
## Maintenance Tickets & Complaint SLA Management

This checklist provides step-by-step instructions to manually verify Phase 9 in a web browser.

---

### 🌐 Test Environment
* **Frontend Application:** `http://localhost:5173`
* **Backend REST API:** `http://localhost:5000/api/v1`
* **Health Check:** `http://localhost:5000/api/v1/health`

---

### 🧪 Test 1: Tenant Complaint Submission with Live SLA Calculation
1. Open `http://localhost:5173/login` and log in as a Tenant account (`USER`) with an active stay reservation.
2. Navigate to **Tenant Dashboard** -> Click the **"Maintenance & SLA"** tab.
3. Click the **"Raise New Complaint"** button.
4. Verify the modal displays:
   - Stay/Property selector.
   - Category grid (Electrical, Plumbing, Internet, Cleaning, Appliance, Water, Furniture, Security, Other).
   - Priority selectors (Low: 48h/5d, Medium: 24h/3d, High: 8h/24h, Urgent: 2h/8h) with live SLA commitment badge.
5. Fill in details:
   - Select Category: `Electrical & Power`
   - Select Priority: `HIGH`
   - Issue Title: `Power backup tripping in room 302`
   - Description: `Main inverter tripped when geyser was switched on.`
6. Click **"Submit Complaint"**.
7. Verify:
   - Ticket card is generated with reference `#SE-TKT-XXXXXX`.
   - SLA countdown badge shows exact remaining hours (`Resp: 8h 0m remaining`).
   - Priority badge displays `HIGH (8H SLA)`.
   - Initial status displays `Open`.

---

### 🧪 Test 2: Landlord SLA Telemetry & Ticket Acknowledgment
1. In an Incognito window or after logging out, log into the Landlord account (`OWNER`).
2. Notice the notification bell badge with a new notification: `New High Priority Ticket Raised: Power backup tripping in room 302`.
3. Open **Owner Dashboard** -> Click the **"Maintenance & SLA"** tab.
4. Verify the top KPI cards:
   - Open Issues: `1`
   - Urgent / High priority metrics.
   - Average Response Time and Resolution speed.
   - On-Time SLA Fulfillment score.
5. Click **"Acknowledge"** or click on the ticket card to open the **Maintenance Ticket Detail** modal.
6. Type a response message: `Electrician scheduled to inspect the circuit breaker at 3:00 PM.`
7. Click **"Confirm Acknowledgment"**.
8. Verify status updates to `Acknowledged` and the event is recorded in the Lifecycle Transition Timeline.

---

### 🧪 Test 3: Landlord Work Assignment & Resolution Verification
1. In the ticket detail modal, click **"Start Work"**.
2. Assign technician name & phone: `Ramesh Kumar (Electrician, 9876543210)`.
3. Click **"Mark In Progress"**.
4. Verify status updates to `In Progress` with assigned technician details displayed.
5. Click **"Mark Resolved"**.
6. Enter resolution verification notes: `Replaced the 16A MCB breaker switch and tested geyser load. Fully functional.`
7. Click **"Submit Resolution"**.
8. Verify status transitions to `Resolved` and SLA turnaround is recorded as `SLA Met (On-Time)`.

---

### 🧪 Test 4: Tenant Notification & Ticket Closure / Reopen Flow
1. Switch back to the Tenant session.
2. Observe notifications received:
   - `Maintenance Ticket Acknowledged`
   - `Maintenance Work Started`
   - `Maintenance Ticket Resolved`
3. Under the **"Maintenance & SLA"** tab, verify the ticket is now in `Resolved` status.
4. Click **"Details"** -> Click **"Close Ticket"** to confirm satisfactory resolution.
5. Verify status transitions to `Closed` with green `SLA Met` badge.

---

### 🧪 Test 5: Reopen Flow Verification
1. For any resolved ticket, click **"Reopen"**.
2. Enter reason: `Issue occurred again after 1 hour.`
3. Submit reopen request.
4. Verify ticket status reverts to `Reopened`, landlord receives an urgent alert, and the event is appended to the timeline.

---

### 🧪 Test 6: Administrative Platform Audit & Landlord SLA Ranking
1. Log into the Platform Admin account (`ADMIN`).
2. Navigate to **Admin Dashboard**.
3. Scroll to the **"Platform Maintenance & SLA Performance Audit"** section.
4. Verify platform-wide metrics:
   - Total Complaints count.
   - Platform SLA Breach Rate %.
   - Category distribution telemetry.
   - Landlord SLA compliance audit table with breach rates and resolution turnaround averages.
