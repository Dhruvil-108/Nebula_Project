# Nebula HUB — Expense Management (Expenses) Module
## Full Implementation Plan & Technical Architecture Specification

---

## 1. Executive Summary & Vision

**Nebula Hub** is an integrated, multi-tenant enterprise business operating platform unifying **CRM**, **HRMS**, and **Recruitment (ATS)**. 

The **Expense Management (Expenses) Module** completes the financial-operational loop of the enterprise by empowering employees to submit reimbursable claims, providing managers and finance controllers with automated policy enforcement and multi-tier approval workflows, and offering leadership real-time visibility into departmental spending against budgets.

### Key Capabilities:
1. **Employee Expense Claims & Receipt Management**: Streamlined claim submission with multi-item breakdowns, multi-currency support, receipt attachments with instant preview, and mileage/per-diem tracking.
2. **AI-Assisted Smart Receipt Scanner (OCR)**: Automatic extraction of merchant name, transaction date, currency, tax, and total amount directly from uploaded receipt images/PDFs.
3. **Multi-Tier Approval Workflow (Employee → Department Manager → Finance)**: Structured 2-tier approval routing with automated policy checks, audit logging, and one-click approve/reject actions with reviewer comments.
4. **Departmental Budgeting & Spend Limits**: Real-time tracking of monthly/quarterly departmental budgets with warning indicators (>80% amber, >100% red budget breach alerts).
5. **Configurable Categories, GL Codes & Spending Policies**: Centralized management of expense categories, General Ledger (GL) account codes, receipt requirement thresholds, and per-claim limits.
6. **Reimbursement Batching & Accounting Export**: Marking approved claims as reimbursed with payment transaction reference, payment method (Bank Transfer, Payroll, Check), and CSV/Excel export for ERP reconciliation.

This document details the end-to-end technical plan adhering strictly to the **Nebula Premium Light 2.0 design system**, multi-tenancy (`organizationId` scoping), role-based permissions, and frontend/backend architecture.

---

