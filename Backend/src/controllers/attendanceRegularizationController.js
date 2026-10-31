const mongoose = require('mongoose');
const AttendanceRegularization = require('../models/AttendanceRegularization');
const AttendanceRecord = require('../models/AttendanceRecord');
const Employee = require('../models/Employee');
const Organization = require('../models/Organization');
const { resolveEmployeeFromUser } = require('../utils/employeeUtils');
const { startApproval, actOnStep } = require('../services/approvalWorkflowEngine');
const { logAuditEvent } = require('../services/auditService');
const { getDayMidnightUtc, calculateWorkedMinutes } = require('../utils/attendanceUtils');

const canManageRegularizations = (role) =>
  ['super_admin', 'admin', 'manager', 'hr'].includes(role);

/**
 * GET /api/v1/hr/attendance/regularizations
 */
const getRegularizations = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const filter = { organizationId: req.organizationId };

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    if (employeeId && employeeId !== 'me') {
      if (!canManageRegularizations(req.user.role)) {
        return res.status(403).json({ error: 'Access denied.' });
      }
      filter.employeeId = employeeId;
    } else if (employeeId === 'me' || !canManageRegularizations(req.user.role)) {
      const selfEmp = await resolveEmployeeFromUser(req.organizationId, req.user._id);
      filter.$or = [
        { employeeId: selfEmp._id },
        { userId: req.user._id },
      ];
    }

    const regularizations = await AttendanceRegularization.find(filter)
      .populate('employeeId', 'fullName firstName lastName employeeCode designation departmentId')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json(regularizations);
  } catch (err) {
    console.error('[regularization.getRegularizations] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve regularization requests.' });
  }
};

/**
 * POST /api/v1/hr/attendance/regularizations
 */
const createRegularization = async (req, res) => {
  try {
    const { date, type, requestedCheckInAt, requestedCheckOutAt, reason } = req.body;

    if (!date || !type || !reason) {
      return res.status(400).json({ error: 'Date, type, and reason are required.' });
    }

    const org = await Organization.findById(req.organizationId).select('timezone').lean();
    const timezone = org?.timezone || 'Asia/Kolkata';

    const rawDate = new Date(date);
    if (isNaN(rawDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date.' });
    }
    const dayMidnight = getDayMidnightUtc(rawDate, timezone);

    const employee = await resolveEmployeeFromUser(req.organizationId, req.user._id);

    // Check if an unresolved request already exists for this day
    const existing = await AttendanceRegularization.findOne({
      organizationId: req.organizationId,
      employeeId: employee._id,
      date: dayMidnight,
      status: 'pending',
    });

    if (existing) {
      return res.status(400).json({ error: 'A pending regularization request already exists for this date.' });
    }

    // Locate matching attendance record if exists
    const record = await AttendanceRecord.findOne({
      organizationId: req.organizationId,
      date: dayMidnight,
      $or: [
        { employeeId: employee._id },
        { userId: req.user._id },
      ],
    });

    const reg = await AttendanceRegularization.create({
      organizationId: req.organizationId,
      employeeId: employee._id,
      userId: req.user._id,
      attendanceRecordId: record?._id || null,
      date: dayMidnight,
      type,
      requestedCheckInAt: requestedCheckInAt ? new Date(requestedCheckInAt) : null,
      requestedCheckOutAt: requestedCheckOutAt ? new Date(requestedCheckOutAt) : null,
      reason: String(reason).trim(),
      status: 'pending',
    });

    // Start workflow engine instance
    try {
      const instance = await startApproval({
        organizationId: req.organizationId,
        requestType: 'regularization',
        referenceId: reg._id,
        referenceModel: 'AttendanceRegularization',
        requesterEmployeeId: employee._id,
        requesterUserId: req.user._id,
        metadata: {
          date: dayMidnight,
          type,
          reason,
        },
      });

      reg.approvalInstanceId = instance._id;
      await reg.save();
    } catch (wfErr) {
      console.warn('[regularization.create] Workflow engine warning:', wfErr.message);
    }

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      actorEmployeeId: employee._id,
      action: 'attendance.regularization.request',
      entityType: 'AttendanceRegularization',
      entityId: reg._id,
      after: reg.toObject(),
      req,
    });

    const populated = await AttendanceRegularization.findById(reg._id)
      .populate('employeeId', 'fullName firstName lastName employeeCode')
      .lean();

    return res.status(201).json(populated);
  } catch (err) {
    console.error('[regularization.createRegularization] Error:', err);
    return res.status(500).json({ error: 'Failed to submit regularization request.' });
  }
};

/**
 * PATCH /api/v1/hr/attendance/regularizations/:id/approve
 */
