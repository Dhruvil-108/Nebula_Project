const LeaveType = require('../models/LeaveType');
const LeaveBalance = require('../models/LeaveBalance');
const Holiday = require('../models/Holiday');

/**
 * Returns a UTC Date representing the start of the day (00:00:00.000) for a given date in a specific timezone.
 * Defaults to 'Asia/Kolkata'.
 */
const getDayMidnightUtc = (dateInput = new Date(), timezone = 'Asia/Kolkata') => {
  const d = new Date(dateInput);
  
  // Format the date in the organization's timezone: YYYY-MM-DD
  let dateString;
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    dateString = formatter.format(d); // "YYYY-MM-DD"
  } catch (err) {
    // Fallback if timezone string is invalid
    dateString = d.toISOString().slice(0, 10);
  }

  const [year, month, day] = dateString.split('-').map(Number);
  // Create UTC Date representing midnight of that local day
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

/**
 * Checks if a check-in time is late relative to shift start time in org timezone.
 * @param {Date} checkInTime 
 * @param {string} shiftStartTimeStr - e.g. "09:30"
 * @param {string} timezone - e.g. "Asia/Kolkata"
 */
const isTimeLate = (checkInTime, shiftStartTimeStr = '09:30', timezone = 'Asia/Kolkata') => {
  if (!checkInTime) return false;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const timeParts = formatter.format(checkInTime).split(':');
    const checkInHours = parseInt(timeParts[0], 10);
    const checkInMinutes = parseInt(timeParts[1], 10);

    const [shiftHours, shiftMinutes] = (shiftStartTimeStr || '09:30').split(':').map((v) => parseInt(v, 10));

    const checkInTotalMin = checkInHours * 60 + checkInMinutes;
    const shiftTotalMin = shiftHours * 60 + shiftMinutes;

    return checkInTotalMin > shiftTotalMin;
  } catch (err) {
    return false;
  }
};

/**
 * Computes total worked minutes excluding break durations.
 * Supports live running computation when checkOutAt is null.
 */
const calculateWorkedMinutes = (record, referenceTime = new Date()) => {
  if (!record || !record.checkInAt) return 0;

  const checkIn = new Date(record.checkInAt).getTime();
  const checkOut = record.checkOutAt ? new Date(record.checkOutAt).getTime() : referenceTime.getTime();

  let totalBreakMs = 0;
  if (record.breaks && Array.isArray(record.breaks)) {
    for (const brk of record.breaks) {
      if (!brk.breakInAt) continue;
      const bIn = new Date(brk.breakInAt).getTime();
      const bOut = brk.breakOutAt ? new Date(brk.breakOutAt).getTime() : referenceTime.getTime();
      if (bOut > bIn) {
        totalBreakMs += bOut - bIn;
      }
    }
  }

  const grossWorkedMs = Math.max(0, checkOut - checkIn);
  const netWorkedMs = Math.max(0, grossWorkedMs - totalBreakMs);

  return Math.floor(netWorkedMs / (1000 * 60));
};

/**
 * Default standard leave types seeded for each organization.
 */
const DEFAULT_LEAVE_TYPES = [
  { name: 'Casual Leave', annualQuota: 12, carryForward: false },
  { name: 'Sick Leave', annualQuota: 8, carryForward: false },
  { name: 'Earned Leave', annualQuota: 15, carryForward: true },
  { name: 'Unpaid Leave', annualQuota: 0, carryForward: false },
];

/**
 * Seeds default leave types and employee balance records if they don't exist yet.
 */
const ensureLeaveBalancesForEmployee = async (organizationId, employeeId, year = new Date().getUTCFullYear()) => {
  // 1. Ensure LeaveTypes exist for this org
  let leaveTypes = await LeaveType.find({ organizationId });
  if (!leaveTypes || leaveTypes.length === 0) {
    const typesToCreate = DEFAULT_LEAVE_TYPES.map((lt) => ({
      ...lt,
      organizationId,
    }));
    leaveTypes = await LeaveType.insertMany(typesToCreate);
  }

  // 2. Ensure LeaveBalance exists for each leave type for this employee and year
  const balances = [];
  for (const lt of leaveTypes) {
    let balance = await LeaveBalance.findOne({
      organizationId,
      employeeId,
      leaveTypeId: lt._id,
      year,
    });

    if (!balance) {
      balance = await LeaveBalance.create({
        organizationId,
        employeeId,
        leaveTypeId: lt._id,
        year,
        allocated: lt.annualQuota,
        used: 0,
      });
    }
    balances.push(balance);
  }

  return balances;
};

/**
 * Seeds default holidays for the org if none exist.
 */
const ensureHolidaysForOrg = async (organizationId, currentYear = new Date().getUTCFullYear()) => {
  const existingCount = await Holiday.countDocuments({ organizationId });
  if (existingCount > 0) return;

  const defaultHolidays = [
    { name: "New Year's Day", date: new Date(Date.UTC(currentYear, 0, 1)), isOptional: false },
    { name: "Republic Day", date: new Date(Date.UTC(currentYear, 0, 26)), isOptional: false },
    { name: "Labor Day / May Day", date: new Date(Date.UTC(currentYear, 4, 1)), isOptional: false },
    { name: "Independence Day", date: new Date(Date.UTC(currentYear, 7, 15)), isOptional: false },
    { name: "Gandhi Jayanti", date: new Date(Date.UTC(currentYear, 9, 2)), isOptional: false },
    { name: "Diwali", date: new Date(Date.UTC(currentYear, 10, 1)), isOptional: false },
    { name: "Christmas Day", date: new Date(Date.UTC(currentYear, 11, 25)), isOptional: false },
    // Next year sample
    { name: "New Year's Day", date: new Date(Date.UTC(currentYear + 1, 0, 1)), isOptional: false },
    { name: "Republic Day", date: new Date(Date.UTC(currentYear + 1, 0, 26)), isOptional: false },
  ];

  await Holiday.insertMany(
    defaultHolidays.map((h) => ({ ...h, organizationId }))
  );
};

module.exports = {
  getDayMidnightUtc,
  isTimeLate,
  calculateWorkedMinutes,
  ensureLeaveBalancesForEmployee,
  ensureHolidaysForOrg,
  DEFAULT_LEAVE_TYPES,
};
