const DepartmentBudget = require('../models/DepartmentBudget');
const Department = require('../models/Department');
const ExpenseClaim = require('../models/ExpenseClaim');

/**
 * Get all departmental budgets for the current fiscal year / period
 */
exports.getBudgets = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { fiscalYear, period } = req.query;

    const currentYear = fiscalYear ? parseInt(fiscalYear, 10) : new Date().getFullYear();
    const query = {
      organizationId: orgId,
      fiscalYear: currentYear,
    };
    if (period) {
      query.period = period;
    }

    const budgets = await DepartmentBudget.find(query)
      .populate('departmentId', 'name description headId')
      .sort({ allocatedAmount: -1 })
      .lean();

    // Recalculate real-time spent and pending amounts directly from claims
    const enhancedBudgets = await Promise.all(
      budgets.map(async (b) => {
        const deptId = b.departmentId?._id || b.departmentId;

        // Sum approved and reimbursed claims
        const approvedAgg = await ExpenseClaim.aggregate([
          {
            $match: {
              organizationId: orgId,
              departmentId: deptId,
              status: { $in: ['approved', 'reimbursed'] },
            },
          },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: '$totalAmount' },
            },
          },
        ]);

        // Sum pending claims (submitted, manager_approved)
        const pendingAgg = await ExpenseClaim.aggregate([
          {
            $match: {
              organizationId: orgId,
              departmentId: deptId,
              status: { $in: ['submitted', 'manager_approved'] },
            },
          },
          {
            $group: {
              _id: null,
              totalPending: { $sum: '$totalAmount' },
            },
          },
        ]);

        const actualSpent = approvedAgg[0]?.totalSpent || 0;
        const actualPending = pendingAgg[0]?.totalPending || 0;
        const allocated = b.allocatedAmount || 0;
        const remaining = Math.max(0, allocated - actualSpent);
        const percentUsed = allocated > 0 ? Math.round((actualSpent / allocated) * 100) : 0;
        const alertThreshold = b.alertThresholdPercent || 80;

        return {
          ...b,
          spentAmount: actualSpent,
          pendingAmount: actualPending,
          remainingAmount: remaining,
          percentUsed,
          isAlert: percentUsed >= alertThreshold && percentUsed < 100,
          isOverBudget: actualSpent > allocated,
        };
      })
    );

    return res.json({ success: true, budgets: enhancedBudgets });
  } catch (error) {
    console.error('Error fetching department budgets:', error);
    return res.status(500).json({ error: 'Failed to fetch department budgets.' });
  }
};

/**
 * Create or update a department budget allocation
 */
exports.createOrUpdateBudget = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { departmentId, fiscalYear, period, allocatedAmount, alertThresholdPercent, notes } = req.body;

    if (!departmentId || !allocatedAmount) {
      return res.status(400).json({ error: 'Department and allocated amount are required.' });
    }

    const year = fiscalYear ? parseInt(fiscalYear, 10) : new Date().getFullYear();
    const budgetPeriod = period || 'annual';

    const department = await Department.findOne({ _id: departmentId, organizationId: orgId });
    if (!department) {
      return res.status(404).json({ error: 'Department not found in organization.' });
    }

    const budget = await DepartmentBudget.findOneAndUpdate(
      {
        organizationId: orgId,
        departmentId,
        fiscalYear: year,
        period: budgetPeriod,
      },
      {
        allocatedAmount: Number(allocatedAmount),
        alertThresholdPercent: alertThresholdPercent ? Number(alertThresholdPercent) : 80,
        notes: notes ? notes.trim() : '',
      },
      { new: true, upsert: true, runValidators: true }
    ).populate('departmentId', 'name description');

    return res.json({ success: true, budget });
  } catch (error) {
    console.error('Error saving department budget:', error);
    return res.status(500).json({ error: error.message || 'Failed to save department budget.' });
  }
};

/**
 * Delete a budget entry
 */
exports.deleteBudget = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const deleted = await DepartmentBudget.findOneAndDelete({ _id: id, organizationId: orgId });
    if (!deleted) {
      return res.status(404).json({ error: 'Budget entry not found.' });
    }

    return res.json({ success: true, message: 'Budget entry removed.' });
  } catch (error) {
    console.error('Error deleting budget entry:', error);
    return res.status(500).json({ error: 'Failed to delete budget entry.' });
  }
};
