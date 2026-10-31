# Nebula HUB — HRMS ERP Backend Data & API Flow Architecture

This document details the backend architectural patterns, database schemas, controller workflows, and transaction boundaries across the HRMS module.

---

## 1. Domain Model Entity-Relationship Architecture

```mermaid
erDiagram
    Organization ||--o{ Department : has
    Organization ||--o{ BranchLocation : operates
    Organization ||--o{ Employee : employs
    Organization ||--o{ Shift : defines
    Organization ||--o{ LeaveType : configures
    Organization ||--o{ PayrollRun : executes
    Organization ||--o{ OnboardingCase : tracks
    Organization ||--o{ OffboardingCase : manages
    Organization ||--o{ HrTicket : processes
    Organization ||--o{ Skill : catalogs
    Organization ||--o{ Training : offers
    Organization ||--o{ HeadcountPlan : budgets
    Organization ||--o{ ManpowerRequisition : approves

    Department ||--o{ Employee : assigns
    Employee ||--o{ AttendanceRecord : logs
    Employee ||--o{ LeaveRequest : requests
    Employee ||--o{ LeaveLedger : transacts
    Employee ||--o{ SalaryStructure : has
    Employee ||--o{ Payslip : receives
    Employee ||--o{ PerformanceReview : evaluated_in
    Employee ||--o{ EmployeeSkill : possesses
    Employee ||--o{ OnboardingCase : onboards
    Employee ||--o{ OffboardingCase : offboards

    ManpowerRequisition ||--o| JobOpening : spawns_into
    OffboardingCase ||--o{ EmployeeAssetAssignment : verifies_clearance_with
```

---

## 2. Controller-Service Flow Pipelines

### 2.1 Multi-Department Onboarding Engine

```mermaid
sequenceDiagram
    autonumber
    participant Controller as lifecycleController.createOnboardingCase
    participant Service as LifecycleService.createOnboardingCase
    participant DB as MongoDB

    Controller->>Service: Pass organizationId, employeeId, joiningDate
    Service->>DB: Query Employee (ensure active and belongs to org)
    Service->>DB: Query OnboardingTemplate (or default standard presets)
    Service->>Service: Build tasks array with designated roles (hr, it, finance, manager)
    Service->>DB: OnboardingCase.create(payload)
    DB-->>Service: Saved document
    Service-->>Controller: Return populated OnboardingCase
    Controller-->>Client: 201 Created { success: true, data: OnboardingCase }
```

---

### 2.2 Inventory Asset Clearance Synchronization

```mermaid
sequenceDiagram
    autonumber
    participant Controller as lifecycleController.updateOffboardingClearance
    participant Service as LifecycleService.syncAssetClearance
    participant InvDB as EmployeeAssetAssignment Model (Inventory Module)
    participant OffboardDB as OffboardingCase Model

    Controller->>Service: syncAssetClearance(organizationId, employeeId)
    Service->>InvDB: find({ organizationId, employeeId, status: { $in: ['assigned', 'in_use', 'pending_return'] } })
    InvDB-->>Service: Returns pending unreturned hardware hardware count (N)
    alt N > 0
        Service->>OffboardDB: updateOne(adminAssets.isCleared = false, pendingAssetsCount = N)
    else N == 0
        Service->>OffboardDB: updateOne(adminAssets.isCleared = true, pendingAssetsCount = 0)
    end
    OffboardDB-->>Service: Updated
    Service-->>Controller: Return updated clearance status
```

---

### 2.3 Vector PDF Generation via PDFKit

```mermaid
sequenceDiagram
    autonumber
    participant Controller as lifecycleController.generateLetterPdf
    participant Service as LifecycleService.generateLetterPdf
    participant DB as MongoDB
    participant PDF as PDFKit Document Stream

    Controller->>Service: generateLetterPdf(organizationId, templateId, employeeId, customVars)
    Service->>DB: Fetch LetterTemplate & Employee Dossier
    Service->>Service: Interpolate {{employeeName}}, {{designation}}, {{salary}}, {{date}}
    Service->>PDF: Initialize doc({ margin: 50, size: 'A4' })
    Service->>PDF: Render Company Header, Branded Bar (#f97316), Subject & Body
    Service->>PDF: Render Formal Sign-off & Digital Stamp
    PDF-->>Controller: Pipe buffer directly into HTTP response headers
    Controller-->>Client: Content-Type: application/pdf; Content-Disposition: attachment
```

---

### 2.4 Manpower Requisition to ATS Job Opening Spawning

```mermaid
sequenceDiagram
    autonumber
    participant Controller as talentPlanningController.approveRequisition
    participant Service as LifecycleService.spawnJobOpeningFromRequisition
    participant ReqDB as ManpowerRequisition Model
    participant ATSDB as JobOpening Model (Recruitment Module)

    Controller->>ReqDB: findOneAndUpdate({ _id: id, status: 'approved' })
    Controller->>Service: spawnJobOpeningFromRequisition(organizationId, requisitionDoc, approvedByUserId)
    Service->>ATSDB: create({ title: jobTitle, departmentId, openingsCount, status: 'published', isRemote: false })
    ATSDB-->>Service: Created JobOpening doc
    Service->>ReqDB: updateOne({ linkedJobOpeningId: jobOpening._id })
    Service-->>Controller: Return updated requisition + spawned job opening
    Controller-->>Client: 200 OK { success: true, data: req, jobOpening }
```

---

## 3. Transaction Boundaries & Guard Blocks

1. **Multi-Tenant Isolation:** All operations enforce `query.organizationId = req.user.organizationId`. Direct cross-tenant data manipulation is impossible at the database driver level.
2. **RBAC Guard (`requireModuleAccess`):** Every endpoint strictly gates access via `('hrms', 'view')`, `('hrms', 'create')`, `('hrms', 'edit')`, or `('hrms', 'approve')`.
3. **Atomic Balance Ledgers:** All leave allocations, deductions, and cancellations write dual immutable audit records in `LeaveLedger` before mutating `LeaveBalance.usedDays`.
