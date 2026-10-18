# Recruitment Module — UI Design System (`docs/recruitment/UI-DESIGN-SYSTEM.md`)
*Source of Truth for Nebula Premium Light 2.0 UI Components*

---

## 1. Design Tokens & Theme Foundation

The entire application runs strictly on the **Nebula Premium Light 2.0** theme. Dark mode is explicitly disabled (`color-scheme: light`).

### 1.1 Core Color Tokens (`Frontend/src/index.css`)

| Token Variable | Hex / Value | Semantic Role |
|---|---|---|
| `--pl-canvas` | `#f5f5f7` | Page background canvas |
| `--pl-surface` | `#ffffff` | Clean container surface |
| `--pl-card` | `#ffffff` | Card surfaces |
| `--pl-card-hover` | `#fafbfc` | Card hover accent |
| `--pl-border` | `#e5e7eb` | Standard container & input borders |
| `--pl-border-subtle` | `#f0f0f3` | Subtle table row & section dividers |
| `--pl-border-strong` | `#d1d5db` | Prominent boundary lines |
| `--pl-brand` | `#f97316` | Primary action orange (Tailwind `orange-500`) |
| `--pl-brand-dark` | `#ea580c` | Primary hover state (Tailwind `orange-600`) |
| `--pl-brand-light` | `#fb923c` | Accent orange (Tailwind `orange-400`) |
| `--pl-brand-xlight` | `#fff7ed` | Subtle orange background tint (Tailwind `orange-50`) |
| `--pl-brand-border` | `#fed7aa` | Orange boundary accent (Tailwind `orange-200`) |
| `--pl-brand-glow` | `rgba(249, 115, 22, 0.18)` | Focus ring and hover glow |
| `--pl-text-primary` | `#111827` | Headings, titles, high-contrast labels |
| `--pl-text-secondary`| `#374151` | Body copy, table content |
| `--pl-text-muted` | `#6b7280` | Helper text, secondary timestamps |
| `--pl-text-faint` | `#9ca3af` | Placeholders, inactive icons |
| `--pl-text-brand` | `#ea580c` | Brand accent text |
| `Warm Surface Accent` | `#FBF8F4` | Drawer headers, modal banners, warm surface containers |

### 1.2 Semantic Status Palette

| State | Text Color | Background Pill | Border Pill |
|---|---|---|---|
| **Success / Hired** | `#059669` (emerald-600) | `#ecfdf5` (emerald-50) | `#a7f3d0` (emerald-200) |
| **Warning / Assessment** | `#d97706` (amber-600) | `#fffbeb` (amber-50) | `#fde68a` (amber-200) |
| **Danger / Rejected** | `#dc2626` (red-600) | `#fef2f2` (red-50) | `#fecaca` (red-200) |
| **Info / Scheduled** | `#2563eb` (blue-600) | `#eff6ff` (blue-50) | `#bfdbfe` (blue-200) |
| **Screening / Review** | `#7c3aed` (purple-600) | `#f5f3ff` (purple-50) | `#ddd6fe` (purple-200) |

### 1.3 Typography, Radii & Shadows
- **Font Family**: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Border Radius Standards**:
  - Small elements & badges: `rounded-lg` (`8px`) or `rounded-full`
  - Input controls, buttons: `rounded-xl` (`12px`)
  - Cards, modals, drawers: `rounded-2xl` (`16px`)
- **Shadow Standards**:
  - Cards: `shadow-2xs` / `shadow-xs` with border `#e5e7eb` or `#ECE0D6`
  - Floating dropdowns & popovers: `shadow-xl`
  - Modals & Slide-Over Drawers: `shadow-2xl`

---

## 2. Reusable Recruitment Component Catalog

All components reside in `Frontend/src/components/recruitment/`:

| Component | Props | Description & Key Variants |
|---|---|---|
| **`CandidateStagePill`** | `stage: CandidateStage`, `size?: 'sm' \| 'md'` | Renders color-coded badge with stage label for all 10 stages (`applied`, `screening`, `interview_round_1`, `interview_round_2`, `technical_assessment`, `hr_round`, `offer_sent`, `hired`, `rejected`, `withdrawn`). |
| **`JobStatusPill`** | `status: JobStatus` | Renders status badge (`draft`, `published`, `on_hold`, `closed`) with pulsing dot indicator. |
| **`CandidateDrawer`** | `candidateId: string \| null`, `onClose: () => void`, `onScheduleInterview?: (cand) => void`, `onCreateOffer?: (cand) => void`, `onOnboardEmployee?: (cand) => void` | 4-tab 360° slide-over dossier (`details`, `interviews`, `offer`, `activity`) with Framer Motion slide-in animation. |
| **`RecruitmentKanban`** | `candidates: Candidate[]`, `onSelectCandidate: (cand) => void`, `onMoveStage: (id, stage) => void`, `isUpdating?: boolean` | Horizontal scrolling 10-column Kanban board with real-time candidate cards, score chips, and stage advance triggers. |
| **`CreateJobModal`** | `isOpen: boolean`, `onClose: () => void`, `onSuccess?: (job) => void` | Requisition modal capturing job code, title, department, salary bands, location, hiring manager, skills, and requirements. |
| **`AddCandidateModal`**| `isOpen: boolean`, `onClose: () => void`, `onSuccess?: (cand) => void`, `defaultJobId?: string` | Modal to create candidate profile with contact details, resume URL, links, experience, and source attribution. |
| **`ScheduleInterviewModal`** | `isOpen: boolean`, `onClose: () => void`, `candidate?: Candidate \| null`, `jobOpeningId?: string`, `onSuccess?: () => void` | Panel interview scheduler with timezone picker, round type taxonomy, interviewer panel multi-select, and meeting links. |
| **`ScorecardModal`** | `isOpen: boolean`, `onClose: () => void`, `interview: Interview \| null`, `onSuccess?: () => void` | 5-star multi-competency evaluation modal (Technical, Communication, Culture Fit) with recommendation decisions (`strong_hire`, `hire`, etc.). |
| **`CreateOfferModal`** | `isOpen: boolean`, `onClose: () => void`, `candidate?: Candidate \| null`, `onSuccess?: () => void` | Compensation package creator capturing offered salary, currency, designation, department, joining date, and validity. |
| **`OnboardEmployeeModal`** | `isOpen: boolean`, `onClose: () => void`, `candidate: Candidate \| null`, `onSuccess?: () => void` | 1-Click ATS-to-HRMS bridge modal confirming employee code (`EMP-XXXX`), designation, manager, and migrating documents. |
| **`LinkedInPostModal`**| `isOpen: boolean`, `onClose: () => void`, `job: JobOpening \| null` | Gemini 1.5 Flash social post generator supporting `dynamic`, `engineering`, and `corporate` tones with clipboard copy. |

---

## 3. Shared UI Primitives & Patterns

### 3.1 Buttons
- **Primary Action**: `bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl shadow-md shadow-[#f97316]/20 font-semibold px-4 py-2 text-xs transition-all`
- **Secondary Action**: `bg-white hover:bg-slate-50 text-[#374151] border border-[#e5e7eb] rounded-xl font-semibold px-3.5 py-2 text-xs shadow-2xs transition-all`
- **Ghost Action**: `text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBEAE0] p-1.5 rounded-lg transition-colors`

### 3.2 Form Inputs
- Standard Input:
  ```css
  rounded-xl border border-[#ECE0D6] bg-white px-3.5 py-2 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all
  ```
- Labels: `block text-xs font-semibold text-[#374151] mb-1.5`
- Required indicator: `<span className="text-red-500 ml-0.5">*</span>`

### 3.3 Modals & Drawers Layout
- **Backdrop**: `fixed inset-0 bg-black/35 backdrop-blur-[2px] z-50`
- **Header**: Warm surface `#FBF8F4` border-b border-[#ECE0D6] with title, badge, and close `X` button.
- **Body**: Scrollable container `p-6 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto`.
- **Footer**: `px-6 py-4 bg-[#FBF8F4] border-t border-[#ECE0D6] flex justify-end gap-2.5`.

---

## 4. UI Invariants & Guardrails for New Features

1. **Light Mode Exclusivity**: Never add dark mode classes (`dark:`). Use existing design tokens.
2. **Component Reuse**: Reuse `FloatingDropdown`, `CandidateStagePill`, `JobStatusPill`, and modals. Do not introduce alternative UI kits.
3. **Motion**: Use Framer Motion spring presets (`damping: 30, stiffness: 300`).
4. **State Coverage**: Every screen must handle **Loading** (skeleton), **Empty** (icon + call-to-action), **Error** (retry button), and **Permission Denied** states.
5. **AI Component Standards**: All generative AI outputs must render an `AiBadge`, provide an editable review step, and provide a collapsible explanation section.
