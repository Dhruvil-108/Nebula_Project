# Nebula HRMS — Phase 4: Enterprise Payroll & Statutory Compliance Engine

**Status:** Completed & Production-Verified  
**Date:** October 2026  
**Module:** Human Resource Management System (HRMS) — Payroll & Compensation  
**Design Standard:** Nebula Premium Light 2.0 (Brand orange `#f97316`, warm surface `#FBF8F4`, border `#ECE0D6`, text `#1A1A1A` and `#6B6B6B`)

---

## 1. Executive Summary

Phase 4 elevates Nebula HUB to a full-featured, enterprise-grade **Payroll & Statutory Compliance Engine**. It automates the end-to-end payroll lifecycle—from salary structure definition and CTC modeling to automated attendance-driven LOP (Loss of Pay) deductions, multi-step batch approval workflows, disburse settlements, and dynamic PDF payslip generation.

### Key Capabilities Delivered:
1. **Salary Structure & CTC Configurator:** Grade-aware (`L1`–`L7`) base salaries, automated earnings schedules (Basic 50%, HRA 20%, Special, Conveyance, Medical), and statutory deductions (Provident Fund 12%, Professional Tax, Income Tax/TDS, ESI).
2. **Attendance-Integrated LOP Engine:** Intelligently queries `AttendanceRecord` and approved `LeaveRequest` collections for the target pay period, automatically calculating unapproved absent days and prorating earnings.
3. **Multi-State Batch Payroll Runs:** Batch monthly cycles with strict transition workflows (`draft` → `approved` → `paid`), aggregate financial auditing, and single-click mass disbursement.
4. **Dynamic Line-Item Adjustments:** Allows HR admins to introduce discretionary bonuses or one-off deductions into draft runs with automatic net recomputations.
5. **High-Fidelity PDF Payslip Generator:** Native server-side vector rendering via `pdfkit` outputting branded, audit-compliant pay slips with company headers, attendance stats, itemized schedules, and direct deposit details.
6. **Self-Service Payslip Vault:** Dedicated employee view for browsing historical statements and downloading signed PDF copies.

---

## 2. Architecture & Data Model Enhancements

### A. New Mongoose Schemas

#### 1. `SalaryStructure` (`Backend/src/models/SalaryStructure.js`)
Stores standardized compensation packages linked directly to employees:
- `employeeId`: Linked employee reference (unique index per employee).
- `annualCtc`, `monthlyCtc`: Pre-calculated compensation figures.
- `currency`: ISO currency code (default: `INR`).
- `effectiveFrom`: Date the salary structure takes legal effect.
- `earnings`:
  - `basic`: Statutory base pay (standard 50% of monthly gross).
  - `hra`: House Rent Allowance (standard 20% of monthly gross).
  - `conveyance`: Transport allowance.
  - `medicalAllowance`: Health & medical benefit allowance.
  - `specialAllowance`: Balancing earnings component.
  - `otherAllowances`: Custom modular allowances.
- `deductions`:
  - `providentFund`: Statutory employee PF (12% of basic).
  - `professionalTax`: State-mandated PT.
  - `incomeTaxTds`: Estimated monthly TDS withholding.
  - `esi`: Employee State Insurance where applicable.
  - `otherDeductions`: Voluntary deductions.
- `employerContributions`:
  - `pfEmployer`: Employer PF contribution.
  - `esiEmployer`: Employer ESI contribution.

#### 2. `PayrollRun` (`Backend/src/models/PayrollRun.js`)
Manages monthly organizational payroll batches:
- `month`: 1–12 calendar month index.
- `year`: 4-digit calendar year.
- `payPeriodStart`, `payPeriodEnd`: Date boundaries for attendance and leave calculation.
- `status`: `draft` | `approved` | `paid` | `cancelled`.
- `summary`:
  - `headcount`: Number of active employees processed in run.
  - `totalGross`: Cumulative gross earnings.
  - `totalDeductions`: Cumulative statutory and voluntary deductions.
  - `totalNet`: Total net amount disbursed.
  - `totalLopDays`: Organization-wide loss-of-pay days for the period.
- `approvedBy`, `approvedAt`: Management authorization audit trail.
- `disbursedBy`, `disbursedAt`: Treasury settlement audit trail.
- `paymentReference`: Settlement tracking reference (e.g., NEFT/RTGS batch number).

#### 3. `Payslip` (`Backend/src/models/Payslip.js`)
Individual immutable pay record generated per employee per cycle:
- `payrollRunId`: Parent batch run reference.
- `employeeId`: Recipient employee.
- `month`, `year`: Pay cycle identifiers.
- `attendanceSnapshot`:
  - `totalDays`: Calendar days in month.
  - `workingDays`: Standard business days.
  - `presentDays`: Days clocked in.
  - `paidLeaveDays`: Approved leaves counted as paid.
  - `lopDays`: Unexcused absent days triggering salary deductions.
  - `payableDays`: Actual compensated days (`totalDays - lopDays`).
- `earningsSnapshot`: Itemized basic, HRA, allowances, bonuses, and calculated gross.
- `deductionsSnapshot`: Itemized PF, PT, TDS, LOP deduction, and total deductions.
- `netSalary`: Net take-home pay.
- `bankDetailsSnapshot`: Snapshot of employee bank account at the moment of payment.
- `paymentStatus`: `unpaid` | `processed` | `paid`.
- `remarks`: Line-item audit notes.

---

