// ─────────────────────────────────────────────────────────
// Permissions Types — Super Admin Matrix
// ─────────────────────────────────────────────────────────

export type PermissionRole =
  | 'admin'
  | 'manager'
  | 'hr'
  | 'recruiter'
  | 'sales'
  | 'finance'
  | 'inventory_manager'
  | 'employee'
  | 'intern';

export type PermissionModule =
  | 'crm'
  | 'hrms'
  | 'recruitment'
  | 'expenses'
  | 'inventory'
  | 'analytics'
  | 'settings';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve';

export interface PermissionCatalog {
  modules: PermissionModule[];
  actions: PermissionAction[];
  roles: PermissionRole[];
}

export interface PermissionRow {
  role: PermissionRole;
  module: PermissionModule;
  enabled: boolean;
  actions: PermissionAction[];
}

export interface PermissionMatrixResponse {
  matrix: PermissionRow[];
}

export interface PermissionUpdate {
  updates: PermissionRow[];
}

/** Human-friendly module definitions */
export const MODULE_METADATA: Record<
  PermissionModule,
  { label: string; description: string; color: string; badgeBg: string; badgeBorder: string }
> = {
  crm: {
    label: 'CRM',
    description: 'Leads, pipeline, deals & customer relationships',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/20',
  },
  hrms: {
    label: 'HRMS',
    description: 'Attendance, leaves, employee directory & records',
    color: 'text-rose-400',
    badgeBg: 'bg-rose-500/10',
    badgeBorder: 'border-rose-500/20',
  },
  recruitment: {
    label: 'Recruitment',
    description: 'Job postings, candidates & interview pipelines',
    color: 'text-orange-400',
    badgeBg: 'bg-orange-500/10',
    badgeBorder: 'border-orange-500/20',
  },
  expenses: {
    label: 'Expenses',
    description: 'Expense claims, receipts, disbursements & claims',
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10',
    badgeBorder: 'border-cyan-500/20',
  },
  inventory: {
    label: 'Inventory',
    description: 'Products, stock tracking, warehouse & supplies',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/20',
  },
  analytics: {
    label: 'Analytics',
    description: 'Executive dashboards, revenue metrics & reports',
    color: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10',
    badgeBorder: 'border-indigo-500/20',
  },
  settings: {
    label: 'Settings',
    description: 'Company profiles, security & system configs',
    color: 'text-purple-400',
    badgeBg: 'bg-purple-500/10',
    badgeBorder: 'border-purple-500/20',
  },
};

/** Action definitions */
export const ACTION_METADATA: Record<
  PermissionAction,
  { label: string; description: string; shortcut: string }
> = {
  view: { label: 'View', description: 'Can read & inspect records', shortcut: 'V' },
  create: { label: 'Create', description: 'Can create new records', shortcut: 'C' },
  edit: { label: 'Edit', description: 'Can modify existing records', shortcut: 'E' },
  delete: { label: 'Delete', description: 'Can permanently remove records', shortcut: 'D' },
  approve: { label: 'Approve', description: 'Can approve workflows & claims', shortcut: 'A' },
};
