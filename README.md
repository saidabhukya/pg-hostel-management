# SRI RAM PG

A modern, full-stack **Hostel Web Application** designed for SRI RAM PG (Opposite Vignan University, Vadlamudi) featuring responsive layouts (Desktop, Tablet, Mobile), joining-date based fee cycles, and student residency management.

---

## 🏢 Project Overview

**SRI RAM PG** is built for hostel owners and student residents. It features:

- 🏛️ **College Portal Aesthetic**: Red (`#dc2626`), White (`#ffffff`), Dark/Near-Black (`#0f172a`), and Light Gray (`#f8fafc`).
- 🌗 **Light & Dark Theme**: Toggle in header with persistent `localStorage` storage.
- 🎓 **Dedicated College Logo Integration**: Centered on login screen and pinned top-left on navigation bars preserving strict aspect ratio.
- 👥 **Dual-Role Portals**:
  - **Admin / Hostel Owner Portal**: Complete control over students, 5 floors, 50 rooms, 250 beds, fees, expenses, complaints, visitors, mess menus, notices, and financial reports.
  - **Student Resident Portal**: Personal dashboard, room/bed assignment, personalized fee cycles, instant PDF receipts, complaint logging, leave requests, and daily mess schedule.
- 📅 **Joining-Date Based Fee Cycles (Non-Calendar Billing)**: Each student has an individualized billing cycle anchored to their admission date (e.g., Joining on `16-09-2026` yields cycles `16-09-2026 → 15-10-2026`, `16-10-2026 → 15-11-2026`, with auto-calculated next due dates).
- 🛏️ **Visual Hostel Matrix (50 Rooms / 250 Beds)**: 5 floors (5F down to 1F) with 10 rooms per floor and 5 beds per room. Interactive room inspection reveals real-time bed statuses (Green = Available, Red = Occupied, Orange = Maintenance).
- 🧾 **Official Receipts & jsPDF Export**: Auto-generated receipts with transaction IDs, itemized breakdowns, authorized seal, and instant print/PDF downloads.
- 🤖 **Modular AI Hostel Assistant**: Real-time contextual assistant answering resident questions (*"When is my next fee due?"*, *"What is today's menu?"*, *"What are the curfew hours?"*).
- 📊 **9 Comprehensive Reports**: Exportable to CSV/Excel, printable, and downloadable as formatted PDF documents.

---

## 🔑 Demo Login Credentials

| Role | Username / ID | Password | Access / Capabilities |
| :--- | :--- | :--- | :--- |
| **Hostel Admin (Warden)** | `admin` | `admin123` | Full administrative control, all 5 floors, reports, finances |
| **Resident Student (Ravi Kumar)** | `2024IT123` | `student123` | Room 205, Bed 3, joining cycle fee dues, download receipts |

*(Quick-fill demo buttons are also embedded on the login page for instant one-click sign-in).*

---

## 📁 Complete Folder Structure

