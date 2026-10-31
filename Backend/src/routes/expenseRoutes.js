const express = require('express');
const router = express.Router();

const expenseClaimController = require('../controllers/expenseClaimController');
const expenseApprovalController = require('../controllers/expenseApprovalController');
const expenseBudgetController = require('../controllers/expenseBudgetController');
const expenseCategoryController = require('../controllers/expenseCategoryController');
const expenseSummaryController = require('../controllers/expenseSummaryController');
const expenseReimbursementController = require('../controllers/expenseReimbursementController');
const expenseAiScanController = require('../controllers/expenseAiScanController');
const expensePolicyController = require('../controllers/expensePolicyController');
const expenseWorkflowController = require('../controllers/expenseWorkflowController');
const expenseSpecialSpendController = require('../controllers/expenseSpecialSpendController');
const expenseFxController = require('../controllers/expenseFxController');
const expenseTravelRequestController = require('../controllers/expenseTravelRequestController');
const expenseCashAdvanceController = require('../controllers/expenseCashAdvanceController');
const expensePaymentBatchController = require('../controllers/expensePaymentBatchController');
const expenseIntelligenceController = require('../controllers/expenseIntelligenceController');
const expenseNotificationController = require('../controllers/expenseNotificationController');
const { aiScanRateLimiter, copilotRateLimiter, paymentExecutionRateLimiter } = require('../middleware/expenseRateLimiter');

const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../middleware/moduleAccess');

// All expense routes require an authenticated user
router.use(requireAuth);

// ── Summary & Analytics ──
router.get('/summary', requireModuleAccess('expenses', 'view'), expenseSummaryController.getExpenseSummary);

// ── Export Claims (CSV) ──
router.get('/export', requireModuleAccess('expenses', 'view'), expenseReimbursementController.exportClaims);

// ── AI Receipt Scanner & Text Parser (X1, X3, X6 with Rate Limiting) ──
router.post('/ai-scan-receipt', aiScanRateLimiter, requireModuleAccess('expenses', 'create'), expenseAiScanController.scanReceipt);
router.post('/ai-parse-text', aiScanRateLimiter, requireModuleAccess('expenses', 'create'), expenseAiScanController.parseTextExpense);
router.post('/receipts/check-hash', requireModuleAccess('expenses', 'create'), expenseAiScanController.checkReceiptDuplicate);

// ── Approval Queue & Actions ──
router.get('/approvals/queue', requireModuleAccess('expenses', 'approve'), expenseApprovalController.getApprovalQueue);
router.post('/claims/:id/approve', requireModuleAccess('expenses', 'approve'), expenseApprovalController.approveClaim);
router.post('/claims/:id/reject', requireModuleAccess('expenses', 'approve'), expenseApprovalController.rejectClaim);
router.post('/claims/:id/send-back', requireModuleAccess('expenses', 'approve'), expenseApprovalController.sendBack);
router.post('/claims/:id/line-decision', requireModuleAccess('expenses', 'approve'), expenseApprovalController.lineDecision);
router.post('/claims/:id/reimburse', requireModuleAccess('expenses', 'approve'), expenseReimbursementController.reimburseClaim);

// ── Expense Claims Lifecycle ──
router.get('/claims', requireModuleAccess('expenses', 'view'), expenseClaimController.getClaims);
router.post('/claims', requireModuleAccess('expenses', 'create'), expenseClaimController.createClaim);
router.get('/claims/:id', requireModuleAccess('expenses', 'view'), expenseClaimController.getClaimById);
router.patch('/claims/:id', requireModuleAccess('expenses', 'edit'), expenseClaimController.updateClaim);
router.delete('/claims/:id', requireModuleAccess('expenses', 'delete'), expenseClaimController.deleteClaim);
router.post('/claims/:id/submit', requireModuleAccess('expenses', 'create'), expenseClaimController.submitClaim);
router.post('/claims/:id/cancel', requireModuleAccess('expenses', 'view'), expenseClaimController.cancelClaim);