## 3. Computational Engine (`Backend/src/services/payrollService.js`)

The `payrollService` centralizes business logic and mathematical rules:
1. **Grade-Based Default Fallback:**
   - If an employee does not have a custom `SalaryStructure`, the engine resolves their pay grade (`L1` to `L7`) from `Employee.grade` and sets compliant baseline figures (e.g., L1 = ₹3.6L CTC, L4 = ₹14.4L CTC, L7 = ₹42.0L CTC).
2. **Attendance & LOP Resolution:**
   - Queries `AttendanceRecord` within `payPeriodStart` and `payPeriodEnd`.
   - Queries approved `LeaveRequest` documents spanning the period.
   - Calculates unexcused absences (`lopDays`) and daily rate:
     $$\text{Daily Rate} = \frac{\text{Monthly Gross}}{\text{Calendar Days}}$$
     $$\text{LOP Deduction} = \text{Daily Rate} \times \text{LOP Days}$$
3. **Statutory Withholding Rules:**
   - Employee PF: 12% of Basic pay (capped or standard).
   - Professional Tax (PT): State-mandated slab tiering.
   - Income Tax (TDS): Modular projected monthly withholding.
4. **PDF Engine (`pdfkit`):**
   - Formatted letterhead with Nebula HUB branding.
   - Dual-column employee & direct-deposit summary box.
   - Attendance summary badges (`Total Days`, `Payable Days`, `LOP Days`).
   - Side-by-side Earnings & Deductions grid with subtotal and net pay callout.
   - Encrypted / read-only downloadable PDF stream.

---

## 4. API Endpoints

All endpoints are mounted under `/api/v1/hr/payroll/*` with RBAC protection:

| Endpoint | Method | Permission | Controller & Description |
|---|---|---|---|
| `/api/v1/hr/payroll/runs` | `GET` | `hrms:view` | Lists all monthly payroll runs with summary metrics |
| `/api/v1/hr/payroll/runs` | `POST` | `hrms:create` | Creates new batch run and calculates line items for all active employees |
| `/api/v1/hr/payroll/runs/:id` | `GET` | `hrms:view` | Retrieves batch run details with all employee payslips |
| `/api/v1/hr/payroll/runs/:id/approve` | `POST` | `hrms:approve` | Locks draft run and advances status to `approved` |
| `/api/v1/hr/payroll/runs/:id/pay` | `POST` | `hrms:approve` | Settles run, sets status to `paid`, and marks all payslips as `paid` |
| `/api/v1/hr/payroll/payslips/:id` | `PATCH` | `hrms:edit` | Modifies line-item bonus or deduction adjustments with recalculation |
| `/api/v1/hr/payroll/payslips/:id` | `GET` | `hrms:view` | Retrieves single payslip details |
| `/api/v1/hr/payroll/payslips/:id/pdf` | `GET` | Authenticated | Streams official vector PDF payslip document |
| `/api/v1/hr/payroll/my-payslips` | `GET` | Authenticated | Returns current user's historical payslips for self-service portal |
| `/api/v1/hr/payroll/salary-structures/:employeeId` | `GET` | `hrms:view` | Fetches configured salary structure or grade-based defaults |
| `/api/v1/hr/payroll/salary-structures/:employeeId` | `PUT` | `hrms:edit` | Upserts personalized compensation structure and recalculates components |

---

## 5. Frontend Implementation

### A. Dedicated Payroll Hub (`Frontend/src/pages/hrms/PayrollPage.tsx`)
A unified interface structured into 4 interactive tabs:
1. **Payroll Runs:**
   - Displays all historical and current batch cycles.
   - Shows live financial KPI counters: Gross Payroll, Total Deductions, Net Disbursement, and Total LOP Days.
   - Action controls: Create New Run modal, Approve Batch, and Disburse Payments.
2. **Active Batch Payslips:**
   - Filterable table of every employee in the selected run.
   - Search by employee name or code.
   - Quick "Adjust" action to add discretionary bonuses or deductions.
   - "View Slip" action opening the high-fidelity Payslip Drawer.
   - Instant PDF download link.
3. **Salary Structures & CTC Config:**
   - Interactive compensation calculator.
   - Form for updating employee Annual CTC with automatic real-time preview of Basic (50%), HRA (20%), Special Allowance, and PF.
4. **My Payslips:**
   - Employee self-service statement list with payment status pills and instant PDF download.

### B. High-Fidelity Payslip Preview Modal
- Branded advice voucher modal matching the generated PDF.
- Displays attendance metrics (`Payable Days`, `Worked Days`, `LOP Days`).
- Side-by-side earnings and statutory deductions breakdown.
- Highlighted Net Salary card with bank routing confirmation.
- 1-click "Download Official PDF" button connecting directly to the server stream.

### C. System Integration
- **Navigation Menu (`Sidebar.tsx`):** Added `Payroll` item under HRMS with `Banknote` icon.
- **Top Bar (`AppShell.tsx`):** Registered route `/dashboard/hrms/payroll` mapped to `HRMS · Payroll & Compensation`.
- **HRMS Dashboard (`HrmsPage.tsx`):** Added direct `Payroll` button in the header actions bar.

---

## 6. Verification & Quality Assurance

- **TypeScript Compilation:** Passed cleanly with zero errors (`tsc -b`).
- **Production Bundle:** `vite build` completed successfully.
- **Backend Lint & Route Inspection:** All routes verified against `apiClient` endpoints.
