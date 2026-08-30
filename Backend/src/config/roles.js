/**
 * RBAC Role constants for Nebula.
 * These are the only valid role values across the platform.
 */

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  HR: 'hr',
  RECRUITER: 'recruiter',
  SALES: 'sales',
  FINANCE: 'finance',
  INVENTORY_MANAGER: 'inventory_manager',
  EMPLOYEE: 'employee',
};

/** All valid role strings as an array (for Mongoose enum). */
const ALL_ROLES = Object.values(ROLES);

/**
 * Roles that can be assigned via invite (everyone except super_admin).
 * super_admin is exclusively assigned to the organization creator.
 */
const INVITABLE_ROLES = ALL_ROLES.filter((r) => r !== ROLES.SUPER_ADMIN);

module.exports = { ROLES, ALL_ROLES, INVITABLE_ROLES };
