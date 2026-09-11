const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');
const {
  getCatalog,
  getPermissions,
  updatePermissions,
} = require('../controllers/permissionController');

const router = express.Router();

// All permission routes require Super Admin authentication
router.use(requireAuth, requireRole(ROLES.SUPER_ADMIN));

router.get('/catalog', getCatalog);
router.get('/', getPermissions);
router.put('/', updatePermissions);

module.exports = router;
