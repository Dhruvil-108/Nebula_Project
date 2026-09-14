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

// All permission routes require authentication
router.use(requireAuth);

router.get('/catalog', getCatalog);
router.get('/', getPermissions);
router.put('/', requireRole(ROLES.SUPER_ADMIN), updatePermissions);

module.exports = router;
