# Nebula HUB — Expense Management (Expenses ERP) Documentation Index

## 1. Documentation Map

| Document | Purpose |
|---|---|
| [FULL_MODULE_COMPREHENSIVE_GUIDE.md](FULL_MODULE_COMPREHENSIVE_GUIDE.md) | Master comprehensive technical & feature guide of the entire Expenses ERP module (Phases 0–5). |
| [EXPENSE_MODULE_DOCUMENTATION.md](../../EXPENSE_MODULE_DOCUMENTATION.md) | Root repository master documentation mirroring the complete functional and API specification. |
| [BACKEND_ARCHITECTURE_DOCUMENTATION.md](BACKEND_ARCHITECTURE_DOCUMENTATION.md) | In-depth backend architecture, multi-tenant database schemas, data dictionary, services, and REST API specification. |
| [EXPENSES_MODULE_FLOW_AND_ARCHITECTURE.md](EXPENSES_MODULE_FLOW_AND_ARCHITECTURE.md) | High-level system architecture, FIFO approval queues, state transitions, and cross-module ERP bridges. |
| [EXPENSES_MODULE_SIMPLE_EXPLANATION.md](EXPENSES_MODULE_SIMPLE_EXPLANATION.md) | Plain-English, conversational overview explaining the system to non-technical stakeholders and junior devs. |
| [UI-DESIGN-SYSTEM.md](UI-DESIGN-SYSTEM.md) | Source of truth for Nebula Premium Light 2.0 design tokens (`#f97316`, `#FBF8F4`), typography, and components. |
| [UI_FLOW_DOCUMENTATION.md](UI_FLOW_DOCUMENTATION.md) | Screen-by-screen walkthrough of the UI workflows (Claims, Approvals, Budgets, Travel, Advances, Payment Batches, Copilot). |
| [USE_CASE_DIAGRAMS_AND_TEACHER_EXPLANATION.md](USE_CASE_DIAGRAMS_AND_TEACHER_EXPLANATION.md) | Teacher presentation track, Mermaid use case diagrams, viva Q&A guide, and academic defense scripts. |
| [AUDIT.md](AUDIT.md) | Security, tenant isolation, anti-self-approval validation, and double-entry mathematical audit report. |
| [CHANGELOG.md](CHANGELOG.md) | Versioned development changelog tracking milestone deliverables across Phases 0 through 5. |
| [UPGRADE-PLAN.md](UPGRADE-PLAN.md) | The original architectural roadmap that drove the ERP transformation. |

---

## 2. Upgrade Phase Completion Tracking

- [x] **Phase 0 & 1: Foundation & Governance**
  - Atomic sequence counters (`Counter.js` with `EXP-YYYY-XXXX`).
  - Automated policy rules engine (`ExpensePolicy.js`, `policyEngineService.js`).
  - Dynamic multi-level approval workflows & out-of-office delegations (`ApprovalWorkflow.js`, `Delegation.js`).
  - Universal anti-self-approval rule and line-item granular decisions (`/line-decision`, `/send-back`).
  - Departmental budget hard guardrails (`DepartmentBudget.js`, `budgetControlService.js`).

- [x] **Phase 2: Advanced Spend Capture & Multi-Currency Engine**
  - Cryptographic SHA-256 receipt deduplication (`Receipt.js`, `receiptService.js`).
  - Mileage reimbursement engine with vehicle rate lookup tables (`MileageRate.js`, `mileageService.js`).
  - Per-diem subsistence engine with destination tiers & meal deduction rules (`PerDiemRate.js`, `perDiemService.js`).
  - Multi-currency FX conversion and tax breakdown tracking (`FxRate.js`, `TaxCode.js`, `fxService.js`).

- [x] **Phase 3: Money Movement & ERP Integrations**
  - Pre-trip travel authorizations with real-time budget pre-commitment (`TravelRequest.js`, `travelRequestService.js`).
  - Cash advance disbursements & net-pay claim settlement math (`CashAdvance.js`, `cashAdvanceService.js`).
  - Payment batches with claim locking and atomic multi-claim settlement (`PaymentBatch.js`, `paymentBatchService.js`).
  - Corporate bank payment CSV (NACHA/BACS/SEPA) and double-entry balanced General Ledger journal CSV export (`erpExportService.js`).

- [x] **Phase 4: Intelligence & Analytics**
  - Explainable AI audit log schema with token and latency tracking (`AiRun.js`).
  - Multi-vector anomaly detection: weekend spend, round numbers, split transactions, duplicate look-alikes (`anomalyDetectionService.js`).
  - AI Approver Assistant: Synthesized executive brief with budget impact % and pre-composed draft review notes (`ApproverAssistantCard.tsx`).
  - Predictive department budget run-rate forecasting: velocity extrapolation with breach alerts (`budgetForecastService.js`).
  - Spend Copilot: Natural language read-only analytical assistant drawer (`SpendCopilotDrawer.tsx`).
  - Compliance audit pack engine: Filterable period sample generator with 1-click audit CSV export (`AuditPackModal.tsx`).

- [x] **Phase 5: Production Hardening, Rate Limiting & Notifications**
  - In-app notification dispatcher & background worker via `queueService.js` (`expenseNotificationService.js`).
  - Outbound webhook integration engine with HMAC SHA-256 signatures for external ERP/Slack webhooks.
  - Granular API rate limiters on AI Vision, Copilot, and Payment execution (`expenseRateLimiter.js`).
  - Full automated regression test suite (`test_expenses_full_suite.js`) passing 100% (14/14 tests).
