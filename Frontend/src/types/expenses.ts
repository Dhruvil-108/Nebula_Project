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
  | 'cancelled'
  | 'sent_back';

export const EXPENSE_STATUSES: ExpenseClaimStatus[] = [
  'draft',
  'submitted',
  'manager_approved',
  'approved',
  'rejected',
  'reimbursed',
  'cancelled',
  'sent_back',
];

export const EXPENSE_STATUS_LABELS: Record<ExpenseClaimStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  manager_approved: 'Manager Approved',
  approved: 'Approved',
  rejected: 'Rejected',
  reimbursed: 'Reimbursed',
  cancelled: 'Cancelled',
  sent_back: 'Sent Back',
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
  sent_back: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  submitted: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
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

export type ExpenseType = 'receipt' | 'mileage' | 'per_diem';

export interface MileageDetails {
  distance: number;
  unit: 'km' | 'mile';
  vehicleType: string;
  ratePerUnit: number;
}

export interface PerDiemDetails {
  destination: string;
  days: number;
  ratePerDay: number;
  breakfastProvided: boolean;
  lunchProvided: boolean;
  dinnerProvided: boolean;
}

export interface ExpenseItemAllocation {
  costCenterId?: string;
  projectId?: string;
  percent: number;
  amount: number;
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
  baseAmount?: number;
  fxRate?: number;
  receiptUrl?: string;
  receiptFileName?: string;
  receiptHash?: string;
  expenseType?: ExpenseType;
  mileageDetails?: MileageDetails;
  perDiemDetails?: PerDiemDetails;
  taxCodeId?: string;
  lineStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isBillableToClient?: boolean;
  clientName?: string;
  allocations?: ExpenseItemAllocation[];
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

export interface PolicyViolation {
  policyId?: string;
  policyName: string;
  ruleType: string;
  severity: 'info' | 'warn' | 'block';
  message: string;
  userJustification?: string;
  requiresJustification?: boolean;
}

export interface ApprovalRouteStep {
  stepOrder: number;
  approverType: 'manager' | 'finance' | 'admin' | 'project_lead' | 'specific_user';
  approverId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  actionedBy?: string;
  actionedAt?: string;
  comment?: string;
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
  projectId?: {
    _id: string;
    name: string;
    code: string;
    clientName?: string;
  } | string;
  costCenterId?: {
    _id: string;
    name: string;
    code: string;
  } | string;
  travelRequestId?: any;
  cashAdvanceId?: any;
  advanceDeductedAmount?: number;
  netReimbursableAmount?: number;
  paymentBatchId?: any;
  items: ExpenseItem[];
  totalAmount: number;
  totalTaxAmount: number;
  currency: string;
  baseCurrency?: string;
  totalBase?: number;
  status: ExpenseClaimStatus;
  approvalRoute?: ApprovalRouteStep[];
  currentStepIndex?: number;
  violations?: PolicyViolation[];
  version?: number;
  notes?: string;
  managerApproval?: ExpenseApprovalDetail;
  financeApproval?: ExpenseApprovalDetail;
  rejection?: ExpenseRejectionDetail;
  reimbursement?: ExpenseReimbursementDetail;
  submittedAt?: string;
  deletedAt?: string | null;
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
  costCenterId?: string;
  projectId?: string;
  parentBudgetId?: string;
  controlMode?: 'warn' | 'block';
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

export interface ExpensePolicy {
  _id: string;
  name: string;
  description?: string;
  scope: {
    departmentId?: any;
    categoryId?: any;
    employmentType?: 'all' | 'full_time' | 'contractor' | 'intern';
  };
  ruleType:
    | 'item_max_limit'
    | 'daily_total_limit'
    | 'receipt_mandatory_above'
    | 'allowed_merchants'
    | 'blocked_merchants'
    | 'weekend_spend_blocked';
  limitAmount?: number;
  currency?: string;
  merchantList?: string[];
  severity: 'info' | 'warn' | 'block';
  requiresJustification: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface WorkflowStep {
  stepOrder: number;
  approverType: 'manager' | 'finance' | 'admin' | 'project_lead' | 'specific_user';
  specificUserId?: {
    _id: string;
    fullName: string;
    email: string;
  } | string;
  thresholdAmount?: number;
}

export interface ApprovalWorkflow {
  _id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  conditions: {
    minAmount?: number;
    maxAmount?: number;
    departmentIds?: any[];
    categoryIds?: any[];
    isBillableOnly?: boolean;
  };
  autoApproveBelow?: number;
  steps: WorkflowStep[];
  active: boolean;
  createdAt: string;
}

export interface Delegation {
  _id: string;
  delegatorId: {
    _id: string;
    fullName: string;
    email: string;
  };
  delegateeId: {
    _id: string;
    fullName: string;
    email: string;
  };
  startDate: string;
  endDate: string;
  reason?: string;
  active: boolean;
  createdAt: string;
}

export interface CostCenter {
  _id: string;
  code: string;
  name: string;
  departmentId?: any;
  managerId?: any;
  active: boolean;
  createdAt: string;
}

export interface Project {
  _id: string;
  code: string;
  name: string;
  clientName?: string;
  isBillable: boolean;
  budget?: number;
  active: boolean;
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
  projectId?: string;
  costCenterId?: string;
  travelRequestId?: string;
  cashAdvanceId?: string;
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
    receiptHash?: string;
    expenseType?: ExpenseType;
    mileageDetails?: MileageDetails;
    perDiemDetails?: PerDiemDetails;
    taxCodeId?: string;
    isBillableToClient?: boolean;
    clientName?: string;
    allocations?: ExpenseItemAllocation[];
  }>;
  violations?: PolicyViolation[];
  notes?: string;
  currency?: string;
  submitNow?: boolean;
}

export interface UpdateClaimPayload {
  title?: string;
  departmentId?: string;
  projectId?: string;
  costCenterId?: string;
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
    receiptHash?: string;
    expenseType?: ExpenseType;
    mileageDetails?: MileageDetails;
    perDiemDetails?: PerDiemDetails;
    taxCodeId?: string;
    isBillableToClient?: boolean;
    clientName?: string;
    allocations?: ExpenseItemAllocation[];
  }>;
  notes?: string;
  currency?: string;
}

export interface PolicyCheckPayload {
  departmentId?: string;
  employmentType?: string;
  items: Array<{
    categoryId: string;
    expenseDate: string;
    merchant: string;
    amount: number;
    currency?: string;
    receiptUrl?: string;
  }>;
}

export interface PolicyCheckResult {
  violations: PolicyViolation[];
  hasBlocks: boolean;
  hasWarnings: boolean;
  warningsCount: number;
  blocksCount: number;
}

export interface CreatePolicyPayload {
  name: string;
  description?: string;
  scope?: {
    departmentId?: string;
    categoryId?: string;
    employmentType?: string;
  };
  ruleType: string;
  limitAmount?: number;
  currency?: string;
  merchantList?: string[];
  severity: 'info' | 'warn' | 'block';
  requiresJustification?: boolean;
  isActive?: boolean;
}

export interface CreateWorkflowPayload {
  name: string;
  description?: string;
  isDefault?: boolean;
  conditions?: {
    minAmount?: number;
    maxAmount?: number;
    departmentIds?: string[];
    categoryIds?: string[];
    isBillableOnly?: boolean;
  };
  autoApproveBelow?: number;
  steps: WorkflowStep[];
}

export interface CreateDelegationPayload {
  delegateeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
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
  controlMode?: 'warn' | 'block';
  costCenterId?: string;
  projectId?: string;
}

// ── Phase 2: Special Spend Types & Multi-Currency Models ──

export interface MileageRate {
  _id: string;
  vehicleType: 'car' | 'motorcycle' | 'bicycle' | 'electric' | 'van';
  ratePerUnit: number;
  unit: 'km' | 'mile';
  currency: string;
  description?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  active: boolean;
}

export interface PerDiemRate {
  _id: string;
  destination: string;
  country?: string;
  tier: 'standard' | 'tier_1' | 'tier_2' | 'tier_3' | 'high_cost';
  ratePerDay: number;
  currency: string;
  breakfastDeductionPercent: number;
  lunchDeductionPercent: number;
  dinnerDeductionPercent: number;
  active: boolean;
}

export interface FxRate {
  _id: string;
  baseCurrency: string;
  foreignCurrency: string;
  rate: number;
  effectiveDate: string;
  source: string;
}

export interface TaxCode {
  _id: string;
  code: string;
  name: string;
  ratePercent: number;
  isRecoverable: boolean;
  description?: string;
  active: boolean;
}

export interface ParsedTextExpense {
  merchant: string;
  amount: number;
  currency: string;
  expenseDate: string;
  description: string;
  suggestedCategory: string;
  suggestedCategoryId?: string;
  categoryName?: string;
  taxAmount?: number;
  isBillable: boolean;
  clientName?: string;
  confidence: number;
  isFallback?: boolean;
  expenseType?: ExpenseType;
  mileageDetails?: {
    distance: number;
    unit: 'km' | 'mile';
    vehicleType: string;
    ratePerUnit?: number;
  };
  perDiemDetails?: {
    destination: string;
    days: number;
    ratePerDay?: number;
  };
}

export interface DuplicateReceiptCheckResult {
  isDuplicate: boolean;
  hash: string;
  existingClaim?: {
    id: string;
    claimNumber: string;
    title: string;
    status: string;
    createdAt: string;
  };
}

export interface MileageCalculationResult {
  distance: number;
  unit: string;
  vehicleType: string;
  ratePerUnit: number;
  rateUnit: string;
  amount: number;
  currency: string;
}

export interface PerDiemCalculationResult {
  destination: string;
  tier: string;
  days: number;
  baseRatePerDay: number;
  deductions: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    totalDeductionPercent: number;
  };
  effectiveDailyRate: number;
  totalAmount: number;
  currency: string;
}

