# Nebula HUB — HRMS ERP UI Flow Architecture

This document maps the end-to-end navigational hierarchy, screen flows, state transitions, and user personas across the complete HRMS ERP suite in Nebula HUB.

---

## 1. System Navigation Hierarchy

```mermaid
graph TD
    Dashboard["/dashboard (Main App Shell)"] --> HRMS["/dashboard/hrms (HR Overview & Live Attendance)"]

    %% Core HRMS Nav Group
    HRMS --> Employees["/dashboard/hrms/employees<br/>(Full Dossier, Statutory, Bank, Job History)"]
    HRMS --> OrgChart["/dashboard/hrms/org-chart<br/>(Interactive Tree & Branch/Department Drilldown)"]
    HRMS --> Attendance["/dashboard/hrms/attendance<br/>(Multi-Shift Rosters, Regularization, Overtime)"]
    HRMS --> Leave["/dashboard/hrms/leave<br/>(Sandwich Rule, Ledger Audit, Comp-off Grants)"]
    HRMS --> Payroll["/dashboard/hrms/payroll<br/>(Formula Config, Runs, Payslips & Vector PDF)"]
    HRMS --> Performance["/dashboard/hrms/performance<br/>(OKRs, 360° Review, 9-Box Grid, Attrition AI)"]
    HRMS --> Lifecycle["/dashboard/hrms/lifecycle<br/>(Onboarding, Hardware Exit Clearances, Tickets, Letters)"]
    HRMS --> Talent["/dashboard/hrms/talent-planning<br/>(Skills Matrix, LMS Courses, Headcount & Requisitions)"]
    HRMS --> Settings["/dashboard/hrms/settings<br/>(Shifts, Branches, Designations, Leave Policies)"]
```

---

## 2. Persona-Based Journey Flows

### 2.1 Employee Self-Service (ESS) Journey

```mermaid
sequenceDiagram
    autonumber
    actor Employee
    participant UI as Nebula Frontend (React 19)
    participant API as Nebula API (/api/v1/hr)
    participant DB as MongoDB (Mongoose 8)

    Note over Employee,UI: Daily Attendance & Clock-In
    Employee->>UI: Navigates to HRMS Overview (/dashboard/hrms)
    UI->>API: GET /hr/attendance/today
    API->>DB: Query AttendanceRecord + Shift Policy
    DB-->>API: Active Shift (e.g., General 09:00-18:00, 15m grace)
    API-->>UI: Live status: NOT_CHECKED_IN
    Employee->>UI: Clicks "Check In"
    UI->>API: POST /hr/attendance/check-in { timestamp, coords }
    API-->>UI: Checked In (Late flag computed automatically)

    Note over Employee,UI: Helpdesk Ticket & Letters
    Employee->>UI: Visits Lifecycle (/dashboard/hrms/lifecycle)
    Employee->>UI: Raises Ticket: "Payroll Query - Tax Deduction"
    UI->>API: POST /hr/lifecycle/tickets { category, priority, subject, description }
    API-->>UI: Ticket TICK-1042 created in queue

    Note over Employee,UI: Official HR Letters
    Employee->>UI: Selects "Experience / Appointment Letter"
    UI->>API: POST /hr/lifecycle/letters/generate { templateId, employeeId }
    API-->>UI: Streams downloadable branded Vector PDF
```

---

### 2.2 Manager Approval & Team Oversight Journey

