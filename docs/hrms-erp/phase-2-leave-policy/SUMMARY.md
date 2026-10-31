# Phase 2: Enterprise Leave Policy & Accruals Engine — Summary

**Nebula HUB HRMS → ERP Upgrade**  
*Completed: Phase 2 Leave Policy & Accruals*  
*Theme: Nebula Premium Light 2.0 (`#f97316`, `#fff7ed`, `#ECE0D6`, `#FBF8F4`, `#1A1A1A`)*  

---

## 1. Overview & Objectives Achieved

Phase 2 transforms the leave management module from a basic static balance counter into an enterprise-grade **Leave Policy, Prorated Accrual, Sandwich Rule Enforcement, and Compensatory Off Engine**.

All operations are supported by a financial-grade immutable audit ledger (`LeaveLedger`) providing complete transparency for every credit, debit, carry-forward, and lapse transaction.

---

## 2. Key Systems Implemented

### 2.1 Enterprise Leave Policy & Type Schema
- **Upgraded Model (`Backend/src/models/LeaveType.js`)**:
  - `code`: Standardized leave codes (e.g. `CL`, `SL`, `EL`, `COMP`, `LWP`).
  - `accrualFrequency`: `monthly`, `quarterly`, `yearly`, `none`.
  - `monthlyAccrualRate`: Configurable accrual pace (e.g. 1.25 or 1.5 days/month).
  - `carryForward` & `maxCarryForward`: Limits for annual balance rollover.
  - `maxEncashable`: Ceiling for paid leave encashment.
  - `sandwichRuleEnabled`: Toggle determining whether intervening weekly-offs/holidays count as leaves.
  - `priorNoticeDays`: Minimum advance notice required before taking leave.
  - `maxConsecutiveDays`: Restricts excessive single leave windows.
  - `docRequiredAfterDays`: Enforces medical/proof certificates for leaves exceeding threshold.
  - `color`: UI color badges for calendar and pill visualization.
- **Default Seed Profiles (`Backend/src/utils/attendanceUtils.js`)**:
  - Pre-seeded with industry defaults:
    - **Casual Leave (`CL`)**: 12 days/yr, monthly accrual (1.0d/mo), sandwich rule enabled, 2 days notice.
    - **Sick Leave (`SL`)**: 8 days/yr, yearly grant, medical certificate required after 2 days.
    - **Earned Leave (`EL`)**: 15 days/yr, monthly accrual (1.25d/mo), carry forward up to 30 days, 7 days notice.
    - **Compensatory Off (`COMP`)**: Accrued via overtime hours, 60-day validity.
    - **Unpaid Leave (`LWP`)**: Sandwich rule enabled.

### 2.2 Immutable Leave Balance Ledger (`Backend/src/models/LeaveLedger.js`)
- Financial-grade transaction history for every leave balance adjustment.
- Tracks `organizationId`, `employeeId`, `userId`, `leaveTypeId`, `year`, `transactionType`, `days` (positive for credits, negative for debits), `balanceBefore`, `balanceAfter`, `referenceId` (linked LeaveRequest or CompOffGrant), `notes`, and `performedBy`.
- Supported transaction types:
  - `credit_annual` (yearly grant)
  - `credit_accrual` (monthly prorated accrual)
  - `debit_leave` (approved leave deduction)
  - `credit_compoff` (overtime compensatory off grant)
  - `debit_lapse` (year-end forfeiture)
  - `debit_encashment` (paid leave encashment)
  - `manual_adjustment` (HR adjustments)

### 2.3 Accrual & Sandwich Policy Service (`Backend/src/services/leaveAccrualService.js`)
- **`runMonthlyAccrual(orgId, month, year, actorUserId)`**:
  - Automatically identifies active employees.
  - Computes prorated credits based on employee join date (full credit if joined <= 15th, half credit if > 15th).
  - Guarantees idempotency via ledger check (prevents double crediting).
  - Atomically increments `LeaveBalance.allocated` and creates `LeaveLedger` audit record.
- **`evaluateSandwichRule(orgId, employeeId, startDate, endDate, leaveTypeId)`**:
  - Inspects tenant weekly-off settings (`workWeekDays`) and statutory holidays (`Holiday` records).
  - Detects if non-working days are sandwiched between leaves (e.g. leave on Friday and Monday surrounding Saturday/Sunday).
  - Automatically calculates `baseDays`, `sandwichDays`, `totalDays`, and generates explanations.
