const ExpenseClaim = require('../models/ExpenseClaim');
const ExpenseCategory = require('../models/ExpenseCategory');
const ExpenseActivity = require('../models/ExpenseActivity');
const Counter = require('../models/Counter');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const { ROLES } = require('../config/roles');
const { roundMoney, sumMoney } = require('../utils/money');
const { evaluateClaimPolicies } = require('../services/policyEngineService');
const { resolveWorkflowForClaim } = require('../services/approvalWorkflowService');
const { checkBudgetCompliance } = require('../services/budgetControlService');

/**
 * Generate sequential claim number: EXP-YYYY-XXXX (Atomic per organization)
 */
async function generateClaimNumber(organizationId) {
  const currentYear = new Date().getFullYear();
  const entityType = `expense_claim_${currentYear}`;

  const counter = await Counter.findOneAndUpdate(
    { organizationId, entityType },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `EXP-${currentYear}-${String(counter.seq).padStart(4, '0')}`;
}

/**
 * Get claims list with multi-role scoping and filters
 */
exports.getClaims = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { status, departmentId, employeeId, search, page = 1, limit = 50 } = req.query;

    const filter = { organizationId: orgId, deletedAt: null };

    // Role-based visibility scoping
    const isElevated = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE, ROLES.HR].includes(user.role);
    const isManager = user.role === ROLES.MANAGER;

    if (!isElevated) {
      if (isManager) {
        // Managers see their own claims + their department's claims
        const employeeRecord = await Employee.findOne({ userId: user._id, organizationId: orgId });
        const managerDeptId = employeeRecord?.departmentId;

        if (managerDeptId) {
          filter.$or = [
            { employeeId: user._id },
            { departmentId: managerDeptId },
          ];
        } else {
          filter.employeeId = user._id;
        }
      } else {
        // Employees, interns, sales, recruiters see only their own claims
        filter.employeeId = user._id;
      }
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (departmentId && departmentId !== 'all') {
      filter.departmentId = departmentId;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { claimNumber: searchRegex },
        { title: searchRegex },
        { 'items.merchant': searchRegex },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const totalCount = await ExpenseClaim.countDocuments(filter);

    const claims = await ExpenseClaim.find(filter)
      .populate('employeeId', 'fullName email role')
      .populate('departmentId', 'name')
      .populate('items.categoryId', 'name icon color glCode')
      .populate('managerApproval.approverId', 'fullName email')
      .populate('financeApproval.approverId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    return res.json({
      success: true,
      claims,
      pagination: {
        total: totalCount,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(totalCount / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.error('Error fetching expense claims:', error);
    return res.status(500).json({ error: 'Failed to fetch expense claims.' });
  }
};

/**
 * Get single claim by ID with full item details and audit timeline
 */
exports.getClaimById = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const claim = await ExpenseClaim.findOne({ _id: id, organizationId: orgId, deletedAt: null })
      .populate('employeeId', 'fullName email role designation')
      .populate('departmentId', 'name')
      .populate('projectId', 'name code clientName')
      .populate('costCenterId', 'name code')
      .populate('travelRequestId', 'requestNumber destination startDate endDate totalEstimated spentAmount')
      .populate('cashAdvanceId', 'advanceNumber amount remainingBalance status')
      .populate('paymentBatchId', 'batchNumber status paidAt')
      .populate('items.categoryId', 'name icon color glCode maxClaimLimit receiptThresholdAmount')
      .populate('managerApproval.approverId', 'fullName email')
      .populate('financeApproval.approverId', 'fullName email')
      .populate('rejection.rejectedById', 'fullName email')
      .populate('reimbursement.reimbursedById', 'fullName email')
      .lean();

    if (!claim) {
      return res.status(404).json({ error: 'Expense claim not found.' });
    }

    // Fetch timeline activities
    const activities = await ExpenseActivity.find({
      organizationId: orgId,
      claimId: id,
    })
      .populate('actorId', 'fullName email role')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      claim,
      activities,
    });
  } catch (error) {
    console.error('Error fetching claim details:', error);
    return res.status(500).json({ error: 'Failed to fetch claim details.' });
  }
};

