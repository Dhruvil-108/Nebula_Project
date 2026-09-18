# Nebula — Business Operations Hub

**Project Documentation**

---

## 1. Overview

**Nebula** is a multi-tenant Business Operations Platform that combines **CRM**, **HRMS**, and supporting business modules (Recruitment, Expenses, Inventory, Analytics) into a single web application. Organizations sign up once, get a dedicated tenant workspace, invite team members with role-based access, and manage both customer pipelines and internal HR operations from one dashboard.

| | |
|---|---|
| **Project name** | Nebula Business Operations Hub |
| **Architecture** | Client–server SPA + REST API, multi-tenant (per-organization data scoping) |
| **Backend** | Node.js + Express.js + MongoDB (Mongoose) — `Backend/` (`nebula-backend`) |
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS — `Frontend/` (`nebula-frontend`) |
| **Auth** | JWT access + refresh tokens (rotation), bcrypt password hashing |
| **API Docs** | Swagger UI served at `/api/v1/docs` (OpenAPI JSON at `/api/v1/docs.json`) |

---

## 2. Tech Stack

### Backend (`Backend/`)
| Technology | Purpose |
|---|---|
| Node.js 18+ / Express 4 | HTTP API server (CommonJS) |
| MongoDB 6+ / Mongoose 8 | Database & ODM, transactions for atomic signup |
| jsonwebtoken | Access/refresh token issuing & verification |
| bcryptjs | Password hashing (12 rounds) + refresh-token hashing |
| helmet | Security headers |
| cors | Origin-locked CORS (`FRONTEND_ORIGIN`) |
| express-rate-limit | Global (200 req/15 min) + strict auth-route limits |
| morgan | Dev request logging |
| swagger-jsdoc + swagger-ui-express | Auto-generated interactive API docs |
| validator | Email/format validation |
| dotenv | Environment configuration |
| nodemon (dev) | Hot-reload during development |

### Frontend (`Frontend/`)
| Technology | Purpose |
|---|---|
| React 19 + TypeScript | UI layer |
| Vite 6 | Dev server & bundler (dev proxy `/api` → `localhost:5000`) |
| React Router 7 | Client-side routing with protected/public/super-admin route guards |
| TanStack React Query 5 | Server-state caching (5 min stale time, 1 retry) |
| Axios | HTTP client with token injection & silent 401 refresh |
| Tailwind CSS 3 + PostCSS | Styling (orange/white brand theme) |
| framer-motion | Animations |
| recharts | Dashboard charts |
| lucide-react | Icons |
| react-toastify | Toast notifications |
| @dnd-kit/core | Drag & drop (Kanban pipeline) |
| clsx + tailwind-merge | Conditional class helpers |

---

## 3. Key Features

### 3.1 Authentication & Organization Onboarding
- **One-step signup wizard** (frontend 5-step flow): Account → Organization → Focus areas → Team invites → Review.
- Backend creates **Organization + super_admin user + pending invites atomically** in a single MongoDB transaction.
- **JWT pair**: short-lived access token (default 15 m, kept **only in memory** — XSS-safe) + refresh token (default 7 d, stored in `localStorage`).
- **Refresh token rotation**: raw tokens are never stored server-side; only a bcrypt hash per user. A mismatched token during refresh (possible theft) invalidates the whole session.
- **Silent session restore** on page load; axios response interceptor transparently refreshes on 401 and queues concurrent requests while refreshing.
- Audit logs written for all auth actions.

### 3.2 Multi-Tenancy & Security
- Every query goes through the **`scopedFilter` tenant helper**, guaranteeing `organizationId` scoping — no cross-org data leakage.
- `requireAuth` verifies the JWT, loads the live user record, rejects disabled accounts, and validates the token's org claim.
- Layered authorization:
  - **`requireRole(...roles)`** — static RBAC; `super_admin` always bypasses.
  - **`requireModuleAccess(module, action)`** — dynamic, per-organization **customizable permission matrix** stored in the `Permission` collection, with sensible role defaults as fallback.
- Rate limiting: 5 req/15 min on login/signup, 10 req/15 min on refresh.

### 3.3 Roles
`super_admin`, `admin`, `manager`, `hr`, `recruiter`, `sales`, `finance`, `inventory_manager`, `employee`, `intern`

