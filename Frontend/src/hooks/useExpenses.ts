import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as expenseApi from '../lib/expenseApi';
import type {
  ExpenseClaim,
  ExpenseCategory,
  DepartmentBudget,
  ExpenseSummary,
  CreateClaimPayload,
  UpdateClaimPayload,
  CategoryPayload,
  BudgetPayload,
  PaymentMethod,
  ExpensePolicy,
  ApprovalWorkflow,
  Delegation,
  CostCenter,
  Project,
  CreatePolicyPayload,
  CreateWorkflowPayload,
  CreateDelegationPayload,
  MileageRate,
  PerDiemRate,
  FxRate,
  TaxCode,
  ParsedTextExpense,
  DuplicateReceiptCheckResult,
  MileageCalculationResult,
  PerDiemCalculationResult,
  FxConversionResult,
  TravelRequest,
  CreateTravelRequestPayload,
  CashAdvance,
  CreateCashAdvancePayload,
  PaymentBatch,
  CreatePaymentBatchPayload,
  ApproverBrief,
  BudgetForecast,
  CopilotQueryResult,
  AuditPack,
} from '../types/expenses';

export const expenseKeys = {
  all: ['expenses'] as const,
  summary: ['expenses', 'summary'] as const,
  claims: (params?: expenseApi.ClaimsFilterParams) => ['expenses', 'claims', params] as const,
  claim: (id: string) => ['expenses', 'claim', id] as const,
  approverSummary: (claimId: string) => ['expenses', 'approver-summary', claimId] as const,
  budgetForecasts: (year?: number) => ['expenses', 'budget-forecasts', year] as const,
  approvalQueue: (stage?: string) => ['expenses', 'approvals', stage] as const,
  categories: (activeOnly?: boolean) => ['expenses', 'categories', activeOnly] as const,
  budgets: (params?: { fiscalYear?: number; period?: string }) => ['expenses', 'budgets', params] as const,
  policies: ['expenses', 'policies'] as const,
  workflows: ['expenses', 'workflows'] as const,
  delegations: ['expenses', 'delegations'] as const,
  costCenters: ['expenses', 'costCenters'] as const,
  projects: ['expenses', 'projects'] as const,
  mileageRates: ['expenses', 'mileageRates'] as const,
  perDiemRates: ['expenses', 'perDiemRates'] as const,
  taxCodes: ['expenses', 'taxCodes'] as const,
  fxRates: ['expenses', 'fxRates'] as const,
  travelRequests: (params?: any) => ['expenses', 'travelRequests', params] as const,
  travelRequest: (id: string) => ['expenses', 'travelRequest', id] as const,
  cashAdvances: (params?: any) => ['expenses', 'cashAdvances', params] as const,
  activeAdvances: (employeeId: string) => ['expenses', 'cashAdvances', 'active', employeeId] as const,
  cashAdvance: (id: string) => ['expenses', 'cashAdvance', id] as const,
  paymentBatches: (status?: string) => ['expenses', 'paymentBatches', status] as const,
  paymentBatch: (id: string) => ['expenses', 'paymentBatch', id] as const,
};

const getErrMessage = (err: any, fallback: string) =>
  err?.response?.data?.error || err?.message || fallback;

// ── Summary Hook ──
export const useExpenseSummary = () =>
  useQuery<ExpenseSummary, Error>({
    queryKey: expenseKeys.summary,
    queryFn: expenseApi.getExpenseSummary,
    staleTime: 1000 * 60 * 2, // 2 mins
  });

// ── Claims Hooks ──
export const useExpenseClaims = (params?: expenseApi.ClaimsFilterParams) =>
  useQuery<expenseApi.ClaimsListResponse, Error>({
    queryKey: expenseKeys.claims(params),
    queryFn: () => expenseApi.getExpenseClaims(params),
    staleTime: 1000 * 30, // 30s
  });

export const useExpenseClaim = (id?: string) =>
  useQuery<expenseApi.ClaimDetailResponse, Error>({
    queryKey: expenseKeys.claim(id || ''),
    queryFn: () => expenseApi.getExpenseClaimById(id!),
    enabled: Boolean(id),
  });

