const mongoose = require('mongoose');
const AttendanceRecord = require('../models/AttendanceRecord');
const Organization = require('../models/Organization');
const Holiday = require('../models/Holiday');
const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Shift = require('../models/Shift');
const EmployeeShift = require('../models/EmployeeShift');
const { scopedFilter } = require('../middleware/tenant');
const { resolveEmployeeFromUser, resolveUserFromEmployee } = require('../utils/employeeUtils');
const {
  getDayMidnightUtc,
  isTimeLate,
  calculateWorkedMinutes,
} = require('../utils/attendanceUtils');

/**
 * Helper: org timezone + shift start config
 */
const getOrgConfig = async (organizationId) => {
  const org = await Organization.findById(organizationId).select('timezone shiftStartTime').lean();
  return {
    timezone: org?.timezone || 'Asia/Kolkata',
    shiftStartTime: org?.shiftStartTime || '09:30',
  };
};

/**
 * Helper to resolve the active shift for an employee (or organization default)
 */
const resolveShiftForEmployee = async (organizationId, employeeId) => {
  const now = new Date();
  if (employeeId) {
    const assignment = await EmployeeShift.findOne({
      organizationId,
      employeeId,
      effectiveFrom: { $lte: now },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gte: now } }],
    })
      .populate('shiftId')
      .sort({ effectiveFrom: -1 })
      .lean();

    if (assignment && assignment.shiftId) {
      return assignment.shiftId;
    }
  }

  let def = await Shift.findOne({ organizationId, isDefault: true }).lean();
  if (!def) {
    const org = await Organization.findById(organizationId).select('shiftStartTime').lean();
    def = {
      _id: null,
      name: 'General Shift',
      code: 'GEN-01',
      startTime: org?.shiftStartTime || '09:30',
      endTime: '18:30',
      graceMinutes: 15,
      halfDayMinutes: 270,
      fullDayMinutes: 480,
      color: '#f97316',
    };
  }
  return def;
};

// Roles allowed to view other employees' attendance (summary by employeeId, roster)
const canViewTeam = (role) =>
  ['super_admin', 'admin', 'manager', 'hr'].includes(role);

// ─────────────────────────────────────────────────────────
// Shared attendance actions. The platform's /attendance routes
// operate on req.user._id; the HR module version resolves the
// canonical Employee record so all records maintain dual identity.
// ─────────────────────────────────────────────────────────
const doCheckIn = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const employee = await resolveEmployeeFromUser(organizationId, req.user._id);
    const shift = await resolveShiftForEmployee(organizationId, employee._id);

    const { timezone } = await getOrgConfig(organizationId);
    const now = new Date();
    const todayMidnight = getDayMidnightUtc(now, timezone);

    let record = await AttendanceRecord.findOne({
      organizationId,
      date: todayMidnight,
      $or: [
        { employeeId: employee._id },
        { employeeId: req.user._id },
        { userId: req.user._id },
      ],
    });

    if (record && record.checkInAt) {
      if (!record.checkOutAt) {
        return res.status(400).json({ error: 'Already checked in for today.' });
      }
      return res.status(400).json({
        error: 'You have already completed your check-in and check-out for today.',
      });
    }

    const shiftStartTime = shift.startTime || '09:30';
    const isLate = isTimeLate(now, shiftStartTime, timezone, shift.graceMinutes || 15);

    if (!record) {
      record = await AttendanceRecord.create({
        organizationId,
        employeeId: employee._id,
        userId: req.user._id,
        shiftId: shift._id || null,
        date: todayMidnight,
        checkInAt: now,
        status: 'present',
        isLate,
        breaks: [],
        totalWorkedMinutes: 0,
        overtimeMinutes: 0,
      });
    } else {
      record.employeeId = employee._id;
      record.userId = req.user._id;
      if (shift._id) record.shiftId = shift._id;
      record.checkInAt = now;
      record.status = 'present';
      record.isLate = isLate;
      await record.save();
    }

    return res.status(200).json({
      message: 'Checked in successfully.',
      currentStatus: 'checked_in',
      record,
      shift,
      totalWorkedMinutes: 0,
      isLate,
    });
  } catch (err) {
    console.error('[hrAttendance.checkIn] Error:', err);
    return res.status(500).json({ error: 'Check-in failed. Please try again.' });
  }
};

