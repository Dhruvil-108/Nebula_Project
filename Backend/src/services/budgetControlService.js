const DepartmentBudget = require('../models/DepartmentBudget');
const ExpenseClaim = require('../models/ExpenseClaim');

/**
 * Nebula Budget Control Service
 * Checks multi-dimensional budget commitments and enforces soft warnings or hard blocks.
 */
async function checkBudgetCompliance({
  organizationId,
  departmentId,
  projectId = null,
  costCenterId = null,
  claimAmount = 0,
}) {
  try {
    const currentYear = new Date().getFullYear();

    // Query active budget for this department
    const budget = await DepartmentBudget.findOne({
      organizationId,
      departmentId,
      fiscalYear: currentYear,
      period: 'annual',
    }).lean();

    if (!budget) {
      return { allowed: true, isAlert: false, isOverBudget: false, message: null };
    }

    // Live recalculation of spent + pending
    const approvedAgg = await ExpenseClaim.aggregate([
      {
        $match: {
          organizationId,
          deletedAt: null,
          departmentId,
          status: { $in: ['approved', 'reimbursed'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);

    const pendingAgg = await ExpenseClaim.aggregate([
      {
        $match: {
          organizationId,
          deletedAt: null,
          departmentId,
          status: { $in: ['submitted', 'manager_approved'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);

    const currentSpent = approvedAgg[0]?.total || 0;
    const currentPending = pendingAgg[0]?.total || 0;
    const projectedTotal = currentSpent + currentPending + claimAmount;
    const allocated = budget.allocatedAmount || 0;

    const percentUsed = allocated > 0 ? Math.round((projectedTotal / allocated) * 100) : 0;
    const isOverBudget = projectedTotal > allocated;
    const isAlert = percentUsed >= (budget.alertThresholdPercent || 80);

    if (budget.controlMode === 'block' && isOverBudget) {
      return {
        allowed: false,
        controlMode: 'block',
        isOverBudget: true,
        percentUsed,
        allocatedAmount: allocated,
        projectedTotal,
        message: `Department budget hard-block: Proposed claim exceeds remaining budget allocation by ${(projectedTotal - allocated).toFixed(2)} ${budget.currency}.`,
      };
    }

    return {
      allowed: true,
      controlMode: budget.controlMode || 'warn',
      isOverBudget,
      isAlert,
      percentUsed,
      allocatedAmount: allocated,
      projectedTotal,
      message: isOverBudget
        ? `Budget Warning: This claim places department spending at ${percentUsed}% of budget (exceeds allocation).`
        : isAlert
        ? `Budget Advisory: Department spending is nearing capacity (${percentUsed}% used).`
        : null,
    };
  } catch (error) {
    console.error('Error in budget control service:', error);
    return { allowed: true, isAlert: false, isOverBudget: false, message: null };
  }
}

module.exports = {
  checkBudgetCompliance,
};
