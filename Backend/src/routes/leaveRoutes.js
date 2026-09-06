const express = require('express');
const router = express.Router();

const {
  getLeaveBalances,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
} = require('../controllers/leaveController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// All leave routes require auth
router.use(requireAuth);

router.get('/balance', getLeaveBalances);
router.post('/requests', createLeaveRequest);

// Approvals/rejections restricted to managers, HR, admins, super_admins
router.patch(
  '/requests/:id/approve',
  requireRole(ROLES.MANAGER, ROLES.HR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  approveLeaveRequest
);

router.patch(
  '/requests/:id/reject',
  requireRole(ROLES.MANAGER, ROLES.HR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  rejectLeaveRequest
);

module.exports = router;