export interface FxConversionResult {
  originalAmount: number;
  foreignCurrency: string;
  baseAmount: number;
  baseCurrency: string;
  fxRate: number;
  fxSource: string;
}

// ── Phase 3: Travel Requests, Cash Advances & Payment Batches (M2, M3, M4) ──

export type ExpenseProject = Project;

export type TravelRequestStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'closed';

export interface TravelRequestEstimatedExpenses {
  flights?: number;
  lodging?: number;
  meals?: number;
  transport?: number;
  incidentals?: number;
  other?: number;
}

export interface TravelRequest {
  _id: string;
  requestNumber: string;
  employeeId?: {
    _id: string;
    fullName: string;
    email: string;
  } | string;
  claimantId?: {
    _id: string;
    fullName: string;
    email: string;
  } | any;
  departmentId?: {
    _id: string;
    name: string;
  } | any;
  projectId?: {
    _id: string;
    name: string;
    code: string;
    clientName?: string;
  } | any;
  costCenterId?: {
    _id: string;
    name: string;
    code: string;
  } | any;
  destination: string;
  startDate?: string;
  endDate?: string;
  departureDate?: string;
  returnDate?: string;
  purpose: string;
  estimatedExpenses?: TravelRequestEstimatedExpenses;
  totalEstimated?: number;
  estimatedTotalCost?: number;
  currency: string;
  status: TravelRequestStatus;
  approval?: {
    approvedById?: { _id: string; fullName: string; email: string };
    approvedAt?: string;
    comments?: string;
  };
  rejection?: {
    rejectedById?: { _id: string; fullName: string; email: string };
    rejectedAt?: string;
    reason?: string;
  };
  spentAmount?: number;
  actualTotalCost?: number;
  submittedAt?: string;
  createdAt: string;
}

