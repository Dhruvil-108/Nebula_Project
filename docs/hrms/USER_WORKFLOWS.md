# HRMS Module — User Workflows & Operational Guides

This document outlines the standard operational workflows for employees, managers, and HR administrators using Nebula HRMS.

---

## 1. Employee Daily Attendance & Break Logging

### Objective
Accurately record daily work hours and break periods with real-time feedback on shift latency.

### Steps
1. Navigate to **HRMS ➔ Attendance** (`/dashboard/hrms/attendance`).
2. **Clocking In**:
   - The UI shows your current status as `Not checked in`.
   - Click the green **Check In** button.
   - The status updates to `Checked In` (Green), displaying your check-in time and starting the live shift timer.
   - If the current time is past the organization's configured shift start (default `09:30`), a yellow **Late** badge appears.
3. **Taking a Break**:
   - Click **Take Break**.
   - Status switches to `On Break` (Amber); the shift timer pauses.
   - When returning, click **Resume Work**; status reverts to `Checked In` and timing resumes.
4. **Clocking Out**:
   - At the conclusion of your shift, click **Clock Out**.
   - Your total worked minutes are calculated (gross duration minus all recorded break intervals) and saved permanently.
   - Status transitions to `Checked Out` (Slate), locking further punches for that calendar day.

---

## 2. Requesting Time-Off (Leave)

### Objective
Submit a planned leave request and track quota utilization.

### Steps
1. Navigate to **HRMS ➔ Leave** (`/dashboard/hrms/leave`).
2. In the **My Leave** tab, review your quota balance cards (e.g. *Casual Leave: 9 / 12 remaining*).
3. Click **Request Leave**.
4. In the modal:
   - Select the **Leave Type** (Casual, Sick, Earned, Unpaid).
   - Choose the **Start Date** and **End Date**.
   - Enter a brief **Reason**.
5. Click **Submit Request**.
6. The request appears in your *My Leave Requests* table with status `Pending` (Amber).

---

## 3. Manager / HR Leave Approval Workflow

### Objective
Review and approve or reject employee leave requests with automated balance debiting and attendance calendar reservation.

### Steps
1. Navigate to **HRMS ➔ Leave** and select the **Team Approvals** tab (visible to `manager`, `hr`, `admin`, `super_admin`).
2. Filter by status (`Pending`, `Approved`, `Rejected`).
3. For each pending request:
   - Review employee name, designation, requested dates, total days, and submitted reason.
   - Click **Approve** (Green checkmark) or **Reject** (Red cross).
4. **On Approval**:
   - The engine automatically executes a transaction:
     - Deducts the requested days from the employee's active `LeaveBalance`.
     - Automatically creates or updates daily `AttendanceRecord` entries for every date in the range, setting status to `on_leave`.
     - Flags the request as `Approved`.

---

## 4. Candidate-to-Employee Conversion (Recruitment Bridge)

### Objective
Seamlessly transition a hired job candidate into an active HRMS employee record with zero manual data re-entry.

### Steps
1. Navigate to **Recruitment ➔ Candidates** or **Recruitment ➔ Offers**.
2. Select a candidate who has accepted their job offer.
3. Click **Onboard as Employee**.
4. Review the pre-populated details:
   - Full Name, Email, Phone
   - Proposed Department and Designation
   - Joining Date and Employment Type
   - Auto-generated Employee Code (e.g. `EMP-2026-0045`)
5. Click **Confirm Onboarding**:
   - The candidate's resume and signed offer letter are automatically copied into the new employee's **Document Vault**.
   - An automated request for the employee's starter `EquipmentKit` (laptop, accessories) is dispatched to Inventory Management.
   - The candidate's ATS status advances to `Hired`.

---

## 5. Employee Directory & Personnel Management

### Objective
Maintain corporate personnel dossiers, skill profiles, and departmental reporting lines.

### Steps
1. Navigate to **HRMS ➔ Employees** (`/dashboard/hrms/employees`).
2. Search and filter by department, status, employment type, or keyword.
3. Click on any employee row to open the 600px **Detail Drawer**:
   - **Profile Tab**: View personal details, department, manager, joining date, and skill tags.
   - **Documents Tab**: View and download uploaded certificates, contracts, and ID scans.
   - **Activity Timeline**: View corporate notes, calls, and internal touchpoints.
   - **Leave Balances**: View real-time quota progress bars.
   - **Recent Attendance**: Inspect the last 7 days of punch records, net worked hours, and lateness indicators.