- **`runYearEndProcessing(orgId, fromYear, toYear, actorUserId)`**:
  - Handles year-end rollover up to `maxCarryForward` and logs `debit_lapse` for forfeited days.

### 2.4 Compensatory Off (Comp-Off) Overtime Bridge
- **Model (`Backend/src/models/CompOffGrant.js`)**:
  - Links Phase 1 overtime records into time-off credits.
  - Validates `overtimeMinutes >= 60`, grants 0.5 or 1.0 day credits with 60-day expiration.
- **Controller (`Backend/src/controllers/compOffController.js`)**:
  - `getCompOffRequests()`: Accessible to employees and managers.
  - `createCompOffRequest()`: Starts approval workflow and logs audit event.
  - `approveCompOff()`: Credits `LeaveBalance` under "Compensatory Off", creates `LeaveLedger` transaction (`credit_compoff`), and advances workflow.
  - `rejectCompOff()`: Records reviewer justification.

### 2.5 API Endpoints Wired in `Backend/src/routes/hrRoutes.js`
- `GET /api/v1/hr/leaves/types` & `POST /api/v1/hr/leaves/types` & `PATCH /api/v1/hr/leaves/types/:id`
- `GET /api/v1/hr/leaves/balance`
- `GET /api/v1/hr/leaves/requests` & `POST /api/v1/hr/leaves/requests`
- `PATCH /api/v1/hr/leaves/requests/:id/approve` & `PATCH /api/v1/hr/leaves/requests/:id/reject`
- `POST /api/v1/hr/leaves/sandwich-preview`
- `GET /api/v1/hr/leaves/ledger`
- `POST /api/v1/hr/leaves/accrual/run`
- `GET /api/v1/hr/leaves/comp-off` & `POST /api/v1/hr/leaves/comp-off`
- `PATCH /api/v1/hr/leaves/comp-off/:id/approve` & `PATCH /api/v1/hr/leaves/comp-off/:id/reject`

### 2.6 Frontend UX (`Frontend/src/pages/hrms/LeavePage.tsx`)
Built with **Nebula Premium Light 2.0**:
1. **My Leave**:
   - Balance cards showing available days, total allocated/accrued, and used progress bar.
   - **Request Leave Modal**: Includes debounced real-time **Sandwich Policy Preview banner** showing how many weekend/holiday days will be included in the deduction before submission.
   - Leave requests history table with status pills.
2. **Leave Ledger**:
   - Complete audit trail table with year selector and transaction type filters.
   - Highlights credit additions in emerald and deductions in rose with running balances.
3. **Comp-Off Grants**:
   - Overtime-to-leave conversion claims table.
   - **Claim Comp-Off Modal** with overtime minutes calculator and half/full day selector.
4. **Approvals (Management)**:
   - Manager approval queue with status filters, employee details, and inline Approve/Reject dialogs.
5. **Comp-Off Queue (Management)**:
   - Dedicated inbox for approving or rejecting overtime comp-off claims.
6. **Policy & Accruals Hub (Management)**:
   - **Execute Accruals Engine**: Month/year selector with one-click monthly accrual execution.
   - **Leave Policy Catalog**: Interactive cards for each leave type displaying quota, accrual rate, sandwich rules, and carry forward ceilings.
   - **Create / Edit Leave Policy Modal**.

---

## 3. Verification & Build Quality

- **Frontend Compilation**: `npm run build` completed with Vite 6.4.3 & TypeScript:
  ```bash
  > nebula-frontend@1.0.0 build
  > tsc -b && vite build

  vite v6.4.3 building for production...
  ✓ 3118 modules transformed.
  dist/index.html                     1.28 kB │ gzip:   0.69 kB
  dist/assets/index-Dt4DH4wk.css    180.57 kB │ gzip:  26.07 kB
  dist/assets/index-DDtLvhx_.js   3,507.59 kB │ gzip: 768.33 kB
  ✓ built in 25.22s
  ```
- **Exit Code**: `0` (Zero compiler errors, zero type mismatches).

---

## 4. Next Phase: Phase 3 360° Employee Dossier & Interactive Org Chart

With Phase 1 (Attendance/Shifts) and Phase 2 (Leave Engine) complete, we are ready for:
- **Phase 3: 360° Employee Dossier & Org Chart**:
  - Full employee profile: Personal info, statutory IDs, bank details, emergency contacts, education, work history, promotion/transfer timeline.
  - Multi-tier organizational hierarchy (`Company → Branch / Location → Department → Team`).
  - Designations & Grade structure.
  - Interactive visual Org Chart with zoom/pan and reporting lines.
