# Nebula HRMS — Phase 3: 360° Employee Dossier & Interactive Multi-Branch Org Chart

**Status:** Completed & Production-Verified (`npm run build` exited with code 0)  
**Date:** October 2026  
**Module:** Human Resource Management System (HRMS)  
**Design Standard:** Nebula Premium Light 2.0 (Brand orange `#f97316`, warm surface `#FBF8F4`, border `#ECE0D6`, text `#1A1A1A` and `#6B6B6B`)

---

## 1. Executive Summary

Phase 3 transitions Nebula HUB from a basic employee table and simple department listing into a full-scale **Enterprise Organizational Backbone**. It delivers two major pillars:
1. **360° Employee Dossier:** A unified, comprehensive personnel profile structured across 6 dedicated tabs (Identity & Core Job, Personal & Statutory IDs, Direct Deposit Bank & Payroll, Career Transition Timeline, Education & Past Work Experience, and Real-time Attendance & Document Repository).
2. **Interactive Visual Org Chart:** A zoomable, pannable, and collapsible hierarchical command tree dynamically calculating direct and total team report counts, cross-branch locations, and maximum organizational depth. Clicking any node immediately surfaces the 360° dossier.
3. **Career Progression & Audit Engine:** A formalized transition lifecycle supporting promotions, lateral transfers, grade revisions, and compensation updates with before/after audit tracking.

---

## 2. Architecture & Data Model Enhancements

### A. New Mongoose Schemas

1. **`BranchLocation` (`Backend/src/models/BranchLocation.js`)**
   - Supports multi-branch and physical office sites:
     - `name`: Office title (e.g. "Global HQ", "EMEA Operations Center").
     - `code`: Unique branch code (e.g. `HQ-NYC`, `LON-01`).
     - `isHeadquarters`: Boolean flag distinguishing global HQ.
     - `timezone`: IANA timezone identifier (e.g. `America/New_York`, `Asia/Kolkata`).
     - `address`: Detailed street lines, city, state, country, and postal code.
     - `contactPhone`, `contactEmail`, `isActive`.

2. **`Designation` (`Backend/src/models/Designation.js`)**
   - Standardized job titles and pay grade classification:
     - `title`: Job title (e.g. "Staff Engineer", "VP of Engineering").
     - `code`: Job designation code (e.g. `DES-ENG-05`).
     - `gradeLevel`: Strict standard grades (`L1` to `L7`).
     - `departmentId`: Relational department link.
     - `minSalary`, `maxSalary`: Standard compensation ranges for pay parity.

3. **`JobHistory` (`Backend/src/models/JobHistory.js`)**
   - Audit trail capturing all promotions and transfers:
     - `employeeId`: Linked employee.
     - `transitionType`: `promotion`, `transfer`, `designation_change`, `grade_change`, `compensation_revision`.
     - `effectiveDate`: Date the change takes legal/statutory effect.
     - `previousDepartmentId` → `newDepartmentId`.
     - `previousDesignation` → `newDesignation`.
     - `previousGrade` → `newGrade`.
     - `previousSalary` → `newSalary`.
     - `previousManagerId` → `newManagerId`.
     - `reason`: Justification / performance board approval notes.
     - `approvedBy`: User executing the promotion/transfer.

4. **Extended `Employee` (`Backend/src/models/Employee.js`)**
   - Seamlessly backward-compatible extensions:
     - `branchId`: Reference to `BranchLocation`.
     - `designationId`: Reference to `Designation`.
     - `grade`: Current level (`L1` - `L7`, defaults to `L2`).
     - `personalInfo`: DOB, gender, marital status, blood group, current & permanent address.
     - `statutoryIds`: PAN / Tax ID, Aadhaar / National ID, UAN, Passport number & expiry, Driving License.
     - `bankDetails`: Account number, IFSC / routing code, bank name, branch name, account holder name.
     - `emergencyContacts`: Array of `{ name, relationship, phone, email, address }`.
     - `education`: Array of `{ institution, degree, fieldOfStudy, startDate, endDate, gradeOrGpa }`.
     - `workHistory`: Array of `{ company, jobTitle, startDate, endDate, isCurrent, responsibilities }`.
     - `customFields`: Extensible key-value Map for tenant-specific custom fields.