/**
 * Create a new expense claim
 */
exports.createClaim = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const {
      title,
      departmentId,
      items = [],
      notes,
      currency = 'USD',
      projectId = null,
      costCenterId = null,
      travelRequestId = null,
      cashAdvanceId = null,
      violations: userViolations = [],
      submitNow = false,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Claim title is required.' });
    }

    // Resolve department
    let targetDeptId = departmentId;
    if (!targetDeptId) {
      const emp = await Employee.findOne({ userId: user._id, organizationId: orgId });
      if (emp?.departmentId) {
        targetDeptId = emp.departmentId;
      } else {
        const firstDept = await Department.findOne({ organizationId: orgId });
        if (!firstDept) {
          return res.status(400).json({ error: 'No department found. Please create a department first.' });
        }
        targetDeptId = firstDept._id;
      }
    }

    // Validate and compute totals
    let totalAmount = 0;
    let totalTaxAmount = 0;

    const validatedItems = items.map((it) => {
      const itemAmount = Math.max(0.01, parseFloat(it.amount) || 0);
      const tax = Math.max(0, parseFloat(it.taxAmount) || 0);
      totalAmount += itemAmount;
      totalTaxAmount += tax;

      return {
        categoryId: it.categoryId,
        expenseDate: it.expenseDate ? new Date(it.expenseDate) : new Date(),
        merchant: (it.merchant || 'General Merchant').trim(),
        description: (it.description || '').trim(),
        amount: itemAmount,
        taxAmount: tax,
        currency: it.currency || currency,
        baseAmount: itemAmount, // Normalized to base currency
        fxRate: 1,
        receiptUrl: it.receiptUrl || '',
        receiptFileName: it.receiptFileName || '',
        receiptHash: it.receiptHash || '',
        expenseType: it.expenseType || 'receipt',
        mileageDetails: it.mileageDetails || undefined,
        perDiemDetails: it.perDiemDetails || undefined,
        taxCodeId: it.taxCodeId || null,
        lineStatus: 'pending',
        isBillableToClient: Boolean(it.isBillableToClient),
        clientName: it.clientName ? it.clientName.trim() : '',
        allocations: it.allocations || [],
      };
    });

    // ── Cash Advance Net-Settlement Calculation (M3) ──
    let advanceDeductedAmount = 0;
    let netReimbursableAmount = roundMoney(totalAmount, currency);

    if (cashAdvanceId) {
      const CashAdvance = require('../models/CashAdvance');
      const advance = await CashAdvance.findOne({
        _id: cashAdvanceId,
        organizationId: orgId,
        employeeId: user._id,
        deletedAt: null,
      });

      if (advance && advance.remainingBalance > 0) {
        const { calculateNetPaySettlement } = require('../services/cashAdvanceService');
        const settlement = calculateNetPaySettlement(totalAmount, advance.remainingBalance);
        advanceDeductedAmount = settlement.advanceDeduction;
        netReimbursableAmount = settlement.netReimbursement;
      }
    }

    // ── Phase 1: Policy Engine & Budget Enforcement ──
    let activeViolations = [];
    let approvalRoute = [];
    let initialStatus = submitNow ? 'submitted' : 'draft';

    if (submitNow) {
      // 1. Evaluate policies
      const policyResult = await evaluateClaimPolicies({
        organizationId: orgId,
        departmentId: targetDeptId,
        items: validatedItems,
      });

      if (policyResult.hasBlocks) {
        return res.status(400).json({
          error: 'Claim blocked by organization expense policy.',
          violations: policyResult.violations,
        });
      }

      activeViolations = policyResult.violations.map((v) => {
        const found = userViolations.find((uv) => uv.policyId?.toString() === v.policyId?.toString());
        return {
          ...v,
          userJustification: found?.userJustification || '',
        };
      });

      // 2. Evaluate budget compliance
      const budgetCheck = await checkBudgetCompliance({
        organizationId: orgId,
        departmentId: targetDeptId,
        projectId,
        costCenterId,
        claimAmount: totalAmount,
      });

      if (!budgetCheck.allowed) {
        return res.status(400).json({
          error: budgetCheck.message || 'Claim exceeds department budget allocation limit.',
        });
      }

      // 3. Resolve approval workflow
      const workflow = await resolveWorkflowForClaim({
        organizationId: orgId,
        totalAmount,
        departmentId: targetDeptId,
        projectId,
      });

      approvalRoute = (workflow.steps || []).map((s) => ({
        stepOrder: s.stepOrder,
        approverType: s.approverType,
        approverId: s.specificUserId || null,
        status: 'pending',
      }));

      // Check auto-approve condition
      if (workflow.autoApproveBelow > 0 && totalAmount <= workflow.autoApproveBelow && !activeViolations.length) {
        initialStatus = 'approved';
      }
    }

    const claimNumber = await generateClaimNumber(orgId);

    const claim = await ExpenseClaim.create({
      organizationId: orgId,
      claimNumber,
      employeeId: user._id,
      departmentId: targetDeptId,
      projectId: projectId || null,
      costCenterId: costCenterId || null,
      travelRequestId: travelRequestId || null,
      cashAdvanceId: cashAdvanceId || null,
      advanceDeductedAmount,
      netReimbursableAmount,
      title: title.trim(),
      items: validatedItems,
      totalAmount: roundMoney(totalAmount, currency),
      totalTaxAmount: roundMoney(totalTaxAmount, currency),
      currency: currency.toUpperCase(),
      baseCurrency: currency.toUpperCase(),
      totalBase: roundMoney(totalAmount, currency),
      status: initialStatus,
      approvalRoute,
      violations: activeViolations,
      notes: notes ? notes.trim() : '',
      submittedAt: submitNow ? new Date() : null,
    });

    // Update Travel Request spentAmount if linked
    if (travelRequestId) {
      const { recordActualSpend } = require('../services/travelRequestService');
      await recordActualSpend(travelRequestId, claim.totalAmount).catch(() => {});
    }

    // Record activity
    await ExpenseActivity.create({
      organizationId: orgId,
      claimId: claim._id,
      actorId: user._id,
      action: initialStatus === 'approved' ? 'finance_approved' : submitNow ? 'submitted' : 'created',
      comment: initialStatus === 'approved'
        ? 'Claim auto-approved below threshold'
        : submitNow
        ? 'Claim submitted for review'
        : 'Claim draft created',
      details: { totalAmount: claim.totalAmount, itemCount: claim.items.length },
    });

    const { sendExpenseNotification, EVENT_TYPES } = require('../services/expenseNotificationService');
    if (submitNow) {
      sendExpenseNotification({
        organizationId: orgId,
        eventType: EVENT_TYPES.CLAIM_SUBMITTED,
        title: `Claim Submitted (${claim.claimNumber})`,
        message: `${user.fullName || 'Employee'} submitted expense claim ${claim.claimNumber} for ${claim.currency} ${claim.totalAmount.toFixed(2)}.`,
        claimId: claim._id,
        actorId: user._id,
        metadata: { totalAmount: claim.totalAmount, currency: claim.currency },
      }).catch(() => {});
    }

    const populated = await ExpenseClaim.findById(claim._id)
      .populate('employeeId', 'fullName email')
      .populate('departmentId', 'name')
      .populate('items.categoryId', 'name icon color');

    return res.status(201).json({ success: true, claim: populated });
  } catch (error) {
    console.error('Error creating expense claim:', error);
    return res.status(500).json({ error: error.message || 'Failed to create expense claim.' });
  }
};

