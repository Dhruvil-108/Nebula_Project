# HRMS Module — System Architecture & Data Design

## 1. Architectural Philosophy
The HRMS module inside **Nebula HUB** provides enterprise personnel management, time & attendance tracking, leave governance, and department hierarchy. It operates on an isolated multi-tenant data model where every operational document is bounded by `organizationId`.

### Architectural Pillars
1. **Multi-Tenant Query Scoping**: Enforced via `scopedFilter(req, query)` helper across all controller operations.
2. **Deterministic Timezone Math**: Uses `Intl.DateTimeFormat` in `attendanceUtils.js` to compute day midnight boundaries (`getDayMidnightUtc`) according to each organization's configured timezone (e.g. `Asia/Kolkata`).
3. **Atomic Quota & Attendance Synchronization**: Approving a leave request executes an atomic multi-document transaction updating `LeaveBalance` and pre-populating `AttendanceRecord` entries (`status: 'on_leave'`).
4. **ATS & Inventory Bridge**: Automatic candidate onboarding converts candidate records into `Employee` entries, transfers resumes/offers to `EmployeeDocument`, and requests departmental `EquipmentKit` assets.

---

## 2. High-Level System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                FRONTEND APPLICATION                               │
│                         React 19 + TypeScript + Vite 6                            │
├───────────────────────────────────────────────────────────────────────────────────┤
│ EmployeesPage │ AttendancePage │ LeavePage │ DepartmentsPage │ DocumentsPage       │
└─────────────────────────┬─────────────────────────────────────────────────────────┘
                          │ TanStack Query v5 & Axios Client
                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                 EXPRESS BACKEND                                   │
│                        Node.js 18+  │  Express.js 4.x                             │
├───────────────────────────────────────────────────────────────────────────────────┤
│ Middleware: requireAuth ──► scopedFilter ──► requireModuleAccess('hrms')          │
├───────────────────────────────────────────────────────────────────────────────────┤
│ Controllers:                                                                      │
│  ├── employeeController.js           (Dossier CRUD, Documents, Cascade Deletion)  │
│  ├── hrAttendanceController.js       (Time Clock, Breaks, Lateness, Net Hours)    │
│  ├── hrLeaveController.js            (Leave Types, Quotas, Two-Phase Approvals)   │
│  ├── departmentController.js         (Org Hierarchy & Dynamic Headcounts)         │
│  ├── hrController.js                 (Holiday Calendaring & Executive KPIs)       │
│  └── hiringHrmsBridgeController.js   (1-Click ATS Candidate Onboarding Bridge)    │
└─────────────────────────┬─────────────────────────────────────────────────────────┘
                          │ Mongoose 8.x ODM
                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                 MONGODB DATABASE                                  │
│  Employee │ Department │ AttendanceRecord │ LeaveType │ LeaveBalance │ LeaveRequest│
│  Holiday  │ EmployeeDocument │ Activity │ User │ Organization                     │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema Overview

### 3.1 `Employee` (`Employee.js`)
- `organizationId`: ObjectId (ref: Organization, indexed)
- `userId`: ObjectId (ref: User, nullable, indexed)
- `employeeCode`: String (Unique per org, uppercase)
- `fullName`: String (maxlength 150)
- `email`: String (lowercase)
- `phone`: String
- `departmentId`: ObjectId (ref: Department, nullable)
- `designation`: String
- `joiningDate`: Date
- `managerId`: ObjectId (ref: Employee, nullable)
- `employmentType`: Enum (`full_time`, `part_time`, `contract`, `intern`)
- `status`: Enum (`active`, `on_notice`, `exited`)
- `skills`: [String]

### 3.2 `Department` (`Department.js`)
- `organizationId`: ObjectId (ref: Organization, indexed)
- `name`: String (Unique per org)
- `headId`: ObjectId (ref: Employee, nullable)
- `description`: String

### 3.3 `AttendanceRecord` (`AttendanceRecord.js`)
- `organizationId`: ObjectId (ref: Organization, indexed)
- `employeeId`: ObjectId (ref: User, indexed)
- `date`: Date (Midnight UTC for local org day)
- `checkInAt`: Date (nullable)
- `checkOutAt`: Date (nullable)
- `breaks`: `[{ breakInAt: Date, breakOutAt: Date }]`
- `status`: Enum (`present`, `absent`, `half_day`, `on_leave`, `holiday`, `weekend`)
- `totalWorkedMinutes`: Number (net minutes worked)
- `isLate`: Boolean (true if checkInAt > shiftStartTime)
- **Unique Index**: `{ organizationId: 1, employeeId: 1, date: 1 }`

### 3.4 `LeaveType` (`LeaveType.js`)
- `organizationId`: ObjectId (ref: Organization, indexed)
- `name`: String
- `annualQuota`: Number
- `carryForward`: Boolean

### 3.5 `LeaveBalance` (`LeaveBalance.js`)
- `organizationId`: ObjectId (ref: Organization, indexed)
- `employeeId`: ObjectId (ref: User/Employee, indexed)
- `leaveTypeId`: ObjectId (ref: LeaveType, indexed)
- `year`: Number
- `allocated`: Number
- `used`: Number
- **Unique Index**: `{ organizationId: 1, employeeId: 1, leaveTypeId: 1, year: 1 }`

### 3.6 `LeaveRequest` (`LeaveRequest.js`)
- `organizationId`: ObjectId (ref: Organization, indexed)
- `employeeId`: ObjectId (ref: User/Employee, indexed)
- `leaveTypeId`: ObjectId (ref: LeaveType, indexed)
- `startDate`: Date
- `endDate`: Date
- `totalDays`: Number
- `status`: Enum (`pending`, `approved`, `rejected`)
- `reviewedBy`: ObjectId (ref: User, nullable)
- `reason`: String

### 3.7 `Holiday` (`Holiday.js`)
- `organizationId`: ObjectId (ref: Organization, indexed)
- `name`: String
- `date`: Date
- `isOptional`: Boolean

### 3.8 `EmployeeDocument` (`EmployeeDocument.js`)
- `organizationId`: ObjectId (ref: Organization, indexed)
- `employeeId`: ObjectId (ref: Employee, indexed)
- `docType`: Enum (`id_proof`, `certificate`, `offer_letter`, `contract`, `other`)
- `fileName`: String
- `fileUrl`: String
- `uploadedBy`: ObjectId (ref: User, nullable)
