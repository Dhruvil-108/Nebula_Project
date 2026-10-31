# Nebula HUB — Enterprise Human Resource Management System (HRMS)
## Comprehensive ERP-Grade Technical & Architectural Documentation

**Status:** Completed & Production-Verified  
**Version:** 2.0 (Enterprise ERP Edition)  
**Stack:** React 19 + TypeScript + Vite 6 + Tailwind CSS + Framer Motion + TanStack Query 5 + Recharts | Node.js + Express 4 + Mongoose 8 + MongoDB  
**Design Standard:** Nebula Premium Light 2.0 (Brand orange `#f97316`, warm surface `#FBF8F4`, card white `#ffffff`, border `#ECE0D6`, text `#1A1A1A` and `#6B6B6B`)

---

## 1. Executive Summary & ERP Architectural Vision

The **Nebula HRMS Module** is a full-scale, multi-tenant **Enterprise Human Resource Management System** engineered to handle end-to-end workforce governance, time & attendance, leave policy orchestration, organizational command hierarchies, payroll & statutory compliance, and performance intelligence.

Designed to operate seamlessly alongside Nebula's **CRM**, **Recruitment (ATS)**, **Expenses**, and **Inventory** modules, HRMS consolidates core personnel administration into a unified, high-performance web interface adhering strictly to the **Nebula Premium Light 2.0** design system.

