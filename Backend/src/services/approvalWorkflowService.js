const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const Delegation = require('../models/Delegation');
const ExpenseActivity = require('../models/ExpenseActivity');

/**
 * Nebula Approval Workflow Service
 * Resolves workflow chains, delegation rules, line-level decisions, and send-back flows.
 */

/**
 * Resolve matching approval workflow or fallback to default 2-tier
 */
async function resolveWorkflowForClaim({ organizationId, totalAmount, departmentId, categoryIds = [], projectId = null }) {
  try {
    const workflows = await ApprovalWorkflow.find({
      organizationId,
      active: true,
      deletedAt: null,
    })
      .sort({ isDefault: 1, createdAt: -1 })
      .lean();

    // Look for matching specific workflow
    for (const wf of workflows) {
      if (wf.isDefault) continue;

      const cond = wf.conditions || {};
      if (totalAmount < (cond.minAmount || 0)) continue;
      if (cond.maxAmount && totalAmount > cond.maxAmount) continue;

      if (cond.departmentIds?.length > 0 && departmentId) {
        const matchesDept = cond.departmentIds.some((d) => d.toString() === departmentId.toString());
        if (!matchesDept) continue;
      }

      if (cond.projectIds?.length > 0 && projectId) {
        const matchesProj = cond.projectIds.some((p) => p.toString() === projectId.toString());
        if (!matchesProj) continue;
      }

      return wf;
    }

    // Check if there is an explicit default workflow
    const defaultWf = workflows.find((w) => w.isDefault);
    if (defaultWf) return defaultWf;

    // Standard fallback: 2-tier (Line Manager -> Finance)
    return {
      name: 'Standard 2-Tier Workflow',
      isDefault: true,
      autoApproveBelow: 0,
      steps: [
        { stepOrder: 1, approverType: 'manager', slaHours: 48, canDelegate: true },
        { stepOrder: 2, approverType: 'finance', slaHours: 48, canDelegate: true },
      ],
    };
  } catch (error) {
    console.error('Error resolving approval workflow:', error);
    return {
      name: 'Standard 2-Tier Fallback',
      isDefault: true,
      autoApproveBelow: 0,
      steps: [
        { stepOrder: 1, approverType: 'manager', slaHours: 48, canDelegate: true },
        { stepOrder: 2, approverType: 'finance', slaHours: 48, canDelegate: true },
      ],
    };
  }
}

/**
 * Check if a user is an active delegatee for an approver
 */
async function getActiveDelegations(organizationId, userId) {
  const now = new Date();
  return Delegation.find({
    organizationId,
    toUserId: userId,
    active: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now },
  }).lean();
}

module.exports = {
  resolveWorkflowForClaim,
  getActiveDelegations,
};
