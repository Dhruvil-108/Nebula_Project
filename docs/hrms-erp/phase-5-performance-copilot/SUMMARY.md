# Nebula HRMS — Phase 5: Performance, OKRs & HR AI Copilot Engine

**Status:** Completed & Production-Verified  
**Date:** October 2026  
**Module:** Human Resource Management System (HRMS) — Talent, Appraisals & Workforce Intelligence  
**Design Standard:** Nebula Premium Light 2.0 (Brand orange `#f97316`, warm surface `#FBF8F4`, border `#ECE0D6`, text `#1A1A1A` and `#6B6B6B`)

---

## 1. Executive Summary

Phase 5 delivers the crowning capabilities of the **Nebula HRMS ERP Transformation**: an integrated **Performance, OKR & Talent Intelligence Engine** paired with a natural-language **HR AI Copilot**.

This module transforms people operations from static employee administration into continuous performance management, talent calibration, and predictive retention intelligence.

### Key Capabilities Delivered:
1. **Goals & OKRs Management:** Enterprise objectives hierarchy (Company, Department, Individual) with weighted, measurable Key Results, milestone tracking, and regular check-in logs.
2. **360° Review Cycles & Appraisals:** Formal review cycles (`annual`, `semi_annual`, `quarterly`) orchestrating self-appraisals, manager reviews, and peer feedback.
3. **9-Box Talent Calibration Matrix:** Visual 3×3 calibration grid evaluating talent across Performance (Low, Medium, High) and Potential (Low, Medium, High) with 9 distinct talent profiles (e.g. "Future Leader / Star", "High Performer", "Core Contributor", "Risk / Underperformer"), plus promotion nomination and salary increment calibration.
4. **Predictive Attrition Risk Radar:** Multi-factor analytical model evaluating 90-day attendance stability, leave frequency trends, tenure stagnation (>14-24 months without transition), and review momentum to generate proactive retention intervention plans.
5. **Interactive HR AI Copilot:** Natural-language conversational interface equipped with semantic query classification, structured analytics cards, and actionable talent recommendations.

---

## 2. Architecture & Data Model Enhancements

### A. New Mongoose Schemas

#### 1. `Goal` (`Backend/src/models/Goal.js`)
- `organizationId`: Multi-tenant key.
- `employeeId`: Assigned goal owner.
- `departmentId`: Relational department link.
- `title`, `description`: Objective specification.
- `category`: `engineering` | `sales` | `operations` | `leadership` | `personal_growth` | `general`.
- `level`: `individual` | `department` | `company`.
- `period`: Cycle identifier (e.g., "2026 Annual", "Q3 2026").
- `startDate`, `dueDate`: Milestone schedule.
- `status`: `not_started` | `in_progress` | `at_risk` | `behind` | `completed` | `cancelled`.
- `progress`: Auto-calculated completion percentage (0–100%).
- `weight`: Performance weighting (1–100).
- `keyResults`: Array of `{ title, targetValue, currentValue, unit, weight, confidenceScore }`.
- `checkIns`: Array of `{ date, note, progressSnapshot, updatedBy }`.

#### 2. `ReviewCycle` (`Backend/src/models/ReviewCycle.js`)
- `organizationId`: Multi-tenant key.
- `name`, `description`: Cycle designation (e.g., "FY2026 Annual Performance Review").
- `reviewPeriod`: `annual` | `semi_annual` | `quarterly` | `adhoc`.
- `startDate`, `endDate`, `dueDate`: Appraisal timetable.
- `status`: `draft` | `active` | `in_review` | `calibrating` | `completed` | `archived`.
- `type`: `360_degree` | `manager_only` | `self_and_manager`.
- `eligibleDepartments`: Target department IDs or empty for organization-wide.
- `submissionStats`: `{ totalEligible, completed, pending }`.