export const useCreateExpenseClaim = () => {
  const queryClient = useQueryClient();
  return useMutation<ExpenseClaim, Error, CreateClaimPayload>({
    mutationFn: (payload) => expenseApi.createExpenseClaim(payload),
    onSuccess: (claim) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast.success(`Expense claim ${claim.claimNumber} created successfully!`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to create expense claim.'));
    },
  });
};

export const useUpdateExpenseClaim = () => {
  const queryClient = useQueryClient();
  return useMutation<ExpenseClaim, Error, { id: string; payload: UpdateClaimPayload }>({
    mutationFn: ({ id, payload }) => expenseApi.updateExpenseClaim(id, payload),
    onSuccess: (claim) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast.success(`Claim ${claim.claimNumber} updated successfully.`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to update expense claim.'));
    },
  });
};

export const useSubmitExpenseClaim = () => {
  const queryClient = useQueryClient();
  return useMutation<ExpenseClaim, Error, string | { id: string; violations?: any[] }>({
    mutationFn: (param) => {
      if (typeof param === 'string') {
        return expenseApi.submitExpenseClaim(param);
      }
      return expenseApi.submitExpenseClaim(param.id, param.violations);
    },
    onSuccess: (claim) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast.success(`Claim ${claim.claimNumber} submitted for approval!`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to submit claim.'));
    },
  });
};

export const useCancelExpenseClaim = () => {
  const queryClient = useQueryClient();
  return useMutation<ExpenseClaim, Error, string>({
    mutationFn: (id) => expenseApi.cancelExpenseClaim(id),
    onSuccess: (claim) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast.info(`Claim ${claim.claimNumber} cancelled.`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to cancel claim.'));
    },
  });
};

export const useDeleteExpenseClaim = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => expenseApi.deleteExpenseClaim(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast.success('Draft claim deleted.');
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to delete draft claim.'));
    },
  });
};

// ── Approvals Hooks ──
export const useApprovalQueue = (stage?: string) =>
  useQuery<ExpenseClaim[], Error>({
    queryKey: expenseKeys.approvalQueue(stage),
    queryFn: () => expenseApi.getApprovalQueue(stage),
    staleTime: 1000 * 30,
  });

export const useApproveExpenseClaim = () => {
  const queryClient = useQueryClient();
  return useMutation<ExpenseClaim, Error, { id: string; comments?: string }>({
    mutationFn: ({ id, comments }) => expenseApi.approveExpenseClaim(id, comments),
    onSuccess: (claim) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast.success(`Claim ${claim.claimNumber} approved successfully!`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to approve claim.'));
    },
  });
};

export const useRejectExpenseClaim = () => {
  const queryClient = useQueryClient();
  return useMutation<ExpenseClaim, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) => expenseApi.rejectExpenseClaim(id, reason),
    onSuccess: (claim) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast.warning(`Claim ${claim.claimNumber} rejected.`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to reject claim.'));
    },
  });
};

export const useSendBackExpenseClaim = () => {
  const queryClient = useQueryClient();
  return useMutation<ExpenseClaim, Error, { id: string; comments: string }>({
    mutationFn: ({ id, comments }) => expenseApi.sendBackExpenseClaim(id, comments),
    onSuccess: (claim) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast.info(`Claim ${claim.claimNumber} sent back for clarification.`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to send back claim.'));
    },
  });
};

export const useLineDecisionExpenseClaim = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ExpenseClaim,
    Error,
    { id: string; itemId: string; decision: 'approved' | 'rejected'; reason?: string }
  >({
    mutationFn: ({ id, itemId, decision, reason }) =>
      expenseApi.lineDecisionExpenseClaim(id, itemId, decision, reason),
    onSuccess: (claim, vars) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.claim(claim._id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast.success(`Item marked as ${vars.decision}.`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to record line decision.'));
    },
  });
};

export const useReimburseExpenseClaim = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ExpenseClaim,
    Error,
    { id: string; payload: { paymentMethod: PaymentMethod; transactionReference?: string } }
  >({
    mutationFn: ({ id, payload }) => expenseApi.reimburseExpenseClaim(id, payload),
    onSuccess: (claim) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast.success(`Claim ${claim.claimNumber} marked as reimbursed!`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to process reimbursement.'));
    },
  });
};