- `super_admin` = the organization creator (never invitable).
- Permission matrix covers modules × actions: `view`, `create`, `edit`, `delete`, `approve` per module (`crm`, `hrms`, `recruitment`, `expenses`, `inventory`, `analytics`, `settings`).
- **Manage Permissions page** (super_admin only) edits the matrix live via `PUT /permissions`.

### 3.4 CRM Module
- **Leads** — pipeline stages (`new → contacted → qualified → proposal → negotiation → won/lost`), sources (website, referral, cold_call, social, event), lead→customer conversion.
- **Contacts & Companies** — full CRUD with search/pagination.
- **Deals** — Kanban pipeline board (drag & drop), amount, probability, expected close date, salesperson assignment.
- **Activities** — timeline of calls/notes/tasks linked to CRM entities.
- **CRM Summary** — aggregated stats for the CRM landing page.

### 3.5 HRMS Module
- **Employees** — profiles with employee code (unique per org), department, designation, manager hierarchy, employment type, status, skills; optional link to login account.
- **Employee Documents** — typed attachments (id_proof, certificate, offer_letter, contract, other).
- **Departments** — org structure CRUD.
- **Attendance** — check-in / check-out / break-in / break-out; one record per employee per day (unique index); tracks worked minutes, late flag, status (present, absent, half_day, on_leave, holiday, weekend); timezone-aware day boundaries (org timezone, default `Asia/Kolkata`); org-wide roster gated to manager/HR/admin inside the controller.
- **Leave Management** — leave types, per-employee balances, leave requests with approve/reject workflow (approver roles enforced).
- **Holidays** — per-org holiday calendar with auto-seeded standard holidays per year; upcoming-holidays widget.

### 3.6 User & Account Management
- **Account Creator page** (super_admin/admin/hr): provisions user accounts; HR is restricted to `employee`, `intern`, `recruiter` roles.
- **Profile**: view/edit own profile, upload/delete profile photo (one per user, re-upload replaces).

### 3.7 Dashboard
- Role-tailored, live metrics per organization: attendance roster (checked-in / on-break / checked-out counts), leave balances, upcoming holidays, monthly hours, role distribution — served by `GET /dashboard/stats`.

### 3.8 Module Placeholders
Recruitment, Expenses, Inventory, and Analytics have dedicated routes/pages with full RBAC wiring; their deep functionality is scaffolded ("coming soon") — the permission system, sidebar, and landing-page mocks are already in place.

---

## 4. Project Structure

```
├── Backend/
│   ├── package.json
│   ├── README.md                # Setup + API contract
│   ├── .env                     # Configuration (not committed)
│   └── src/
│       ├── server.js            # Entry point
│       ├── app.js               # Express app: helmet, CORS, rate limit, Swagger, route mounting
│       ├── config/
│       │   ├── db.js            # MongoDB connection
│       │   ├── roles.js         # Role constants (ROLES, ALL_ROLES, INVITABLE_ROLES)
│       │   └── swagger.js       # OpenAPI spec
│       ├── middleware/
│       │   ├── auth.js          # requireAuth — JWT verify + live user check
│       │   ├── rbac.js          # requireRole — static role gate
│       │   ├── moduleAccess.js  # requireModuleAccess — dynamic permission matrix
│       │   └── tenant.js        # scopedFilter — organizationId scoping helper
│       ├── models/              # 19 Mongoose models (see §6)
│       ├── controllers/         # 19 controllers (auth, CRM, HRMS, users, permissions…)
│       ├── routes/              # 9 route modules mounted under /api/v1/*
│       ├── utils/               # jwt, password, audit, attendanceUtils
│       └── test_attendance.js
│
└── Frontend/
    ├── package.json
    ├── vite.config.ts           # Port 5173, /api proxy → :5000
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.tsx / App.tsx   # Root: providers, router, route guards
        ├── contexts/
        │   └── AuthContext.tsx  # Session state, silent restore, login/logout
        ├── lib/
        │   ├── apiClient.ts     # Axios instance + token interceptors + silent refresh
        │   ├── crmApi.ts / hrmsApi.ts / profileApi.ts
        ├── hooks/               # useCrm, useHrms, useModuleAccess, usePermissions, useCrmModuleAccess
        ├── types/               # TS interfaces (user, organization, crm, hrms, attendance…)
        ├── components/
        │   ├── shell/           # AppShell, Sidebar, TopBar, UserMenu
        │   ├── auth/            # SignUpWizard (5 steps), SignInForm, AuthLayout
        │   ├── landing/         # Hero, ModuleShowcase, SecuritySection, Footer…
        │   ├── crm/             # KanbanBoard, Drawer, ActivityTimeline, StagePill…
        │   ├── hrms/            # Status pills, info tiles
        │   ├── dashboard/       # KPI cards, AttendanceCard, RequestLeaveModal…
        │   ├── permissions/     # PermissionGrid + cells + unsaved-changes bar
        │   ├── profile/ mockups/ ui/
        └── pages/
            ├── LandingPage, SignInPage, SignUpPage
            ├── DashboardPage, CrmPage, ProfilePage
            ├── AccountCreatorPage, ManagePermissionsPage
            ├── crm/             # Leads, Pipeline, Contacts, Companies, Deals
            ├── hrms/            # Employees, Attendance, Leave, Departments, Holidays, Documents
            └── modules/         # HrmsPage hub + Recruitment/Expenses/Inventory/Analytics stubs
```

