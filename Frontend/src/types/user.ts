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
  | 'employee'
  | 'intern';

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
  intern: 'Intern',
};

/** Badge color variant for each role */
export const ROLE_COLORS: Record<Role, string> = {
  super_admin: 'text-[#ff7a59] bg-[#f0512f]/10 border-[#f0512f]/30',
  admin: 'text-[#ff8c70] bg-[#f0512f]/10 border-[#f0512f]/30',
  manager: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  hr: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  recruiter: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  sales: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  finance: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  inventory_manager: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  employee: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
  intern: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
};
