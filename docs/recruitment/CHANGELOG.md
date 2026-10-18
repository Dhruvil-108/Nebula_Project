# Recruitment Module — Changelog (`docs/recruitment/CHANGELOG.md`)

## [Phase 0: Foundation] - 2026-10-18

### Added
- **Atomic Counter System (`Counter.js`, `counterService.js`)**:
  - Implemented atomic `findOneAndUpdate` with `$inc: { seq: 1 }` per organization and entity type.
  - Eliminated concurrency collisions in code generation (`JOB-YYYY-XXX`, `CAND-YYYY-XXXX`, `OFF-YYYY-XXX`, `EMP-XXXX`).
  - Added `Backend/src/scripts/backfillCounters.js` to backfill existing records.
- **AI Platform Layer (`aiService.js`)**:
  - Universal provider architecture with Google Gemini (`geminiProvider.js`) and local deterministic fallback (`fallbackProvider.js`).
  - Schema-validated output using **Zod** (`prompts/linkedInPost.v1.js`).
  - Operational audit logging to `AiRun` collection (`AiRun.js`).
  - Per-tenant AI enable/disable toggle and monthly token usage tracking.
- **Secure File Service (`fileService.js`)**:
  - Magic byte / MIME-sniffing file validation for PDF, DOCX, PNG, JPEG.
  - Protection against renamed executables (`MZ` binary PE headers).
  - 5MB maximum file size enforcement.
  - Signed expiring URL generator with HMAC verification.
- **Asynchronous Job Queue (`queueService.js`)**:
  - In-memory event-driven worker queue with retry backoff, idempotency keys, and dead-letter queue.
- **Tenant Settings & Feature Flags (`RecruitmentSettings.js`, `recruitmentSettingsController.js`)**:
  - Endpoints `GET /settings`, `PATCH /settings`, `GET /ai/runs`, `GET /queue/dead-letter`.
- **Test Harness (`test_phase0_foundation.js`)**:
  - Automated 15-test suite covering concurrency, tenant isolation, file security, and AI fallback. All 15 passed.

### Changed & Hardened
- Refactored `jobOpeningController.js`, `candidateController.js`, `offerController.js`, and `hiringHrmsBridgeController.js` to use `counterService`.
- Fixed unscoped ID updates in `interviewController.js` (`Candidate.findOneAndUpdate` with `scopedFilter`), `recruitmentPipelineController.js` (`JobOpening.findOneAndUpdate` with `scopedFilter`), and `hiringHrmsBridgeController.js` (`JobOpening` and `JobOffer` updates with `scopedFilter`).
- Replaced direct Gemini API calls in `recruitmentAiController.js` with `aiService.generate()`.

### Documentation
- Created `docs/recruitment/UPGRADE-PLAN.md` (Sections 1-7).
- Created `docs/recruitment/AUDIT.md` (Codebase audit).
- Created `docs/recruitment/UI-DESIGN-SYSTEM.md` (Design tokens & components catalog).
- Created `.agents/rules/recruitment-master-rules.md` (Prompt A).
- Created `.agents/rules/recruitment-ui-guardrails.md` (Prompt B).

## [Phase 1: ERP Backbone] - 2026-10-18

### Added
- **Candidate / Application Separation (`Application.js`, `migrate_candidate_applications.js`)**:
  - Decoupled person profile (`Candidate`) from job-specific process instance (`Application`).
  - Added multi-application dossier allowing one candidate to apply to multiple roles concurrently without data overwrites.
  - Idempotent migration script executed and verified across historical database records.
  - Bidirectional reference maintained between `JobOpening`, `Candidate`, and `Application`.
- **Manpower Requisitions & Approval Workflow Engine (`Requisition.js`, `ApprovalWorkflow.js`, `requisitionController.js`)**:
  - Headcount authorization workflow with budget range, replacement vs expansion justification, and target dates.
  - Multi-step approval chain supporting sequential role-based sign-offs with comments and timestamps.
  - Requisition-to-Job governance gate: Job Openings can be spawned directly from an Approved requisition, locking the requisition and linking references.
- **Configurable Pipeline Templates & SLAs (`PipelineTemplate.js`, `pipelineTemplateController.js`)**:
  - Per-tenant customizable stage sequences with stage types (`active`, `offer`, `hired`, `rejected`) and target SLA days.
  - Automatic default template fallback ensuring standard 6-stage ATS pipeline.
