# Nebula Premium Light 2.0 — Expenses UI Design System
## Comprehensive UI Tokens, Component Registry & Design Guardrails

---

## 1. Design Philosophy: Nebula Premium Light 2.0

Nebula Premium Light 2.0 is the official, unified design standard across the entire Nebula Business ERP ecosystem. It combines warm, airy surfaces with crisp high-contrast typography, refined border treatments, and vibrant brand accents.

### Core Visual Principles
1. **Light Mode Exclusivity**: Post-login enterprise dashboard views are strictly Light Mode. No dark mode, no inverted palettes.
2. **Warm Canvas & Soft Elevation**: Backgrounds use an ultra-subtle off-white warm canvas (`#f5f5f7` / `#FBF8F4`), elevated by pure white cards (`#ffffff`) with hairline borders (`#e5e7eb` / `#f0f0f3`).
3. **Brand Orange Accent**: The primary brand orange (`#f97316` / `#ea580c`) is reserved for primary calls-to-action, key metrics, active tab highlights, and focus rings. Small body text in orange is avoided to guarantee WCAG AA contrast.
4. **Purposeful Motion**: Powered strictly by Framer Motion (`easeInOut`, 150ms–250ms transitions). Used exclusively for smooth drawer slide-ins, modal scale-ups, and budget progress bars. No frivolous looping animations.

---

## 2. Token Dictionary & CSS Variables

All CSS variables are declared in `Frontend/src/index.css` under the `:root` scope:

### 2.1 Surfaces & Canvas
| Token Variable | Hex / Value | Usage |
|---|---|---|
| `--pl-canvas` | `#f5f5f7` | Main page background behind cards and tables |
| `--pl-surface` | `#ffffff` | Modal sheets, drawers, table headers |
| `--pl-card` | `#ffffff` | Dashboard metric cards, filter containers |
| `--pl-card-hover` | `#fafbfc` | Hover state for interactive cards and rows |
| `--pl-brand-xlight` | `#fff7ed` | Warm surface tint (`#FBF8F4` warm ivory equivalent) |

### 2.2 Brand & Accents
| Token Variable | Hex / Value | Usage |
|---|---|---|
| `--pl-brand` | `#f97316` | Core Nebula orange accent, buttons, active icons |
| `--pl-brand-dark` | `#ea580c` | Button hover state, primary interactive dark accent |
| `--pl-brand-light` | `#fb923c` | Secondary highlights, lighter border badges |
| `--pl-brand-soft` | `rgba(249, 115, 22, 0.1)` | Subtle pill background, active nav highlight |
| `--pl-brand-border` | `#fed7aa` | Border for active brand elements and notifications |
| `--pl-brand-glow` | `rgba(249, 115, 22, 0.18)`| Focus rings and elevation glow |

### 2.3 Typography & Text
| Token Variable | Hex / Value | Usage |
|---|---|---|
| `--pl-text-primary` | `#111827` | Headings, claim codes, monetary totals, primary copy |
| `--pl-text-secondary` | `#374151` | Table labels, secondary descriptions, metadata |
| `--pl-text-muted` | `#6b7280` | Placeholder text, timestamps, table column headers |
| `--pl-text-faint` | `#9ca3af` | Inactive icons, subtle dividers, empty states |
| `--pl-text-brand` | `#ea580c` | High-contrast brand links and highlighted values |

