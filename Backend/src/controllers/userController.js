const Organization = require('../models/Organization');
const User = require('../models/User');
const ProfilePhoto = require('../models/ProfilePhoto');
const AttendanceRecord = require('../models/AttendanceRecord');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const { ROLES } = require('../config/roles');
const { hashPassword } = require('../utils/password');
const { createAuditLog } = require('../utils/audit');
const { getDayMidnightUtc } = require('../utils/attendanceUtils');

// Roles permitted to be created by HR
const HR_ALLOWED_ROLES = [ROLES.EMPLOYEE, ROLES.INTERN, ROLES.RECRUITER];

// Roles permitted to be created by Super Admin & Admin
const ADMIN_ALLOWED_ROLES = [
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.HR,
  ROLES.RECRUITER,
  ROLES.SALES,
  ROLES.FINANCE,
  ROLES.INVENTORY_MANAGER,
  ROLES.EMPLOYEE,
  ROLES.INTERN,
];

// ─────────────────────────────────────────────────────────
// GET /api/v1/users/me
// ─────────────────────────────────────────────────────────

/**
 * Returns the current authenticated user and their organization.
 * req.user is set by the requireAuth middleware.
 */
const getMe = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.organizationId).lean();

    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    return res.status(200).json({
      user: {
        id: req.user._id.toString(),
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
      },
      organization: {
        id: org._id.toString(),
        name: org.name,
        primaryFocus: org.primaryFocus,
      },
    });
  } catch (err) {
    console.error('[getMe] Error:', err);
    return res.status(500).json({ error: 'Failed to load user profile.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/users/me/profile
// ─────────────────────────────────────────────────────────

/**
 * Returns a rich profile for the current authenticated user:
 * personal info, attendance stats, leave info, and role-specific data.
 */
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.organizationId;

    const org = await Organization.findById(orgId).select('name timezone shiftStartTime industry companySize').lean();
    const timezone = org?.timezone || 'Asia/Kolkata';

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();

    const monthStartUtc = new Date(Date.UTC(currentYear, currentMonth, 1));
    const monthEndUtc = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59));

    // Month attendance
    const monthRecords = await AttendanceRecord.find({
      organizationId: orgId,
      employeeId: userId,
      date: { $gte: monthStartUtc, $lte: monthEndUtc },
    }).lean();

    const daysPresent = monthRecords.filter((r) => r.checkInAt != null).length;
    const totalWorkedMinutes = monthRecords.reduce((acc, r) => acc + (r.totalWorkedMinutes || 0), 0);
    const workedHoursThisMonth = Number((totalWorkedMinutes / 60).toFixed(1));
    const lateArrivalsThisMonth = monthRecords.filter((r) => r.isLate).length;

    // All-time attendance count
    const allTimePresent = await AttendanceRecord.countDocuments({
      organizationId: orgId,
      employeeId: userId,
      checkInAt: { $ne: null },
    });

    // Leave balances for current year
    const leaveBalances = await LeaveBalance.find({
      organizationId: orgId,
      employeeId: userId,
      year: currentYear,
    }).populate('leaveTypeId', 'name').lean();

    const totalRemainingLeaves = leaveBalances.reduce((acc, b) => acc + (b.remainingDays || 0), 0);
    const totalUsedLeaves = leaveBalances.reduce((acc, b) => acc + (b.usedDays || 0), 0);

    // Pending + recent leave requests
    const pendingLeaves = await LeaveRequest.find({
      organizationId: orgId,
      employeeId: userId,
      status: 'pending',
    }).populate('leaveTypeId', 'name').sort({ createdAt: -1 }).limit(5).lean();

    const recentLeaves = await LeaveRequest.find({
      organizationId: orgId,
      employeeId: userId,
    }).populate('leaveTypeId', 'name').sort({ createdAt: -1 }).limit(5).lean();

    // Today's status
    const todayMidnight = getDayMidnightUtc(now, timezone);
    const todayRecord = await AttendanceRecord.findOne({
      organizationId: orgId,
      employeeId: userId,
      date: todayMidnight,
    }).lean();

    let todayStatus = 'not_checked_in';
    if (todayRecord) {
      if (todayRecord.checkOutAt) todayStatus = 'checked_out';
      else if (todayRecord.breaks?.some((b) => b.breakOutAt === null)) todayStatus = 'on_break';
      else if (todayRecord.checkInAt) todayStatus = 'checked_in';
    }

    return res.status(200).json({
      user: {
        id: req.user._id.toString(),
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status,
        joinedAt: req.user.createdAt,
        lastLoginAt: req.user.lastLoginAt,
        photoUrl: (await ProfilePhoto.findOne({ userId: req.user._id }).select('dataUrl').lean())?.dataUrl || null,
      },
      organization: {
        id: orgId.toString(),
        name: org?.name || 'My Organization',
        timezone: org?.timezone || 'Asia/Kolkata',
        shiftStartTime: org?.shiftStartTime || '09:30',
        industry: org?.industry || null,
        companySize: org?.companySize || null,
      },
      attendance: {
        todayStatus,
        todayCheckIn: todayRecord?.checkInAt || null,
        todayCheckOut: todayRecord?.checkOutAt || null,
        todayWorkedMinutes: todayRecord?.totalWorkedMinutes || 0,
        todayIsLate: todayRecord?.isLate || false,
        daysPresent,
        workedHoursThisMonth,
        lateArrivalsThisMonth,
        allTimeDaysPresent: allTimePresent,
      },
      leaves: {
        totalRemainingLeaves,
        totalUsedLeaves,
        pendingCount: pendingLeaves.length,
        balances: leaveBalances.map((b) => ({
          type: b.leaveTypeId?.name || 'Leave',
          remaining: b.remainingDays || 0,
          used: b.usedDays || 0,
          total: b.totalDays || 0,
        })),
        recentRequests: recentLeaves.map((l) => ({
          id: l._id.toString(),
          type: l.leaveTypeId?.name || 'Leave',
          startDate: l.startDate,
          endDate: l.endDate,
          days: l.days,
          status: l.status,
          reason: l.reason,
          createdAt: l.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error('[getMyProfile] Error:', err);
    return res.status(500).json({ error: 'Failed to load profile data.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/users
// ─────────────────────────────────────────────────────────

/**
 * Lists accounts in the current organization.
 * Accessible to super_admin, admin, and hr.
 */
const getUsers = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const users = await User.find({
      organizationId: orgId,
      status: { $ne: 'disabled' },
    })
      .select('-passwordHash -refreshTokenHash')
      .sort({ createdAt: -1 })
      .lean();

    const mapped = users.map((u) => ({
      id: u._id.toString(),
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
    }));

    return res.status(200).json({ users: mapped });
  } catch (err) {
    console.error('[getUsers] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve accounts list.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/users
// ─────────────────────────────────────────────────────────

/**
 * Creates a new user account in the organization.
 * - Super Admin / Admin: Can provision all standard roles (admin, manager, hr, recruiter, sales, finance, inventory_manager, employee, intern).
 * - HR: Can ONLY provision subordinate roles (employee, intern, recruiter).
 */
const createUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const callerRole = req.user.role;
    const orgId = req.organizationId;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    if (!role) {
      return res.status(400).json({ error: 'Role is required.' });
    }

    // Role hierarchy authorization check
    if (callerRole === ROLES.HR) {
      if (!HR_ALLOWED_ROLES.includes(role)) {
        return res.status(403).json({
          error: `HR accounts are only authorized to create Employee, Intern, or Recruiter roles. Cannot assign role: "${role}".`,
        });
      }
    } else if (callerRole === ROLES.SUPER_ADMIN || callerRole === ROLES.ADMIN) {
      if (!ADMIN_ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({
          error: `Invalid role: "${role}". Allowed roles: ${ADMIN_ALLOWED_ROLES.join(', ')}.`,
        });
      }
    } else {
      return res.status(403).json({ error: 'Access denied. You do not have permission to create accounts.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if account with same email exists in the organization
    const existing = await User.findOne({
      email: normalizedEmail,
      organizationId: orgId,
    });

    if (existing) {
      return res.status(409).json({
        error: `An account with email "${normalizedEmail}" already exists in this organization.`,
      });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      organizationId: orgId,
      status: 'active',
    });

    // Record audit log
    await createAuditLog({
      organizationId: orgId.toString(),
      actor: req.user._id.toString(),
      action: 'user_created',
      entity: 'User',
      entityId: newUser._id.toString(),
      metadata: {
        role,
        email: normalizedEmail,
        createdByRole: callerRole,
      },
    });

    return res.status(201).json({
      message: 'Account created successfully.',
      user: {
        id: newUser._id.toString(),
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error('[createUser] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create user account.' });
  }
};

module.exports = {
  getMe,
  getMyProfile,
  getUsers,
  createUser,
};