```mermaid
sequenceDiagram
    autonumber
    actor Manager
    participant UI as Nebula Frontend
    participant API as Nebula API
    participant DB as MongoDB

    Note over Manager,UI: Regularization & Leave Approval
    Manager->>UI: Navigates to Attendance / Leave
    UI->>API: GET /hr/regularizations?status=pending
    API-->>UI: List of missed check-in regularization requests
    Manager->>UI: Clicks "Approve Regularization"
    UI->>API: PATCH /hr/attendance/regularizations/:id { status: 'approved' }
    API->>DB: Recalculate AttendanceRecord worked minutes
    DB-->>API: Updated Record
    API-->>UI: Invalidate queries + Toast Notification

    Note over Manager,UI: 360° Performance Evaluation
    Manager->>UI: Navigates to /dashboard/hrms/performance
    UI->>API: GET /hr/performance/reviews?managerId=me
    API-->>UI: Pending reviews with self-evaluations
    Manager->>UI: Fills Manager Rating (1-5) & Potential Score (1-3)
    UI->>API: PATCH /hr/performance/reviews/:id/manager
    API-->>UI: Review state moved to "calibrated" / "completed"
```

---

### 2.3 HR Administrator & Executive Journey

```mermaid
stateDiagram-v2
    [*] --> Onboarding: Candidate Accepts Offer
    Onboarding --> DossierSetup: IT, HR, Finance Tasks Completed
    DossierSetup --> ActiveWorkforce: Branch, Dept, Grade, Salary Assigned

    state ActiveWorkforce {
        [*] --> RosterAttendance
        RosterAttendance --> LeaveTracking: Sandwich & Ledger
        LeaveTracking --> PayrollGeneration: Auto-Fetch Unpaid LOP Days
        PayrollGeneration --> PerformanceCycles: OKRs & 9-Box Mapping
        PerformanceCycles --> CompetencyUpskill: LMS & Skills Matrix
    }

    ActiveWorkforce --> ManpowerPlanning: Department Expansion Needed
    ManpowerPlanning --> RequisitionApproved: Budget Allocated
    RequisitionApproved --> ATSJobOpening: Auto-Spawned in Recruitment Module

    ActiveWorkforce --> ResignationInitiated: Employee Resigns
    ResignationInitiated --> DepartmentalClearance: IT + Assets + Finance + HR
    DepartmentalClearance --> FNFPaid: Final Relieving PDF Issued
    FNFPaid --> [*]
```

---

## 3. Screen State & Modal Transitions

| Screen | Primary Views / Tabs | Key Interactive Modals |
|---|---|---|
| **Employees Dossier** (`/hrms/employees`) | Grid / Table view with Department, Grade, and Status filters | Add/Edit Employee Drawer, Promote/Transfer Modal, Document Upload Modal |
| **Org Chart** (`/hrms/org-chart`) | Recursive Tree Chart, Department Grouping, Reporting Chain | Node Detail Flyout with Direct Reports Count and Manager hierarchy |
| **Attendance** (`/hrms/attendance`) | Shift Rosters, Daily Logs, Regularizations Queue, Overtime Tracker | Regularization Request Modal, Shift Assignment Drawer |
| **Leave Management** (`/hrms/leave`) | Balances Overview, Leave Requests Queue, Ledger History, Comp-off Grants | Apply Leave Modal with Live Sandwich Rule Preview, Grant Comp-off Modal |
| **Payroll Engine** (`/hrms/payroll`) | Monthly Runs, Salary Structures, Formula Rules, My Payslips | Process Payroll Modal, Salary Structure Config Drawer, Vector PDF Preview |
| **Performance Hub** (`/hrms/performance`) | Goals / OKRs, Review Cycles, 9-Box Grid, Attrition Predictor, AI Copilot | New Goal Modal, Self-Review Modal, Manager Evaluation Modal, Calibration Modal |
| **Lifecycle & Desk** (`/hrms/lifecycle`) | Onboarding Checklist, Offboarding Clearances, Helpdesk Tickets, Letters & Policies | Initiate Onboarding Modal, Exit Clearance Drawer, New Ticket Modal, Broadcast News Modal |
| **Talent Planning** (`/hrms/talent-planning`) | Skills Matrix, LMS Courses, Headcount Targets & Requisitions | Add Skill Modal, Rate Competency Modal, Schedule Program Modal, Raise Requisition Modal |
