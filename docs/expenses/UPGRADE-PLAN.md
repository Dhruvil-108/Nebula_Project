# Nebula HUB — Expenses ERP Upgrade Plan
## Modification Plan & Architecture Roadmap

---

## 1. Gap Analysis: Today vs. ERP-Level Target

| Area | Today | ERP-Level Target |
|---|---|---|
| **Approvals** | Fixed two tiers: Line Manager, then Finance | Configurable approval matrix by amount, category, department and project; delegation & out-of-office; escalation SLAs; line-level decisions; send back for clarification; anti-self-approval on all roles |
| **Policy** | Per-category line limit and receipt threshold | Policy engine: per-diem, daily and monthly caps, grade-based limits, merchant allow/block lists, mandatory justification, violation severity (info, warn, block) |
| **Budgets** | Department budgets, warning only | Budgets by department, cost center, project and category; hierarchy of annual > quarterly > monthly; soft warning or hard block on submit; live commitments |
| **Receipts & OCR** | Gemini scan into one line; receipt stored as base64 URL | Multi-line and multi-page extraction, tax breakdown, per-field confidence, duplicate detection (content/perceptual hash), private signed storage, clean fallback |
| **Currency & Tax** | Item currency and one tax amount | FX rate table with rates at transaction date, base-currency totals, tax codes with VAT/GST split and recoverable flags |
| **Spend Types** | Out-of-pocket claims only | Mileage with rate cards, per diem by location/grade, cash advances, travel pre-approval, corporate cards, recurring subscriptions |
| **Payment** | Finance marks a claim reimbursed with a text reference | Payment batches, payroll handoff, failure/reversal handling, payer separate from approver, dual control above threshold, bank file export |
| **Accounting** | CSV of claims | GL journal export from category mapping, ERP adapters (Tally, QuickBooks, NetSuite), period close lock |
| **Billable Items** | Flag and client name string | Direct link to CRM accounts and projects, rebilling status, markup, invoice handoff |
| **Fraud & Risk** | None | Duplicate receipt detection, weekend/holiday spend anomaly flags, split transaction detection, round-number patterns |
| **Analytics** | KPI cards, 6-month trend, category mix | Spend by vendor, project and department, approval cycle time, violation rate, budget burn & forecast, scheduled exports |
| **Platform** | Synchronous controllers | Background job queue, file service, FX refresh, webhooks, per-tenant settings, feature flags |

---

## 2. Eight Core Issues to Verify and Resolve (Phase 0)

1. **Claim Number Race Conditions**: Replace `findOne` + sort with atomic per-organization Counter (`findOneAndUpdate` with `$inc` and `upsert`).
2. **Audit Log Deletion**: Prevent `deleteClaim` from cascading deletions on `ExpenseActivity`. Shift to soft delete (`deletedAt`) to maintain a 100% immutable audit log.
3. **Universal Anti-Self-Approval**: Extend anti-self-approval guards beyond managers to finance and admin roles so no user can approve or disburse their own claim.
4. **Honest Fallback OCR**: Replace plausible demo merchant guesses with clean, low-confidence empty fields marked for manual review.
5. **Configurable AI Provider & Gemini Model**: Remove hard-coded `gemini-1.5-flash` string; bind to `process.env.GEMINI_MODEL || 'gemini-1.5-flash'` behind an abstracted AI service layer.
6. **Multi-Currency Normalization**: Store transaction FX snapshot and compute normalized `totalBase` in tenant base currency instead of raw mixed sums.
7. **Budget Hierarchy & Dynamic Calculation**: Clarify hierarchy (annual > quarterly > monthly) and enforce dynamic aggregation over stale stored fields.
8. **Secure Receipt File Service**: Validate MIME types, compute SHA-256 content hashes for duplicate detection, and store sanitized file references.

---

## 3. Target Module Map