- **Standardized Rejection Reason Taxonomy (`RejectionReason.js`)**:
  - Standardized catalog with categorized codes (`competency`, `compensation`, `behavioral`, `process`, `candidate_choice`, `other`).
  - Required reason tracking on candidate rejections for EEO compliance and audit ledger reporting.
- **Bulk ATS Operations (`applicationController.js`)**:
  - Endpoints: `POST /applications/bulk-move`, `POST /applications/bulk-reject`, `POST /applications/bulk-tag`.
  - Batch stage transitions and rejections with automated audit ledger entries.
- **Frontend ERP Pages & Modals**:
  - `RequisitionsPage.tsx`: Requisition dashboard with status filter tabs, metrics row, approval review, and job conversion.
  - `RecruitmentSettingsPage.tsx`: Tabs for Pipeline Templates & SLAs, Rejection Taxonomy, AI & ERP Governance toggles, and Entity Sequence overview.
  - `CreateRequisitionModal.tsx` & `RequisitionApprovalModal.tsx`: Headcount creation and approval dialogs.
  - `BulkActionBar.tsx` & `BulkRejectModal.tsx`: Sticky floating multi-select bar with batch stage advancement and catalog-based bulk rejection.
  - Added days-in-stage SLA alert chip to `RecruitmentKanban.tsx` candidate cards.
  - Mounted routes `/dashboard/recruitment/requisitions`, `/dashboard/recruitment/offers`, and `/dashboard/recruitment/settings` with sidebar navigation.
- **Test Harness (`test_phase1_backbone.js`)**:
  - Automated 20-test acceptance suite covering atomic numbering (`REQ-`, `APP-`), multi-step approval workflow, conversion gate, candidate-application dossier, bulk operations, and cross-tenant query isolation. All 20 passed.

## [Phase 2: Intake & AI Screening Suite] - 2026-10-18

### Added
- **AI Prompt Registry & Fallback Provider (`aiService.js`, `fallbackProvider.js`)**:
  - `resumeParser.v1.js`: Structured resume parsing with Zod validation extracting names, contact details, skills, experience, and education.
  - `matchScore.v1.js`: Algorithmic fairness blind match scoring engine strictly stripped of all candidate demographic indicators (name, email, phone, gender, location, address).
  - `jdGenerator.v1.js`: AI Job Description Generator with DEI Inclusive Language Audit flagging exclusionary phrases and scoring inclusivity.
  - `multiChannelPost.v1.js`: Multi-Channel Marketing Generator generating channel-tuned copy for LinkedIn, Naukri, Indeed, WhatsApp, and X/Twitter.
- **Candidate Duplicate Detection Service (`duplicateDetectionService.js`)**:
  - Cross-channel duplicate person detection checking case-insensitive email, normalized phone digits, and candidate full name within the tenant organization.
- **Talent Pools CRM (`TalentPool.js`, `talentPoolController.js`)**:
  - Multi-tenant candidate pooling for silver-medalists and passive candidate talent pools.
  - Support for custom tags, color coding, and private vs shared pool privacy settings.
- **Employee Referral System (`Referral.js`, `referralController.js`)**:
  - Internal employee referral submission, relationship tracking, resume attachments, and status progression (`submitted` -> `in_review` -> `hired` / `rejected`).
- **Public Careers Portal (`publicCareersController.js`, `CareersPortalPage.tsx`, `PublicJobDetailsPage.tsx`, `PublicApplyModal.tsx`)**:
  - Branded careers portal (`/careers/:tenantSlug`) with tenant logo, colors, search, and department/location filters.
  - Public job details view (`/careers/:tenantSlug/jobs/:jobId`) with responsibilities, requirements, compensation, and DEI fairness statement.
  - Interactive application modal with instant AI resume parser auto-fill and GDPR consent checkbox.
## [Phase 3: Interview Ops & Structured Evaluation] - 2026-10-18

### Added
- **Multi-Interviewer Scheduling & Panel Coordination (`Interview.js`, `interviewController.js`)**:
  - Upgraded interview schema with multi-evaluator panel array (`interviewers: [User]`).
  - Added meeting platform support with `MEETING_PLATFORMS` enum (`google_meet`, `zoom`, `microsoft_teams`, `phone`, `in_person`).
  - Added password/PIN protection and timezone-aware scheduling (`Asia/Kolkata` default).
  - Auto meeting link generation for Google Meet and Zoom with deterministic room codes.
