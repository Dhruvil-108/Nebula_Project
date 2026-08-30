/**
 * Multi-tenancy backbone for all Nebula modules.
 *
 * Every database query in the platform (CRM, HRMS, Expenses, etc.)
 * MUST use this helper to merge the organizationId scope.
 * This guarantees no cross-organization data leakage.
 *
 * Usage in a controller (after requireAuth):
 *
 *   const filter = scopedFilter(req, { status: 'active' });
 *   const leads = await Lead.find(filter);
 *
 * @param {import('express').Request} req - Express request (must have req.organizationId set by requireAuth)
 * @param {object} [extraFilter={}] - Additional Mongoose query conditions to merge in.
 * @returns {object} Mongoose filter with organizationId always included.
 */
const scopedFilter = (req, extraFilter = {}) => {
  if (!req.organizationId) {
    throw new Error('[scopedFilter] req.organizationId is not set. Ensure requireAuth runs first.');
  }
  return {
    organizationId: req.organizationId,
    ...extraFilter,
  };
};

module.exports = { scopedFilter };
