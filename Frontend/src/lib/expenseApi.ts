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
  ExpensePolicy,
  ApprovalWorkflow,
  Delegation,
  CostCenter,
  Project,
  PolicyCheckPayload,
  PolicyCheckResult,
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

export async function submitExpenseClaim(
  id: string,
  violations?: any[]
): Promise<ExpenseClaim> {
  const { data } = await apiClient.post<{ success: boolean; claim: ExpenseClaim }>(
    `/expenses/claims/${id}/submit`,
    { violations }
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

export async function sendBackExpenseClaim(id: string, comments: string): Promise<ExpenseClaim> {
  const { data } = await apiClient.post<{ success: boolean; claim: ExpenseClaim }>(
    `/expenses/claims/${id}/send-back`,
    { comments }
  );
  return data.claim;
}

export async function lineDecisionExpenseClaim(
  id: string,
  itemId: string,
  decision: 'approved' | 'rejected',
  reason?: string
): Promise<ExpenseClaim> {
  const { data } = await apiClient.post<{ success: boolean; claim: ExpenseClaim }>(
    `/expenses/claims/${id}/line-decision`,
    { itemId, decision, reason }
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

// ── Policies Engine ──
export async function checkExpensePolicies(payload: PolicyCheckPayload): Promise<PolicyCheckResult> {
  const { data } = await apiClient.post<PolicyCheckResult & { success: boolean }>('/expenses/policies/check', payload);
  return data;
}

export async function getExpensePolicies(): Promise<ExpensePolicy[]> {
  const { data } = await apiClient.get<{ success: boolean; policies: ExpensePolicy[] }>('/expenses/policies');
  return data.policies;
}

export async function createExpensePolicy(payload: CreatePolicyPayload): Promise<ExpensePolicy> {
  const { data } = await apiClient.post<{ success: boolean; policy: ExpensePolicy }>('/expenses/policies', payload);
  return data.policy;
}

export async function updateExpensePolicy(id: string, payload: Partial<CreatePolicyPayload>): Promise<ExpensePolicy> {
  const { data } = await apiClient.patch<{ success: boolean; policy: ExpensePolicy }>(`/expenses/policies/${id}`, payload);
  return data.policy;
}

export async function deleteExpensePolicy(id: string): Promise<void> {
  await apiClient.delete(`/expenses/policies/${id}`);
}

// ── Workflows & Approval Matrix ──
export async function getApprovalWorkflows(): Promise<ApprovalWorkflow[]> {
  const { data } = await apiClient.get<{ success: boolean; workflows: ApprovalWorkflow[] }>('/expenses/workflows');
  return data.workflows;
}

export async function createApprovalWorkflow(payload: CreateWorkflowPayload): Promise<ApprovalWorkflow> {
  const { data } = await apiClient.post<{ success: boolean; workflow: ApprovalWorkflow }>('/expenses/workflows', payload);
  return data.workflow;
}

export async function updateApprovalWorkflow(id: string, payload: Partial<CreateWorkflowPayload>): Promise<ApprovalWorkflow> {
  const { data } = await apiClient.patch<{ success: boolean; workflow: ApprovalWorkflow }>(`/expenses/workflows/${id}`, payload);
  return data.workflow;
}

// ── Delegations (Out-of-office) ──
export async function getDelegations(): Promise<Delegation[]> {
  const { data } = await apiClient.get<{ success: boolean; delegations: Delegation[] }>('/expenses/delegations');
  return data.delegations;
}

export async function createDelegation(payload: CreateDelegationPayload): Promise<Delegation> {
  const { data } = await apiClient.post<{ success: boolean; delegation: Delegation }>('/expenses/delegations', payload);
  return data.delegation;
}

export async function deleteDelegation(id: string): Promise<void> {
  await apiClient.delete(`/expenses/delegations/${id}`);
}

// ── Cost Centers & Projects ──
export async function getCostCenters(): Promise<CostCenter[]> {
  const { data } = await apiClient.get<{ success: boolean; costCenters: CostCenter[] }>('/expenses/cost-centers');
  return data.costCenters;
}

export async function getProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<{ success: boolean; projects: Project[] }>('/expenses/projects');
  return data.projects;
}

// ── Smart Capture & AI Parsing (X1, X3, X6) ──
export async function parseTextExpense(text: string): Promise<ParsedTextExpense> {
  const { data } = await apiClient.post<{ success: boolean; parsedData: ParsedTextExpense }>(
    '/expenses/ai-parse-text',
    { text }
  );
  return data.parsedData;
}

export async function checkReceiptDuplicate(payload: {
  receiptBase64?: string;
  contentHash?: string;
  excludeClaimId?: string;
}): Promise<DuplicateReceiptCheckResult> {
  const { data } = await apiClient.post<DuplicateReceiptCheckResult>(
    '/expenses/receipts/check-hash',
    payload
  );
  return data;
}

// ── Mileage Engine (M6) ──
export async function getMileageRates(): Promise<MileageRate[]> {
  const { data } = await apiClient.get<{ success: boolean; rates: MileageRate[] }>(
    '/expenses/mileage-rates'
  );
  return data.rates;
}

export async function createMileageRate(payload: Partial<MileageRate>): Promise<MileageRate> {
  const { data } = await apiClient.post<{ success: boolean; rate: MileageRate }>(
    '/expenses/mileage-rates',
    payload
  );
  return data.rate;
}

export async function calculateMileage(payload: {
  vehicleType?: string;
  distance: number;
  unit?: string;
  date?: string;
}): Promise<MileageCalculationResult> {
  const { data } = await apiClient.post<{ success: boolean; calculation: MileageCalculationResult }>(
    '/expenses/mileage/calculate',
    payload
  );
  return data.calculation;
}

// ── Per-Diem Engine (M6) ──
export async function getPerDiemRates(): Promise<PerDiemRate[]> {
  const { data } = await apiClient.get<{ success: boolean; rates: PerDiemRate[] }>(
    '/expenses/per-diem-rates'
  );
  return data.rates;
}

export async function createPerDiemRate(payload: Partial<PerDiemRate>): Promise<PerDiemRate> {
  const { data } = await apiClient.post<{ success: boolean; rate: PerDiemRate }>(
    '/expenses/per-diem-rates',
    payload
  );
  return data.rate;
}

export async function calculatePerDiem(payload: {
  destination?: string;
  tier?: string;
  days: number;
  breakfastProvided?: boolean;
  lunchProvided?: boolean;
  dinnerProvided?: boolean;
}): Promise<PerDiemCalculationResult> {
  const { data } = await apiClient.post<{ success: boolean; calculation: PerDiemCalculationResult }>(
    '/expenses/per-diem/calculate',
    payload
  );
  return data.calculation;
}

// ── Tax Codes Engine (M5) ──
export async function getTaxCodes(): Promise<TaxCode[]> {
  const { data } = await apiClient.get<{ success: boolean; taxCodes: TaxCode[] }>(
    '/expenses/tax-codes'
  );
  return data.taxCodes;
}

export async function createTaxCode(payload: Partial<TaxCode>): Promise<TaxCode> {
  const { data } = await apiClient.post<{ success: boolean; taxCode: TaxCode }>(
    '/expenses/tax-codes',
    payload
  );
  return data.taxCode;
}

export async function deleteTaxCode(id: string): Promise<void> {
  await apiClient.delete(`/expenses/tax-codes/${id}`);
}

// ── FX Multi-Currency (M5) ──
export async function getFxRates(): Promise<FxRate[]> {
  const { data } = await apiClient.get<{ success: boolean; rates: FxRate[] }>(
    '/expenses/fx-rates'
  );
  return data.rates;
}

export async function createOrUpdateFxRate(payload: Partial<FxRate>): Promise<FxRate> {
  const { data } = await apiClient.post<{ success: boolean; fxRate: FxRate }>(
    '/expenses/fx-rates',
    payload
  );
  return data.fxRate;
}

export async function convertFxAmount(payload: {
  baseCurrency?: string;
  foreignCurrency: string;
  amount: number;
  date?: string;
}): Promise<FxConversionResult> {
  const { data } = await apiClient.post<{ success: boolean; conversion: FxConversionResult }>(
    '/expenses/fx/convert',
    payload
  );
  return data.conversion;
}

// ── Travel Requests (M2) ──
export async function getTravelRequests(params?: {
  status?: string;
  employeeId?: string;
  departmentId?: string;
  search?: string;
}): Promise<TravelRequest[]> {
  const { data } = await apiClient.get<{ success: boolean; travelRequests: TravelRequest[] }>(
    '/expenses/travel-requests',
    { params }
  );
  return data.travelRequests;
}

export async function getTravelRequest(id: string): Promise<TravelRequest> {
  const { data } = await apiClient.get<{ success: boolean; travelRequest: TravelRequest }>(
    `/expenses/travel-requests/${id}`
  );
  return data.travelRequest;
}

export async function createTravelRequest(
  payload: CreateTravelRequestPayload
): Promise<TravelRequest> {
  const { data } = await apiClient.post<{ success: boolean; travelRequest: TravelRequest }>(
    '/expenses/travel-requests',
    payload
  );
  return data.travelRequest;
}

export async function approveTravelRequest(
  id: string,
  comments?: string
): Promise<TravelRequest> {
  const { data } = await apiClient.post<{ success: boolean; travelRequest: TravelRequest }>(
    `/expenses/travel-requests/${id}/approve`,
    { comments }
  );
  return data.travelRequest;
}

export async function rejectTravelRequest(
  id: string,
  reason?: string
): Promise<TravelRequest> {
  const { data } = await apiClient.post<{ success: boolean; travelRequest: TravelRequest }>(
    `/expenses/travel-requests/${id}/reject`,
    { reason }
  );
  return data.travelRequest;
}

export async function deleteTravelRequest(id: string): Promise<void> {
  await apiClient.delete(`/expenses/travel-requests/${id}`);
}

// ── Cash Advances & Net-Settlement (M3) ──
export async function getCashAdvances(params?: {
  status?: string;
  employeeId?: string;
}): Promise<CashAdvance[]> {
  const { data } = await apiClient.get<{ success: boolean; cashAdvances: CashAdvance[] }>(
    '/expenses/cash-advances',
    { params }
  );
  return data.cashAdvances;
}

export async function getActiveAdvancesForEmployee(employeeId: string): Promise<CashAdvance[]> {
  const { data } = await apiClient.get<{ success: boolean; advances: CashAdvance[] }>(
    `/expenses/cash-advances/employee/${employeeId}/active`
  );
  return data.advances;
}

export async function getCashAdvance(id: string): Promise<CashAdvance> {
  const { data } = await apiClient.get<{ success: boolean; cashAdvance: CashAdvance }>(
    `/expenses/cash-advances/${id}`
  );
  return data.cashAdvance;
}

export async function createCashAdvance(payload: CreateCashAdvancePayload): Promise<CashAdvance> {
  const { data } = await apiClient.post<{ success: boolean; cashAdvance: CashAdvance }>(
    '/expenses/cash-advances',
    payload
  );
  return data.cashAdvance;
}

export async function approveCashAdvance(id: string, comments?: string): Promise<CashAdvance> {
  const { data } = await apiClient.post<{ success: boolean; cashAdvance: CashAdvance }>(
    `/expenses/cash-advances/${id}/approve`,
    { comments }
  );
  return data.cashAdvance;
}

export async function disburseCashAdvance(id: string, reference?: string): Promise<CashAdvance> {
  const { data } = await apiClient.post<{ success: boolean; cashAdvance: CashAdvance }>(
    `/expenses/cash-advances/${id}/disburse`,
    { reference }
  );
  return data.cashAdvance;
}

// ── Payment Batches & ERP Exports (M4) ──
export async function getPaymentBatches(status?: string): Promise<PaymentBatch[]> {
  const { data } = await apiClient.get<{ success: boolean; paymentBatches: PaymentBatch[] }>(
    '/expenses/payment-batches',
    { params: { status } }
  );
  return data.paymentBatches;
}

export async function getPaymentBatch(id: string): Promise<PaymentBatch> {
  const { data } = await apiClient.get<{ success: boolean; paymentBatch: PaymentBatch }>(
    `/expenses/payment-batches/${id}`
  );
  return data.paymentBatch;
}

export async function createPaymentBatch(
  payload: CreatePaymentBatchPayload
): Promise<PaymentBatch> {
  const { data } = await apiClient.post<{ success: boolean; paymentBatch: PaymentBatch }>(
    '/expenses/payment-batches',
    payload
  );
  return data.paymentBatch;
}

export async function executePaymentBatch(
  id: string,
  bankReference?: string
): Promise<PaymentBatch> {
  const { data } = await apiClient.post<{ success: boolean; paymentBatch: PaymentBatch }>(
    `/expenses/payment-batches/${id}/execute`,
    { bankReference }
  );
  return data.paymentBatch;
}

export async function downloadBankPaymentCsv(id: string): Promise<Blob> {
  const response = await apiClient.get(`/expenses/payment-batches/${id}/export/bank-file`, {
    responseType: 'blob',
  });
  return response.data;
}

export async function downloadGlJournalCsv(
  id: string,
  format: 'quickbooks' | 'netsuite' = 'quickbooks'
): Promise<Blob> {
  const response = await apiClient.get(`/expenses/payment-batches/${id}/export/gl-journal`, {
    params: { format },
    responseType: 'blob',
  });
  return response.data;
}

export async function exportBankPaymentCsv(id: string): Promise<void> {
  const blob = await downloadBankPaymentCsv(id);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bank_payment_batch_${id}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function exportGlJournalCsv(
  id: string,
  format: 'quickbooks' | 'netsuite' = 'quickbooks'
): Promise<void> {
  const blob = await downloadGlJournalCsv(id, format);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gl_journal_batch_${id}_${format}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ── Phase 4: Intelligence, Approver Assistant, Forecast & Copilot ──

export async function getApproverSummary(claimId: string): Promise<ApproverBrief> {
  const { data } = await apiClient.post<{ success: boolean; brief: ApproverBrief }>(
    `/expenses/claims/${claimId}/approver-summary`
  );
  return data.brief;
}

export async function getBudgetForecasts(fiscalYear?: number): Promise<BudgetForecast[]> {
  const { data } = await apiClient.get<{ success: boolean; forecasts: BudgetForecast[] }>(
    '/expenses/budgets/forecast',
    { params: { fiscalYear } }
  );
  return data.forecasts;
}

export async function querySpendCopilot(prompt: string): Promise<CopilotQueryResult> {
  const { data } = await apiClient.post<{
    success: boolean;
    answer: string;
    data?: any;
    suggestedFollowUps: string[];
    timestamp: string;
  }>('/expenses/copilot/query', { prompt });

  return {
    answer: data.answer,
    data: data.data,
    suggestedFollowUps: data.suggestedFollowUps,
    timestamp: data.timestamp,
  };
}

export async function getAuditPack(payload: {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
}): Promise<AuditPack> {
  const { data } = await apiClient.post<{ success: boolean; auditPack: AuditPack }>(
    '/expenses/audit-pack',
    payload
  );
  return data.auditPack;
}

export async function exportAuditPackCsv(payload: {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
}): Promise<void> {
  const response = await apiClient.post('/expenses/audit-pack/export-csv', payload, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nebula_audit_pack_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}