// ── Categories Hooks ──
export const useExpenseCategories = (activeOnly: boolean = false) =>
  useQuery<ExpenseCategory[], Error>({
    queryKey: expenseKeys.categories(activeOnly),
    queryFn: () => expenseApi.getExpenseCategories(activeOnly),
    staleTime: 1000 * 60 * 5,
  });

export const useCreateExpenseCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<ExpenseCategory, Error, CategoryPayload>({
    mutationFn: (payload) => expenseApi.createExpenseCategory(payload),
    onSuccess: (cat) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.categories() });
      toast.success(`Category "${cat.name}" created!`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to create category.'));
    },
  });
};

export const useUpdateExpenseCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<ExpenseCategory, Error, { id: string; payload: Partial<CategoryPayload> }>({
    mutationFn: ({ id, payload }) => expenseApi.updateExpenseCategory(id, payload),
    onSuccess: (cat) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.categories() });
      toast.success(`Category "${cat.name}" updated.`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to update category.'));
    },
  });
};

export const useDeleteExpenseCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => expenseApi.deleteExpenseCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.categories() });
      toast.success('Category removed successfully.');
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to delete category.'));
    },
  });
};

// ── Department Budgets Hooks ──
export const useDepartmentBudgets = (params?: { fiscalYear?: number; period?: string }) =>
  useQuery<DepartmentBudget[], Error>({
    queryKey: expenseKeys.budgets(params),
    queryFn: () => expenseApi.getDepartmentBudgets(params),
    staleTime: 1000 * 60,
  });

export const useSaveDepartmentBudget = () => {
  const queryClient = useQueryClient();
  return useMutation<DepartmentBudget, Error, BudgetPayload>({
    mutationFn: (payload) => expenseApi.saveDepartmentBudget(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.budgets() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.summary });
      toast.success('Department budget saved successfully!');
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to save budget allocation.'));
    },
  });
};

export const useDeleteDepartmentBudget = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => expenseApi.deleteDepartmentBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.budgets() });
      toast.success('Budget allocation deleted.');
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to delete budget.'));
    },
  });
};

// ── AI Receipt Scanner Hook ──
export const useAiScanReceipt = () =>
  useMutation<
    expenseApi.AiScanResponse,
    Error,
    { receiptUrl?: string; receiptBase64?: string; mimeType?: string; fileName?: string }
  >({
    mutationFn: (payload) => expenseApi.aiScanReceipt(payload),
    onSuccess: () => {
      toast.success('Receipt analyzed! Details auto-filled.');
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to scan receipt.'));
    },
  });

// ── Policies Hooks ──
export const useExpensePolicies = () =>
  useQuery<ExpensePolicy[], Error>({
    queryKey: expenseKeys.policies,
    queryFn: expenseApi.getExpensePolicies,
    staleTime: 1000 * 60,
  });

export const useCreateExpensePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation<ExpensePolicy, Error, CreatePolicyPayload>({
    mutationFn: (payload) => expenseApi.createExpensePolicy(payload),
    onSuccess: (policy) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.policies });
      toast.success(`Policy "${policy.name}" created.`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to create policy.'));
    },
  });
};

export const useUpdateExpensePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation<ExpensePolicy, Error, { id: string; payload: Partial<CreatePolicyPayload> }>({
    mutationFn: ({ id, payload }) => expenseApi.updateExpensePolicy(id, payload),
    onSuccess: (policy) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.policies });
      toast.success(`Policy "${policy.name}" updated.`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to update policy.'));
    },
  });
};

export const useDeleteExpensePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => expenseApi.deleteExpensePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.policies });
      toast.success('Policy deleted successfully.');
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to delete policy.'));
    },
  });
};

// ── Approval Workflows Hooks ──
export const useApprovalWorkflows = () =>
  useQuery<ApprovalWorkflow[], Error>({
    queryKey: expenseKeys.workflows,
    queryFn: expenseApi.getApprovalWorkflows,
    staleTime: 1000 * 60,
  });

