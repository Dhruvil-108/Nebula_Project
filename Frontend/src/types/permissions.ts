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
    color: 'text-[#7a2f05]',
    badgeBg: 'bg-[#fbeae0]',
    badgeBorder: 'border-[#de7a3d]',
  },
  hrms: {
    label: 'HRMS',
    description: 'Attendance, leaves, employee directory & records',
    color: 'text-[#7a2f05]',
    badgeBg: 'bg-[#fbeae0]',
    badgeBorder: 'border-[#de7a3d]',
  },
  recruitment: {
    label: 'Recruitment',
    description: 'Job postings, candidates & interview pipelines',
    color: 'text-[#7a2f05]',
    badgeBg: 'bg-[#fbeae0]',
    badgeBorder: 'border-[#de7a3d]',
  },
  expenses: {
    label: 'Expenses',
    description: 'Expense claims, receipts, disbursements & claims',
    color: 'text-[#7a2f05]',
    badgeBg: 'bg-[#fbeae0]',
    badgeBorder: 'border-[#de7a3d]',
  },
  inventory: {
    label: 'Inventory',
    description: 'Products, stock tracking, warehouse & supplies',
    color: 'text-[#7a2f05]',
    badgeBg: 'bg-[#fbeae0]',
    badgeBorder: 'border-[#de7a3d]',
  },
  analytics: {
    label: 'Analytics',
    description: 'Executive dashboards, revenue metrics & reports',
    color: 'text-[#7a2f05]',
    badgeBg: 'bg-[#fbeae0]',
    badgeBorder: 'border-[#de7a3d]',
  },
  settings: {
    label: 'Settings',
    description: 'Company profiles, security & system configs',
    color: 'text-[#7a2f05]',
    badgeBg: 'bg-[#fbeae0]',
    badgeBorder: 'border-[#de7a3d]',
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
