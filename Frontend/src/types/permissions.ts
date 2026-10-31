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
  | 'hrms:payroll'
  | 'hrms:performance'
  | 'hrms:settings'
  | 'hrms:ai'
  | 'hrms:sensitive'
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
  activeRoles?: PermissionRole[];
}

export interface PermissionRow {
  role: PermissionRole;
  module: PermissionModule;
  enabled: boolean;
  actions: PermissionAction[];
}

export interface PermissionMatrixResponse {
  matrix: PermissionRow[];
  activeRoles?: PermissionRole[];
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
    color: 'text-[#ea580c]',
    badgeBg: 'bg-[#fff7ed]',
    badgeBorder: 'border-[#fed7aa]',
  },
  hrms: {
    label: 'HRMS',
    description: 'Attendance, leaves, employee directory & records',
    color: 'text-[#ea580c]',
    badgeBg: 'bg-[#fff7ed]',
    badgeBorder: 'border-[#fed7aa]',
  },
  'hrms:payroll': {
    label: 'HRMS Payroll',
    description: 'Salary structures, payroll runs, payslips & tax reports',
    color: 'text-[#ea580c]',
    badgeBg: 'bg-[#fff7ed]',
    badgeBorder: 'border-[#fed7aa]',
  },
  'hrms:performance': {
    label: 'HRMS Performance',
    description: 'Goals, OKRs, reviews & 360 feedback cycles',
    color: 'text-[#ea580c]',
    badgeBg: 'bg-[#fff7ed]',
    badgeBorder: 'border-[#fed7aa]',
  },
  'hrms:settings': {
    label: 'HRMS Settings',
    description: 'HR policies, approval workflows, custom fields & audit',
    color: 'text-[#ea580c]',
    badgeBg: 'bg-[#fff7ed]',
    badgeBorder: 'border-[#fed7aa]',
  },
  'hrms:ai': {
    label: 'HRMS AI Copilot',
    description: 'HR intelligence, smart leave assistant & predictions',
    color: 'text-[#ea580c]',
    badgeBg: 'bg-[#fff7ed]',
    badgeBorder: 'border-[#fed7aa]',
  },
  'hrms:sensitive': {
    label: 'HRMS Sensitive Data',
    description: 'Salaries, bank accounts & statutory ID records',
    color: 'text-[#ea580c]',
    badgeBg: 'bg-[#fff7ed]',
    badgeBorder: 'border-[#fed7aa]',
  },
  recruitment: {
    label: 'Recruitment',
    description: 'Job postings, candidates & interview pipelines',
    color: 'text-[#ea580c]',
    badgeBg: 'bg-[#fff7ed]',
    badgeBorder: 'border-[#fed7aa]',
  },
  expenses: {
    label: 'Expenses',
    description: 'Expense claims, receipts, disbursements & claims',
    color: 'text-[#ea580c]',
    badgeBg: 'bg-[#fff7ed]',
    badgeBorder: 'border-[#fed7aa]',
  },
  inventory: {
    label: 'Inventory',
    description: 'Products, stock tracking, warehouse & supplies',
    color: 'text-[#ea580c]',
    badgeBg: 'bg-[#fff7ed]',
    badgeBorder: 'border-[#fed7aa]',
  },
  analytics: {
    label: 'Analytics',
    description: 'Executive dashboards, revenue metrics & reports',
    color: 'text-[#ea580c]',
    badgeBg: 'bg-[#fff7ed]',
    badgeBorder: 'border-[#fed7aa]',
  },
  settings: {
    label: 'Settings',
    description: 'Company profiles, security & system configs',
    color: 'text-[#ea580c]',
    badgeBg: 'bg-[#fff7ed]',
    badgeBorder: 'border-[#fed7aa]',
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
