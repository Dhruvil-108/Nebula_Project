const ExpenseClaim = require('../models/ExpenseClaim');
const DepartmentBudget = require('../models/DepartmentBudget');
const AiRun = require('../models/AiRun');
const { roundMoney } = require('../utils/money');

/**
 * Spend Copilot Service (X11)
 * Natural-language assistant for querying enterprise expense analytics.
 * Strictly enforces multi-tenancy and RBAC filters.
 */
class SpendCopilotService {
  /**
   * Process a user chat prompt with RBAC-scoped read tools
   */
  static async queryCopilot(organizationId, user, prompt) {
    const startTime = Date.now();
    const query = (prompt || '').toLowerCase().trim();
    const isManagerOrAdmin = ['super_admin', 'admin', 'finance', 'manager'].includes(user?.role);
    const userId = user?.id || user?._id;

    let answer = '';
    let data = null;
    let suggestedFollowUps = [
      'Top 5 vendors by spend',
      'Pending claims waiting over 3 days',
      'Department budget utilization',
    ];

    // Base query scoping
    const claimFilter = { organizationId, deletedAt: null };
    if (!isManagerOrAdmin) {
      claimFilter.employeeId = userId;
    }

    // 1. Intent: Top Vendors
    if (query.includes('vendor') || query.includes('merchant')) {
      const claims = await ExpenseClaim.find(claimFilter).select('items');
      const vendorSpend = {};

      claims.forEach((c) => {
        (c.items || []).forEach((item) => {
          const m = (item.merchant || 'General').trim();
          vendorSpend[m] = (vendorSpend[m] || 0) + (item.amount || 0);
        });
      });

      const topVendors = Object.entries(vendorSpend)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, spend]) => ({ name, spend: roundMoney(spend) }));

      if (topVendors.length === 0) {
        answer = 'No vendor spend data found matching your permissions.';
      } else {
        answer = `Here are the top **${topVendors.length} vendors** by spend:\n\n` +
          topVendors.map((v, i) => `${i + 1}. **${v.name}**: $${v.spend.toFixed(2)}`).join('\n');
        data = topVendors;
      }
    }
    // 2. Intent: Stalled / Aging / Pending Claims
    else if (query.includes('waiting') || query.includes('pending') || query.includes('stalled') || query.includes('aging')) {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const pendingClaims = await ExpenseClaim.find({
        ...claimFilter,
        status: { $in: ['submitted', 'manager_approved'] },
        submittedAt: { $lte: threeDaysAgo },
      })
        .select('claimNumber title totalAmount submittedAt employeeId')
        .populate('employeeId', 'fullName');

      if (pendingClaims.length === 0) {
        answer = 'Good news! There are currently no expense claims pending for more than 3 days.';
      } else {
        answer = `Found **${pendingClaims.length} claims** waiting for review for more than 3 days:\n\n` +
          pendingClaims
            .map(
              (c) =>
                `• **${c.claimNumber}**: ${c.title} ($${c.totalAmount.toFixed(2)}) — Submitted by ${
                  c.employeeId?.fullName || 'User'
                } on ${new Date(c.submittedAt).toLocaleDateString()}`
            )
            .join('\n');
        data = pendingClaims;
      }
    }
    // 3. Intent: Budget Utilization
    else if (query.includes('budget') || query.includes('burn')) {
      const currentYear = new Date().getFullYear();
      const budgets = await DepartmentBudget.find({ organizationId, fiscalYear: currentYear }).populate(
        'departmentId',
        'name'
      );

      if (budgets.length === 0) {
        answer = `No active departmental budgets configured for fiscal year ${currentYear}.`;
      } else {
        answer = `Here is the current budget utilization for **FY ${currentYear}**:\n\n` +
          budgets
            .map((b) => {
              const pct = b.allocatedAmount > 0 ? roundMoney((b.spentAmount / b.allocatedAmount) * 100) : 0;
              return `• **${b.departmentId?.name || 'Department'}**: $${(b.spentAmount || 0).toFixed(2)} of $${(
                b.allocatedAmount || 0
              ).toFixed(2)} (${pct}% utilized)`;
            })
            .join('\n');
        data = budgets;
      }
    }
    // 4. Default / General Query
    else {
      const totalClaimedCount = await ExpenseClaim.countDocuments(claimFilter);
      const approvedCount = await ExpenseClaim.countDocuments({ ...claimFilter, status: 'approved' });
      const pendingCount = await ExpenseClaim.countDocuments({
        ...claimFilter,
        status: { $in: ['submitted', 'manager_approved'] },
      });

      answer =
        `I am your **Nebula Spend Copilot**. Here is a quick snapshot of your expenses workspace:\n\n` +
        `• **Total Claims on Record**: ${totalClaimedCount}\n` +
        `• **Approved for Reimbursement**: ${approvedCount}\n` +
        `• **Currently Pending Review**: ${pendingCount}\n\n` +
        `You can ask me questions like *"Top vendors"*, *"Pending claims over 3 days"*, or *"Budget utilization"*!`;
    }

    const latencyMs = Date.now() - startTime;

    // Log interaction to AiRun
    try {
      await AiRun.create({
        organizationId,
        userId,
        task: 'spend_copilot',
        latencyMs,
        resultSummary: `Prompt: "${prompt.slice(0, 60)}" -> Answered (${latencyMs}ms)`,
      });
    } catch (e) {
      // Non-blocking
    }

    return {
      answer,
      data,
      suggestedFollowUps,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = SpendCopilotService;
