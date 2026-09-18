const mongoose = require('mongoose');
const LeaveType = require('../models/LeaveType');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveRequest = require('../models/LeaveRequest');
const AttendanceRecord = require('../models/AttendanceRecord');
const Organization = require('../models/Organization');
const {
  ensureLeaveBalancesForEmployee,
  getDayMidnightUtc,
} = require('../utils/attendanceUtils');

/** Org timezone for day-boundary math (mirrors hrAttendanceController) */
const getOrgTimezone = async (organizationId) => {
  const org = await Organization.findById(organizationId).select('timezone').lean();
  return org?.timezone || 'Asia/Kolkata';
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/leaves/balance
// ─────────────────────────────────────────────────────────
const getLeaveBalances = async (req, res) => {
  try {
    const { organizationId } = req;
    const employeeId = req.user._id;
    const year = parseInt(req.query.year, 10) || new Date().getUTCFullYear();

    await ensureLeaveBalancesForEmployee(organizationId, employeeId, year);

    const balances = await LeaveBalance.find({
      organizationId,
      employeeId,
      year,
    })
      .populate('leaveTypeId', 'name annualQuota carryForward')
      .lean();

    const formatted = balances.map((b) => ({
      id: b._id.toString(),
      leaveTypeId: b.leaveTypeId?._id?.toString() || b.leaveTypeId?.toString(),
      leaveType: b.leaveTypeId?.name || 'Leave',
      allocated: b.allocated || 0,
      used: b.used || 0,
      remaining: Math.max(0, (b.allocated || 0) - (b.used || 0)),
      year: b.year,
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('[leave.getLeaveBalances] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve leave balances.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/leaves/requests
// ─────────────────────────────────────────────────────────
const createLeaveRequest = async (req, res) => {
  try {
    const { organizationId } = req;
    const employeeId = req.user._id;
    const { leaveTypeId, startDate, endDate, reason } = req.body;

    if (!leaveTypeId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Leave type, start date, and end date are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid start or end date.' });
    }

    if (end < start) {
      return res.status(400).json({ error: 'End date cannot be earlier than start date.' });
    }

    // Calculate inclusive total calendar days
    const diffMs = end.getTime() - start.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    // Verify leave type exists
    const leaveType = await LeaveType.findOne({ _id: leaveTypeId, organizationId });
    if (!leaveType) {
      return res.status(404).json({ error: 'Selected leave type not found.' });
    }

    // Verify leave balance (for quota-based leave types)
    const year = start.getUTCFullYear();
    await ensureLeaveBalancesForEmployee(organizationId, employeeId, year);

    const balance = await LeaveBalance.findOne({
      organizationId,
      employeeId,
      leaveTypeId,
      year,
    });

    if (leaveType.annualQuota > 0 && balance) {
      const remaining = Math.max(0, balance.allocated - balance.used);
      if (totalDays > remaining) {
        return res.status(400).json({
          error: `Insufficient leave balance. You requested ${totalDays} day(s), but only have ${remaining} day(s) remaining for ${leaveType.name}.`,
        });
      }
    }

    const leaveRequest = await LeaveRequest.create({
      organizationId,
      employeeId,
      leaveTypeId,
      startDate: start,
      endDate: end,
      totalDays,
      reason: reason ? String(reason).trim() : '',
      status: 'pending',
    });

    const populated = await LeaveRequest.findById(leaveRequest._id)
      .populate('leaveTypeId', 'name annualQuota')
      .lean();

    return res.status(201).json({
      message: 'Leave request submitted successfully.',
      leaveRequest: populated,
    });
  } catch (err) {
    console.error('[leave.createLeaveRequest] Error:', err);
    return res.status(500).json({ error: 'Failed to submit leave request.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/leaves/requests/:id/approve
// ─────────────────────────────────────────────────────────
const approveLeaveRequest = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const leaveRequest = await LeaveRequest.findOne({ _id: id, organizationId });
    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    // Only pending requests can be approved (a rejected request must be re-submitted)
    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        error: `Cannot approve a request that is already ${leaveRequest.status}.`,
      });
    }

    const year = new Date(leaveRequest.startDate).getUTCFullYear();

    // 1. Enforce balance ceiling so used never exceeds allocated
    await ensureLeaveBalancesForEmployee(organizationId, leaveRequest.employeeId, year);
    const leaveType = await LeaveType.findById(leaveRequest.leaveTypeId).lean();
    if (leaveType && leaveType.annualQuota > 0) {
      const balance = await LeaveBalance.findOne({
        organizationId,
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
        year,
      }).lean();
      const remaining = balance ? Math.max(0, (balance.allocated || 0) - (balance.used || 0)) : 0;
      if (leaveRequest.totalDays > remaining) {
        return res.status(400).json({
          error: `Cannot approve — the employee only has ${remaining} day(s) remaining for ${leaveType.name}, but this request needs ${leaveRequest.totalDays}.`,
        });
      }
    }

    // 2. Atomically increment LeaveBalance used count
    await LeaveBalance.findOneAndUpdate(
      {
        organizationId,
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
        year,
      },
      { $inc: { used: leaveRequest.totalDays } },
      { upsert: true }
    );

    // 3. Mark attendance records for days within the approved range as 'on_leave'
    const timezone = await getOrgTimezone(organizationId);
    const start = new Date(leaveRequest.startDate);
    const end = new Date(leaveRequest.endDate);
    const curr = new Date(start);

    while (curr <= end) {
      const dayMidnight = getDayMidnightUtc(curr, timezone);
      await AttendanceRecord.findOneAndUpdate(
        {
          organizationId,
          employeeId: leaveRequest.employeeId,
          date: dayMidnight,
        },
        {
          $set: {
            status: 'on_leave',
            checkInAt: null,
            checkOutAt: null,
            breaks: [],
            totalWorkedMinutes: 0,
            isLate: false,
          },
        },
        { upsert: true, new: true }
      );
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    // 3. Update LeaveRequest status
    leaveRequest.status = 'approved';
    leaveRequest.reviewedBy = req.user._id;
    await leaveRequest.save();

    return res.status(200).json({
      message: 'Leave request approved successfully.',
      leaveRequest,
    });
  } catch (err) {
    console.error('[leave.approveLeaveRequest] Error:', err);
    return res.status(500).json({ error: 'Failed to approve leave request.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/leaves/requests/:id/reject
// ─────────────────────────────────────────────────────────
const rejectLeaveRequest = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const leaveRequest = await LeaveRequest.findOne({ _id: id, organizationId });
    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        error: `Cannot reject a request that is already ${leaveRequest.status}.`,
      });
    }

    leaveRequest.status = 'rejected';
    leaveRequest.reviewedBy = req.user._id;
    await leaveRequest.save();

    return res.status(200).json({
      message: 'Leave request rejected.',
      leaveRequest,
    });
  } catch (err) {
    console.error('[leave.rejectLeaveRequest] Error:', err);
    return res.status(500).json({ error: 'Failed to reject leave request.' });
  }
};

module.exports = {
  getLeaveBalances,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
};