export interface CreateTravelRequestPayload {
  destination: string;
  startDate?: string;
  endDate?: string;
  departureDate?: string;
  returnDate?: string;
  purpose: string;
  departmentId: string;
  projectId?: string;
  costCenterId?: string;
  estimatedExpenses?: Partial<TravelRequestEstimatedExpenses>;
  estimatedAirfare?: number;
  estimatedLodging?: number;
  estimatedMeals?: number;
  estimatedTransport?: number;
  estimatedOther?: number;
  estimatedTotalCost?: number;
  currency?: string;
  submitNow?: boolean;
}

export type CashAdvanceStatus =
  | 'requested'
  | 'approved'
  | 'disbursed'
  | 'partially_settled'
  | 'settled'
  | 'rejected'
  | 'cancelled';

export interface CashAdvance {
  _id: string;
  advanceNumber: string;
  employeeId: {
    _id: string;
    fullName: string;
    email: string;
  } | any;
  travelRequestId?: {
    _id: string;
    requestNumber: string;
    destination: string;
    totalEstimated?: number;
  } | any;
  amount: number;
  currency: string;
  purpose: string;
  requiredByDate?: string;
  disbursementMethod?: PaymentMethod;
  disbursedAmount?: number;
  settledAmount?: number;
  remainingBalance?: number;
  balanceAmount?: number;
  status: CashAdvanceStatus;
  approval?: {
    approvedById?: { _id: string; fullName: string; email: string };
    approvedAt?: string;
    comments?: string;
  };
  disbursement?: {
    disbursedById?: { _id: string; fullName: string; email: string };
    disbursedAt?: string;
    reference?: string;
  };
  settlementHistory?: Array<{
    claimId: { _id: string; claimNumber: string; title: string; totalAmount: number } | string;
    amount: number;
    settledAt: string;
    notes?: string;
  }>;
  createdAt: string;
}

