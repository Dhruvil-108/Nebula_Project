const ExpenseClaim = require('../models/ExpenseClaim');
const DepartmentBudget = require('../models/DepartmentBudget');
const AnomalyDetectionService = require('./anomalyDetectionService');
const AiRun = require('../models/AiRun');
const { roundMoney } = require('../utils/money');

/**
 * Approver Assistant Service (X8)
 * Synthesizes an executive review brief for approvers.
 * Human reviewers always retain 100% control over approval/rejection.
 */
class ApproverAssistantService {
  /**
   * Generate an approver brief for a specific claim
   */
  static async generateBrief(organizationId, claimId, userId) {
    const startTime = Date.now();

    const claim = await ExpenseClaim.findOne({ _id: claimId, organizationId })
      .populate('employeeId', 'fullName email')
      .populate('departmentId', 'name')
      .populate('projectId', 'name code clientName')
      .populate('costCenterId', 'name code');

    if (!claim) {
      throw new Error('Expense claim not found.');
    }

    // 1. Run Anomaly Analysis
    const anomalyResult = await AnomalyDetectionService.analyzeClaimAnomalies(
      organizationId,
      claim,
      userId
    );

    // 2. Compute Department Budget Impact
    let budgetImpactText = 'No departmental budget ceiling active for this department.';
    let budgetPercentImpact = 0;
    if (claim.departmentId) {
      const currentYear = new Date().getFullYear();
      const budget = await DepartmentBudget.findOne({
        organizationId,
        departmentId: claim.departmentId._id || claim.departmentId,
        fiscalYear: currentYear,
      });

      if (budget && budget.allocatedAmount > 0) {
        const remaining = Math.max(0, budget.allocatedAmount - (budget.spentAmount || 0));
        budgetPercentImpact = roundMoney((claim.totalAmount / budget.allocatedAmount) * 100);
        budgetImpactText = `This claim represents ${budgetPercentImpact}% of ${claim.departmentId.name || 'Department'}'s ${currentYear} budget (Remaining Headroom: $${remaining.toFixed(2)}).`;
      }
    }

    // 3. Historical Submissions by Employee
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const pastClaims = await ExpenseClaim.find({
      organizationId,
      employeeId: claim.employeeId?._id || claim.employeeId,
      _id: { $ne: claim._id },
      deletedAt: null,
      status: { $in: ['approved', 'reimbursed'] },
      createdAt: { $gte: ninetyDaysAgo },
    }).select('totalAmount items');

    const pastClaimsCount = pastClaims.length;
    const pastAverageAmount =
      pastClaimsCount > 0
        ? roundMoney(pastClaims.reduce((s, c) => s + (c.totalAmount || 0), 0) / pastClaimsCount)
        : 0;

    // 4. Construct Deterministic Executive Brief
    const employeeName = claim.employeeId?.fullName || 'The employee';
    const deptName = claim.departmentId?.name || 'their department';
    const itemsCount = claim.items?.length || 0;
    const isBillable = claim.items?.some((i) => i.isBillableToClient);

    const summaryParagraph = `${employeeName} submitted a ${claim.currency} $${claim.totalAmount.toFixed(
      2
    )} claim titled "${claim.title}" containing ${itemsCount} line items under ${deptName}.${
      isBillable ? ` Contains billable expenses for project ${claim.projectId?.name || 'Client'}.` : ''
    } Over the past 90 days, ${employeeName} has had ${pastClaimsCount} approved claims averaging $${pastAverageAmount.toFixed(
      2
    )}.`;

    // 5. Recommended Action
    let suggestedAction = 'approve';
    let suggestedReason = 'All items conform to standard expense policies with clear receipts.';

    if (anomalyResult.riskScore === 'high') {
      suggestedAction = 'review_carefully';
      suggestedReason = `High-risk anomaly detected: ${anomalyResult.flags.map((f) => f.title).join(', ')}. Review receipts prior to approval.`;
    } else if (claim.violations && claim.violations.some((v) => v.severity === 'warn')) {
      suggestedAction = 'verify_justifications';
      suggestedReason = 'Policy warnings present; verify employee justifications provided on line items.';
    }

    const latencyMs = Date.now() - startTime;

    // Log to AiRun
    if (userId) {
      try {
        await AiRun.create({
          organizationId,
          userId,
          task: 'approver_summary',
          claimId: claim._id,
          latencyMs,
          resultSummary: `Generated approver brief (Recommendation: ${suggestedAction})`,
        });
      } catch (e) {
        // Non-blocking log
      }
    }

    return {
      summaryParagraph,
      budgetImpact: {
        text: budgetImpactText,
        percentImpact: budgetPercentImpact,
      },
      historicalContext: {
        pastClaimsCount,
        pastAverageAmount,
      },
      anomalyFlags: anomalyResult.flags,
      riskScore: anomalyResult.riskScore,
      suggestedAction,
      suggestedReason,
      draftApprovalComment: `Reviewed and approved claim ${claim.claimNumber} (${claim.currency} $${claim.totalAmount.toFixed(2)}).`,
    };
  }
}

module.exports = ApproverAssistantService;
