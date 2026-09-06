const AttendanceRecord = require('../models/AttendanceRecord');
const Organization = require('../models/Organization');
const Holiday = require('../models/Holiday');
const LeaveRequest = require('../models/LeaveRequest');
const {
  getDayMidnightUtc,
  isTimeLate,
  calculateWorkedMinutes,
  ensureHolidaysForOrg,
} = require('../utils/attendanceUtils');

/**
 * Helper to get org's configured timezone and shift start time
 */
const getOrgConfig = async (organizationId) => {
  const org = await Organization.findById(organizationId).select('timezone shiftStartTime').lean();
  return {
    timezone: org?.timezone || 'Asia/Kolkata',
    shiftStartTime: org?.shiftStartTime || '09:30',
  };
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/attendance/check-in
// ─────────────────────────────────────────────────────────
const checkIn = async (req, res) => {
  try {
    const { organizationId } = req;
    const employeeId = req.user._id;

    const { timezone, shiftStartTime } = await getOrgConfig(organizationId);
    const now = new Date();
    const todayMidnight = getDayMidnightUtc(now, timezone);

    let record = await AttendanceRecord.findOne({
      organizationId,
      employeeId,
      date: todayMidnight,
    });

    if (record && record.checkInAt) {
      if (!record.checkOutAt) {
        return res.status(400).json({ error: 'Already checked in for today.' });
      }
      return res.status(400).json({
        error: 'You have already completed your check-in and check-out for today.',
      });
    }

    const isLate = isTimeLate(now, shiftStartTime, timezone);

    if (!record) {
      record = await AttendanceRecord.create({
        organizationId,
        employeeId,
        date: todayMidnight,
        checkInAt: now,
        status: 'present',
        isLate,
        breaks: [],
        totalWorkedMinutes: 0,
      });
    } else {
      record.checkInAt = now;
      record.status = 'present';
      record.isLate = isLate;
      await record.save();
    }

    return res.status(200).json({
      message: 'Checked in successfully.',
      currentStatus: 'checked_in',
      record,
      totalWorkedMinutes: 0,
      isLate,
    });
  } catch (err) {
    console.error('[attendance.checkIn] Error:', err);
    return res.status(500).json({ error: 'Check-in failed. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/attendance/check-out
// ─────────────────────────────────────────────────────────
const checkOut = async (req, res) => {
  try {
    const { organizationId } = req;
    const employeeId = req.user._id;

    const { timezone } = await getOrgConfig(organizationId);
    const now = new Date();
    const todayMidnight = getDayMidnightUtc(now, timezone);

    const record = await AttendanceRecord.findOne({
      organizationId,
      employeeId,
      date: todayMidnight,
    });

    if (!record || !record.checkInAt) {
      return res.status(400).json({ error: 'Cannot check out: You have not checked in today.' });
    }

    if (record.checkOutAt) {
      return res.status(400).json({ error: 'You have already checked out for today.' });
    }

    // Reject check-out if an active open break exists
    const hasOpenBreak = record.breaks.some((b) => b.breakOutAt === null);
    if (hasOpenBreak) {
      return res.status(400).json({
        error: 'Please end your active break before checking out.',
      });
    }

    record.checkOutAt = now;
    record.totalWorkedMinutes = calculateWorkedMinutes(record, now);
    await record.save();

    return res.status(200).json({
      message: 'Checked out successfully.',
      currentStatus: 'checked_out',
      record,
      totalWorkedMinutes: record.totalWorkedMinutes,
    });
  } catch (err) {
    console.error('[attendance.checkOut] Error:', err);
    return res.status(500).json({ error: 'Check-out failed. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/attendance/break-in
// ─────────────────────────────────────────────────────────
const breakIn = async (req, res) => {
  try {
    const { organizationId } = req;
    const employeeId = req.user._id;

    const { timezone } = await getOrgConfig(organizationId);
    const now = new Date();
    const todayMidnight = getDayMidnightUtc(now, timezone);

    const record = await AttendanceRecord.findOne({
      organizationId,
      employeeId,
      date: todayMidnight,
    });

    if (!record || !record.checkInAt) {
      return res.status(400).json({ error: 'Cannot start break: You have not checked in today.' });
    }

    if (record.checkOutAt) {
      return res.status(400).json({ error: 'Cannot start break: You have already checked out today.' });
    }

    const hasOpenBreak = record.breaks.some((b) => b.breakOutAt === null);
    if (hasOpenBreak) {
      return res.status(400).json({
        error: 'A break is already active. Please end your current break first.',
      });
    }

    record.breaks.push({ breakInAt: now, breakOutAt: null });
    await record.save();

    const liveWorked = calculateWorkedMinutes(record, now);

    return res.status(200).json({
      message: 'Break started.',
      currentStatus: 'on_break',
      record,
      totalWorkedMinutes: liveWorked,
    });
  } catch (err) {
    console.error('[attendance.breakIn] Error:', err);
    return res.status(500).json({ error: 'Failed to start break.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/attendance/break-out
// ─────────────────────────────────────────────────────────
const breakOut = async (req, res) => {
  try {
    const { organizationId } = req;
    const employeeId = req.user._id;

    const { timezone } = await getOrgConfig(organizationId);
    const now = new Date();
    const todayMidnight = getDayMidnightUtc(now, timezone);

    const record = await AttendanceRecord.findOne({
      organizationId,
      employeeId,
      date: todayMidnight,
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
    console.error('[attendance.breakOut] Error:', err);
    return res.status(500).json({ error: 'Failed to end break.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/attendance/today
// ─────────────────────────────────────────────────────────
const getToday = async (req, res) => {
  try {
    const { organizationId } = req;
    const employeeId = req.user._id;

    const { timezone, shiftStartTime } = await getOrgConfig(organizationId);
    const now = new Date();
    const todayMidnight = getDayMidnightUtc(now, timezone);

    const record = await AttendanceRecord.findOne({
      organizationId,
      employeeId,
      date: todayMidnight,
    });

    if (!record || !record.checkInAt) {
      return res.status(200).json({
        currentStatus: 'not_checked_in',
        checkInAt: null,
        checkOutAt: null,
        totalWorkedMinutes: 0,
        breaks: [],
        isLate: false,
        record: null,
        shiftStartTime,
      });
    }

    let currentStatus = 'not_checked_in';
    if (record.checkOutAt) {
      currentStatus = 'checked_out';
    } else if (record.breaks && record.breaks.some((b) => b.breakOutAt === null)) {
      currentStatus = 'on_break';
    } else if (record.checkInAt) {
      currentStatus = 'checked_in';
    }

    const liveWorkedMinutes = record.checkOutAt
      ? record.totalWorkedMinutes
      : calculateWorkedMinutes(record, now);

    return res.status(200).json({
      currentStatus,
      checkInAt: record.checkInAt,
      checkOutAt: record.checkOutAt,
      totalWorkedMinutes: liveWorkedMinutes,
      breaks: record.breaks,
      isLate: record.isLate,
      status: record.status,
      record,
      shiftStartTime,
    });
  } catch (err) {
    console.error('[attendance.getToday] Error:', err);
    return res.status(500).json({ error: 'Failed to load today attendance.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/attendance/summary?month=&year=
// ─────────────────────────────────────────────────────────
const getSummary = async (req, res) => {
  try {
    const { organizationId } = req;
    const employeeId = req.user._id;
    const { timezone } = await getOrgConfig(organizationId);

    const now = new Date();
    const queryYear = parseInt(req.query.year, 10) || now.getUTCFullYear();
    const queryMonth = parseInt(req.query.month, 10) || (now.getUTCMonth() + 1); // 1-12

    await ensureHolidaysForOrg(organizationId, queryYear);

    // Days in specified month
    const daysInMonth = new Date(Date.UTC(queryYear, queryMonth, 0)).getUTCDate();
    const monthStartUtc = new Date(Date.UTC(queryYear, queryMonth - 1, 1, 0, 0, 0));
    const monthEndUtc = new Date(Date.UTC(queryYear, queryMonth - 1, daysInMonth, 23, 59, 59));

    // 1. Fetch attendance records for this month
    const records = await AttendanceRecord.find({
      organizationId,
      employeeId,
      date: { $gte: monthStartUtc, $lte: monthEndUtc },
    }).lean();

    const recordMap = new Map();
    records.forEach((r) => {
      const dayKey = new Date(r.date).toISOString().slice(0, 10);
      recordMap.set(dayKey, r);
    });

    // 2. Fetch holidays for this month
    const holidays = await Holiday.find({
      organizationId,
      date: { $gte: monthStartUtc, $lte: monthEndUtc },
    }).lean();

    const holidayMap = new Map();
    holidays.forEach((h) => {
      const dayKey = new Date(h.date).toISOString().slice(0, 10);
      holidayMap.set(dayKey, h);
    });

    // 3. Fetch approved leave requests spanning this month
    const approvedLeaves = await LeaveRequest.find({
      organizationId,
      employeeId,
      status: 'approved',
      startDate: { $lte: monthEndUtc },
      endDate: { $gte: monthStartUtc },
    }).lean();

    const isDateInApprovedLeave = (d) => {
      return approvedLeaves.some((leave) => {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        return d >= start && d <= end;
      });
    };

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
      const dayOfWeek = currentDayUtc.getUTCDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const holiday = holidayMap.get(dateKey);
      const onLeave = isDateInApprovedLeave(currentDayUtc);
      const attRecord = recordMap.get(dateKey);

      const isNonOptionalHoliday = holiday && !holiday.isOptional;
      const isWorkingDay = !isWeekend && !isNonOptionalHoliday;

      if (isWorkingDay) {
        expectedWorkingDays++;
      }

      let status = 'present';
      let workedMin = 0;
      let isLate = false;

      if (attRecord && attRecord.checkInAt) {
        status = attRecord.status || 'present';
        workedMin = attRecord.checkOutAt
          ? attRecord.totalWorkedMinutes || 0
          : calculateWorkedMinutes(attRecord, now);
        isLate = !!attRecord.isLate;

        if (status === 'present' || status === 'half_day') {
          totalPresentDays++;
          totalWorkedMinutes += workedMin;
        }
      } else if (onLeave) {
        status = 'on_leave';
        totalLeaveDays++;
      } else if (holiday) {
        status = 'holiday';
      } else if (isWeekend) {
        status = 'weekend';
      } else {
        // Working day with no check-in
        if (currentDayUtc < todayMidnight) {
          status = 'absent';
          totalAbsentDays++;
        } else if (currentDayUtc.getTime() === todayMidnight.getTime()) {
          status = 'absent'; // Not checked in today yet
        } else {
          status = 'pending'; // Future date
        }
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

    const totalWorkedHours = Number((totalWorkedMinutes / 60).toFixed(1));

    return res.status(200).json({
      month: queryMonth,
      year: queryYear,
      totalPresentDays,
      totalAbsentDays,
      totalLeaveDays,
      totalWorkedHours,
      expectedWorkingDays,
      dailyBreakdown,
    });
  } catch (err) {
    console.error('[attendance.getSummary] Error:', err);
    return res.status(500).json({ error: 'Failed to generate attendance summary.' });
  }
};

module.exports = {
  checkIn,
  checkOut,
  breakIn,
  breakOut,
  getToday,
  getSummary,
};
