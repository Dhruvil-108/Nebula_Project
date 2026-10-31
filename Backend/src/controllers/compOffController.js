const mongoose = require('mongoose');
const CompOffGrant = require('../models/CompOffGrant');
const LeaveType = require('../models/LeaveType');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveLedger = require('../models/LeaveLedger');
const Employee = require('../models/Employee');
const { resolveEmployeeFromUser } = require('../utils/employeeUtils');
const { startApproval, actOnStep } = require('../services/approvalWorkflowEngine');
const { logAuditEvent } = require('../services/auditService');

const isManagement = (role) => ['super_admin', 'admin', 'manager', 'hr'].includes(role);

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/leaves/comp-off
// ─────────────────────────────────────────────────────────
const getCompOffRequests = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const filter = { organizationId: req.organizationId };

    if (isManagement(req.user.role)) {
      if (employeeId && employeeId !== 'me') {
        filter.employeeId = employeeId;
      } else if (employeeId === 'me') {
        const emp = await resolveEmployeeFromUser(req.organizationId, req.user._id);
        filter.employeeId = emp._id;
      }
    } else {
      const emp = await resolveEmployeeFromUser(req.organizationId, req.user._id);
      filter.employeeId = emp._id;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const requests = await CompOffGrant.find(filter)
      .populate('employeeId', 'fullName firstName lastName employeeCode designation departmentId')
      .populate('reviewedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    return res.json(requests);
  } catch (err) {
    console.error('[compOff.getCompOffRequests] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve compensatory off requests.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/hr/leaves/comp-off
// ─────────────────────────────────────────────────────────
const createCompOffRequest = async (req, res) => {
  try {
    const { workDate, overtimeMinutes, grantedDays, reason, attendanceRecordId } = req.body;

    if (!workDate) {
      return res.status(400).json({ error: 'Work date is required.' });
    }
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ error: 'Justification / reason is required.' });
    }

    const mins = Number(overtimeMinutes) || 0;
    if (mins < 60) {
      return res.status(400).json({ error: 'Minimum 60 minutes (1 hour) of overtime required to claim comp-off.' });
    }

    const emp = await resolveEmployeeFromUser(req.organizationId, req.user._id);
    const days = Number(grantedDays) === 0.5 ? 0.5 : 1.0;

    const grant = await CompOffGrant.create({
      organizationId: req.organizationId,
      employeeId: emp._id,
      userId: req.user._id,
      attendanceRecordId: attendanceRecordId || null,
      workDate: new Date(workDate),
      overtimeMinutes: mins,
      grantedDays: days,
      reason: String(reason).trim(),
      status: 'pending',
    });

    // Start workflow tracking
    try {
      const workflow = await startApproval({
        organizationId: req.organizationId,
        requestType: 'compoff',
        referenceId: grant._id,
        requesterUserId: req.user._id,
        metadata: {
          workDate,
          overtimeMinutes: mins,
          grantedDays: days,
          reason,
        },
      });
      if (workflow) {
        grant.approvalInstanceId = workflow._id;
        await grant.save();
      }
    } catch (wfErr) {
      console.warn('[compOff.createCompOffRequest] Workflow error:', wfErr.message);
    }

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'leave.compoff_requested',
      entityType: 'CompOffGrant',
      entityId: grant._id,
      after: { workDate, overtimeMinutes: mins, grantedDays: days, reason },
      req,
    });

    const populated = await CompOffGrant.findById(grant._id)
      .populate('employeeId', 'fullName firstName lastName employeeCode')
      .lean();

    return res.status(201).json(populated);
  } catch (err) {
    console.error('[compOff.createCompOffRequest] Error:', err);
    return res.status(500).json({ error: 'Failed to submit comp-off request.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/hr/leaves/comp-off/:id/approve
// ─────────────────────────────────────────────────────────
const approveCompOff = async (req, res) => {
  try {
    if (!isManagement(req.user.role)) {
      return res.status(403).json({ error: 'Only managers, HR, and admins can approve comp-off requests.' });
    }

    const { id } = req.params;
    const { comments } = req.body;

    const grant = await CompOffGrant.findOne({
      _id: id,
      organizationId: req.organizationId,
    });

    if (!grant) {
      return res.status(404).json({ error: 'Comp-off request not found.' });
    }
    if (grant.status !== 'pending') {
      return res.status(400).json({ error: `Cannot approve request with status "${grant.status}".` });
    }

    // Find or create 'Compensatory Off' LeaveType
    let compLeaveType = await LeaveType.findOne({
      organizationId: req.organizationId,
      $or: [{ code: 'COMP' }, { name: 'Compensatory Off' }],
    });

    if (!compLeaveType) {
      compLeaveType = await LeaveType.create({
        organizationId: req.organizationId,
        name: 'Compensatory Off',
        code: 'COMP',
        annualQuota: 0,
        accrualFrequency: 'none',
        carryForward: false,
        isPaid: true,
        color: '#10b981',
      });
    }

    const currentYear = new Date().getUTCFullYear();

    // Find or create LeaveBalance
    let balance = await LeaveBalance.findOne({
      organizationId: req.organizationId,
      employeeId: grant.employeeId,
      leaveTypeId: compLeaveType._id,
      year: currentYear,
    });

    if (!balance) {
      balance = new LeaveBalance({
        organizationId: req.organizationId,
        employeeId: grant.employeeId,
        userId: grant.userId,
        leaveTypeId: compLeaveType._id,
        year: currentYear,
        allocated: 0,
        used: 0,
      });
    }

    const balBefore = balance.allocated || 0;
    balance.allocated = Math.round((balBefore + grant.grantedDays) * 10) / 10;
    await balance.save();

    // Create ledger transaction
    await LeaveLedger.create({
      organizationId: req.organizationId,
      employeeId: grant.employeeId,
      userId: grant.userId,
      leaveTypeId: compLeaveType._id,
      year: currentYear,
      transactionType: 'credit_compoff',
      days: grant.grantedDays,
      balanceBefore: balBefore,
      balanceAfter: balance.allocated,
      referenceId: grant._id,
      referenceType: 'CompOffGrant',
      notes: `Comp-off approved for ${grant.grantedDays} day(s) against overtime worked on ${new Date(grant.workDate).toISOString().slice(0, 10)}`,
      performedBy: req.user._id,
    });

    grant.status = 'approved';
    grant.reviewedBy = req.user._id;
    grant.reviewedAt = new Date();
    grant.reviewerComments = comments ? String(comments).trim() : 'Comp-off approved';
    await grant.save();

    // Act on workflow
    try {
      await actOnStep({
        organizationId: req.organizationId,
        referenceId: grant._id,
        actorUserId: req.user._id,
        actorRole: req.user.role,
        action: 'approved',
        comments: grant.reviewerComments,
      });
    } catch (wfErr) {
      console.warn('[compOff.approveCompOff] Workflow act error:', wfErr.message);
    }

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'leave.compoff_approved',
      entityType: 'CompOffGrant',
      entityId: grant._id,
      before: { status: 'pending' },
      after: { status: 'approved', grantedDays: grant.grantedDays, reviewerComments: grant.reviewerComments },
      req,
    });

    const populated = await CompOffGrant.findById(grant._id)
      .populate('employeeId', 'fullName firstName lastName employeeCode')
      .populate('reviewedBy', 'fullName')
      .lean();

    return res.json({ message: 'Compensatory off approved and credited to leave balance.', compOff: populated });
  } catch (err) {
    console.error('[compOff.approveCompOff] Error:', err);
    return res.status(500).json({ error: 'Failed to approve comp-off request.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/hr/leaves/comp-off/:id/reject
// ─────────────────────────────────────────────────────────
const rejectCompOff = async (req, res) => {
  try {
    if (!isManagement(req.user.role)) {
      return res.status(403).json({ error: 'Only managers, HR, and admins can reject comp-off requests.' });
    }

    const { id } = req.params;
    const { comments } = req.body;

    const grant = await CompOffGrant.findOne({
      _id: id,
      organizationId: req.organizationId,
    });

    if (!grant) {
      return res.status(404).json({ error: 'Comp-off request not found.' });
    }
    if (grant.status !== 'pending') {
      return res.status(400).json({ error: `Cannot reject request with status "${grant.status}".` });
    }

    grant.status = 'rejected';
    grant.reviewedBy = req.user._id;
    grant.reviewedAt = new Date();
    grant.reviewerComments = comments ? String(comments).trim() : 'Comp-off rejected';
    await grant.save();

    // Act on workflow
    try {
      await actOnStep({
        organizationId: req.organizationId,
        referenceId: grant._id,
        actorUserId: req.user._id,
        actorRole: req.user.role,
        action: 'rejected',
        comments: grant.reviewerComments,
      });
    } catch (wfErr) {
      console.warn('[compOff.rejectCompOff] Workflow act error:', wfErr.message);
    }

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'leave.compoff_rejected',
      entityType: 'CompOffGrant',
      entityId: grant._id,
      before: { status: 'pending' },
      after: { status: 'rejected', reviewerComments: grant.reviewerComments },
      req,
    });

    const populated = await CompOffGrant.findById(grant._id)
      .populate('employeeId', 'fullName firstName lastName employeeCode')
      .populate('reviewedBy', 'fullName')
      .lean();

    return res.json({ message: 'Comp-off request rejected.', compOff: populated });
  } catch (err) {
    console.error('[compOff.rejectCompOff] Error:', err);
    return res.status(500).json({ error: 'Failed to reject comp-off request.' });
  }
};

module.exports = {
  getCompOffRequests,
  createCompOffRequest,
  approveCompOff,
  rejectCompOff,
};