- **M1: Policy Engine**: Rules by category, grade, department, amount; daily/monthly caps; merchant rules; severity levels (info, warn, block); mandatory justification.
- **M2: Approval Workflow Engine**: Matrix by amount, category, department, project; auto-approval below threshold; delegation; line-level decisions; send back for clarification; universal anti-self-approval.
- **M3: Budget Control**: Multi-dimensional budgets (department, cost center, project, category); hierarchical resolution; soft warning vs. hard block on submission.
- **M4: Smart Capture**: Receipt reader v2, multi-line extraction, duplicate detection, email/mobile ingestion, natural-language entry.
- **M5: Multi-Currency & Tax**: FX rate table with transaction-date rates, base-currency normalization, tax codes with VAT/GST breakdown and recoverable flags.
- **M6: Special Expense Types**: Mileage with rate cards, per diem by location and grade, recurring expenses and subscriptions.
- **M7: Travel & Cash Advances**: Travel requests with pre-approval estimates, cash advance issuance, settlement against claims.
- **M8: Corporate Cards**: Card transaction import, matching to receipts, unmatched queue, personal vs. business marking.
- **M9: Payments**: Payment batches, payroll handoff, bank file export, reversal handling, dual control above threshold.
- **M10: Accounting Integration**: GL journal export, ERP adapters, period close lock, reconciliation reports.
- **M11: Billable Costs & Projects**: Link expense lines to CRM accounts and projects, rebilling status, markup.
- **M12: Risk & Compliance**: Duplicate receipt hash detection, anomaly flags, segregation-of-duties report, audit pack, soft delete.
- **M13: Analytics & Reporting**: Vendor spend analysis, cycle times, violation rates, budget burn forecast.
- **M14: Platform Services**: Job queue, file service, notifications, webhooks, per-tenant settings, feature flags.

---

## 4. AI Feature Suite

### 4.1 AI Platform Layer
- **Provider Interface**: `aiService.generate({ task, input, schema })` with Gemini default and a clean fallback that never invents data.
- **Prompt Registry**: Versioned prompts in `prompts/expenses/<task>.v1.ts`.
- **Structured Output**: Schema-validated JSON output with clean failure handling.
- **AiRun Audit Collection**: Logging task, model, input hash, output, tokens, latency, user, and claim/line ID.
- **Human Decides**: AI suggests and flags; AI never approves, rejects, or reimburses claims.

### 4.2 AI Capabilities (X1 to X15)
- **X1**: Receipt Reader v2 (multi-line item extraction, confidence scores, tax split).
- **X2**: Email & Mobile capture integration.
- **X3**: Natural-language expense entry ("Cab to airport 450 INR yesterday").
- **X4**: Smart categorization with organizational learning.
- **X5**: Live policy coach explaining rule breaches in plain English.
- **X6**: Duplicate receipt and transaction detector.
- **X7**: Anomaly flags (weekend/holiday spend, split limits, round numbers).
- **X8**: Approver assistant (1-paragraph summary, budget impact, suggested action).
- **X9**: Trip & report builder grouping loose receipts.
- **X10**: Budget forecast projecting month-end and period-end burn.
- **X11**: Spend copilot conversational assistant for managers and finance.
- **X12**: Merchant normalization & subscription intelligence.
- **X13**: Payout & cash-flow planner.
- **X14**: Audit pack & exception narrative builder.
- **X15**: Smart reminders & clear rejection reason drafting.

---

## 5. Implementation Roadmap & Phases

| Phase | Scope | Exit Criteria |
|---|---|---|
| **Phase 0: Foundation & Invariants** | Verify 8 core issues; atomic counters; soft delete; AI service with honest fallback; file service & receipt records; currency utility; test harness | Existing flows intact; zero duplicate claim numbers under concurrency; audit logs survive deletes |
| **Phase 1: Policy & Workflow Backbone** | Policy engine, approval matrix, delegation, line-level decisions, send back, cost centers, projects, budget hierarchy & hard blocks | Default workflow reproduces current 2 tiers; hard-blocked budget stops submission; universal anti-self-approval |
| **Phase 2: Smart Capture & FX** | Receipt reader v2, natural language entry, duplicate detection (content hash), FX rate table, tax codes, mileage & per-diem | Multi-line receipt extracts into reviewed draft; duplicate receipt upload blocked/flagged |
| **Phase 3: Money Movement & ERP** | Travel requests, cash advances, payment batches, bank export, ERP GL journal export, CRM billable links | Reconcilable payment batches; failed payment retry; GL journal export |
| **Phase 4: Intelligence & Analytics** | Risk flags, approver assistant, budget forecast, spend copilot, audit pack, merchant intelligence | Every flag displays explanation; AI suggestions require human confirmation |
| **Phase 5: Hardening & Launch** | Notifications, webhooks, security review, performance tests, final documentation | Security checklist passed; p95 targets met; 100% documentation coverage |
