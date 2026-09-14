const mongoose = require('mongoose');
const { Permission } = require('../models/Permission');
const { ROLES } = require('../config/roles');

/**
 * requireModuleAccess(module, action) — module-level RBAC middleware factory.
 *
 * Reads the organization's customizable permission matrix (Permission model).
 * Falls back to the same defaults as permissionController.getDefaultActions
 * when no explicit row exists for (organizationId, role, module).
 *
 * super_admin ALWAYS passes — owner-level bypass, mirroring requireRole.
 *
 * Usage:
 *   router.get('/leads', requireAuth, requireModuleAccess('crm', 'view'), handler)
 *
 * @param {string} moduleName - e.g. 'crm', 'hrms'
 * @param {string} action - 'view' | 'create' | 'edit' | 'delete' | 'approve'
 * @returns {Function} Express middleware
 */
const requireModuleAccess = (moduleName, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated.' });
      }

      // super_admin always bypasses module checks
      if (req.user.role === ROLES.SUPER_ADMIN) {
        return next();
      }

      const orgId = req.organizationId;
      if (!orgId) {
        return res.status(401).json({ error: 'Organization context missing.' });
      }

      const permission = await Permission.findOne({
        organizationId: orgId,
        role: req.user.role,
        module: moduleName,
      }).lean();

      let enabled = false;
      let actions = [];

      if (permission) {
        enabled = Boolean(permission.enabled);
        actions = permission.actions || [];
      } else {
        // Mirror permissionController.getDefaultActions for un-stored defaults.
        // Kept in sync intentionally — this file must not import the controller
        // (which imports User) to avoid a circular dependency.
        const role = req.user.role;
        if (role === ROLES.ADMIN) {
          enabled = true;
          actions = ['view', 'create', 'edit', 'delete', 'approve'];
        } else if (role === ROLES.MANAGER) {
          const isCore = ['crm', 'hrms', 'recruitment', 'expenses', 'inventory', 'analytics'].includes(moduleName);
          enabled = isCore;
          actions = isCore ? ['view', 'create', 'edit', 'approve'] : [];
        } else if (role === ROLES.HR) {
          enabled = moduleName === 'hrms' || moduleName === 'recruitment';
          actions = enabled ? ['view', 'create', 'edit', 'approve'] : [];
        } else if (role === ROLES.RECRUITER) {
          enabled = moduleName === 'recruitment';
          actions = enabled ? ['view', 'create', 'edit'] : [];
        } else if (role === ROLES.SALES) {
          enabled = moduleName === 'crm';
          actions = enabled ? ['view', 'create', 'edit'] : [];
        } else if (role === ROLES.FINANCE) {
          enabled = moduleName === 'expenses';
          actions = enabled ? ['view', 'create', 'edit', 'delete', 'approve'] : [];
        } else if (role === ROLES.INVENTORY_MANAGER) {
          enabled = moduleName === 'inventory';
          actions = enabled ? ['view', 'create', 'edit', 'approve'] : [];
        } else if (role === ROLES.EMPLOYEE || role === ROLES.INTERN) {
          enabled = moduleName === 'hrms' || moduleName === 'expenses';
          actions = enabled ? (moduleName === 'hrms' ? ['view'] : ['view', 'create']) : [];
        }
      }

      if (!enabled || !actions.includes(action)) {
        return res.status(403).json({
          error: `Access denied. Your role (${req.user.role}) does not have "${action}" permission on the ${moduleName} module.`,
        });
      }

      next();
    } catch (err) {
      console.error('[requireModuleAccess] Unexpected error:', err);
      res.status(500).json({ error: 'Permission check failed.' });
    }
  };
};

module.exports = { requireModuleAccess };
