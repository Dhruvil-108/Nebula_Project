// ─────────────────────────────────────────────────────────
// Expense Management domain types — mirrors API models exactly
// ─────────────────────────────────────────────────────────

export type ExpenseClaimStatus =
  | 'draft'
  | 'submitted'
  | 'manager_approved'
  | 'approved'
  | 'rejected'
  | 'reimbursed'
  | 'cancelled';

export const EXPENSE_STATUSES: ExpenseClaimStatus[] = [
  'draft',
  'submitted',
  'manager_approved',
  'approved',
  'rejected',
  'reimbursed',
  'cancelled',
];

export const EXPENSE_STATUS_LABELS: Record<ExpenseClaimStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  manager_approved: 'Manager Approved',
  approved: 'Approved',
  rejected: 'Rejected',
  reimbursed: 'Reimbursed',
  cancelled: 'Cancelled',
};

export const EXPENSE_STATUS_COLORS: Record<
  ExpenseClaimStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  draft: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  submitted: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  manager_approved: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  approved: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  rejected: {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  reimbursed: {
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
    dot: 'bg-teal-500',
  },
  cancelled: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  },
};

export type PaymentMethod = 'bank_transfer' | 'payroll' | 'company_card' | 'cash' | 'check';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'bank_transfer',
  'payroll',
  'company_card',
  'cash',
  'check',
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Direct Bank Wire / ACH',
  payroll: 'Next Payroll Cycle',
  company_card: 'Corporate Credit Card',
  cash: 'Cash Disbursement',
  check: 'Company Check',
};

export interface ExpenseCategory {
  _id: string;
  name: string;
  code: string;
  glCode?: string;
  icon?: string;
  color?: string;
  maxClaimLimit?: number;
  isReceiptMandatory: boolean;
  receiptThresholdAmount: number;
  isActive: boolean;
  description?: string;
  claimCount?: number;
  createdAt: string;
}

export interface ExpenseItem {
  _id?: string;
  categoryId: string | ExpenseCategory;
  expenseDate: string;
  merchant: string;
  description?: string;
  amount: number;
  taxAmount?: number;
  currency?: string;
  receiptUrl?: string;
  receiptFileName?: string;
  isBillableToClient?: boolean;
  clientName?: string;
}

export interface ExpenseApprovalDetail {
  approverId?: {
    _id: string;
    fullName: string;
    email: string;
  };
  approvedAt?: string;
  comments?: string;
}

export interface ExpenseRejectionDetail {
  rejectedById?: {
    _id: string;
    fullName: string;
    email: string;
  };
  rejectedAt?: string;
  reason?: string;
  stage?: 'manager' | 'finance';
}

export interface ExpenseReimbursementDetail {
  reimbursedAt?: string;
  reimbursedById?: {
    _id: string;
    fullName: string;
    email: string;
  };
  paymentMethod?: PaymentMethod;
  transactionReference?: string;
}

export interface ExpenseClaim {
  _id: string;
  claimNumber: string;
  title: string;
  employeeId: {
    _id: string;
    fullName: string;
    email: string;
    role?: string;
  };
  departmentId: {
    _id: string;
    name: string;
  };
  items: ExpenseItem[];
  totalAmount: number;
  totalTaxAmount: number;
  currency: string;
  status: ExpenseClaimStatus;
  notes?: string;
  managerApproval?: ExpenseApprovalDetail;
  financeApproval?: ExpenseApprovalDetail;
  rejection?: ExpenseRejectionDetail;
  reimbursement?: ExpenseReimbursementDetail;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentBudget {
  _id: string;
  departmentId: {
    _id: string;
    name: string;
    description?: string;
  };
  fiscalYear: number;
  period: 'annual' | 'q1' | 'q2' | 'q3' | 'q4' | 'monthly';
  allocatedAmount: number;
  spentAmount: number;
  pendingAmount: number;
  remainingAmount: number;
  percentUsed: number;
  currency: string;
  alertThresholdPercent: number;
  isAlert: boolean;
  isOverBudget: boolean;
  notes?: string;
  createdAt: string;
}

export interface ExpenseActivity {
  _id: string;
  claimId: string;
  actorId: {
    _id: string;
    fullName: string;
    email: string;
    role?: string;
  };
  action: string;
  comment?: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface ExpenseSummary {
  metrics: {
    totalClaimed: number;
    totalApproved: number;
    totalPending: number;
    totalReimbursed: number;
    pendingCount: number;
    overallBudgetUsedPercent: number;
    totalBudgetAllocated: number;
  };
  monthlyTrend: Array<{
    month: string;
    total: number;
    approved: number;
    reimbursed: number;
  }>;
  categoryBreakdown: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
    amount: number;
    count: number;
  }>;
  recentClaims: ExpenseClaim[];
}

// Request Payload Types
export interface CreateClaimPayload {
  title: string;
  departmentId?: string;
  items: Array<{
    categoryId: string;
    expenseDate: string;
    merchant: string;
    description?: string;
    amount: number;
    taxAmount?: number;
    currency?: string;
    receiptUrl?: string;
    receiptFileName?: string;
    isBillableToClient?: boolean;
    clientName?: string;
  }>;
  notes?: string;
  currency?: string;
  submitNow?: boolean;
}

export interface UpdateClaimPayload {
  title?: string;
  departmentId?: string;
  items?: Array<{
    categoryId: string;
    expenseDate: string;
    merchant: string;
    description?: string;
    amount: number;
    taxAmount?: number;
    currency?: string;
    receiptUrl?: string;
    receiptFileName?: string;
    isBillableToClient?: boolean;
    clientName?: string;
  }>;
  notes?: string;
  currency?: string;
}

export interface CategoryPayload {
  name: string;
  code: string;
  glCode?: string;
  icon?: string;
  color?: string;
  maxClaimLimit?: number;
  isReceiptMandatory?: boolean;
  receiptThresholdAmount?: number;
  description?: string;
  isActive?: boolean;
}

export interface BudgetPayload {
  departmentId: string;
  fiscalYear: number;
  period?: 'annual' | 'q1' | 'q2' | 'q3' | 'q4' | 'monthly';
  allocatedAmount: number;
  alertThresholdPercent?: number;
  notes?: string;
}
