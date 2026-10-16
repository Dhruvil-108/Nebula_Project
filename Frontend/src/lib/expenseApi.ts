import { apiClient } from './apiClient';
import type {
  ExpenseClaim,
  ExpenseCategory,
  DepartmentBudget,
  ExpenseActivity,
  ExpenseSummary,
  CreateClaimPayload,
  UpdateClaimPayload,
  CategoryPayload,
  BudgetPayload,
  PaymentMethod,
} from '../types/expenses';

export interface ClaimsFilterParams {
  status?: string;
  departmentId?: string;
  employeeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ClaimsListResponse {
  success: boolean;
  claims: ExpenseClaim[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ClaimDetailResponse {
  success: boolean;
  claim: ExpenseClaim;
  activities: ExpenseActivity[];
}

export interface SummaryResponse {
  success: boolean;
  summary: ExpenseSummary;
}

export interface CategoriesResponse {
  success: boolean;
  categories: ExpenseCategory[];
}

export interface BudgetsResponse {
  success: boolean;
  budgets: DepartmentBudget[];
}

export interface AiScanResponse {
  success: boolean;
  extractedData: {
    merchant: string;
    expenseDate: string;
    amount: number;
    taxAmount: number;
    currency: string;
    description: string;
    suggestedCategoryId: string | null;
    suggestedCategoryName: string;
    confidence: number;
    isAiExtracted?: boolean;
  };
  receiptUrl: string;
  fileName: string;
}

// ── Summary & Analytics ──
export async function getExpenseSummary(): Promise<ExpenseSummary> {
  const { data } = await apiClient.get<SummaryResponse>('/expenses/summary');
  return data.summary;
}

// ── Claims ──
export async function getExpenseClaims(params?: ClaimsFilterParams): Promise<ClaimsListResponse> {
  const { data } = await apiClient.get<ClaimsListResponse>('/expenses/claims', { params });
  return data;
}

export async function getExpenseClaimById(id: string): Promise<ClaimDetailResponse> {
  const { data } = await apiClient.get<ClaimDetailResponse>(`/expenses/claims/${id}`);
  return data;
}

export async function createExpenseClaim(payload: CreateClaimPayload): Promise<ExpenseClaim> {
  const { data } = await apiClient.post<{ success: boolean; claim: ExpenseClaim }>(
    '/expenses/claims',
    payload
  );
  return data.claim;
}

export async function updateExpenseClaim(
  id: string,
  payload: UpdateClaimPayload
): Promise<ExpenseClaim> {
  const { data } = await apiClient.patch<{ success: boolean; claim: ExpenseClaim }>(
    `/expenses/claims/${id}`,
    payload
  );
  return data.claim;
}

export async function deleteExpenseClaim(id: string): Promise<void> {
  await apiClient.delete(`/expenses/claims/${id}`);
}

export async function submitExpenseClaim(id: string): Promise<ExpenseClaim> {
  const { data } = await apiClient.post<{ success: boolean; claim: ExpenseClaim }>(
    `/expenses/claims/${id}/submit`
  );
  return data.claim;
}

export async function cancelExpenseClaim(id: string): Promise<ExpenseClaim> {
  const { data } = await apiClient.post<{ success: boolean; claim: ExpenseClaim }>(
    `/expenses/claims/${id}/cancel`
  );
  return data.claim;
}

// ── Approvals & Queue ──
export async function getApprovalQueue(stage?: string): Promise<ExpenseClaim[]> {
  const { data } = await apiClient.get<{ success: boolean; claims: ExpenseClaim[] }>(
    '/expenses/approvals/queue',
    { params: { stage } }
  );
  return data.claims;
}

export async function approveExpenseClaim(id: string, comments?: string): Promise<ExpenseClaim> {
  const { data } = await apiClient.post<{ success: boolean; claim: ExpenseClaim }>(
    `/expenses/claims/${id}/approve`,
    { comments }
  );
  return data.claim;
}

export async function rejectExpenseClaim(id: string, reason: string): Promise<ExpenseClaim> {
  const { data } = await apiClient.post<{ success: boolean; claim: ExpenseClaim }>(
    `/expenses/claims/${id}/reject`,
    { reason }
  );
  return data.claim;
}

// ── Reimbursements ──
export async function reimburseExpenseClaim(
  id: string,
  payload: { paymentMethod: PaymentMethod; transactionReference?: string }
): Promise<ExpenseClaim> {
  const { data } = await apiClient.post<{ success: boolean; claim: ExpenseClaim }>(
    `/expenses/claims/${id}/reimburse`,
    payload
  );
  return data.claim;
}

export async function exportExpensesCsv(params?: { status?: string; departmentId?: string }): Promise<void> {
  const response = await apiClient.get('/expenses/export', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `nebula_expenses_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// ── Categories & Policies ──
export async function getExpenseCategories(activeOnly?: boolean): Promise<ExpenseCategory[]> {
  const { data } = await apiClient.get<CategoriesResponse>('/expenses/categories', {
    params: { activeOnly: activeOnly ? 'true' : undefined },
  });
  return data.categories;
}

export async function createExpenseCategory(payload: CategoryPayload): Promise<ExpenseCategory> {
  const { data } = await apiClient.post<{ success: boolean; category: ExpenseCategory }>(
    '/expenses/categories',
    payload
  );
  return data.category;
}

export async function updateExpenseCategory(
  id: string,
  payload: Partial<CategoryPayload>
): Promise<ExpenseCategory> {
  const { data } = await apiClient.patch<{ success: boolean; category: ExpenseCategory }>(
    `/expenses/categories/${id}`,
    payload
  );
  return data.category;
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  await apiClient.delete(`/expenses/categories/${id}`);
}

// ── Department Budgets ──
export async function getDepartmentBudgets(params?: {
  fiscalYear?: number;
  period?: string;
}): Promise<DepartmentBudget[]> {
  const { data } = await apiClient.get<BudgetsResponse>('/expenses/budgets', { params });
  return data.budgets;
}

export async function saveDepartmentBudget(payload: BudgetPayload): Promise<DepartmentBudget> {
  const { data } = await apiClient.post<{ success: boolean; budget: DepartmentBudget }>(
    '/expenses/budgets',
    payload
  );
  return data.budget;
}

export async function deleteDepartmentBudget(id: string): Promise<void> {
  await apiClient.delete(`/expenses/budgets/${id}`);
}

// ── AI Receipt Scanner ──
export async function aiScanReceipt(payload: {
  receiptUrl?: string;
  receiptBase64?: string;
  mimeType?: string;
  fileName?: string;
}): Promise<AiScanResponse> {
  const { data } = await apiClient.post<AiScanResponse>('/expenses/ai-scan-receipt', payload);
  return data;
}
