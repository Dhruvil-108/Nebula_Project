# Recruitment Module — Codebase Audit (`docs/recruitment/AUDIT.md`)
*Phase 0 Audit · Nebula HUB · October 2026*

---

## 1. Executive Summary

This audit examines the existing Recruitment (ATS) module codebase across Backend models, controllers, routes, and middleware. It identifies:
1. Queries bypassing tenant scoping or relying on non-atomic lookups.
2. Missing compound database indexes.
3. Business logic tightly coupled to Express controllers instead of services.
4. Concurrency hazards in document numbering.
5. AI provider hard-coding and unvalidated external file links.

---

## 2. Multi-Tenancy & Query Scoping Audit

All recruitment routes are mounted at `/api/v1/recruitment` and protected by `requireAuth` and `requireModuleAccess('recruitment', action)`.

| File & Line | Method / Operation | Scoping Status | Issue & Remediation |
|---|---|---|---|
| `recruitmentPipelineController.js:102` | `JobOpening.findByIdAndUpdate(candidate.jobOpeningId, ...)` | ⚠️ **Unscoped By ID** | Does not scope by `organizationId`. Remedy: use `JobOpening.findOneAndUpdate(scopedFilter(req, { _id: candidate.jobOpeningId }), ...)`. |
| `interviewController.js:214` | `Candidate.findByIdAndUpdate(interview.candidateId, ...)` | ⚠️ **Unscoped By ID** | Updates candidate rating without `scopedFilter`. Remedy: `Candidate.findOneAndUpdate(scopedFilter(req, { _id: interview.candidateId }), ...)`. |
| `hiringHrmsBridgeController.js:138` | `JobOpening.findByIdAndUpdate(candidate.jobOpeningId._id, ...)` | ⚠️ **Unscoped By ID** | Increments filled positions without tenant scope filter. |
| `hiringHrmsBridgeController.js:145` | `JobOffer.findByIdAndUpdate(offer._id, ...)` | ⚠️ **Unscoped By ID** | Marks offer accepted without tenant scope filter. |
| `recruitmentAiController.js:13` | `JobOpening.findOne({ _id: id, organizationId: req.user.organizationId })` | ℹ️ **Manual Scoping** | Uses `req.user.organizationId` instead of standard `scopedFilter(req, { _id: id })`. Standardize on `scopedFilter`. |
| `jobOpeningController.js:322` | `JobOpening.findOneAndDelete(scopedFilter(req, { _id: id }))` | ✅ **Fully Scoped** | Properly scopes tenant. |
| `candidateController.js:49` | `Candidate.find(scopedFilter(req, extra))` | ✅ **Fully Scoped** | Properly scopes tenant. |
| `offerController.js:33` | `JobOffer.find(scopedFilter(req, extra))` | ✅ **Fully Scoped** | Properly scopes tenant. |

---

## 3. Concurrency & Sequential Code Generation Audit

Currently, sequential codes are generated using non-atomic `countDocuments()` calls:
- `jobOpeningController.js`: `JobOpening.countDocuments({ organizationId, jobCode: ... })`
- `candidateController.js`: `Candidate.countDocuments({ organizationId, candidateCode: ... })`
- `offerController.js`: `JobOffer.countDocuments({ organizationId, offerCode: ... })`
- `hiringHrmsBridgeController.js`: `Employee.countDocuments({ organizationId })`

### Hazards Identified:
1. **Race Condition Under Concurrency**: Two users submitting jobs or applicants simultaneously read the exact same count, generating colliding codes (e.g. `JOB-2026-0004`), which triggers a MongoDB duplicate key error (`E11000`) for one of the users.
2. **Deletion Gaps & Duplication**: Deleting record #4 drops the count back to 3, meaning the next created item will attempt to re-use #4, violating uniqueness or overwriting chronological ordering.
3. **Remediation**: Introduce `Counter` model and `counterService.getNextSequence(organizationId, entityType)` using MongoDB atomic `findOneAndUpdate` with `$inc` and `upsert`.

---

## 4. Database Indexing Audit

| Model | Existing Indexes | Missing / Recommended Indexes |
|---|---|---|
| **`JobOpening`** | `{ organizationId: 1, jobCode: 1 }` (unique)<br>`{ organizationId: 1, status: 1 }`<br>`{ organizationId: 1, departmentId: 1 }`<br>`{ organizationId: 1, createdAt: -1 }` | Add `{ organizationId: 1, hiringManagerId: 1 }`<br>Add `{ organizationId: 1, "skills": 1 }` |
| **`Candidate`** | `{ organizationId: 1, candidateCode: 1 }` (unique)<br>`{ organizationId: 1, jobOpeningId: 1, stage: 1 }`<br>`{ organizationId: 1, email: 1 }`<br>`{ organizationId: 1, createdAt: -1 }` | Add `{ organizationId: 1, stage: 1 }`<br>Add `{ organizationId: 1, rating: -1 }`<br>Add `{ organizationId: 1, convertedEmployeeId: 1 }` |
| **`Interview`** | `{ organizationId: 1, candidateId: 1 }`<br>`{ organizationId: 1, scheduledStart: 1 }`<br>`{ organizationId: 1, status: 1 }` | Add `{ organizationId: 1, jobOpeningId: 1 }`<br>Add `{ organizationId: 1, interviewers: 1 }` |
| **`JobOffer`** | `{ organizationId: 1, offerCode: 1 }` (unique)<br>`{ organizationId: 1, candidateId: 1 }`<br>`{ organizationId: 1, status: 1 }` | Add `{ organizationId: 1, jobOpeningId: 1 }` |
| **`RecruitmentActivity`** | `{ organizationId: 1, candidateId: 1, createdAt: -1 }`<br>`{ organizationId: 1, jobOpeningId: 1, createdAt: -1 }` | Add `{ organizationId: 1, type: 1, createdAt: -1 }` |

---

## 5. Architectural & Service Layer Decoupling

Currently, controllers handle:
1. HTTP request parsing and parameter validation.
2. Multi-model business logic (e.g. updating candidate average star rating, incrementing job filled count).
3. External API calling (direct HTTP fetch to Gemini API).
4. Direct database mutations across up to 5 models in a single controller handler (`hiringHrmsBridgeController`).

### Phase 0 Modular Service Refactoring:
- **`counterService.js`**: Centralizes all code generation logic.
- **`aiService.js`**: Decouples AI generation into provider interfaces (`geminiProvider`, `fallbackProvider`) with Zod structured output validation and `AiRun` operational auditing.
- **`fileService.js`**: Manages secure document uploads, MIME validation, file-size enforcement, virus scan hooks, and signed URLs.
- **`queueService.js`**: Handles background jobs (async parsing, email dispatches, webhook calls) with retry logic and idempotency.

---

## 6. Test Coverage Assessment

- **Existing State**: Unit and integration test coverage for recruitment is minimal. Seed scripts verify manual data population (`seed_recruitment_data.js`).
- **Phase 0 Requirement**: Automated test harness covering:
  1. Atomic counter concurrency safety.
  2. Multi-tenant boundary isolation.
  3. File upload MIME sniffing and rejection of renamed executables.
  4. AI fallback resilience when cloud API key is missing or invalid.
