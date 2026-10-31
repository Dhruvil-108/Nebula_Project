const mongoose = require('mongoose');
const Shift = require('../models/Shift');
const EmployeeShift = require('../models/EmployeeShift');
const Employee = require('../models/Employee');
const Organization = require('../models/Organization');
const { logAuditEvent } = require('../services/auditService');

/**
 * Helper to ensure a default shift exists for the tenant
 */
async function ensureDefaultShift(organizationId) {
  let defaultShift = await Shift.findOne({ organizationId, isDefault: true }).lean();
  if (!defaultShift) {
    const org = await Organization.findById(organizationId).select('shiftStartTime').lean();
    defaultShift = await Shift.create({
      organizationId,
      name: 'General Shift',
      code: 'GEN-01',
      startTime: org?.shiftStartTime || '09:30',
      endTime: '18:30',
      graceMinutes: 15,
      halfDayMinutes: 270,
      fullDayMinutes: 480,
      workWeekDays: [1, 2, 3, 4, 5],
      isNightShift: false,
      breakDurationMinutes: 60,
      color: '#f97316',
      isDefault: true,
      isActive: true,
    });
  }
  return defaultShift;
}

/**
 * GET /api/v1/hr/shifts
 */
const getShifts = async (req, res) => {
  try {
    let shifts = await Shift.find({ organizationId: req.organizationId }).sort({ isDefault: -1, name: 1 }).lean();
    if (shifts.length === 0) {
      const def = await ensureDefaultShift(req.organizationId);
      shifts = [def];
    }
    return res.json(shifts);
  } catch (err) {
    console.error('[shiftController.getShifts] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve shifts.' });
  }
};

/**
 * POST /api/v1/hr/shifts
 */
const createShift = async (req, res) => {
  try {
    const {
      name,
      code,
      startTime,
      endTime,
      graceMinutes,
      halfDayMinutes,
      fullDayMinutes,
      workWeekDays,
      isNightShift,
      breakDurationMinutes,
      color,
      isDefault,
    } = req.body;

    if (!name || !code || !startTime || !endTime) {
      return res.status(400).json({ error: 'Name, code, start time, and end time are required.' });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const existing = await Shift.findOne({ organizationId: req.organizationId, code: cleanCode });
    if (existing) {
      return res.status(409).json({ error: `Shift with code "${cleanCode}" already exists.` });
    }

    if (isDefault) {
      // Unset previous default
      await Shift.updateMany({ organizationId: req.organizationId }, { $set: { isDefault: false } });
    }

    const shift = await Shift.create({
      organizationId: req.organizationId,
      name: String(name).trim(),
      code: cleanCode,
      startTime: String(startTime).trim(),
      endTime: String(endTime).trim(),
      graceMinutes: graceMinutes !== undefined ? Number(graceMinutes) : 15,
      halfDayMinutes: halfDayMinutes !== undefined ? Number(halfDayMinutes) : 270,
      fullDayMinutes: fullDayMinutes !== undefined ? Number(fullDayMinutes) : 480,
      workWeekDays: Array.isArray(workWeekDays) ? workWeekDays : [1, 2, 3, 4, 5],
      isNightShift: Boolean(isNightShift),
      breakDurationMinutes: breakDurationMinutes !== undefined ? Number(breakDurationMinutes) : 60,
      color: color || '#f97316',
      isDefault: Boolean(isDefault),
      isActive: true,
    });

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'shift.create',
      entityType: 'Shift',
      entityId: shift._id,
      after: shift.toObject(),
      req,
    });

    return res.status(201).json(shift);
  } catch (err) {
    console.error('[shiftController.createShift] Error:', err);
    return res.status(500).json({ error: 'Failed to create shift.' });
  }
};

/**
 * PATCH /api/v1/hr/shifts/:id
 */
const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid shift ID.' });
    }

    const before = await Shift.findOne({ _id: id, organizationId: req.organizationId }).lean();
    if (!before) {
      return res.status(404).json({ error: 'Shift not found.' });
    }

    if (req.body.isDefault) {
      await Shift.updateMany({ organizationId: req.organizationId }, { $set: { isDefault: false } });
    }

    const allowed = [
      'name',
      'startTime',
      'endTime',
      'graceMinutes',
      'halfDayMinutes',
      'fullDayMinutes',
      'workWeekDays',
      'isNightShift',
      'breakDurationMinutes',
      'color',
      'isDefault',
      'isActive',
    ];

    const updateData = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    const updated = await Shift.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'shift.update',
      entityType: 'Shift',
      entityId: id,
      before,
      after: updated,
      req,
    });

    return res.json(updated);
  } catch (err) {
    console.error('[shiftController.updateShift] Error:', err);
    return res.status(500).json({ error: 'Failed to update shift.' });
  }
};

