// ─────────────────────────────────────────────────────────
// User types
// ─────────────────────────────────────────────────────────

export type Role =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'hr'
  | 'recruiter'
  | 'sales'
  | 'finance'
  | 'inventory_manager'
  | 'employee';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}

/** Human-readable label for each role */
export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  hr: 'HR',
  recruiter: 'Recruiter',
  sales: 'Sales',
  finance: 'Finance',
  inventory_manager: 'Inventory Manager',
  employee: 'Employee',
};

/** Badge color variant for each role */
export const ROLE_COLORS: Record<Role, string> = {
  super_admin: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  admin: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  manager: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  hr: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  recruiter: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  sales: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  finance: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  inventory_manager: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  employee: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
};
