const rateLimit = require('express-rate-limit');

/**
 * Granular Rate Limiters for Expenses API Endpoints
 * Prevents financial brute-force, AI token abuse, and concurrent payment race conditions.
 */

// 1. AI Scan Limiter: 30 requests per minute per IP
const aiScanRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many receipt scan requests. Please wait a moment before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Spend Copilot Limiter: 45 requests per minute per IP
const copilotRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 45,
  message: {
    success: false,
    message: 'Copilot query rate limit exceeded. Please pace your analytical queries.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Batch Payment Execution Limiter: 10 calls per minute
const paymentExecutionRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Payment execution frequency threshold reached. Prevents duplicate disbursement races.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  aiScanRateLimiter,
  copilotRateLimiter,
  paymentExecutionRateLimiter,
};