### 2.4 Status & Feedback Tokens
| Semantic Role | Background | Border | Text | Dot / Accent |
|---|---|---|---|---|
| **Success / Normal** | `#ecfdf5` (`bg-emerald-50`) | `#a7f3d0` (`border-emerald-200`) | `#065f46` (`text-emerald-800`) | `#10b981` (`bg-emerald-500`) |
| **Warning / Alert** | `#fffbeb` (`bg-amber-50`) | `#fde68a` (`border-amber-200`) | `#92400e` (`text-amber-800`) | `#f59e0b` (`bg-amber-500`) |
| **Danger / Breached** | `#fef2f2` (`bg-rose-50`) | `#fecaca` (`border-rose-200`) | `#9f1239` (`text-rose-800`) | `#f43f5e` (`bg-rose-500`) |
| **Info / Review** | `#eff6ff` (`bg-blue-50`) | `#bfdbfe` (`border-blue-200`) | `#1e40af` (`text-blue-800`) | `#3b82f6` (`bg-blue-500`) |
| **Manager Approved** | `#eef2ff` (`bg-indigo-50`) | `#c7d2fe` (`border-indigo-200`) | `#3730a3` (`text-indigo-800`) | `#6366f1` (`bg-indigo-500`) |
| **Reimbursed** | `#f0fdfa` (`bg-teal-50`) | `#99f6e4` (`border-teal-200`) | `#115e59` (`text-teal-800`) | `#14b8a6` (`bg-teal-500`) |
| **Draft / Inactive** | `#f8fafc` (`bg-slate-100`) | `#e2e8f0` (`border-slate-200`) | `#334155` (`text-slate-700`) | `#94a3b8` (`bg-slate-400`) |

---

## 3. Existing Component Registry (`Frontend/src/components/expenses/`)

### 3.1 `ExpenseStatusPill.tsx`
* **File Path**: `Frontend/src/components/expenses/ExpenseStatusPill.tsx`
* **Props**:
  - `status: ExpenseClaimStatus` (`draft`, `submitted`, `manager_approved`, `approved`, `rejected`, `reimbursed`, `cancelled`)
  - `size?: 'sm' | 'md'` (default: `'md'`)
* **Visual Structure**: Rounded full pill (`rounded-full`) with 1.5px border, background tint, high-contrast text, and a circular colored indicator dot (`w-1.5 h-1.5 rounded-full`).
* **Extension Rule**: Any new status, violation severity (info, warn, block), or anomaly risk badge must strictly inherit this pill dimension, typography (`text-xs`), and color-coding pattern.

---

### 3.2 `BudgetProgressBar.tsx`
* **File Path**: `Frontend/src/components/expenses/BudgetProgressBar.tsx`
* **Props**:
  - `spent: number`
  - `allocated: number`
  - `pending?: number`
  - `currency?: string` (default: `'USD'`)
  - `alertThreshold?: number` (default: `80`)
  - `showLabels?: boolean` (default: `true`)
* **Behavior & Thresholds**:
  - `< 80%`: Normal status (`bg-emerald-500`, badge `text-emerald-700 bg-emerald-50 border-emerald-200`).
  - `80% - 99%`: Warning amber alert (`bg-amber-500`, badge `text-amber-700 bg-amber-50 border-amber-200`).
  - `≥ 100%`: Breached overrun alert (`bg-rose-500`, badge `text-rose-700 bg-rose-50 border-rose-200`, plus excess amount message).
  - Displays pending commitments as a stacked amber striped/semi-transparent bar (`bg-amber-300 opacity-80`).
* **Extension Rule**: Any new spending limit or budget burn indicator (e.g. project budget, policy cap, per-diem bar) must extend this component's track height (`h-2`), border radius (`rounded-full`), and color transitions.

---

### 3.3 `ExpenseClaimDrawer.tsx`
* **File Path**: `Frontend/src/components/expenses/ExpenseClaimDrawer.tsx`
* **Props**:
  - `claimId: string | null`
  - `onClose: () => void`
  - `onApprove?: (id: string) => void`
  - `onReject?: (id: string) => void`
  - `onReimburse?: (id: string) => void`
  - `onSubmit?: (id: string) => void`
  - `onCancel?: (id: string) => void`
