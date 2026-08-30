// ─────────────────────────────────────────────────────────
// Organization types
// ─────────────────────────────────────────────────────────

export type FocusArea =
  | 'crm'
  | 'hrms'
  | 'recruitment'
  | 'expenses'
  | 'inventory'
  | 'analytics'
  | 'all';

export interface Organization {
  id: string;
  name: string;
  primaryFocus: FocusArea[];
}

/** Human-readable labels for each focus area */
export const FOCUS_LABELS: Record<FocusArea, string> = {
  crm: 'CRM',
  hrms: 'HRMS',
  recruitment: 'Recruitment',
  expenses: 'Expenses',
  inventory: 'Inventory',
  analytics: 'Analytics',
  all: 'All Modules',
};