---

## 3. Backend Controllers & API Endpoints

All endpoints are mounted under `/api/v1/hr/*` and gated with session authentication and role permissions:

| Endpoint | Method | Permission | Controller & Purpose |
|---|---|---|---|
| `/api/v1/hr/branches` | `GET` | `hrms:view` | Lists all branch locations with real-time headcount aggregation |
| `/api/v1/hr/branches` | `POST` | `hrms:create` | Creates branch office location (auto headquarters enforcement) |
| `/api/v1/hr/branches/:id` | `PATCH` | `hrms:edit` | Updates branch details and audits changes |
| `/api/v1/hr/branches/:id` | `DELETE` | `hrms:delete` | Deletes branch (blocks deletion if active headcount exists) |
| `/api/v1/hr/designations` | `GET` | `hrms:view` | Lists designations filtered by department or grade level |
| `/api/v1/hr/designations` | `POST` | `hrms:create` | Creates job designation and assigns salary band |
| `/api/v1/hr/designations/:id` | `PATCH` | `hrms:edit` | Updates designation titles and grade levels |
| `/api/v1/hr/designations/:id` | `DELETE` | `hrms:delete` | Removes designation |
| `/api/v1/hr/org-chart` | `GET` | `hrms:view` | Computes recursive organizational tree with direct and total report counts |
| `/api/v1/hr/employees/:id/lifecycle` | `POST` | `hrms:edit` | Executes promotion, transfer, or grade revision; creates `JobHistory` entry |
| `/api/v1/hr/employees/:id/job-history` | `GET` | `hrms:view` | Retrieves full career timeline for an employee |

---

## 4. Frontend Enhancements

### A. 360° Dossier Drawer (`Frontend/src/pages/hrms/EmployeesPage.tsx`)
- Upgraded the slide-out drawer with a 6-tab navigation:
  1. **Overview:** Core profile, work email, phone, branch, department, grade level (`L1`-`L7`), manager, and skills.
  2. **Personal & Statutory:** DOB, gender, marital status, blood group, current/permanent address, PAN/Tax ID, Aadhaar, UAN, and Passport info.
  3. **Bank & Payroll:** Direct deposit details, bank name, branch name, masked account number, IFSC code, and ACH verification pill.
  4. **Career Timeline:** Interactive vertical timeline showing every historical promotion, lateral transfer, department transfer, and compensation revision with transition badges and reason notes.
  5. **Education & Work:** Academic qualifications (degrees, GPAs, institutions) and prior employer history.
  6. **Attendance & Docs:** Recent 7-day attendance punch log, active annual leave balances, and downloadable document dossier.

### B. Career Transition Modal
- Provides management users with a quick "Transition" action button on every employee row:
  - Select transition type (`Promotion`, `Lateral Transfer`, `Designation Change`, `Grade Revision`, `Compensation Revision`).
  - Pre-fills current job state and allows choosing new department, new title, new grade level, new reporting manager, and updated CTC.
  - Automatically updates the employee record and writes to `JobHistory`.

### C. Interactive Org Chart (`Frontend/src/pages/hrms/OrgChartPage.tsx`)
- Interactive canvas rendering recursive tree nodes with clean reporting line connectors.
- Top KPI statistics: Total Headcount, Department count, Branch count, and Hierarchy Depth.
- Department & Branch filters to isolate branch-specific command structures.
- Instant search highlight for employees or designations.
- Controls for Zoom In, Zoom Out, Reset (100%), Expand All, and Collapse All.
- Direct click integration: Clicking any node card opens the employee's 360° dossier.

---

## 5. Verification & Build Confirmation

- **TypeScript Compilation:** All types (`BranchLocation`, `Designation`, `JobHistoryEntry`, `OrgChartNode`, `PromoteTransferInput`) verified.
- **Production Build:**
  ```bash
  npm run build
  # Exit code: 0
  # 3,119 modules transformed
  # dist/assets/index-DNs75Aul.js built in 26.69s
  ```
- **Aesthetic Conformance:** Follows Nebula Premium Light 2.0 design tokens (`#f97316`, `#fff7ed`, `#fed7aa`, `#ECE0D6`, `#FBF8F4`).