// ── Policies Engine ──
router.post('/policies/check', requireModuleAccess('expenses', 'create'), expensePolicyController.checkPolicy);
router.get('/policies', requireModuleAccess('expenses', 'view'), expensePolicyController.getPolicies);
router.post('/policies', requireModuleAccess('expenses', 'create'), expensePolicyController.createPolicy);
router.patch('/policies/:id', requireModuleAccess('expenses', 'edit'), expensePolicyController.updatePolicy);
router.delete('/policies/:id', requireModuleAccess('expenses', 'delete'), expensePolicyController.deletePolicy);

// ── Workflows & Approval Matrix ──
router.get('/workflows', requireModuleAccess('expenses', 'view'), expenseWorkflowController.getWorkflows);
router.post('/workflows', requireModuleAccess('expenses', 'create'), expenseWorkflowController.createWorkflow);
router.patch('/workflows/:id', requireModuleAccess('expenses', 'edit'), expenseWorkflowController.updateWorkflow);

// ── Delegations (Out-of-office) ──
router.get('/delegations', requireModuleAccess('expenses', 'view'), expenseWorkflowController.getDelegations);
router.post('/delegations', requireModuleAccess('expenses', 'create'), expenseWorkflowController.createDelegation);
router.delete('/delegations/:id', requireModuleAccess('expenses', 'delete'), expenseWorkflowController.deleteDelegation);

// ── Cost Centers & Billable Projects ──
router.get('/cost-centers', requireModuleAccess('expenses', 'view'), expenseWorkflowController.getCostCenters);
router.get('/projects', requireModuleAccess('expenses', 'view'), expenseWorkflowController.getProjects);

// ── Mileage & Per-Diem Special Spends ──
router.get('/mileage-rates', requireModuleAccess('expenses', 'view'), expenseSpecialSpendController.getMileageRates);
router.post('/mileage-rates', requireModuleAccess('expenses', 'create'), expenseSpecialSpendController.createMileageRate);
router.post('/mileage/calculate', requireModuleAccess('expenses', 'view'), expenseSpecialSpendController.calculateMileageAmount);

router.get('/per-diem-rates', requireModuleAccess('expenses', 'view'), expenseSpecialSpendController.getPerDiemRates);
router.post('/per-diem-rates', requireModuleAccess('expenses', 'create'), expenseSpecialSpendController.createPerDiemRate);
router.post('/per-diem/calculate', requireModuleAccess('expenses', 'view'), expenseSpecialSpendController.calculatePerDiemAmount);

// ── Tax Codes ──
router.get('/tax-codes', requireModuleAccess('expenses', 'view'), expenseSpecialSpendController.getTaxCodes);
router.post('/tax-codes', requireModuleAccess('expenses', 'create'), expenseSpecialSpendController.createTaxCode);
router.delete('/tax-codes/:id', requireModuleAccess('expenses', 'delete'), expenseSpecialSpendController.deleteTaxCode);

// ── Multi-Currency FX Rates ──
router.get('/fx-rates', requireModuleAccess('expenses', 'view'), expenseFxController.getFxRates);
router.post('/fx-rates', requireModuleAccess('expenses', 'create'), expenseFxController.createOrUpdateFxRate);
router.post('/fx/convert', requireModuleAccess('expenses', 'view'), expenseFxController.convertAmount);

// ── Categories ──
router.get('/categories', requireModuleAccess('expenses', 'view'), expenseCategoryController.getCategories);
router.post('/categories', requireModuleAccess('expenses', 'create'), expenseCategoryController.createCategory);
router.patch('/categories/:id', requireModuleAccess('expenses', 'edit'), expenseCategoryController.updateCategory);
router.delete('/categories/:id', requireModuleAccess('expenses', 'delete'), expenseCategoryController.deleteCategory);

// ── Department Budgets ──
router.get('/budgets', requireModuleAccess('expenses', 'view'), expenseBudgetController.getBudgets);
router.post('/budgets', requireModuleAccess('expenses', 'create'), expenseBudgetController.createOrUpdateBudget);
router.delete('/budgets/:id', requireModuleAccess('expenses', 'delete'), expenseBudgetController.deleteBudget);

