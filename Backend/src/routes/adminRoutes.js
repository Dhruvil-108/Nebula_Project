const express = require('express');
const router = express.Router();

const {
  getOverview,
  getUsers,
  updateUserStatus,
  updateUserRole,
  getAuditLogs,
} = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// The Admin Panel is exclusively for super_admin and admin
router.use(requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN));

// Overview — payload is shaped by the viewer's role inside the controller
router.get('/overview', getOverview);

// Accounts
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
// Role management is a super_admin exclusive power
router.patch('/users/:id/role', requireRole(ROLES.SUPER_ADMIN), updateUserRole);

// Audit trail — super_admin exclusive
router.get('/audit-logs', requireRole(ROLES.SUPER_ADMIN), getAuditLogs);

module.exports = router;
