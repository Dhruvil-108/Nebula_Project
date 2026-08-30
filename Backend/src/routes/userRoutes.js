const express = require('express');
const router = express.Router();

const { getMe } = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Authenticated user profile endpoints
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get the current authenticated user and their organization
 *     description: |
 *       Returns the full profile of the currently authenticated user along with
 *       their organization's details. This is called by the Dashboard shell on
 *       load to render the sidebar and greet the user.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user and organization data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MeResponse'
 *       401:
 *         description: Missing, invalid, or expired access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Account is disabled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', requireAuth, getMe);

module.exports = router;
