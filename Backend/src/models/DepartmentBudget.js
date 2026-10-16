const mongoose = require('mongoose');

const departmentBudgetSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
      index: true,
    },
    fiscalYear: {
      type: Number,
      required: [true, 'Fiscal year is required'],
      default: () => new Date().getFullYear(),
    },
    period: {
      type: String,
      enum: ['annual', 'q1', 'q2', 'q3', 'q4', 'monthly'],
      default: 'annual',
    },
    month: {
      type: Number, // 1-12 if period === 'monthly'
      default: null,
    },
    allocatedAmount: {
      type: Number,
      required: [true, 'Allocated budget amount is required'],
      min: [0, 'Allocated amount cannot be negative'],
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingAmount: {
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
    alertThresholdPercent: {
      type: Number,
      default: 80,
      min: 1,
      max: 100,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

departmentBudgetSchema.index(
  { organizationId: 1, departmentId: 1, fiscalYear: 1, period: 1, month: 1 },
  { unique: true }
);

module.exports = mongoose.model('DepartmentBudget', departmentBudgetSchema);
