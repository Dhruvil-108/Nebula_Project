const mongoose = require('mongoose');
const LeaveType = require('../models/LeaveType');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveLedger = require('../models/LeaveLedger');
const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const Holiday = require('../models/Holiday');
const HrSetting = require('../models/HrSetting');
const { logAuditEvent } = require('./auditService');

/**
 * Execute monthly leave accrual for active employees in an organization.
 * Idempotent: Skips employees who already received accrual for the given month/year.
 */
const runMonthlyAccrual = async (organizationId, month, year, actorUserId = null) => {
  const targetYear = year || new Date().getUTCFullYear();
  const targetMonth = month || new Date().getUTCMonth() + 1; // 1-12

  const activeEmployees = await Employee.find({
    organizationId,
    status: 'active',
  }).lean();

  const monthlyLeaveTypes = await LeaveType.find({
    organizationId,
    isActive: true,
    accrualFrequency: 'monthly',
    monthlyAccrualRate: { $gt: 0 },
  }).lean();

  let employeesProcessed = 0;
  let totalCreditsIssued = 0;
  const ledgerEntries = [];

  for (const emp of activeEmployees) {
    // If employee joined after the target month/year, skip
    if (emp.joiningDate) {
      const join = new Date(emp.joiningDate);
      const joinYear = join.getUTCFullYear();
      const joinMonth = join.getUTCMonth() + 1;

      if (joinYear > targetYear || (joinYear === targetYear && joinMonth > targetMonth)) {
        continue;
      }
    }

    for (const lt of monthlyLeaveTypes) {
      const noteIdentifier = `Monthly accrual ${targetMonth}/${targetYear} [${lt.code || lt.name}]`;

      // Check idempotency: already accrued for this month?
      const existingLedger = await LeaveLedger.findOne({
        organizationId,
        employeeId: emp._id,
        leaveTypeId: lt._id,
        year: targetYear,
        transactionType: 'credit_accrual',
        notes: { $regex: new RegExp(`^Monthly accrual ${targetMonth}/${targetYear}`) },
      }).lean();

      if (existingLedger) {
        continue; // already processed
      }

      // Proration calculation: joined in target month
      let creditDays = lt.monthlyAccrualRate;
      if (emp.joiningDate) {
        const join = new Date(emp.joiningDate);
        if (join.getUTCFullYear() === targetYear && join.getUTCMonth() + 1 === targetMonth) {
          // If joined after 15th, grant half month accrual
          if (join.getUTCDate() > 15) {
            creditDays = Math.round((lt.monthlyAccrualRate / 2) * 10) / 10;
          }
        }
      }

      if (creditDays <= 0) continue;

      // Upsert balance
      let balance = await LeaveBalance.findOne({
        organizationId,
        employeeId: emp._id,
        leaveTypeId: lt._id,
        year: targetYear,
      });

      if (!balance) {
        balance = new LeaveBalance({
          organizationId,
          employeeId: emp._id,
          userId: emp.userId || null,
          leaveTypeId: lt._id,
          year: targetYear,
          allocated: 0,
          used: 0,
        });
      }

      const balanceBefore = balance.allocated || 0;
      balance.allocated = Math.round((balanceBefore + creditDays) * 10) / 10;
      await balance.save();

      const ledger = await LeaveLedger.create({
        organizationId,
        employeeId: emp._id,
        userId: emp.userId || null,
        leaveTypeId: lt._id,
        year: targetYear,
        transactionType: 'credit_accrual',
        days: creditDays,
        balanceBefore,
        balanceAfter: balance.allocated,
        referenceType: 'SystemCron',
        notes: noteIdentifier,
        performedBy: actorUserId,
        effectiveDate: new Date(Date.UTC(targetYear, targetMonth - 1, 1)),
      });

      ledgerEntries.push(ledger);
      totalCreditsIssued += creditDays;
    }

    employeesProcessed++;
  }

  if (actorUserId) {
    await logAuditEvent({
      organizationId,
      actorUserId,
      action: 'leave.accrual_run',
      entityType: 'LeaveLedger',
      entityId: organizationId,
      after: {
        targetMonth,
        targetYear,
        employeesProcessed,
        totalCreditsIssued,
      },
    });
  }

  return {
    success: true,
    targetMonth,
    targetYear,
    employeesProcessed,
    totalCreditsIssued: Math.round(totalCreditsIssued * 10) / 10,
    recordsCreated: ledgerEntries.length,
  };
};

/**
 * Evaluates the Sandwich Leave Policy for a requested date range.
 * If leaveType has sandwichRuleEnabled:
 * - Weekends / weekly-offs directly between or adjacent to leaves count towards total deduction.
 */
