const ExpenseClaim = require('../models/ExpenseClaim');
const ExpenseActivity = require('../models/ExpenseActivity');
const Employee = require('../models/Employee');
const { ROLES } = require('../config/roles');

/**
 * Get pending approvals queue based on reviewer role
 */
exports.getApprovalQueue = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { stage = 'all' } = req.query;

    const filter = { organizationId: orgId };

    const isFinanceOrAdmin = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE].includes(user.role);
    const isManager = user.role === ROLES.MANAGER;

    if (isFinanceOrAdmin) {
      if (stage === 'finance') {
        filter.status = 'manager_approved';
      } else if (stage === 'submitted') {
        filter.status = 'submitted';
      } else {
        filter.status = { $in: ['submitted', 'manager_approved'] };
      }
    } else if (isManager) {
      // Find manager's department
      const employee = await Employee.findOne({ userId: user._id, organizationId: orgId });
      const deptId = employee?.departmentId;

      filter.status = 'submitted';
      if (deptId) {
        filter.departmentId = deptId;
      }
      // Cannot approve own claim
      filter.employeeId = { $ne: user._id };
    } else {
      return res.status(403).json({ error: 'You do not have approval privileges.' });
    }

    const queue = await ExpenseClaim.find(filter)
      .populate('employeeId', 'fullName email role')
      .populate('departmentId', 'name')
      .populate('items.categoryId', 'name icon color glCode')
      .populate('managerApproval.approverId', 'fullName email')
      .sort({ createdAt: 1 }) // FIFO queue
      .lean();

    return res.json({ success: true, count: queue.length, claims: queue });
  } catch (error) {
    console.error('Error fetching approval queue:', error);
    return res.status(500).json({ error: 'Failed to fetch approval queue.' });
  }
};

/**
 * Approve claim (Manager tier or Finance tier)
 */
exports.approveClaim = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { id } = req.params;
    const { comments = '' } = req.body;

    const claim = await ExpenseClaim.findOne({ _id: id, organizationId: orgId });
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    const isFinanceOrAdmin = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE].includes(user.role);
    const isManager = user.role === ROLES.MANAGER;

    if (claim.status === 'submitted') {
      if (isFinanceOrAdmin) {
        // Finance can do 1-step direct approval or complete both tiers
        claim.status = 'approved';
        claim.managerApproval = {
          approverId: user._id,
          approvedAt: new Date(),
          comments: comments || 'Direct Finance Approval',
        };
        claim.financeApproval = {
          approverId: user._id,
          approvedAt: new Date(),
          comments: comments || 'Finance Final Approval',
        };

        await ExpenseActivity.create({
          organizationId: orgId,
          claimId: claim._id,
          actorId: user._id,
          action: 'finance_approved',
          comment: comments || 'Directly approved by Finance/Admin',
          details: { totalAmount: claim.totalAmount },
        });
      } else if (isManager) {
        // Line Manager Approval moves it to manager_approved
        claim.status = 'manager_approved';
        claim.managerApproval = {
          approverId: user._id,
          approvedAt: new Date(),
          comments: comments || 'Manager Approval Granted',
        };

        await ExpenseActivity.create({
          organizationId: orgId,
          claimId: claim._id,
          actorId: user._id,
          action: 'manager_approved',
          comment: comments || 'Approved by Line Manager. Forwarded to Finance.',
          details: { totalAmount: claim.totalAmount },
        });
      } else {
        return res.status(403).json({ error: 'Not authorized to approve at this stage.' });
      }
    } else if (claim.status === 'manager_approved') {
      if (!isFinanceOrAdmin) {
        return res.status(403).json({ error: 'Only Finance or Admin can grant final approval.' });
      }

      claim.status = 'approved';
      claim.financeApproval = {
        approverId: user._id,
        approvedAt: new Date(),
        comments: comments || 'Finance Approval Granted',
      };

      await ExpenseActivity.create({
        organizationId: orgId,
        claimId: claim._id,
        actorId: user._id,
        action: 'finance_approved',
        comment: comments || 'Final approval granted by Finance',
        details: { totalAmount: claim.totalAmount },
      });
    } else {
      return res.status(400).json({ error: `Cannot approve a claim with status "${claim.status}".` });
    }

    await claim.save();

    const updated = await ExpenseClaim.findById(claim._id)
      .populate('employeeId', 'fullName email')
      .populate('departmentId', 'name')
      .populate('items.categoryId', 'name icon color')
      .populate('managerApproval.approverId', 'fullName email')
      .populate('financeApproval.approverId', 'fullName email');

    return res.json({ success: true, message: 'Claim approved successfully.', claim: updated });
  } catch (error) {
    console.error('Error approving claim:', error);
    return res.status(500).json({ error: 'Failed to approve claim.' });
  }
};

/**
 * Reject claim with mandatory reason
 */
exports.rejectClaim = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A rejection reason is mandatory.' });
    }

    const claim = await ExpenseClaim.findOne({ _id: id, organizationId: orgId });
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    if (!['submitted', 'manager_approved'].includes(claim.status)) {
      return res.status(400).json({ error: `Cannot reject claim with status "${claim.status}".` });
    }

    const stage = claim.status === 'submitted' ? 'manager' : 'finance';
    claim.status = 'rejected';
    claim.rejection = {
      rejectedById: user._id,
      rejectedAt: new Date(),
      reason: reason.trim(),
      stage,
    };

    await claim.save();

    await ExpenseActivity.create({
      organizationId: orgId,
      claimId: claim._id,
      actorId: user._id,
      action: 'rejected',
      comment: reason.trim(),
      details: { stage },
    });

    const updated = await ExpenseClaim.findById(claim._id)
      .populate('employeeId', 'fullName email')
      .populate('departmentId', 'name')
      .populate('rejection.rejectedById', 'fullName email');

    return res.json({ success: true, message: 'Claim rejected.', claim: updated });
  } catch (error) {
    console.error('Error rejecting claim:', error);
    return res.status(500).json({ error: 'Failed to reject claim.' });
  }
};
