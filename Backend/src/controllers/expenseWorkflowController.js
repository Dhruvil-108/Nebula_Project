const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const Delegation = require('../models/Delegation');
const CostCenter = require('../models/CostCenter');
const Project = require('../models/Project');

// ── Workflows CRUD ──

exports.getWorkflows = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const workflows = await ApprovalWorkflow.find({
      organizationId: orgId,
      deletedAt: null,
    })
      .populate('conditions.departmentIds', 'name')
      .populate('conditions.categoryIds', 'name icon color')
      .populate('steps.specificUserId', 'fullName email')
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return res.json({ success: true, workflows });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return res.status(500).json({ error: 'Failed to fetch workflows.' });
  }
};

exports.createWorkflow = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { name, description, isDefault, conditions, autoApproveBelow, steps } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Workflow name is required.' });
    }

    if (isDefault) {
      // Unmark any previous default
      await ApprovalWorkflow.updateMany({ organizationId: orgId, isDefault: true }, { isDefault: false });
    }

    const workflow = await ApprovalWorkflow.create({
      organizationId: orgId,
      name: name.trim(),
      description: description ? description.trim() : '',
      isDefault: Boolean(isDefault),
      conditions: conditions || {},
      autoApproveBelow: Number(autoApproveBelow || 0),
      steps: Array.isArray(steps) ? steps : [],
      active: true,
    });

    return res.status(201).json({ success: true, workflow });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return res.status(500).json({ error: error.message || 'Failed to create workflow.' });
  }
};

exports.updateWorkflow = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;
    const updates = req.body;

    const workflow = await ApprovalWorkflow.findOne({ _id: id, organizationId: orgId, deletedAt: null });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found.' });
    }

    if (updates.isDefault && !workflow.isDefault) {
      await ApprovalWorkflow.updateMany({ organizationId: orgId, isDefault: true }, { isDefault: false });
    }

    if (updates.name) workflow.name = updates.name.trim();
    if (updates.description !== undefined) workflow.description = updates.description.trim();
    if (updates.isDefault !== undefined) workflow.isDefault = updates.isDefault;
    if (updates.conditions) workflow.conditions = updates.conditions;
    if (updates.autoApproveBelow !== undefined) workflow.autoApproveBelow = Number(updates.autoApproveBelow);
    if (updates.steps) workflow.steps = updates.steps;
    if (updates.active !== undefined) workflow.active = updates.active;

    await workflow.save();

    return res.json({ success: true, workflow });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return res.status(500).json({ error: 'Failed to update workflow.' });
  }
};

// ── Out-of-Office Delegations ──

exports.getDelegations = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;

    // Return delegations where user is delegator or delegatee (or admin seeing all)
    const filter = { organizationId: orgId };
    if (!['super_admin', 'admin', 'finance'].includes(user.role)) {
      filter.$or = [{ fromUserId: user._id }, { toUserId: user._id }];
    }

    const delegations = await Delegation.find(filter)
      .populate('fromUserId', 'fullName email')
      .populate('toUserId', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, delegations });
  } catch (error) {
    console.error('Error fetching delegations:', error);
    return res.status(500).json({ error: 'Failed to fetch delegations.' });
  }
};

exports.createDelegation = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { toUserId, startsAt, endsAt, scope, reason } = req.body;

    if (!toUserId) {
      return res.status(400).json({ error: 'Delegatee colleague is required.' });
    }
    if (!startsAt || !endsAt) {
      return res.status(400).json({ error: 'Start and end dates are required.' });
    }

    if (toUserId.toString() === user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delegate to yourself.' });
    }

    const delegation = await Delegation.create({
      organizationId: orgId,
      fromUserId: user._id,
      toUserId,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      scope: scope || 'expenses_only',
      reason: reason ? reason.trim() : '',
      active: true,
    });

    const populated = await Delegation.findById(delegation._id)
      .populate('fromUserId', 'fullName email')
      .populate('toUserId', 'fullName email');

    return res.status(201).json({ success: true, delegation: populated });
  } catch (error) {
    console.error('Error creating delegation:', error);
    return res.status(500).json({ error: 'Failed to create delegation.' });
  }
};

exports.deleteDelegation = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { id } = req.params;

    const delegation = await Delegation.findOne({ _id: id, organizationId: orgId });
    if (!delegation) {
      return res.status(404).json({ error: 'Delegation not found.' });
    }

    const isOwner = delegation.fromUserId.toString() === user._id.toString();
    const isAdmin = ['super_admin', 'admin'].includes(user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to revoke this delegation.' });
    }

    delegation.active = false;
    await delegation.save();

    return res.json({ success: true, message: 'Delegation revoked successfully.' });
  } catch (error) {
    console.error('Error revoking delegation:', error);
    return res.status(500).json({ error: 'Failed to revoke delegation.' });
  }
};

// ── Cost Centers & Projects ──

exports.getCostCenters = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const costCenters = await CostCenter.find({ organizationId: orgId, active: true })
      .populate('departmentId', 'name')
      .populate('ownerId', 'fullName email')
      .sort({ code: 1 })
      .lean();

    return res.json({ success: true, costCenters });
  } catch (error) {
    console.error('Error fetching cost centers:', error);
    return res.status(500).json({ error: 'Failed to fetch cost centers.' });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const projects = await Project.find({ organizationId: orgId, active: true })
      .populate('crmAccountId', 'name')
      .populate('ownerId', 'fullName email')
      .sort({ code: 1 })
      .lean();

    return res.json({ success: true, projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ error: 'Failed to fetch projects.' });
  }
};