```text
pg/
├── package.json                    # Project dependencies and run scripts
├── .env                            # Active environment configuration
├── .env.example                    # Sample environment variables
├── README.md                       # Comprehensive system documentation
├── src/
│   ├── server.js                   # Express server entrypoint & API router
│   ├── config/
│   │   ├── config.js               # Environment config loader
│   │   └── db.js                   # Universal DB layer (MySQL pool + SQLite auto-fallback)
│   ├── database/
│   │   ├── schema.sql              # Clean MySQL 8.0 DDL relational schema (16 tables)
│   │   ├── seeds.sql               # Standalone SQL sample seeds
│   │   ├── init.js                 # Automatic schema migration runner
│   │   └── seed.js                 # Database populator (50 rooms, 250 beds, 183 students)
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification and role-based guards (Admin/Student)
│   │   └── upload.js               # Multer file upload handler with MIME validation
│   ├── utils/
│   │   └── feeCycleCalculator.js   # Joining-date fee cycles and reminder math
│   ├── routes/
│   │   ├── auth.js                 # Login, session validation, password reset
│   │   ├── dashboard.js            # 8 KPI metrics & Chart.js data streams
│   │   ├── rooms.js                # 5-floor structure, rooms, and bed statuses
│   │   ├── students.js             # Student CRUD, cascading bed allocations
│   │   ├── fees.js                 # Joining-date fee ledger & automated reminders
│   │   ├── payments.js             # Payment records, receipt generator
│   │   ├── complaints.js           # Maintenance grievance tickets & photo uploads
│   │   ├── visitors.js             # Visitor gate log & check-in/out
│   │   ├── mess.js                 # 7-day meal schedule & daily specials
│   │   ├── expenses.js             # Operating expenses & net income calculations
│   │   ├── reports.js              # 9 comprehensive reports with export formatting
│   │   ├── announcements.js        # Noticeboard bulletins & broadcasts
│   │   ├── leaveRequests.js        # Student leave applications & approvals
│   │   ├── notifications.js        # Real-time notification center
│   │   ├── aiAssistant.js          # Context-aware AI hostel assistant
│   │   └── settings.js             # Hostel parameters & curfew rules
│   └── tests/
│       └── test_all_endpoints.js   # Automated API verification test suite
└── public/                         # Modern frontend Single Page Application (SPA)
    ├── index.html                  # HTML5 shell with CDN libraries (Chart.js, jsPDF, Lucide)
    ├── assets/
    │   └── images/
    │       ├── college-logo.svg    # High-resolution vector academic crest
    │       ├── college-logo.png    # PNG format college logo
    │       ├── hostel-illustration.svg # Architectural campus illustration for login
    │       ├── default-avatar.png  # User profile placeholder
    │       └── default-student.png # Student avatar placeholder
    ├── css/
    │   ├── theme.css               # Color tokens (Red, Dark, Light Gray), Dark/Light variables
    │   ├── styles.css              # KPI cards, room matrix, tables, modals, buttons
    │   └── responsive.css          # Mobile table-to-card transformations & drawers
    ├── js/
    │   ├── api.js                  # Fetch client with automatic Bearer JWT headers
    │   ├── utils.js                # Currency (INR), date formatting, CSV exports
    │   ├── app.js                  # Central SPA hash router & session lifecycle
    │   ├── components/
    │   │   ├── header.js           # Global search, notification bell, theme toggle
    │   │   ├── sidebar.js          # Collapsible responsive sidebar with college logo
    │   │   ├── notificationCenter.js # Real-time unread popover drawer
    │   │   ├── modal.js            # Animated modal dialog manager
    │   │   └── toast.js            # Slide-in toast alerts
    │   └── pages/
    │       ├── login.js            # Split desktop login with demo quick-actions
    │       ├── adminDashboard.js   # 8 KPI cards, occupancy & P&L Chart.js charts
    │       ├── hostelStructure.js  # 5-Floor visual room grid (501..110)
    │       ├── roomDetailModal.js  # Bed 1 to 5 status inspection & transfers
    │       ├── addStudentModal.js  # Cascading Floor->Room->Bed admission form
    │       ├── students.js         # Student directory, filtering & CSV export
    │       ├── studentProfile.js   # 5-Tab detailed student profile & ledger
    │       ├── fees.js             # Date-anchored cycles, next due dates, reminders
    │       ├── payments.js         # Transaction entries & payment methods
    │       ├── receiptModal.js     # Printable official receipt & jsPDF generator
    │       ├── complaints.js       # Maintenance grievances & workflow statuses
    │       ├── visitors.js         # Gate entry/exit log & relative visits
    │       ├── mess.js             # Today's menu, 7-day routine & food feedback
    │       ├── expenses.js         # Expense categorization & profit-loss metrics
    │       ├── reports.js          # 9 audit reports with PDF/CSV export
    │       ├── announcements.js    # Administrative notices & alerts
    │       ├── leaveRequests.js    # Overnight passes & parent verification
    │       ├── aiAssistant.js      # Natural language assistant modal
    │       ├── studentDashboard.js # Resident personal housing portal
    │       └── settings.js         # Hostel settings & credential management
```

---

## ⚙️ Installation & Setup Instructions

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v20.18.0)
- **npm** v9+
- Optional: **MySQL** 8.0+ / MariaDB (e.g. XAMPP, WampServer, Docker, or native service).

### 2. Clone or Navigate to Directory
```bash
cd c:\Users\asus\Downloads\pg
```

### 3. Install Dependencies
```bash
npm install
```

---

## 🗄️ Database Setup Instructions