const doCheckOut = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const employee = await resolveEmployeeFromUser(organizationId, req.user._id);
    const shift = await resolveShiftForEmployee(organizationId, employee._id);

    const { timezone } = await getOrgConfig(organizationId);
    const now = new Date();
    const todayMidnight = getDayMidnightUtc(now, timezone);

    const record = await AttendanceRecord.findOne({
      organizationId,
      date: todayMidnight,
      $or: [
        { employeeId: employee._id },
        { employeeId: req.user._id },
        { userId: req.user._id },
      ],
    });

    if (!record || !record.checkInAt) {
      return res.status(400).json({ error: 'Cannot check out: You have not checked in today.' });
    }
    if (record.checkOutAt) {
      return res.status(400).json({ error: 'You have already checked out for today.' });
    }
    if (record.breaks.some((b) => b.breakOutAt === null)) {
      return res.status(400).json({ error: 'Please end your active break before checking out.' });
    }

    record.checkOutAt = now;
    record.totalWorkedMinutes = calculateWorkedMinutes(record, now);

    const fullDayThreshold = shift.fullDayMinutes || 480;
    record.overtimeMinutes = Math.max(0, record.totalWorkedMinutes - fullDayThreshold);
    await record.save();

    return res.status(200).json({
      message: 'Checked out successfully.',
      currentStatus: 'checked_out',
      record,
      shift,
      totalWorkedMinutes: record.totalWorkedMinutes,
      overtimeMinutes: record.overtimeMinutes,
    });
  } catch (err) {
    console.error('[hrAttendance.checkOut] Error:', err);
    return res.status(500).json({ error: 'Check-out failed. Please try again.' });
  }
};

const doBreakIn = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const employee = await resolveEmployeeFromUser(organizationId, req.user._id);

    const { timezone } = await getOrgConfig(organizationId);
    const now = new Date();
    const todayMidnight = getDayMidnightUtc(now, timezone);

    const record = await AttendanceRecord.findOne({
      organizationId,
      date: todayMidnight,
      $or: [
        { employeeId: employee._id },
        { employeeId: req.user._id },
        { userId: req.user._id },
      ],
    });

    if (!record || !record.checkInAt) {
      return res.status(400).json({ error: 'Cannot start break: You have not checked in today.' });
    }
    if (record.checkOutAt) {
      return res.status(400).json({ error: 'Cannot start break: You have already checked out today.' });
    }
    if (record.breaks.some((b) => b.breakOutAt === null)) {
      return res.status(400).json({ error: 'A break is already active. Please end your current break first.' });
    }

    record.breaks.push({ breakInAt: now, breakOutAt: null });
    await record.save();

    return res.status(200).json({
      message: 'Break started.',
      currentStatus: 'on_break',
      record,
      totalWorkedMinutes: calculateWorkedMinutes(record, now),
    });
  } catch (err) {
    console.error('[hrAttendance.breakIn] Error:', err);
    return res.status(500).json({ error: 'Failed to start break.' });
  }
};

