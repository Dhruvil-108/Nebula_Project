# Nebula Expenses ERP: Screen-by-Screen UI Flow & Interaction Guide

---

## 1. UI Overview & Design Philosophy

The **Nebula Expenses ERP** user interface is crafted under the **Nebula Premium Light 2.0** design system:
- **Palette**: Warm surface `#FBF8F4`, clean canvas `#f5f5f7`, brand primary `#f97316`, soft borders `#ECE0D6`.
- **Motion**: Fluid Framer Motion animations for modal entries, slide-over drawers, and expandable cards.
- **Micro-Interactions**: Hover states, badge pulse indicators, dynamic budget progress bars, and zero-flicker TanStack Query caching.
- **Zero Third-Party UI Bloat**: Built purely using Tailwind CSS tokens and Lucide React icons.

---

## 2. Screen-by-Screen Detailed Walkthrough

### 2.1 Executive Overview Hub (`/dashboard/expenses`)
**Component**: `ExpensesOverviewPage.tsx`  
**Route**: `/dashboard/expenses`

The executive control center for CFOs, controllers, and department leads:
1. **Header Action Bar**:
   - Primary action: **"New Expense Claim"** button opens `CreateClaimModal`.
   - Secondary actions: **"Spend Copilot"** (launches slide-over conversational assistant) and **"Audit Pack"** (launches compliance package modal).
2. **Predictive Budget Alert Banner**:
   - Conditionally surfaces if any department budget is forecasted to breach annual caps based on current burn-rate velocity.
   - Highlights the department name, daily burn rate ($/day), projected year-end overrun, and provides a direct link to view budgets.
3. **Executive KPI Metric Grid**:
   - **Total Claimed**: Aggregated gross volume of all active claims.
   - **Total Approved**: Combined volume of Manager and Finance approved claims.
   - **Pending Approvals**: Queue monetary total and claim count awaiting review.
   - **Total Reimbursed**: Total financial disbursements paid back to employees.
   - **Budget Utilization**: Overall organizational budget consumption percentage.
4. **6-Month Spend Trend**:
   - Chronological comparative visualization tracking Submitted, Approved, and Reimbursed spend.
5. **Category Spend Mix**:
   - Categorical distribution breakdown with Lucide icons, branded color dots, item counts, and monetary contributions.
6. **Recent Claims Snapshot**:
   - Interactive list of the last 5 submitted expense reports with employee avatars, claim numbers, department tags, amounts, and status pills. Clicking any row opens the 360° Dossier Drawer.

---

### 2.2 My Expenses Claims View (`/dashboard/expenses/my-claims`)
**Component**: `MyExpensesPage.tsx`  
**Route**: `/dashboard/expenses/my-claims`

Self-service employee workspace for assembling and tracking claims:
1. **Filter & Search Bar**:
   - Real-time search by claim number (`EXP-2026-XXXX`), title, or merchant.
   - Department filter dropdown for authorized managers.
   - Status Tabs: `All`, `Draft`, `Submitted`, `Manager Approved`, `Approved`, `Reimbursed`, `Rejected`.
2. **Claims Table**:
   - Columns: Claim Number (bold monospace), Date, Title, Department, Items Count, Total Amount, Net Reimbursable, Status Pill, Actions.
3. **Draft Actions**:
   - Draft claims feature direct **"Submit"**, **"Edit"**, and **"Delete"** actions.
   - Rejected claims show a **"Re-edit"** button to correct reviewer remarks and re-submit.

---

### 2.3 Create Claim & AI Receipt Scanner Modals
**Components**: `CreateClaimModal.tsx`, `AiReceiptScanModal.tsx`

