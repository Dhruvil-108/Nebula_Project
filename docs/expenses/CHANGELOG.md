# Nebula Expenses ERP: Changelog & Version History

All notable changes to the **Nebula Expense Management (Expenses ERP) Module** are documented in this file.

---

## [v1.4.0] — 2026-10-20 (Phase 5: Production Hardening, Notifications & Webhooks)
### Added
- **In-App Notification Dispatcher (`expenseNotificationService.js`)**:
  - Connected financial events into Nebula's background job queue (`queueService.js`).
  - Supported events: `claim.submitted`, `claim.manager_approved`, `claim.approved`, `claim.rejected`, `claim.sent_back`, `claim.reimbursed`, `budget.warning`, `budget.breach`.
- **Outbound Webhook Engine**:
  - Secure event dispatching with SHA-256 HMAC digital signatures (`X-Nebula-Signature`) for external ERP and Slack integrations.
- **Granular API Rate Limiters (`expenseRateLimiter.js`)**:
  - `aiScanRateLimiter`: 30 req/min (prevents Gemini vision API quota exhaustion).
  - `copilotRateLimiter`: 45 req/min (paces analytical queries).
  - `paymentExecutionRateLimiter`: 10 req/min (prevents duplicate payment execution races).
- **Comprehensive Automated Regression Test Suite (`test_expenses_full_suite.js`)**:
  - 14 automated unit and integration tests covering all 5 phases with 100% pass rate.
- **Complete Documentation Suite in `docs/expenses/`**:
  - Created `README.md`, `BACKEND_ARCHITECTURE_DOCUMENTATION.md`, `EXPENSES_MODULE_FLOW_AND_ARCHITECTURE.md`, `EXPENSES_MODULE_SIMPLE_EXPLANATION.md`, `UI_FLOW_DOCUMENTATION.md`, `USE_CASE_DIAGRAMS_AND_TEACHER_EXPLANATION.md`, `AUDIT.md`, `CHANGELOG.md`.

---

## [v1.3.0] — 2026-10-20 (Phase 4: Intelligence & Analytics)
### Added
- **AI Audit Log Collection (`AiRun.js`)**:
  - Tracks task, prompt version, model, tokens used, latency, and input hashes for explainable AI governance.
- **Multi-Vector Anomaly Detection Engine (`anomalyDetectionService.js`)**:
  - Split-transaction detection for amounts just below receipt/approval limits across consecutive days.
  - Weekend transaction warnings for non-travel categories.
  - Round-number transaction spike flags ($100.00, $250.00, $500.00).
  - 30-day identical merchant and amount duplicate look-alike flags.
- **AI Approver Assistant (`approverAssistantService.js`, `ApproverAssistantCard.tsx`)**:
  - Synthesizes executive review brief inside the claim dossier drawer.
  - Displays departmental budget impact percentage, 90-day employee claim history, and anomaly warning badges.
  - 1-Click **"Insert Note"** button to paste pre-composed draft notes into approval comments.
- **Predictive Department Budget Run-Rate Forecasting (`budgetForecastService.js`)**:
  - Linear velocity burn rate formula: $\text{Spend} + (\text{Daily Burn} \times \text{Days Remaining})$.
  - Proactive breach warning banner on the Executive Overview hub and forecast badges on the Budgets page.
- **Spend Copilot Conversational Assistant (`spendCopilotService.js`, `SpendCopilotDrawer.tsx`)**:
  - Natural language analytics assistant scoped strictly by tenant and RBAC permissions.
  - Built-in suggested query chips for top vendors, pending approvals, and budget utilization.
- **Compliance Audit Pack Engine (`auditPackService.js`, `AuditPackModal.tsx`)**:
  - Compiles period-specific audit samples with exception rates and segregation-of-duties checks.
  - 1-Click **"Export Audit Pack CSV"** formatted specifically for financial auditors.

---

