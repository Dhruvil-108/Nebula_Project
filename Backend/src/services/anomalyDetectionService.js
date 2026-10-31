const ExpenseClaim = require('../models/ExpenseClaim');
const AiRun = require('../models/AiRun');
const { roundMoney } = require('../utils/money');

/**
 * Anomaly Detection Service (X7)
 * Evaluates claims for statistical, timing, and structural spending anomalies.
 * Flags attach strictly to the claim/line items, NEVER to an employee profile.
 */
class AnomalyDetectionService {
  /**
   * Run anomaly analysis on a claim
   */
  static async analyzeClaimAnomalies(organizationId, claim, userId = null) {
    const startTime = Date.now();
    const flags = [];

    if (!claim || !claim.items || claim.items.length === 0) {
      return { flags, riskScore: 'low' };
    }

    const items = claim.items;
    const totalAmount = claim.totalAmount || items.reduce((s, i) => s + (i.amount || 0), 0);

    // 1. Weekend Spend Detection
    items.forEach((item, idx) => {
      if (item.expenseDate) {
        const d = new Date(item.expenseDate);
        const day = d.getUTCDay();
        if (day === 0 || day === 6) {
          flags.push({
            rule: 'weekend_spend',
            severity: 'caution',
            title: 'Weekend Transaction',
            reason: `Item #${idx + 1} (${item.merchant}) was incurred on a weekend (${d.toLocaleDateString('en-US', { weekday: 'long' })}). Verify business purpose.`,
            itemIndex: idx,
            merchant: item.merchant,
            amount: item.amount,
          });
        }
      }
    });

    // 2. Round Number Pattern Check (e.g. exactly $500, $1000)
    items.forEach((item, idx) => {
      const amt = item.amount || 0;
      if (amt >= 100 && amt % 50 === 0 && Number.isInteger(amt)) {
        flags.push({
          rule: 'round_number',
          severity: 'info',
          title: 'Round Amount Transaction',
          reason: `Item #${idx + 1} is an exact round figure ($${amt.toFixed(2)}). Ensure supporting tax receipt is attached.`,
          itemIndex: idx,
          merchant: item.merchant,
          amount: amt,
        });
      }
    });

    // 3. Potential Split Transaction Check (transactions just below common thresholds)
    // E.g., multiple items near $250 or $500, or total just under $1,000 threshold
    if (totalAmount >= 900 && totalAmount < 1000) {
      flags.push({
        rule: 'split_transaction_threshold',
        severity: 'caution',
        title: 'Threshold Boundary Spend',
        reason: `Total claim amount ($${totalAmount.toFixed(2)}) is just below the standard $1,000 executive approval threshold.`,
      });
    }

    // 4. Duplicate Look-Alike Query across claims in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      if (it.amount > 0 && it.merchant) {
        const matchingClaim = await ExpenseClaim.findOne({
          organizationId,
          _id: { $ne: claim._id },
          deletedAt: null,
          status: { $in: ['submitted', 'manager_approved', 'approved', 'reimbursed'] },
          createdAt: { $gte: thirtyDaysAgo },
          'items.merchant': new RegExp(`^${it.merchant.trim()}$`, 'i'),
          'items.amount': it.amount,
        }).select('claimNumber employeeId title createdAt');

        if (matchingClaim) {
          flags.push({
            rule: 'duplicate_lookalike',
            severity: 'high_risk',
            title: 'Potential Duplicate Submission',
            reason: `Item #${idx + 1} (${it.merchant} for $${it.amount.toFixed(2)}) closely matches an existing expense in ${matchingClaim.claimNumber} (${matchingClaim.title}).`,
            itemIndex: idx,
            matchedClaimNumber: matchingClaim.claimNumber,
          });
        }
      }
    }

    // Determine overall risk score
    let riskScore = 'low';
    if (flags.some((f) => f.severity === 'high_risk')) {
      riskScore = 'high';
    } else if (flags.some((f) => f.severity === 'caution')) {
      riskScore = 'medium';
    }

    const latencyMs = Date.now() - startTime;

    // Log to AiRun collection if user is present
    if (userId) {
      try {
        await AiRun.create({
          organizationId,
          userId,
          task: 'anomaly_detection',
          claimId: claim._id,
          latencyMs,
          resultSummary: `Found ${flags.length} anomaly flags (Risk level: ${riskScore})`,
          userInteraction: 'accepted',
        });
      } catch (err) {
        // Non-blocking logging failure
      }
    }

    return {
      flags,
      riskScore,
      flagsCount: flags.length,
      analyzedAt: new Date().toISOString(),
    };
  }
}

module.exports = AnomalyDetectionService;