1. **`CreateClaimModal.tsx`**:
   - Multi-step claim report builder: Title, Department selector, optional Project / Cost Center, optional Linked Travel Request or Cash Advance.
   - **Line Items Repeater**:
     - Expense Category picker with icons and policy limits displayed.
     - Transaction Date, Merchant Name, Description.
     - Gross Amount, Tax Amount, Currency selector (`USD`, `EUR`, `GBP`, `INR`).
     - Expense Type switcher: `Receipt`, `Mileage`, `Per Diem`.
     - Client Billable checkbox with Account Name field.
     - Receipt attachment area with 1-click **"Scan Receipt with AI"** trigger.
   - **Live Mathematical Summary**:
     - Gross Total, Tax Total, Cash Advance Deduction, and Net Reimbursable Amount recalculate in real time.
   - Actions: **"Save as Draft"** or **"Submit for Approval"**.

2. **`AiReceiptScanModal.tsx`**:
   - Drag-and-drop receipt image (PNG, JPG, WebP, PDF).
   - Instant upload triggering Google Gemini 1.5 Flash Vision.
   - Preview pane displaying parsed Merchant, Date, Amount, Tax, and suggested Category.
   - **"Apply to Line Item"** button automatically populates the claim form and stores receipt URL.

---

### 2.4 2-Tier Approvals Queue (`/dashboard/expenses/approvals`)
**Component**: `ExpenseApprovalsPage.tsx`  
**Route**: `/dashboard/expenses/approvals`

FIFO review queue enforcing strict corporate governance:
1. **Tier Switching Tabs**:
   - **Line Manager Tier (`submitted`)**: Claims awaiting departmental manager review. Anti-self-approval rule prevents managers from seeing or approving their own claims.
   - **Finance Clearance Tier (`manager_approved`)**: Manager-approved claims awaiting final accounting clearance.
2. **Review Action Triggers**:
   - **Quick Approve**: Opens confirmation dialog with optional commendation notes.
   - **Send Back for Clarification**: Opens dialog requiring reviewer remarks, reverting claim to draft status without deleting progress.
   - **Reject**: Opens dialog enforcing mandatory rejection rationale.
   - **Inspect 360°**: Slides open the complete dossier drawer.

---

### 2.5 360° Claim Dossier Drawer (`ExpenseClaimDrawer.tsx`)
**Component**: `ExpenseClaimDrawer.tsx`

Slide-over dossier providing full operational and financial transparency:
1. **Claim Header**:
   - Claim number badge, report title, submitter avatar, email, department, and animated status pill.
2. **AI Approver Assistant Card (`ApproverAssistantCard.tsx`)**:
   - Synthesizes executive brief: Natural language summary of the claim context and items.
   - Department budget impact percentage ($\text{Claim Amount} / \text{Remaining Budget} \times 100$).
   - 90-day employee spend velocity and submission frequency.
   - Anomaly warning badges with clear, explainable rationales.
   - Suggested review actions with 1-click **"Insert Note"** button to paste pre-composed draft notes into approval comments.
3. **Itemized Lines Breakdown**:
   - Detailed table with Category icon, Merchant, Date, Billable tag, Amount, Tax, and Receipt Preview modal.
4. **Interactive Line-Level Decisions**:
   - Approvers can approve or reject individual line items independently.
5. **Approval Progress & Audit Timeline**:
   - Chronological audit events (`created`, `submitted`, `manager_approved`, `comment_added`) with actor avatars and timestamps.

---

### 2.6 Department Budgets & Spend Alerts (`/dashboard/expenses/budgets`)
**Component**: `ExpenseBudgetsPage.tsx`  
**Route**: `/dashboard/expenses/budgets`

Real-time budgetary monitoring:
1. **Budget Allocation Cards**:
   - Department name, fiscal period (`annual`, `q1`, `q2`, `q3`, `q4`, `monthly`).
   - Allocated amount, spent amount (approved + reimbursed), committed spend (pending + pre-trip travel).
   - Remaining available budget headroom.
2. **Dynamic Progress Bar (`BudgetProgressBar.tsx`)**:
   - `<80%`: Emerald green normal progress bar.
   - `80%–99%`: Amber warning badge indicating near capacity.
   - `>100%`: Vibrant red overrun badge signaling budget breach.
