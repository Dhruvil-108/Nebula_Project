const mongoose = require('mongoose');

const RULE_TYPES = [
  'per_item_limit',       // Single expense item cannot exceed $X
  'daily_limit',          // Total daily spend cannot exceed $X
  'monthly_limit',        // Total monthly spend cannot exceed $X
  'receipt_required',     // Receipt is strictly required if amount >= $X
  'merchant_restriction', // Restricted or blacklisted merchant
  'weekend_spend',        // Flag Saturday/Sunday transactions
];

const SEVERITY_LEVELS = [
  'info',  // Informational advisory (does not block)
  'warn',  // Warning that requires justification text from the employee
  'block', // Hard stop; blocks claim submission completely
];

const expensePolicySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Policy name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    scope: {
      categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExpenseCategory',
        default: null, // null applies to all categories
      },
      departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        default: null, // null applies to all departments
      },
      employmentType: {
        type: String,
        enum: ['all', 'full_time', 'contract', 'intern'],
        default: 'all',
      },
    },
    ruleType: {
      type: String,
      enum: RULE_TYPES,
      required: [true, 'ruleType is required'],
    },
    limitAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    merchantList: {
      type: [String],
      default: [],
    },
    isWhitelist: {
      type: Boolean,
      default: false, // false = blacklist (restricted), true = whitelist
    },
    severity: {
      type: String,
      enum: SEVERITY_LEVELS,
      default: 'warn',
    },
    requiresJustification: {
      type: Boolean,
      default: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

expensePolicySchema.index({ organizationId: 1, active: 1, ruleType: 1 });

module.exports = mongoose.model('ExpensePolicy', expensePolicySchema);