The application features a **dual-engine resilient database architecture**:
1. **MySQL 8.0 (Default / Production Mode)**: Uses `mysql2/promise` connection pooling with parameterized SQL queries.
2. **Embedded Relational Fallback (Zero-Config / Development Mode)**: If MySQL is not currently running or unreachable on `localhost:3306`, the application automatically boots an embedded SQLite relational database (`src/database/hostel.sqlite`) with the exact same 16 relational tables and schema rules. This ensures the application works immediately out-of-the-box without manual database creation!

### Option A: Using MySQL

1. Open your MySQL client (MySQL Workbench, phpMyAdmin, or terminal).
2. Configure `.env` with your MySQL credentials:
   ```env
   DB_CLIENT=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=pg_hostel_db
   ```
3. Initialize the database schema and sample data:
   ```bash
   npm run seed
   ```
   *(Alternatively, run `mysql -u root -p < src/database/schema.sql` followed by `mysql -u root -p pg_hostel_db < src/database/seeds.sql`).*

### Option B: Zero-Config Embedded Relational Mode (Immediate Run)
To run instantly without setting up MySQL:
1. Simply ensure `DB_CLIENT=sqlite` in `.env` (or leave it as `mysql`; if MySQL is not running, it automatically falls back to SQLite).
2. Seed the database with one command:
   ```bash
   npm run seed
   ```

---

## 🚀 Running the Application

### Start the Server (Serves both Backend API and Frontend Portal)
```bash
npm start
```

For live development mode with auto-reload:
```bash
npm run dev
```

### Open in Browser
Open your browser and navigate to:
```text
http://localhost:5000
```

---

## 🧪 Automated Test Suite Verification

Run the comprehensive endpoint verification script to test authentication, 250-bed structure, Ravi Kumar's joining-date cycle, payments, receipts, and AI assistant:
```bash
node src/tests/test_all_endpoints.js
```

---

## 🌟 Key Functional Features Demonstrated

### 1. Joining-Date Billing Cycles (Non-Calendar Billing)
- When student **Ravi Kumar** joined on `16-09-2026`:
  - **Cycle 1**: `16-09-2026 → 15-10-2026` (Due: `15-10-2026`, Paid: `13-10-2026` via UPI, Receipt: `REC-2026-0001`).
  - **Cycle 2**: `16-10-2026 → 15-11-2026` (Due: `15-11-2026`, Status: `pending`).
  - **Next Due Notice**: Displayed as `15-11-2026` with visual badges (🟢 Paid, 🟡 Due Soon within 7 days, 🔴 Due Today, 🔴 Overdue).

### 2. 5-Floor / 50-Room / 250-Bed Matrix
- **5 Floors** (1F to 5F), each with 10 rooms (101-110, 201-210, 301-310, 401-410, 501-510).
- Opening **Room 205**:
  - Bed 1: `Occupied` (Amit Sharma)
  - Bed 2: `Occupied` (Rahul Verma)
  - Bed 3: `Occupied` (Ravi Kumar)
  - Bed 4: `Available`
  - Bed 5: `Available`
- Status indicators: Green = Available, Red = Occupied, Orange = Maintenance.

### 3. Financial Metrics Breakdown
- **Total Beds**: 250
- **Occupied Beds**: 183 (73.2% occupancy)
- **Available Beds**: 67
- **Fees Collected**: ₹11,90,000 (170 cycles paid @ ₹7,000)
- **Pending Fees**: ₹91,000 (13 cycles pending @ ₹7,000)
- **Hostel Expenses**: ₹3,20,000 (Electricity, water, 1 Gbps internet, mess food, salaries, repairs)
- **Net Operational Income**: ₹8,70,000 (`Income - Expenses`)

### 4. Official Receipts & PDF Downloads
- Click **Receipt** on any payment to open the institutional invoice.
- Features college logo, student details, room/bed, period covered, payment mode, transaction ID, and next due date.
- One-click **Print Receipt** and **Download PDF Receipt** via client-side jsPDF.

---

## 🏢 Multi-Hostel SaaS Expansion Architecture

The system is engineered for multi-tenant scalability:
1. **Tenant Isolation**: Add `hostel_id` foreign keys to `floors`, `rooms`, `beds`, `students`, `expenses`, and `settings`.
2. **Subdomain Routing**: Support tenant discovery via subdomains (e.g., `sunrise.hostelportal.com`, `greenvalley.hostelportal.com`).
3. **Owner Roles**: Introduce `superadmin` and `hostel_owner` roles with tiered billing packages.
