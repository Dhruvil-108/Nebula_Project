const Designation = require('../models/Designation');
const Employee = require('../models/Employee');
const { logAuditEvent } = require('../services/auditService');

const canManage = (role) => ['super_admin', 'admin', 'hr'].includes(role);

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/designations
// ─────────────────────────────────────────────────────────
const getDesignations = async (req, res) => {
  try {
    const { departmentId } = req.query;
    const filter = { organizationId: req.organizationId };
    if (departmentId) {
      filter.departmentId = departmentId;
    }

    const designations = await Designation.find(filter)
      .populate('departmentId', 'name')
      .sort({ gradeLevel: 1, title: 1 })
      .lean();

    // Populate headcount per designation
    const listWithCount = await Promise.all(
      designations.map(async (d) => {
        const headcount = await Employee.countDocuments({
          organizationId: req.organizationId,
          $or: [{ designationId: d._id }, { designation: d.title }],
          status: 'active',
        });
        return { ...d, headcount };
      })
    );

    return res.json(listWithCount);
  } catch (err) {
    console.error('[designation.getDesignations] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve designations.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/hr/designations
// ─────────────────────────────────────────────────────────
const createDesignation = async (req, res) => {
  try {
    if (!canManage(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only admins and HR can create designations.' });
    }

    const { title, code, gradeLevel, departmentId, description, minExperienceYears } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Designation title is required.' });
    }
    if (!code || !String(code).trim()) {
      return res.status(400).json({ error: 'Designation code is required.' });
    }

    const existing = await Designation.findOne({
      organizationId: req.organizationId,
      code: String(code).trim().toUpperCase(),
    }).lean();
    if (existing) {
      return res.status(409).json({ error: `Designation code "${code.trim().toUpperCase()}" already exists.` });
    }

    const designation = await Designation.create({
      organizationId: req.organizationId,
      title: String(title).trim(),
      code: String(code).trim().toUpperCase(),
      gradeLevel: gradeLevel || 'L2',
      departmentId: departmentId || null,
      description: description ? String(description).trim() : '',
      minExperienceYears: Number(minExperienceYears) || 0,
      isActive: true,
    });

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'designation.created',
      entityType: 'Designation',
      entityId: designation._id,
      after: designation.toObject(),
      req,
    });

    const populated = await Designation.findById(designation._id)
      .populate('departmentId', 'name')
      .lean();

    return res.status(201).json(populated);
  } catch (err) {
    console.error('[designation.createDesignation] Error:', err);
    return res.status(500).json({ error: 'Failed to create designation.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/hr/designations/:id
// ─────────────────────────────────────────────────────────
const updateDesignation = async (req, res) => {
  try {
    if (!canManage(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only admins and HR can update designations.' });
    }

    const { id } = req.params;
    const patch = req.body;

    if (patch.code) {
      patch.code = String(patch.code).trim().toUpperCase();
      const existing = await Designation.findOne({
        _id: { $ne: id },
        organizationId: req.organizationId,
        code: patch.code,
      }).lean();
      if (existing) {
        return res.status(409).json({ error: `Designation with code "${patch.code}" already exists.` });
      }
    }

    const designation = await Designation.findOneAndUpdate(
      { _id: id, organizationId: req.organizationId },
      { $set: patch },
      { new: true }
    ).populate('departmentId', 'name');

    if (!designation) {
      return res.status(404).json({ error: 'Designation not found.' });
    }

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'designation.updated',
      entityType: 'Designation',
      entityId: id,
      after: patch,
      req,
    });

    return res.json(designation.toObject());
  } catch (err) {
    console.error('[designation.updateDesignation] Error:', err);
    return res.status(500).json({ error: 'Failed to update designation.' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/hr/designations/:id
// ─────────────────────────────────────────────────────────
const deleteDesignation = async (req, res) => {
  try {
    if (!canManage(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only admins and HR can delete designations.' });
    }

    const { id } = req.params;
    const deleted = await Designation.findOneAndDelete({
      _id: id,
      organizationId: req.organizationId,
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Designation not found.' });
    }

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'designation.deleted',
      entityType: 'Designation',
      entityId: id,
      before: deleted.toObject(),
      req,
    });

    return res.json({ message: 'Designation deleted successfully.' });
  } catch (err) {
    console.error('[designation.deleteDesignation] Error:', err);
    return res.status(500).json({ error: 'Failed to delete designation.' });
  }
};

module.exports = {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
};
