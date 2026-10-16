# Nebula HUB — Recruitment (ATS) Module
## Full Implementation Plan & Technical Architecture Specification

---

## 1. Executive Summary & Vision

**Nebula Hub** currently provides modern, multi-tenant operations across **CRM** (Leads, Contacts, Companies, Deals, Activities) and **HRMS** (Employees, Attendance, Leaves, Departments, Holidays, Documents).

The **Recruitment Module (Applicant Tracking System — ATS)** is the vital bridge connecting external talent acquisition with internal organizational HRMS operations. It enables organizations to:
1. **Define and publish Job Openings** across departments with salary bands, hiring teams, and requirements.
2. **Track Candidates / Applicants** from initial sourcing through an interactive, drag-and-drop ATS Kanban pipeline.
3. **Schedule Multi-Round Interviews** with automated meeting coordination, panel assignment, and structured scorecard evaluations.
4. **Issue & Manage Job Offers** with compensation breakdowns and validity tracking.
5. **Execute 1-Click "Hire & Onboard"** that automatically converts hired candidates into active HRMS `Employee` records, seamlessly bridging Recruitment to Core HR.

This plan outlines the end-to-end architecture adhering strictly to the **Nebula Premium Light 2.0 theme**, strict multi-tenancy (`organizationId` scoping), dynamic permission matrix RBAC, and established code standards.

---