/**
 * Update draft or rejected claim
 */
exports.updateClaim = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { id } = req.params;
    const { title, departmentId, items, notes, currency } = req.body;

    const claim = await ExpenseClaim.findOne({ _id: id, organizationId: orgId });
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    if (!['draft', 'rejected'].includes(claim.status)) {
      return res.status(400).json({ error: `Cannot edit claim in "${claim.status}" status.` });
    }

    // Only owner or admin can edit
    const isOwner = claim.employeeId.toString() === user._id.toString();
    const isAdmin = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to edit this claim.' });
    }

    if (title) claim.title = title.trim();
    if (departmentId) claim.departmentId = departmentId;
    if (notes !== undefined) claim.notes = notes.trim();
    if (currency) claim.currency = currency.toUpperCase();

    if (items && Array.isArray(items)) {
      let total = 0;
      let totalTax = 0;

      claim.items = items.map((it) => {
        const itemAmount = Math.max(0.01, parseFloat(it.amount) || 0);
        const tax = Math.max(0, parseFloat(it.taxAmount) || 0);
        total += itemAmount;
        totalTax += tax;

        return {
          categoryId: it.categoryId,
          expenseDate: it.expenseDate ? new Date(it.expenseDate) : new Date(),
          merchant: (it.merchant || 'General Merchant').trim(),
          description: (it.description || '').trim(),
          amount: itemAmount,
          taxAmount: tax,
          currency: it.currency || claim.currency,
          receiptUrl: it.receiptUrl || '',
          receiptFileName: it.receiptFileName || '',
          receiptHash: it.receiptHash || '',
          expenseType: it.expenseType || 'receipt',
          mileageDetails: it.mileageDetails || undefined,
          perDiemDetails: it.perDiemDetails || undefined,
          taxCodeId: it.taxCodeId || null,
          isBillableToClient: Boolean(it.isBillableToClient),
          clientName: it.clientName ? it.clientName.trim() : '',
        };
      });

      claim.totalAmount = Math.round(total * 100) / 100;
      claim.totalTaxAmount = Math.round(totalTax * 100) / 100;
    }

    await claim.save();

    await ExpenseActivity.create({
      organizationId: orgId,
      claimId: claim._id,
      actorId: user._id,
      action: 'item_updated',
      comment: 'Claim details updated',
      details: { totalAmount: claim.totalAmount },
    });

    const updated = await ExpenseClaim.findById(claim._id)
      .populate('employeeId', 'fullName email')
      .populate('departmentId', 'name')
      .populate('items.categoryId', 'name icon color');

    return res.json({ success: true, claim: updated });
  } catch (error) {
    console.error('Error updating claim:', error);
    return res.status(500).json({ error: error.message || 'Failed to update claim.' });
  }
};