- **RFC 5545 iCalendar (.ics) Generator (`calendarService.js`)**:
  - RFC 5545 standard compliant calendar file generator for interview invites.
  - Implements `VCALENDAR`, `VEVENT`, UTC formatted `DTSTART`/`DTEND` (`YYYYMMDDTHHMMSSZ`), organizer headers, and multi-attendee mapping (`ROLE=REQ-PARTICIPANT` for candidates, `ACCEPTED` for panel interviewers).
  - Download endpoint: `GET /api/v1/recruitment/interviews/:id/ics` returning `text/calendar; charset=utf-8` attachment.
  - 1-click frontend download via `recruitmentApi.downloadInterviewIcs()`.
- **Competency Rubrics & Scorecard Architecture (`Scorecard.js`, `ScorecardTemplate.js`, `scorecardController.js`)**:
  - Decoupled scorecards into independent evaluator records allowing panel members to submit separate assessments.
  - 1 to 5 rating scales per competency with weights (percentages or multipliers) and observable evidence notes.
  - Pre-configurable rubric templates (`ScorecardTemplate`) by department and role type.
  - Recommendation enum: `strong_hire`, `hire`, `neutral`, `no_hire`, `strong_no_hire`.
  - Separate qualitative strengths and areas of concern capture.
- **Tamper-Evident Scorecard Sealing (`isSealed`)**:
  - Evaluators can seal their scorecard (`POST /recruitment/scorecards/:id/seal` or during submission).
  - Permanent lock on sealed scorecards preventing retro-active alteration before or after debrief alignment meetings.
- **Interviewer Calibration & Debrief Synthesis (`scorecardController.getInterviewDebrief`)**:
  - Aggregates all evaluator scorecards for an interview round side-by-side.
  - Calculates average evaluator score and score spread across the panel.
  - **Variance Alert**: Automatically flags score divergence when rating spread >= 2 stars (e.g. 5 vs 3, or 4 vs 2), alerting the team to conduct an aligned debrief discussion.
  - Debrief synthesis modal displaying evaluator cards, competency ratings, and observable quotes.
- **Hiring Manager Consensus Recording (`scorecardController.recordConsensus`)**:
  - Hiring manager consensus decision (`advance_to_next_round`, `offer_recommended`, `schedule_followup`, `reject`).
  - Stores consensus rationale notes and automatically marks interview round as `completed`.
  - Auto-advances candidate ATS pipeline stage with full audit logging in `Application.stageHistory`.
- **Audit-Logged Interview Rescheduling (`interviewController.rescheduleInterview`)**:
  - Reschedule endpoint logging previous and new timestamps, rescheduling user, timestamp, and rationale in `rescheduleHistory` array.
- **AI Structured Interview Question Kit (`interviewQuestions.v1.js`, `aiService.js`)**:
  - Registered AI task `interview_question_kit` with Zod schema validation.
  - Produces 4-5 rigorous competency-targeted questions, follow-up probe questions, "what to look for" positive indicators, and "red flags" warning signs.
  - Fallback deterministic provider in `fallbackProvider.js` guarantees zero-downtime question kit generation.
- **Frontend UI Upgrades & New Modals**:
  - `ScheduleInterviewModal.tsx`: Multi-evaluator panel selection, platform selection, auto link generator, and timezone selector.
  - `ScorecardModal.tsx`: Dynamic 1-5 competency rubrics, template selector, evidence notes, strengths/concerns, and sealing checkbox.
  - `InterviewDebriefModal.tsx`: Calibration synthesis modal with variance alert banner, side-by-side scorecards, and consensus decision recording.
  - `InterviewQuestionKitModal.tsx`: AI probe questions, good answer criteria, red flag warnings, and 1-click copy to clipboard.
  - `InterviewsPage.tsx`: Upgraded with panel avatars, platform badges, filter tabs (all/upcoming/past), quick debrief & scorecard triggers, direct .ics downloads, and audit-logged rescheduling dialog.
