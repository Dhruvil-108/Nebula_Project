const { Permission, VALID_ROLES, VALID_MODULES, VALID_ACTIONS } = require('../models/Permission');

/**
 * Returns default baseline permissions for any (role, module) pair
 * if not explicitly stored in the database.
 */
function getDefaultActions(role, module) {
  if (role === 'admin') {
    return { enabled: true, actions: ['view', 'create', 'edit', 'delete', 'approve'] };
  }

  if (role === 'manager') {
    const isCore = ['crm', 'hrms', 'recruitment', 'expenses', 'inventory', 'analytics'].includes(module);
    return {
      enabled: isCore,
      actions: isCore ? ['view', 'create', 'edit', 'approve'] : [],
    };
  }

  if (role === 'hr') {
    if (module === 'hrms' || module === 'recruitment') {
      return { enabled: true, actions: ['view', 'create', 'edit', 'approve'] };
    }
    return { enabled: false, actions: [] };
  }

  if (role === 'recruiter') {
    if (module === 'recruitment') {
      return { enabled: true, actions: ['view', 'create', 'edit'] };
    }
    return { enabled: false, actions: [] };
  }

  if (role === 'sales') {
    if (module === 'crm') {
      return { enabled: true, actions: ['view', 'create', 'edit'] };
    }
    if (module === 'analytics') {
      return { enabled: true, actions: ['view'] };
    }
    return { enabled: false, actions: [] };
  }

  if (role === 'finance') {
    if (module === 'expenses') {
      return { enabled: true, actions: ['view', 'create', 'edit', 'delete', 'approve'] };
    }
    if (module === 'analytics') {
      return { enabled: true, actions: ['view'] };
    }
    return { enabled: false, actions: [] };
  }

  if (role === 'inventory_manager') {
    if (module === 'inventory') {
      return { enabled: true, actions: ['view', 'create', 'edit', 'approve'] };
    }
    return { enabled: false, actions: [] };
  }

  if (role === 'employee' || role === 'intern') {
    if (module === 'hrms') {
      return { enabled: true, actions: ['view'] };
    }
    if (module === 'expenses') {
      return { enabled: true, actions: ['view', 'create'] };
    }
    return { enabled: false, actions: [] };
  }

  return { enabled: false, actions: [] };
}

const User = require('../models/User');

/**
 * GET /api/v1/permissions/catalog
 * Retrieves the catalog of modules, actions, and roles available in the organization.
 */
const getCatalog = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const userRoles = await User.distinct('role', {
      organizationId: orgId,
      status: { $ne: 'disabled' },
    });

    // Roles that currently have active user accounts in the organization
    const activeRoles = VALID_ROLES.filter((role) => userRoles.includes(role));

    // Return all configurable roles so Super Admin can pre-configure any role anytime
    const includeAll = req.query.all !== 'false';
    const roles = includeAll ? VALID_ROLES : (activeRoles.length > 0 ? activeRoles : VALID_ROLES);

    return res.json({
      modules: VALID_MODULES,
      actions: VALID_ACTIONS,
      roles,
      activeRoles,
    });
  } catch (err) {
    console.error('[getCatalog Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve permissions catalog.' });
  }
};

/**
 * GET /api/v1/permissions
 * Retrieves the organization's current permission matrix for roles with available accounts.
 */
const getPermissions = async (req, res) => {
  try {
    const orgId = req.organizationId;

    const userRoles = await User.distinct('role', {
      organizationId: orgId,
      status: { $ne: 'disabled' },
    });
    const activeRoles = VALID_ROLES.filter((role) => userRoles.includes(role));

    const includeAll = req.query.all !== 'false';
    const targetRoles = includeAll ? VALID_ROLES : (activeRoles.length > 0 ? activeRoles : VALID_ROLES);

    const existing = await Permission.find({
      organizationId: orgId,
      role: { $in: targetRoles },
    }).lean();

    const existingMap = new Map();
    existing.forEach((p) => {
      existingMap.set(`${p.role}:${p.module}`, p);
    });

    const matrix = [];

    for (const role of targetRoles) {
      for (const module of VALID_MODULES) {
        const key = `${role}:${module}`;
        if (existingMap.has(key)) {
          const item = existingMap.get(key);
          matrix.push({
            role: item.role,
            module: item.module,
            enabled: item.enabled,
            actions: item.actions || [],
          });
        } else {
          const def = getDefaultActions(role, module);
          matrix.push({
            role,
            module,
            enabled: def.enabled,
            actions: def.actions,
          });
        }
      }
    }

    return res.json({ matrix, activeRoles });
  } catch (err) {
    console.error('[getPermissions Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve permissions matrix.' });
  }
};

/**
 * PUT /api/v1/permissions
 * Bulk updates modified permission cells for the organization.
 */
const updatePermissions = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'No permission updates provided.' });
    }

    const bulkOps = [];
    const validUpdates = [];

    for (const item of updates) {
      const { role, module, enabled, actions } = item;

      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: `Invalid role: ${role}` });
      }
      if (!VALID_MODULES.includes(module)) {
        return res.status(400).json({ error: `Invalid module: ${module}` });
      }

      const filteredActions = Array.isArray(actions)
        ? actions.filter((a) => VALID_ACTIONS.includes(a))
        : [];

      bulkOps.push({
        updateOne: {
          filter: { organizationId: orgId, role, module },
          update: {
            $set: {
              organizationId: orgId,
              role,
              module,
              enabled: Boolean(enabled),
              actions: filteredActions,
            },
          },
          upsert: true,
        },
      });

      validUpdates.push({
        role,
        module,
        enabled: Boolean(enabled),
        actions: filteredActions,
      });
    }

    if (bulkOps.length > 0) {
      await Permission.bulkWrite(bulkOps);
    }

    return res.status(200).json({
      message: 'Permissions saved successfully.',
      updates: validUpdates,
    });
  } catch (err) {
    console.error('[updatePermissions Error]', err);
    return res.status(500).json({ error: err.message || 'Failed to update permissions.' });
  }
};

module.exports = {
  getCatalog,
  getPermissions,
  updatePermissions,
};
