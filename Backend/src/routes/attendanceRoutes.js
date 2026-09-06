const express = require('express');
const router = express.Router();

const {
  checkIn,
  checkOut,
  breakIn,
  breakOut,
  getToday,
  getSummary,
} = require('../controllers/attendanceController');
const { requireAuth } = require('../middleware/auth');

// All attendance routes require valid JWT auth
router.use(requireAuth);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.post('/break-in', breakIn);
router.post('/break-out', breakOut);
router.get('/today', getToday);
router.get('/summary', getSummary);

module.exports = router;
