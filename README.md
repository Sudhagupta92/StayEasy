# StayEasy — Trusted Accommodation Discovery & Booking Platform

> **Current Phase: Phase 10 — Advanced Analytics & Insights Dashboard**

StayEasy is a production-grade full-stack MERN web application built for students, working professionals, and newcomers moving to a new city. It solves the critical problem of finding accommodations by providing **complete rent & expense transparency, real resident experiences, guaranteed SLA maintenance tracking, and enterprise-grade real-time analytics telemetry** before and during residency.

---

## 🎯 Problem Statement

Traditional accommodation discovery platforms suffer from several critical shortcomings:
1. **Hidden Costs & Electricity Billing Spikes:** Advertised rent often hides high sub-metered power rates (e.g. ₹15–₹18/unit), maintenance charges, and non-refundable deposits.
2. **Fabricated & Biased Reviews:** Anyone can leave 5-star ratings, allowing dishonest PG owners to deceive students.
3. **Withheld Security Deposits:** Tenants frequently struggle to receive deposit refunds upon checkout.
4. **Owner Promises vs. Living Reality:** Wi-Fi speed, cleaning routines, food quality, and complaint resolution times rarely match what was promised.
5. **Unresolved Complaints & Ignored Tenants:** Broken geysers, leaking pipes, or down Wi-Fi left ignored with zero accountability.
6. **Lack of Operational & Financial Telemetry:** Landlords, tenants, and platform regulators lack clear visual insight into occupancy, rent collections, power usage trends, and SLA turnaround.

StayEasy establishes a **StayEasy Trust Score**, physical audits, lifecycle-verified resident reviews, automated complaint SLA tracking, and role-based real-time analytics to eliminate these problems.

---

## 🚀 Key Features Planned Across Phases

* 🔍 **PG / Hostel / Flat Discovery:** Advanced search by college, office hub, sharing type (1/2/3/4-seater), and gender preferences.
* ⚡ **Complete Rent & Expense Transparency:** Exact disclosure of sub-meter electricity unit prices, food fees, and deposit refund terms.
* 🛡️ **StayEasy Trust Score:** Multi-factor trust rating computed from physical audits, resident reviews, food quality, and owner responsiveness.
* ⚖️ **Owner Promise vs. Reality:** Direct algorithmic comparison between owner claims and verified resident experience.
* 📝 **Verified Resident-Only Reviews:** Review eligibility unlocked strictly after completed stay lifecycle (`Booked` → `Checked In` → `Checked Out`).
* 🍲 **Food Quality & Menu Ratings:** Honest weekly meal reviews rated directly by dining residents.
* 🛠️ **Digital Maintenance & SLA Complaint Tracking:** Track complaint turnaround times that directly impact the owner's trust badge.
* 💳 **Direct Zero-Brokerage Booking:** Room/bed reservation with escrow deposit protection.
* 📊 **Enterprise Advanced Analytics & Insights:** Dynamic MongoDB data visualizations using Recharts for Tenants (`USER`), Landlords (`OWNER`), and Regulators (`ADMIN`).

---

## 📊 Phase 10: Advanced Analytics & Insights Dashboard

### 🔌 Analytics API Endpoints (`/api/v1/analytics`)

#### 🏢 Landlord Analytics (`OWNER`)
* `GET /api/v1/analytics/owner/overview` — High-level KPI overview (occupancy, total/occupied/available beds, rent collected, pending rent, ratings, SLA score).
* `GET /api/v1/analytics/owner/revenue` — Monthly revenue breakdown (Rent Collected vs Pending Rent over 7d, 30d, 90d, 12m).
* `GET /api/v1/analytics/owner/occupancy` — Monthly occupancy capacity utilization trends.
* `GET /api/v1/analytics/owner/properties` — Property-wise performance comparison matrix (Revenue, Occupancy, Rating, Residents, SLA compliance).
* `GET /api/v1/analytics/owner/maintenance` — Complaint turnaround SLA metrics (categories, priorities, response/resolution averages).

#### 🏠 Tenant Analytics (`USER`)
* `GET /api/v1/analytics/user/overview` — High-level stay & spending overview (total rent paid, pending rent, electricity costs, active stay status).
* `GET /api/v1/analytics/user/spending` — Monthly spending breakdown (Base Rent vs Sub-metered Electricity vs Other Fees).
* `GET /api/v1/analytics/user/maintenance` — Complaint ticket resolution speed & landlord SLA compliance status.

