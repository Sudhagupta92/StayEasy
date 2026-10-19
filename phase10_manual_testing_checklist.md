# StayEasy — Phase 10 Manual Testing & QA Verification Checklist

This document details the manual testing procedure to verify Phase 10: Advanced Analytics & Insights Dashboard across all user roles, security boundaries, and technical criteria.

---

## 1. OWNER / LANDLORD ANALYTICS

- [ ] **Login & Navigation:**
  - Login as a registered Landlord (`OWNER` role).
  - Navigate to the Landlord Hub (`/owner/dashboard`).
  - Click on the **"Analytics & Insights"** tab.

- [ ] **KPI Cards Verification:**
  - Verify **Portfolio Occupancy** displays calculated occupancy %, occupied beds, and available beds.
  - Verify **Total Revenue** displays accumulated revenue and current monthly collections.
  - Verify **Active Residents** displays current checked-in tenant count.
  - Verify **Pending Rent** displays outstanding dues accurately.
  - Verify **Average Rating** matches star reviews.
  - Verify **SLA Compliance** reflects on-time complaint turnaround %.

- [ ] **Visualizations & Filtering:**
  - Verify **Monthly Revenue Trend Bar Chart** displays Rent Collected vs Pending Rent with tooltips.
  - Verify **Occupancy Trend Area Chart** renders smooth capacity curves over time.
  - Verify **Property Performance Bar Chart** compares revenue and occupancy rate across listings.
  - Verify **Maintenance SLA Pie/Donut Chart** categorizes tickets by category and priority.
  - Change period filter (`7 Days`, `30 Days`, `90 Days`, `12 Months`) and verify chart data updates dynamically.
  - Filter by specific property using dropdown and verify metrics update cleanly.

- [ ] **Insight Cards & Performance Matrix:**
  - Verify dynamic smart insight cards display real actionable text based on data.
  - Verify **Property Performance Matrix Table** lists properties with occupancy, revenue, ratings, active residents, and SLA scores.

---

## 2. USER / TENANT ANALYTICS

- [ ] **Login & Navigation:**
  - Login as a registered Tenant (`USER` role).
  - Navigate to the Tenant Portal (`/user/dashboard`).
  - Click on the **"Spending & Insights"** tab.

- [ ] **KPI & Spending Breakdown:**
  - Verify **Total Rent Paid**, **Electricity Cost**, and **Total Spending** cards match ledger invoices.
  - Verify **Active Stay** displays current PG/Hostel title and room details.
  - Verify **Maintenance Tickets** displays total and resolved complaint counts.

- [ ] **Visualizations & Insights:**
  - Verify **Monthly Spending Trend Area Chart** renders monthly expenditure history.
  - Verify **Rent vs Electricity Stacked Bar Chart** accurately breaks down base rent vs sub-metered power charges.
  - Verify tenant insight cards reflect monthly run rate, power cost %, and landlord SLA speed.

---

## 3. ADMIN PLATFORM ANALYTICS

- [ ] **Login & Navigation:**
  - Login as a Platform Regulator (`ADMIN` role).
  - Navigate to Trust Control (`/admin/dashboard`).
  - Select **"Platform Analytics & Telemetry"** tab.

- [ ] **Platform Telemetry & Growth:**
  - Verify platform KPI cards: Users, Owners, Properties, Verified/Pending, Bookings, GMV, Reviews, Tickets, SLA Rate.
  - Verify **User & Landlord Acquisition Area Chart** tracks tenant and landlord registrations.
  - Verify **Platform GMV & Booking Volume Bar Chart** displays monthly GMV and reservations.

- [ ] **Audit Tables & Landlord SLA Ranking:**
  - Verify **Top Performing Accommodations Table** ranks listings by composite occupancy, ratings, and revenue.
  - Verify **Landlord SLA Compliance Audit Table** ranks landlords by breach rate %, ticket volume, and avg fix time.
  - Verify **Maintenance Category Telemetry** displays ticket counts and SLA breach alerts per category.

---

## 4. SECURITY & RBAC TESTING

- [ ] **Cross-Owner Access Protection:**
  - Attempt querying `/api/v1/analytics/owner/overview?propertyId=<another_owner_property_id>` as Owner 2.
  - Confirm API returns `404 Not Found` with message *"Property not found or does not belong to this owner"*.

- [ ] **Cross-User Access Protection:**
  - Verify Tenant A cannot view Tenant B's spending or tickets.

- [ ] **Role Protection:**
  - Attempt accessing `/api/v1/analytics/admin/overview` as a `USER` -> Confirm `403 Forbidden`.
  - Attempt accessing `/api/v1/analytics/admin/overview` as an `OWNER` -> Confirm `403 Forbidden`.
  - Attempt accessing `/api/v1/analytics/user/overview` as an `OWNER` -> Confirm `403 Forbidden`.

- [ ] **Unauthenticated Access:**
  - Attempt accessing any `/api/v1/analytics/*` route without Bearer token -> Confirm `401 Unauthorized`.

---

## 5. TECHNICAL & RESPONSIVENESS QA

- [ ] **Browser Console & Network:**
  - Open Chrome Developer Tools Console -> Confirm ZERO JavaScript errors or unhandled promise rejections.
  - Inspect Network tab -> Confirm no duplicate API calls or `404`/`500` errors on analytics endpoints.

- [ ] **Responsive Design:**
  - Test dashboards on Desktop (1920x1080), Tablet (768x1024), and Mobile (375x812).
  - Verify charts resize fluidly inside `ResponsiveContainer`.
  - Verify tab bars and KPI cards wrap gracefully without text clipping.

- [ ] **Production Build:**
  - Run `npm run build` in `client/` directory and confirm build completes with zero compilation errors.
