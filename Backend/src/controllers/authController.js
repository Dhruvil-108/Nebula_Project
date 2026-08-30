const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const Organization = require('../models/Organization');
const User = require('../models/User');
const Invite = require('../models/Invite');

const { hashPassword, comparePassword } = require('../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { createAuditLog } = require('../utils/audit');
const { ROLES, INVITABLE_ROLES } = require('../config/roles');

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

/**
 * Validates the signup request body.
 * Returns an array of error strings (empty = valid).
 */
const validateSignupBody = (body) => {
  const errors = [];
  const { fullName, email, password, organizationName, invites } = body;

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.push('Full name is required (min 2 characters).');
  }
  if (!email || !validator.isEmail(String(email))) {
    errors.push('A valid email address is required.');
  }
  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters.');
  } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one letter and one number.');
  }
  if (!organizationName || typeof organizationName !== 'string' || organizationName.trim().length < 2) {
    errors.push('Organization name is required (min 2 characters).');
  }

  // Validate invites if provided
  if (invites && Array.isArray(invites)) {
    for (let i = 0; i < invites.length; i++) {
      const inv = invites[i];
      if (!inv.email || !validator.isEmail(String(inv.email))) {
        errors.push(`Invite #${i + 1}: invalid email.`);
      }
      if (!inv.role || !INVITABLE_ROLES.includes(inv.role)) {
        errors.push(`Invite #${i + 1}: invalid role "${inv.role}". Must be one of: ${INVITABLE_ROLES.join(', ')}.`);
      }
    }
  }

  return errors;
};

/**
 * Formats the user + organization response shape used across signup, login, and refresh.
 */
const buildAuthResponse = (accessToken, refreshToken, user, organization, extra = {}) => ({
  accessToken,
  refreshToken,
  user: {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  },
  organization: {
    id: organization._id.toString(),
    name: organization.name,
    primaryFocus: organization.primaryFocus,
  },
  ...extra,
});

/**
 * Issues a new access + refresh token pair and saves the refresh token hash to the user record.
 */
const issueTokenPair = async (user) => {
  const accessToken = signAccessToken({
    userId: user._id.toString(),
    orgId: user.organizationId.toString(),
    role: user.role,
  });
  const refreshToken = signRefreshToken({ userId: user._id.toString() });
  const refreshTokenHash = await hashPassword(refreshToken);

  await User.findByIdAndUpdate(user._id, {
    refreshTokenHash,
    lastLoginAt: new Date(),
  });

  return { accessToken, refreshToken };
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/signup
// ─────────────────────────────────────────────────────────

/**
 * Performs signup logic with optional transaction support.
 * On standalone MongoDB (no replica set), transactions are not supported —
 * we fall back to sequential operations with manual cleanup on error.
 */
const signupWithCleanup = async (req) => {
  const {
    fullName,
    email,
    password,
    organizationName,
    companySize = null,
    industry = null,
    primaryFocus = ['all'],
    invites = [],
  } = req.body;

  const normalizedEmail = email.toLowerCase().trim();
  const validInvites = Array.isArray(invites)
    ? invites.filter((i) => i && i.email && i.email.trim())
    : [];

  // 1. Global email uniqueness check
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const err = new Error('An account with this email already exists. Please sign in instead.');
    err.status = 409;
    throw err;
  }

  // 2. Create the Organization
  const org = await Organization.create({
    name: organizationName.trim(),
    companySize,
    industry: industry ? industry.trim() : null,
    primaryFocus: Array.isArray(primaryFocus) ? primaryFocus : ['all'],
    isActive: true,
  });

  let user;
  try {
    // 3. Hash the password
    const passwordHash = await hashPassword(password);

    // 4. Create the Super Admin user
    user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: ROLES.SUPER_ADMIN,
      organizationId: org._id,
      status: 'active',
    });

    // 5. Update the org's createdBy reference
    org.createdBy = user._id;
    await org.save();

    // 6. Create Invite records for each teammate
    let invitesSent = 0;
    if (validInvites.length > 0) {
      const inviteRecords = validInvites.map((inv) => ({
        email: inv.email.toLowerCase().trim(),
        role: inv.role,
        organizationId: org._id,
        invitedBy: user._id,
        token: require('crypto').randomBytes(32).toString('hex'),
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }));
      await Invite.insertMany(inviteRecords);
      invitesSent = inviteRecords.length;
    }

    return { org, user, invitesSent };
  } catch (err) {
    // Manual rollback: clean up org and user if anything failed mid-way
    if (user?._id) await User.findByIdAndDelete(user._id).catch(() => {});
    await Organization.findByIdAndDelete(org._id).catch(() => {});
    throw err;
  }
};