#### 3. `PerformanceReview` (`Backend/src/models/PerformanceReview.js`)
- `organizationId`: Multi-tenant key.
- `reviewCycleId`: Link to `ReviewCycle`.
- `employeeId`, `managerId`: Evaluated employee and primary reviewer.
- `selfReview`: `{ summary, strengths, growthAreas, achievements, rating (1-5), submittedAt }`.
- `managerReview`: `{ summary, strengths, growthAreas, rating (1-5), potentialRating (1-3), recommendations, submittedAt }`.
- `peerReviews`: Array of `{ reviewerId, feedback, rating, submittedAt }`.
- `calibration`:
  - `nineBoxGrid`:
    - `performanceScore`: 1 (`low`), 2 (`medium`), 3 (`high`).
    - `potentialScore`: 1 (`low`), 2 (`medium`), 3 (`high`).
    - `boxLabel`: e.g. "Future Leader / Star", "High Performer", "Core Contributor".
  - `promotionRecommended`: Boolean flag for HR promotions.
  - `salaryIncrementPercentage`: Recommended compensation increment.
  - `calibrationNotes`, `calibratedBy`, `calibratedAt`.
- `status`: `pending_self` | `pending_manager` | `in_calibration` | `completed`.

#### 4. `AttritionRisk` (`Backend/src/models/AttritionRisk.js`)
- `organizationId`: Multi-tenant key.
- `employeeId`: Linked employee reference.
- `riskScore`: Computed index (0–100%).
- `riskLevel`: `low` | `medium` | `high` | `critical`.
- `contributingFactors`: Array of `{ factor, weight, description, metricValue }`.
- `suggestedInterventions`: Actionable HR retention recommendations.
- `lastPromotedOrIncrementedMonths`: Tenure in role without upward mobility.
- `attendanceStabilityScore`: Punctuality and shift fulfillment index.
- `leaveFrequencyTrend`: `stable` | `increasing` | `sporadic`.
- `computedAt`: Timestamp of last evaluation.

---

## 3. Computational Engines & Services

### A. Performance Service (`Backend/src/services/performanceService.js`)
- **Key Result Rollup Engine:** Computes overall goal completion automatically from weighted Key Results:
  $$\text{Progress} = \frac{\sum (\text{Key Result } \% \times \text{Weight})}{\sum \text{Weights}}$$
- **9-Box Calibration Matrix Mapper:** Maps normalized Performance (1–3) and Potential (1–3) scores to standard human capital profiles:
  - $(3, 3)$: Future Leader / Star
  - $(3, 2)$: High Performer
  - $(2, 3)$: Growth Player
  - $(2, 2)$: Core Contributor
  - $(1, 1)$: Risk / Underperformer
- **Predictive Attrition Risk Engine:** Synthesizes 4 distinct signals:
  1. *Attendance Stability:* Late punches and unexcused absences in past 90 days.
  2. *Leave Pattern Spikes:* Frequent casual or emergency leaves indicating active interviewing.
  3. *Tenure Stagnation:* Months elapsed since last promotion or compensation revision (>14 mos adds risk, >24 mos high risk).
  4. *Review Trajectory:* Low calibration ratings or stagnant performance reviews.

### B. HR AI Copilot Service (`Backend/src/services/hrmsCopilotService.js`)
- Multi-intent natural-language interpreter:
  - **Retention Intent:** Evaluates high and critical attrition risks and lists top drivers.
  - **Goals Intent:** Aggregates OKR velocity, completion percentages, and highlights at-risk goals.
  - **9-Box Intent:** Summarizes calibration distribution across stars, high performers, and underperformers.
  - **Promotions Intent:** Gathers candidates recommended for promotion and salary increments.
- Integrated with central AI provider and rich deterministic fallback algorithms.

---

## 4. API Endpoints

All endpoints are mounted under `/api/v1/hr/performance/*` with RBAC protection:

