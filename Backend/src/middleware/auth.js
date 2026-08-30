const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * requireAuth middleware
 *
 * Validates the Bearer access token in Authorization header.
 * On success: attaches req.user and req.organizationId.
 * On failure: returns 401 with a descriptive error.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No access token provided.' });
    }

    const token = authHeader.slice(7); // Remove "Bearer "

    // 1. Verify the JWT signature and expiry
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Access token expired. Please refresh.' });
      }
      return res.status(401).json({ error: 'Invalid access token.' });
    }

    // 2. Load the live user record (catches disabled/deleted accounts)
    const user = await User.findById(decoded.sub).lean();
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    // 3. Reject if the user account is not active
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Your account has been disabled. Contact your administrator.' });
    }

    // 4. Verify the token's org claim matches the user's current organization
    //    (guards against stale tokens after org transfers, which shouldn't happen but are defended anyway)
    if (decoded.orgId !== user.organizationId.toString()) {
      return res.status(401).json({ error: 'Token organization mismatch.' });
    }

    // 5. Attach to request for downstream middleware and controllers
    req.user = user;
    req.organizationId = user.organizationId;

    next();
  } catch (err) {
    console.error('[requireAuth] Unexpected error:', err);
    res.status(500).json({ error: 'Authentication check failed.' });
  }
};

module.exports = { requireAuth };