const evaluateSandwichRule = async (organizationId, employeeId, startDate, endDate, leaveTypeId) => {
  const leaveType = await LeaveType.findOne({
    _id: leaveTypeId,
    organizationId,
  }).lean();

  if (!leaveType) {
    throw new Error('Leave type not found.');
  }

  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(0, 0, 0, 0);

  if (end < start) {
    throw new Error('End date cannot precede start date.');
  }

  // Get organization settings for workWeekDays
  const hrSetting = await HrSetting.findOne({ organizationId }).lean();
  const workWeekDays = hrSetting?.workWeekDays || [1, 2, 3, 4, 5]; // default Mon-Fri

  // Fetch holidays for the year
  const holidays = await Holiday.find({
    organizationId,
    date: {
      $gte: new Date(Date.UTC(start.getUTCFullYear(), 0, 1)),
      $lte: new Date(Date.UTC(end.getUTCFullYear(), 11, 31)),
    },
  }).lean();

  const holidaySet = new Set(holidays.map((h) => new Date(h.date).toISOString().slice(0, 10)));

  // Calculate base requested days
  let baseWorkingDays = 0;
  let internalOffDays = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    const dayOfWeek = cursor.getUTCDay();
    const dateStr = cursor.toISOString().slice(0, 10);
    const isWorkDay = workWeekDays.includes(dayOfWeek) && !holidaySet.has(dateStr);

    if (isWorkDay) {
      baseWorkingDays++;
    } else {
      internalOffDays++;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  if (!leaveType.sandwichRuleEnabled) {
    return {
      baseDays: baseWorkingDays || 1,
      sandwichDays: 0,
      totalDays: baseWorkingDays || 1,
      isSandwichApplied: false,
      sandwichDates: [],
      explanation: 'Standard deduction (sandwich rule not applicable).',
    };
  }

  // If sandwichRuleEnabled, internal weekend/holidays within the leave window count as leave days
  let sandwichDays = internalOffDays;
  const sandwichDates = [];

  // Re-check internal off days
  const subCursor = new Date(start);
  while (subCursor <= end) {
    const dayOfWeek = subCursor.getUTCDay();
    const dateStr = subCursor.toISOString().slice(0, 10);
    const isOff = !workWeekDays.includes(dayOfWeek) || holidaySet.has(dateStr);
    if (isOff) {
      sandwichDates.push(dateStr);
    }
    subCursor.setUTCDate(subCursor.getUTCDate() + 1);
  }

  // Check border sandwiching: Friday leave + Monday leave
  // If startDate is Monday, check if previous Friday was on leave
  const prevFriday = new Date(start);
  if (start.getUTCDay() === 1) { // Monday
    prevFriday.setUTCDate(prevFriday.getUTCDate() - 3); // Friday
    const prevLeave = await LeaveRequest.findOne({
      organizationId,
      employeeId,
      status: 'approved',
      startDate: { $lte: prevFriday },
      endDate: { $gte: prevFriday },
    }).lean();

    if (prevLeave) {
      // Sat and Sun get sandwiched
      const sat = new Date(start);
      sat.setUTCDate(sat.getUTCDate() - 2);
      const sun = new Date(start);
      sun.setUTCDate(sun.getUTCDate() - 1);
      sandwichDates.push(sat.toISOString().slice(0, 10));
      sandwichDates.push(sun.toISOString().slice(0, 10));
      sandwichDays += 2;
    }
  }

  const totalDays = baseWorkingDays + sandwichDays;

  return {
    baseDays: baseWorkingDays,
    sandwichDays,
    totalDays: Math.max(1, totalDays),
    isSandwichApplied: sandwichDays > 0,
    sandwichDates: Array.from(new Set(sandwichDates)),
    explanation:
      sandwichDays > 0
        ? `Sandwich rule applied: ${sandwichDays} weekly-off / holiday day(s) included in leave count.`
        : 'No sandwich rule deduction needed.',
  };
};

/**
 * Year-end leave balance carry-forward and lapse processing.
 */
const runYearEndProcessing = async (organizationId, fromYear, toYear, actorUserId = null) => {
  const leaveTypes = await LeaveType.find({ organizationId, isActive: true }).lean();
  const balances = await LeaveBalance.find({ organizationId, year: fromYear }).lean();

  let carryForwardCount = 0;
  let lapsedCount = 0;

  for (const bal of balances) {
    const lt = leaveTypes.find((t) => String(t._id) === String(bal.leaveTypeId));
    if (!lt) continue;

    const remaining = Math.max(0, (bal.allocated || 0) - (bal.used || 0));
    if (remaining <= 0) continue;

    let carried = 0;
    let lapsed = 0;

    if (lt.carryForward) {
      const maxCarry = lt.maxCarryForward || remaining;
      carried = Math.min(remaining, maxCarry);
      lapsed = Math.max(0, remaining - carried);
    } else {
      lapsed = remaining;
    }

    // Record lapse in fromYear
    if (lapsed > 0) {
      await LeaveLedger.create({
        organizationId,
        employeeId: bal.employeeId,
        userId: bal.userId,
        leaveTypeId: lt._id,
        year: fromYear,
        transactionType: 'debit_lapse',
        days: -lapsed,
        balanceBefore: bal.allocated,
        balanceAfter: (bal.allocated || 0) - lapsed,
        referenceType: 'SystemCron',
        notes: `Year-end leave lapse for ${fromYear}`,
        performedBy: actorUserId,
      });
      lapsedCount++;
    }

    // In toYear, create or update balance with carried forward amount
    if (carried > 0) {
      let nextBal = await LeaveBalance.findOne({
        organizationId,
        employeeId: bal.employeeId,
        leaveTypeId: lt._id,
        year: toYear,
      });

      if (!nextBal) {
        nextBal = new LeaveBalance({
          organizationId,
          employeeId: bal.employeeId,
          userId: bal.userId,
          leaveTypeId: lt._id,
          year: toYear,
          allocated: 0,
          used: 0,
        });
      }

      const balBefore = nextBal.allocated || 0;
      nextBal.allocated = Math.round((balBefore + carried) * 10) / 10;
      await nextBal.save();

      await LeaveLedger.create({
        organizationId,
        employeeId: bal.employeeId,
        userId: bal.userId,
        leaveTypeId: lt._id,
        year: toYear,
        transactionType: 'credit_annual',
        days: carried,
        balanceBefore: balBefore,
        balanceAfter: nextBal.allocated,
        referenceType: 'SystemCron',
        notes: `Carried forward from ${fromYear}`,
        performedBy: actorUserId,
      });
      carryForwardCount++;
    }
  }

  return {
    success: true,
    fromYear,
    toYear,
    carryForwardCount,
    lapsedCount,
  };
};

module.exports = {
  runMonthlyAccrual,
  evaluateSandwichRule,
  runYearEndProcessing,
};