export const useCreateApprovalWorkflow = () => {
  const queryClient = useQueryClient();
  return useMutation<ApprovalWorkflow, Error, CreateWorkflowPayload>({
    mutationFn: (payload) => expenseApi.createApprovalWorkflow(payload),
    onSuccess: (wf) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.workflows });
      toast.success(`Workflow "${wf.name}" created.`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to create approval workflow.'));
    },
  });
};

export const useUpdateApprovalWorkflow = () => {
  const queryClient = useQueryClient();
  return useMutation<ApprovalWorkflow, Error, { id: string; payload: Partial<CreateWorkflowPayload> }>({
    mutationFn: ({ id, payload }) => expenseApi.updateApprovalWorkflow(id, payload),
    onSuccess: (wf) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.workflows });
      toast.success(`Workflow "${wf.name}" updated.`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to update approval workflow.'));
    },
  });
};

// ── Delegations Hooks ──
export const useDelegations = () =>
  useQuery<Delegation[], Error>({
    queryKey: expenseKeys.delegations,
    queryFn: expenseApi.getDelegations,
    staleTime: 1000 * 60,
  });

export const useCreateDelegation = () => {
  const queryClient = useQueryClient();
  return useMutation<Delegation, Error, CreateDelegationPayload>({
    mutationFn: (payload) => expenseApi.createDelegation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.delegations });
      toast.success('Delegation rule activated.');
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to create delegation.'));
    },
  });
};

export const useDeleteDelegation = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => expenseApi.deleteDelegation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.delegations });
      toast.success('Delegation removed.');
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to delete delegation.'));
    },
  });
};

// ── Cost Centers & Projects Hooks ──
export const useCostCenters = () =>
  useQuery<CostCenter[], Error>({
    queryKey: expenseKeys.costCenters,
    queryFn: expenseApi.getCostCenters,
    staleTime: 1000 * 60 * 5,
  });

export const useProjects = () =>
  useQuery<Project[], Error>({
    queryKey: expenseKeys.projects,
    queryFn: expenseApi.getProjects,
    staleTime: 1000 * 60 * 5,
  });

// ── Smart Capture & AI Parsing Hooks (X1, X3, X6) ──
export const useParseTextExpense = () =>
  useMutation<ParsedTextExpense, Error, string>({
    mutationFn: (text) => expenseApi.parseTextExpense(text),
    onSuccess: () => {
      toast.success('AI parsed expense details!');
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to parse text expense.'));
    },
  });

export const useCheckReceiptDuplicate = () =>
  useMutation<
    DuplicateReceiptCheckResult,
    Error,
    { receiptBase64?: string; contentHash?: string; excludeClaimId?: string }
  >({
    mutationFn: (payload) => expenseApi.checkReceiptDuplicate(payload),
  });

// ── Mileage Engine Hooks (M6) ──
export const useMileageRates = () =>
  useQuery<MileageRate[], Error>({
    queryKey: expenseKeys.mileageRates,
    queryFn: expenseApi.getMileageRates,
    staleTime: 1000 * 60 * 5,
  });

export const useCalculateMileage = () =>
  useMutation<
    MileageCalculationResult,
    Error,
    { vehicleType?: string; distance: number; unit?: string; date?: string }
  >({
    mutationFn: (payload) => expenseApi.calculateMileage(payload),
  });

// ── Per-Diem Engine Hooks (M6) ──
export const usePerDiemRates = () =>
  useQuery<PerDiemRate[], Error>({
    queryKey: expenseKeys.perDiemRates,
    queryFn: expenseApi.getPerDiemRates,
    staleTime: 1000 * 60 * 5,
  });

export const useCalculatePerDiem = () =>
  useMutation<
    PerDiemCalculationResult,
    Error,
    {
      destination?: string;
      tier?: string;
      days: number;
      breakfastProvided?: boolean;
      lunchProvided?: boolean;
      dinnerProvided?: boolean;
    }
  >({
    mutationFn: (payload) => expenseApi.calculatePerDiem(payload),
  });