---

## 5. API Reference (Summary)

Base URL: `http://localhost:5000/api/v1` — full interactive docs at **`/api/v1/docs`**.

### Auth (`/auth`) — public
| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Create org + super_admin + invites (atomic transaction) |
| POST | `/login` | Authenticate, returns token pair + user + org |
| POST | `/refresh` | Rotate refresh token, issue new pair |
| POST | `/logout` | Invalidate stored refresh hash |

### Users (`/users`)
| Method | Endpoint | Access |
|---|---|---|
| GET | `/me` | Any authenticated |
| GET | `/me/profile` | Any authenticated |
| GET/POST/DELETE | `/me/photo` | Any authenticated (profile photo) |
| GET / POST | `/` | super_admin, admin, hr (list / provision accounts) |

### CRM (`/crm`) — all gated by `requireModuleAccess('crm', …)`
- `/summary` — dashboard aggregates
- `/leads` CRUD + `POST /leads/:id/convert`
- `/contacts`, `/companies`, `/deals` (+ `/deals/pipeline`) — full CRUD
- `/activities` — list / create / update

### HRMS (`/hr`) — all gated by `requireModuleAccess('hrms', …)`
- `/summary` — HR KPIs
- `/employees` CRUD + `/employees/:id/documents` (upload/delete)
- `/departments` CRUD
- `/attendance/check-in|check-out|break-in|break-out|today|summary|roster`
- `/leaves/types|balance|requests` + `/leaves/requests/:id/approve|reject`
- `/holidays` CRUD + `/holidays/upcoming`

### Core (`/attendance`, `/leaves`, `/holidays`, `/dashboard`, `/permissions`)
- `/attendance/*` — personal check-in/out, breaks, today, summary (authenticated)
- `/leaves/balance`, `/leaves/requests` (create), approve/reject (manager/HR/admin)
- `/holidays/upcoming`
- `/dashboard/stats` — role-tailored live metrics
- `/permissions` — `GET /catalog`, `GET /`, `PUT /` (super_admin only)

### System
- `GET /api/v1/health` — `{ status: 'ok', service: 'nebula-api' }`

---

## 6. Data Models (MongoDB / Mongoose)

**Core / Auth**
- **Organization** — name, companySize, industry, primaryFocus (module interests), shiftStartTime, timezone, isActive, createdBy
- **User** — fullName, email (unique per org), passwordHash, role, organizationId, status (`active|invited|disabled`), refreshTokenHash (bcrypt hash only), lastLoginAt
- **Invite** — pending signup invitations (email + role)
- **AuditLog** — auth & admin action trail
- **Permission** — per-org permission matrix: (organizationId, role, module) unique → `enabled` + `actions[]`
- **ProfilePhoto** — one per user