## 2. System Architecture & Multi-Tenancy Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEBULA FRONTEND (SPA)                             │
│       React 19 + TypeScript + Vite 6 + Tailwind CSS + Framer Motion         │
│  Theme: Premium Light 2.0 (Orange #f97316 / #ea580c, Warm Surface #FBF8F4) │
├─────────────────────────────────────────────────────────────────────────────┤
│  Expenses Hub  │  My Claims  │  Approvals Queue  │  Budgets  │  Categories  │
└────────┬──────────────┬───────────────┬──────────────┬──────────────┬───────┘
         │              │               │              │              │
         ▼              ▼               ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API Client & Hooks (TanStack Query 5)                    │
│       expenseApi.ts  ──►  useExpenses.ts  ──►  useModuleAccess              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Axios HTTP + JWT (Auth Header)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NEBULA BACKEND (Express)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Middleware: requireAuth ──► scopedFilter ──► requireModuleAccess('expenses')│
├─────────────────────────────────────────────────────────────────────────────┤
│ Routes: /api/v1/expenses/*                                                  │
│   ├── /claims            ── expenseClaimController.js                       │
│   ├── /approvals         ── expenseApprovalController.js                    │
│   ├── /budgets           ── expenseBudgetController.js                      │
│   ├── /categories        ── expenseCategoryController.js                    │
│   ├── /ai-scan-receipt   ── expenseAiScanController.js                      │
│   ├── /reimburse         ── expenseReimbursementController.js               │
│   └── /summary           ── expenseSummaryController.js                     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Mongoose 8 (Multi-Tenant Scoped)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MONGODB DATABASE (Nebula DB)                        │
│   ExpenseClaim  │  ExpenseCategory  │  DepartmentBudget  │  ExpenseActivity │
│          ▲                                                       │          │
│          └────────────── HRMS Integration ───────────────────────┴──────────┤
│                  ──► User / Employee / Department Collections               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy & Access Control (RBAC)

All Expense collections enforce strict isolation through `organizationId` with automated filtering via `scopedFilter`.

| Role | Permissions & Access Scope |
|---|---|
| **super_admin** | Complete tenant bypass and administrative audit across all claims and budgets. |
| **admin**, **finance** | Full organizational access: View all claims, approve at Finance tier, manage budgets, configure categories/policies, mark as reimbursed, and export reports. |
| **manager** | View own claims + review and approve claims submitted by direct reports / team members in their department. |
| **hr** | View all organizational expenses for payroll reconciliation and benefit reimbursement tracking. |
| **employee**, **intern**, **sales**, **recruiter** | Create, view, edit, and cancel their **own** submitted expense claims. |

---

## 3. Database Schema & Data Models (MongoDB / Mongoose)

The Expense Management module introduces four collections in `Backend/src/models/`:

### 3.1 `ExpenseClaim` (`ExpenseClaim.js`)
Represents an expense report submitted by an employee, containing header metadata and itemized expense lines.

```javascript
const CLAIM_STATUSES = [
  'draft',              // Created but not yet submitted
  'submitted',          // Awaiting Line Manager approval
  'manager_approved',   // Manager approved, awaiting Finance approval
  'approved',           // Fully approved by Finance, ready for payout
  'rejected',           // Rejected by Manager or Finance
  'reimbursed',         // Payment issued to employee
  'cancelled',          // Cancelled by employee before review
];

const PAYMENT_METHODS = ['bank_transfer', 'payroll', 'company_card', 'cash', 'check'];

const expenseItemSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpenseCategory',
    required: true,
  },
  expenseDate: {
    type: Date,
    required: true,
  },
  merchant: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
  },
  receiptUrl: {
    type: String, // Uploaded receipt image / PDF URL
    trim: true,
  },
  receiptFileName: {
    type: String,
    trim: true,
  },
  isBillableToClient: {
    type: Boolean,
    default: false,
  },
  clientName: {
    type: String,
    trim: true,
  },
});

const expenseClaimSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    claimNumber: {
      type: String, // e.g. "EXP-2026-0042" (unique per org)
      required: true,
      trim: true,
      uppercase: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    title: {
      type: String, // e.g. "Client Onsite Trip & Software Subscriptions - Oct 2026"
      required: true,
      trim: true,
    },
    items: [expenseItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    status: {
      type: String,
      enum: CLAIM_STATUSES,
      default: 'draft',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    // Multi-tier Approval Tracking
    managerApproval: {
      approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: Date,
      comments: String,
    },
    financeApproval: {
      approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: Date,
      comments: String,
    },
    rejection: {
      rejectedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectedAt: Date,
      reason: String,
      stage: { type: String, enum: ['manager', 'finance'] },
    },
    // Reimbursement Details
    reimbursement: {
      reimbursedAt: Date,
      reimbursedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      paymentMethod: { type: String, enum: PAYMENT_METHODS },
      transactionReference: String, // e.g. Wire reference / UTR
    },
    submittedAt: Date,
  },
  { timestamps: true }
);

// Compound unique index for claim number per tenant
expenseClaimSchema.index({ organizationId: 1, claimNumber: 1 }, { unique: true });
```

---

### 3.2 `ExpenseCategory` (`ExpenseCategory.js`)
Configurable categories with spending policies and accounting general ledger codes.

```javascript
const expenseCategorySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String, // e.g. "Travel & Lodging", "Meals & Entertainment", "Software & Tools"
      required: true,
      trim: true,
    },
    code: {
      type: String, // e.g. "CAT-TRAVEL"
      required: true,
      trim: true,
      uppercase: true,
    },
    glCode: {
      type: String, // General Ledger Code e.g. "GL-60100"
      trim: true,
    },
    icon: {
      type: String, // Lucide icon identifier e.g. "Plane", "Utensils", "Laptop"
      default: 'Receipt',
    },
    color: {
      type: String, // Hex color for charts e.g. "#f97316", "#3b82f6"
      default: '#f97316',
    },
    maxClaimLimit: {
      type: Number, // Optional ceiling per item
      default: 0,   // 0 = unlimited
    },
    isReceiptMandatory: {
      type: Boolean,
      default: true,
    },
    receiptThresholdAmount: {
      type: Number, // Receipts mandatory if item exceeds this amount (e.g. $25)
      default: 25,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: String,
  },
  { timestamps: true }
);

expenseCategorySchema.index({ organizationId: 1, code: 1 }, { unique: true });
```

---

### 3.3 `DepartmentBudget` (`DepartmentBudget.js`)
Tracks allocated financial budgets versus actual approved expenses per department and fiscal period.

```javascript
const departmentBudgetSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    fiscalYear: {
      type: Number, // e.g. 2026
      required: true,
    },
    period: {
      type: String,
      enum: ['annual', 'q1', 'q2', 'q3', 'q4', 'monthly'],
      default: 'annual',
    },
    month: {
      type: Number, // 1-12 if period === 'monthly'
    },
    allocatedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    alertThresholdPercent: {
      type: Number, // e.g. 80 (alert when 80% consumed)
      default: 80,
    },
    notes: String,
  },
  { timestamps: true }
);

departmentBudgetSchema.index(
  { organizationId: 1, departmentId: 1, fiscalYear: 1, period: 1, month: 1 },
  { unique: true }
);
```

---

### 3.4 `ExpenseActivity` (`ExpenseActivity.js`)
Audit trail logging every transition, reviewer decision, and disbursement.

```javascript
const expenseActivitySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseClaim',
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'created',
        'submitted',
        'manager_approved',
        'finance_approved',
        'rejected',
        'reimbursed',
        'cancelled',
        'item_added',
        'receipt_scanned',
        'comment_added',
      ],
      required: true,
    },
    details: mongoose.Schema.Types.Mixed,
    comment: String,
  },
  { timestamps: true }
);
```

---

## 4. Backend REST API Specification

Mounted under `/api/v1/expenses`:

### 4.1 Summary & Analytics
- `GET /api/v1/expenses/summary`
  - Returns executive KPIs: Total Claimed, Total Approved (Unpaid), Total Reimbursed This Month, Pending Approvals Count, Budget Utilization % by Department, and 6-Month Spend Trend.

### 4.2 Expense Claims
- `GET /api/v1/expenses/claims`: List claims (filtered by employee, department, status, date range, search).
- `POST /api/v1/expenses/claims`: Create a new claim report with line items.
- `GET /api/v1/expenses/claims/:id`: Retrieve full claim details with receipts, budget impact, and activity timeline.
- `PATCH /api/v1/expenses/claims/:id`: Update draft claim details or line items.
- `DELETE /api/v1/expenses/claims/:id`: Delete a draft claim.
- `POST /api/v1/expenses/claims/:id/submit`: Transition claim from `draft` → `submitted`.
- `POST /api/v1/expenses/claims/:id/cancel`: Cancel a submitted claim.

### 4.3 Multi-Tier Approval Workflow
- `GET /api/v1/expenses/approvals/queue`: Retrieve claims awaiting review by current user (Manager tier or Finance tier).
- `POST /api/v1/expenses/claims/:id/approve`:
  - If reviewer is Line Manager: Moves to `manager_approved`.
  - If reviewer is Finance: Moves to `approved`.
- `POST /api/v1/expenses/claims/:id/reject`: Rejects claim with mandatory reason and notifies employee.

### 4.4 Reimbursements & Payouts
- `POST /api/v1/expenses/claims/:id/reimburse`: Marks claim as `reimbursed` with payment method and transaction reference.
- `GET /api/v1/expenses/export`: Exports filtered claims in CSV / Excel format for bookkeeping.

### 4.5 AI Receipt Scanner
- `POST /api/v1/expenses/ai-scan-receipt`:
  - Accepts image/PDF receipt upload or URL.
  - Extracts `merchant`, `date`, `amount`, `tax`, `suggestedCategory`.
  - Powered by Gemini 1.5 Flash Vision API (or intelligent fallback parser).

### 4.6 Categories & Department Budgets
- `GET /api/v1/expenses/categories`: List active categories with icons, colors, and policy limits.
- `POST /api/v1/expenses/categories`: Create category (Admin/Finance only).
- `PATCH /api/v1/expenses/categories/:id`: Update category & GL code.
- `GET /api/v1/expenses/budgets`: List departmental budgets with real-time spend progress.
- `POST /api/v1/expenses/budgets`: Allocate or adjust departmental budget.

---

## 5. Frontend Architecture & Pages (Nebula Light 2.0 Theme)

### Theme Tokens & Consistency
- **Primary Brand**: Warm Orange (`#f97316` / `#ea580c`), Coral Glow (`#fed7aa`).
- **Surface**: Pure White (`#ffffff`) cards, Warm Light Canvas (`#FAF7F2` / `#f5f5f7`), Subtle Border (`#ECE0D6`).
- **Typography**: Inter / Outfit with dark slate text (`#111827`, `#4A4A4A`, `#6B6B6B`).
- **Components**: 100% custom `FloatingDropdown` for all dropdowns, Framer Motion micro-animations, Lucide icons, responsive drawer layouts.

### Page Breakdown

```
Frontend/src/pages/expenses/
├── ExpensesOverviewPage.tsx       # Executive KPIs, spend trends, category pie chart, quick actions
├── MyExpensesPage.tsx             # Employee claim list, status filters, create claim drawer/modal
├── ExpenseApprovalsPage.tsx       # Manager & Finance review queue with quick approve/reject
├── ExpenseBudgetsPage.tsx         # Departmental budget cards, progress bars, threshold alerts
└── ExpenseCategoriesPage.tsx      # Category list, GL codes, receipt thresholds & spending rules
```

### Components Suite

```
Frontend/src/components/expenses/
├── CreateClaimModal.tsx           # Multi-item claim builder with live total calculation
├── ExpenseClaimDrawer.tsx         # Detailed side drawer with receipt viewer & timeline
├── ExpenseStatusPill.tsx          # Consistent status badges with color dots
├── AiReceiptScanModal.tsx         # Drag-and-drop receipt scanner with instant OCR extraction
├── BudgetProgressBar.tsx          # Dynamic spend indicator (Green → Amber 80% → Red 100%)
├── ApproveClaimModal.tsx          # Approval confirmation dialog with optional note
└── RejectClaimModal.tsx           # Rejection modal with mandatory feedback reason
```

---

## 6. Implementation Phasing & Milestones

### Phase 1: Database Models & Backend Core Engine
- Create Mongoose models: `ExpenseCategory.js`, `ExpenseClaim.js`, `DepartmentBudget.js`, `ExpenseActivity.js`.
- Create controllers:
  - `expenseClaimController.js` (CRUD, submit, auto-number generator `EXP-YYYY-XXXX`).
  - `expenseApprovalController.js` (Manager & Finance approval hierarchy).
  - `expenseBudgetController.js` (Budget checks and spend summation).
  - `expenseCategoryController.js` (Category & policy configuration).
  - `expenseSummaryController.js` (Dashboard metrics & spend charts).
- Mount routes under `/api/v1/expenses` in `Backend/src/app.js`.
- Create seed script `Backend/src/seed_expense_data.js` with realistic corporate expenses across categories.

### Phase 2: Frontend Data Layer & Navigation
- TypeScript types: `Frontend/src/types/expenses.ts`.
- Typed API client: `Frontend/src/lib/expenseApi.ts`.
- TanStack Query hooks: `Frontend/src/hooks/useExpenses.ts`.
- Update Sidebar navigation with collapsible `SidebarNavGroup`:
  - Overview
  - My Expenses
  - Approvals
  - Budgets
  - Categories & Policies
- Register routes in `Frontend/src/App.tsx`.

### Phase 3: Core UI Pages with FloatingDropdown
- **Overview Page**: Metrics cards (Total Claimed, Approved, Pending, Reimbursed), Recharts spend bar & category donut charts, recent claims table.
- **My Expenses Page**: Claims table with status filtering via `FloatingDropdown`, search, and "Create Claim" button.
- **Create Claim Modal / Drawer**: Dynamic line item builder, category selection with icons, receipt attachment, billable client toggle, live total computation.
- **Claim Detail Drawer**: Full itemized inspection, receipt preview in lightbox/modal, approval history, audit trail.

### Phase 4: Multi-Tier Approvals & Budget Control
- **Approvals Page**: Tabbed queue (Pending My Approval vs. Past Reviewed), batch or individual 1-click Approve / Reject with confirmation modal.
- **Budget Management Page**: Departmental budget visualizer with budget vs. actual spend, percentage progress bar, and "Allocate Budget" modal.
- **Category & Policy Config Page**: Category table with GL codes, receipt requirement threshold, and max claim limits.

### Phase 5: AI Receipt Scanner & Export
- Implement `AiReceiptScanModal`: Drag-and-drop receipt image upload, AI extraction of merchant, date, amount, tax, and auto-filling line item fields.
- 1-Click CSV export of approved claims for accounting reconciliation.
- Comprehensive verification: `npx tsc --noEmit` and live browser validation.

---

## 7. Verification & Success Criteria

1. **Multi-Tenancy**: All queries scoped strictly to `organizationId`. Claims from one tenant are completely invisible to others.
2. **Approval Integrity**: Line managers can only approve direct report claims; Finance can issue final approval and mark as reimbursed.
3. **Budget Safeguards**: Claim submissions and approvals update departmental budget spend in real-time, displaying alert warnings when approaching or exceeding limits.
4. **Theme Adherence**: 100% compliant with Nebula Premium Light 2.0 aesthetics; zero unstyled native dropdowns; all selects use `FloatingDropdown`.
5. **Zero Compiler Errors**: TypeScript validation `npx tsc --noEmit` passes with 0 errors.
