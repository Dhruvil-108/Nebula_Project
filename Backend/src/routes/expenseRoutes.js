const express = require('express');
const router = express.Router();

const expenseClaimController = require('../controllers/expenseClaimController');
const expenseApprovalController = require('../controllers/expenseApprovalController');
const expenseBudgetController = require('../controllers/expenseBudgetController');
const expenseCategoryController = require('../controllers/expenseCategoryController');
const expenseSummaryController = require('../controllers/expenseSummaryController');
const expenseReimbursementController = require('../controllers/expenseReimbursementController');
const expenseAiScanController = require('../controllers/expenseAiScanController');

const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../middleware/moduleAccess');

// All expense routes require an authenticated user
router.use(requireAuth);

// ── Summary & Analytics ──
router.get('/summary', requireModuleAccess('expenses', 'view'), expenseSummaryController.getExpenseSummary);

// ── Export Claims (CSV) ──
router.get('/export', requireModuleAccess('expenses', 'view'), expenseReimbursementController.exportClaims);

// ── AI Receipt Scanner ──
router.post('/ai-scan-receipt', requireModuleAccess('expenses', 'create'), expenseAiScanController.scanReceipt);

// ── Approval Queue & Actions ──
router.get('/approvals/queue', requireModuleAccess('expenses', 'approve'), expenseApprovalController.getApprovalQueue);
router.post('/claims/:id/approve', requireModuleAccess('expenses', 'approve'), expenseApprovalController.approveClaim);
router.post('/claims/:id/reject', requireModuleAccess('expenses', 'approve'), expenseApprovalController.rejectClaim);
router.post('/claims/:id/reimburse', requireModuleAccess('expenses', 'approve'), expenseReimbursementController.reimburseClaim);

// ── Expense Claims Lifecycle ──
router.get('/claims', requireModuleAccess('expenses', 'view'), expenseClaimController.getClaims);
router.post('/claims', requireModuleAccess('expenses', 'create'), expenseClaimController.createClaim);
router.get('/claims/:id', requireModuleAccess('expenses', 'view'), expenseClaimController.getClaimById);
router.patch('/claims/:id', requireModuleAccess('expenses', 'edit'), expenseClaimController.updateClaim);
router.delete('/claims/:id', requireModuleAccess('expenses', 'delete'), expenseClaimController.deleteClaim);
router.post('/claims/:id/submit', requireModuleAccess('expenses', 'create'), expenseClaimController.submitClaim);
router.post('/claims/:id/cancel', requireModuleAccess('expenses', 'view'), expenseClaimController.cancelClaim);

// ── Categories & Policies ──
router.get('/categories', requireModuleAccess('expenses', 'view'), expenseCategoryController.getCategories);
router.post('/categories', requireModuleAccess('expenses', 'create'), expenseCategoryController.createCategory);
router.patch('/categories/:id', requireModuleAccess('expenses', 'edit'), expenseCategoryController.updateCategory);
router.delete('/categories/:id', requireModuleAccess('expenses', 'delete'), expenseCategoryController.deleteCategory);

// ── Department Budgets ──
router.get('/budgets', requireModuleAccess('expenses', 'view'), expenseBudgetController.getBudgets);
router.post('/budgets', requireModuleAccess('expenses', 'create'), expenseBudgetController.createOrUpdateBudget);
router.delete('/budgets/:id', requireModuleAccess('expenses', 'delete'), expenseBudgetController.deleteBudget);

module.exports = router;
