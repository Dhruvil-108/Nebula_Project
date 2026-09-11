const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/dashboardController');

// All dashboard endpoints require valid auth
router.use(requireAuth);

router.get('/stats', getDashboardStats);

module.exports = router;
