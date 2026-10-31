# HRMS Module — API Reference

All requests must include standard JWT authorization:
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## 1. Executive Summary
- **Endpoint**: `GET /api/v1/hr/summary`
- **Access**: `hrms:view`
- **Description**: Returns live HRMS KPIs for dashboard display.
- **Response**:
```json
{
  "headcount": 48,
  "totalAccounts": 52,
  "presentToday": 36,
  "onBreakToday": 4,
  "checkedOutToday": 6,
  "notClockedInToday": 6,
  "pendingLeaveRequests": 3,
  "upcomingHolidays": 2
}
```

---

## 2. Employees

### 2.1 List Employees
- **Endpoint**: `GET /api/v1/hr/employees`
- **Access**: `hrms:view`
- **Query Parameters**:
  - `department` (ObjectId string)
  - `status` (`active`, `on_notice`, `exited`)
  - `employmentType` (`full_time`, `part_time`, `contract`, `intern`)
  - `search` (name, code, email, designation)
- **Response**: Array of `Employee` objects with populated `departmentId`, `managerId`, `userId`.

### 2.2 Create Employee
- **Endpoint**: `POST /api/v1/hr/employees`
- **Access**: `hrms:create`
- **Body**:
```json
{
  "employeeCode": "EMP-2026-004",
  "fullName": "Jane Doe",
  "email": "jane@acme.com",
  "phone": "+1 555-0199",
  "departmentId": "65fc1234567890abcdef1111",
  "designation": "Staff Engineer",
  "joiningDate": "2026-04-01",
  "managerId": "65fc1234567890abcdef2222",
  "employmentType": "full_time",
  "status": "active",
  "skills": ["TypeScript", "Node.js"]
}
```

### 2.3 Get Employee Details
- **Endpoint**: `GET /api/v1/hr/employees/:id`
- **Access**: `hrms:view` (Non-management can only view own record)
- **Response**: Enriched employee dossier including:
  - Base `Employee` fields
  - `documents`: Array of `EmployeeDocument`
  - `activities`: Array of `Activity` (related to employee)
  - `leaveBalances`: Current year balances with `allocated`, `used`, `remaining`
  - `recentAttendance`: 7-day punch history with live calculated minutes

### 2.4 Update Employee
- **Endpoint**: `PATCH /api/v1/hr/employees/:id`
- **Access**: `hrms:edit`
- **Body**: Partial `EmployeeInput` object.

### 2.5 Delete Employee
- **Endpoint**: `DELETE /api/v1/hr/employees/:id`
- **Access**: `hrms:delete`
- **Cascade Behavior**: Deletes documents, activities, attendance records, leave requests, leave balances; nullifies manager and department head references.

---

## 3. Employee Documents

### 3.1 Get Documents
- **Endpoint**: `GET /api/v1/hr/employees/:id/documents`
- **Access**: `hrms:view`

### 3.2 Upload Document
- **Endpoint**: `POST /api/v1/hr/employees/:id/documents`
- **Access**: `hrms:create`
- **Body**:
```json
{
  "docType": "id_proof",
  "fileName": "Passport.pdf",
  "fileUrl": "https://storage.nebula.internal/docs/passport.pdf"
}
```

### 3.3 Delete Document
- **Endpoint**: `DELETE /api/v1/hr/documents/:id`
- **Access**: `hrms:delete`

---

## 4. Departments

### 4.1 List Departments
- **Endpoint**: `GET /api/v1/hr/departments`
- **Access**: `hrms:view`
- **Response**: Departments array with attached `headcount` property derived from active employees.

### 4.2 Create Department
- **Endpoint**: `POST /api/v1/hr/departments`
- **Access**: `hrms:create`
- **Body**: `{ "name": "DevOps", "headId": "...", "description": "..." }`

### 4.3 Get Department Details
- **Endpoint**: `GET /api/v1/hr/departments/:id`
- **Access**: `hrms:view`
- **Response**: Department details with populated `headId` and member roster array.

---

## 5. Attendance & Clock

### 5.1 Clock In
- **Endpoint**: `POST /api/v1/hr/attendance/check-in`
- **Access**: `hrms:view` (Authenticated user)
- **Response**: Current punch status, record, and `isLate` flag.

### 5.2 Clock Out
- **Endpoint**: `POST /api/v1/hr/attendance/check-out`
- **Access**: `hrms:view`
- **Response**: Final `totalWorkedMinutes`.

### 5.3 Break In / Out
- **Endpoints**:
  - `POST /api/v1/hr/attendance/break-in`
  - `POST /api/v1/hr/attendance/break-out`

### 5.4 Live Today Status
- **Endpoint**: `GET /api/v1/hr/attendance/today`
- **Response**: `{ currentStatus, checkInAt, checkOutAt, totalWorkedMinutes, breaks, isLate, shiftStartTime }`

### 5.5 Monthly Summary
- **Endpoint**: `GET /api/v1/hr/attendance/summary?month=10&year=2026`
- **Response**: Monthly aggregate hours, worked days, absent days, and daily breakdown.

### 5.6 Team Roster
- **Endpoint**: `GET /api/v1/hr/attendance/roster?date=2026-10-20`
- **Access**: `hrms:view` (Restricted to `super_admin`, `admin`, `manager`, `hr`)
- **Response**: Real-time status for all accounts (`checked_in`, `on_break`, `checked_out`, `on_leave`, `not_checked_in`).

---

## 6. Leave Management

### 6.1 Leave Types
- **Endpoint**: `GET /api/v1/hr/leaves/types`
- **Create**: `POST /api/v1/hr/leaves/types` (`hrms:create`, Admin/HR only)

### 6.2 Leave Balances
- **Endpoint**: `GET /api/v1/hr/leaves/balance?employeeId=me&year=2026`
- **Response**: Array of balance allocations with `allocated`, `used`, `remaining`.

### 6.3 Submit Leave Request
- **Endpoint**: `POST /api/v1/hr/leaves/requests`
- **Body**: `{ "leaveTypeId": "...", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "reason": "..." }`

### 6.4 Approve / Reject Request
- **Approve**: `PATCH /api/v1/hr/leaves/requests/:id/approve` (`hrms:approve`)
- **Reject**: `PATCH /api/v1/hr/leaves/requests/:id/reject` (`hrms:approve`)

---

## 7. Holidays

### 7.1 List Holidays
- **Endpoint**: `GET /api/v1/hr/holidays?year=2026`
- **Upcoming**: `GET /api/v1/hr/holidays/upcoming?limit=5`

### 7.2 Manage Holidays (Admin/HR only)
- **Create**: `POST /api/v1/hr/holidays`
- **Update**: `PATCH /api/v1/hr/holidays/:id`
- **Delete**: `DELETE /api/v1/hr/holidays/:id`
