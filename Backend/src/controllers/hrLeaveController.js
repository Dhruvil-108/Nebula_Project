const mongoose = require('mongoose');
const LeaveType = require('../models/LeaveType');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveLedger = require('../models/LeaveLedger');
const AttendanceRecord = require('../models/AttendanceRecord');
const Employee = require('../models/Employee');
const Organization = require('../models/Organization');
const { scopedFilter } = require('../middleware/tenant');
const { resolveEmployeeFromUser, resolveUserFromEmployee } = require('../utils/employeeUtils');
const { startApproval, actOnStep } = require('../services/approvalWorkflowEngine');
const { logAuditEvent } = require('../services/auditService');
const {
  runMonthlyAccrual,
  evaluateSandwichRule,
  runYearEndProcessing,
} = require('../services/leaveAccrualService');
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
 * subject id. Dual-keys both Employee._id and User._id to bridge legacy records.
 */
const resolveSubjectIds = async (req, employeeIdParam) => {
  if (!employeeIdParam || employeeIdParam === 'me') {
    const selfEmp = await resolveEmployeeFromUser(req.organizationId, req.user._id);
    return { subjectIds: [selfEmp._id, req.user._id], self: true };
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
  const ids = [emp._id];
  if (emp.userId) ids.push(emp.userId);
  return { subjectIds: ids };
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
    const {
      name,
      code,
      annualQuota,
      accrualFrequency,
      monthlyAccrualRate,
      carryForward,
      maxCarryForward,
      maxEncashable,
      isPaid,
      sandwichRuleEnabled,
      priorNoticeDays,
      maxConsecutiveDays,
      docRequiredAfterDays,
      color,
    } = req.body;

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
      code: code ? String(code).trim().toUpperCase() : '',
      annualQuota: annualQuota !== undefined ? Number(annualQuota) : 0,
      accrualFrequency: accrualFrequency || 'monthly',
      monthlyAccrualRate: monthlyAccrualRate !== undefined ? Number(monthlyAccrualRate) : 0,
      carryForward: Boolean(carryForward),
      maxCarryForward: maxCarryForward !== undefined ? Number(maxCarryForward) : 0,
      maxEncashable: maxEncashable !== undefined ? Number(maxEncashable) : 0,
      isPaid: isPaid !== undefined ? Boolean(isPaid) : true,
      sandwichRuleEnabled: Boolean(sandwichRuleEnabled),
      priorNoticeDays: priorNoticeDays !== undefined ? Number(priorNoticeDays) : 0,
      maxConsecutiveDays: maxConsecutiveDays !== undefined ? Number(maxConsecutiveDays) : 30,
      docRequiredAfterDays: docRequiredAfterDays !== undefined ? Number(docRequiredAfterDays) : 0,
      color: color || '#f97316',
    });

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'leave.type_created',
      entityType: 'LeaveType',
      entityId: leaveType._id,
      after: leaveType.toObject(),
      req,
    });

    return res.status(201).json(leaveType.toObject());
  } catch (err) {
    console.error('[hrLeave.createLeaveType] Error:', err);
    return res.status(500).json({ error: 'Failed to create leave type.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/hr/leaves/types/:id — admin/HR updates policy
// ─────────────────────────────────────────────────────────
const updateLeaveType = async (req, res) => {
  try {
    if (!canManageTypes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only admins and HR can configure leave types.' });
    }
    const { id } = req.params;
    const patch = req.body;

    const leaveType = await LeaveType.findOneAndUpdate(
      { _id: id, organizationId: req.organizationId },
      { $set: patch },
      { new: true }
    );
    if (!leaveType) {
      return res.status(404).json({ error: 'Leave type not found.' });
    }

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'leave.type_updated',
      entityType: 'LeaveType',
      entityId: id,
      after: patch,
      req,
    });

    return res.json(leaveType.toObject());
  } catch (err) {
    console.error('[hrLeave.updateLeaveType] Error:', err);
    return res.status(500).json({ error: 'Failed to update leave type.' });
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
      extra.$or = [
        { employeeId: { $in: resolved.subjectIds } },
        { userId: { $in: resolved.subjectIds } },
      ];
    } else if (employeeId === 'me' || !canApprove(req.user.role)) {
      const selfEmp = await resolveEmployeeFromUser(req.organizationId, req.user._id);
      extra.$or = [
        { employeeId: selfEmp._id },
        { employeeId: req.user._id },
        { userId: req.user._id },
      ];
    }

    const requests = await LeaveRequest.find({ organizationId: req.organizationId, ...extra })
      .populate('leaveTypeId', 'name')
      .populate('employeeId', 'fullName firstName lastName employeeCode designation')
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

    const leaveType = await LeaveType.findOne({ _id: leaveTypeId, organizationId: req.organizationId }).lean();
    if (!leaveType) {
      return res.status(404).json({ error: 'Selected leave type not found.' });
    }

    const employee = await resolveEmployeeFromUser(req.organizationId, req.user._id);

    // Policy check: Prior notice days
    if (leaveType.priorNoticeDays > 0) {
      const noticeMs = leaveType.priorNoticeDays * 24 * 60 * 60 * 1000;
      if (start.getTime() - Date.now() < noticeMs - (12 * 60 * 60 * 1000)) {
        return res.status(400).json({
          error: `${leaveType.name} requires at least ${leaveType.priorNoticeDays} day(s) advance notice.`,
        });
      }
    }

    // Policy check & calculation: Sandwich rule
    const sandwichAnalysis = await evaluateSandwichRule(
      req.organizationId,
      employee._id,
      start,
      end,
      leaveTypeId
    );
    const totalDays = sandwichAnalysis.totalDays;

    // Policy check: Maximum consecutive days
    if (leaveType.maxConsecutiveDays && totalDays > leaveType.maxConsecutiveDays) {
      return res.status(400).json({
        error: `Maximum consecutive days allowed for ${leaveType.name} is ${leaveType.maxConsecutiveDays} day(s). You requested ${totalDays} day(s).`,
      });
    }

    const year = start.getUTCFullYear();
    await ensureLeaveBalancesForEmployee(req.organizationId, employee._id, year);

    const balance = await LeaveBalance.findOne({
      organizationId: req.organizationId,
      leaveTypeId,
      year,
      $or: [{ employeeId: employee._id }, { employeeId: req.user._id }],
    });

    if (leaveType.annualQuota > 0 && balance) {
      const remaining = Math.max(0, balance.allocated - balance.used);
      if (totalDays > remaining) {
        return res.status(400).json({
          error: `Insufficient leave balance. You requested ${totalDays} day(s)${sandwichAnalysis.isSandwichApplied ? ' (including sandwich rule deductions)' : ''}, but only have ${remaining} day(s) remaining for ${leaveType.name}.`,
        });
      }
    }

    let finalReason = reason ? String(reason).trim() : '';
    if (sandwichAnalysis.isSandwichApplied) {
      finalReason = finalReason
        ? `${finalReason} | [Sandwich Policy: +${sandwichAnalysis.sandwichDays} day(s) included]`
        : `[Sandwich Policy: +${sandwichAnalysis.sandwichDays} day(s) included]`;
    }

    const leaveRequest = await LeaveRequest.create({
      organizationId: req.organizationId,
      employeeId: employee._id,
      userId: req.user._id,
      leaveTypeId,
      startDate: start,
      endDate: end,
      totalDays,
      reason: finalReason,
      status: 'pending',
    });

    // Start Workflow Engine Instance
    try {
      await startApproval({
        organizationId: req.organizationId,
        requestType: 'leave',
        referenceId: leaveRequest._id,
        referenceModel: 'LeaveRequest',
        requesterEmployeeId: employee._id,
        requesterUserId: req.user._id,
        metadata: {
          leaveTypeName: leaveType.name,
          totalDays,
          startDate: start,
          endDate: end,
          reason,
        },
      });
    } catch (wfErr) {
      console.warn('[hrLeave.createLeaveRequest] Workflow init warning:', wfErr.message);
    }

    // Audit log
    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      actorEmployeeId: employee._id,
      action: 'leave.request',
      entityType: 'LeaveRequest',
      entityId: leaveRequest._id,
      after: {
        leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status: 'pending',
      },
      req,
    });

    const populated = await LeaveRequest.findById(leaveRequest._id)
      .populate('leaveTypeId', 'name')
      .populate('employeeId', 'fullName firstName lastName employeeCode')
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

  // Pre-flight check: Segregation of duties prevents self-approval for non-super_admins
  const preCheck = await LeaveRequest.findOne({ _id: id, organizationId: req.organizationId }).lean();
  if (!preCheck) {
    return res.status(404).json({ error: 'Leave request not found.' });
  }
  if (preCheck.status !== 'pending') {
    return res.status(400).json({ error: `Cannot approve a request that is already ${preCheck.status}.` });
  }

  let isOwnRequest = preCheck.employeeId.toString() === req.user._id.toString();
  if (!isOwnRequest) {
    const ownEmp = await Employee.findOne({ userId: req.user._id, organizationId: req.organizationId }).select('_id').lean();
    if (ownEmp && preCheck.employeeId.toString() === ownEmp._id.toString()) {
      isOwnRequest = true;
    }
  }
  if (isOwnRequest && req.user.role !== 'super_admin') {
    return res.status(403).json({
      error: 'Self-approval is not permitted. Your leave request must be approved by another manager or administrator.',
    });
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
    const updatedBalance = await LeaveBalance.findOneAndUpdate(
      {
        organizationId: req.organizationId,
        employeeId: request.employeeId,
        leaveTypeId: request.leaveTypeId,
        year,
      },
      { $inc: { used: request.totalDays } },
      { ...opts, upsert: true, new: true }
    );

    await LeaveLedger.create(
      [
        {
          organizationId: req.organizationId,
          employeeId: request.employeeId,
          userId: request.userId,
          leaveTypeId: request.leaveTypeId,
          year,
          transactionType: 'debit_leave',
          days: -request.totalDays,
          balanceBefore: updatedBalance.allocated - (updatedBalance.used - request.totalDays),
          balanceAfter: updatedBalance.allocated - updatedBalance.used,
          referenceId: request._id,
          referenceType: 'LeaveRequest',
          notes: `Leave approved for ${request.totalDays} day(s)`,
          performedBy: req.user._id,
        },
      ],
      { ...opts }
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

    // Trigger workflow engine advancement & audit log
    try {
      await actOnStep({
        organizationId: req.organizationId,
        referenceId: id,
        actorUserId: req.user._id,
        actorRole: req.user.role,
        action: 'approved',
        comments: req.body?.comments || 'Leave request approved',
      });
    } catch (wfErr) {
      console.warn('[hrLeave.approveLeaveRequest] Workflow act warning:', wfErr.message);
    }

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'leave.approved',
      entityType: 'LeaveRequest',
      entityId: id,
      before: { status: 'pending' },
      after: { status: 'approved', reviewedBy: req.user._id },
      req,
    });

    const populated = await LeaveRequest.findById(result.request._id)
      .populate('leaveTypeId', 'name')
      .populate('employeeId', 'fullName firstName lastName employeeCode')
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

      await LeaveLedger.create({
        organizationId: req.organizationId,
        employeeId: request.employeeId,
        userId: request.userId,
        leaveTypeId: request.leaveTypeId,
        year,
        transactionType: 'debit_leave',
        days: -request.totalDays,
        balanceBefore: balance.allocated - (balance.used - request.totalDays),
        balanceAfter: balance.allocated - balance.used,
        referenceId: request._id,
        referenceType: 'LeaveRequest',
        notes: `Leave approved for ${request.totalDays} day(s)`,
        performedBy: req.user._id,
      });

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

        try {
          await actOnStep({
            organizationId: req.organizationId,
            referenceId: id,
            actorUserId: req.user._id,
            actorRole: req.user.role,
            action: 'approved',
            comments: req.body?.comments || 'Leave request approved',
          });
        } catch (wfErr) {
          console.warn('[hrLeave.approveLeaveRequest] Fallback workflow act warning:', wfErr.message);
        }

        await logAuditEvent({
          organizationId: req.organizationId,
          actorUserId: req.user._id,
          action: 'leave.approved',
          entityType: 'LeaveRequest',
          entityId: id,
          before: { status: 'pending' },
          after: { status: 'approved', reviewedBy: req.user._id },
          req,
        });

        const populated = await LeaveRequest.findById(request._id)
          .populate('leaveTypeId', 'name')
          .populate('employeeId', 'fullName firstName lastName employeeCode')
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

    let isOwnRequest = request.employeeId.toString() === req.user._id.toString();
    if (!isOwnRequest) {
      const ownEmp = await Employee.findOne({ userId: req.user._id, organizationId: req.organizationId }).select('_id').lean();
      if (ownEmp && request.employeeId.toString() === ownEmp._id.toString()) {
        isOwnRequest = true;
      }
    }
    if (isOwnRequest && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Self-review is not permitted. Your leave request must be reviewed by another manager or administrator.',
      });
    }

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    await request.save();

    try {
      await actOnStep({
        organizationId: req.organizationId,
        referenceId: id,
        actorUserId: req.user._id,
        actorRole: req.user.role,
        action: 'rejected',
        comments: req.body?.comments || req.body?.reason || 'Leave request rejected',
      });
    } catch (wfErr) {
      console.warn('[hrLeave.rejectLeaveRequest] Workflow act warning:', wfErr.message);
    }

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'leave.rejected',
      entityType: 'LeaveRequest',
      entityId: id,
      before: { status: 'pending' },
      after: { status: 'rejected', reviewedBy: req.user._id },
      req,
    });

    const populated = await LeaveRequest.findById(request._id)
      .populate('leaveTypeId', 'name')
      .populate('employeeId', 'fullName firstName lastName employeeCode')
      .populate('reviewedBy', 'fullName')
      .lean();

    return res.json({ message: 'Leave request rejected.', leaveRequest: populated });
  } catch (err) {
    console.error('[hrLeave.rejectLeaveRequest] Error:', err);
    return res.status(500).json({ error: 'Failed to reject leave request.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/hr/leaves/sandwich-preview
// ─────────────────────────────────────────────────────────
const previewSandwich = async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, employeeId } = req.body;
    if (!leaveTypeId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Leave type, start date, and end date are required.' });
    }
    let targetEmployeeId = employeeId;
    if (!targetEmployeeId || targetEmployeeId === 'me') {
      const selfEmp = await resolveEmployeeFromUser(req.organizationId, req.user._id);
      targetEmployeeId = selfEmp._id;
    }
    const result = await evaluateSandwichRule(
      req.organizationId,
      targetEmployeeId,
      startDate,
      endDate,
      leaveTypeId
    );
    return res.json(result);
  } catch (err) {
    console.error('[hrLeave.previewSandwich] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to preview sandwich rule.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/leaves/ledger?employeeId=&year=&transactionType=
// ─────────────────────────────────────────────────────────
const getLeaveLedger = async (req, res) => {
  try {
    const { employeeId, year, transactionType } = req.query;
    const filter = { organizationId: req.organizationId };

    if (year) {
      filter.year = parseInt(year, 10);
    }
    if (transactionType && transactionType !== 'all') {
      filter.transactionType = transactionType;
    }

    if (canApprove(req.user.role)) {
      if (employeeId && employeeId !== 'all') {
        if (employeeId === 'me') {
          const selfEmp = await resolveEmployeeFromUser(req.organizationId, req.user._id);
          filter.employeeId = selfEmp._id;
        } else {
          filter.employeeId = employeeId;
        }
      }
    } else {
      const selfEmp = await resolveEmployeeFromUser(req.organizationId, req.user._id);
      filter.employeeId = selfEmp._id;
    }

    const ledger = await LeaveLedger.find(filter)
      .populate('leaveTypeId', 'name code color')
      .populate('employeeId', 'fullName firstName lastName employeeCode')
      .populate('performedBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.json(ledger);
  } catch (err) {
    console.error('[hrLeave.getLeaveLedger] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve leave ledger transactions.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/hr/leaves/accrual/run
// ─────────────────────────────────────────────────────────
const triggerMonthlyAccrual = async (req, res) => {
  try {
    if (!canManageTypes(req.user.role)) {
      return res.status(403).json({ error: 'Only admins and HR can trigger monthly leave accruals.' });
    }
    const { month, year } = req.body;
    const result = await runMonthlyAccrual(
      req.organizationId,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
      req.user._id
    );
    return res.json(result);
  } catch (err) {
    console.error('[hrLeave.triggerMonthlyAccrual] Error:', err);
    return res.status(500).json({ error: 'Failed to execute monthly accrual.' });
  }
};

module.exports = {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  getLeaveBalances,
  getLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  previewSandwich,
  getLeaveLedger,
  triggerMonthlyAccrual,
};