* **Visual Structure**: Slide-out drawer positioned on the right edge (`fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50`).
* **Sections**:
  1. Sticky Header with claim number, status pill, and close `X` button.
  2. Submitter Profile Bar (Avatar, Full Name, Email, Department).
  3. Executive Metric Cards (Gross Total, Total Tax, Items Count).
  4. Multi-Item Breakdown Table with receipt preview trigger and billable client badges.
  5. Multi-Tier Approval Chain Card (Manager review, Finance clearance, Rejection notes).
  6. Chronological Immutable Activity Timeline.
  7. Sticky Footer with contextual permission-gated action buttons.

---

### 3.4 `CreateClaimModal.tsx`
* **File Path**: `Frontend/src/components/expenses/CreateClaimModal.tsx`
* **Props**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `initialData?: Partial<ExpenseClaim>`
* **Visual Structure**: Centered modal dialog (`max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200`).
* **Key Features**:
  - Form validation with reactive gross total and tax sum calculations.
  - Multi-item line manager (Add, Delete, Duplicate lines).
  - Billable-to-client toggle with client name input.
  - Receipt attachment preview link.
  - Primary button: "Submit for Approval" (brand orange `#f97316`).
  - Secondary button: "Save as Draft" (slate border).

---

### 3.5 `AiReceiptScanModal.tsx`
* **File Path**: `Frontend/src/components/expenses/AiReceiptScanModal.tsx`
* **Props**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onApplyData: (extractedData: any) => void`
* **Visual Structure**: 2-column modal (`max-w-3xl`) featuring drag-and-drop upload zone on the left, live extraction form with confidence badges on the right.
* **Extraction Controls**:
  - Merchant, Date, Amount, Tax, Currency, Description, Suggested Category.
  - AI badge (`AiBadge`) with loading shimmer state.
  - "Apply to Claim" action button.

---

### 3.6 Approval & Reimbursement Action Modals
* **`ApproveClaimModal.tsx`**: Confirmation modal with optional reviewer comments input.
* **`RejectClaimModal.tsx`**: Rejection modal enforcing a **mandatory** reason input with inline red validation error if empty.
* **`ReimburseClaimModal.tsx`**: Payment settlement modal capturing payment method dropdown (Bank Transfer, Payroll, Card, Cash, Check) and transaction reference UTR string.

---

## 4. UI Guardrails & Hard Rules for ERP Upgrades

1. **No External UI Component Libraries**:
   - Do NOT introduce Shadcn, Chakra, MUI, AntD, or TailwindUI dependencies.
   - Use Lucide icons (`lucide-react`) and existing Tailwind token classes.

2. **Shared Layout Patterns**:
   - **Page Container**: `<div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">`.
   - **Page Header**: Title (`text-2xl font-bold text-slate-900`), subtitle (`text-sm text-slate-500 mt-1`), right-aligned primary actions.
   - **Filter Bar**: Flex container wrapping search input (`w-72`), category/status selects, and date pickers.
   - **Data Tables**: `min-w-full divide-y divide-slate-200 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm`.
   - **Table Headers**: `bg-slate-50/75 px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider`.
   - **Table Rows**: `hover:bg-slate-50/80 transition-colors duration-150`.

3. **Shared Form Components & Money Inputs**:
   - All monetary inputs must use the shared currency selector and live base-currency preview.
   - Labels: `block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5`.
   - Input Fields: `w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all`.

4. **Empty, Loading & Error States**:
   - Loading: Pulsing skeletons matching the exact table/card layout (`animate-pulse bg-slate-100 rounded-lg`).
   - Empty: Centered icon container (`w-12 h-12 rounded-full bg-orange-50 text-brand-600 flex items-center justify-center mx-auto mb-3`), title, description, and primary CTA button.
   - Error: Bordered danger card (`bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-between`) with a "Retry" button.

5. **AI Interaction Component (`AiPanel` / `AiBadge`)**:
   - Every AI-generated output must render an `AiBadge` (sparkle icon with gradient pill).
   - Suggestions require explicit human confirmation ("Accept", "Edit", or "Discard").
   - Low-confidence fields (<85%) are highlighted with an amber question mark and link to a collapsible "Why this was suggested" drawer.
