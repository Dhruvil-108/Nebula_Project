const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Leave type name is required'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    annualQuota: {
      type: Number,
      default: 0,
      min: 0,
    },
    accrualFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', 'none'],
      default: 'monthly',
    },
    monthlyAccrualRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    carryForward: {
      type: Boolean,
      default: false,
    },
    maxCarryForward: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxEncashable: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    sandwichRuleEnabled: {
      type: Boolean,
      default: false,
    },
    priorNoticeDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxConsecutiveDays: {
      type: Number,
      default: 30,
      min: 1,
    },
    docRequiredAfterDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    color: {
      type: String,
      default: '#f97316',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

leaveTypeSchema.index({ organizationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('LeaveType', leaveTypeSchema);
