const Organization = require('../models/Organization');

// ─────────────────────────────────────────────────────────
// GET /api/v1/users/me
// ─────────────────────────────────────────────────────────

/**
 * Returns the current authenticated user and their organization.
 * req.user is set by the requireAuth middleware.
 */
const getMe = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.organizationId).lean();

    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    return res.status(200).json({
      user: {
        id: req.user._id.toString(),
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
      },
      organization: {
        id: org._id.toString(),
        name: org.name,
        primaryFocus: org.primaryFocus,
      },
    });
  } catch (err) {
    console.error('[getMe] Error:', err);
    return res.status(500).json({ error: 'Failed to load user profile.' });
  }
};

module.exports = { getMe };
