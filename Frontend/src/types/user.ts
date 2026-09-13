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
  super_admin: 'text-[#7a2f05] bg-[#fbeae0] border-[#de7a3d]',
  admin: 'text-[#7a2f05] bg-[#fbeae0] border-[#de7a3d]',
  manager: 'text-[#7a2f05] bg-[#fbeae0] border-[#de7a3d]',
  hr: 'text-[#7a2f05] bg-[#fbeae0] border-[#de7a3d]',
  recruiter: 'text-[#7a2f05] bg-[#fbeae0] border-[#de7a3d]',
  sales: 'text-[#7a2f05] bg-[#fbeae0] border-[#de7a3d]',
  finance: 'text-[#7a2f05] bg-[#fbeae0] border-[#de7a3d]',
  inventory_manager: 'text-[#7a2f05] bg-[#fbeae0] border-[#de7a3d]',
  employee: 'text-[#7a2f05] bg-[#fbeae0] border-[#de7a3d]',
  intern: 'text-[#7a2f05] bg-[#fbeae0] border-[#de7a3d]',
};