- **Test Harness (`test_phase3_interviews.js`)**:
  - Automated 31-test acceptance suite covering template rubrics, panel scheduling, RFC 5545 .ics generation, multi-evaluator scorecard submissions, tamper sealing, variance alerts, consensus recording, rescheduling audit history, and AI question kits. All 31 tests passed 100%.

## [Phase 4: Offers, E-Sign & Compensation Governance] - 2026-10-18

### Added
- **Itemized CTC Compensation Breakdown (`JobOffer.js`, `compensationService.js`)**:
  - Full structural modeling of Base Fixed Salary, Performance Variable Bonus, Equity/Stock Grants, Sign-on Bonus, Relocation Assistance, and Allowances.
  - Live calculation of Total Annual CTC with multi-currency support (`USD`, `EUR`, `GBP`, `INR`, `CAD`, `AUD`).
- **Compensation Band Governance Engine (`compensationService.checkBandGovernance`)**:
  - Automated deviation detection comparing Total CTC against `JobOpening.salaryRange.max`.
  - Calculates deviation percentage and automatically triggers Finance Head approval escalation when above-band.
  - Requires executive compensation justification notes when submitting out-of-band offers.
- **Dynamic Multi-Step Approval Workflows (`compensationService.generateApprovalChain`, `offerController.js`)**:
  - Standard chain: `Recruiter` (initiation) -> `Hiring Manager` -> `HR Director` (final sign-off).
  - Escalated chain: Injects `Finance Head` review when compensation deviates above maximum band.
  - Step-by-step approval and rejection endpoints (`POST /recruitment/offers/:id/approve-step`, `reject-step`).
- **Branded HTML Offer Letter Generator (`offerLetterService.generateOfferLetterHtml`)**:
  - Generates company-branded offer letters with detailed compensation breakdown tables, benefits schedules, and legal contingencies.
  - Dynamically embeds digital verification seal with candidate signer name, UTC execution timestamp, and client IP audit stamp.
  - Dedicated preview endpoint: `GET /recruitment/offers/:id/letter`.
- **Zero-Login Candidate E-Signature Portal (`publicOfferController.js`, `CandidateOfferSigningPage.tsx`)**:
  - Public tokenized endpoints mounted at `/api/v1/recruitment/public/offers/:token` and `/sign`.
  - Cryptographic 64-character hex tokens with configurable expiration (14 days default).
  - Clean, unauthenticated candidate interface at `/offers/sign/:token`.
  - Dual signature input: Interactive HTML5 drawing canvas with touch/mouse support + typed cursive signature mode.
  - Full audit logging capturing signer legal full name, client IP address, user-agent string, and timestamp in compliance with UETA & ESIGN Act.
  - Automated candidate stage progression to `hired` and activity logging in `RecruitmentActivity`.
  - Polite offer decline modal capturing feedback categories and notes (`POST /public/offers/:token/decline`).
- **Frontend Offers UI & Modals (`OffersPage.tsx`, `CreateOfferModal.tsx`)**:
  - `CreateOfferModal.tsx`: Multi-tab offer builder with Role & Terms, Itemized CTC Builder, Live Band Governance gauge, and dynamic approval chain preview.
  - `OffersPage.tsx`: Interactive dashboard with multi-step approval chain badges, letter preview modal, direct e-sign link generator, and candidate picker.
  - 1-Click HRMS onboarding bridge transition into employees and payroll.
- **Test Harness (`test_phase4_offers.js`)**:
  - Automated 42-test acceptance suite covering CTC calculation, within-band and out-of-band governance, dynamic escalation chains, branded letter generation, document persistence, step-by-step approvals, tokenized dispatch, zero-login retrieval, and digital e-signature execution. All 42 tests passed 100%.
  - Regression suite: 137 / 137 tests passing across Phases 0, 1, 2, 3, and 4.

## [Phase 5: Analytics, Reporting, EEO Compliance & Recruiter Copilot] - 2026-10-18

### Added
- **Recruitment Analytics Numerical Calculation Engine (`recruitmentAnalyticsService.js`)**:
  - Overview KPI metrics: Active candidates count, open job openings, total hires, total completed interviews, offer acceptance rate (%), and average time-to-hire in days.
  - Full funnel conversion & drop-off analytics: Sequential stage tracking across Applied, Screening, Initial Interview, Technical Assessment, HR Round, Offer Sent, and Hired, with stage counts, pass-through percentages, and drop-off percentages.
  - Sourcing channel ROI analyzer: Aggregation by source channel (LinkedIn, Referral, Careers Page, Job Portal, Recruiter Outreach) computing total applicants, hires, conversion rate (%), and average rating.
  - Department hiring velocity metrics: Grouping by department tracking total openings, filled positions, and remaining open positions.
