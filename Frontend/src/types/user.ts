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
  super_admin: 'text-[#ea580c] bg-[#fff7ed] border-[#fed7aa]',
  admin: 'text-[#1d4ed8] bg-[#eff6ff] border-[#bfdbfe]',
  manager: 'text-sky-700 bg-sky-50 border-sky-200',
  hr: 'text-purple-700 bg-purple-50 border-purple-200',
  recruiter: 'text-pink-700 bg-pink-50 border-pink-200',
  sales: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  finance: 'text-amber-700 bg-amber-50 border-amber-200',
  inventory_manager: 'text-teal-700 bg-teal-50 border-teal-200',
  employee: 'text-slate-700 bg-slate-100 border-slate-200',
  intern: 'text-slate-600 bg-slate-100 border-slate-200',
};
