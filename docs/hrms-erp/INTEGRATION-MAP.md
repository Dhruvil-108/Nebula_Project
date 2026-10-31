# Nebula HUB — HRMS ERP Cross-Module Integration Map

This document details the cross-module integrations, data synchronizations, event hooks, and foreign key references linking the HRMS ERP suite with all other modules across Nebula HUB.

---

## 1. Global Cross-Module Integration Map

```mermaid
graph LR
    subgraph HRMS["HRMS ERP Core"]
        Emp["Employee Dossier"]
        Att["Attendance & Shifts"]
        Leave["Leave & Sandwich"]
        Pay["Payroll Engine"]
        Perf["Performance & OKRs"]
        Life["Lifecycle & Helpdesk"]
        Talent["Talent & Requisitions"]
    end

    subgraph ATS["Recruitment / ATS Module"]
        Job["JobOpening (Open Positions)"]
        Cand["Candidate (Job Applicants)"]
        Offer["OfferLetter (E-Signing)"]
    end

    subgraph INV["Inventory & Equipment Module"]
        Asset["InventoryItem (Laptops / Gear)"]
        Assign["EmployeeAssetAssignment"]
    end

    subgraph EXP["Expenses Module"]
        Claim["ExpenseClaim"]
        Budget["DepartmentBudget"]
    end

    subgraph SEC["Security & RBAC"]
        Org["Organization (Tenant)"]
        User["User / Credentials"]
        Perm["PermissionMatrix"]
    end

    %% Integrations
    Offer -.->|Auto-Provision Employee| Emp
    Talent -->|Approve Requisition -> Auto-Spawn| Job
    Emp --- Assign
    Assign -.->|Block Exit if Unreturned Assets| Life
    Emp --- Claim
    Att -.->|Unpaid LOP Deductions| Pay
    Claim -.->|Expense Reimbursement Line Item| Pay
    SEC --- HRMS
```

---

## 2. Integration Protocols & Data Contracts

### 2.1 Recruitment ATS ↔ HRMS Bridge

| Direction | Event / Trigger | Mechanism | Target Entity / Result |
|---|---|---|---|
| **ATS → HRMS** | Candidate e-signs and accepts Offer Letter | `recruitmentService.convertCandidateToEmployee` | Creates `Employee` record with employee code, department, designation, salary structure, and triggers `OnboardingCase`. |
| **HRMS → ATS** | Manpower Requisition is approved | `lifecycleService.spawnJobOpeningFromRequisition` | Creates published `JobOpening` in ATS Recruitment module with department, budget, and openings count. |

```mermaid
sequenceDiagram
    autonumber
    actor HR as Approving Authority
    participant Talent as talentPlanningController.approveRequisition
    participant Life as lifecycleService.spawnJobOpeningFromRequisition
    participant Job as JobOpening Model (Recruitment)
    participant Req as ManpowerRequisition Model

    HR->>Talent: PATCH /hr/talent/requisitions/:id/approve
    Talent->>Req: Update status = 'approved', approvedBy = userId
    Talent->>Life: Call spawnJobOpeningFromRequisition
    Life->>Job: create({ title, departmentId, openingsCount, status: 'published' })
    Job-->>Life: Created JobOpening {_id}
    Life->>Req: Update linkedJobOpeningId = jobOpening._id
    Life-->>Talent: Return Requisition with synced JobOpening
    Talent-->>HR: 200 OK (Instant ATS Synchronization)
```

---

## 2.2 Inventory Assets ↔ HRMS Exit Clearance Bridge

| Trigger | Service Method | Query / Condition | Outcome |
|---|---|---|---|
| HR initiates employee exit or updates clearance | `lifecycleService.syncAssetClearance` | Query `EmployeeAssetAssignment` where `{ organizationId, employeeId, status: { $in: ['assigned', 'in_use', 'pending_return'] } }` | If count > 0, sets `adminAssets.isCleared = false` and records `pendingAssetsCount`. Blocks final HR relieving sign-off until physical inventory return is confirmed. |

```mermaid
sequenceDiagram
    autonumber
    actor HR
    participant Service as lifecycleService.syncAssetClearance
    participant Inv as EmployeeAssetAssignment Model
    participant Exit as OffboardingCase Model

    HR->>Service: Check asset clearance for employee
    Service->>Inv: Count active/in-use hardware assets
    Inv-->>Service: Returns count = 2 (e.g. MacBook Pro, Keycard)
    Service->>Exit: adminAssets = { isCleared: false, pendingAssetsCount: 2 }
    Exit-->>HR: Shows "2 Assets Pending Return" badge in UI
    Note over HR,Exit: Prevents premature exit settlement until IT/Inventory returns hardware
```

---

## 2.3 Attendance & Leaves ↔ Payroll LOP Engine Bridge

- **Loss of Pay (LOP) Automation:**
  - When monthly payroll run is triggered (`payrollService.calculateRun`), the system fetches all `AttendanceRecord` entries for the calendar month.
  - Days where `status === 'absent'` or `status === 'leave'` without an approved `LeaveRequest` (or where the leave type is configured with `isPaid: false`) are tallied as `unpaidDays`.
  - Formula:
    $$\text{Per Day Deduction} = \frac{\text{Gross Salary}}{\text{Total Days in Month}}$$
    $$\text{LOP Deduction} = \text{Per Day Deduction} \times \text{Unpaid Days}$$
  - The deducted amount is added to `Payslip.deductions` under the label `Loss of Pay (LOP)`, guaranteeing financial reconciliation.

---

## 2.4 Expenses ↔ Payroll Reimbursement Bridge

- Approved non-reimbursed expense claims are aggregated by employee ID.
- During the payroll run, the approved expense amount is added as a non-taxable reimbursement line item in `Payslip.earnings`, allowing single-disbursement bank processing.

---

## 3. Security & Multi-Tenant Audit Integrity

1. **Strict Tenant Segregation:** Every query filter and update mutation incorporates `organizationId: req.user.organizationId`.
2. **Deterministic Role Actions:**
   - Employees have read access to their own records and write access only to self-service endpoints (`check-in`, `leave request`, `self review`, `ticket raise`, `policy acknowledgement`).
   - Managers have access to their direct reports.
   - HR & Admins hold full configuration, calibration, and approval capabilities.
3. **Audited Lifecycle:** Every state change across Onboarding, Offboarding, Regularization, Leave, Payroll, and Requisition records the executing `userId` and high-resolution timestamp.