/**
 * Submit claim for approval
 */
exports.submitClaim = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { id } = req.params;
    const { violations: userViolations = [] } = req.body || {};

    const claim = await ExpenseClaim.findOne({ _id: id, organizationId: orgId, deletedAt: null });
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    if (!['draft', 'rejected', 'sent_back'].includes(claim.status)) {
      return res.status(400).json({ error: `Claim is already in "${claim.status}" state.` });
    }

    if (claim.items.length === 0) {
      return res.status(400).json({ error: 'Cannot submit a claim with no expense items.' });
    }

    // 1. Evaluate policies
    const policyResult = await evaluateClaimPolicies({
      organizationId: orgId,
      departmentId: claim.departmentId,
      items: claim.items,
    });

    if (policyResult.hasBlocks) {
      return res.status(400).json({
        error: 'Claim blocked by organization expense policy.',
        violations: policyResult.violations,
      });
    }

    const activeViolations = policyResult.violations.map((v) => {
      const found = userViolations.find((uv) => uv.policyId?.toString() === v.policyId?.toString());
      return {
        ...v,
        userJustification: found?.userJustification || '',
      };
    });

    // 2. Evaluate budget compliance
    const budgetCheck = await checkBudgetCompliance({
      organizationId: orgId,
      departmentId: claim.departmentId,
      projectId: claim.projectId,
      costCenterId: claim.costCenterId,
      claimAmount: claim.totalAmount,
    });

    if (!budgetCheck.allowed) {
      return res.status(400).json({
        error: budgetCheck.message || 'Claim exceeds department budget allocation limit.',
      });
    }

    // 3. Resolve approval workflow
    const workflow = await resolveWorkflowForClaim({
      organizationId: orgId,
      totalAmount: claim.totalAmount,
      departmentId: claim.departmentId,
      projectId: claim.projectId,
    });

    const approvalRoute = (workflow.steps || []).map((s) => ({
      stepOrder: s.stepOrder,
      approverType: s.approverType,
      approverId: s.specificUserId || null,
      status: 'pending',
    }));

    let targetStatus = 'submitted';
    if (workflow.autoApproveBelow > 0 && claim.totalAmount <= workflow.autoApproveBelow && !activeViolations.length) {
      targetStatus = 'approved';
    }

    claim.status = targetStatus;
    claim.submittedAt = new Date();
    claim.violations = activeViolations;
    claim.approvalRoute = approvalRoute;
    claim.currentStepIndex = 0;
    await claim.save();

    await ExpenseActivity.create({
      organizationId: orgId,
      claimId: claim._id,
      actorId: user._id,
      action: targetStatus === 'approved' ? 'finance_approved' : 'submitted',
      comment: targetStatus === 'approved' ? 'Claim auto-approved below threshold' : 'Claim submitted for review',
    });

    const { sendExpenseNotification, EVENT_TYPES } = require('../services/expenseNotificationService');
    sendExpenseNotification({
      organizationId: orgId,
      eventType: EVENT_TYPES.CLAIM_SUBMITTED,
      title: `Claim Submitted (${claim.claimNumber})`,
      message: `${user.fullName || 'Employee'} submitted expense claim ${claim.claimNumber} for ${claim.currency} ${claim.totalAmount.toFixed(2)}.`,
      claimId: claim._id,
      actorId: user._id,
      metadata: { totalAmount: claim.totalAmount, currency: claim.currency },
    }).catch(() => {});

    const populated = await ExpenseClaim.findById(claim._id)
      .populate('employeeId', 'fullName email')
      .populate('departmentId', 'name')
      .populate('items.categoryId', 'name icon color');

    return res.json({ success: true, claim: populated });
  } catch (error) {
    console.error('Error submitting claim:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit claim.' });
  }
};