const doBreakOut = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const employee = await resolveEmployeeFromUser(organizationId, req.user._id);

    const { timezone } = await getOrgConfig(organizationId);
    const now = new Date();
    const todayMidnight = getDayMidnightUtc(now, timezone);

    const record = await AttendanceRecord.findOne({
      organizationId,
      date: todayMidnight,
      $or: [
        { employeeId: employee._id },
        { employeeId: req.user._id },
        { userId: req.user._id },
      ],
    });

    if (!record || !record.checkInAt) {
      return res.status(400).json({ error: 'Cannot end break: You have not checked in today.' });
    }

    const openBreakIndex = record.breaks.findIndex((b) => b.breakOutAt === null);
    if (openBreakIndex === -1) {
      return res.status(400).json({ error: 'No active break found to end.' });
    }

    record.breaks[openBreakIndex].breakOutAt = now;
    record.totalWorkedMinutes = calculateWorkedMinutes(record, now);
    await record.save();

    return res.status(200).json({
      message: 'Break ended.',
      currentStatus: 'checked_in',
      record,
      totalWorkedMinutes: record.totalWorkedMinutes,
    });
  } catch (err) {
    console.error('[hrAttendance.breakOut] Error:', err);
    return res.status(500).json({ error: 'Failed to end break.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/attendance/today — current user + live minutes
// ─────────────────────────────────────────────────────────
const getToday = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const employee = await resolveEmployeeFromUser(organizationId, req.user._id);
    const shift = await resolveShiftForEmployee(organizationId, employee._id);

    const { timezone } = await getOrgConfig(organizationId);
    const now = new Date();
    const todayMidnight = getDayMidnightUtc(now, timezone);

    const record = await AttendanceRecord.findOne({
      organizationId,
      date: todayMidnight,
      $or: [
        { employeeId: employee._id },
        { employeeId: req.user._id },
        { userId: req.user._id },
      ],
    })
      .populate('shiftId')
      .lean();

    if (!record || !record.checkInAt) {
      return res.json({
        currentStatus: 'not_checked_in',
        checkInAt: null,
        checkOutAt: null,
        totalWorkedMinutes: 0,
        overtimeMinutes: 0,
        breaks: [],
        isLate: false,
        record: null,
        shiftStartTime: shift.startTime || '09:30',
        shift: {
          _id: shift._id,
          name: shift.name,
          code: shift.code,
          startTime: shift.startTime,
          endTime: shift.endTime,
          graceMinutes: shift.graceMinutes,
          color: shift.color || '#f97316',
        },
        employee: {
          _id: employee._id,
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          lastName: employee.lastName,
        },
      });
    }

    let currentStatus = 'not_checked_in';
    if (record.checkOutAt) currentStatus = 'checked_out';
    else if (record.breaks && record.breaks.some((b) => b.breakOutAt === null)) currentStatus = 'on_break';
    else if (record.checkInAt) currentStatus = 'checked_in';

    const liveWorkedMinutes = record.checkOutAt
      ? record.totalWorkedMinutes
      : calculateWorkedMinutes(record, now);

    const fullDayMinutes = shift.fullDayMinutes || 480;
    const overtimeMinutes = record.checkOutAt
      ? record.overtimeMinutes || Math.max(0, liveWorkedMinutes - fullDayMinutes)
      : Math.max(0, liveWorkedMinutes - fullDayMinutes);

    return res.json({
      currentStatus,
      checkInAt: record.checkInAt,
      checkOutAt: record.checkOutAt,
      totalWorkedMinutes: liveWorkedMinutes,
      overtimeMinutes,
      breaks: record.breaks,
      isLate: record.isLate,
      isRegularized: record.isRegularized || false,
      status: record.status,
      record,
      shiftStartTime: shift.startTime || '09:30',
      shift: {
        _id: shift._id,
        name: shift.name,
        code: shift.code,
        startTime: shift.startTime,
        endTime: shift.endTime,
        graceMinutes: shift.graceMinutes,
        color: shift.color || '#f97316',
      },
      employee: {
        _id: employee._id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
      },
    });
  } catch (err) {
    console.error('[hrAttendance.getToday] Error:', err);
    return res.status(500).json({ error: 'Failed to load today attendance.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/attendance/summary?month=&year=&employeeId=
// ─────────────────────────────────────────────────────────
const getSummary = async (req, res) => {
  try {
    const { timezone } = await getOrgConfig(req.organizationId);
    const now = new Date();

    const queryYear = parseInt(req.query.year, 10) || now.getUTCFullYear();
    const queryMonth = parseInt(req.query.month, 10) || (now.getUTCMonth() + 1);

    // employeeId here refers to an Employee record (or "me")
    let targetEmployeeId = req.user._id; // fallback: use the User id (attendance keyed by userId)
    if (req.query.employeeId && req.query.employeeId !== 'me') {
      if (!canViewTeam(req.user.role)) {
        return res.status(403).json({ error: 'Access denied. Only managers, HR, and admins can view other employees\' attendance.' });
      }
      if (!mongoose.Types.ObjectId.isValid(req.query.employeeId)) {
        return res.status(400).json({ error: 'Invalid employee id.' });
      }
      const emp = await Employee.findOne(scopedFilter(req, { _id: req.query.employeeId })).lean();
      if (!emp) return res.status(404).json({ error: 'Employee not found.' });
      targetEmployeeId = emp.userId || emp._id;
    }

    const daysInMonth = new Date(Date.UTC(queryYear, queryMonth, 0)).getUTCDate();
    const monthStartUtc = new Date(Date.UTC(queryYear, queryMonth - 1, 1, 0, 0, 0));
    const monthEndUtc = new Date(Date.UTC(queryYear, queryMonth - 1, daysInMonth, 23, 59, 59));

    const [records, holidays, approvedLeaves] = await Promise.all([
      AttendanceRecord.find({
        organizationId: req.organizationId,
        employeeId: targetEmployeeId,
        date: { $gte: monthStartUtc, $lte: monthEndUtc },
      }).lean(),
      Holiday.find({
        organizationId: req.organizationId,
        date: { $gte: monthStartUtc, $lte: monthEndUtc },
      }).lean(),
      LeaveRequest.find({
        organizationId: req.organizationId,
        employeeId: targetEmployeeId,
        status: 'approved',
        startDate: { $lte: monthEndUtc },
        endDate: { $gte: monthStartUtc },
      }).lean(),
    ]);

    const recordMap = new Map(records.map((r) => [new Date(r.date).toISOString().slice(0, 10), r]));
    const holidayMap = new Map(holidays.map((h) => [new Date(h.date).toISOString().slice(0, 10), h]));

    const isDateInApprovedLeave = (d) =>
      approvedLeaves.some((leave) => {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        return (
          day >= new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())) &&
          day <= new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))
        );
      });

    const todayMidnight = getDayMidnightUtc(now, timezone);

    let totalPresentDays = 0;
    let totalAbsentDays = 0;
    let totalLeaveDays = 0;
    let totalWorkedMinutes = 0;
    let expectedWorkingDays = 0;
    const dailyBreakdown = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDayUtc = new Date(Date.UTC(queryYear, queryMonth - 1, day, 0, 0, 0));
      const dateKey = currentDayUtc.toISOString().slice(0, 10);
      const dayOfWeek = currentDayUtc.getUTCDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const holiday = holidayMap.get(dateKey);
      const onLeave = isDateInApprovedLeave(currentDayUtc);
      const attRecord = recordMap.get(dateKey);

      const isNonOptionalHoliday = holiday && !holiday.isOptional;
      if (!isWeekend && !isNonOptionalHoliday) expectedWorkingDays++;

      let status = 'present';
      let workedMin = 0;
      let isLate = false;

      if (attRecord && attRecord.checkInAt && attRecord.status !== 'on_leave') {
        // Actually worked (or half-day). on_leave records are handled below so
        // they count as leave days, never as present days.
        status = attRecord.status || 'present';
        workedMin = attRecord.checkOutAt
          ? attRecord.totalWorkedMinutes || 0
          : calculateWorkedMinutes(attRecord, now);
        isLate = !!attRecord.isLate;
        if (status === 'present' || status === 'half_day') {
          totalPresentDays++;
          totalWorkedMinutes += workedMin;
        }
      } else if (attRecord && attRecord.status === 'on_leave') {
        status = 'on_leave';
        totalLeaveDays++;
      } else if (onLeave) {
        status = 'on_leave';
        totalLeaveDays++;
      } else if (holiday) {
        status = 'holiday';
      } else if (isWeekend) {
        status = 'weekend';
      } else if (currentDayUtc <= todayMidnight) {
        status = 'absent';
        totalAbsentDays++;
      } else {
        status = 'pending';
      }

      dailyBreakdown.push({
        date: dateKey,
        dayOfMonth: day,
        status,
        workedMinutes: workedMin,
        workedHours: Number((workedMin / 60).toFixed(1)),
        isLate,
        holidayName: holiday?.name || null,
      });
    }

    return res.json({
      month: queryMonth,
      year: queryYear,
      totalPresentDays,
      totalAbsentDays,
      totalLeaveDays,
      totalWorkedHours: Number((totalWorkedMinutes / 60).toFixed(1)),
      expectedWorkingDays,
      dailyBreakdown,
    });
  } catch (err) {
    console.error('[hrAttendance.getSummary] Error:', err);
    return res.status(500).json({ error: 'Failed to generate attendance summary.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/attendance/roster?date=YYYY-MM-DD
// Org-wide roster for a date — manager/HR/admin only.
// ─────────────────────────────────────────────────────────
const getRoster = async (req, res) => {
  try {
    if (!canViewTeam(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Only managers, HR, and admins can view the org-wide roster.',
      });
    }

    const { timezone } = await getOrgConfig(req.organizationId);

    let targetDate = new Date();
    if (req.query.date) {
      const parsed = new Date(`${req.query.date}T00:00:00.000Z`);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Invalid date. Use YYYY-MM-DD.' });
      }
      targetDate = parsed;
    }
    const dayMidnight = getDayMidnightUtc(targetDate, timezone);
    const now = new Date();
    const isToday =
      dayMidnight.getTime() === getDayMidnightUtc(now, timezone).getTime();

    const [employees, users, records] = await Promise.all([
      Employee.find({ organizationId: req.organizationId, employmentStatus: { $ne: 'terminated' } })
        .populate('userId', 'fullName email role')
        .populate('departmentId', 'name')
        .lean(),
      User.find({ organizationId: req.organizationId, status: { $ne: 'disabled' } })
        .select('fullName email role')
        .lean(),
      AttendanceRecord.find({
        organizationId: req.organizationId,
        date: dayMidnight,
      })
        .populate('shiftId')
        .lean(),
    ]);

    // Build multi-index map for instant lookup by employeeId or userId
    const recordMap = new Map();
    for (const r of records) {
      if (r.employeeId) recordMap.set(r.employeeId.toString(), r);
      if (r.userId) recordMap.set(r.userId.toString(), r);
    }

    const seenEmployeeCodes = new Set();
    const seenUserIds = new Set();
    const roster = [];

    // Process canonical employees first
    for (const emp of employees) {
      seenEmployeeCodes.add(emp.employeeCode);
      const uid = emp.userId?._id?.toString() || emp.userId?.toString();
      if (uid) seenUserIds.add(uid);

      const r = recordMap.get(emp._id.toString()) || (uid ? recordMap.get(uid) : null);
      let status = 'not_checked_in';
      let checkInAt = null;
      let checkOutAt = null;
      let workedMinutes = 0;
      let late = false;

      if (r && r.checkInAt) {
        checkInAt = r.checkInAt;
        late = !!r.isLate;
        if (r.checkOutAt) {
          status = 'checked_out';
          checkOutAt = r.checkOutAt;
          workedMinutes = r.totalWorkedMinutes || 0;
        } else if (r.breaks && r.breaks.some((b) => b.breakOutAt === null)) {
          status = 'on_break';
          workedMinutes = isToday ? calculateWorkedMinutes(r, now) : calculateWorkedMinutes(r, r.breaks[r.breaks.length - 1]?.breakInAt || r.checkInAt);
        } else {
          status = 'checked_in';
          workedMinutes = isToday ? calculateWorkedMinutes(r, now) : r.totalWorkedMinutes || 0;
        }
      } else if (r && r.status === 'on_leave') {
        status = 'on_leave';
      }

      roster.push({
        employeeId: emp._id.toString(),
        employeeCode: emp.employeeCode,
        userId: uid || null,
        fullName: emp.userId?.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee',
        email: emp.userId?.email || emp.workEmail || '',
        role: emp.userId?.role || emp.designation || 'employee',
        department: emp.departmentId?.name || null,
        shift: r?.shiftId
          ? {
              _id: r.shiftId._id,
              name: r.shiftId.name,
              code: r.shiftId.code,
              color: r.shiftId.color,
            }
          : null,
        status,
        checkInAt,
        checkOutAt,
        workedMinutes,
        overtimeMinutes: r?.overtimeMinutes || 0,
        isLate: late,
        isRegularized: r?.isRegularized || false,
      });
    }

    // Merge any registered users that do not yet have an Employee dossier
    for (const u of users) {
      const uid = u._id.toString();
      if (seenUserIds.has(uid)) continue;

      const r = recordMap.get(uid);
      let status = 'not_checked_in';
      let checkInAt = null;
      let checkOutAt = null;
      let workedMinutes = 0;
      let late = false;

      if (r && r.checkInAt) {
        checkInAt = r.checkInAt;
        late = !!r.isLate;
        if (r.checkOutAt) {
          status = 'checked_out';
          checkOutAt = r.checkOutAt;
          workedMinutes = r.totalWorkedMinutes || 0;
        } else if (r.breaks && r.breaks.some((b) => b.breakOutAt === null)) {
          status = 'on_break';
          workedMinutes = isToday ? calculateWorkedMinutes(r, now) : calculateWorkedMinutes(r, r.breaks[r.breaks.length - 1]?.breakInAt || r.checkInAt);
        } else {
          status = 'checked_in';
          workedMinutes = isToday ? calculateWorkedMinutes(r, now) : r.totalWorkedMinutes || 0;
        }
      } else if (r && r.status === 'on_leave') {
        status = 'on_leave';
      }

      roster.push({
        employeeId: uid,
        employeeCode: 'USR',
        userId: uid,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        department: null,
        status,
        checkInAt,
        checkOutAt,
        workedMinutes,
        isLate: late,
      });
    }

    roster.sort((a, b) => a.fullName.localeCompare(b.fullName));

    return res.json({ date: dayMidnight.toISOString().slice(0, 10), roster });
  } catch (err) {
    console.error('[hrAttendance.getRoster] Error:', err);
    return res.status(500).json({ error: 'Failed to load attendance roster.' });
  }
};

module.exports = {
  doCheckIn,
  doCheckOut,
  doBreakIn,
  doBreakOut,
  getToday,
  getSummary,
  getRoster,
};
