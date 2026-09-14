const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const { scopedFilter } = require('../middleware/tenant');

/**
 * GET /api/v1/crm/summary
 * KPI payload shaped for the existing Dashboard KPI-card contract:
 *  - active leads (not yet won/lost)
 *  - deals in pipeline (count + total value of non-closed stages)
 *  - deals won this month (count + value)
 *  - conversion rate (won / total closed leads)
 */
const getCrmSummary = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const [activeLeadsCount, closedLeadCount, wonLeadCount, pipelineAgg, wonThisMonthAgg] = await Promise.all([
      Lead.countDocuments(scopedFilter(req, { status: { $nin: ['won', 'lost'] } })),
      Lead.countDocuments(scopedFilter(req, { status: { $in: ['won', 'lost'] } })),
      Lead.countDocuments(scopedFilter(req, { status: 'won' })),
      Deal.aggregate([
        {
          $match: {
            organizationId: req.organizationId,
            stage: { $nin: ['won', 'lost'] },
          },
        },
        { $group: { _id: null, count: { $sum: 1 }, totalValue: { $sum: '$amount' } } },
      ]),
      Deal.aggregate([
        {
          $match: {
            organizationId: req.organizationId,
            stage: 'won',
            updatedAt: { $gte: monthStart, $lt: monthEnd },
          },
        },
        { $group: { _id: null, count: { $sum: 1 }, totalValue: { $sum: '$amount' } } },
      ]),
    ]);

    const pipeline = pipelineAgg[0] || { count: 0, totalValue: 0 };
    const wonThisMonth = wonThisMonthAgg[0] || { count: 0, totalValue: 0 };
    const conversionRate =
      closedLeadCount > 0 ? Math.round((wonLeadCount / closedLeadCount) * 1000) / 10 : null;

    return res.json({
      activeLeads: activeLeadsCount,
      pipelineDeals: pipeline.count,
      pipelineValue: pipeline.totalValue,
      wonThisMonth: wonThisMonth.count,
      wonThisMonthValue: wonThisMonth.totalValue,
      conversionRate,
    });
  } catch (err) {
    console.error('[crmController.getCrmSummary] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve CRM summary.' });
  }
};

module.exports = { getCrmSummary };
