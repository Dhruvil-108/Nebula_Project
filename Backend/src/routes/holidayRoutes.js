const express = require('express');
const router = express.Router();

const { getUpcomingHolidays } = require('../controllers/holidayController');
const { requireAuth } = require('../middleware/auth');

// All holiday routes require auth
router.use(requireAuth);

router.get('/upcoming', getUpcomingHolidays);

module.exports = router;
