# Nebula HRMS — Discovery & UI/Architecture Blueprint

**Document Version:** 1.0.0  
**Design System:** Nebula Premium Light 2.0  
**Stack:** React 19 + TypeScript + Vite 6 + Tailwind CSS + Framer Motion + TanStack Query v5 + Recharts  

---

## 1. UI Theme & Design System (Nebula Premium Light 2.0)

All HRMS screens strictly follow the unified palette:

| Token | Hex / Class | Usage |
|---|---|---|
| **Brand Orange** | `#f97316` (`hover: #ea580c`) | Primary buttons, active states, key data highlights, live counters |
| **Warm Tint** | `#fff7ed` | Card highlight backgrounds, toast backgrounds, AI callout boxes |
| **Tint Border** | `#fed7aa` | Border for brand tinted containers, badges |
| **Card Border** | `#ECE0D6` / `border-slate-200` | Subtle card borders, dividers, modal headers |
| **Warm Surface** | `#FBF8F4` | Table headers, secondary stat tiles, background canvas |
| **Pure White** | `#ffffff` | Primary cards, modals, slide-over drawers, dropdown menus |
| **Primary Text** | `#1A1A1A` | Page titles, card headings, employee names |
| **Secondary Text** | `#6B6B6B` | Labels, subtitles, table descriptions, metadata |
| **Subtle Text** | `#9B9B9B` | Empty states, placeholder text, secondary icons |

---

## 2. Reusable UI Pattern Catalog

| Component | File Path | Props & Description |
|---|---|---|
| `HrmsStatusPill` / `LiveAttendancePill` | `Frontend/src/components/hrms/HrmsStatusPill.tsx` | Status pills with colored dot: `status: LiveAttendanceState \| RosterStatus` (`Working`, `On Break`, `Checked Out`, `Not Clocked In`). |
| `LeaveStatusPill` | `Frontend/src/components/hrms/HrmsStatusPill.tsx` | Status pill for leave requests: `pending` (amber), `approved` (emerald), `rejected` (rose). |
| `EmployeeStatusPill` | `Frontend/src/components/hrms/HrmsStatusPill.tsx` | Status pill for employee lifecycle: `active`, `on_notice`, `exited`. |
| `AttendanceStatusPill` | `Frontend/src/components/hrms/HrmsStatusPill.tsx` | Status pill for daily records: `present`, `half_day`, `on_leave`, `absent`, `holiday`, `weekend`. |
| `InfoTile` | `Frontend/src/components/hrms/InfoTile.tsx` | Label/value metadata tile with icon in `border-[#ECE0D6]`. |
| `FloatingDropdown` | `Frontend/src/components/ui/FloatingDropdown.tsx` | Standard portal-based floating dropdown with search, icons, and label. |
| `Drawer` | `Frontend/src/components/crm/Drawer.tsx` | 600px right slide-over drawer with backdrop blur, keyboard ESC handling. |
| `ActivityTimeline` | `Frontend/src/components/crm/ActivityTimeline.tsx` | Timeline for notes, tasks, and system events related to employees. |

---

## 3. HRMS Navigation & Module Architecture

The sidebar group for HRMS (`/dashboard/hrms`) is structured as follows:

1. **Overview / HR Command Center** (`/dashboard/hrms`)
   - Real-time Shift Ticker & Live Clock-In actions (Check-in, Break-in/out, Check-out)
   - Real-time Workforce KPI stats (`Headcount`, `Present Today`, `On Break`, `Not Clocked`, `Pending Leave`, `Upcoming Holidays`)
   - Sub-Module Quick Navigator Cards (Employees, Attendance, Leave, Departments, Holidays, Documents)
   - Recharts Department Workforce Headcount distribution
   - Today's Live Attendance Roster Snapshot
   - Pending Leave Approvals quick review queue
   - Upcoming Holidays schedule
   - AI Copilot smart workforce insights
2. **Employees Directory** (`/dashboard/hrms/employees`)
   - 360° Employee Drawer with 4 tabs: `Overview`, `Time & Leave`, `Docs`, `Activity`
   - Filter bar: search, department, status, employment type
   - Create Employee modal
3. **Attendance & Shifts** (`/dashboard/hrms/attendance`)
   - Tab 1: **My Attendance** (Live Shift clock, worked hours counter, monthly calendar summary, Recharts daily hours bar chart)
   - Tab 2: **Team Roster** (Organization-wide live shift status, filters by date, quick status indicators)
4. **Leave & Time-Off** (`/dashboard/hrms/leave`)
   - Tab 1: **My Leave** (Annual quota balance cards with progress bars, My requests history, Request Leave modal)
   - Tab 2: **Approvals** (Manager/HR approval queue with 1-click Approve / Reject actions)
5. **Departments & Teams** (`/dashboard/hrms/departments`)
   - Department directory, Head of Department assignments, headcount badges, and modal editor
6. **Holidays Calendar** (`/dashboard/hrms/holidays`)
   - Annual holiday calendar switcher, upcoming holiday highlight cards, admin add/edit holiday modal
7. **Documents Vault** (`/dashboard/hrms/documents`)
   - Employee document dossiers (ID Proof, Certificate, Contract, Offer Letter), secure downloads, delete actions

---

## 4. ERP Upgrade Roadmap & Milestones

- **Phase 0:** Discovery, UI Pattern catalog, design tokens consistency, foundational bugfixes. *(Completed)*
- **Phase 1:** Organization (Branch, Grade, Designation, Org Chart) + Employee 360 full profile.
- **Phase 2:** Multi-shift roster, grace rules, overtime, regularization, geo-fencing & Leave policy engine.
- **Phase 3:** Payroll engine (salary structures, runs, payslips, statutory deductions, bank transfer exports).
- **Phase 4:** Onboarding/Offboarding workflows, Helpdesk ticketing & Letter generator.
- **Phase 5:** Performance OKRs, 360 review cycles & Skill matrix.
- **Phase 6:** AI Copilot, Policy Q&A with citations, Smart Leave assistant & Anomaly detection.
- **Phase 7:** Advanced Workforce Analytics, GDPR data management & Production hardening.
