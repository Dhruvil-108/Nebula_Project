const { ROLES } = require('../config/roles');

/**
 * requireRole(...roles) — RBAC middleware factory.
 *
 * Usage (after requireAuth):
 *   router.get('/admin-only', requireAuth, requireRole('admin', 'super_admin'), handler)
 *
 * super_admin ALWAYS passes — they have owner-level bypass privileges.
 *
 * @param {...string} roles - One or more allowed role strings.
 * @returns {Function} Express middleware
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    // super_admin always bypasses role checks
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }

    next();
  };
};

module.exports = { requireRole };
