# Nebula HUB — HRMS ERP Comprehensive Use Cases

This document details the core enterprise use cases across Nebula HRMS ERP, covering pre-conditions, trigger events, step-by-step flows, exception paths, and cross-module business logic.

---

## UC-01: Multi-Department Onboarding & Task Orchestration

- **Primary Actor:** HR Executive / Onboarding Specialist
- **Secondary Actors:** IT Admin, Finance Officer, Direct Manager, New Hire
- **Pre-Conditions:** Candidate marked as `offered` or `hired` in Recruitment ATS module.
- **Trigger:** HR clicks "Initiate Onboarding" on candidate dossier.

```mermaid
sequenceDiagram
    autonumber
    actor HR
    actor IT
    actor Employee
    participant Service as LifecycleService
    participant Case as OnboardingCase Model

    HR->>Service: createOnboardingCase(employeeId, joiningDate)
    Service->>Case: Generate standard checklist tasks (HR, IT, Finance, Manager)
    Case-->>Service: Case Created (Status: in_progress, Progress: 0%)
    
    IT->>Service: toggleOnboardingTask(taskId, isCompleted: true)
    Note over IT,Service: "Provision Laptop, SSO, and corporate email"
    Service->>Case: Task completed, progress updated to 25%

    HR->>Service: toggleOnboardingTask(taskId, isCompleted: true)
    Note over HR,Service: "Verify statutory documents, sign contract"
    
    Employee->>Service: Acknowledge company policies
    Service->>Case: All 12 mandatory tasks completed
    Case-->>Service: Auto-transition status to 'completed'
```

---

## UC-02: Inventory Asset Exit Clearance & F&F Settlement

- **Primary Actor:** Exiting Employee
- **Secondary Actors:** Department Manager, IT Lead, Inventory Admin, Finance Manager
- **Cross-Module Link:** Directly queries `EmployeeAssetAssignment` in Inventory module.

```mermaid
flowchart TD
    A[Employee Submits Resignation] --> B[Offboarding Case Created with Notice Period]
    B --> C{Department Clearances}
    
    C -->|IT Clearance| D[Revoke IAM, GitHub, Google Workspace, VPN]
    C -->|Hardware Clearance| E[Check Inventory Module for Assigned Assets]
    C -->|Finance Clearance| F[Calculate Gratuity, Bonus, LOP Recoveries]
    C -->|HR Clearance| G[Conduct Exit Interview & Retention Feedback]
    
    E --> H{Pending Assets Count == 0?}
    H -->|No| I[Flag: Assets Pending Return - Block HR Relieving]
    H -->|Yes| J[Admin Hardware Clearance Approved]
    
    D & J & F & G --> K{All 4 Cleared?}
    K -->|Yes| L[Execute Final Settlement & Issue Relieving PDF]
```

---

## UC-03: Attendance Tracking, Grace Windows & Overtime Computation

- **Primary Actor:** Employee
- **Secondary Actors:** Line Manager, Attendance Admin
- **Business Logic:**
  - Standard shift: 09:00 to 18:00 (540 min total).
  - Grace period: 15 minutes (clock-in up to 09:15 marked on-time; 09:16+ flagged `isLate: true`).
  - Overtime threshold: Clock-out after 18:30 computes overtime in 30-minute intervals.
  - Missed clock-out auto-regularized or requested via Regularization form.

---

## UC-04: Leave Ledger, Sandwich Rule & Comp-Off Grants

- **Primary Actor:** Employee
- **Secondary Actors:** Approving Manager, HR Admin
- **Sandwich Rule Enforcement:**
  - If an employee takes Leave on Friday and Monday with Saturday/Sunday as weekly-offs, the system previews and deducts 4 calendar days (Friday, Saturday, Sunday, Monday) from leave balance.
- **Comp-off Granting:**
  - Overtime or weekend work can be submitted as a Comp-off request. Once approved by the manager, credits are deposited into the employee's `LeaveLedger`.

---

## UC-05: Payroll Engine, Loss of Pay (LOP) & Payslip Generation

- **Primary Actor:** Payroll Specialist
- **Pre-Conditions:** Monthly attendance finalized; unpaid leaves counted.
- **Execution Flow:**

```mermaid
sequenceDiagram
    autonumber
    actor Payroll as Payroll Officer
    participant Engine as PayrollService
    participant DB as MongoDB
    participant PDF as PDFKit Streamer

    Payroll->>Engine: runMonthlyPayroll(month, year)
    Engine->>DB: Fetch Employee Salary Structures (CTC, Basic, HRA, DA, PF, ESI, Tax)
    Engine->>DB: Fetch Unpaid Leaves & Missed Days from AttendanceRecord
    Engine->>Engine: Calculate Pro-rated Deductions (LOP = Gross / 30 * UnpaidDays)
    Engine->>DB: Persist PayrollRun & Individual Payslips (Status: draft)
    Payroll->>Engine: approvePayrollRun(id)
    Engine->>DB: Update status to 'approved'
    Payroll->>Engine: markPayrollPaid(id)
    Employee->>PDF: getPayslipPdf(payslipId)
    PDF-->>Employee: Streams vector PDF with company header, earnings, and deductions
```

---

## UC-06: 360° Review, 9-Box Calibration & Attrition Predictor

- **Primary Actor:** Manager / Talent Lead
- **Process:**
  1. Review cycle initiated (Annual / Mid-Year).
  2. Employee submits Self-Review with achievements and growth areas.
  3. Direct Manager rates Performance (1-5) and Potential (1-3).
  4. System plots employee on the interactive **9-Box Grid**:
     - Star (High Performance, High Potential)
     - High Performer (High Performance, Medium Potential)
     - Core Player (Medium Performance, Medium Potential)
     - Underperformer (Low Performance, Low Potential)
  5. **Attrition Predictor Model** aggregates tenure, promotion staleness, attendance volatility, and leave trends to assign Risk Score (Low, Medium, High, Critical) with suggested retention interventions.

---

## UC-07: Workforce Planning, Skills Matrix & ATS Requisition Bridge

- **Primary Actor:** Department Head / Chief Talent Officer
- **Integration Bridge:** Approved Manpower Requisitions automatically spawn and publish Job Openings in the Recruitment ATS.

```mermaid
flowchart LR
    A[Dept Head Identifies Capacity Shortage] --> B[Raise Manpower Requisition]
    B --> C[Set Budget, Job Title, Openings, Justification]
    C --> D{Executive / HR Approval}
    D -->|Rejected| E[Requisition Marked Rejected]
    D -->|Approved| F[LifecycleService.spawnJobOpening]
    F --> G[Creates JobOpening in Recruitment ATS]
    G --> H[Published on Public Careers Portal /careers/:slug]
```