## 2. System Architecture & Multi-Tenancy Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEBULA FRONTEND (SPA)                             │
│       React 19 + TypeScript + Vite 6 + Tailwind CSS + Framer Motion         │
│  Theme: Premium Light 2.0 (Orange #f97316 / #ea580c, Warm Surface #FBF8F4) │
├─────────────────────────────────────────────────────────────────────────────┤
│  Recruitment Hub  │  Jobs View  │  ATS Kanban Board  │  Interviews & Offers │
└────────┬───────────────────┬──────────────┬──────────────────────┬──────────┘
         │                   │              │                      │
         ▼                   ▼              ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API Client & Hooks (TanStack Query 5)                    │
│      recruitmentApi.ts  ──►  useRecruitment.ts  ──►  useModuleAccess        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Axios HTTP + JWT (Auth Header)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NEBULA BACKEND (Express)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Middleware: requireAuth ──► scopedFilter ──► requireModuleAccess('recruitment')│
├─────────────────────────────────────────────────────────────────────────────┤
│ Routes: /api/v1/recruitment/*                                               │
│   ├── /jobs              ── jobOpeningController.js                         │
│   ├── /candidates        ── candidateController.js                          │
│   ├── /pipeline          ── recruitmentPipelineController.js                │
│   ├── /interviews        ── interviewController.js                          │
│   ├── /offers            ── offerController.js                              │
│   ├── /onboard-employee  ── hiringHrmsBridgeController.js                   │
│   └── /summary           ── recruitmentSummaryController.js                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Mongoose 8 (Multi-Tenant Scoped)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MONGODB DATABASE (Nebula DB)                        │
│   JobOpening  │  Candidate  │  Interview  │  JobOffer  │ RecruitmentActivity │
│          ▲                                                    │             │
│          └─────────────── Bridge Integration ─────────────────┴─────────────┤
│                       ──► Employee (HRMS Collection)                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy & Access Control
- **Tenant Scoping**: All queries automatically filter by `req.organizationId` through `scopedFilter`.
- **Dynamic RBAC**:
  - `super_admin`: Full bypass.
  - `admin`, `hr`: Full management (`view`, `create`, `edit`, `delete`, `approve`).
  - `recruiter`: Core recruitment management (`view`, `create`, `edit`, `approve`).
  - `manager`: Departmental recruitment participation & interview evaluations (`view`, `create`, `edit`).
  - `employee`: Assigned interview evaluations only (`view`).

---

## 3. Database Schema & Data Models (MongoDB / Mongoose)

The Recruitment engine introduces five cohesive, indexed collections in `Backend/src/models/`:

### 3.1 `JobOpening` (`JobOpening.js`)
Represents an open role or vacancy within the organization.

```javascript
const JOB_STATUSES = ['draft', 'published', 'on_hold', 'closed'];
const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'intern'];
const LOCATION_TYPES = ['remote', 'hybrid', 'on_site'];
const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'lead', 'executive'];

const jobOpeningSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    jobCode: {
      type: String, // e.g. "JOB-2026-001" (unique per org)
      required: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: 200,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    locationType: {
      type: String,
      enum: LOCATION_TYPES,
      default: 'hybrid',
    },
    location: {
      type: String, // City, Country or "Remote / Worldwide"
      default: '',
    },
    employmentType: {
      type: String,
      enum: EMPLOYMENT_TYPES,
      default: 'full_time',
    },
    experienceLevel: {
      type: String,
      enum: EXPERIENCE_LEVELS,
      default: 'mid',
    },
    salaryRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
      isPublic: { type: Boolean, default: false },
    },
    openPositions: {
      type: Number,
      default: 1,
      min: 1,
    },
    filledPositions: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: JOB_STATUSES,
      default: 'draft',
      index: true,
    },
    hiringManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedRecruiters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    description: { type: String, default: '' },
    requirements: { type: [String], default: [] },
    responsibilities: { type: [String], default: [] },
    skills: { type: [String], default: [], index: true },
    targetCloseDate: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes
jobOpeningSchema.index({ organizationId: 1, jobCode: 1 }, { unique: true });
jobOpeningSchema.index({ organizationId: 1, status: 1 });
jobOpeningSchema.index({ organizationId: 1, departmentId: 1 });
jobOpeningSchema.index({ organizationId: 1, createdAt: -1 });
```

---

### 3.2 `Candidate` (`Candidate.js`)
Represents an applicant linked to a job opening and tracked through the ATS stages.

```javascript
const CANDIDATE_STAGES = [
  'applied',
  'screening',
  'interview_round_1',
  'interview_round_2',
  'technical_assessment',
  'hr_round',
  'offer_sent',
  'hired',
  'rejected',
  'withdrawn'
];

const CANDIDATE_SOURCES = [
  'careers_page',
  'linkedin',
  'referral',
  'recruiter_outreach',
  'job_portal',
  'agency',
  'other'
];

const candidateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    candidateCode: {
      type: String, // e.g. "CAND-00104"
      required: true,
      trim: true,
      uppercase: true,
    },
    jobOpeningId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    currentCompany: { type: String, default: '' },
    currentDesignation: { type: String, default: '' },
    totalExperienceYears: { type: Number, default: 0 },
    portfolioUrl: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    resumeFileName: { type: String, default: '' },
    skills: { type: [String], default: [] },
    expectedSalary: { type: Number, default: 0 },
    noticePeriodDays: { type: Number, default: 30 },
    source: {
      type: String,
      enum: CANDIDATE_SOURCES,
      default: 'careers_page',
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    stage: {
      type: String,
      enum: CANDIDATE_STAGES,
      default: 'applied',
      index: true,
    },
    rating: {
      type: Number, // 1 to 5 stars
      min: 0,
      max: 5,
      default: 0,
    },
    tags: { type: [String], default: [] },
    notes: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    stageHistory: [
      {
        fromStage: String,
        toStage: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
    // If hired and converted to employee
    convertedEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    hiredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

candidateSchema.index({ organizationId: 1, candidateCode: 1 }, { unique: true });
candidateSchema.index({ organizationId: 1, jobOpeningId: 1, stage: 1 });
candidateSchema.index({ organizationId: 1, email: 1 });
candidateSchema.index({ organizationId: 1, createdAt: -1 });
```

---

### 3.3 `Interview` (`Interview.js`)
Manages scheduled evaluations, interview rounds, and scorecards.

```javascript
const INTERVIEW_TYPES = ['screening', 'technical', 'behavioral', 'managerial', 'culture_fit', 'final'];
const INTERVIEW_STATUSES = ['scheduled', 'completed', 'rescheduled', 'cancelled', 'no_show'];
const EVALUATION_DECISIONS = ['strong_hire', 'hire', 'neutral', 'do_not_hire', 'strong_do_not_hire'];

const interviewSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    jobOpeningId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      required: true,
    },
    title: {
      type: String, // e.g. "Round 2: System Architecture Review"
      required: true,
      trim: true,
    },
    roundType: {
      type: String,
      enum: INTERVIEW_TYPES,
      default: 'technical',
    },
    interviewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    scheduledStart: { type: Date, required: true },
    scheduledEnd: { type: Date, required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    meetingLink: { type: String, default: '' }, // e.g. Google Meet or Zoom
    location: { type: String, default: '' }, // Meeting room if on-site
    status: {
      type: String,
      enum: INTERVIEW_STATUSES,
      default: 'scheduled',
      index: true,
    },
    // Scorecard / Feedback
    scorecard: {
      rating: { type: Number, min: 1, max: 5, default: null },
      decision: { type: String, enum: EVALUATION_DECISIONS, default: null },
      technicalSkillScore: { type: Number, min: 1, max: 5, default: null },
      communicationScore: { type: Number, min: 1, max: 5, default: null },
      cultureFitScore: { type: Number, min: 1, max: 5, default: null },
      notes: { type: String, default: '' },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      submittedAt: { type: Date, default: null },
    },
    cancellationReason: { type: String, default: '' },
  },
  { timestamps: true }
);

interviewSchema.index({ organizationId: 1, candidateId: 1 });
interviewSchema.index({ organizationId: 1, scheduledStart: 1 });
interviewSchema.index({ organizationId: 1, status: 1 });
```

---

### 3.4 `JobOffer` (`JobOffer.js`)
Tracks generated compensation packages, approvals, candidate decisions, and onboarding readiness.

```javascript
const OFFER_STATUSES = ['draft', 'pending_approval', 'approved', 'sent', 'accepted', 'declined', 'revoked'];

const jobOfferSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    offerCode: {
      type: String, // e.g. "OFF-2026-042"
      required: true,
      trim: true,
      uppercase: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    jobOpeningId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      required: true,
    },
    designation: { type: String, required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    offeredSalary: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    joiningDate: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    status: {
      type: String,
      enum: OFFER_STATUSES,
      default: 'draft',
      index: true,
    },
    benefits: { type: [String], default: [] },
    notes: { type: String, default: '' },
    offerLetterUrl: { type: String, default: '' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    sentAt: { type: Date, default: null },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

jobOfferSchema.index({ organizationId: 1, offerCode: 1 }, { unique: true });
jobOfferSchema.index({ organizationId: 1, candidateId: 1 });
jobOfferSchema.index({ organizationId: 1, status: 1 });
```

---

### 3.5 `RecruitmentActivity` (`RecruitmentActivity.js`)
Maintains an immutable timeline of interactions (interview notes, stage moves, comments, emails).

```javascript
const recruitmentActivitySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      index: true,
    },
    jobOpeningId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      index: true,
    },
    type: {
      type: String,
      enum: ['stage_change', 'interview_scheduled', 'feedback_submitted', 'offer_created', 'offer_status_change', 'note_added', 'converted_to_employee'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

recruitmentActivitySchema.index({ organizationId: 1, candidateId: 1, createdAt: -1 });
recruitmentActivitySchema.index({ organizationId: 1, jobOpeningId: 1, createdAt: -1 });
```

---

## 4. Backend REST API Specification

All routes are mounted at `/api/v1/recruitment` inside `Backend/src/app.js` and protected with `requireAuth` + `requireModuleAccess('recruitment', action)`.

### 4.1 Summary & Analytics (`/summary`)
| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/summary` | `view` | Aggregated recruitment KPIs (Active Jobs, In-Pipeline Applicants, Interviews This Week, Offers Pending, Time-to-Hire, Funnel Drop-off) |

### 4.2 Job Openings (`/jobs`)
| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/jobs` | `view` | List jobs with search, department, status, and employmentType filters |
| `POST` | `/jobs` | `create` | Create a new job opening (auto-generates unique `jobCode`) |
| `GET` | `/jobs/:id` | `view` | Retrieve detailed job info, applicant count breakdown by stage |
| `PATCH` | `/jobs/:id` | `edit` | Update job details, requirements, or hiring team |
| `PATCH` | `/jobs/:id/status` | `edit` | Change status (`published`, `on_hold`, `closed`) |
| `DELETE` | `/jobs/:id` | `delete` | Archive / soft-delete job if no hired candidates |

### 4.3 Candidates & ATS Pipeline (`/candidates`, `/pipeline`)
| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/pipeline` | `view` | ATS Kanban board data grouped by pipeline stages with quick counts |
| `PATCH` | `/candidates/:id/stage` | `edit` | Drag-and-drop stage movement (records stageHistory & activity log) |
| `GET` | `/candidates` | `view` | Tabular candidate list with multi-column filtering, search, and sorting |
| `POST` | `/candidates` | `create` | Add candidate (manual entry or resume upload attachment) |
| `GET` | `/candidates/:id` | `view` | Complete profile, resume preview, interview history, activities |
| `PATCH` | `/candidates/:id` | `edit` | Update candidate details, tags, ratings, or notes |
| `DELETE` | `/candidates/:id` | `delete` | Remove candidate |

### 4.4 Interviews (`/interviews`)
| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/interviews` | `view` | List upcoming and past interviews (filter by date, status, candidate, interviewer) |
| `POST` | `/interviews` | `create` | Schedule interview round (assigns interviewers, sets meeting details) |
| `PATCH` | `/interviews/:id` | `edit` | Reschedule, update link, or update interview status |
| `POST` | `/interviews/:id/scorecard` | `edit` | Submit scorecard rating, competency ratings, and recommendation |
| `DELETE` | `/interviews/:id` | `delete` | Cancel interview with cancellation reason |

### 4.5 Offers & 1-Click HRMS Onboarding (`/offers`, `/onboard-employee`)
| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/offers` | `view` | List generated offers and statuses |
| `POST` | `/offers` | `create` | Create job offer for a candidate |
| `PATCH` | `/offers/:id/status` | `approve` | Approve, send, accept, decline, or revoke offer |
| `POST` | `/candidates/:id/onboard-employee` | `approve` | **Core Bridge**: Converts hired candidate to an HRMS `Employee` record (generates unique `employeeCode`, links department, designation, joining date, and links resume to `EmployeeDocument`) |

---

## 5. Frontend UI/UX Design & Theme Specifications

The frontend will match the **Nebula Premium Light 2.0** design philosophy evident in the CRM and HRMS modules:

### 5.1 Color Tokens & Component Styling
- **Primary Canvas**: `var(--pl-canvas)` (`#f5f5f7`)
- **Card Backgrounds**: Pure White (`#ffffff`) with border `#ECE0D6` (warm beige/slate subtle border) and hover state `#fafbfc`.
- **Accent Brand**: Nebula Brand Orange (`#f97316`), Hover (`#ea580c`), Subdued Warm Tint (`#fff7ed`), Border Glow (`#fed7aa`).
- **Typography**: `Plus Jakarta Sans`, font-semibold for section titles, font-mono for metrics and codes (`JOB-2026-001`, `CAND-00104`).
- **Interactions**: Smooth `framer-motion` entrance animations, subtle scale hovers, micro-tooltips.

### 5.2 Frontend Directory Structure

```
Frontend/src/
├── lib/
│   └── recruitmentApi.ts          # Typed Axios queries & mutations for recruitment
├── types/
│   └── recruitment.ts             # TypeScript definitions for all recruitment entities
├── hooks/
│   └── useRecruitment.ts          # TanStack Query hooks (queries, cache invalidations)
├── components/
│   └── recruitment/
│       ├── RecruitmentKanban.tsx  # @dnd-kit/core Drag-and-Drop ATS Pipeline Board
│       ├── CandidateCard.tsx      # Draggable Kanban candidate card with score & tags
│       ├── CandidateStagePill.tsx # Consistent color-coded stage badges
│       ├── CandidateDrawer.tsx    # Slide-over detail drawer (info, timeline, resume)
│       ├── JobModal.tsx           # Create / Edit Job Opening dialog
│       ├── ScheduleInterviewModal.tsx # Schedule interview & assign panel modal
│       ├── ScorecardModal.tsx     # Structured interview scorecard submission
│       ├── CreateOfferModal.tsx   # Compensation & offer letter generation
│       ├── OnboardEmployeeModal.tsx # 1-Click candidate-to-HRMS conversion modal
│       └── RecruitmentKpiCard.tsx # Metric cards with sparkline / trend indicator
└── pages/
    └── recruitment/
        ├── RecruitmentDashboardPage.tsx # Hub landing: KPIs, Quick Pipeline, Active Jobs
        ├── JobsPage.tsx                 # Manage job postings & status toggles
        ├── CandidatesPage.tsx           # Table view with advanced filters & search
        ├── PipelinePage.tsx             # Full-screen ATS Kanban board with drag & drop
        ├── InterviewsPage.tsx           # Calendar & interview roster
        └── OffersPage.tsx               # Offer letter tracking & onboarding pipeline
```

### 5.3 Sidebar Navigation Integration
Transform the single `/dashboard/recruitment` link in `Frontend/src/components/shell/Sidebar.tsx` into a first-class `SidebarNavGroup` (consistent with CRM and HRMS):

```tsx
<SidebarNavGroup
  to="/dashboard/recruitment"
  icon={<Briefcase className="w-5 h-5" />}
  label="Recruitment"
  collapsed={collapsed}
  subItems={[
    { to: '/dashboard/recruitment', icon: <LayoutDashboard className="w-3.5 h-3.5" />, label: 'Overview' },
    { to: '/dashboard/recruitment/jobs', icon: <Briefcase className="w-3.5 h-3.5" />, label: 'Job Openings' },
    { to: '/dashboard/recruitment/pipeline', icon: <Kanban className="w-3.5 h-3.5" />, label: 'ATS Pipeline' },
    { to: '/dashboard/recruitment/candidates', icon: <Users className="w-3.5 h-3.5" />, label: 'Candidates' },
    { to: '/dashboard/recruitment/interviews', icon: <CalendarClock className="w-3.5 h-3.5" />, label: 'Interviews' },
    { to: '/dashboard/recruitment/offers', icon: <FileCheck className="w-3.5 h-3.5" />, label: 'Offers & Onboarding' },
  ]}
/>
```

---

## 6. The Core Bridge: Candidate to HRMS Onboarding

A standout feature of Nebula is unified business operations. When a candidate reaches the **Offer Accepted** stage:
1. The Recruiter or HR clicks **"Onboard as Employee"**.
2. A pre-filled modal appears with:
   - Full Name, Email, Phone
   - Assigned Department & Designation from the Job Opening
   - Proposed Joining Date from the Offer
   - Auto-generated next `employeeCode` (e.g. `EMP-0145`)
   - Option to link an existing or invite a new `User` login account
3. Submitting executes an atomic backend operation:
   - Creates the `Employee` record in the `employees` collection.
   - Copies the candidate's uploaded resume into `EmployeeDocument` under document type `resume`.
   - Attaches the signed offer into `EmployeeDocument` under document type `offer_letter`.
   - Updates `Candidate.stage = 'hired'`, stamps `convertedEmployeeId`, and increments `JobOpening.filledPositions`.
   - Emits an activity log entry and toast notification.

---

## 7. Phased Implementation Roadmap

### Step 1: Database & Backend Foundation
- [ ] Create Mongoose models: `JobOpening.js`, `Candidate.js`, `Interview.js`, `JobOffer.js`, `RecruitmentActivity.js`.
- [ ] Write controllers:
  - `jobOpeningController.js`
  - `candidateController.js`
  - `recruitmentPipelineController.js`
  - `interviewController.js`
  - `offerController.js`
  - `hiringHrmsBridgeController.js`
  - `recruitmentSummaryController.js`
- [ ] Wire routes in `Backend/src/routes/recruitmentRoutes.js` and mount into `Backend/src/app.js`.
- [ ] Add OpenAPI Swagger documentation tags.
- [ ] Seed realistic demo recruitment data into `Backend/src/seed_realistic_data.js`.

### Step 2: Frontend Data Layer & State Management
- [ ] Define comprehensive TypeScript interfaces in `Frontend/src/types/recruitment.ts`.
- [ ] Create API service methods in `Frontend/src/lib/recruitmentApi.ts`.
- [ ] Implement TanStack Query hooks in `Frontend/src/hooks/useRecruitment.ts` with instant optimistic updates for drag-and-drop.

### Step 3: ATS Kanban Pipeline & Candidate Management
- [ ] Build `CandidateStagePill.tsx` with color-coded stage styling.
- [ ] Build `RecruitmentKanban.tsx` using `@dnd-kit/core` with smooth drag handles, column counts, and stage drop zones.
- [ ] Build `CandidateDrawer.tsx` displaying candidate resume preview, interview scorecard summaries, and activity history.
- [ ] Build `CandidatesPage.tsx` with search, filter badges, bulk actions, and pagination.

### Step 4: Job Openings & Hiring Management
- [ ] Build `JobsPage.tsx` with grid/table view, department badges, open position trackers, and status switcher.
- [ ] Build `JobModal.tsx` for creating/editing job postings.

### Step 5: Interviews & Evaluation Scorecards
- [ ] Build `InterviewsPage.tsx` with upcoming schedule, calendar-like day cards, and past completed rounds.
- [ ] Build `ScheduleInterviewModal.tsx` and `ScorecardModal.tsx`.

### Step 6: Offers & 1-Click HRMS Onboarding
- [ ] Build `OffersPage.tsx` tracking offer letter stages.
- [ ] Build `OnboardEmployeeModal.tsx` executing the recruitment-to-HRMS bridge.

### Step 7: Recruitment Hub Overview & App Routing
- [ ] Build `RecruitmentDashboardPage.tsx` with KPI summary cards, active jobs overview, and upcoming interview widgets.
- [ ] Update `Frontend/src/components/shell/Sidebar.tsx` with the new sub-navigation group.
- [ ] Register all sub-routes in `Frontend/src/App.tsx`.
- [ ] Test complete workflow from job creation -> candidate application -> ATS pipeline drag -> interview evaluation -> offer generation -> 1-click HRMS employee conversion.

---

## 8. Verification & Acceptance Criteria
1. **Multi-Tenancy**: All recruitment entities are strictly scoped to the logged-in user's `organizationId`.
2. **RBAC Validation**: Non-authorized roles cannot create or edit job postings or candidates; recruiters and HR enjoy full access; super_admin retains master control.
3. **Pipeline UX**: Smooth drag-and-drop of candidates across ATS stages with automatic stage history logging.
4. **Nebula Theme Cohesion**: 100% visual consistency with the Premium Light 2.0 orange/white design system, clean tables, drawers, and KPI metrics.
5. **Seamless HRMS Hand-off**: Converted candidates immediately appear in the HRMS Employees directory with all credentials and documents attached.
