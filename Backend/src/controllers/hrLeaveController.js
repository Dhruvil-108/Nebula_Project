const mongoose = require('mongoose');
const LeaveType = require('../models/LeaveType');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveRequest = require('../models/LeaveRequest');
const AttendanceRecord = require('../models/AttendanceRecord');
const Employee = require('../models/Employee');
const Organization = require('../models/Organization');
const { scopedFilter } = require('../middleware/tenant');
const {
  ensureLeaveBalancesForEmployee,
  getDayMidnightUtc,
  DEFAULT_LEAVE_TYPES,
} = require('../utils/attendanceUtils');

const canApprove = (role) =>
  ['super_admin', 'admin', 'manager', 'hr'].includes(role);

const canManageTypes = (role) =>
  ['super_admin', 'admin', 'hr'].includes(role);

/**
 * Resolve a ?employeeId= (Employee record id or "me") to the attendance/leave
 * subject id. Records are keyed by the linked User id when one exists
 * (check-in flows use req.user._id), otherwise the Employee record id —
 * a single canonical key prevents duplicate balance rows.
 */
const resolveSubjectIds = async (req, employeeIdParam) => {
  if (!employeeIdParam || employeeIdParam === 'me') {
    return { subjectIds: [req.user._id], self: true };
  }
  if (!canApprove(req.user.role)) {
    return { error: { status: 403, message: 'Access denied. Only managers, HR, and admins can view other employees\' leave data.' } };
  }
  if (!mongoose.Types.ObjectId.isValid(employeeIdParam)) {
    return { error: { status: 400, message: 'Invalid employee id.' } };
  }
  const emp = await Employee.findOne(scopedFilter(req, { _id: employeeIdParam })).lean();
  if (!emp) {
    return { error: { status: 404, message: 'Employee not found.' } };
  }
  // Canonical key: linked User id when present, else the Employee record id
  return { subjectIds: [emp.userId || emp._id] };
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/leaves/types
// ─────────────────────────────────────────────────────────
const getLeaveTypes = async (req, res) => {
  try {
    let types = await LeaveType.find({ organizationId: req.organizationId }).sort({ name: 1 }).lean();
    if (types.length === 0) {
      // Seed defaults on first read (same set the platform uses)
      types = await LeaveType.insertMany(
        DEFAULT_LEAVE_TYPES.map((lt) => ({ ...lt, organizationId: req.organizationId }))
      );
    }
    return res.json(types);
  } catch (err) {
    console.error('[hrLeave.getLeaveTypes] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve leave types.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/hr/leaves/types — admin/HR configures types
// ─────────────────────────────────────────────────────────
const createLeaveType = async (req, res) => {
  try {
    if (!canManageTypes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only admins and HR can configure leave types.' });
    }
    const { name, annualQuota, carryForward } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Leave type name is required.' });
    }
    if (annualQuota !== undefined && (isNaN(Number(annualQuota)) || Number(annualQuota) < 0)) {
      return res.status(400).json({ error: 'Annual quota must be a non-negative number.' });
    }

    const existing = await LeaveType.findOne({
      organizationId: req.organizationId,
      name: String(name).trim(),
    }).lean();
    if (existing) {
      return res.status(409).json({ error: `Leave type "${String(name).trim()}" already exists.` });
    }

    const leaveType = await LeaveType.create({
      organizationId: req.organizationId,
      name: String(name).trim(),
      annualQuota: annualQuota !== undefined ? Number(annualQuota) : 0,
      carryForward: Boolean(carryForward),
    });

    return res.status(201).json(leaveType.toObject());
  } catch (err) {
    console.error('[hrLeave.createLeaveType] Error:', err);
    return res.status(500).json({ error: 'Failed to create leave type.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/leaves/balance?employeeId=&year=
// ─────────────────────────────────────────────────────────
const getLeaveBalances = async (req, res) => {
  try {
    const resolved = await resolveSubjectIds(req, req.query.employeeId);
    if (resolved.error) {
      return res.status(resolved.error.status).json({ error: resolved.error.message });
    }
    const { subjectIds } = resolved;
    const year = parseInt(req.query.year, 10) || new Date().getUTCFullYear();

    // Balances may exist keyed by Employee._id or User id — check both
    let balances = await LeaveBalance.find({
      organizationId: req.organizationId,
      employeeId: { $in: subjectIds },
      year,
    })
      .populate('leaveTypeId', 'name annualQuota carryForward')
      .lean();

    if (balances.length === 0) {
      // Seed on first read
      const employeeId = subjectIds[0];
      await ensureLeaveBalancesForEmployee(req.organizationId, employeeId, year);
      balances = await LeaveBalance.find({
        organizationId: req.organizationId,
        employeeId,
        year,
      })
        .populate('leaveTypeId', 'name annualQuota carryForward')
        .lean();
    }

    return res.json(
      balances.map((b) => ({
        _id: b._id,
        leaveTypeId: b.leaveTypeId?._id?.toString() || b.leaveTypeId?.toString(),
        leaveType: b.leaveTypeId?.name || 'Leave',
        allocated: b.allocated || 0,
        used: b.used || 0,
        remaining: Math.max(0, (b.allocated || 0) - (b.used || 0)),
        year: b.year,
      }))
    );
  } catch (err) {
    console.error('[hrLeave.getLeaveBalances] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve leave balances.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/leaves/requests?status=&employeeId=&from=&to=
// ─────────────────────────────────────────────────────────
const getLeaveRequests = async (req, res) => {
  try {
    const { status, employeeId, from, to } = req.query;
    const extra = {};

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      extra.status = status;
    }
    if (from || to) {
      extra.startDate = {};
      if (from) {
        const f = new Date(from);
        if (isNaN(f.getTime())) return res.status(400).json({ error: 'Invalid from date.' });
        extra.startDate.$gte = f;
      }
      if (to) {
        const t = new Date(to);
        if (isNaN(t.getTime())) return res.status(400).json({ error: 'Invalid to date.' });
        extra.startDate.$lte = t;
      }
    }

    if (employeeId && employeeId !== 'me') {
      const resolved = await resolveSubjectIds(req, employeeId);
      if (resolved.error) {
        return res.status(resolved.error.status).json({ error: resolved.error.message });
      }
      extra.employeeId = { $in: resolved.subjectIds };
    } else if (employeeId === 'me' || !canApprove(req.user.role)) {
      // Explicit "me" (or a non-approver without a filter) scopes STRICTLY to
      // the signed-in account. Approvers who omit employeeId get the whole
      // org's requests — that wider view is for the Approvals screen only.
      extra.employeeId = req.user._id;
    }

    const requests = await LeaveRequest.find({ organizationId: req.organizationId, ...extra })
      .populate('leaveTypeId', 'name')
      .populate('employeeId', 'fullName employeeCode designation')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.json(requests);
  } catch (err) {
    console.error('[hrLeave.getLeaveRequests] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve leave requests.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/hr/leaves/requests
// ─────────────────────────────────────────────────────────
const createLeaveRequest = async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, reason } = req.body;
    if (!leaveTypeId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Leave type, start date, and end date are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(leaveTypeId)) {
      return res.status(400).json({ error: 'Invalid leave type id.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid start or end date.' });
    }
    if (end < start) {
      return res.status(400).json({ error: 'End date cannot be earlier than start date.' });
    }

    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const leaveType = await LeaveType.findOne({ _id: leaveTypeId, organizationId: req.organizationId }).lean();
    if (!leaveType) {
      return res.status(404).json({ error: 'Selected leave type not found.' });
    }

    const employeeId = req.user._id;
    const year = start.getUTCFullYear();
    await ensureLeaveBalancesForEmployee(req.organizationId, employeeId, year);

    const balance = await LeaveBalance.findOne({
      organizationId: req.organizationId,
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
      organizationId: req.organizationId,
      employeeId,
      leaveTypeId,
      startDate: start,
      endDate: end,
      totalDays,
      reason: reason ? String(reason).trim() : '',
      status: 'pending',
    });

    const populated = await LeaveRequest.findById(leaveRequest._id)
      .populate('leaveTypeId', 'name')
      .lean();

    return res.status(201).json(populated);
  } catch (err) {
    console.error('[hrLeave.createLeaveRequest] Error:', err);
    return res.status(500).json({ error: 'Failed to submit leave request.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/hr/leaves/requests/:id/approve
// Atomic: balance increment + attendance marking + status flip.
// Transaction first (replica set), sequential fallback (standalone)
// with manual cleanup — mirrors CRM lead conversion.
// ─────────────────────────────────────────────────────────
const approveLeaveRequest = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid leave request id.' });
  }

  const approveOps = async (session) => {
    const opts = session ? { session } : {};
    const request = await LeaveRequest.findOne({ _id: id, organizationId: req.organizationId }).session(session || null);
    if (!request) {
      const e = new Error('Leave request not found.');
      e.status = 404;
      throw e;
    }
    if (request.status !== 'pending') {
      const e = new Error(`Cannot approve a request that is already ${request.status}.`);
      e.status = 400;
      throw e;
    }

    const year = new Date(request.startDate).getUTCFullYear();

    // 1. Enforce balance ceiling so used never exceeds allocated
    const leaveType = await LeaveType.findById(request.leaveTypeId).lean();
    if (leaveType && leaveType.annualQuota > 0) {
      const existingBalance = await LeaveBalance.findOne({
        organizationId: req.organizationId,
        employeeId: request.employeeId,
        leaveTypeId: request.leaveTypeId,
        year,
      }).lean();
      const remaining = existingBalance
        ? Math.max(0, (existingBalance.allocated || 0) - (existingBalance.used || 0))
        : 0;
      if (request.totalDays > remaining) {
        const e = new Error(
          `Cannot approve — only ${remaining} day(s) remaining for ${leaveType.name}, but this request needs ${request.totalDays}.`
        );
        e.status = 400;
        throw e;
      }
    }

    // 2. Increment LeaveBalance.used
    await LeaveBalance.findOneAndUpdate(
      {
        organizationId: req.organizationId,
        employeeId: request.employeeId,
        leaveTypeId: request.leaveTypeId,
        year,
      },
      { $inc: { used: request.totalDays } },
      { ...opts, upsert: true }
    );

    // 3. Mark covered days' attendance as on_leave (org timezone)
    const org = await Organization.findById(req.organizationId).select('timezone').lean();
    const timezone = org?.timezone || 'Asia/Kolkata';
    const coveredIds = [];
    const curr = new Date(request.startDate);
    const end = new Date(request.endDate);
    while (curr <= end) {
      const dayMidnight = getDayMidnightUtc(curr, timezone);
      const rec = await AttendanceRecord.findOneAndUpdate(
        {
          organizationId: req.organizationId,
          employeeId: request.employeeId,
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
        { ...opts, upsert: true, new: true }
      );
      coveredIds.push(rec._id);
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    // 4. Flip the request status
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    await request.save(opts);

    return { request, coveredIds };
  };

  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await approveOps(session);
    await session.commitTransaction();
    session.endSession();

    const populated = await LeaveRequest.findById(result.request._id)
      .populate('leaveTypeId', 'name')
      .populate('employeeId', 'fullName employeeCode')
      .populate('reviewedBy', 'fullName')
      .lean();

    return res.json({ message: 'Leave request approved successfully.', leaveRequest: populated });
  } catch (txErr) {
    if (session) {
      try { await session.abortTransaction(); } catch (_) { /* noop */ }
      try { session.endSession(); } catch (_) { /* noop */ }
    }

    const isNotReplicaSet =
      txErr.codeName === 'IllegalOperation' ||
      txErr.message?.includes('Transaction numbers') ||
      txErr.message?.includes('replica set') ||
      txErr.message?.includes('not supported') ||
      txErr.message?.includes('standalone');

    if (!isNotReplicaSet) {
      console.error('[hrLeave.approveLeaveRequest] Transaction error:', txErr);
      const status = txErr.status || 500;
      return res.status(status).json({ error: txErr.message || 'Failed to approve leave request.' });
    }

    // Standalone fallback with manual cleanup
    console.warn('[hrLeave.approveLeaveRequest] Transactions unsupported — using fallback mode');
    try {
      const request = await LeaveRequest.findOne({ _id: id, organizationId: req.organizationId });
      if (!request) return res.status(404).json({ error: 'Leave request not found.' });
      if (request.status !== 'pending') {
        return res.status(400).json({ error: `Cannot approve a request that is already ${request.status}.` });
      }

      const year = new Date(request.startDate).getUTCFullYear();
      const balance = await LeaveBalance.findOneAndUpdate(
        {
          organizationId: req.organizationId,
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year,
        },
        { $inc: { used: request.totalDays } },
        { upsert: true, new: true }
      );

      const coveredIds = [];
      try {
        const fallbackOrg = await Organization.findById(req.organizationId).select('timezone').lean();
        const fallbackTimezone = fallbackOrg?.timezone || 'Asia/Kolkata';
        const curr = new Date(request.startDate);
        const end = new Date(request.endDate);
        while (curr <= end) {
          const dayMidnight = getDayMidnightUtc(curr, fallbackTimezone);
          const rec = await AttendanceRecord.findOneAndUpdate(
            {
              organizationId: req.organizationId,
              employeeId: request.employeeId,
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
          coveredIds.push(rec._id);
          curr.setUTCDate(curr.getUTCDate() + 1);
        }

        request.status = 'approved';
        request.reviewedBy = req.user._id;
        await request.save();

        const populated = await LeaveRequest.findById(request._id)
          .populate('leaveTypeId', 'name')
          .populate('employeeId', 'fullName employeeCode')
          .populate('reviewedBy', 'fullName')
          .lean();

        return res.json({ message: 'Leave request approved successfully.', leaveRequest: populated });
      } catch (innerErr) {
        // Manual rollback: restore balance and revert covered attendance
        try {
          if (balance) {
            await LeaveBalance.findByIdAndUpdate(balance._id, { $inc: { used: -request.totalDays } });
          }
          for (const recId of coveredIds) {
            await AttendanceRecord.findByIdAndDelete(recId);
          }
        } catch (_) { /* best-effort */ }
        throw innerErr;
      }
    } catch (fallbackErr) {
      console.error('[hrLeave.approveLeaveRequest] Fallback error:', fallbackErr);
      const status = fallbackErr.status || 500;
      return res.status(status).json({ error: fallbackErr.message || 'Failed to approve leave request.' });
    }
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/hr/leaves/requests/:id/reject
// ─────────────────────────────────────────────────────────
const rejectLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid leave request id.' });
    }

    const request = await LeaveRequest.findOne({ _id: id, organizationId: req.organizationId });
    if (!request) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Cannot reject a request that is already ${request.status}.` });
    }

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    await request.save();

    const populated = await LeaveRequest.findById(request._id)
      .populate('leaveTypeId', 'name')
      .populate('employeeId', 'fullName employeeCode')
      .populate('reviewedBy', 'fullName')
      .lean();

    return res.json({ message: 'Leave request rejected.', leaveRequest: populated });
  } catch (err) {
    console.error('[hrLeave.rejectLeaveRequest] Error:', err);
    return res.status(500).json({ error: 'Failed to reject leave request.' });
  }
};

module.exports = {
  getLeaveTypes,
  createLeaveType,
  getLeaveBalances,
  getLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
};
