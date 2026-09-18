const express = require('express');
const router = express.Router();

const {
  getLeaveBalances,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
} = require('../controllers/leaveController');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../middleware/moduleAccess');

// All leave routes require auth
router.use(requireAuth);

router.get('/balance', getLeaveBalances);
router.post('/requests', createLeaveRequest);

// Approvals/rejections gated by the dynamic permission matrix
// (hrms:approve) — same gate as the /hr module, so revoking the
// permission actually revokes it everywhere.
router.patch(
  '/requests/:id/approve',
  requireModuleAccess('hrms', 'approve'),
  approveLeaveRequest
);

router.patch(
  '/requests/:id/reject',
  requireModuleAccess('hrms', 'approve'),
  rejectLeaveRequest
);

module.exports = router;
