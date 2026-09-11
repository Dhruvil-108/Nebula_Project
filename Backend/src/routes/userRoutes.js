const express = require('express');
const router = express.Router();

const { getMe, getMyProfile, getUsers, createUser } = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Authenticated user profile and management endpoints
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get the current authenticated user and their organization
 */
router.get('/me', requireAuth, getMe);
router.get('/me/profile', requireAuth, getMyProfile);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List organization user accounts
 *   post:
 *     summary: Provision a new user account
 */
router.get(
  '/',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR),
  getUsers
);

router.post(
  '/',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR),
  createUser
);

module.exports = router;