## [v1.2.0] — 2026-10-20 (Phase 3: Money Movement & ERP Integrations)
### Added
- **Pre-Trip Travel Authorizations (`TravelRequest.js`, `travelRequestService.js`)**:
  - Atomic sequence generation: `TR-YYYY-XXXX`.
  - Itemized cost buckets: Flights, Lodging, Meals, Ground Transport, Other.
  - Departmental budget pre-commitment reserving headroom before actual travel occurs.
- **Cash Advances & Net-Pay Settlement (`CashAdvance.js`, `cashAdvanceService.js`)**:
  - Atomic sequence generation: `ADV-YYYY-XXXX`.
  - Net-pay settlement algorithm automatically offsetting advance balance against new claims.
  - Ledger state transitions: `requested` $\rightarrow$ `approved` $\rightarrow$ `disbursed` $\rightarrow$ `partially_settled` $\rightarrow$ `settled`.
- **Payment Batches & Multi-Claim Settlement (`PaymentBatch.js`, `paymentBatchService.js`)**:
  - Atomic sequence generation: `BATCH-YYYY-XXXX`.
  - Claim locking mechanism preventing double-batching or concurrent double-payouts.
  - Single-click atomic execution moving bundled claims from `approved` to `reimbursed`.
- **Corporate ERP Accounting Exports (`erpExportService.js`)**:
  - Corporate bank payment CSV formatted for NACHA / BACS / SEPA direct deposit uploads.
  - Balanced double-entry General Ledger journal CSV with mathematical validation ($\sum \text{Debits} \equiv \sum \text{Credits}$).

---

## [v1.1.0] — 2026-10-20 (Phase 2: Advanced Spend Capture & Multi-Currency)
### Added
- **Cryptographic SHA-256 Receipt Deduplication (`Receipt.js`, `receiptService.js`)**:
  - Binary hash computation to flag duplicate receipt uploads across claims and employees.
- **Mileage Reimbursement Engine (`MileageRate.js`, `mileageService.js`)**:
  - Vehicle rate lookup tables for cars, motorcycles, bicycles, electric vehicles, and vans.
  - Unit normalization between kilometers and miles with float-safe rounding.
- **Per-Diem Subsistence Engine (`PerDiemRate.js`, `perDiemService.js`)**:
  - Destination tier benchmarks with standard meal deductions (Breakfast: -20%, Lunch: -30%, Dinner: -50%).
- **Multi-Currency FX & Tax Normalization (`FxRate.js`, `TaxCode.js`, `fxService.js`)**:
  - Live currency conversion against base reporting currency with 4-decimal precision storage.
  - 2-decimal bank rounding protection (`roundMoney`) preventing floating-point drift.
  - Tax compliance breakdown tracking recoverable VAT/GST vs gross spend.

---

## [v1.0.0] — 2026-10-20 (Phase 0 & 1: Foundation & Policy Governance)
### Added
- **Atomic Sequence Counters (`Counter.js`)**:
  - MongoDB `$inc` atomic sequence generator for collision-free `EXP-YYYY-XXXX` identifiers.
- **Automated Policy Engine (`ExpensePolicy.js`, `policyEngineService.js`)**:
  - Multi-tier rule evaluation: Receipt threshold checks, category daily limits, weekend spend detection.
  - Enforcement levels: `info`, `warn` (requires user justification), and `block` (stops submission).
- **Dynamic Multi-Level Approval Workflows (`ApprovalWorkflow.js`, `approvalWorkflowService.js`)**:
  - Threshold-based approval routing and temporary out-of-office delegation rules (`Delegation.js`).
  - Universal anti-self-approval rule preventing claimants from approving their own expenses.
- **Granular Line-Item Decisions & Send-Back for Clarification**:
  - Approvers can accept or reject individual lines independently (`/line-decision`).
  - Send-back workflow returning claims to `draft` with reviewer notes (`/send-back`).
- **Departmental Budget Hard Guardrails (`DepartmentBudget.js`, `budgetControlService.js`)**:
  - Real-time spend accumulation and budget headroom verification before claim submission.