// ── Tax Codes Hooks (M5) ──
export const useTaxCodes = () =>
  useQuery<TaxCode[], Error>({
    queryKey: expenseKeys.taxCodes,
    queryFn: expenseApi.getTaxCodes,
    staleTime: 1000 * 60 * 5,
  });

// ── FX Multi-Currency Hooks (M5) ──
export const useFxRates = () =>
  useQuery<FxRate[], Error>({
    queryKey: expenseKeys.fxRates,
    queryFn: expenseApi.getFxRates,
    staleTime: 1000 * 60 * 5,
  });

export const useConvertFxAmount = () =>
  useMutation<
    FxConversionResult,
    Error,
    { baseCurrency?: string; foreignCurrency: string; amount: number; date?: string }
  >({
    mutationFn: (payload) => expenseApi.convertFxAmount(payload),
  });

// ── Travel Requests Hooks (M2) ──
export const useTravelRequests = (params?: {
  status?: string;
  employeeId?: string;
  departmentId?: string;
  search?: string;
}) =>
  useQuery<TravelRequest[], Error>({
    queryKey: expenseKeys.travelRequests(params),
    queryFn: () => expenseApi.getTravelRequests(params),
    staleTime: 1000 * 60 * 2,
  });

export const useTravelRequest = (id?: string) =>
  useQuery<TravelRequest, Error>({
    queryKey: id ? expenseKeys.travelRequest(id) : ['disabled'],
    queryFn: () => expenseApi.getTravelRequest(id!),
    enabled: Boolean(id),
  });

export const useCreateTravelRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<TravelRequest, Error, CreateTravelRequestPayload>({
    mutationFn: (payload) => expenseApi.createTravelRequest(payload),
    onSuccess: (req) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.travelRequests() });
      toast.success(`Travel request ${req.requestNumber} created!`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to create travel request.'));
    },
  });
};

export const useApproveTravelRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<TravelRequest, Error, { id: string; comments?: string }>({
    mutationFn: ({ id, comments }) => expenseApi.approveTravelRequest(id, comments),
    onSuccess: (req) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.travelRequests() });
      toast.success(`Travel request ${req.requestNumber} approved.`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to approve travel request.'));
    },
  });
};

export const useRejectTravelRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<TravelRequest, Error, { id: string; reason?: string }>({
    mutationFn: ({ id, reason }) => expenseApi.rejectTravelRequest(id, reason),
    onSuccess: (req) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.travelRequests() });
      toast.info(`Travel request ${req.requestNumber} rejected.`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to reject travel request.'));
    },
  });
};

export const useDeleteTravelRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => expenseApi.deleteTravelRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.travelRequests() });
      toast.success('Travel request deleted.');
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to delete travel request.'));
    },
  });
};

// ── Cash Advances Hooks (M3) ──
export const useCashAdvances = (params?: { status?: string; employeeId?: string }) =>
  useQuery<CashAdvance[], Error>({
    queryKey: expenseKeys.cashAdvances(params),
    queryFn: () => expenseApi.getCashAdvances(params),
    staleTime: 1000 * 60 * 2,
  });

export const useActiveAdvancesForEmployee = (employeeId?: string) =>
  useQuery<CashAdvance[], Error>({
    queryKey: employeeId ? expenseKeys.activeAdvances(employeeId) : ['disabled'],
    queryFn: () => expenseApi.getActiveAdvancesForEmployee(employeeId!),
    enabled: Boolean(employeeId),
  });

export const useCashAdvance = (id?: string) =>
  useQuery<CashAdvance, Error>({
    queryKey: id ? expenseKeys.cashAdvance(id) : ['disabled'],
    queryFn: () => expenseApi.getCashAdvance(id!),
    enabled: Boolean(id),
  });

export const useCreateCashAdvance = () => {
  const queryClient = useQueryClient();
  return useMutation<CashAdvance, Error, CreateCashAdvancePayload>({
    mutationFn: (payload) => expenseApi.createCashAdvance(payload),
    onSuccess: (adv) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.cashAdvances() });
      toast.success(`Cash advance ${adv.advanceNumber} requested!`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to request cash advance.'));
    },
  });
};

