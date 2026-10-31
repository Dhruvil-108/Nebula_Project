const ExpensePolicy = require('../models/ExpensePolicy');

/**
 * Nebula Expense Policy Engine Service
 * Evaluates expense items and claims against active organization policies.
 */
async function evaluateClaimPolicies({ organizationId, departmentId, employmentType = 'full_time', items = [] }) {
  try {
    const policies = await ExpensePolicy.find({
      organizationId,
      active: true,
      deletedAt: null,
    }).lean();

    if (!policies || policies.length === 0) {
      return { canSubmit: true, hasBlocks: false, violations: [] };
    }

    const violations = [];
    let hasBlocks = false;

    // Check each line item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemAmount = Number(item.amount || 0);
      const categoryIdStr = item.categoryId ? item.categoryId.toString() : null;
      const merchantName = (item.merchant || '').trim().toLowerCase();
      const expenseDate = item.expenseDate ? new Date(item.expenseDate) : new Date();

      for (const policy of policies) {
        // Scope match check
        const policyCatId = policy.scope?.categoryId ? policy.scope.categoryId.toString() : null;
        const policyDeptId = policy.scope?.departmentId ? policy.scope.departmentId.toString() : null;
        const policyEmpType = policy.scope?.employmentType || 'all';

        if (policyCatId && categoryIdStr && policyCatId !== categoryIdStr) continue;
        if (policyDeptId && departmentId && policyDeptId !== departmentId.toString()) continue;
        if (policyEmpType !== 'all' && employmentType && policyEmpType !== employmentType) continue;

        // 1. Per-item limit check
        if (policy.ruleType === 'per_item_limit' && policy.limitAmount > 0) {
          if (itemAmount > policy.limitAmount) {
            const v = {
              policyId: policy._id,
              ruleType: policy.ruleType,
              severity: policy.severity,
              message: `Item #${i + 1} (${item.merchant || 'Expense'}) amount ${itemAmount} ${item.currency || 'USD'} exceeds maximum limit of ${policy.limitAmount} ${policy.currency}.`,
              itemIndex: i,
              requiresJustification: policy.requiresJustification,
            };
            violations.push(v);
            if (policy.severity === 'block') hasBlocks = true;
          }
        }

        // 2. Receipt required check
        if (policy.ruleType === 'receipt_required') {
          const threshold = policy.limitAmount || 0;
          if (itemAmount >= threshold && !item.receiptUrl && !item.receiptBase64) {
            const v = {
              policyId: policy._id,
              ruleType: policy.ruleType,
              severity: policy.severity,
              message: `Receipt is mandatory for item #${i + 1} (${item.merchant || 'Expense'}) since amount ${itemAmount} meets or exceeds ${threshold} ${policy.currency}.`,
              itemIndex: i,
              requiresJustification: policy.requiresJustification,
            };
            violations.push(v);
            if (policy.severity === 'block') hasBlocks = true;
          }
        }

        // 3. Merchant restriction check
        if (policy.ruleType === 'merchant_restriction' && policy.merchantList?.length > 0) {
          const inList = policy.merchantList.some((m) => merchantName.includes(m.toLowerCase()));
          const isRestricted = policy.isWhitelist ? !inList : inList;

          if (isRestricted) {
            const v = {
              policyId: policy._id,
              ruleType: policy.ruleType,
              severity: policy.severity,
              message: `Merchant "${item.merchant}" is restricted under organization policy "${policy.name}".`,
              itemIndex: i,
              requiresJustification: policy.requiresJustification,
            };
            violations.push(v);
            if (policy.severity === 'block') hasBlocks = true;
          }
        }

        // 4. Weekend spend check
        if (policy.ruleType === 'weekend_spend') {
          const day = expenseDate.getDay(); // 0 = Sunday, 6 = Saturday
          if (day === 0 || day === 6) {
            const v = {
              policyId: policy._id,
              ruleType: policy.ruleType,
              severity: policy.severity,
              message: `Item #${i + 1} transaction occurred on a weekend (${expenseDate.toDateString()}).`,
              itemIndex: i,
              requiresJustification: policy.requiresJustification,
            };
            violations.push(v);
            if (policy.severity === 'block') hasBlocks = true;
          }
        }
      }
    }

    return {
      canSubmit: !hasBlocks,
      hasBlocks,
      violations,
    };
  } catch (error) {
    console.error('Error evaluating claim policies:', error);
    return { canSubmit: true, hasBlocks: false, violations: [] };
  }
}

module.exports = {
  evaluateClaimPolicies,
};