| Endpoint | Method | Permission | Purpose |
|---|---|---|---|
| `/api/v1/hr/performance/goals` | `GET` | `hrms:view` | Lists goals with filters (employee, dept, status, period) |
| `/api/v1/hr/performance/goals` | `POST` | `hrms:create` | Creates objective with weighted key results |
| `/api/v1/hr/performance/goals/:id` | `GET` | `hrms:view` | Retrieves single goal with check-in history |
| `/api/v1/hr/performance/goals/:id` | `PATCH` | `hrms:edit` | Updates goal or key results with progress recalculation |
| `/api/v1/hr/performance/goals/:id` | `DELETE` | `hrms:delete` | Soft deletes goal |
| `/api/v1/hr/performance/goals/:id/check-in` | `POST` | `hrms:view` | Logs progress check-in note and milestone snapshot |
| `/api/v1/hr/performance/cycles` | `GET` | `hrms:view` | Lists review cycles and participation stats |
| `/api/v1/hr/performance/cycles` | `POST` | `hrms:create` | Launches review cycle and creates draft reviews for eligible staff |
| `/api/v1/hr/performance/reviews` | `GET` | `hrms:view` | Lists appraisals with filters |
| `/api/v1/hr/performance/reviews/:id` | `GET` | `hrms:view` | Retrieves appraisal details |
| `/api/v1/hr/performance/reviews/:id/self` | `PATCH` | `hrms:view` | Submits employee self-appraisal |
| `/api/v1/hr/performance/reviews/:id/manager` | `PATCH` | `hrms:edit` | Submits manager review & initial 9-box rating |
| `/api/v1/hr/performance/reviews/:id/calibrate` | `PATCH` | `hrms:approve` | Finalizes 9-box calibration, promotion, and increment % |
| `/api/v1/hr/performance/nine-box` | `GET` | `hrms:view` | Computes 3×3 talent calibration grid distribution |
| `/api/v1/hr/performance/attrition-risks` | `GET` | `hrms:view` | Retrieves attrition risk radar and alerts |
| `/api/v1/hr/performance/attrition-risks/recompute` | `POST` | `hrms:edit` | Triggers real-time recalculation of risk engine |
| `/api/v1/hr/performance/copilot/query` | `POST` | `hrms:view` | Natural-language query interface for HR AI Copilot |

---

## 5. Frontend Implementation

### A. Dedicated Performance Hub (`Frontend/src/pages/hrms/PerformancePage.tsx`)
Structured across 5 interactive tabs:
1. **Goals & OKRs:**
   - Filter by status (`in_progress`, `completed`, `at_risk`, `behind`).
   - Card grid with visual progress bars, category pills, and key results progress.
   - Quick "Check In" modal with interactive slider and milestone notes.
   - "Create Goal" modal with key results configuration.
2. **360° Appraisals & Review Cycles:**
   - Active cycle summary cards with submission counters.
   - Appraisal roster showing self-ratings, manager ratings, and calibration status.
   - Dedicated modal forms for Self-Review, Manager Review, and Calibration.
3. **9-Box Talent Calibration Matrix:**
   - Interactive 3×3 visual matrix displaying all 9 human capital segments.
   - Shows live headcounts and employee pills in each quadrant.
   - Click-to-calibrate modal for adjusting Performance/Potential scores and promotion recommendations.
4. **Retention Radar & Attrition Risk Analytics:**
   - Real-time score badges (`Low`, `Medium`, `High`, `Critical`).
   - Diagnostic counters for attendance stability and role tenure stagnation.
   - Itemized contributing factors and tailored retention interventions.
   - 1-click "Recompute Risk Engine" action.
5. **HR AI Copilot (Interactive Assistant):**
   - Natural language prompt bar with one-click suggestion chips.
   - Real-time conversational card responses with structured metrics and suggested follow-ups.

### B. Navigation & System Integration
- **Sidebar (`Sidebar.tsx`):** Added `Performance` nav item with `Award` icon.
- **Top Bar (`AppShell.tsx`):** Registered route `/dashboard/hrms/performance` mapped to `HRMS · Performance & AI Copilot`.
- **HRMS Dashboard (`HrmsPage.tsx`):** Added direct `Performance` button in header quick actions.

---

## 6. Verification & Quality Assurance

- **TypeScript Compilation:** Passed cleanly (`tsc -b`).
- **Production Bundle:** `vite build` completed successfully with 0 errors.
- **Strict Compliance:** Adheres to **Guard Block G** and **Nebula Premium Light 2.0** design tokens throughout.