3. **Predictive Run-Rate Badges**:
   - Displays daily burn rate ($/day) and projected year-end utilization with status pills (`on_track`, `caution`, `breach_imminent`).

---

### 2.7 Pre-Trip Travel Requests (`/dashboard/expenses/travel-requests`)
**Component**: `TravelRequestsPage.tsx`  
**Route**: `/dashboard/expenses/travel-requests`

Pre-trip authorization pipeline:
1. **Travel Request Table**:
   - Request number (`TR-YYYY-XXXX`), Employee, Destination, Travel Dates, Estimated Cost, Spent Amount, Status.
2. **New Travel Request Modal**:
   - Destination, Dates, Business Purpose.
   - Cost Breakdown Buckets: Flights/Rail, Lodging, Meals, Ground Transport, Other.
   - Real-time departmental budget pre-commitment: Approved travel reserves budget headroom before expenses occur.

---

### 2.8 Cash Advances & Net-Pay Settlement (`/dashboard/expenses/cash-advances`)
**Component**: `CashAdvancesPage.tsx`  
**Route**: `/dashboard/expenses/cash-advances`

Employee advance disbursement and repayment tracking:
1. **Advances Ledger Table**:
   - Advance Number (`ADV-YYYY-XXXX`), Employee, Requested Amount, Disbursed Amount, Settled Amount, Remaining Balance, Status Pill.
2. **Disbursement Action**:
   - Finance users record disbursement method (`bank_transfer`, `cash`, `check`) and transaction reference.
3. **Net-Pay Settlement Integration**:
   - Displays linked claim numbers that automatically deducted portions of the advance balance until fully settled.

---

### 2.9 Payment Batches & ERP Reconciliation (`/dashboard/expenses/payment-batches`)
**Component**: `PaymentBatchesPage.tsx`  
**Route**: `/dashboard/expenses/payment-batches`

High-throughput multi-claim financial disbursement:
1. **Create Batch Dialog**:
   - Selects all un-batched approved claims, locks them under `BATCH-YYYY-XXXX`, and calculates total disbursement volume.
2. **Batch Detail & Execution**:
   - 1-Click **"Execute Payment Batch"** moves all bundled claims to `reimbursed` status.
3. **ERP Download Center**:
   - **Download Bank File (CSV)**: Formatted for direct corporate bank upload (NACHA/BACS/SEPA).
   - **Download Balanced General Ledger Journal (CSV)**: Debits expense accounts and credits AP clearing account, drop-in compatible with QuickBooks and NetSuite.

---

### 2.10 Spend Copilot Drawer (`SpendCopilotDrawer.tsx`)
**Component**: `SpendCopilotDrawer.tsx`

Slide-over AI analytical assistant:
1. **Quick-Prompt Chips**:
   - *"Top vendors by spend"*
   - *"Claims waiting > 3 days"*
   - *"Department budget utilization"*
   - *"Policy violations this month"*
2. **Conversational View**:
   - Chat interface returning structured Markdown summaries, formatted metrics, and policy advice directly from tenant financial data.

---

### 2.11 Compliance Audit Pack Modal (`AuditPackModal.tsx`)
**Component**: `AuditPackModal.tsx`

Auditor-grade compliance review tool:
1. **Filter Controls**: Date Range picker (`startDate`, `endDate`) and optional Department filter.
2. **Live Sample Metrics**:
   - Total Claims Audited, Total Sample Value ($), Exception Claims Count, Exception Rate (%).
   - Segregation-of-Duties verification check.
3. **Executive Compliance Narrative**:
   - Synthesizes findings, policy violations, and recommendations for internal/external financial auditors.
4. **1-Click "Export Audit Pack CSV"**:
   - Generates auditor-formatted spreadsheet with evidence links and reviewer timestamps.