/**
 * Cancel claim
 */
exports.cancelClaim = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { id } = req.params;

    const claim = await ExpenseClaim.findOne({ _id: id, organizationId: orgId });
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    if (!['submitted', 'manager_approved', 'draft'].includes(claim.status)) {
      return res.status(400).json({ error: `Cannot cancel claim with status "${claim.status}".` });
    }

    claim.status = 'cancelled';
    await claim.save();

    await ExpenseActivity.create({
      organizationId: orgId,
      claimId: claim._id,
      actorId: user._id,
      action: 'cancelled',
      comment: 'Claim cancelled by submitter',
    });

    return res.json({ success: true, message: 'Claim cancelled.', claim });
  } catch (error) {
    console.error('Error cancelling claim:', error);
    return res.status(500).json({ error: 'Failed to cancel claim.' });
  }
};

/**
 * Delete draft claim
 */
exports.deleteClaim = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { id } = req.params;

    const claim = await ExpenseClaim.findOne({ _id: id, organizationId: orgId, deletedAt: null });
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    if (claim.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft claims can be deleted.' });
    }

    // Soft delete: stamp deletedAt, retain claim and all activity records for audit integrity
    claim.deletedAt = new Date();
    claim.status = 'cancelled';
    await claim.save();

    await ExpenseActivity.create({
      organizationId: orgId,
      claimId: id,
      actorId: user._id,
      action: 'cancelled',
      comment: 'Draft claim soft-deleted by user',
    });

    return res.json({ success: true, message: 'Draft claim deleted successfully.' });
  } catch (error) {
    console.error('Error deleting draft claim:', error);
    return res.status(500).json({ error: 'Failed to delete claim.' });
  }
};