export const useApproveCashAdvance = () => {
  const queryClient = useQueryClient();
  return useMutation<CashAdvance, Error, { id: string; comments?: string }>({
    mutationFn: ({ id, comments }) => expenseApi.approveCashAdvance(id, comments),
    onSuccess: (adv) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.cashAdvances() });
      toast.success(`Cash advance ${adv.advanceNumber} approved.`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to approve cash advance.'));
    },
  });
};

export const useDisburseCashAdvance = () => {
  const queryClient = useQueryClient();
  return useMutation<CashAdvance, Error, { id: string; reference?: string }>({
    mutationFn: ({ id, reference }) => expenseApi.disburseCashAdvance(id, reference),
    onSuccess: (adv) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.cashAdvances() });
      toast.success(`Cash advance ${adv.advanceNumber} disbursed!`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to disburse cash advance.'));
    },
  });
};

// ── Payment Batches Hooks (M4) ──
export const usePaymentBatches = (status?: string) =>
  useQuery<PaymentBatch[], Error>({
    queryKey: expenseKeys.paymentBatches(status),
    queryFn: () => expenseApi.getPaymentBatches(status),
    staleTime: 1000 * 30,
  });

export const usePaymentBatch = (id?: string) =>
  useQuery<PaymentBatch, Error>({
    queryKey: id ? expenseKeys.paymentBatch(id) : ['disabled'],
    queryFn: () => expenseApi.getPaymentBatch(id!),
    enabled: Boolean(id),
  });

export const useCreatePaymentBatch = () => {
  const queryClient = useQueryClient();
  return useMutation<PaymentBatch, Error, CreatePaymentBatchPayload>({
    mutationFn: (payload) => expenseApi.createPaymentBatch(payload),
    onSuccess: (batch) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.paymentBatches() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast.success(`Payment batch ${batch.batchNumber} created with ${batch.claimsCount} claims!`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to create payment batch.'));
    },
  });
};

export const useExecutePaymentBatch = () => {
  const queryClient = useQueryClient();
  return useMutation<PaymentBatch, Error, { id: string; bankReference?: string }>({
    mutationFn: ({ id, bankReference }) => expenseApi.executePaymentBatch(id, bankReference),
    onSuccess: (batch) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.paymentBatches() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast.success(`Payment batch ${batch.batchNumber} executed and marked as paid!`);
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to execute payment batch.'));
    },
  });
};

// ── Phase 4: Intelligence & Analytics Hooks ──

export const useApproverSummary = (claimId?: string) =>
  useQuery<ApproverBrief, Error>({
    queryKey: claimId ? expenseKeys.approverSummary(claimId) : ['disabled'],
    queryFn: () => expenseApi.getApproverSummary(claimId!),
    enabled: Boolean(claimId),
    staleTime: 1000 * 60 * 5,
  });

export const useBudgetForecasts = (fiscalYear?: number) =>
  useQuery<BudgetForecast[], Error>({
    queryKey: expenseKeys.budgetForecasts(fiscalYear),
    queryFn: () => expenseApi.getBudgetForecasts(fiscalYear),
    staleTime: 1000 * 60 * 2,
  });

export const useSpendCopilot = () =>
  useMutation<CopilotQueryResult, Error, string>({
    mutationFn: (prompt) => expenseApi.querySpendCopilot(prompt),
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to query Spend Copilot.'));
    },
  });

export const useAuditPack = () =>
  useMutation<AuditPack, Error, { startDate?: string; endDate?: string; departmentId?: string }>({
    mutationFn: (payload) => expenseApi.getAuditPack(payload),
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to generate audit pack.'));
    },
  });

export const useExportAuditPackCsv = () =>
  useMutation<void, Error, { startDate?: string; endDate?: string; departmentId?: string }>({
    mutationFn: (payload) => expenseApi.exportAuditPackCsv(payload),
    onSuccess: () => {
      toast.success('Audit pack CSV downloaded successfully!');
    },
    onError: (err) => {
      toast.error(getErrMessage(err, 'Failed to export audit pack CSV.'));
    },
  });