#### 🛡️ Platform Analytics (`ADMIN`)
* `GET /api/v1/analytics/admin/overview` — Platform-wide administrative overview (Users, Owners, Properties, Bookings, GMV, SLA compliance).
* `GET /api/v1/analytics/admin/trends` — Platform growth & monthly trend aggregation (New users, owners, properties, bookings, revenue, complaints).
* `GET /api/v1/analytics/admin/top-properties` — Top performing properties ranked by composite occupancy, ratings, and GMV.
* `GET /api/v1/analytics/admin/maintenance` — Platform-wide complaint category distribution, breach rates, and landlord SLA compliance ranking.

---

## 💻 Technology Stack

### Frontend
- **Framework:** React.js (v18) with Vite
- **Styling:** Tailwind CSS (v3) with custom design system
- **Routing:** React Router DOM (v6)
- **Icons:** Lucide React
- **HTTP Client:** Axios (centralized instance with interceptors)

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js (REST API Architecture)
- **Database:** MongoDB with Mongoose ODM
- **Security:** Helmet, CORS, Express Rate Limit, Centralized Error Handling, Morgan Logger, dotenv

---

## 📂 Project Structure

```text
stayeasy/
│
├── client/                     # Frontend React + Vite Application
│   ├── public/                 # Static assets & brand favicon
│   │   └── favicon.svg
│   ├── src/
│   │   ├── assets/             # Brand logos & media assets
│   │   ├── components/
│   │   │   ├── common/         # Navbar, Footer, Button, Badge, Card, Container
│   │   │   └── ui/             # HeroSection, TrustHighlights, HowItWorks, DemoProperties, CtaSection
│   │   ├── constants/          # Navigation, Demo listings, Trust pillars, Role constants
│   │   ├── context/            # AuthContext (state foundation for Phase 2)
│   │   ├── layouts/            # MainLayout, DashboardLayout
│   │   ├── pages/
│   │   │   ├── auth/           # LoginPage, RegisterPage
│   │   │   ├── public/         # HomePage, PropertiesPage, AboutPage, ContactPage, NotFoundPage
│   │   │   ├── user/           # UserDashboard (Tenant preview)
│   │   │   ├── owner/          # OwnerDashboard (Landlord preview)
│   │   │   └── admin/          # AdminDashboard (Platform moderation preview)
│   │   ├── routes/             # AppRoutes.jsx (React Router configuration)
│   │   ├── services/           # api.js (Axios client), healthService.js
│   │   ├── utils/              # formatters.js (currency, scores)
│   │   ├── App.jsx             # Root React component
│   │   ├── index.css           # Tailwind directives & design tokens
│   │   └── main.jsx            # React DOM entrypoint
│   ├── index.html              # HTML shell with Google Fonts
│   ├── package.json            # Client dependencies
│   ├── postcss.config.js       # PostCSS config
│   ├── tailwind.config.js      # Tailwind theme configuration
│   ├── vite.config.js          # Vite build config
│   ├── .env.example            # Client env template
│   └── .env                    # Local client environment variables
│
├── server/                     # Backend Express REST API
│   ├── config/                 # db.js (Mongoose connection), env.js (Env validation)
│   ├── constants/              # roles.js (USER, OWNER, ADMIN & lifecycle enums)
│   ├── controllers/            # health.controller.js (Health & DB status)
│   ├── middleware/             # errorHandler.js, notFoundHandler.js, rateLimiter.js, requestLogger.js
│   ├── models/                 # User.js, Property.js, index.js (Entity roadmap)
│   ├── routes/                 # api.js (Master /api/v1 router), health.routes.js
│   ├── utils/                  # apiResponse.js (standardized responses), logger.js
│   ├── app.js                  # Express app setup & security middlewares
│   ├── server.js               # HTTP server lifecycle & DB connection
│   ├── package.json            # Server dependencies
│   ├── .env.example            # Server env template
│   └── .env                    # Local server environment variables
│
├── .gitignore                  # Git ignore rules
├── package.json                # Monorepo management scripts
└── README.md                   # Project documentation
```

---

## ⚙️ Environment Setup

### 1. Backend (`server/.env`)
Create a `.env` file in the `server/` directory (or copy from `server/.env.example`):

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/stayeasy
CLIENT_URL=http://localhost:5173
JWT_SECRET=stayeasy_dev_secret_key_2026_jwt
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
```

### 2. Frontend (`client/.env`)
Create a `.env` file in the `client/` directory (or copy from `client/.env.example`):

```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 🛠️ Installation & Run Commands

