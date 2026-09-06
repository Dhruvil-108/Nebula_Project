const Holiday = require('../models/Holiday');
const Organization = require('../models/Organization');
const { ensureHolidaysForOrg, getDayMidnightUtc } = require('../utils/attendanceUtils');

// ─────────────────────────────────────────────────────────
// GET /api/v1/holidays/upcoming?limit=5
// ─────────────────────────────────────────────────────────
const getUpcomingHolidays = async (req, res) => {
  try {
    const { organizationId } = req;
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));

    const org = await Organization.findById(organizationId).select('timezone').lean();
    const timezone = org?.timezone || 'Asia/Kolkata';

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    await ensureHolidaysForOrg(organizationId, currentYear);

    const todayMidnight = getDayMidnightUtc(now, timezone);

    const holidays = await Holiday.find({
      organizationId,
      date: { $gte: todayMidnight },
    })
      .sort({ date: 1 })
      .limit(limit)
      .lean();

    const formatted = holidays.map((h) => ({
      id: h._id.toString(),
      name: h.name,
      date: new Date(h.date).toISOString().slice(0, 10),
      isOptional: !!h.isOptional,
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('[holiday.getUpcomingHolidays] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve upcoming holidays.' });
  }
};

module.exports = {
  getUpcomingHolidays,
};
