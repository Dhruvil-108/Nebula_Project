const DepartmentBudget = require('../models/DepartmentBudget');
const PurchaseOrder = require('../models/PurchaseOrder');
const PurchaseRequisition = require('../models/PurchaseRequisition');

class ProcurementBudgetBridgeService {
  /**
   * Evaluates department budget commitments for new Purchase Requisitions or POs
   */
  async checkProcurementBudgetCommitment({
    organizationId,
    departmentId,
    amount = 0,
  }) {
    if (!departmentId) {
      return { allowed: true, isAlert: false, isOverBudget: false, message: null };
    }

    const currentYear = new Date().getFullYear();

    const budget = await DepartmentBudget.findOne({
      organizationId,
      departmentId,
      fiscalYear: currentYear,
      period: 'annual',
    }).lean();

    if (!budget) {
      return { allowed: true, isAlert: false, isOverBudget: false, message: null };
    }

    // 1. Calculate existing committed spend from Purchase Orders in this department
    // (POs whose PR was in this department, or direct PO spend)
    const activePrs = await PurchaseRequisition.find({
      organizationId,
      departmentId,
      status: { $in: ['pending_approval', 'manager_approved', 'approved'] },
      deletedAt: null,
    }).lean();

    const pendingPrTotal = activePrs.reduce(
      (acc, pr) => acc + (pr.totalEstimatedAmount || 0),
      0
    );

    const allocated = budget.allocatedAmount || 0;
    const currentSpent = budget.spentAmount || 0;
    const projectedTotal = currentSpent + pendingPrTotal + amount;

    const percentUsed = allocated > 0 ? Math.round((projectedTotal / allocated) * 100) : 0;
    const isOverBudget = projectedTotal > allocated;
    const isAlert = percentUsed >= (budget.alertThresholdPercent || 80);

    if (budget.controlMode === 'block' && isOverBudget) {
      const message = `Budget Exceeded: Department annual budget is $${allocated.toLocaleString()} with $${projectedTotal.toLocaleString()} projected (${percentUsed}% used). Hard block enforced.`;
      return {
        allowed: false,
        controlMode: 'block',
        isOverBudget: true,
        percentUsed,
        allocatedAmount: allocated,
        projectedTotal,
        message,
      };
    }

    if (isOverBudget) {
      const message = `Budget Warning: Request of $${amount.toLocaleString()} exceeds allocated department budget ($${allocated.toLocaleString()}) by $${(projectedTotal - allocated).toLocaleString()}. (${percentUsed}% utilized).`;
      return {
        allowed: true,
        controlMode: 'warn',
        isOverBudget: true,
        isAlert: true,
        percentUsed,
        allocatedAmount: allocated,
        projectedTotal,
        message,
      };
    }

    return {
      allowed: true,
      controlMode: budget.controlMode,
      isOverBudget: false,
      isAlert,
      percentUsed,
      allocatedAmount: allocated,
      projectedTotal,
      message: isAlert
        ? `Budget Advisory: Department is at ${percentUsed}% of allocated budget.`
        : null,
    };
  }

  /**
   * Posts confirmed supplier invoice spend against the department's budget
   */
  async postProcurementSpendToBudget({ organizationId, departmentId, amount }) {
    if (!departmentId || !amount) return null;

    const currentYear = new Date().getFullYear();
    const budget = await DepartmentBudget.findOneAndUpdate(
      { organizationId, departmentId, fiscalYear: currentYear, period: 'annual' },
      { $inc: { spentAmount: amount } },
      { new: true }
    );

    return budget;
  }
}

module.exports = new ProcurementBudgetBridgeService();
