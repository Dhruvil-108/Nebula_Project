const mongoose = require('mongoose');
const Holiday = require('../models/Holiday');
const Employee = require('../models/Employee');
const AttendanceRecord = require('../models/AttendanceRecord');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { scopedFilter } = require('../middleware/tenant');
const { ensureHolidaysForOrg, getDayMidnightUtc, calculateWorkedMinutes } = require('../utils/attendanceUtils');

const canManageHolidays = (role) =>
  ['super_admin', 'admin', 'hr'].includes(role);

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/holidays?year=
// ─────────────────────────────────────────────────────────
const getHolidays = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getUTCFullYear();
    await ensureHolidaysForOrg(req.organizationId, year);

    const holidays = await Holiday.find({
      organizationId: req.organizationId,
      date: {
        $gte: new Date(Date.UTC(year, 0, 1)),
        $lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59)),
      },
    })
      .sort({ date: 1 })
      .lean();

    return res.json(
      holidays.map((h) => ({
        _id: h._id,
        name: h.name,
        date: h.date,
        isOptional: !!h.isOptional,
      }))
    );
  } catch (err) {
    console.error('[hrController.getHolidays] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve holidays.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/holidays/upcoming?limit=5
// ─────────────────────────────────────────────────────────
const getUpcomingHolidays = async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));
    const org = await Organization.findById(req.organizationId).select('timezone').lean();
    const timezone = org?.timezone || 'Asia/Kolkata';

    await ensureHolidaysForOrg(req.organizationId, new Date().getUTCFullYear());
    const todayMidnight = getDayMidnightUtc(new Date(), timezone);

    const holidays = await Holiday.find({
      organizationId: req.organizationId,
      date: { $gte: todayMidnight },
    })
      .sort({ date: 1 })
      .limit(limit)
      .lean();

    return res.json(
      holidays.map((h) => ({
        _id: h._id,
        name: h.name,
        date: h.date,
        isOptional: !!h.isOptional,
      }))
    );
  } catch (err) {
    console.error('[hrController.getUpcomingHolidays] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve upcoming holidays.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/hr/holidays — admin/HR only
// ─────────────────────────────────────────────────────────
const createHoliday = async (req, res) => {
  try {
    if (!canManageHolidays(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only admins and HR can manage holidays.' });
    }

    const { name, date, isOptional } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Holiday name is required.' });
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return res.status(400).json({ error: 'Invalid holiday date.' });
    }

    const holiday = await Holiday.create({
      organizationId: req.organizationId,
      name: String(name).trim(),
      date: d,
      isOptional: Boolean(isOptional),
    });

    return res.status(201).json(holiday.toObject());
  } catch (err) {
    console.error('[hrController.createHoliday] Error:', err);
    return res.status(500).json({ error: 'Failed to create holiday.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/hr/holidays/:id — admin/HR only
// ─────────────────────────────────────────────────────────
const updateHoliday = async (req, res) => {
  try {
    if (!canManageHolidays(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only admins and HR can manage holidays.' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid holiday id.' });
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.date !== undefined) {
      const d = new Date(req.body.date);
      if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid holiday date.' });
      updates.date = d;
    }
    if (req.body.isOptional !== undefined) updates.isOptional = Boolean(req.body.isOptional);

    const holiday = await Holiday.findOneAndUpdate(
      scopedFilter(req, { _id: id }),
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!holiday) {
      return res.status(404).json({ error: 'Holiday not found.' });
    }

    return res.json(holiday);
  } catch (err) {
    console.error('[hrController.updateHoliday] Error:', err);
    return res.status(500).json({ error: 'Failed to update holiday.' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/hr/holidays/:id — admin/HR only
// ─────────────────────────────────────────────────────────
const deleteHoliday = async (req, res) => {
  try {
    if (!canManageHolidays(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only admins and HR can manage holidays.' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid holiday id.' });
    }

    const holiday = await Holiday.findOneAndDelete(scopedFilter(req, { _id: id }));
    if (!holiday) {
      return res.status(404).json({ error: 'Holiday not found.' });
    }

    return res.json({ message: 'Holiday deleted successfully.' });
  } catch (err) {
    console.error('[hrController.deleteHoliday] Error:', err);
    return res.status(500).json({ error: 'Failed to delete holiday.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/summary
// KPI payload shaped for the existing Dashboard KpiCard contract:
//  - headcount (active employees)
//  - present today
//  - pending leave requests
//  - upcoming holidays (next 30 days)
// ─────────────────────────────────────────────────────────
const getHrSummary = async (req, res) => {
  try {
    const org = await Organization.findById(req.organizationId).select('timezone').lean();
    const timezone = org?.timezone || 'Asia/Kolkata';
    const now = new Date();
    const todayMidnight = getDayMidnightUtc(now, timezone);

    const [headcount, presentToday, onBreakToday, checkedOutToday, pendingLeaves, upcomingHolidays] =
      await Promise.all([
        Employee.countDocuments(scopedFilter(req, { status: 'active' })),
        AttendanceRecord.countDocuments({
          organizationId: req.organizationId,
          date: todayMidnight,
          checkInAt: { $ne: null },
          checkOutAt: null,
          breaks: { $not: { $elemMatch: { breakOutAt: null } } },
        }),
        AttendanceRecord.countDocuments({
          organizationId: req.organizationId,
          date: todayMidnight,
          breaks: { $elemMatch: { breakOutAt: null } },
        }),
        AttendanceRecord.countDocuments({
          organizationId: req.organizationId,
          date: todayMidnight,
          checkOutAt: { $ne: null },
        }),
        LeaveRequest.countDocuments({ organizationId: req.organizationId, status: 'pending' }),
        Holiday.countDocuments({
          organizationId: req.organizationId,
          date: { $gte: todayMidnight, $lte: new Date(todayMidnight.getTime() + 30 * 24 * 60 * 60 * 1000) },
        }),
      ]);

    // Total accounts in the org (roster size)
    const totalAccounts = await User.countDocuments({
      organizationId: req.organizationId,
      status: { $ne: 'disabled' },
    });

    return res.json({
      headcount,
      totalAccounts,
      presentToday,
      onBreakToday,
      checkedOutToday,
      notClockedInToday: Math.max(0, totalAccounts - presentToday - onBreakToday - checkedOutToday),
      pendingLeaveRequests: pendingLeaves,
      upcomingHolidays,
    });
  } catch (err) {
    console.error('[hrController.getHrSummary] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve HR summary.' });
  }
};

module.exports = {
  getHolidays,
  getUpcomingHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  getHrSummary,
};
