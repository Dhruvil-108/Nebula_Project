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
} from '../types/expenses';

export const expenseKeys = {
  all: ['expenses'] as const,
  summary: ['expenses', 'summary'] as const,
  claims: (params?: expenseApi.ClaimsFilterParams) => ['expenses', 'claims', params] as const,
  claim: (id: string) => ['expenses', 'claim', id] as const,
  approvalQueue: (stage?: string) => ['expenses', 'approvals', stage] as const,
  categories: (activeOnly?: boolean) => ['expenses', 'categories', activeOnly] as const,
  budgets: (params?: { fiscalYear?: number; period?: string }) => ['expenses', 'budgets', params] as const,
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
  return useMutation<ExpenseClaim, Error, string>({
    mutationFn: (id) => expenseApi.submitExpenseClaim(id),
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