- **Autonomous EEO/DEI Demographic Intake & Four-Fifths Rule Analyzer (`EeoSurvey.js`, `eeoComplianceService.js`)**:
  - Anonymous voluntary demographic intake model completely decoupled from candidate PII (zero `candidateId` / `applicantId` foreign keys) to legally eliminate evaluator bias.
  - Public EEO survey submission endpoint mounted at `POST /api/v1/recruitment/public/careers/:tenantSlug/jobs/:jobId/eeo`.
  - Demographic breakdown service aggregating percentages across Gender, Race/Ethnicity, Veteran Status, and Disability Status.
  - Automated Four-Fifths (80%) Rule adverse impact diagnostic: Automatically identifies the highest selection rate benchmark group and calculates impact ratios for all demographic subgroups. Flags disparate impact notices when impact ratio falls below 0.80.
- **On-Demand RFC 4180 CSV Reporting & Export (`exportService.js`, `ExportReportModal.tsx`)**:
  - Candidate Pipeline CSV export: Candidate Code, Full Name, Email, Phone, Target Job, Stage, Rating, Source, and Application Date with escaping for special characters.
  - Job Offers CSV export: Offer Code, Candidate Name, Designation, Department, Total CTC, Currency, Status, Joining Date, and E-Signed Date.
- **Semantic Talent Rediscovery & Silver-Medalist Engine (`semanticSearchService.js`)**:
  - Natural language multi-attribute search across candidate dossiers, matching query terms against candidate skills, roles, tags, notes, and ratings with normalized scoring.
  - Silver-medalist discovery algorithm: Automatically retrieves high-potential past finalists who reached late stages (`interview_round_2`, `technical_assessment`, `hr_round`) or achieved ratings $\ge 3$ for instant role re-engagement.
- **Recruiter AI Copilot Engine (`recruiterCopilot.v1.js`, `fallbackProvider.js`, `RecruiterCopilotDrawer.tsx`)**:
  - Registered AI task `recruiter_copilot` in prompt registry with Zod validation for candidate dossier summaries, multi-candidate comparisons, and interviewer briefing notes.
  - Fallback deterministic provider in `fallbackProvider.js` guarantees zero-downtime synthesis of executive summaries, key strengths, potential areas of concern, overall recommendations, and concrete next action items.
  - Interactive slide-over drawer UI (`RecruiterCopilotDrawer.tsx`) with markdown rendering, badge highlights, and action triggers.
- **Frontend Analytics & Compliance Pages & Navigation**:
  - `RecruitmentAnalyticsPage.tsx`: Executive summary metric cards, full funnel drop-off visualization with pass-through and drop-off rates, sourcing ROI comparison table, department velocity progress bars, on-demand CSV export modal, and semantic talent rediscovery candidate cards with 1-click Copilot synthesis.
  - `EeoCompliancePage.tsx`: Interactive demographic distribution cards, four-fifths rule adverse impact diagnostic table with benchmark identification, selection rate comparisons, impact ratio indicators, and legal compliance warning badges.
  - Mounted routes in `App.tsx`: `/dashboard/recruitment/analytics` and `/dashboard/recruitment/compliance`.
  - Updated `Sidebar.tsx` with dedicated navigation links for Analytics & ROI and EEO Compliance under the Recruitment core engine.
- **Test Harness (`test_phase5_analytics.js`)**:
  - Automated 50-test acceptance suite covering KPI calculations, sequential funnel pass-through, sourcing ROI conversions, department velocity, anonymous EEO intake, Four-Fifths adverse impact detection, CSV generation, semantic search, silver-medalist filtering, and Recruiter AI Copilot generation.
  - Full Regression Suite: **187 / 187 tests passing across Phases 0, 1, 2, 3, 4, and 5 (100% pass rate, 0 regressions)**.
  - Frontend Build: `npm run build` completed cleanly with 0 TypeScript compilation errors.



