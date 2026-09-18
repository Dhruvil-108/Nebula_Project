const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const AttendanceRecord = require('../models/AttendanceRecord');
const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const { Permission } = require('../models/Permission');
const AuditLog = require('../models/AuditLog');
const Invite = require('../models/Invite');
const { ROLES, ALL_ROLES } = require('../config/roles');
const { createAuditLog } = require('../utils/audit');
const { getDayMidnightUtc } = require('../utils/attendanceUtils');

const isSuper = (role) => role === ROLES.SUPER_ADMIN;

// Roles a super_admin may assign via the Admin Panel (never super_admin)
const ASSIGNABLE_ROLES = ALL_ROLES.filter((r) => r !== ROLES.SUPER_ADMIN);

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const mapUser = (u, viewerIsSuper) => ({
  id: u._id.toString(),
  fullName: u.fullName,
  email: u.email,
  role: u.role,
  status: u.status,
  createdAt: u.createdAt,
  lastLoginAt: viewerIsSuper ? u.lastLoginAt || null : undefined,
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/admin/overview — role-unique KPI payload
// ─────────────────────────────────────────────────────────
const getOverview = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const viewerIsSuper = isSuper(req.user.role);

    const org = await Organization.findById(orgId)
      .select('name industry companySize timezone shiftStartTime primaryFocus createdAt')
      .lean();
    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    const timezone = org.timezone || 'Asia/Kolkata';
    const todayMidnight = getDayMidnightUtc(new Date(), timezone);

    const [
      statusCounts,
      roleDistribution,
      todayRecords,
      pendingLeaves,
      activeHeadcount,
      configuredPermissionRows,
      pendingInvites,
      recentAudit,
      auditCount30d,
    ] = await Promise.all([
      // Account status breakdown in one aggregation
      User.aggregate([
        { $match: { organizationId: orgId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { organizationId: orgId, status: { $ne: 'disabled' } } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      AttendanceRecord.find({ organizationId: orgId, date: todayMidnight })
        .select('checkInAt checkOutAt breaks')
        .lean(),
      LeaveRequest.countDocuments({ organizationId: orgId, status: 'pending' }),
      Employee.countDocuments({ organizationId: orgId, status: 'active' }),
      // Super Admin only — cheap counts, skipped for admin
      viewerIsSuper
        ? Permission.countDocuments({ organizationId: orgId, enabled: true })
        : Promise.resolve(null),
      viewerIsSuper
        ? Invite.countDocuments({ organizationId: orgId, status: 'pending' }).catch(() => 0)
        : Promise.resolve(null),
      viewerIsSuper
        ? AuditLog.find({ organizationId: orgId })
            .sort({ createdAt: -1 })
            .limit(8)
            .populate('actor', 'fullName role')
            .lean()
        : Promise.resolve([]),
      viewerIsSuper
        ? AuditLog.countDocuments({
            organizationId: orgId,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          })
        : Promise.resolve(null),
    ]);

    const statusMap = { active: 0, invited: 0, disabled: 0 };
    for (const row of statusCounts) {
      statusMap[row._id] = row.count;
    }
    const totalAccounts = statusCounts.reduce((acc, r) => acc + r.count, 0);

    let checkedIn = 0;
    let onBreak = 0;
    let checkedOut = 0;
    for (const r of todayRecords) {
      if (r.checkOutAt) checkedOut++;
      else if (r.breaks?.some((b) => b.breakOutAt === null)) onBreak++;
      else if (r.checkInAt) checkedIn++;
    }
    const activeToday = checkedIn + onBreak + checkedOut;
    const attendanceRate =
      statusMap.active > 0 ? Math.round((activeToday / statusMap.active) * 100) : 0;

    const roleDist = {};
    for (const row of roleDistribution) {
      roleDist[row._id] = row.count;
    }

    // ─────────────────────────────────────────────
    // Visual analytics payloads (charts on the panel)
    // ─────────────────────────────────────────────
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekdayLabel = (date) =>
      new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date);

    const [recentAttendance, growthAgg, leaveStatsAgg] = await Promise.all([
      AttendanceRecord.find({
        organizationId: orgId,
        date: { $gte: getDayMidnightUtc(weekAgo, timezone) },
        checkInAt: { $ne: null },
      })
        .select('date')
        .lean(),
      User.aggregate([
        { $match: { organizationId: orgId } },
        {
          $group: {
            _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      LeaveRequest.aggregate([
        { $match: { organizationId: orgId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // 7-day attendance trend (% of active accounts that checked in)
    const presentByDay = new Map();
    for (const rec of recentAttendance) {
      const key = new Date(rec.date).toISOString().slice(0, 10);
      presentByDay.set(key, (presentByDay.get(key) || 0) + 1);
    }
    const activeBase = statusMap.active || 0;
    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const midnight = getDayMidnightUtc(day, timezone);
      const key = midnight.toISOString().slice(0, 10);
      const present = presentByDay.get(key) || 0;
      attendanceTrend.push({
        date: key,
        label: i === 0 ? 'Today' : weekdayLabel(midnight),
        present,
        rate: activeBase > 0 ? Math.round((present / activeBase) * 100) : 0,
      });
    }

    // Account growth — new accounts per month, last 6 months
    const growthMap = new Map(
      growthAgg.map((g) => [`${g._id.y}-${g._id.m}`, g.count])
    );
    const accountGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth() + 1;
      accountGrowth.push({
        label: new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(d),
        count: growthMap.get(`${y}-${m}`) || 0,
      });
    }

    // Leave pipeline stats
    const leaveMap = { pending: 0, approved: 0, rejected: 0 };
    for (const row of leaveStatsAgg) {
      if (row._id in leaveMap) leaveMap[row._id] = row.count;
    }
    const leaveStats = leaveMap;

    // Super Admin exclusive: login activity + audit action mix
    let loginTrend = null;
    let actionBreakdown = null;
    if (viewerIsSuper) {
      const [loginAgg, actionAgg] = await Promise.all([
        AuditLog.aggregate([
          {
            $match: {
              organizationId: orgId,
              action: 'login',
              createdAt: { $gte: getDayMidnightUtc(weekAgo, timezone) },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone } },
              count: { $sum: 1 },
            },
          },
        ]),
        AuditLog.aggregate([
          { $match: { organizationId: orgId } },
          { $group: { _id: '$action', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ]),
      ]);
      const loginMap = new Map(loginAgg.map((r) => [r._id, r.count]));
      loginTrend = [];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const midnight = getDayMidnightUtc(day, timezone);
        const key = midnight.toISOString().slice(0, 10);
        loginTrend.push({
          date: key,
          label: i === 0 ? 'Today' : weekdayLabel(midnight),
          count: loginMap.get(key) || 0,
        });
      }
      actionBreakdown = actionAgg.map((r) => ({
        action: r._id || 'unknown',
        count: r.count,
      }));
    }

    return res.json({
      viewerRole: req.user.role,
      organization: {
        id: orgId.toString(),
        name: org.name,
        industry: org.industry || null,
        companySize: org.companySize || null,
        timezone: org.timezone,
        shiftStartTime: org.shiftStartTime,
        primaryFocus: org.primaryFocus || [],
        createdAt: org.createdAt,
      },
      accounts: {
        total: totalAccounts,
        active: statusMap.active || 0,
        invited: statusMap.invited || 0,
        disabled: statusMap.disabled || 0,
        roleDistribution: roleDist,
      },
      today: {
        checkedIn,
        onBreak,
        checkedOut,
        activeToday,
        attendanceRate,
      },
      pendingLeaveRequests: pendingLeaves,
      activeHeadcount,
      attendanceTrend,
      accountGrowth,
      leaveStats,
      // ── Super Admin exclusive section ──
      ...(viewerIsSuper
        ? {
            superAdmin: {
              configuredPermissionRows: configuredPermissionRows || 0,
              pendingInvites: pendingInvites || 0,
              auditEventsLast30d: auditCount30d || 0,
              loginTrend: loginTrend || [],
              actionBreakdown: actionBreakdown || [],
              recentAudit: (recentAudit || []).map((log) => ({
                id: log._id.toString(),
                action: log.action,
                entity: log.entity,
                actorName: log.actor?.fullName || 'System',
                actorRole: log.actor?.role || null,
                ip: log.ip || null,
                createdAt: log.createdAt,
              })),
            },
          }
        : {}),
    });
  } catch (err) {
    console.error('[adminController.getOverview] Error:', err);
    return res.status(500).json({ error: 'Failed to load admin overview.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/admin/users?role=&status=&search=
// ─────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const viewerIsSuper = isSuper(req.user.role);
    const { role, status, search } = req.query;

    const extra = {};
    if (role && ALL_ROLES.includes(role)) extra.role = role;
    if (status && ['active', 'invited', 'disabled'].includes(status)) extra.status = status;

    // Admins cannot view super_admin accounts
    if (!viewerIsSuper) {
      extra.role = extra.role && extra.role !== ROLES.SUPER_ADMIN ? extra.role : { $ne: ROLES.SUPER_ADMIN };
    }

    if (search && String(search).trim()) {
      const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
      extra.$or = [{ fullName: rx }, { email: rx }];
    }

    const users = await User.find({ organizationId: orgId, ...extra })
      .select('-passwordHash -refreshTokenHash')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.json({ users: users.map((u) => mapUser(u, viewerIsSuper)) });
  } catch (err) {
    console.error('[adminController.getUsers] Error:', err);
    return res.status(500).json({ error: 'Failed to load accounts.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/admin/users/:id/status  { status }
// Enable/disable an account. Hierarchy rules enforced.
// ─────────────────────────────────────────────────────────
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const viewerIsSuper = isSuper(req.user.role);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid account id.' });
    }
    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "active" or "disabled".' });
    }
    if (id === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot change the status of your own account.' });
    }

    const target = await User.findOne({ _id: id, organizationId: req.organizationId });
    if (!target) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    // Hierarchy: admins cannot touch super_admin or admin accounts;
    // super_admin cannot touch other super_admins.
    const isProtected =
      target.role === ROLES.SUPER_ADMIN ||
      (!viewerIsSuper && target.role === ROLES.ADMIN);
    if (isProtected) {
      return res.status(403).json({ error: 'You cannot modify this account.' });
    }

    if (target.status === status) {
      return res.status(400).json({ error: `Account is already ${status}.` });
    }

    target.status = status;
    // Disabling an account must kill its active session immediately
    if (status === 'disabled') {
      target.refreshTokenHash = null;
    }
    await target.save();

    await createAuditLog({
      organizationId: req.organizationId.toString(),
      actor: req.user._id.toString(),
      action: status === 'disabled' ? 'account_disabled' : 'account_enabled',
      entity: 'User',
      entityId: target._id.toString(),
      metadata: { email: target.email, role: target.role },
    });

    return res.json({
      message: `Account ${status === 'disabled' ? 'disabled' : 'enabled'} successfully.`,
      user: mapUser(target.toObject(), viewerIsSuper),
    });
  } catch (err) {
    console.error('[adminController.updateUserStatus] Error:', err);
    return res.status(500).json({ error: 'Failed to update account status.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/admin/users/:id/role  { role } — super_admin only
// ─────────────────────────────────────────────────────────
const updateUserRole = async (req, res) => {
  try {
    if (!isSuper(req.user.role)) {
      return res.status(403).json({ error: 'Only the Super Admin can change roles.' });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid account id.' });
    }
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role: "${role}".` });
    }
    if (id === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot change your own role.' });
    }

    const target = await User.findOne({ _id: id, organizationId: req.organizationId });
    if (!target) {
      return res.status(404).json({ error: 'Account not found.' });
    }
    if (target.role === ROLES.SUPER_ADMIN) {
      return res.status(403).json({ error: 'The owner account role cannot be changed.' });
    }
    if (target.role === role) {
      return res.status(400).json({ error: `Account already has the "${role}" role.` });
    }

    const previousRole = target.role;
    target.role = role;
    await target.save();

    await createAuditLog({
      organizationId: req.organizationId.toString(),
      actor: req.user._id.toString(),
      action: 'role_changed',
      entity: 'User',
      entityId: target._id.toString(),
      metadata: { email: target.email, from: previousRole, to: role },
    });

    return res.json({
      message: `Role updated from "${previousRole}" to "${role}".`,
      user: mapUser(target.toObject(), true),
    });
  } catch (err) {
    console.error('[adminController.updateUserRole] Error:', err);
    return res.status(500).json({ error: 'Failed to update account role.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/admin/audit-logs?page=&limit=&action= — super_admin only
// ─────────────────────────────────────────────────────────
const getAuditLogs = async (req, res) => {
  try {
    if (!isSuper(req.user.role)) {
      return res.status(403).json({ error: 'Only the Super Admin can view audit logs.' });
    }

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const { action } = req.query;

    const filter = { organizationId: req.organizationId };
    if (action && String(action).trim()) {
      filter.action = String(action).trim();
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('actor', 'fullName role')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return res.json({
      logs: logs.map((log) => ({
        id: log._id.toString(),
        action: log.action,
        entity: log.entity,
        entityId: log.entityId ? log.entityId.toString() : null,
        actorName: log.actor?.fullName || 'System',
        actorRole: log.actor?.role || null,
        metadata: log.metadata || {},
        ip: log.ip || null,
        createdAt: log.createdAt,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[adminController.getAuditLogs] Error:', err);
    return res.status(500).json({ error: 'Failed to load audit logs.' });
  }
};

module.exports = {
  getOverview,
  getUsers,
  updateUserStatus,
  updateUserRole,
  getAuditLogs,
};