**CRM**
- **Lead** — leadName, company, email, phone, source, industry, status (pipeline stage), owner, notes
- **Contact** — person record
- **Company** — account record
- **Deal** — dealName, companyId, contactId, amount, probability, expectedCloseDate, stage, salesperson
- **Activity** — CRM timeline entries

**HRMS**
- **Employee** — employeeCode (unique per org), fullName, email, phone, departmentId, designation, joiningDate, managerId, employmentType, status, skills, optional userId
- **EmployeeDocument** — docType, fileName, fileUrl, uploadedBy
- **Department** — org structure
- **AttendanceRecord** — (org, employee, date) unique; checkInAt, checkOutAt, breaks[], status, totalWorkedMinutes, isLate
- **LeaveType / LeaveBalance / LeaveRequest** — leave config, per-year balances, requests with pending/approved/rejected status
- **Holiday** — per-org holiday calendar (auto-seeded yearly)

> All tenant-scoped models carry an indexed `organizationId`; compound indexes support the common (org + entity) queries.

---

## 7. Frontend Architecture

- **Routing** (`App.tsx`): nested routes under `/dashboard` inside `AppShell` (sidebar + top bar layout).
  - Guards: `ProtectedRoute` (auth), `PublicRoute` (redirect to dashboard if logged in), `SuperAdminRoute` (`/permissions`), `AccountCreatorRoute` (super_admin/admin/hr).
- **Auth flow** (`AuthContext`): access token in memory only; refresh token in `localStorage` (`nebula_refresh_token`); silent restore on mount; global refresh-failure callback triggers logout + "session expired" toast.
- **Data fetching**: TanStack Query hooks (`useCrm`, `useHrms`, `usePermissions`, `useModuleAccess`) wrapping typed API modules (`crmApi`, `hrmsApi`, `profileApi`).
- **Module access on the client**: `useModuleAccess` mirrors the backend permission matrix so the UI hides/blocks actions the user's role can't perform (backend remains the source of truth).
- **Design system**: Tailwind with an orange/white brand theme, shared `ui/` primitives (Button, Input, Badge, NebulaLogo), consistent status pills, KPI cards, and drawers across modules.

---

## 8. Environment & Setup

### Backend
```bash
cd Backend
npm install
cp .env.example .env   # then fill in values
npm run dev            # http://localhost:5000
```

**Environment variables** (`.env`):
| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP port | 5000 |
| `MONGODB_URI` | MongoDB connection string | — |
| `JWT_ACCESS_SECRET` | Access-token signing secret | — |
| `JWT_REFRESH_SECRET` | Refresh-token signing secret (must differ) | — |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | 15m |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | 7d |
| `BCRYPT_ROUNDS` | bcrypt salt rounds | 12 |
| `FRONTEND_ORIGIN` | Allowed CORS origin | http://localhost:5173 |
| `NODE_ENV` | Environment | development |

### Frontend
```bash
cd Frontend
npm install
npm run dev            # http://localhost:5173 (proxies /api → :5000)
npm run build          # tsc -b && vite build
```
`VITE_API_URL` — set in production to point directly at the API (e.g. `https://api.example.com/api/v1`); in dev the Vite proxy handles it.

---

## 9. Security Summary

- bcrypt (12 rounds) password hashing; refresh tokens stored **only** as hashes.
- Access token never persisted client-side (memory only) — mitigates XSS token theft.
- Refresh-token rotation with replay detection → full session invalidation on mismatch.
- Origin-locked CORS + Helmet security headers.
- Layered RBAC: static roles **and** dynamic per-org permission matrix; super_admin bypass.
- Mandatory tenant scoping (`scopedFilter`) on every data query.
- Rate limiting on auth routes and globally; audit logging of auth/admin actions; disabled accounts rejected at the middleware level.

---

## 10. Current Status & Roadmap

**Implemented:** Auth & onboarding, multi-tenant RBAC + permission matrix UI, full CRM (leads, contacts, companies, deals/kanban, activities, summary), full HRMS (employees, documents, departments, attendance, leave, holidays), dashboard, account creator, profile & photo.

**Scaffolded / planned:** Recruitment, Expenses, Inventory, and Analytics modules (routes, permissions, and UI stubs exist), Settings & Organization pages (placeholders).

---

*Documentation generated September 2026 from the repository source.*
