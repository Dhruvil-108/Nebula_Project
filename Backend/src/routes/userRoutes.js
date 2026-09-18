const express = require('express');
const router = express.Router();

const { getMe, getMyProfile, getUsers, createUser } = require('../controllers/userController');
const {
  getMyPhoto,
  uploadMyPhoto,
  deleteMyPhoto,
} = require('../controllers/profilePhotoController');
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
 * Profile photo — one per user (unique index on userId), available to
 * every role. Re-uploading replaces the stored photo.
 */
router.get('/me/photo', requireAuth, getMyPhoto);
router.post('/me/photo', requireAuth, uploadMyPhoto);
router.delete('/me/photo', requireAuth, deleteMyPhoto);

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