const approveRegularization = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    if (!canManageRegularizations(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only managers and HR can approve regularizations.' });
    }

    const reg = await AttendanceRegularization.findOne({ _id: id, organizationId: req.organizationId });
    if (!reg) {
      return res.status(404).json({ error: 'Regularization request not found.' });
    }
    if (reg.status !== 'pending') {
      return res.status(400).json({ error: `Cannot approve request that is already ${reg.status}.` });
    }

    // Segregation of duties: self-approval prevented
    if (reg.userId && reg.userId.toString() === req.user._id.toString() && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Self-approval is not permitted.' });
    }

    // Update AttendanceRecord
    let record = await AttendanceRecord.findOne({
      organizationId: req.organizationId,
      date: reg.date,
      $or: [
        { employeeId: reg.employeeId },
        { userId: reg.userId },
      ],
    });

    const checkInTime = reg.requestedCheckInAt || record?.checkInAt || new Date(reg.date.getTime() + 9.5 * 3600 * 1000);
    const checkOutTime = reg.requestedCheckOutAt || record?.checkOutAt || new Date(reg.date.getTime() + 18.5 * 3600 * 1000);

    const workedMin = Math.round((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));
    const overtimeMin = Math.max(0, workedMin - 480);

    if (!record) {
      record = await AttendanceRecord.create({
        organizationId: req.organizationId,
        employeeId: reg.employeeId,
        userId: reg.userId,
        date: reg.date,
        checkInAt: checkInTime,
        checkOutAt: checkOutTime,
        breaks: [],
        status: workedMin >= 480 ? 'present' : workedMin >= 270 ? 'half_day' : 'present',
        totalWorkedMinutes: workedMin,
        overtimeMinutes: overtimeMin,
        isLate: false,
        isRegularized: true,
        regularizationId: reg._id,
      });
    } else {
      record.checkInAt = checkInTime;
      record.checkOutAt = checkOutTime;
      record.status = workedMin >= 480 ? 'present' : workedMin >= 270 ? 'half_day' : 'present';
      record.totalWorkedMinutes = workedMin;
      record.overtimeMinutes = overtimeMin;
      record.isLate = false;
      record.isRegularized = true;
      record.regularizationId = reg._id;
      await record.save();
    }

    // Mark regularization approved
    reg.status = 'approved';
    reg.reviewedBy = req.user._id;
    reg.reviewedAt = new Date();
    reg.reviewerComments = comments ? String(comments).trim() : 'Approved';
    reg.attendanceRecordId = record._id;
    await reg.save();

    // Advance workflow engine
    try {
      await actOnStep({
        organizationId: req.organizationId,
        referenceId: id,
        actorUserId: req.user._id,
        actorRole: req.user.role,
        action: 'approved',
        comments: comments || 'Regularization approved',
      });
    } catch (wfErr) {
      console.warn('[regularization.approve] Workflow advance warning:', wfErr.message);
    }

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'attendance.regularization.approved',
      entityType: 'AttendanceRegularization',
      entityId: id,
      before: { status: 'pending' },
      after: { status: 'approved', reviewedBy: req.user._id },
      req,
    });

    const populated = await AttendanceRegularization.findById(id)
      .populate('employeeId', 'fullName firstName lastName employeeCode')
      .populate('reviewedBy', 'fullName')
      .lean();

    return res.json({
      message: 'Attendance regularization approved and record adjusted.',
      regularization: populated,
      attendanceRecord: record,
    });
  } catch (err) {
    console.error('[regularization.approveRegularization] Error:', err);
    return res.status(500).json({ error: 'Failed to approve regularization.' });
  }
};

/**
 * PATCH /api/v1/hr/attendance/regularizations/:id/reject
 */
const rejectRegularization = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    if (!canManageRegularizations(req.user.role)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const reg = await AttendanceRegularization.findOne({ _id: id, organizationId: req.organizationId });
    if (!reg) {
      return res.status(404).json({ error: 'Regularization request not found.' });
    }
    if (reg.status !== 'pending') {
      return res.status(400).json({ error: `Cannot reject request that is already ${reg.status}.` });
    }

    reg.status = 'rejected';
    reg.reviewedBy = req.user._id;
    reg.reviewedAt = new Date();
    reg.reviewerComments = comments ? String(comments).trim() : 'Rejected';
    await reg.save();

    try {
      await actOnStep({
        organizationId: req.organizationId,
        referenceId: id,
        actorUserId: req.user._id,
        actorRole: req.user.role,
        action: 'rejected',
        comments: comments || 'Regularization rejected',
      });
    } catch (wfErr) {
      console.warn('[regularization.reject] Workflow advance warning:', wfErr.message);
    }

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'attendance.regularization.rejected',
      entityType: 'AttendanceRegularization',
      entityId: id,
      before: { status: 'pending' },
      after: { status: 'rejected', reviewedBy: req.user._id },
      req,
    });

    const populated = await AttendanceRegularization.findById(id)
      .populate('employeeId', 'fullName firstName lastName employeeCode')
      .populate('reviewedBy', 'fullName')
      .lean();

    return res.json({ message: 'Regularization rejected.', regularization: populated });
  } catch (err) {
    console.error('[regularization.rejectRegularization] Error:', err);
    return res.status(500).json({ error: 'Failed to reject regularization.' });
  }
};

module.exports = {
  getRegularizations,
  createRegularization,
  approveRegularization,
  rejectRegularization,
};