export interface CreateCashAdvancePayload {
  amount: number;
  currency?: string;
  purpose: string;
  requiredByDate?: string;
  departmentId?: string;
  travelRequestId?: string;
  disbursementMethod?: PaymentMethod;
  notes?: string;
}

export type PaymentBatchStatus = 'draft' | 'approved' | 'processing' | 'paid' | 'completed' | 'cancelled';

export interface PaymentBatch {
  _id: string;
  batchNumber: string;
  name?: string;
  title?: string;
  paymentMethod: PaymentMethod;
  currency: string;
  totalAmount: number;
  claimsCount: number;
  claimIds: ExpenseClaim[] | string[];
  claims?: any[];
  status: PaymentBatchStatus;
  createdById: { _id: string; fullName: string; email: string } | string;
  approvedById?: { _id: string; fullName: string; email: string } | string;
  approvedAt?: string;
  paidById?: { _id: string; fullName: string; email: string } | string;
  paidAt?: string;
  bankReference?: string;
  notes?: string;
  createdAt: string;
}

export interface CreatePaymentBatchPayload {
  name?: string;
  title?: string;
  paymentMethod?: PaymentMethod;
  currency?: string;
  bankAccount?: string;
  notes?: string;
  claimIds: string[];
}

// ── Phase 4: Intelligence, Anomaly Flags, Copilot & Audit Pack ──

export interface AnomalyFlag {
  rule: string;
  severity: 'info' | 'caution' | 'high_risk';
  title: string;
  reason: string;
  itemIndex?: number;
  merchant?: string;
  amount?: number;
  matchedClaimNumber?: string;
}

export interface ApproverBrief {
  summaryParagraph: string;
  budgetImpact: {
    text: string;
    percentImpact: number;
  };
  historicalContext: {
    pastClaimsCount: number;
    pastAverageAmount: number;
  };
  anomalyFlags: AnomalyFlag[];
  riskScore: 'low' | 'medium' | 'high';
  suggestedAction: string;
  suggestedReason: string;
  draftApprovalComment: string;
}

export interface BudgetForecast {
  budgetId: string;
  departmentName: string;
  fiscalYear: number;
  allocatedAmount: number;
  currentSpentAmount: number;
  pendingCommitments: number;
  dailyBurnRate: number;
  daysElapsed: number;
  daysRemaining: number;
  projectedTotalSpend: number;
  projectedUtilizationPercent: number;
  projectedOverrun: number;
  forecastStatus: 'on_track' | 'caution' | 'breach_imminent';
  warningMessage: string;
}

export interface CopilotQueryResult {
  answer: string;
  data?: any;
  suggestedFollowUps: string[];
  timestamp: string;
}

export interface AuditPack {
  period: { startDate?: string; endDate?: string };
  totalClaims: number;
  totalSampleValue: number;
  exceptionClaimsCount: number;
  exceptionRate: number;
  narrative: string;
  sampleRows: Array<{
    claimNumber: string;
    title: string;
    date: string;
    employee: string;
    department: string;
    amount: number;
    currency: string;
    managerApprover: string;
    financeApprover: string;
    paymentMethod: string;
    transactionRef: string;
    exceptionsCount: number;
    exceptionsSummary: string;
  }>;
  generatedAt: string;
}