### 1. Install Dependencies

You can install all dependencies from the root directory:

```bash
# Install root, server, and client dependencies
npm install
npm run install:all
```

Or install them individually:

```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

---

### 2. Start Backend Server

```bash
# From root:
npm run dev:server

# Or from server directory:
cd server
npm run dev
```

Backend will start at: `http://localhost:5000`  
Health check endpoint: `http://localhost:5000/api/v1/health`

---

### 3. Start Frontend Client

```bash
# From root:
npm run dev:client

# Or from client directory:
cd client
npm run dev
```

Frontend will start at: `http://localhost:5173`

---

### 4. Run Both Concurrently

```bash
# From root:
npm run dev
```

---

## 🩺 Health Check API Verification

The backend exposes a health endpoint at `GET /api/v1/health`:

**Request:**
```bash
curl http://localhost:5000/api/v1/health
```

**Response:**
```json
{
  "success": true,
  "message": "StayEasy API is running",
  "data": {
    "app": "StayEasy REST API",
    "version": "1.0.0",
    "phase": "Phase 1 - Foundation & Architecture",
    "environment": "development",
    "uptimeSeconds": 42,
    "database": {
      "state": "connected",
      "isConnected": true,
      "host": "127.0.0.1",
      "name": "stayeasy"
    }
  },
  "timestamp": "2026-08-19T19:35:00.000Z"
}
```

---

## 🗺️ Multi-Phase Roadmap

| Phase | Phase Title | Status |
|---|---|---|
| **Phase 1** | **Project Foundation & Architecture** | **✅ Completed** |
| **Phase 2** | **Authentication, Authorization & User Profiles (JWT + RBAC)** | **✅ Completed** |
| **Phase 3** | **Property & Room Management (Landlord Catalog & Verification)** | **✅ Completed** |
| **Phase 4** | **Search, Filters & Transparent Living Cost Engine** | **✅ Completed** |
| **Phase 5** | **Room / Bed Booking & Deposit Escrow** | **✅ Completed** |
| **Phase 6** | **Stay Lifecycle & Digital Rent Ledger** | **✅ Completed** |
| **Phase 7** | **Verified Resident Reviews & Food Quality Ratings** | **✅ Completed** |
| **Phase 8** | **Notifications & Communication System** | **✅ Completed** |
| **Phase 9** | **Maintenance Tickets & Complaint SLA Management** | **✅ Completed** |
| **Phase 10** | **Advanced Analytics & Insights Dashboard** | **✅ Completed** |
| **Phase 11** | **AI-Powered Smart Recommendations & Predictions** | **✅ Completed** |
| **Phase 12** | **Integrated Financial Payments Gateway & Real-Time Wallet / Escrow Ledger** | **✅ Completed** |
| **Phase 13** | **Production Hardening & Final Integration** | **✅ Completed** |

---

## 🔒 Phase 13: Production Hardening & Final Integration Architecture

StayEasy Phase 13 represents the enterprise production hardening and final integration tier:

### ⚙️ Production Hardening & Security Features:
1. **Python AI Microservice CORS Security**:
   - Explicit origin validation (`CLIENT_URL`, `http://localhost:5173`, `http://localhost:5000`) for Starlette/FastAPI CORS middleware when credentials are enabled.
2. **Centralized Mongoose Error Handling**:
   - `errorHandler.js` formats Mongoose `CastError` (invalid resource ID), `ValidationError`, and `MongoServerError` duplicate keys (code 11000) into clean `400 Bad Request` responses without exposing internal 500 stack trace details.
3. **Notification Entity Type Enum Coverage**:
   - Notification schema extended to support `RENT_LEDGER` and `TRANSACTION` entity types, eliminating notification validation warnings during billing and payment triggers.
4. **Production Secrets Safety**:
   - Explicit environment check logging security warnings if production environment is launched with fallback secrets.
5. **Full System Verification**:
   - 13 comprehensive automated test suites covering Phases 1–13 with 100% pass rate.
   - Production Vite client build verified (`dist/` bundle generated with zero errors).

---

## 📄 License & Notes
* All property listings, transactions, notifications, and predictions displayed during Phase 1-13 are powered by real MongoDB aggregation pipelines, financial ledgers, and ML inference models.
* Developed for the StayEasy student and professional housing ecosystem.
