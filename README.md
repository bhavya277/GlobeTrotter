# GlobeTrotter ✈️🗺️

**GlobeTrotter** is a premium, full-stack multi-city travel planning and itinerary management platform. Built with React, TypeScript, Express, and Prisma SQLite, GlobeTrotter enables travelers to craft multi-destination trips, explore global cities and activities, organize day-by-day schedules with HTML5 drag-and-drop, estimate and track budgets in real-time, and share public itineraries with complete privacy protection.

---

## 🌟 Implemented Features

### 🔐 1. Authentication & Security
- **Registration & Login**: Secure authentication with Bcrypt password hashing (`SALT_ROUNDS = 10`) and JWT token session management.
- **Forgot & Reset Password**: Secure password reset flow using single-use SHA-256 hashed reset tokens and generic account enumeration protection.
- **Role-Based & Ownership Security**: Server-side IDOR protection ensuring users can only view, edit, or delete their own trips, stops, activities, and expenses.
- **Fail-Fast Configuration**: Strict JWT secret validation, CORS origin verification, and 10MB payload size limits.

### 🌐 2. Travel Workspace & Dashboard
- **Live Telemetry**: Real-time user metrics including active upcoming trips, total logged expenses, saved destinations, and recent trip cards.
- **Signature Route Visualization**: Interactive multi-city route flow (e.g., `Ahmedabad → Udaipur → Jaipur → Jodhpur`).
- **Responsive Mobile Navigation**: Desktop header menu and fixed mobile bottom navigation bar (`Home`, `Trips`, `+ Plan`, `Explore`, `Profile`).

### 🗺️ 3. Multi-City Trip Planning & Itinerary Builder
- **Multi-City Wizard**: Create trips with start/end dates, description, target budget, and preferred currency (`INR`, `USD`, `EUR`, `GBP`).
- **City Stop Ordering**: Add and reorder ordered city stops with automatic date bounds validation.
- **HTML5 Drag-and-Drop Activity Reordering**: Drag activities up or down to reorder time slots with visual handles, real-time list updates, and transactional database persistence.
- **Time Slot Organization**: Categorize scheduled activities into Morning, Afternoon, and Evening time slots with custom notes and completion toggles.

### 💰 4. Dynamic Pre-Trip Budget Engine & Cost Tracking
- **Automatic Budget Estimation Engine**: Calculates estimated accommodation/stay, meals, transport, and activity costs based on city `costIndex` and stop durations.
- **Over-Budget Warning Banner**: Identifies primary overrun category sources and highlights days exceeding daily budget caps.
- **Expense Tracker**: Log individual expenses by category (Food, Transport, Stay, Activities, Shopping, Misc) with date and description logging.
- **Interactive Recharts Analytics**:
  - *Expense Category Distribution* (Pie Chart)
  - *Daily Spending Trend vs Target Budget* (Line Chart)
  - *City Stop Cost Breakdown* (Bar Chart)

### 📅 5. Trip Calendar & Timeline
- **Interleaved Itinerary Timeline**: Chronological day-by-day itinerary view with city stop headers and activity time badges.
- **Month Calendar Grid**: Full monthly calendar view mapping activities and daily costs per stop.

### 🔗 6. Public Itinerary Sharing & Copy Trip
- **Public Share URLs**: Read-only public share links (`/share/:token`) accessible without logging in.
- **Privacy Isolation**: Automatically strips private creator notes and expense records (`expenses: []`) for public non-owner viewers.
- **Copy Trip**: Clones public itineraries into standalone, independent trip records owned by the copying user.

### 🔍 7. Destination & Activity Catalog Search
- **City Search**: Browse global cities with keyword search, region, country, cost index (`₹₹` to `₹₹₹₹₹`), and popularity filters.
- **Activity Search**: Discover curated activities with search, category, cost, and `maxDuration` filters.
- **Saved Destinations**: Wishlist bookmarking with real-time saved destination counts.

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 18 & TypeScript
  - Vite
  - Tailwind CSS & Lucide Icons
  - Recharts (PieChart, LineChart, BarChart)
  - React Router v6
- **Backend**:
  - Node.js & Express.js (TypeScript)
  - Prisma ORM
  - SQLite Database (`dev.db`)
  - Zod Schema Validation
  - Bcrypt.js & JSON Web Tokens (JWT)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bhavya277/GlobeTrotter.git
   cd GlobeTrotter
   ```

2. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

3. **Database Initialization**:
   ```bash
   npm run db:push --prefix server
   npm run db:seed --prefix server
   ```

4. **Environment Variables**:
   Create a `.env` file inside the `server/` directory:
   ```env
   PORT=5000
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="globetrotter_production_jwt_secret_key_2026"
   ```

---

## 🏃 Running the Application

### Development Mode
Runs the Express backend server on `http://localhost:5000` and the Vite frontend on `http://localhost:5173`:
```bash
npm run dev
```

### Production Build
Builds the Vite frontend bundle for production deployment:
```bash
npm run build --prefix client
```

### Type Checking
Runs TypeScript `--noEmit` across both frontend and backend packages:
```bash
npm run type-check
```

---

## 🧪 Testing & Verification Suites

The codebase includes comprehensive automated test suites covering authentication, security hardening, and mandatory problem statement requirements:

- **Authentication Test Suite**:
  ```bash
  npx tsx server/src/testAuth.ts
  ```
- **Security Negative Hardening Audit (24/24 Tests)**:
  ```bash
  npx tsx server/src/testSecurityNegativeHardening.ts
  ```
- **25 Problem Statement Requirements Audit (25/25 Requirements)**:
  ```bash
  npx tsx server/src/verify25Requirements.ts
  ```

---

## 📂 Repository Structure

```
GlobeTrotter/
├── client/                     # Vite React Frontend SPA
│   ├── public/                 # Static assets (logo.png)
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Footer, RouteVisualization, etc.)
│   │   ├── context/            # AuthContext state provider
│   │   ├── pages/              # SPA Pages (Dashboard, ItineraryBuilder, TripBudget, etc.)
│   │   ├── services/           # API fetch client
│   │   ├── types/              # TypeScript data interfaces
│   │   └── utils/              # Currency formatters & helper functions
│   └── package.json
│
├── server/                     # Express TypeScript API Backend
│   ├── prisma/                 # Database schema & seeds
│   ├── src/
│   │   ├── controllers/        # Express API request handlers
│   │   ├── middleware/         # Auth, RBAC & error handling middleware
│   │   ├── routes/             # RESTful API route definitions
│   │   ├── utils/              # JWT, password hashing & math utilities
│   │   ├── testAuth.ts         # Auth test suite
│   │   ├── testSecurityNegativeHardening.ts # 24 security test cases
│   │   └── verify25Requirements.ts         # 25 PS verification checks
│   └── package.json
│
└── package.json                # Monorepo scripts
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