/**
 * DELETE /api/v1/hr/shifts/:id
 */
const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid shift ID.' });
    }

    const shift = await Shift.findOne({ _id: id, organizationId: req.organizationId });
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found.' });
    }
    if (shift.isDefault) {
      return res.status(400).json({ error: 'Cannot delete the default organization shift.' });
    }

    // Check if shift is assigned
    const assignedCount = await EmployeeShift.countDocuments({
      organizationId: req.organizationId,
      shiftId: id,
    });

    if (assignedCount > 0) {
      return res.status(400).json({
        error: `Cannot delete: Shift is currently assigned to ${assignedCount} employee roster(s). Reassign them first.`,
      });
    }

    await Shift.findByIdAndDelete(id);

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'shift.delete',
      entityType: 'Shift',
      entityId: id,
      before: shift.toObject(),
      req,
    });

    return res.json({ message: 'Shift deleted successfully.' });
  } catch (err) {
    console.error('[shiftController.deleteShift] Error:', err);
    return res.status(500).json({ error: 'Failed to delete shift.' });
  }
};

/**
 * POST /api/v1/hr/shifts/assign
 * Bulk or single assignment
 */
const assignShift = async (req, res) => {
  try {
    const { employeeIds, shiftId, effectiveFrom, effectiveTo } = req.body;

    if (!Array.isArray(employeeIds) || employeeIds.length === 0 || !shiftId || !effectiveFrom) {
      return res.status(400).json({ error: 'employeeIds array, shiftId, and effectiveFrom date are required.' });
    }

    const shift = await Shift.findOne({ _id: shiftId, organizationId: req.organizationId });
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found.' });
    }

    const fromDate = new Date(effectiveFrom);
    const toDate = effectiveTo ? new Date(effectiveTo) : null;

    const createdAssignments = [];

    for (const empId of employeeIds) {
      if (!mongoose.Types.ObjectId.isValid(empId)) continue;

      // Close previous open-ended assignments for this employee
      await EmployeeShift.updateMany(
        {
          organizationId: req.organizationId,
          employeeId: empId,
          effectiveTo: null,
        },
        { $set: { effectiveTo: fromDate } }
      );

      const assignment = await EmployeeShift.create({
        organizationId: req.organizationId,
        employeeId: empId,
        shiftId,
        effectiveFrom: fromDate,
        effectiveTo: toDate,
        assignedBy: req.user._id,
      });

      createdAssignments.push(assignment);
    }

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'shift.assign',
      entityType: 'EmployeeShift',
      entityId: shiftId,
      metadata: {
        assignedEmployeesCount: createdAssignments.length,
        shiftCode: shift.code,
        effectiveFrom,
      },
      req,
    });

    return res.status(201).json({
      message: `Shift ${shift.name} successfully assigned to ${createdAssignments.length} employee(s).`,
      count: createdAssignments.length,
    });
  } catch (err) {
    console.error('[shiftController.assignShift] Error:', err);
    return res.status(500).json({ error: 'Failed to assign shift.' });
  }
};

/**
 * GET /api/v1/hr/shifts/active/:employeeId
 */
const getActiveShiftForEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const now = new Date();

    let assignment = await EmployeeShift.findOne({
      organizationId: req.organizationId,
      employeeId,
      effectiveFrom: { $lte: now },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gte: now } }],
    })
      .populate('shiftId')
      .sort({ effectiveFrom: -1 })
      .lean();

    if (assignment && assignment.shiftId) {
      return res.json(assignment.shiftId);
    }

    const def = await ensureDefaultShift(req.organizationId);
    return res.json(def);
  } catch (err) {
    console.error('[shiftController.getActiveShiftForEmployee] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve active shift.' });
  }
};

module.exports = {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
  assignShift,
  getActiveShiftForEmployee,
  ensureDefaultShift,
};
