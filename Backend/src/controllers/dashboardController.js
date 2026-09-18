const AttendanceRecord = require('../models/AttendanceRecord');
const Organization = require('../models/Organization');
const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const Holiday = require('../models/Holiday');
const { Permission } = require('../models/Permission');
const { getDayMidnightUtc, ensureHolidaysForOrg } = require('../utils/attendanceUtils');

/**
 * GET /api/v1/dashboard/stats
 * Returns live, real, role-tailored dashboard metrics and rosters for the current user's organization.
 */
const getDashboardStats = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const userId = req.user._id;
    const userRole = req.user.role;

    const org = await Organization.findById(orgId).select('name timezone shiftStartTime primaryFocus').lean();
    const timezone = org?.timezone || 'Asia/Kolkata';
    const now = new Date();
    const todayMidnight = getDayMidnightUtc(now, timezone);
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth(); // 0-indexed

    await ensureHolidaysForOrg(orgId, currentYear);

    // 1. All active users in this organization
    const allUsers = await User.find({
      organizationId: orgId,
      status: { $ne: 'disabled' },
    })
      .select('fullName email role createdAt status')
      .sort({ createdAt: -1 })
      .lean();

    const totalAccounts = allUsers.length;

    // Role breakdown
    const roleDistribution = {};
    allUsers.forEach((u) => {
      roleDistribution[u.role] = (roleDistribution[u.role] || 0) + 1;
    });
    const activeRolesList = Object.keys(roleDistribution);

    // 2. Today's attendance records for the organization
    const todayRecords = await AttendanceRecord.find({
      organizationId: orgId,
      date: todayMidnight,
    }).lean();

    const todayRecordsMap = new Map();
    todayRecords.forEach((r) => {
      todayRecordsMap.set(r.employeeId.toString(), r);
    });

    let checkedInTodayCount = 0;
    let onBreakTodayCount = 0;
    let checkedOutTodayCount = 0;

    const todayRoster = allUsers.map((u) => {
      const rec = todayRecordsMap.get(u._id.toString());
      let status = 'not_checked_in';
      let checkInTime = null;
      let checkOutTime = null;
      let workedMinutes = 0;

      if (rec) {
        if (rec.checkOutAt) {
          status = 'checked_out';
          checkedOutTodayCount++;
        } else if (rec.breaks && rec.breaks.some((b) => b.breakOutAt === null)) {
          status = 'on_break';
          onBreakTodayCount++;
        } else if (rec.checkInAt) {
          status = 'checked_in';
          checkedInTodayCount++;
        }
        checkInTime = rec.checkInAt;
        checkOutTime = rec.checkOutAt;
        workedMinutes = rec.totalWorkedMinutes || 0;
      }

      return {
        userId: u._id.toString(),
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        status,
        checkInAt: checkInTime,
        checkOutAt: checkOutTime,
        workedMinutes,
        isLate: rec?.isLate || false,
      };
    });

    const activeTodayTotal = checkedInTodayCount + onBreakTodayCount + checkedOutTodayCount;
    const notCheckedInTodayCount = Math.max(0, totalAccounts - activeTodayTotal);
    const todayAttendanceRate = totalAccounts > 0 ? Math.round((activeTodayTotal / totalAccounts) * 100) : 0;

    // 3. Organization Leave requests
    const pendingLeaves = await LeaveRequest.find({
      organizationId: orgId,
      status: 'pending',
    })
      .populate('employeeId', 'fullName email role')
      .populate('leaveTypeId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const pendingLeavesCount = pendingLeaves.length;

    // 4. Configured Permissions count
    const configuredPermissionsCount = await Permission.countDocuments({
      organizationId: orgId,
      enabled: true,
    });

    // 5. Personal metrics for the logged-in user
    const monthStartUtc = new Date(Date.UTC(currentYear, currentMonth, 1));
    const monthEndUtc = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59));

    const myMonthRecords = await AttendanceRecord.find({
      organizationId: orgId,
      employeeId: userId,
      date: { $gte: monthStartUtc, $lte: monthEndUtc },
    }).lean();

    const myDaysPresent = myMonthRecords.filter((r) => r.status === 'present' || r.checkInAt != null).length;
    const myTotalWorkedMinutes = myMonthRecords.reduce((acc, r) => acc + (r.totalWorkedMinutes || 0), 0);
    const myWorkedHours = Number((myTotalWorkedMinutes / 60).toFixed(1));

    // My leave balances
    const myBalances = await LeaveBalance.find({
      organizationId: orgId,
      employeeId: userId,
      year: currentYear,
    }).populate('leaveTypeId', 'name').lean();

    // LeaveBalance.lean() drops the `remaining` virtual — compute it here
    const myRemainingLeaves = myBalances.reduce(
      (acc, b) => acc + Math.max(0, (b.allocated || 0) - (b.used || 0)),
      0
    );

    const myPendingLeavesCount = pendingLeaves.filter(
      (l) => l.employeeId?._id?.toString() === userId.toString()
    ).length;

    const myTodayRecord = todayRecordsMap.get(userId.toString());
    let myCurrentStatus = 'not_checked_in';
    if (myTodayRecord) {
      if (myTodayRecord.checkOutAt) myCurrentStatus = 'checked_out';
      else if (myTodayRecord.breaks?.some((b) => b.breakOutAt === null)) myCurrentStatus = 'on_break';
      else if (myTodayRecord.checkInAt) myCurrentStatus = 'checked_in';
    }

    // 6. Upcoming Holidays
    const upcomingHolidays = await Holiday.find({
      organizationId: orgId,
      date: { $gte: todayMidnight },
    })
      .sort({ date: 1 })
      .limit(5)
      .lean();

    // 7. Managed staff count (for HR)
    const managedStaffCount = allUsers.filter((u) =>
      ['employee', 'intern', 'recruiter'].includes(u.role)
    ).length;

    return res.status(200).json({
      organization: {
        id: orgId.toString(),
        name: org?.name || 'My Organization',
        timezone,
        shiftStartTime: org?.shiftStartTime || '09:30',
      },
      stats: {
        totalAccounts,
        roleDistribution,
        activeRolesList,
        checkedInTodayCount,
        onBreakTodayCount,
        checkedOutTodayCount,
        notCheckedInTodayCount,
        activeTodayTotal,
        todayAttendanceRate,
        pendingLeavesCount,
        configuredPermissionsCount,
        managedStaffCount,
        upcomingHolidaysCount: upcomingHolidays.length,
      },
      personal: {
        myCurrentStatus,
        myDaysPresent,
        myWorkedHours,
        myRemainingLeaves,
        myPendingLeavesCount,
      },
      todayRoster,
      pendingLeaves: pendingLeaves.map((l) => ({
        id: l._id.toString(),
        employeeName: l.employeeId?.fullName || 'Team Member',
        employeeEmail: l.employeeId?.email || '',
        employeeRole: l.employeeId?.role || 'employee',
        leaveType: l.leaveTypeId?.name || 'Leave',
        startDate: l.startDate,
        endDate: l.endDate,
        days: l.totalDays,
        reason: l.reason,
        createdAt: l.createdAt,
      })),
      upcomingHolidays: upcomingHolidays.map((h) => ({
        id: h._id.toString(),
        name: h.name,
        date: h.date,
        dayOfWeek: new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' }),
      })),
    });
  } catch (err) {
    console.error('[getDashboardStats Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve dashboard statistics.' });
  }
};

module.exports = {
  getDashboardStats,
};
