const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const { signup, login, refresh, logout } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// Tight rate limiting for auth routes — 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again after 15 minutes.' },
});

const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
});

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication — signup, login, refresh token, logout
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a new organization and super admin account
 *     description: |
 *       Powers the 5-step Sign Up wizard. Creates the Organization, the first User
 *       (as `super_admin`), and any pending Invite records — all in one atomic
 *       MongoDB transaction. Returns an access + refresh token pair on success.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: Organization and user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SignupResponse'
 *       400:
 *         description: Validation error (missing fields, bad email, weak password, invalid invite role)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded (5 requests per 15 minutes)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error (transaction rolled back — no orphan data)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/signup', strictAuthLimiter, signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Sign in with email and password
 *     description: |
 *       Returns an access token (15 min) and a refresh token (7 days).
 *       The refresh token is stored as a bcrypt hash — the raw token is never persisted.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Account disabled or organization inactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded (5 requests per 15 minutes)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', strictAuthLimiter, login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Rotate the refresh token and get a new token pair
 *     description: |
 *       Verifies the refresh token against the stored bcrypt hash.
 *       Issues a **brand new** access + refresh token pair (rotation on every use).
 *       If the token doesn't match the stored hash — possible theft — the entire
 *       session is invalidated immediately.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: New token pair issued
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Refresh token not provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid, expired, or replayed refresh token (session wiped on mismatch)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh', authLimiter, refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Sign out and invalidate the current session
 *     description: |
 *       Clears the stored refresh token hash, making the refresh token permanently
 *       invalid. Requires a valid access token in the Authorization header.
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout', requireAuth, logout);

module.exports = router;
