const ExpenseClaim = require('../models/ExpenseClaim');
const ExpenseCategory = require('../models/ExpenseCategory');
const ExpenseActivity = require('../models/ExpenseActivity');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const { ROLES } = require('../config/roles');

/**
 * Generate sequential claim number: EXP-YYYY-XXXX
 */
async function generateClaimNumber(organizationId) {
  const currentYear = new Date().getFullYear();
  const prefix = `EXP-${currentYear}-`;

  const lastClaim = await ExpenseClaim.findOne({
    organizationId,
    claimNumber: new RegExp(`^${prefix}`),
  })
    .sort({ claimNumber: -1 })
    .lean();

  let nextSequence = 1;
  if (lastClaim && lastClaim.claimNumber) {
    const parts = lastClaim.claimNumber.split('-');
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  return `${prefix}${String(nextSequence).padStart(4, '0')}`;
}

/**
 * Get claims list with multi-role scoping and filters
 */
exports.getClaims = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { status, departmentId, employeeId, search, page = 1, limit = 50 } = req.query;

    const filter = { organizationId: orgId };

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

    const claim = await ExpenseClaim.findOne({ _id: id, organizationId: orgId })
      .populate('employeeId', 'fullName email role designation')
      .populate('departmentId', 'name')
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
    const { title, departmentId, items = [], notes, currency = 'USD', submitNow = false } = req.body;

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
        receiptUrl: it.receiptUrl || '',
        receiptFileName: it.receiptFileName || '',
        isBillableToClient: Boolean(it.isBillableToClient),
        clientName: it.clientName ? it.clientName.trim() : '',
      };
    });

    const claimNumber = await generateClaimNumber(orgId);
    const initialStatus = submitNow ? 'submitted' : 'draft';

    const claim = await ExpenseClaim.create({
      organizationId: orgId,
      claimNumber,
      employeeId: user._id,
      departmentId: targetDeptId,
      title: title.trim(),
      items: validatedItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
      currency: currency.toUpperCase(),
      status: initialStatus,
      notes: notes ? notes.trim() : '',
      submittedAt: submitNow ? new Date() : null,
    });

    // Record activity
    await ExpenseActivity.create({
      organizationId: orgId,
      claimId: claim._id,
      actorId: user._id,
      action: submitNow ? 'submitted' : 'created',
      comment: submitNow ? 'Claim submitted for manager review' : 'Claim draft created',
      details: { totalAmount: claim.totalAmount, itemCount: claim.items.length },
    });

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

    const claim = await ExpenseClaim.findOne({ _id: id, organizationId: orgId });
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    if (!['draft', 'rejected'].includes(claim.status)) {
      return res.status(400).json({ error: `Claim is already in "${claim.status}" state.` });
    }

    if (claim.items.length === 0) {
      return res.status(400).json({ error: 'Cannot submit a claim with no expense items.' });
    }

    claim.status = 'submitted';
    claim.submittedAt = new Date();
    await claim.save();

    await ExpenseActivity.create({
      organizationId: orgId,
      claimId: claim._id,
      actorId: user._id,
      action: 'submitted',
      comment: 'Claim submitted for manager review',
    });

    return res.json({ success: true, message: 'Claim submitted successfully.', claim });
  } catch (error) {
    console.error('Error submitting claim:', error);
    return res.status(500).json({ error: 'Failed to submit claim.' });
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

    const claim = await ExpenseClaim.findOne({ _id: id, organizationId: orgId });
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    if (claim.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft claims can be deleted.' });
    }

    await ExpenseClaim.deleteOne({ _id: id });
    await ExpenseActivity.deleteMany({ claimId: id, organizationId: orgId });

    return res.json({ success: true, message: 'Draft claim deleted successfully.' });
  } catch (error) {
    console.error('Error deleting draft claim:', error);
    return res.status(500).json({ error: 'Failed to delete claim.' });
  }
};
