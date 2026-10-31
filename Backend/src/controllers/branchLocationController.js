const BranchLocation = require('../models/BranchLocation');
const Employee = require('../models/Employee');
const { logAuditEvent } = require('../services/auditService');

const canManage = (role) => ['super_admin', 'admin', 'hr'].includes(role);

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/branches
// ─────────────────────────────────────────────────────────
const getBranches = async (req, res) => {
  try {
    const branches = await BranchLocation.find({ organizationId: req.organizationId })
      .sort({ isHeadquarters: -1, name: 1 })
      .lean();

    // Populate headcount per branch
    const branchesWithCount = await Promise.all(
      branches.map(async (b) => {
        const headcount = await Employee.countDocuments({
          organizationId: req.organizationId,
          branchId: b._id,
          status: 'active',
        });
        return { ...b, headcount };
      })
    );

    return res.json(branchesWithCount);
  } catch (err) {
    console.error('[branch.getBranches] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve branches.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/hr/branches
// ─────────────────────────────────────────────────────────
const createBranch = async (req, res) => {
  try {
    if (!canManage(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only admins and HR can create branch locations.' });
    }

    const { name, code, address, city, state, country, timezone, isHeadquarters } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Branch name is required.' });
    }
    if (!code || !String(code).trim()) {
      return res.status(400).json({ error: 'Branch code is required.' });
    }

    const existing = await BranchLocation.findOne({
      organizationId: req.organizationId,
      code: String(code).trim().toUpperCase(),
    }).lean();
    if (existing) {
      return res.status(409).json({ error: `Branch with code "${code.trim().toUpperCase()}" already exists.` });
    }

    // If marked as HQ, unmark existing HQ
    if (isHeadquarters) {
      await BranchLocation.updateMany(
        { organizationId: req.organizationId, isHeadquarters: true },
        { $set: { isHeadquarters: false } }
      );
    }

    const branch = await BranchLocation.create({
      organizationId: req.organizationId,
      name: String(name).trim(),
      code: String(code).trim().toUpperCase(),
      address: address ? String(address).trim() : '',
      city: city ? String(city).trim() : '',
      state: state ? String(state).trim() : '',
      country: country ? String(country).trim() : 'India',
      timezone: timezone ? String(timezone).trim() : 'Asia/Kolkata',
      isHeadquarters: Boolean(isHeadquarters),
      isActive: true,
    });

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'branch.created',
      entityType: 'BranchLocation',
      entityId: branch._id,
      after: branch.toObject(),
      req,
    });

    return res.status(201).json(branch.toObject());
  } catch (err) {
    console.error('[branch.createBranch] Error:', err);
    return res.status(500).json({ error: 'Failed to create branch.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/hr/branches/:id
// ─────────────────────────────────────────────────────────
const updateBranch = async (req, res) => {
  try {
    if (!canManage(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only admins and HR can update branch locations.' });
    }

    const { id } = req.params;
    const patch = req.body;

    if (patch.code) {
      patch.code = String(patch.code).trim().toUpperCase();
      const existing = await BranchLocation.findOne({
        _id: { $ne: id },
        organizationId: req.organizationId,
        code: patch.code,
      }).lean();
      if (existing) {
        return res.status(409).json({ error: `Branch with code "${patch.code}" already exists.` });
      }
    }

    if (patch.isHeadquarters) {
      await BranchLocation.updateMany(
        { _id: { $ne: id }, organizationId: req.organizationId, isHeadquarters: true },
        { $set: { isHeadquarters: false } }
      );
    }

    const branch = await BranchLocation.findOneAndUpdate(
      { _id: id, organizationId: req.organizationId },
      { $set: patch },
      { new: true }
    );

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found.' });
    }

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'branch.updated',
      entityType: 'BranchLocation',
      entityId: id,
      after: patch,
      req,
    });

    return res.json(branch.toObject());
  } catch (err) {
    console.error('[branch.updateBranch] Error:', err);
    return res.status(500).json({ error: 'Failed to update branch.' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/hr/branches/:id
// ─────────────────────────────────────────────────────────
const deleteBranch = async (req, res) => {
  try {
    if (!canManage(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only admins and HR can delete branch locations.' });
    }

    const { id } = req.params;

    // Check if any employees assigned
    const assignedCount = await Employee.countDocuments({
      organizationId: req.organizationId,
      branchId: id,
    });
    if (assignedCount > 0) {
      return res.status(400).json({
        error: `Cannot delete branch with ${assignedCount} assigned employee(s). Please reassign them first.`,
      });
    }

    const deleted = await BranchLocation.findOneAndDelete({
      _id: id,
      organizationId: req.organizationId,
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Branch not found.' });
    }

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'branch.deleted',
      entityType: 'BranchLocation',
      entityId: id,
      before: deleted.toObject(),
      req,
    });

    return res.json({ message: 'Branch location deleted successfully.' });
  } catch (err) {
    console.error('[branch.deleteBranch] Error:', err);
    return res.status(500).json({ error: 'Failed to delete branch.' });
  }
};

module.exports = {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
};