// ── Travel Requests (Pre-trip Authorizations) (M2) ──
router.get('/travel-requests', requireModuleAccess('expenses', 'view'), expenseTravelRequestController.getTravelRequests);
router.post('/travel-requests', requireModuleAccess('expenses', 'create'), expenseTravelRequestController.createTravelRequest);
router.get('/travel-requests/:id', requireModuleAccess('expenses', 'view'), expenseTravelRequestController.getTravelRequestById);
router.post('/travel-requests/:id/approve', requireModuleAccess('expenses', 'approve'), expenseTravelRequestController.approveTravelRequest);
router.post('/travel-requests/:id/reject', requireModuleAccess('expenses', 'approve'), expenseTravelRequestController.rejectTravelRequest);
router.delete('/travel-requests/:id', requireModuleAccess('expenses', 'delete'), expenseTravelRequestController.deleteTravelRequest);

// ── Cash Advances & Net-Settlement (M3) ──
router.get('/cash-advances', requireModuleAccess('expenses', 'view'), expenseCashAdvanceController.getCashAdvances);
router.post('/cash-advances', requireModuleAccess('expenses', 'create'), expenseCashAdvanceController.createCashAdvance);
router.get('/cash-advances/employee/:employeeId/active', requireModuleAccess('expenses', 'view'), expenseCashAdvanceController.getActiveAdvancesForEmployee);
router.get('/cash-advances/:id', requireModuleAccess('expenses', 'view'), expenseCashAdvanceController.getCashAdvanceById);
router.post('/cash-advances/:id/approve', requireModuleAccess('expenses', 'approve'), expenseCashAdvanceController.approveCashAdvance);
router.post('/cash-advances/:id/disburse', requireModuleAccess('expenses', 'approve'), expenseCashAdvanceController.disburseCashAdvance);

// ── Payment Batches & ERP Exports (M4) ──
router.get('/payment-batches', requireModuleAccess('expenses', 'view'), expensePaymentBatchController.getPaymentBatches);
router.post('/payment-batches', requireModuleAccess('expenses', 'create'), expensePaymentBatchController.createPaymentBatch);
router.get('/payment-batches/:id', requireModuleAccess('expenses', 'view'), expensePaymentBatchController.getPaymentBatchById);
router.post('/payment-batches/:id/execute', paymentExecutionRateLimiter, requireModuleAccess('expenses', 'approve'), expensePaymentBatchController.executePaymentBatch);
router.get('/payment-batches/:id/export/bank-file', requireModuleAccess('expenses', 'view'), expensePaymentBatchController.exportBankPaymentFile);
router.get('/payment-batches/:id/export/gl-journal', requireModuleAccess('expenses', 'view'), expensePaymentBatchController.exportGlJournalFile);

// ── Phase 4: Intelligence, Anomaly Detection, Copilot & Audit Packs ──
router.post('/claims/:id/risk-analysis', requireModuleAccess('expenses', 'view'), expenseIntelligenceController.analyzeClaimAnomalies);
router.post('/claims/:id/approver-summary', requireModuleAccess('expenses', 'view'), expenseIntelligenceController.getApproverSummary);
router.get('/budgets/forecast', requireModuleAccess('expenses', 'view'), expenseIntelligenceController.getBudgetForecasts);
router.post('/copilot/query', copilotRateLimiter, requireModuleAccess('expenses', 'view'), expenseIntelligenceController.queryCopilot);
router.post('/audit-pack', requireModuleAccess('expenses', 'view'), expenseIntelligenceController.getAuditPack);
router.post('/audit-pack/export-csv', requireModuleAccess('expenses', 'view'), expenseIntelligenceController.exportAuditPackCsv);

// ── Phase 5: Notifications & Webhook Event Integrations ──
router.get('/notifications', requireModuleAccess('expenses', 'view'), expenseNotificationController.getNotifications);
router.post('/webhooks', requireModuleAccess('expenses', 'create'), expenseNotificationController.createWebhook);
router.get('/webhooks/events', requireModuleAccess('expenses', 'view'), expenseNotificationController.getAvailableEvents);

module.exports = router;