const signup = async (req, res) => {
  const errors = validateSignupBody(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  // Try with MongoDB session/transaction first (replica set), fall back to
  // manual cleanup approach for standalone MongoDB instances.
  let result;
  let session = null;

  try {
    session = await mongoose.startSession();
    // Attempt replica-set transaction (preferred — truly atomic)
    session.startTransaction();

    const normalizedEmail = req.body.email.toLowerCase().trim();
    const validInvites = Array.isArray(req.body.invites)
      ? req.body.invites.filter((i) => i && i.email && i.email.trim())
      : [];

    const existingUser = await User.findOne({ email: normalizedEmail }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        error: 'An account with this email already exists. Please sign in instead.',
      });
    }

    const [org] = await Organization.create(
      [{
        name: req.body.organizationName.trim(),
        companySize: req.body.companySize || null,
        industry: req.body.industry ? req.body.industry.trim() : null,
        primaryFocus: Array.isArray(req.body.primaryFocus) ? req.body.primaryFocus : ['all'],
        isActive: true,
      }],
      { session }
    );

    const passwordHash = await hashPassword(req.body.password);

    const [user] = await User.create(
      [{
        fullName: req.body.fullName.trim(),
        email: normalizedEmail,
        passwordHash,
        role: ROLES.SUPER_ADMIN,
        organizationId: org._id,
        status: 'active',
      }],
      { session }
    );

    await Organization.findByIdAndUpdate(org._id, { createdBy: user._id }, { session });

    let invitesSent = 0;
    if (validInvites.length > 0) {
      const inviteRecords = validInvites.map((inv) => ({
        email: inv.email.toLowerCase().trim(),
        role: inv.role,
        organizationId: org._id,
        invitedBy: user._id,
        token: crypto.randomBytes(32).toString('hex'),
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }));
      await Invite.insertMany(inviteRecords, { session });
      invitesSent = inviteRecords.length;
    }

    await session.commitTransaction();
    session.endSession();

    result = { org, user, invitesSent };
  } catch (txErr) {
    // Abort whatever session state we're in if session exists
    if (session) {
      try { await session.abortTransaction(); } catch (_) {}
      try { session.endSession(); } catch (_) {}
    }

    // If the error is "transactions not supported" (standalone MongoDB),
    // fall back to sequential operations with manual cleanup
    const isNotReplicaSet =
      txErr.codeName === 'IllegalOperation' ||
      txErr.message?.includes('Transaction numbers') ||
      txErr.message?.includes('replica set') ||
      txErr.message?.includes('not supported') ||
      txErr.message?.includes('standalone');

    if (isNotReplicaSet) {
      console.warn('[signup] Transactions not supported — falling back to non-transactional mode');
      try {
        result = await signupWithCleanup(req);
      } catch (fallbackErr) {
        console.error('[signup] Fallback error:', fallbackErr);
        if (fallbackErr.status === 409) {
          return res.status(409).json({ error: fallbackErr.message });
        }
        if (fallbackErr.code === 11000) {
          return res.status(409).json({ error: 'An account with this email already exists.' });
        }
        return res.status(500).json({ error: fallbackErr.message || 'Signup failed. Please try again.' });
      }
    } else {
      // Some other DB error during the transaction
      console.error('[signup] Transaction error:', txErr);
      if (txErr.status === 409) {
        return res.status(409).json({ error: txErr.message });
      }
      if (txErr.code === 11000) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
      return res.status(500).json({ error: txErr.message || 'Signup failed. Please try again.' });
    }
  }

  // ── Common post-signup: issue tokens + audit log ──
  const { org, user, invitesSent } = result;
  const { accessToken, refreshToken } = await issueTokenPair(user);

  createAuditLog({
    organizationId: org._id.toString(),
    actor: user._id.toString(),
    action: 'signup',
    entity: 'Organization',
    entityId: org._id.toString(),
    metadata: {
      companySize: req.body.companySize,
      industry: req.body.industry,
      primaryFocus: req.body.primaryFocus,
      invitesSent,
    },
    ip: req.ip,
  });

  return res.status(201).json(
    buildAuthResponse(accessToken, refreshToken, user, org, { invitesSent })
  );
};


// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (!validator.isEmail(String(email))) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email (globally unique in our current login UX)
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Generic message — don't reveal if email exists
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check account status before verifying password (prevents timing side-channel)
    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'Your account has been disabled. Contact your administrator.' });
    }

    // Verify password
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Load the organization for the response
    const org = await Organization.findById(user.organizationId).lean();
    if (!org || !org.isActive) {
      return res.status(403).json({ error: 'Your organization is inactive. Contact support.' });
    }

    // Issue tokens
    const { accessToken, refreshToken } = await issueTokenPair(user);

    // Fire-and-forget audit
    createAuditLog({
      organizationId: user.organizationId.toString(),
      actor: user._id.toString(),
      action: 'login',
      entity: 'User',
      entityId: user._id.toString(),
      metadata: { userAgent: req.headers['user-agent'] },
      ip: req.ip,
    });

    return res.status(200).json(buildAuthResponse(accessToken, refreshToken, user, org));
  } catch (err) {
    console.error('[login] Error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/refresh
// ─────────────────────────────────────────────────────────
const refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required.' });
  }

  try {
    // 1. Verify JWT signature and expiry
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Refresh token expired. Please sign in again.' });
      }
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    // 2. Load user
    const user = await User.findById(decoded.sub);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'User not found or inactive.' });
    }

    // 3. Compare the incoming token against the stored hash
    //    This defends against refresh token theft and replay.
    //    If the hashes don't match, the stored token is immediately invalidated (session wipeout).
    if (!user.refreshTokenHash) {
      return res.status(401).json({ error: 'No active session found. Please sign in.' });
    }

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!tokenMatch) {
      // Possible token theft — invalidate the session entirely
      await User.findByIdAndUpdate(user._id, { refreshTokenHash: null });
      return res.status(401).json({ error: 'Refresh token mismatch. Session invalidated for security.' });
    }

    // 4. Load organization
    const org = await Organization.findById(user.organizationId).lean();

    // 5. Issue a brand new token pair (rotation)
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await issueTokenPair(user);

    return res.status(200).json(buildAuthResponse(newAccessToken, newRefreshToken, user, org));
  } catch (err) {
    console.error('[refresh] Error:', err);
    return res.status(500).json({ error: 'Token refresh failed.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/logout
// ─────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    // req.user is set by requireAuth middleware
    await User.findByIdAndUpdate(req.user._id, { refreshTokenHash: null });

    createAuditLog({
      organizationId: req.organizationId.toString(),
      actor: req.user._id.toString(),
      action: 'logout',
      entity: 'User',
      entityId: req.user._id.toString(),
      ip: req.ip,
    });

    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('[logout] Error:', err);
    return res.status(500).json({ error: 'Logout failed.' });
  }
};

module.exports = { signup, login, refresh, logout };