```
                                  ┌─────────────────────────────────────────┐
                                  │       NEBULA HRMS ENTERPRISE ERP        │
                                  └────────────────────┬────────────────────┘
                                                       │
         ┌───────────────────┬───────────────────┬─────┴─────────────┬───────────────────┬───────────────────┐
         ▼                   ▼                   ▼                   ▼                   ▼                   ▼
  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │   Phase 0:   │    │   Phase 1:   │    │   Phase 2:   │    │   Phase 3:   │    │   Phase 4:   │    │   Phase 5:   │
  │   Dual-Key   │    │ Advanced     │    │  Enterprise  │    │ 360° Dossier │    │  Enterprise  │    │ Performance, │
  │   Identity   │    │ Attendance   │    │ Leave Policy │    │  & Org Tree  │    │   Payroll    │    │ OKRs & AI    │
  │  Foundation  │    │  & Shifts    │    │  & Accruals  │    │  Hierarchy   │    │ & Compliance │    │   Copilot    │
  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

---

## 2. Complete Phase-by-Phase ERP Capabilities

### Phase 0: Backend Foundation & Identity Dual-Key Model
- **Unified Identity Resolution:** Solves the historical split between authentication logins (`User`) and personnel profiles (`Employee`).
- **Canonical Dual-Key Lookup:** `employeeUtils.resolveCanonicalEmployee(user)` transparently resolves whichever entity is present, linking them bi-directionally without breaking legacy endpoints.
- **Automated Migration Script:** `migrate_canonical_employee_identity.js` ensures every existing `User` has an associated `Employee` record with matching tenant scoping, preventing orphaned records.

### Phase 1: Advanced Attendance & Multi-Shift Rostering
- **Multi-Shift Engine (`Shift.js`, `EmployeeShift.js`):** Supports rotational morning, evening, night, and custom shifts with grace period thresholds (e.g. 15 min), half-day entry cutoffs, and weekly-off masks.
- **Attendance Regularization (`AttendanceRegularization.js`):** Formal missed-punch dispute workflow allowing employees to request check-in/out corrections with manager approval and automatic punch reconciliation.
- **Compensatory Off Engine (`CompOffGrant.js`):** Overtime-to-leave credit generation when employees work on scheduled weekly offs or holidays.
- **Real-Time Live Attendance Bar:** Real-time ticking shift counter, status pill (`not_checked_in`, `checked_in`, `on_break`, `checked_out`), and 1-click punch actions.

### Phase 2: Enterprise Leave Policy & Accruals Engine
- **Sandwich Policy Detection (`LeaveLedger.js`):** Automatically detects if a weekend or holiday is sandwiched between two leave days and counts contiguous days against statutory quotas according to company rules.
- **Automated Monthly Accruals (`leaveAccrualService.js`):** Monthly background credit engine running pro-rata leave allocations with carry-forward rules and maximum accrual caps.
- **Leave Encashment (`LeaveEncashment.js`):** Year-end or ad-hoc leave-to-salary conversion workflows with manager approval and payroll linkage.
- **Balance Auditing & Ledger:** Transactional audit ledger capturing every credit, debit, sandwich addition, and encashment.

### Phase 3: 360° Employee Dossier & Interactive Org Chart
- **Multi-Branch Physical Offices (`BranchLocation.js`):** Global HQ and regional branch locations with IANA timezones, physical addresses, and real-time headcount aggregation.
- **Designation & Pay Grade Classification (`Designation.js`):** Standardized titles linked to `L1`–`L7` salary grade bands.
- **Career Transition Audit Trail (`JobHistory.js`):** Immutable historical timeline tracking promotions, transfers, grade revisions, and compensation changes with before/after audit states.
- **360° Personnel Dossier (6 Dedicated Tabs):**
  1. *Overview & Core Job:* Role, grade, department, branch, direct manager, and skills.
  2. *Personal & Statutory IDs:* DOB, marital status, PAN, Aadhaar, UAN, and Passport info.
  3. *Bank & Payroll:* Masked direct deposit accounts, IFSC/routing codes, and ACH verification.
  4. *Career Progression:* Interactive vertical timeline with promotion badges and reason notes.
  5. *Education & Past Work:* University degrees, GPAs, and prior employer history.
  6. *Attendance & Document Repository:* Punch history, leave quotas, and uploaded credentials.
- **Interactive Visual Org Chart (`OrgChartPage.tsx`):** Zoomable, pannable, and collapsible hierarchical tree rendering direct and total report counts, cross-branch locations, and click-to-dossier drawer.

### Phase 4: Enterprise Payroll & Statutory Compliance Engine
- **Salary Structure & CTC Configurator (`SalaryStructure.js`):** Grade-aware (`L1`–`L7`) base salaries, automated earnings schedules (Basic 50%, HRA 20%, Special, Conveyance, Medical), and statutory deductions (PF 12%, PT, TDS, ESI).
- **Attendance-Driven LOP Resolution (`payrollService.js`):** Automatically queries `AttendanceRecord` and approved `LeaveRequest` collections for the target pay period, calculates unexcused absent days (`lopDays`), and prorates daily gross earnings.
- **Batch Payroll Cycles (`PayrollRun.js`, `Payslip.js`):** Monthly batch processing with multi-stage approval workflow (`draft` → `approved` → `paid`) and financial aggregate counters.
- **Native Vector PDF Payslip Streaming (`pdfkit`):** Server-side branded PDF payslip generator streaming official statements with company letterhead, attendance metrics, and itemized earnings/deductions tables.
- **Self-Service Payslip Vault:** Employee portal for viewing historical statements and downloading signed PDF copies.

### Phase 5: Performance Management, OKRs & HR AI Copilot
- **Goals & OKRs Management (`Goal.js`):** Weighted measurable Key Results, milestone tracking, progress rollups, and regular check-in logs.
- **360° Review Cycles & Appraisals (`ReviewCycle.js`, `PerformanceReview.js`):** Annual, semi-annual, and quarterly cycles orchestrating self-appraisals, manager reviews, and peer feedback.
- **9-Box Talent Calibration Matrix:** Interactive 3×3 calibration grid evaluating talent across Performance (Low, Medium, High) and Potential (Low, Medium, High) with 9 distinct talent profiles:
  - *Future Leader / Star* $(3, 3)$
  - *High Performer* $(3, 2)$
  - *Growth Player* $(2, 3)$
  - *Core Contributor* $(2, 2)$
  - *Risk / Underperformer* $(1, 1)$
  - Calibration controls for promotion recommendation and compensation increment percentages.
- **Predictive Attrition Risk Radar (`AttritionRisk.js`):** Multi-factor analytical model evaluating 90-day attendance stability, leave frequency trends, role tenure stagnation (>14–24 months), and review momentum with itemized contributing factors and suggested interventions.
- **HR AI Copilot (`hrmsCopilotService.js`):** Conversational AI assistant with natural language understanding for workforce intelligence, retention risk alerts, team OKR velocity, and talent calibration insights.

---

## 3. Complete Data Model & Schemas Index

| Model | Schema File | Purpose in HRMS ERP |
|---|---|---|
| `Employee` | `Backend/src/models/Employee.js` | Comprehensive personnel dossier with statutory, bank, and lifecycle fields |
| `Department` | `Backend/src/models/Department.js` | Organizational business units and leadership references |
| `BranchLocation` | `Backend/src/models/BranchLocation.js` | Physical office sites, global HQ designation, and timezones |
| `Designation` | `Backend/src/models/Designation.js` | Standardized job titles and pay grade bands (`L1`–`L7`) |
| `JobHistory` | `Backend/src/models/JobHistory.js` | Audit trail for promotions, transfers, and salary adjustments |
| `Shift` | `Backend/src/models/Shift.js` | Shift schedules, grace times, and half-day thresholds |
| `EmployeeShift` | `Backend/src/models/EmployeeShift.js` | Employee-to-shift roster assignments |
| `AttendanceRecord` | `Backend/src/models/AttendanceRecord.js` | Real-time punches, lateness flags, worked minutes, and shift ties |
| `AttendanceRegularization` | `Backend/src/models/AttendanceRegularization.js` | Missed punch dispute and regularization requests |
| `LeaveType` | `Backend/src/models/LeaveType.js` | Statutory leave types (Casual, Sick, Earned, Maternity, etc.) |
| `LeaveRequest` | `Backend/src/models/LeaveRequest.js` | Leave applications, sandwich flags, and approval workflows |
| `LeaveLedger` | `Backend/src/models/LeaveLedger.js` | Transactional balance debits, credits, and accruals |
| `LeaveEncashment` | `Backend/src/models/LeaveEncashment.js` | Leave encashment claims and payroll disbursement links |
| `CompOffGrant` | `Backend/src/models/CompOffGrant.js` | Compensatory off credits earned from weekend/holiday work |
| `SalaryStructure` | `Backend/src/models/SalaryStructure.js` | CTC schedules, basic/HRA/allowance splits, and statutory withholdings |
| `PayrollRun` | `Backend/src/models/PayrollRun.js` | Monthly payroll batch cycles, aggregates, and disbursement audits |
| `Payslip` | `Backend/src/models/Payslip.js` | Immutable monthly employee pay statements and attendance snapshots |
| `Goal` | `Backend/src/models/Goal.js` | OKRs, measurable key results, weights, and check-in timeline |
| `ReviewCycle` | `Backend/src/models/ReviewCycle.js` | 360 review periods, participation criteria, and submission stats |
| `PerformanceReview` | `Backend/src/models/PerformanceReview.js` | Self, manager, peer reviews, and 9-box calibration nodes |
| `AttritionRisk` | `Backend/src/models/AttritionRisk.js` | Predictive retention risk scores, drivers, and interventions |
| `Holiday` | `Backend/src/models/Holiday.js` | Organization holiday calendar and auto-seeded company dates |
| `HrSetting` | `Backend/src/models/HrSetting.js` | Global tenant HR configurations and attendance policies |

---

## 4. Complete API Surface (`/api/v1/hr/*`)

All endpoints are protected by `requireAuth` and `requireModuleAccess('hrms', <action>)`.

### A. Employees & Lifecycle
- `GET /api/v1/hr/employees`: Filterable employee directory (search, department, status, employment type).
- `GET /api/v1/hr/employees/:id`: Full 360° employee dossier.
- `POST /api/v1/hr/employees`: Create employee (auto-generates sequential code, triggers equipment kit request).
- `PATCH /api/v1/hr/employees/:id`: Update employee details.
- `DELETE /api/v1/hr/employees/:id`: Soft delete employee.
- `POST /api/v1/hr/employees/:id/lifecycle`: Execute promotion, transfer, or grade revision; logs `JobHistory`.
- `GET /api/v1/hr/employees/:id/job-history`: Fetch career progression timeline.

### B. Organization & Hierarchy
- `GET /api/v1/hr/branches`: List branch offices with live headcount.
- `POST /api/v1/hr/branches`: Create branch office location.
- `PATCH /api/v1/hr/branches/:id`: Update branch details.
- `DELETE /api/v1/hr/branches/:id`: Remove branch (blocked if active staff assigned).
- `GET /api/v1/hr/designations`: List designations filtered by grade or department.
- `POST /api/v1/hr/designations`: Create designation with salary band.
- `GET /api/v1/hr/org-chart`: Recursive command tree with direct and total report counts.
- `GET /api/v1/hr/departments`: List departments with headcount summaries.
- `POST /api/v1/hr/departments`: Create department.

### C. Attendance & Rostering
- `GET /api/v1/hr/attendance/today`: Current user's daily punch status, live worked minutes, and shift details.
- `POST /api/v1/hr/attendance/action`: Clock-in, break-in, break-out, and clock-out actions.
- `GET /api/v1/hr/attendance/roster`: Live daily organization attendance roster.
- `GET /api/v1/hr/attendance/summary`: Aggregated monthly attendance metrics and charts.
- `GET /api/v1/hr/shifts`: List configured work shifts.
- `POST /api/v1/hr/shifts`: Create work shift with grace rules.
- `POST /api/v1/hr/shifts/assign`: Assign rotational shift to employee.
- `GET /api/v1/hr/attendance/regularizations`: List missed-punch regularization requests.
- `POST /api/v1/hr/attendance/regularizations`: Submit regularization request.
- `PATCH /api/v1/hr/attendance/regularizations/:id/approve`: Approve regularization and auto-reconcile punch record.
- `PATCH /api/v1/hr/attendance/regularizations/:id/reject`: Reject regularization request.

### D. Leave & Policy Engine
- `GET /api/v1/hr/leaves/types`: List active leave policies and quotas.
- `POST /api/v1/hr/leaves/types`: Create leave policy.
- `GET /api/v1/hr/leaves/balance`: User leave balance breakdown.
- `GET /api/v1/hr/leaves/requests`: Filterable leave requests pipeline.
- `POST /api/v1/hr/leaves/requests`: Submit leave request (evaluates sandwich rule).
- `PATCH /api/v1/hr/leaves/requests/:id/approve`: Approve leave request and populate attendance ledger.
- `PATCH /api/v1/hr/leaves/requests/:id/reject`: Reject leave request and refund quota.
- `POST /api/v1/hr/leaves/sandwich-preview`: Preview sandwich days calculation before filing.
- `GET /api/v1/hr/leaves/ledger`: Transactional audit ledger of leave deductions and accruals.
- `POST /api/v1/hr/leaves/accrual/run`: Trigger monthly accrual engine execution.
- `GET /api/v1/hr/leaves/comp-off`: List compensatory off credit requests.
- `POST /api/v1/hr/leaves/comp-off`: Request comp-off for overtime on weekend/holiday.
- `PATCH /api/v1/hr/leaves/comp-off/:id/approve`: Approve comp-off and credit leave balance.

### E. Enterprise Payroll & Compliance
- `GET /api/v1/hr/payroll/runs`: List historical and active monthly payroll runs.
- `POST /api/v1/hr/payroll/runs`: Generate new batch run with automated attendance LOP calculations.
- `GET /api/v1/hr/payroll/runs/:id`: View batch run line items and employee payslips.
- `PATCH /api/v1/hr/payroll/runs/:id/approve`: Lock draft run and advance to approved.
- `PATCH /api/v1/hr/payroll/runs/:id/pay`: Disburse run and mark all employee payslips paid.
- `PATCH /api/v1/hr/payroll/payslips/:id`: Adjust line-item bonuses or deductions in draft run.
- `GET /api/v1/hr/payroll/payslips/:id`: View single payslip voucher.
- `GET /api/v1/hr/payroll/payslips/:id/pdf`: Stream official branded vector PDF payslip.
- `GET /api/v1/hr/payroll/my-payslips`: Employee self-service payslip history.
- `GET /api/v1/hr/payroll/salary-structures/:employeeId`: View configured CTC and schedule.
- `POST /api/v1/hr/payroll/salary-structures/:employeeId`: Upsert custom salary structure.

### F. Performance, OKRs & AI Copilot
- `GET /api/v1/hr/performance/goals`: List OKRs with filters (employee, dept, status, period).
- `POST /api/v1/hr/performance/goals`: Create goal with weighted key results.
- `GET /api/v1/hr/performance/goals/:id`: Get goal with check-in history.
- `PATCH /api/v1/hr/performance/goals/:id`: Update goal or key results with automatic progress rollup.
- `DELETE /api/v1/hr/performance/goals/:id`: Archive goal.
- `POST /api/v1/hr/performance/goals/:id/check-in`: Log milestone check-in note and snapshot.
- `GET /api/v1/hr/performance/cycles`: List 360 review cycles and participation stats.
- `POST /api/v1/hr/performance/cycles`: Launch review cycle and generate draft reviews for eligible staff.
- `GET /api/v1/hr/performance/reviews`: List reviews with filters.
- `GET /api/v1/hr/performance/reviews/:id`: View appraisal details.
- `PATCH /api/v1/hr/performance/reviews/:id/self`: Submit self-appraisal form.
- `PATCH /api/v1/hr/performance/reviews/:id/manager`: Submit manager evaluation & potential rating.
- `PATCH /api/v1/hr/performance/reviews/:id/calibrate`: Finalize 9-box calibration, promotion, and increment.
- `GET /api/v1/hr/performance/nine-box`: Compute 3×3 talent calibration grid distribution.
- `GET /api/v1/hr/performance/attrition-risks`: Retrieve predictive attrition risk radar.
- `POST /api/v1/hr/performance/attrition-risks/recompute`: Trigger real-time re-analysis of risk engine.
- `POST /api/v1/hr/performance/copilot/query`: Natural-language HR AI Copilot query endpoint.

---

## 5. Frontend Pages & Component Hierarchy

```
Frontend/src/pages/
├── modules/
│   └── HrmsPage.tsx              # Primary HRMS Dashboard (KPIs, Live Punch, Overview, Quick Links)
├── hrms/
│   ├── EmployeesPage.tsx         # Employee Directory + 360° Dossier Drawer (6 tabs) + Transition Modal
│   ├── OrgChartPage.tsx          # Interactive Visual Org Chart (Zoom/Pan/Collapse + Quick Drawer)
│   ├── AttendancePage.tsx        # Shift Roster, Regularization Requests, Time Clock Breakdown
│   ├── LeavePage.tsx             # Quotas, Sandwich Warnings, Request Workflows, Accruals, Comp-Offs
│   ├── PayrollPage.tsx           # Payroll Hub: Runs, Adjustments, CTC Config, PDF Slip Preview
│   ├── PerformancePage.tsx       # Performance Hub: Goals, 360 Reviews, 9-Box Grid, Attrition, Copilot
│   ├── DepartmentsPage.tsx       # Department Hierarchy, Headcount Cards, Leadership assignments
│   ├── HolidaysPage.tsx          # Yearly Holiday Calendar and auto-seeded statutory dates
│   ├── DocumentsPage.tsx         # Organization Document Vault and employee credentials
│   └── settings/
│       └── HrSettingsPage.tsx    # Shift configs, attendance policies, and document settings
```

---

## 6. Verification & Quality Assurance

- **TypeScript Compilation:** All types, API contracts, hooks, and components pass with zero errors (`tsc -b`).
- **Production Bundle:** Full Vite build compiles cleanly with zero bundler errors.
- **Design System Enforcement:** Strict adherence to **Nebula Premium Light 2.0** (`#f97316` brand orange, `#fff7ed` tint, `#FBF8F4` warm surface, `#ECE0D6` border, `#1A1A1A` text) without raw slate utility classes.
- **Phase Artifacts:** Complete reference guides and phase summaries preserved under `docs/hrms-erp/phase-*/SUMMARY.md`.
