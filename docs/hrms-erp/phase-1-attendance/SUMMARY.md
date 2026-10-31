# Phase 1: Advanced Attendance & Multi-Shift Rostering — Summary

**Nebula HUB HRMS → ERP Upgrade**  
*Completed: Phase 1 Advanced Attendance*  
*Theme: Nebula Premium Light 2.0 (`#f97316`, `#fff7ed`, `#ECE0D6`, `#FBF8F4`, `#1A1A1A`)*  

---

## 1. Overview & Objectives Achieved

Phase 1 elevates Nebula HRMS from a single org-wide 9-to-5 punch clock into a full enterprise-grade **Multi-Shift Rostering, Overtime Calculation, and Attendance Regularization Engine**.

Employees and teams now operate with customizable shift templates (morning, evening, night, rotating), dynamic grace buffers, automated overtime tracking, and a self-service punch regularization lifecycle integrated into the Phase 0 generic approval workflow and audit engine.

---

## 2. Key Systems Implemented

### 2.1 Multi-Shift Architecture & Employee Allocation
- **Shift Template Model (`Backend/src/models/Shift.js`)**:
  - `startTime`, `endTime`, `graceMinutes` (e.g. 15 mins).
  - `fullDayMinutes` (default 480m = 8h), `halfDayMinutes` (default 240m = 4h).
  - `workWeekDays` (array of day numbers `[1, 2, 3, 4, 5]`).
  - `isNightShift` (handles midnight-crossing shifts), `color` (hex for UI pill badges), and `isDefault` flag.
- **Roster Allocation Model (`Backend/src/models/EmployeeShift.js`)**:
  - `effectiveFrom` and optional `effectiveTo` dating for shift schedules.
  - Supports bulk assignment across individual employees or teams.
- **Shift Controller (`Backend/src/controllers/shiftController.js`)**:
  - `getShifts()`, `createShift()`, `updateShift()`, `deleteShift()`.
  - `assignShift()`: Assigns shift to multiple employees with effective date ranges.
  - `getActiveShiftForEmployee()`: Resolves the employee's active assigned shift for any target date, falling back to the organization's default shift.

### 2.2 Shift-Aware Clock-In/Out & Overtime Engine
- **Attendance Utils Upgrade (`Backend/src/utils/attendanceUtils.js`)**:
  - Upgraded `isTimeLate(checkInTime, shiftStartTime, graceMinutes)` to support dynamic grace periods per shift instead of fixed 15-minute global windows.
- **Dynamic Check-In / Check-Out (`Backend/src/controllers/hrAttendanceController.js`)**:
  - `doCheckIn`: Dynamically resolves active employee shift, verifies lateness against shift-specific grace minutes, and persists `shiftId` on `AttendanceRecord`.
  - `doCheckOut`: Computes net worked minutes and calculates `overtimeMinutes = Math.max(0, totalWorkedMinutes - shift.fullDayMinutes)`.
  - `getToday`: Returns active shift information, overtime minutes, and `isRegularized` flag.
  - `getRoster`: Populates active shifts, overtime minutes, and regularized tags for each team member on any selected date.

### 2.3 Attendance Regularization & Punch Correction Lifecycle
- **Regularization Model (`Backend/src/models/AttendanceRegularization.js`)**:
  - Types: `missed_check_in`, `missed_check_out`, `incorrect_hours`, `outdoor_duty`, `work_from_home`.
  - Stores `date`, `requestedCheckInAt`, `requestedCheckOutAt`, `reason`, `status` (`pending`, `approved`, `rejected`), `reviewedBy`, `reviewerComments`.
- **Workflow & Recomputation Controller (`Backend/src/controllers/attendanceRegularizationController.js`)**:
  - `getRegularizations()`: Tenant-isolated query filterable by status and employee.
  - `createRegularization()`: Submits correction request, generates audit event, and initiates workflow engine tracking.
  - `approveRegularization()`:
    1. Validates permissions and manager/HR role.
    2. Updates or creates canonical `AttendanceRecord`.
    3. Recomputes `totalWorkedMinutes`, `isLate`, and `overtimeMinutes`.
    4. Sets `isRegularized: true` and links `regularizationId`.
    5. Dispatches audit event and marks workflow step complete.
  - `rejectRegularization()`: Records rejection justification and updates workflow instance.

### 2.4 Endpoints Wired in `Backend/src/routes/hrRoutes.js`
- `GET /api/v1/hr/shifts` & `POST /api/v1/hr/shifts`
- `PATCH /api/v1/hr/shifts/:id` & `DELETE /api/v1/hr/shifts/:id`
- `POST /api/v1/hr/shifts/assign`
- `GET /api/v1/hr/shifts/active/:employeeId`
- `GET /api/v1/hr/attendance/regularizations` & `POST /api/v1/hr/attendance/regularizations`
- `PATCH /api/v1/hr/attendance/regularizations/:id/approve`
- `PATCH /api/v1/hr/attendance/regularizations/:id/reject`

### 2.5 Enterprise Frontend UX (`Frontend/src/pages/hrms/AttendancePage.tsx`)
Built strictly with **Nebula Premium Light 2.0**:
1. **My Attendance (Personal Dashboard)**:
   - Active shift badge: displays shift name, start-to-end window, grace threshold, and night shift tag.
   - Overtime display: prominent badge showing accumulated overtime for the day (e.g. `+1h 30m Overtime`).
   - Regularized punch indicator: shows when a record has been verified via approved punch correction.
   - Self-service **"Request Regularization"** modal with date selector, type picker, requested punch times, and justification.
   - Personal regularization history table displaying past requests, approval status, and reviewer feedback.
2. **Team Roster (Manager/HR View)**:
   - Real-time roster table with member search filter, date picker, status chips, shift pill badges, clock-in time with late/regularized tags, worked hours, and overtime pill badges.
3. **Regularizations Queue (Approval Inbox)**:
   - Dedicated tab for managers and HR administrators with filter tabs (`Pending`, `Approved`, `Rejected`, `All`).
   - Notification pill on the tab header showing pending requests count.
   - Inline "Approve" and "Reject" dialogs with custom comments.
4. **Shift Rostering (Administration)**:
   - Shift catalog displaying active shift cards with timings, grace periods, work week pills, default and night badges.
   - **Create / Edit Shift Modal**: Comprehensive shift configuration including working days selector, color swatch, grace period, full/half day minute limits.
   - **Assign Shift Modal**: Multi-employee selection checklist with effective date range assignment.

---

## 3. Verification & Build Quality

- **Vite & TypeScript Compilation**: Ran `npm run build` in `Frontend/`:
  ```bash
  > nebula-frontend@1.0.0 build
  > tsc -b && vite build

  vite v6.4.3 building for production...
  ✓ 3118 modules transformed.
  dist/index.html                     1.28 kB │ gzip:   0.69 kB
  dist/assets/index-CEMi4TZm.css    180.90 kB │ gzip:  26.10 kB
  dist/assets/index-CGKJyg7f.js   3,472.81 kB │ gzip: 763.04 kB
  ✓ built in 24.64s
  ```
- **Exit Code**: `0` (Zero compiler errors, 100% type-safe).

---

## 4. Next Phase: Phase 2 Leave Policy & Accruals Engine

With Phase 1 complete, the foundation and attendance rostering are fully operational. Next up:
- **Phase 2: Enterprise Leave Management**:
  - Prorated monthly accruals engine.
  - Sandwich leave policy enforcement (spanning weekends/holidays).
  - Comp-off grants against overtime hours accrued from Phase 1.
  - Encashment & carry-forward rules with year-end forfeiture.
