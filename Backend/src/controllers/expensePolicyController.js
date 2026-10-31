const ExpensePolicy = require('../models/ExpensePolicy');
const { evaluateClaimPolicies } = require('../services/policyEngineService');

/**
 * Real-time check of items against policies (called by claim form)
 */
exports.checkPolicy = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { departmentId, employmentType, items = [] } = req.body;

    const result = await evaluateClaimPolicies({
      organizationId: orgId,
      departmentId,
      employmentType,
      items,
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error checking policies:', error);
    return res.status(500).json({ error: 'Failed to evaluate policies.' });
  }
};

/**
 * Get all active expense policies
 */
exports.getPolicies = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const policies = await ExpensePolicy.find({
      organizationId: orgId,
      deletedAt: null,
    })
      .populate('scope.categoryId', 'name icon color')
      .populate('scope.departmentId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, policies });
  } catch (error) {
    console.error('Error fetching policies:', error);
    return res.status(500).json({ error: 'Failed to fetch policies.' });
  }
};

/**
 * Create a new expense policy
 */
exports.createPolicy = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const {
      name,
      description,
      scope,
      ruleType,
      limitAmount,
      currency,
      merchantList,
      isWhitelist,
      severity,
      requiresJustification,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Policy name is required.' });
    }
    if (!ruleType) {
      return res.status(400).json({ error: 'Policy rule type is required.' });
    }

    const policy = await ExpensePolicy.create({
      organizationId: orgId,
      name: name.trim(),
      description: description ? description.trim() : '',
      scope: scope || {},
      ruleType,
      limitAmount: Number(limitAmount || 0),
      currency: currency || 'USD',
      merchantList: Array.isArray(merchantList) ? merchantList : [],
      isWhitelist: Boolean(isWhitelist),
      severity: severity || 'warn',
      requiresJustification: requiresJustification !== false,
      active: true,
    });

    return res.status(201).json({ success: true, policy });
  } catch (error) {
    console.error('Error creating policy:', error);
    return res.status(500).json({ error: error.message || 'Failed to create policy.' });
  }
};

/**
 * Update an existing policy
 */
exports.updatePolicy = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;
    const updates = req.body;

    const policy = await ExpensePolicy.findOne({ _id: id, organizationId: orgId, deletedAt: null });
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found.' });
    }

    if (updates.name) policy.name = updates.name.trim();
    if (updates.description !== undefined) policy.description = updates.description.trim();
    if (updates.scope) policy.scope = updates.scope;
    if (updates.ruleType) policy.ruleType = updates.ruleType;
    if (updates.limitAmount !== undefined) policy.limitAmount = Number(updates.limitAmount);
    if (updates.currency) policy.currency = updates.currency;
    if (updates.merchantList) policy.merchantList = updates.merchantList;
    if (updates.isWhitelist !== undefined) policy.isWhitelist = updates.isWhitelist;
    if (updates.severity) policy.severity = updates.severity;
    if (updates.requiresJustification !== undefined) policy.requiresJustification = updates.requiresJustification;
    if (updates.active !== undefined) policy.active = updates.active;

    await policy.save();

    return res.json({ success: true, policy });
  } catch (error) {
    console.error('Error updating policy:', error);
    return res.status(500).json({ error: 'Failed to update policy.' });
  }
};

/**
 * Soft delete an expense policy
 */
exports.deletePolicy = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const policy = await ExpensePolicy.findOne({ _id: id, organizationId: orgId });
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found.' });
    }

    policy.deletedAt = new Date();
    policy.active = false;
    await policy.save();

    return res.json({ success: true, message: 'Policy deleted successfully.' });
  } catch (error) {
    console.error('Error deleting policy:', error);
    return res.status(500).json({ error: 'Failed to delete policy.' });
  }
};
