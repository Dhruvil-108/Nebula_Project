const mongoose = require('mongoose');

const VALID_ROLES = [
  'admin',
  'manager',
  'hr',
  'recruiter',
  'sales',
  'finance',
  'inventory_manager',
  'employee',
  'intern',
];

const VALID_MODULES = [
  'crm',
  'hrms',
  'recruitment',
  'expenses',
  'inventory',
  'analytics',
  'settings',
];

const VALID_ACTIONS = ['view', 'create', 'edit', 'delete', 'approve'];

const permissionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    role: {
      type: String,
      enum: VALID_ROLES,
      required: [true, 'Role is required'],
    },
    module: {
      type: String,
      enum: VALID_MODULES,
      required: [true, 'Module is required'],
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    actions: {
      type: [String],
      enum: VALID_ACTIONS,
      default: ['view'],
    },
  },
  { timestamps: true }
);

// Ensure one entry per (organizationId, role, module)
permissionSchema.index({ organizationId: 1, role: 1, module: 1 }, { unique: true });

module.exports = {
  Permission: mongoose.model('Permission', permissionSchema),
  VALID_ROLES,
  VALID_MODULES,
  VALID_ACTIONS,
};
