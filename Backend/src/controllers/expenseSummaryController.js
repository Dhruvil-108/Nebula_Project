const ExpenseClaim = require('../models/ExpenseClaim');
const ExpenseCategory = require('../models/ExpenseCategory');
const DepartmentBudget = require('../models/DepartmentBudget');

/**
 * Get executive KPIs, monthly spend trends, and category distribution
 */
exports.getExpenseSummary = async (req, res) => {
  try {
    const orgId = req.organizationId;

    // 1. Core aggregates
    const statsAgg = await ExpenseClaim.aggregate([
      {
        $match: {
          organizationId: orgId,
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const statMap = {};
    let totalClaimed = 0;
    statsAgg.forEach((s) => {
      statMap[s._id] = { total: s.totalAmount, count: s.count };
      totalClaimed += s.totalAmount;
    });

    const totalApproved = statMap['approved']?.total || 0;
    const totalManagerApproved = statMap['manager_approved']?.total || 0;
    const totalPending = (statMap['submitted']?.total || 0) + totalManagerApproved;
    const totalReimbursed = statMap['reimbursed']?.total || 0;
    const pendingCount = (statMap['submitted']?.count || 0) + (statMap['manager_approved']?.count || 0);

    // 2. Category Breakdown (Unwind line items)
    const categoryAgg = await ExpenseClaim.aggregate([
      {
        $match: {
          organizationId: orgId,
          status: { $in: ['approved', 'reimbursed', 'manager_approved', 'submitted'] },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.categoryId',
          totalAmount: { $sum: '$items.amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 6 },
    ]);

    const populatedCategories = await Promise.all(
      categoryAgg.map(async (c) => {
        const cat = await ExpenseCategory.findById(c._id).lean();
        return {
          id: c._id,
          name: cat?.name || 'Uncategorized',
          color: cat?.color || '#f97316',
          icon: cat?.icon || 'Receipt',
          amount: Math.round(c.totalAmount * 100) / 100,
          count: c.count,
        };
      })
    );

    // 3. Last 6 Months Spend Trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAgg = await ExpenseClaim.aggregate([
      {
        $match: {
          organizationId: orgId,
          createdAt: { $gte: sixMonthsAgo },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            status: '$status',
          },
          total: { $sum: '$totalAmount' },
        },
      },
    ]);

    // Build chronological 6-month array
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const label = `${monthNames[m - 1]} ${y}`;

      const submitted = monthlyAgg
        .filter((item) => item._id.year === y && item._id.month === m)
        .reduce((sum, item) => sum + item.total, 0);

      const approved = monthlyAgg
        .filter(
          (item) =>
            item._id.year === y &&
            item._id.month === m &&
            ['approved', 'reimbursed'].includes(item._id.status)
        )
        .reduce((sum, item) => sum + item.total, 0);

      const reimbursed = monthlyAgg
        .filter((item) => item._id.year === y && item._id.month === m && item._id.status === 'reimbursed')
        .reduce((sum, item) => sum + item.total, 0);

      monthlyTrend.push({
        month: label,
        total: Math.round(submitted * 100) / 100,
        approved: Math.round(approved * 100) / 100,
        reimbursed: Math.round(reimbursed * 100) / 100,
      });
    }

    // 4. Budget summary
    const budgets = await DepartmentBudget.find({
      organizationId: orgId,
      fiscalYear: new Date().getFullYear(),
    }).lean();

    const totalAllocated = budgets.reduce((acc, b) => acc + (b.allocatedAmount || 0), 0);
    const overallBudgetUsedPercent = totalAllocated > 0 ? Math.round(((totalApproved + totalReimbursed) / totalAllocated) * 100) : 0;

    // 5. Recent 5 claims
    const recentClaims = await ExpenseClaim.find({ organizationId: orgId })
      .populate('employeeId', 'fullName email')
      .populate('departmentId', 'name')
      .populate('items.categoryId', 'name icon color')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return res.json({
      success: true,
      summary: {
        metrics: {
          totalClaimed: Math.round(totalClaimed * 100) / 100,
          totalApproved: Math.round((totalApproved + totalManagerApproved) * 100) / 100,
          totalPending: Math.round(totalPending * 100) / 100,
          totalReimbursed: Math.round(totalReimbursed * 100) / 100,
          pendingCount,
          overallBudgetUsedPercent,
          totalBudgetAllocated: totalAllocated,
        },
        monthlyTrend,
        categoryBreakdown: populatedCategories,
        recentClaims,
      },
    });
  } catch (error) {
    console.error('Error calculating expense summary:', error);
    return res.status(500).json({ error: 'Failed to generate expense summary.' });
  }
};
