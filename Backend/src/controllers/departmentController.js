const mongoose = require('mongoose');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const { scopedFilter } = require('../middleware/tenant');

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/departments
// ─────────────────────────────────────────────────────────
const getDepartments = async (req, res) => {
  try {
    const { search } = req.query;
    const extra = {};
    if (search && String(search).trim()) {
      const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
      extra.$or = [{ name: rx }, { description: rx }];
    }

    const departments = await Department.find(scopedFilter(req, extra))
      .populate('headId', 'fullName employeeCode designation')
      .sort({ name: 1 })
      .limit(500)
      .lean();

    // Attach headcounts in one aggregation
    const counts = await Employee.aggregate([
      { $match: { organizationId: req.organizationId, departmentId: { $ne: null } } },
      { $group: { _id: '$departmentId', headcount: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id.toString(), c.headcount]));

    return res.json(
      departments.map((d) => ({
        ...d,
        headcount: countMap.get(d._id.toString()) || 0,
      }))
    );
  } catch (err) {
    console.error('[departmentController.getDepartments] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve departments.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/hr/departments
// ─────────────────────────────────────────────────────────
const createDepartment = async (req, res) => {
  try {
    const { name, headId, description } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Department name is required.' });
    }
    if (headId && !mongoose.Types.ObjectId.isValid(headId)) {
      return res.status(400).json({ error: 'Invalid head id.' });
    }

    const existing = await Department.findOne(scopedFilter(req, { name: String(name).trim() })).lean();
    if (existing) {
      return res.status(409).json({ error: `Department "${String(name).trim()}" already exists.` });
    }

    if (headId) {
      const head = await Employee.findOne(scopedFilter(req, { _id: headId })).lean();
      if (!head) return res.status(404).json({ error: 'Department head not found.' });
    }

    const department = await Department.create({
      organizationId: req.organizationId,
      name: String(name).trim(),
      headId: headId || null,
      description: description ? String(description).trim() : '',
    });

    return res.status(201).json({ ...department.toObject(), headcount: 0 });
  } catch (err) {
    console.error('[departmentController.createDepartment] Error:', err);
    return res.status(500).json({ error: 'Failed to create department.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/departments/:id — detail + members
// ─────────────────────────────────────────────────────────
const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid department id.' });
    }

    const department = await Department.findOne(scopedFilter(req, { _id: id }))
      .populate('headId', 'fullName employeeCode designation')
      .lean();

    if (!department) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    const members = await Employee.find(scopedFilter(req, { departmentId: department._id }))
      .populate('userId', 'fullName email role')
      .sort({ fullName: 1 })
      .limit(500)
      .lean();

    return res.json({
      ...department,
      headcount: members.length,
      members: members.map((m) => ({
        _id: m._id,
        employeeCode: m.employeeCode,
        fullName: m.fullName,
        designation: m.designation,
        employmentType: m.employmentType,
        status: m.status,
        email: m.email || m.userId?.email || '',
      })),
    });
  } catch (err) {
    console.error('[departmentController.getDepartmentById] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve department.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/hr/departments/:id
// ─────────────────────────────────────────────────────────
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid department id.' });
    }

    const allowedFields = ['name', 'headId', 'description'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] =
          typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
      }
    }
    if (updates.headId === '') updates.headId = null;
    if (updates.headId) {
      if (!mongoose.Types.ObjectId.isValid(updates.headId)) {
        return res.status(400).json({ error: 'Invalid head id.' });
      }
      const head = await Employee.findOne(scopedFilter(req, { _id: updates.headId })).lean();
      if (!head) return res.status(404).json({ error: 'Department head not found.' });
    }

    const department = await Department.findOneAndUpdate(
      scopedFilter(req, { _id: id }),
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('headId', 'fullName employeeCode designation')
      .lean();

    if (!department) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    const headcount = await Employee.countDocuments(
      scopedFilter(req, { departmentId: department._id })
    );

    return res.json({ ...department, headcount });
  } catch (err) {
    console.error('[departmentController.updateDepartment] Error:', err);
    return res.status(500).json({ error: 'Failed to update department.' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/hr/departments/:id
// ─────────────────────────────────────────────────────────
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid department id.' });
    }

    const memberCount = await Employee.countDocuments(scopedFilter(req, { departmentId: id }));
    if (memberCount > 0) {
      return res.status(400).json({
        error: `Cannot delete this department — ${memberCount} employee(s) are still assigned to it. Reassign them first.`,
      });
    }

    const department = await Department.findOneAndDelete(scopedFilter(req, { _id: id }));
    if (!department) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    return res.json({ message: 'Department deleted successfully.' });
  } catch (err) {
    console.error('[departmentController.deleteDepartment] Error:', err);
    return res.status(500).json({ error: 'Failed to delete department.' });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
